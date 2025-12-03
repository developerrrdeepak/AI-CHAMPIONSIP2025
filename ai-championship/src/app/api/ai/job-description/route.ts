import { NextRequest, NextResponse } from 'next/server';
import { smartInferenceInvoke } from '@/lib/raindropClient';

export async function POST(request: NextRequest) {
  try {
    const { role, skills, experience, location, companyType } = await request.json();

    const prompt = `Generate a professional job description:

Role: ${role}
Required Skills: ${skills?.join(', ')}
Experience Level: ${experience || 'Mid-level'}
Location: ${location || 'Remote'}
Company Type: ${companyType || 'Startup'}

Return ONLY valid JSON:
{
  "title": "Senior Frontend Engineer",
  "summary": "We are looking for...",
  "responsibilities": ["resp1", "resp2"],
  "requiredSkills": ["skill1", "skill2"],
  "preferredSkills": ["skill1", "skill2"],
  "qualifications": ["qual1", "qual2"],
  "benefits": ["benefit1", "benefit2"],
  "salaryRange": "$100k-$150k",
  "workMode": "Remote/Hybrid/Onsite",
  "cultureFit": "Fast-paced startup environment"
}`;

    const result = await smartInferenceInvoke('gemini-2.0-flash-exp', prompt) as any;
    const text = typeof result === 'string' ? result : JSON.stringify(result);
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid AI response');
    }

    const jobDescription = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ success: true, jobDescription });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Job description generation error:', {
      message: errorMessage,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      { error: 'Failed to generate job description', details: errorMessage },
      { status: 500 }
    );
  }
}
