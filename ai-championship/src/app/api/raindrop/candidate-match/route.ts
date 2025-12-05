import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.GOOGLE_GEMINI_API_KEY;

if (!API_KEY) {
  console.error('GOOGLE_GEMINI_API_KEY is not set.');
}

const genAI = new GoogleGenerativeAI(API_KEY || '');

export async function POST(request: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json(
      { success: false, error: 'Server configuration error: Google Gemini API key is missing.' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { question, answer, context } = body;

    if (typeof question !== 'string' || question.trim() === '' || typeof answer !== 'string' || answer.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Question and answer are required and must be non-empty strings' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `You are an expert interviewer providing constructive feedback to a candidate.
Analyze the candidate's answer to a given question.
Provide structured feedback with two sections: "✅ Strengths" and "💡 Suggestions".
Focus on clarity, relevance, specificity, and communication skills.
Keep the feedback concise and actionable.

Here is the information:
Question: "${question}"
Candidate's Answer: "${answer}"
${context ? `Additional Context: "${context}"` : ''}

Example Feedback Format:
Great answer! Here's some feedback:

✅ Strengths:
• Clear communication
• Relevant experience mentioned
• Good structure

💡 Suggestions:
• Add specific metrics or numbers
• Include more concrete examples
• Emphasize your unique value proposition`;

    const { response } = await model.generateContent(prompt);
    const aiFeedback = response.text();

    return NextResponse.json({
      success: true,
      data: aiFeedback
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Candidate match error (AI generation failed):', {
      message: errorMessage,
      timestamp: new Date().toISOString(),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { success: false, error: 'Failed to analyze answer with AI', details: errorMessage },
      { status: 500 }
    );
  }
}