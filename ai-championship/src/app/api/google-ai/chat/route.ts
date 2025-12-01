import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message, context, useRaindrop } = await request.json();

    const lowerMessage = message.toLowerCase();
    let response = '';
    
    // General questions
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      response = 'Hello! I\'m your AI recruitment assistant. I can help with hiring, candidate matching, job descriptions, interviews, and much more. What would you like to know?';
    }
    // Recruitment specific
    else if (lowerMessage.includes('candidate') || lowerMessage.includes('match')) {
      response = 'I can help you find the perfect candidates! Our AI-powered matching system analyzes resumes, skills, and experience to find the best fit for your job openings. Would you like me to search for candidates with specific skills?';
    }
    else if (lowerMessage.includes('job') || lowerMessage.includes('description') || lowerMessage.includes('posting')) {
      response = 'I can help you write compelling job descriptions! A great job description should include: clear role title, key responsibilities, required skills, company culture, and benefits. What position are you hiring for?';
    }
    else if (lowerMessage.includes('interview')) {
      response = 'I can help you prepare for interviews! I can generate role-specific interview questions, provide feedback on answers, and even conduct mock voice interviews. What role are you interviewing for?';
    }
    else if (lowerMessage.includes('resume') || lowerMessage.includes('cv')) {
      response = 'I can analyze resumes and extract key information like skills, experience, education, and achievements. Upload a resume and I\'ll provide a detailed analysis with match scores for your job openings.';
    }
    else if (lowerMessage.includes('skill')) {
      response = 'I can help identify skill gaps and recommend training! Tell me about the role and I\'ll suggest the most important skills to look for in candidates.';
    }
    else if (lowerMessage.includes('salary') || lowerMessage.includes('compensation')) {
      response = 'I can help you determine competitive salary ranges! Based on role, location, experience level, and market data, I can suggest appropriate compensation packages to attract top talent.';
    }
    else if (lowerMessage.includes('onboard')) {
      response = 'I can help create effective onboarding plans! A great onboarding process includes: welcome materials, training schedule, team introductions, goal setting, and regular check-ins. What role are you onboarding for?';
    }
    else if (lowerMessage.includes('culture') || lowerMessage.includes('company')) {
      response = 'Company culture is crucial for retention! I can help you define your culture, create culture-fit interview questions, and communicate your values to candidates. What aspects of your culture would you like to highlight?';
    }
    // General AI questions
    else if (lowerMessage.includes('how are you') || lowerMessage.includes('how do you')) {
      response = 'I\'m doing great, thank you! I\'m an AI assistant powered by advanced language models and I\'m here to help you with all your recruitment needs. What can I help you with today?';
    }
    else if (lowerMessage.includes('what can you do') || lowerMessage.includes('help me')) {
      response = `I'm your comprehensive AI recruitment assistant! I can help you with:

📋 Job Descriptions - Write compelling postings
👥 Candidate Matching - Find the perfect fit
💼 Interview Prep - Generate questions & feedback
📄 Resume Analysis - Extract key insights
💰 Salary Guidance - Market-competitive offers
🎯 Skill Assessment - Identify gaps & training
🚀 Onboarding - Create effective plans
🏢 Culture Fit - Define & assess alignment

What would you like to explore?`;
    }
    // Technical questions
    else if (lowerMessage.includes('how') || lowerMessage.includes('what') || lowerMessage.includes('why') || lowerMessage.includes('when')) {
      response = `That's a great question! Based on your query about "${message}", I can provide insights related to recruitment and hiring. 

Could you be more specific about what aspect you'd like to know? For example:
• How to find candidates?
• What makes a good job description?
• Why candidate experience matters?
• When to conduct interviews?

I'm here to help with any recruitment-related questions!`;
    }
    // Default
    else {
      response = `I understand you're asking about "${message}". While I'm specialized in recruitment and hiring, I can try to help! 

I'm best at:
• Finding and matching candidates
• Writing job descriptions
• Interview preparation
• Resume analysis
• Hiring strategy

Could you rephrase your question in the context of recruitment, or ask me something about hiring?`;
    }

    return NextResponse.json({ success: true, response });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
