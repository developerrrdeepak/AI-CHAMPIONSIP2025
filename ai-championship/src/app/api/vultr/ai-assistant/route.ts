import { NextRequest, NextResponse } from 'next/server';
import { aiCodeAssistant } from '@/lib/raindropClient';

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid prompt' }, { status: 400 });
    }

    const result = await aiCodeAssistant(prompt);

    return NextResponse.json({ result });
  } catch (error) {
    console.error('AI Assistant error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
