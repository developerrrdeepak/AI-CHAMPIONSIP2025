import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { createCheckoutSession, createOrUpdateCustomer } from '@/lib/stripe'
import { z } from 'zod'

const checkoutSchema = z.object({
  planId: z.string().min(1),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
})

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const decodedToken = await getAuth().verifyIdToken(token)
    const userId = decodedToken.uid
    const userEmail = decodedToken.email || `user-${userId}@hirevision.local`

    const body = await req.json()
    const { planId, successUrl, cancelUrl } = checkoutSchema.parse(body)

    const customer = await createOrUpdateCustomer(userId, userEmail, {
      userId: userId,
    })

    const session = await createCheckoutSession(
      customer.id,
      planId,
      successUrl,
      cancelUrl
    )

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    })
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
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
