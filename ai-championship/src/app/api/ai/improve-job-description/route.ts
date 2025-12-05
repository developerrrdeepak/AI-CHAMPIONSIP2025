import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.GOOGLE_GEMINI_API_KEY;

if (!API_KEY) {
  console.error('GOOGLE_GEMINI_API_KEY is not set.');
}

const genAI = new GoogleGenerativeAI(API_KEY || '');

export async function POST(request: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json(
      { error: 'Server configuration error: Google Gemini API key is missing.' },
      { status: 500 }
    );
  }

  try {
    const { jobDescription } = await request.json();

    if (typeof jobDescription !== 'string' || jobDescription.trim() === '') {
      return NextResponse.json(
        { error: 'Invalid request: "jobDescription" field is required and must be a non-empty string.' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `You are an expert recruitment consultant and an AI-powered job description optimizer.
Your task is to take a given job description and significantly improve it for the following criteria:
1.  **Clarity and Conciseness:** Remove jargon, simplify complex sentences, and ensure every point is easy to understand.
2.  **Attractiveness to Top Talent:** Highlight unique selling points of the role and company, focus on impact, growth opportunities, and a positive work environment.
3.  **Keyword Optimization:** Suggest and integrate relevant keywords that recruiters and job seekers might use in searches (without keyword stuffing).
4.  **Inclusivity and Bias Reduction:** Ensure the language is gender-neutral, avoids implicit bias, and appeals to a diverse range of candidates.
5.  **Structure and Readability:** Organize the description with clear headings (e.g., "About the Role", "What You'll Do", "What You'll Bring", "Why Join Us"), bullet points, and appropriate formatting.

Please provide the improved job description as a well-formatted Markdown string.

Original Job Description:
\`\`\`
${jobDescription}
\`\`\`

Improved Job Description (in Markdown):`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const improvedDescription = response.text();

    if (!improvedDescription) {
      return NextResponse.json(
        { error: 'AI did not return an improved job description.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, improvedDescription });
  } catch (error) {
    console.error('Error during job description improvement:', error);
    return NextResponse.json(
      { error: 'Failed to improve job description.', details: (error as Error).message },
      { status: 500 }
    );
  }
}