import { ElevenLabsClient } from 'elevenlabs'

if (!process.env.ELEVENLABS_API_KEY) {
  console.warn('ELEVENLABS_API_KEY is not set - voice features will be disabled')
}

const client = process.env.ELEVENLABS_API_KEY
  ? new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY })
  : null as any

export const DEFAULT_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'pMsXgVXv3BLzUgSXRSLF'

export interface VoiceOptions {
  voiceId?: string
  stability?: number
  similarityBoost?: number
  modelId?: string
}

export async function textToSpeech(
  text: string,
  options: VoiceOptions = {}
): Promise<Buffer> {
  if (!process.env.ELEVENLABS_API_KEY) {
    throw new Error('ElevenLabs API key not configured')
  }

  const voiceId = options.voiceId || DEFAULT_VOICE_ID
  const stability = options.stability ?? 0.5
  const similarityBoost = options.similarityBoost ?? 0.75
  const modelId = options.modelId ?? 'eleven_monolingual_v1'

  try {
    const audio = await client.generate({
      text,
      voice: voiceId,
      model_id: modelId,
      voice_settings: {
        stability,
        similarity_boost: similarityBoost,
      },
    })

    const chunks: Buffer[] = []
    for await (const chunk of audio) {
      chunks.push(Buffer.from(chunk))
    }
    return Buffer.concat(chunks)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('ElevenLabs text-to-speech error:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    throw new Error(`Failed to generate audio: ${errorMessage}`);
  }
}

export async function getAvailableVoices() {
  if (!process.env.ELEVENLABS_API_KEY) {
    return []
  }

  try {
    const voices = await client.voices.getAll()
    return voices.voices.map(voice => ({
      id: voice.voice_id,
      name: voice.name,
      category: voice.category,
      description: voice.description || '',
    }))
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to fetch voices:', {
      message: errorMessage,
      timestamp: new Date().toISOString(),
    });
    return []
  }
}

export async function generateInterviewPrep(
  jobDescription: string,
  candidateProfile: string,
  questionType: 'technical' | 'behavioral' | 'mixed' = 'mixed'
): Promise<{
  questions: string[]
  audioUrls: string[]
  transcripts: string[]
}> {
  if (!process.env.ELEVENLABS_API_KEY) {
    return {
      questions: [],
      audioUrls: [],
      transcripts: [],
    }
  }

  const questions: string[] = []

  if (questionType === 'technical' || questionType === 'mixed') {
    questions.push(
      'Can you walk us through your experience with the main technologies listed in this job?',
      'Tell us about your most challenging technical project and how you solved it.',
      'How do you approach debugging and problem-solving in your work?'
    )
  }

  if (questionType === 'behavioral' || questionType === 'mixed') {
    questions.push(
      'Tell us about a time you had to work with a difficult team member.',
      'Describe a situation where you had to adapt to significant changes.',
      'Can you give an example of when you took the initiative?'
    )
  }

  const audioUrls: string[] = []
  const transcripts: string[] = []

  for (const question of questions) {
    transcripts.push(question)
    try {
      const audio = await textToSpeech(question, {
        voiceId: DEFAULT_VOICE_ID,
        stability: 0.5,
      })

      const base64Audio = audio.toString('base64')
      const dataUrl = `data:audio/mpeg;base64,${base64Audio}`
      audioUrls.push(dataUrl)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to generate audio for question:', {
        question,
        message: errorMessage,
        timestamp: new Date().toISOString(),
      });
      audioUrls.push('')
    }
  }

  return {
    questions,
    audioUrls,
    transcripts,
  }
}

export async function generateFeedbackAudio(
  feedback: string,
  candidateName: string
): Promise<Buffer> {
  const message = `Feedback for ${candidateName}: ${feedback}`

  return textToSpeech(message, {
    voiceId: DEFAULT_VOICE_ID,
    stability: 0.5,
  })
}
