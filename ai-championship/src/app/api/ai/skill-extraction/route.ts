import { NextRequest, NextResponse } from 'next/server';
import { extractSkillsFromJD } from '@/lib/gemini-ai';

export async function POST(request: NextRequest) {
  try {
    const { jobDescription } = await request.json();

    const skills = await extractSkillsFromJD(jobDescription);

    if (!skills || skills.length === 0) {
      const commonSkills = jobDescription.match(/\b(React|TypeScript|Node\.js|Python|Java|AWS|Docker|Kubernetes|JavaScript|Vue|Angular|MongoDB|PostgreSQL|GraphQL|Go|Rust|SQL|Git|CI\/CD|Agile|Scrum)\b/gi) || [];
      const uniqueSkills = [...new Set(commonSkills.map(s => s.toLowerCase()))];
      
      return NextResponse.json({ success: true, skills: uniqueSkills, source: 'regex' });
    }

    return NextResponse.json({ success: true, skills, source: 'ai' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to extract skills' }, { status: 500 });
  }
}
