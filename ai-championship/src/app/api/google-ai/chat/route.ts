import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, context } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'AI service not configured' },
        { status: 503 }
      );
    }

    const systemPrompts: Record<string, string> = {
      recruitment_assistant: 'You are an AI recruitment assistant for employers. Help with candidate matching, job descriptions, interview questions, and hiring strategies. Be concise and professional.',
      candidate_assistant: 'You are an AI career assistant for job seekers. Help with resume optimization, interview preparation, job search strategies, and career advice. Be encouraging and supportive.',
      interview_assistant: 'You are an AI interview coach. Help with interview preparation, common questions, behavioral questions, and feedback. Be constructive and detailed.',
      general_assistant: 'You are a helpful AI assistant. Answer questions clearly and professionally.'
    };
    
    const systemPrompt = systemPrompts[context] || systemPrompts.general_assistant;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ 
          parts: [{ text: `${systemPrompt}\n\nUser: ${message}\n\nAssistant:` }] 
        }],
        generationConfig: { 
          temperature: 0.9, 
          maxOutputTokens: 1000,
          topP: 0.95,
          topK: 40
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini API error:', errorData);
      throw new Error(`Gemini API failed: ${response.status}`);
    }
    
    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    return NextResponse.json({ success: true, response: aiResponse });
  } catch (error: any) {
    console.error('Chat error:', {
      message: error?.message || 'Unknown error',
      stack: error?.stack,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to get AI response',
      details: error?.message,
      response: 'I apologize, but I\'m having trouble connecting to the AI service. Please try again.' 
    }, { status: 500 });
  }
}
