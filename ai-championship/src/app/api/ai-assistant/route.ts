import { NextRequest, NextResponse } from 'next/server';
import { createAIAssistant } from '@/lib/universal-ai-assistant';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, userId, context, action } = body;

    if (!question && !action) {
      return NextResponse.json(
        { error: 'Question or action is required' },
        { status: 400 }
      );
    }

    const assistant = createAIAssistant();

    let response;

    switch (action) {
      case 'analyze-code':
        response = await assistant.analyzeCode(body.code, body.language || 'javascript');
        break;
      
      case 'debug':
        response = await assistant.debugError(body.error, body.code);
        break;
      
      case 'explain':
        response = await assistant.explainConcept(body.concept, body.level);
        break;
      
      case 'brainstorm':
        response = await assistant.brainstorm(body.topic, body.count);
        break;
      
      case 'solve':
        response = await assistant.solveProblems(body.problem);
        break;
      
      default:
        response = await assistant.ask(question, userId, context);
    }

    return NextResponse.json({
      success: true,
      data: response,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('AI Assistant API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to process request',
        fallback: 'I encountered an issue, but I\'m here to help. Please try rephrasing your question.',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'active',
    capabilities: [
      'General Q&A',
      'Code Analysis',
      'Debugging',
      'Concept Explanation',
      'Brainstorming',
      'Problem Solving',
      'Technical Guidance',
      'Creative Writing',
      'Research Assistance',
    ],
    message: 'Universal AI Assistant is ready to help with any question!',
  });
}
