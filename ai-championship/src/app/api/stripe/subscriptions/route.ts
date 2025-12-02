import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { getCustomerSubscriptions, cancelSubscription, updateSubscription } from '@/lib/stripe'
import { z } from 'zod'

const subscriptionActionSchema = z.object({
  action: z.enum(['get', 'cancel', 'update']),
  subscriptionId: z.string().optional(),
  planId: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const decodedToken = await getAuth().verifyIdToken(token)
    const userId = decodedToken.uid

    const db = getFirestore()
    const userDoc = await db.collection('users').doc(userId).get()

    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userData = userDoc.data()
    if (!userData?.stripeCustomerId) {
      return NextResponse.json({ subscriptions: [] })
    }

    const subscriptions = await getCustomerSubscriptions(userData.stripeCustomerId)

    return NextResponse.json({
      subscriptions: subscriptions.map(sub => ({
        id: sub.id,
        status: sub.status,
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
        currentPeriodStart: new Date(sub.current_period_start * 1000),
        plan: sub.items.data[0]?.price?.id,
      })),
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Get subscriptions error:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { error: 'Failed to retrieve subscriptions', details: errorMessage },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const decodedToken = await getAuth().verifyIdToken(token)
    const userId = decodedToken.uid

    const body = await req.json()
    const { action, subscriptionId, planId } = subscriptionActionSchema.parse(body)

    const db = getFirestore()
    const userDoc = await db.collection('users').doc(userId).get()

    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userData = userDoc.data()
    if (!userData?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No active subscription' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'cancel': {
        if (!subscriptionId) {
          return NextResponse.json(
            { error: 'Subscription ID required' },
            { status: 400 }
          )
        }
        const canceled = await cancelSubscription(subscriptionId)
        await userDoc.ref.update({
          subscriptionStatus: 'canceled',
          updatedAt: new Date(),
        })
        return NextResponse.json({ subscription: canceled })
      }

      case 'update': {
        if (!subscriptionId || !planId) {
          return NextResponse.json(
            { error: 'Subscription ID and Plan ID required' },
            { status: 400 }
          )
        }
        const updated = await updateSubscription(subscriptionId, planId)
        await userDoc.ref.update({
          subscriptionPlan: planId,
          updatedAt: new Date(),
        })
        return NextResponse.json({ subscription: updated })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Subscription action error:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { error: 'Failed to process subscription action', details: errorMessage },
      { status: 500 }
    )
  }
}
