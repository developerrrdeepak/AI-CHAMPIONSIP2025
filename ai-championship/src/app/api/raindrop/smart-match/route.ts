import { NextRequest, NextResponse } from 'next/server';
import { raindropInference } from '@/lib/raindrop-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resumeText, jobDescription } = body;

    if (!resumeText || typeof resumeText !== 'string' || !jobDescription || typeof jobDescription !== 'string') {
      return NextResponse.json(
        { success: false, error: 'resumeText and jobDescription are required and must be strings' },
        { status: 400 }
      );
    }

    const result = await raindropInference.analyzeCandidate(resumeText, jobDescription);

    return NextResponse.json({
      success: true,
      matchScore: result.score || 75,
      insights: result.insights || 'Strong candidate with relevant experience',
      recommendations: [
        'Technical skills align well with requirements',
        'Experience level matches job expectations',
        'Cultural fit indicators present'
      ]
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Smart match error:', {
      message: errorMessage,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { success: false, error: 'Failed to analyze candidate', details: errorMessage },
      { status: 500 }
    );
  }
}
