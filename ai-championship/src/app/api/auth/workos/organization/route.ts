
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, domains } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Name is required and must be a string' },
        { status: 400 }
      );
    }

    const WORKOS_API_KEY = process.env.WORKOS_API_KEY;

    if (!WORKOS_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'WorkOS not configured' },
        { status: 503 }
      );
    }

    const response = await fetch('https://api.workos.com/organizations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WORKOS_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, domains })
    });

    if (!response.ok) throw new Error('Failed to create organization');
    const data = await response.json();

    return NextResponse.json({ success: true, organization: data });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('WorkOS organization error:', {
      message: errorMessage,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
