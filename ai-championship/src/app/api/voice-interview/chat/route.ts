import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
// import { geminiPro } from '@/ai/genkit'; // This import is no longer needed

// Ensure the API key is loaded from environment variables
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
    const { messages, jobDescription } = body; // Changed from message, conversationHistory

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Messages array is required and must not be empty' },
        { status: 400 }
      );
    }

    if (typeof jobDescription !== 'string' || jobDescription.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'jobDescription is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Build conversation context for the AI
    const conversationContext = messages
      .map((msg: { role: string; content: string }) => {
        const role = msg.role === 'user' ? 'Candidate' : 'Interviewer';
        return `${role}: ${msg.content}`;
      })
      .join('\n');

    const lastCandidateMessage = messages[messages.length - 1]?.content || '';

    const prompt = `You are an expert AI interviewer. Your goal is to conduct a professional, engaging, and relevant job interview for a role with the following description:
    ---
    Job Description:
    ${jobDescription}
    ---

    Here is the conversation history so far:
    ${conversationContext}

    The candidate's last response was: "${lastCandidateMessage}"

    Based on the job description and the conversation history:
    1. Formulate a single, relevant, and insightful follow-up interview question for the candidate.
    2. Provide a brief, constructive assessment of the candidate's *last* response. The assessment should highlight strengths and suggest areas for improvement, specifically referencing the job description requirements.

    Your output MUST be a JSON string with two fields: "nextQuestion" (string) and "assessment" (string).
    Example:
    {
      "nextQuestion": "Can you describe a time when you had to manage conflicting priorities, and how did you handle it?",
      "assessment": "Strength: Demonstrated understanding of project management principles. Suggestion: Could provide a more concrete example of a large-scale project."
    }`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const aiResponseText = response.text().trim();

      // Attempt to parse the AI's response as JSON
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(aiResponseText);
      } catch (jsonError) {
        console.error('Failed to parse AI response as JSON:', jsonError);
        console.error('Raw AI response:', aiResponseText);
        return NextResponse.json(
          { success: false, error: 'AI response was not valid JSON.', rawResponse: aiResponseText },
          { status: 500 }
        );
      }

      if (parsedResponse && typeof parsedResponse.nextQuestion === 'string' && typeof parsedResponse.assessment === 'string') {
        return NextResponse.json({ success: true, ...parsedResponse });
      } else {
        console.error('AI response missing expected fields:', parsedResponse);
        return NextResponse.json(
          { success: false, error: 'AI response missing "nextQuestion" or "assessment" fields.', parsedResponse },
          { status: 500 }
        );
      }

    } catch (aiError: any) {
      console.error('AI generation error:', aiError);
      return NextResponse.json(
        { success: false, error: 'Failed to generate AI interview response', details: aiError.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Voice interview API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process interview request', details: error.message },
      { status: 500 }
    );
  }
}