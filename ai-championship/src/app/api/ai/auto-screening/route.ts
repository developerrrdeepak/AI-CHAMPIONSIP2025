import { NextRequest, NextResponse } from 'next/server';
import { smartInferenceInvoke } from '@/lib/raindropClient';

export async function POST(request: NextRequest) {
  try {
    const { resumeText, jobDescription } = await request.json();

    if (!resumeText || !jobDescription) {
      return NextResponse.json(
        { error: 'Resume and job description are required' },
        { status: 400 }
      );
    }

    const prompt = `Compare resume with job description and provide screening analysis:

Resume:
${resumeText}

Job Description:
${jobDescription}

Return ONLY valid JSON:
{
  "fitScore": 85,
  "recommendation": "Strong Match",
  "skillsMatch": {
    "matched": ["React", "TypeScript"],
    "missing": ["AWS", "Docker"],
    "matchPercentage": 75
  },
  "experienceMatch": {
    "required": "3-5 years",
    "candidate": "4 years",
    "match": true
  },
  "strengths": ["Strong frontend skills", "Good communication"],
  "gaps": ["Lacks cloud experience", "No DevOps knowledge"],
  "redFlags": ["Job hopping", "Career gap"],
  "interviewQuestions": ["Tell me about your React experience", "How do you handle state management?"],
  "salaryExpectation": "$100k-$120k",
  "decision": "Shortlist for interview"
}`;

    const result = await smartInferenceInvoke('gemini-2.0-flash-exp', prompt) as any;
    const text = typeof result === 'string' ? result : JSON.stringify(result);
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid AI response');
    }

    const screening = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ success: true, screening });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Auto-screening error:', {
      message: errorMessage,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      { error: 'Failed to screen candidate', details: errorMessage },
      { status: 500 }
    );
  }
}
