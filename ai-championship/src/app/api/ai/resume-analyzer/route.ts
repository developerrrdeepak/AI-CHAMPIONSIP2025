import { NextRequest, NextResponse } from 'next/server';
import { smartInferenceInvoke } from '@/lib/raindropClient';

export async function POST(request: NextRequest) {
  try {
    const { resumeText } = await request.json();

    if (!resumeText) {
      return NextResponse.json(
        { error: 'Resume text is required' },
        { status: 400 }
      );
    }

    const prompt = `Analyze this resume and provide a detailed analysis in JSON format:

Resume:
${resumeText}

Return ONLY valid JSON with this exact structure:
{
  "summary": "2-line professional summary",
  "atsScore": 85,
  "skills": ["skill1", "skill2"],
  "missingSkills": ["skill1", "skill2"],
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1", "improvement2"],
  "redFlags": ["flag1", "flag2"],
  "rewrittenSections": {
    "summary": "improved summary",
    "experience": "improved experience section",
    "skills": "improved skills section"
  }
}`;

    const result = await smartInferenceInvoke('gemini-2.0-flash-exp', prompt) as any;
    const text = typeof result === 'string' ? result : JSON.stringify(result);
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid AI response format');
    }

    const analysis = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      success: true,
      analysis
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Resume analysis error:', {
      message: errorMessage,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      { error: 'Failed to analyze resume', details: errorMessage },
      { status: 500 }
    );
  }
}
