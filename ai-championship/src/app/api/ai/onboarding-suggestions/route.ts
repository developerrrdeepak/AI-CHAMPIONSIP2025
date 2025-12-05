// ai-championship/src/app/api/ai/onboarding-suggestions/route.ts
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
    const { userRole } = await request.json();

    if (typeof userRole !== 'string' || (userRole !== 'candidate' && userRole !== 'recruiter')) {
      return NextResponse.json(
        { error: 'Invalid request: "userRole" must be either "candidate" or "recruiter".' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `You are a helpful onboarding assistant for a career platform.
Generate a personalized welcome message, 2-3 key initial actions, and a brief encouraging statement for a new user with the role of "${userRole}".

Output your response as a JSON object with the following fields:
- "welcomeMessage": string
- "suggestedActions": string[] (an array of 2-3 actions)
- "encouragement": string

Here's an example for a 'candidate':
{
  "welcomeMessage": "Welcome, Future Talent!",
  "suggestedActions": [
    "Complete your profile to unlock personalized job recommendations.",
    "Explore our challenges to showcase your skills.",
    "Practice with our AI interview coach."
  ],
  "encouragement": "Your next big opportunity awaits. Let's find it together!"
}

Here's an example for a 'recruiter':
{
  "welcomeMessage": "Welcome, Talent Scout!",
  "suggestedActions": [
    "Post your first job listing to attract top candidates.",
    "Utilize our AI candidate matching feature to find the best fit.",
    "Set up your hiring pipeline for seamless management."
  ],
  "encouragement": "Empower your team with the best talent. Happy hiring!"
}

Now, generate the JSON for the "${userRole}" role:`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Attempt to parse the AI's response, handling potential formatting issues
    let aiResponse;
    try {
      aiResponse = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', responseText, parseError);
      // Fallback for malformed JSON from AI
      const defaultMessage = userRole === 'candidate'
        ? {
            welcomeMessage: "Welcome to the platform!",
            suggestedActions: ["Complete your profile.", "Browse jobs."],
            encouragement: "We're here to help you succeed!"
          }
        : {
            welcomeMessage: "Welcome to the platform!",
            suggestedActions: ["Post a job.", "Review candidates."],
            encouragement: "Find your next great hire!"
          };
      return NextResponse.json({
        success: true,
        ...defaultMessage,
        originalAIResponse: responseText, // Include original for debugging
        warning: "AI response parsing failed, returning default suggestions."
      }, { status: 200 });
    }

    // Basic validation of AI's JSON structure
    if (!aiResponse.welcomeMessage || !Array.isArray(aiResponse.suggestedActions) || !aiResponse.encouragement) {
        console.error('AI response has unexpected structure:', aiResponse);
        return NextResponse.json(
            { error: 'AI generated response in an unexpected format.', details: aiResponse },
            { status: 500 }
        );
    }

    return NextResponse.json({ success: true, ...aiResponse });
  } catch (error) {
    console.error('Error during AI-powered onboarding suggestion:', error);
    return NextResponse.json(
      { error: 'Failed to generate onboarding suggestions.', details: (error as Error).message },
      { status: 500 }
    );
  }
}