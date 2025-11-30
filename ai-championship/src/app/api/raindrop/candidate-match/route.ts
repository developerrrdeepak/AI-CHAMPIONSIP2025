import { NextRequest, NextResponse } from 'next/server';
import { aiRaindropCandidateMatcher } from '@/ai/flows/ai-raindrop-candidate-matcher';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobDescription, candidateProfile, preferences } = body;

    if (!jobDescription || !candidateProfile) {
      return NextResponse.json(
        { error: 'Missing required fields: jobDescription, candidateProfile' },
        { status: 400 }
      );
    }

    const matchResult = await aiRaindropCandidateMatcher({
      jobDescription,
      candidateProfile,
      preferences,
    });

    return NextResponse.json({
      success: true,
      data: matchResult,
      message: 'Candidate matching completed successfully',
    });
  } catch (error) {
    console.error('Error in candidate match endpoint:', error);
    return NextResponse.json(
      {
        error: 'Failed to process candidate matching',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}