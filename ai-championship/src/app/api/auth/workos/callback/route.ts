import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Code is required and must be a string' },
        { status: 400 }
      );
    }

    const WORKOS_API_KEY = process.env.WORKOS_API_KEY;
    const WORKOS_CLIENT_ID = process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID;

    if (!WORKOS_API_KEY || !WORKOS_CLIENT_ID) {
      return NextResponse.json(
        { success: false, error: 'WorkOS not configured' },
        { status: 503 }
      );
    }

    const response = await fetch('https://api.workos.com/sso/token', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WORKOS_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: WORKOS_CLIENT_ID,
        client_secret: WORKOS_API_KEY,
        code,
        grant_type: 'authorization_code'
      })
    });

    if (!response.ok) throw new Error('WorkOS token exchange failed');
    const data = await response.json();

    return NextResponse.json({
      success: true,
      accessToken: data.access_token,
      profile: data.profile
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('WorkOS callback error:', {
      message: errorMessage,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
