import { NextRequest, NextResponse } from 'next/server';
import { geminiPro } from '@/ai/genkit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversationHistory } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    if (!Array.isArray(conversationHistory)) {
      return NextResponse.json(
        { success: false, error: 'conversationHistory must be an array' },
        { status: 400 }
      );
    }

    // Build conversation context
    const context = conversationHistory
      .map(msg => `${msg.role === 'user' ? 'Candidate' : 'Interviewer'}: ${msg.content}`)
      .join('\n');

    const prompt = `You are a professional AI interviewer conducting a job interview. Be conversational, encouraging, and ask relevant follow-up questions.

Conversation so far:
${context}

Candidate: ${message}

As the interviewer, provide a natural, encouraging response. Ask insightful follow-up questions based on their answer. Keep responses concise (2-3 sentences). Be professional but friendly.`;

    try {
      const result = await geminiPro.generateContent(prompt);
      const response = await result.response;
      const aiResponse = response.text().trim();

      return NextResponse.json({ success: true, response: aiResponse });
    } catch (aiError) {
      console.error('AI generation error:', aiError);
      // Fallback to basic responses
      const fallbackResponses = [
        'That\'s interesting! Can you tell me more about that?',
        'Great point! How would you apply that in a professional setting?',
        'I see. Can you give me a specific example?',
        'Excellent! What did you learn from that experience?'
      ];
      const response = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      return NextResponse.json({ success: true, response });
    }
  } catch (error: any) {
    console.error('Voice interview error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process interview', details: error?.message },
      { status: 500 }
    );
  }
}
