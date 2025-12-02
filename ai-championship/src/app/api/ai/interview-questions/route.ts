import { NextRequest, NextResponse } from 'next/server';
import { generateInterviewQuestions } from '@/lib/gemini-ai';

export async function POST(request: NextRequest) {
  try {
    const { jobTitle, skills, experienceLevel } = await request.json();

    const questions = await generateInterviewQuestions(jobTitle, skills || [], experienceLevel || 'Mid');

    if (!questions) {
      const fallback = [
        `1. Tell me about your experience with ${skills?.[0] || 'the required technologies'}.`,
        `2. Describe a challenging project you worked on as a ${jobTitle}.`,
        `3. How do you stay updated with latest trends?`,
        `4. Walk me through your problem-solving approach.`,
        `5. What's your experience with ${skills?.[1] || 'team collaboration'}?`,
        `6. How do you handle tight deadlines?`,
        `7. Describe a time you learned a new technology quickly.`,
        `8. What are your salary expectations?`,
        `9. Where do you see yourself in 3-5 years?`,
        `10. Why are you interested in this position?`
      ].join('\n\n');

      return NextResponse.json({ success: true, questions: fallback, source: 'fallback' });
    }

    return NextResponse.json({ success: true, questions, source: 'ai' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate questions' }, { status: 500 });
  }
}
