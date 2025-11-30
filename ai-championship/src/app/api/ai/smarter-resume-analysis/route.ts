import { NextRequest, NextResponse } from 'next/server';
import { smarterResumeAnalysisFlow } from '@/ai/flows/ai-smarter-resume-analysis';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resumePath } = body;

    if (!resumePath) {
      return NextResponse.json(
        { error: 'Missing required field: resumePath' },
        { status: 400 }
      );
    }

    const analysisResult = await smarterResumeAnalysisFlow.run({
      input: { resumePath },
    });

    return NextResponse.json({
      success: true,
      data: analysisResult,
      message: 'Resume analysis completed successfully',
    });
  } catch (error) {
    console.error('Error in resume analysis endpoint:', error);
    return NextResponse.json(
      {
        error: 'Failed to process resume analysis',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
