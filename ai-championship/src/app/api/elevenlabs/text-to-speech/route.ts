import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text, voiceId } = await request.json();

    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    const VOICE_ID = voiceId || 'EXAVITQu4vr4xnSDxMaL';

    if (!ELEVENLABS_API_KEY) {
      // Use browser's built-in speech synthesis as fallback
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = voiceId === '21m00Tcm4TlvDq8ikWAM' ? 0.8 : 1.0;
      
      // Return empty audio (browser will handle speech)
      return new NextResponse(new Blob(), {
        headers: { 'Content-Type': 'audio/mpeg' }
      });
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error('ElevenLabs API error');
    }

    const audioBuffer = await response.arrayBuffer();
    return new NextResponse(audioBuffer, {
      headers: { 'Content-Type': 'audio/mpeg' }
    });
  } catch (error) {
    console.error('Text-to-speech error:', error);
    return new NextResponse(new Blob(), {
      headers: { 'Content-Type': 'audio/mpeg' }
    });
  }
}
