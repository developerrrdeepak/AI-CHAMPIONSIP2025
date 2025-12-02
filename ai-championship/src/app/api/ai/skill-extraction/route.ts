import { NextRequest, NextResponse } from 'next/server';
import { extractSkillsFromJD } from '@/lib/gemini-ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobDescription } = body;

    if (!jobDescription || typeof jobDescription !== 'string') {
      return NextResponse.json(
        { success: false, error: 'jobDescription is required and must be a string' },
        { status: 400 }
      );
    }

    const skills = await extractSkillsFromJD(jobDescription);

    if (!skills || skills.length === 0) {
      const commonSkills = jobDescription.match(/\b(React|TypeScript|Node\.js|Python|Java|AWS|Docker|Kubernetes|JavaScript|Vue|Angular|MongoDB|PostgreSQL|GraphQL|Go|Rust|SQL|Git|CI\/CD|Agile|Scrum)\b/gi) || [];
      const uniqueSkills = [...new Set(commonSkills.map(s => s.toLowerCase()))];
      
      return NextResponse.json({ success: true, skills: uniqueSkills, source: 'regex' });
    }

    return NextResponse.json({ success: true, skills, source: 'ai' });
  } catch (error: any) {
    console.error('Skill extraction error:', {
      message: error?.message || 'Unknown error',
      stack: error?.stack,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { success: false, error: 'Failed to extract skills', details: error?.message },
      { status: 500 }
    );
  }
}
