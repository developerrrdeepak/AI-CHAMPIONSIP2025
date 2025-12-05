import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.GOOGLE_GEMINI_API_KEY;

export async function POST(req: NextRequest) {
  if (!API_KEY) {
    console.error('GOOGLE_GEMINI_API_KEY is not set.');
    return NextResponse.json(
      { error: 'Server configuration error: Google Gemini API key is missing.' },
      { status: 500 }
    );
  }

  try {
    const { jobDetails, candidateProfile } = await req.json();

    if (
      typeof jobDetails !== 'string' ||
      jobDetails.trim() === '' ||
      typeof candidateProfile !== 'string' ||
      candidateProfile.trim() === ''
    ) {
      return NextResponse.json(
        { error: 'Invalid request: "jobDetails" and "candidateProfile" fields are required and must be non-empty strings.' },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `You are an expert HR and recruitment consultant. Your goal is to provide actionable suggestions (nudges) to make a job offer more attractive and competitive for a specific candidate, based on the job details and the candidate's profile.

Job Details:
\`\`\`
${jobDetails}
\`\`\`

Candidate Profile (including expectations, skills, experience):
\`\`\`
${candidateProfile}
\`\`\`

Based on this information, generate concrete, actionable suggestions that could improve the offer for this candidate. Consider aspects like salary, benefits, career growth, work-life balance, company culture, learning opportunities, etc.

Provide your response in JSON format with the following structure:
{
  "suggestions": ["Suggestion 1", "Suggestion 2", ...],
  "summary": "A brief overall summary of the main points of your suggestions."
}
`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    let aiOutput: { suggestions: string[]; summary: string };
    try {
      aiOutput = JSON.parse(text);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('Raw AI response:', text);
      return NextResponse.json(
        { error: 'Failed to parse AI\'s structured response.', details: (parseError as Error).message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      suggestions: aiOutput.suggestions,
      summary: aiOutput.summary,
    });
  } catch (error) {
    console.error('Error during AI-powered offer nudge generation:', error);
    return NextResponse.json(
      { error: 'Failed to generate offer nudges.', details: (error as Error).message },
      { status: 500 }
    );
  }
}