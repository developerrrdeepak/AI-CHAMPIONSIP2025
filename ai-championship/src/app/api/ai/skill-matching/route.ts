// ai-championship/src/app/api/ai/skill-matching/route.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.GOOGLE_GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(API_KEY || ''); // Pass a default empty string if not set

export async function POST(request: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json(
      { success: false, error: 'Server configuration error: Google Gemini API key is missing.' },
      { status: 500 }
    );
  }

  try {
    const { candidateText, jobDescription } = await request.json();

    if (typeof candidateText !== 'string' || candidateText.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Invalid request: "candidateText" field is required and must be a non-empty string.' },
        { status: 400 }
      );
    }
    if (typeof jobDescription !== 'string' || jobDescription.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Invalid request: "jobDescription" field is required and must be a non-empty string.' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `You are an expert HR analyst. Your task is to analyze a candidate's skills from their text and compare them against the required skills for a job description.

Candidate's Text:
"""
${candidateText}
"""

Job Description:
"""
${jobDescription}
"""

Provide your analysis in a structured JSON format. The JSON should contain the following fields:
1.  \`matchedSkills\`: An array of skills explicitly found in both the candidate's text and the job description.
2.  \`missingSkills\`: An array of key skills required by the job description that are not clearly present in the candidate's text.
3.  \`additionalCandidateSkills\`: An array of notable skills present in the candidate's text that are not explicitly mentioned as required in the job description.
4.  \`compatibilityScore\`: A percentage (integer 0-100) indicating the overall fit between the candidate's skills and the job requirements. This should be a holistic assessment.
5.  \`summaryFeedback\`: A brief, professional natural language summary (2-3 sentences) of the skill match, highlighting key strengths and areas where the candidate might need to improve or demonstrate more.

Ensure the output is valid JSON and nothing else.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Attempt to parse the AI's response as JSON
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(text);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('AI Raw Response:', text);
      return NextResponse.json(
        { success: false, error: 'AI did not return valid JSON.', aiResponse: text },
        { status: 500 }
      );
    }

    // Basic validation of the parsed structure
    if (
      !Array.isArray(parsedResponse.matchedSkills) ||
      !Array.isArray(parsedResponse.missingSkills) ||
      !Array.isArray(parsedResponse.additionalCandidateSkills) ||
      typeof parsedResponse.compatibilityScore !== 'number' ||
      typeof parsedResponse.summaryFeedback !== 'string'
    ) {
      console.error('AI response structure is invalid:', parsedResponse);
      return NextResponse.json(
        { success: false, error: 'AI returned an unexpected JSON structure.', aiResponse: parsedResponse },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, ...parsedResponse });
  } catch (error) {
    console.error('Error during AI skill matching:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to perform AI skill matching.', details: (error as Error).message },
      { status: 500 }
    );
  }
}