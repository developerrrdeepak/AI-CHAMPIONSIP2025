import { NextRequest, NextResponse } from 'next/server'
import { generateInterviewPrep } from '@/lib/elevenlabs'
import { z } from 'zod'

const interviewPrepSchema = z.object({
  jobDescription: z.string().min(1),
  candidateProfile: z.string().min(1),
  questionType: z.enum(['technical', 'behavioral', 'mixed']).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { jobDescription, candidateProfile, questionType } = interviewPrepSchema.parse(body)

    const prep = await generateInterviewPrep(jobDescription, candidateProfile, questionType)

    return NextResponse.json(prep)
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Interview prep error:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      { error: 'Failed to generate interview prep', details: errorMessage },
      { status: 500 }
    )
  }
}
