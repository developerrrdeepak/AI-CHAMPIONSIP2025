
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const response = new NextResponse(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

    // Clear the session cookie
    response.cookies.set({
      name: 'session',
      value: '',
      httpOnly: true,
      maxAge: -1,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Logout error:', {
      message: error?.message || 'Unknown error',
      stack: error?.stack,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { success: false, error: 'Failed to logout', details: error?.message },
      { status: 500 }
    );
  }
}
