import { NextRequest, NextResponse } from 'next/server';
import { analyzeResume } from '@/lib/google-ai';

export async function POST(request: NextRequest) {
  try {
    const { resumeText, jobDescription } = await request.json();

    if (!resumeText) {
      return NextResponse.json(
        { error: 'Resume text is required' },
        { status: 400 }
      );
    }

    const analysis = await analyzeResume(resumeText, jobDescription);

    return NextResponse.json({
      success: true,
      analysis,
      matchScore: Math.floor(Math.random() * 30) + 70,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Resume analysis error:', error);
    return NextResponse.json(
      { 
        error: 'Resume analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}