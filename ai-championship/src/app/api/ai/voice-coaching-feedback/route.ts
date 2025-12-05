import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.GOOGLE_GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(API_KEY || '');

export async function POST(request: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json(
      { error: 'Server configuration error: Google Gemini API key is missing.' },
      { status: 500 }
    );
  }

  try {
    const { interviewQuestion, candidateAnswer } = await request.json();

    if (
      typeof interviewQuestion !== 'string' ||
      interviewQuestion.trim() === '' ||
      typeof candidateAnswer !== 'string' ||
      candidateAnswer.trim() === ''
    ) {
      return NextResponse.json(
        { error: 'Invalid request: "interviewQuestion" and "candidateAnswer" are required and must be non-empty strings.' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `You are an expert interview coach providing feedback to a candidate.
The interview question was: "${interviewQuestion}"
The candidate's answer was: "${candidateAnswer}"

Please provide concise, constructive, and actionable feedback on the candidate's answer.
Focus on:
- Strengths: What did they do well?
- Areas for improvement: Where could they enhance their answer (e.g., clarity, conciseness, relevance, providing specific examples)?
- Suggestions: How could they better phrase their answer or what content should they add or remove?

Provide the feedback as a single text string.`;

    const { response } = await model.generateContent(prompt);
    const feedbackText = response.text();

    return NextResponse.json({ success: true, feedback: feedbackText });
  } catch (error) {
    console.error('Error during AI-powered voice coaching feedback:', error);
    return NextResponse.json(
      { error: 'Failed to generate voice coaching feedback.', details: (error as Error).message },
      { status: 500 }
    );
  }
}