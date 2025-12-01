import { NextRequest, NextResponse } from 'next/server';
import { raindropInference } from '@/lib/raindrop-client';

export async function POST(request: NextRequest) {
  try {
    const { resumeText, jobDescription } = await request.json();

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
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to analyze candidate' },
      { status: 500 }
    );
  }
}
