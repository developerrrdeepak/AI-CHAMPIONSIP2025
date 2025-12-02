import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { z } from 'zod';

// Initialize Firebase Admin with proper credentials
let adminInitialized = false;
try {
  if (!getApps().length && process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
    adminInitialized = true;
  } else if (getApps().length) {
    adminInitialized = true;
  }
} catch (error: any) {
  console.error('Firebase Admin initialization failed:', {
    message: error?.message || 'Unknown error',
    code: error?.code,
    timestamp: new Date().toISOString(),
  });
  adminInitialized = false;
}

// Input validation schema
const setClaimsSchema = z.object({
  uid: z.string().min(1, 'UID is required'),
  claims: z.record(z.any()).refine(
    (claims) => Object.keys(claims).length > 0,
    'Claims object cannot be empty'
  ),
});

// Rate limiting (implement with Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const maxRequests = 10;

  const current = rateLimitMap.get(ip);
  
  if (!current || now > current.resetTime) {
    if (rateLimitMap.size > 1000) {
      for (const [key, value] of rateLimitMap.entries()) {
        if (now > value.resetTime) rateLimitMap.delete(key);
      }
    }
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (current.count >= maxRequests) return false;

  current.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Check if Firebase Admin is initialized
    if (!adminInitialized) {
      return NextResponse.json(
        { error: 'Firebase Admin not configured' },
        { status: 503 }
      );
    }

    // Rate limiting
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Validate content type
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const validation = setClaimsSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    const { uid, claims } = validation.data;

    // Validate UID format (Firebase UID is typically 28 characters)
    if (uid.length < 10 || uid.length > 128) {
      return NextResponse.json(
        { error: 'Invalid UID format' },
        { status: 400 }
      );
    }

    // Sanitize claims to prevent injection
    const sanitizedClaims = Object.fromEntries(
      Object.entries(claims).map(([key, value]) => [
        key.replace(/[^a-zA-Z0-9_]/g, ''),
        typeof value === 'string' ? value.slice(0, 1000) : value,
      ])
    );

    const auth = getAuth();
    
    // Verify user exists before setting claims
    try {
      await auth.getUser(uid);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      console.error('User verification error:', {
        message: errorMessage,
        stack: errorStack,
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json(
        { error: 'User not found', details: errorMessage },
        { status: 404 }
      );
    }

    try {
      await auth.setCustomUserClaims(uid, sanitizedClaims);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to set custom claims:', {
        message: errorMessage,
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json(
        { error: 'Failed to set custom claims', details: errorMessage },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Custom claims set successfully' },
      { status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('Error setting custom claims:', {
      message: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  try {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('OPTIONS request error:', errorMessage);
    return new NextResponse(null, { status: 500 });
  }
}
