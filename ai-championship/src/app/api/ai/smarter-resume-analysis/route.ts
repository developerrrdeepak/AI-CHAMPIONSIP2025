import { NextRequest, NextResponse } from 'next/server';
import { smarterResumeAnalysis } from '@/ai/flows/ai-smarter-resume-analysis';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resumeText } = body;

    if (!resumeText || typeof resumeText !== 'string') {
      return NextResponse.json(
        { error: 'Missing required field: resumeText' },
        { status: 400 }
      );
    }

    const analysisResult = await smarterResumeAnalysis(resumeText);

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
