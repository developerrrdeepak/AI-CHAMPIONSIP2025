// ai-championship/src/app/api/moderate-content/route.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// Ensure the API key is loaded from environment variables
const API_KEY = process.env.GOOGLE_GEMINI_API_KEY;

if (!API_KEY) {
  console.error('GOOGLE_GEMINI_API_KEY is not set.');
  // In a production app, you might want to throw an error or handle this more gracefully.
  // For now, we'll proceed but the AI calls will fail.
}

const genAI = new GoogleGenerativeAI(API_KEY || ''); // Pass a default empty string if not set

export async function POST(request: Request) {
  if (!API_KEY) {
    return NextResponse.json(
      { error: 'Server configuration error: Google Gemini API key is missing.' },
      { status: 500 }
    );
  }

  try {
    const { text } = await request.json();

    if (typeof text !== 'string' || text.trim() === '') {
      return NextResponse.json(
        { error: 'Invalid request: "text" field is required and must be a non-empty string.' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Use the generateContent method with safety settings
    const { response } = await model.generateContent({
      contents: [{ parts: [{ text: text }] }],
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
      ],
    });

    const blockedCategories: string[] = [];
    const isFlagged = response.promptFeedback?.safetyRatings?.some((rating) => {
      if (rating.HARM_CATEGORY === 'HARM_CATEGORY_UNSPECIFIED') {
        return false; // Ignore unspecified category
      }
      const isBlocked = rating.probability === 'HIGH' || rating.probability === 'MEDIUM';
      if (isBlocked) {
        blockedCategories.push(rating.HARM_CATEGORY);
      }
      return isBlocked;
    });

    return NextResponse.json({
      isFlagged: isFlagged || false,
      blockedCategories: blockedCategories,
      // Optionally, you might return the full safety ratings for more detail
      // safetyRatings: response.promptFeedback?.safetyRatings,
    });
  } catch (error) {
    console.error('Error during content moderation:', error);
    return NextResponse.json(
      { error: 'Failed to moderate content.', details: (error as Error).message },
      { status: 500 }
    );
  }
}