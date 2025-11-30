import { NextRequest, NextResponse } from 'next/server';
import { generateAIResponse } from '@/lib/google-ai';

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const response = await generateAIResponse(message, context);

    return NextResponse.json({
      success: true,
      response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Google AI API error:', error);
    return NextResponse.json(
      { 
        error: 'AI response failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}