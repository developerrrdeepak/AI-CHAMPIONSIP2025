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
    const { conversationHistory, latestMessage } = await request.json();

    if (
      typeof latestMessage !== 'string' ||
      latestMessage.trim() === '' ||
      !Array.isArray(conversationHistory)
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid request: "latestMessage" must be a non-empty string and "conversationHistory" must be an array.',
        },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const formattedHistory = conversationHistory.map((msg: { role: string; content: string }) => {
      // Gemini expects 'user' and 'model' roles. Adjust if 'assistant' is used.
      const role = msg.role === 'assistant' ? 'model' : msg.role;
      return { role, parts: [{ text: msg.content }] };
    });

    const prompt = `You are a helpful communication assistant. Analyze the following conversation history and the latest message, then provide 2-3 concise, professional, and contextually relevant reply suggestions. Focus on moving the conversation forward, offering clarity, or expressing interest. The suggestions should be short and direct.

Conversation History:
${conversationHistory
      .map((msg: { role: string; content: string }) => `${msg.role}: ${msg.content}`)
      .join('\n')}

Latest Message:
user: ${latestMessage}

Based on this, suggest 2-3 appropriate replies. Return the suggestions as a JSON array of strings, like this:
{ "suggestions": ["Suggestion 1", "Suggestion 2", "Suggestion 3"] }
`;

    const chat = model.startChat({
      history: formattedHistory,
    });

    const result = await chat.sendMessage(prompt);
    const text = result.response.text();

    try {
      const parsedResponse = JSON.parse(text);
      if (!parsedResponse.suggestions || !Array.isArray(parsedResponse.suggestions)) {
        throw new Error('AI response did not contain a valid "suggestions" array.');
      }
      return NextResponse.json({ success: true, suggestions: parsedResponse.suggestions });
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', text, parseError);
      return NextResponse.json(
        {
          error: 'Failed to parse AI response for suggestions.',
          details: (parseError as Error).message,
          rawResponse: text,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error generating message suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate message suggestions.', details: (error as Error).message },
      { status: 500 }
    );
  }
}