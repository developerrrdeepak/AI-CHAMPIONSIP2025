import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, answer, context } = body;

    if (!question || typeof question !== 'string' || !answer || typeof answer !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Question and answer are required and must be strings' },
        { status: 400 }
      );
    }

    // Mock AI feedback - integrate with Raindrop SmartInference later
    const feedback = `Great answer! Here's some feedback:

✅ Strengths:
• Clear communication
• Relevant experience mentioned
• Good structure

💡 Suggestions:
• Add specific metrics or numbers
• Include more concrete examples
• Emphasize your unique value proposition

Keep practicing!`;

    return NextResponse.json({
      success: true,
      data: feedback
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Candidate match error:', {
      message: errorMessage,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { success: false, error: 'Failed to analyze answer', details: errorMessage },
      { status: 500 }
    );
  }
}
