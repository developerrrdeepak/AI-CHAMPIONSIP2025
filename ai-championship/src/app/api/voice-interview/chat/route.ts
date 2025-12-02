import { NextRequest, NextResponse } from 'next/server';

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

    const lowerMessage = message.toLowerCase();
    let response = '';

    // Check if it's the first message (field/role selection)
    if (conversationHistory.length <= 1) {
      response = `Great! I'll help you practice for ${message}. Let's start with a common question: Tell me about yourself and why you're interested in this field.`;
    }
    // Generate contextual interview questions and responses
    else if (lowerMessage.includes('tell me about yourself') || lowerMessage.includes('about yourself')) {
      response = 'Thank you for sharing! That\'s a great background. Now, can you describe a challenging project or situation you\'ve faced in your career and how you handled it?';
    }
    else if (lowerMessage.includes('project') || lowerMessage.includes('challenge')) {
      response = 'Excellent example! I can see you have strong problem-solving skills. How do you typically handle working under pressure or tight deadlines?';
    }
    else if (lowerMessage.includes('pressure') || lowerMessage.includes('deadline')) {
      response = 'That\'s a very practical approach. What would you say are your greatest strengths, and how do they apply to this role?';
    }
    else if (lowerMessage.includes('strength') || lowerMessage.includes('skills')) {
      response = 'Those are valuable strengths! Now, everyone has areas for improvement. What would you say is an area you\'re currently working on developing?';
    }
    else if (lowerMessage.includes('weakness') || lowerMessage.includes('improve')) {
      response = 'I appreciate your self-awareness. Where do you see yourself in 3-5 years, and how does this role fit into your career goals?';
    }
    else if (lowerMessage.includes('years') || lowerMessage.includes('future') || lowerMessage.includes('goals')) {
      response = 'That\'s a clear vision! Do you have any questions for me about the role, team, or company culture?';
    }
    else if (lowerMessage.includes('question') || lowerMessage.includes('ask')) {
      response = 'Those are great questions! Based on our conversation, I think you\'d be a strong fit. Is there anything else you\'d like to discuss or clarify about your experience?';
    }
    else {
      // Generic follow-up based on context
      const responses = [
        'That\'s interesting! Can you elaborate on that a bit more?',
        'I see. How did that experience shape your approach to similar situations?',
        'Great point! Can you give me a specific example of that?',
        'That makes sense. What did you learn from that experience?',
        'Excellent! How would you apply that in this role?'
      ];
      response = responses[Math.floor(Math.random() * responses.length)];
    }

    return NextResponse.json({ success: true, response });
  } catch (error: any) {
    console.error('Voice interview error:', {
      message: error?.message || 'Unknown error',
      stack: error?.stack,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { success: false, error: 'Failed to process interview', details: error?.message },
      { status: 500 }
    );
  }
}
