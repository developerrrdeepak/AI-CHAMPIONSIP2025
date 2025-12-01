import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json();

    const lowerMessage = message.toLowerCase();
    
    let response = '';
    
    if (lowerMessage.includes('candidate') || lowerMessage.includes('match')) {
      response = 'I can help you find the perfect candidates! Our AI-powered matching system analyzes resumes, skills, and experience to find the best fit for your job openings. Would you like me to search for candidates with specific skills?';
    } else if (lowerMessage.includes('job') || lowerMessage.includes('description')) {
      response = 'I can help you write compelling job descriptions! A great job description should include: clear role title, key responsibilities, required skills, company culture, and benefits. What position are you hiring for?';
    } else if (lowerMessage.includes('interview')) {
      response = 'I can help you prepare for interviews! I can generate role-specific interview questions, provide feedback on answers, and even conduct mock voice interviews. What role are you interviewing for?';
    } else if (lowerMessage.includes('resume') || lowerMessage.includes('cv')) {
      response = 'I can analyze resumes and extract key information like skills, experience, education, and achievements. Upload a resume and I\'ll provide a detailed analysis with match scores for your job openings.';
    } else if (lowerMessage.includes('skill')) {
      response = 'I can help identify skill gaps and recommend training! Tell me about the role and I\'ll suggest the most important skills to look for in candidates.';
    } else {
      response = `I'm your AI recruitment assistant powered by Raindrop SmartInference! I can help you with:

• Finding and matching candidates
• Writing job descriptions
• Interview preparation and questions
• Resume analysis and screening
• Skill gap analysis
• Candidate ranking

What would you like help with?`;
    }

    return NextResponse.json({ success: true, response });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
