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
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to generate interview prep' },
      { status: 500 }
    )
  }
}
