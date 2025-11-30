import { NextRequest, NextResponse } from 'next/server'
import { constructEvent, getCustomerSubscriptions } from '@/lib/stripe'
import { getFirestore } from 'firebase-admin/firestore'

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      )
    }

    const body = await req.text()
    const event = constructEvent(body, signature)

    const db = getFirestore()

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as any
        const customerId = subscription.customer

        const query = await db
          .collection('users')
          .where('stripeCustomerId', '==', customerId)
          .limit(1)
          .get()

        if (!query.empty) {
          const userDoc = query.docs[0]
          await userDoc.ref.update({
            subscriptionId: subscription.id,
            subscriptionStatus: subscription.status,
            subscriptionPlan: subscription.items.data[0]?.price?.id,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            updatedAt: new Date(),
          })
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any
        const customerId = subscription.customer

        const query = await db
          .collection('users')
          .where('stripeCustomerId', '==', customerId)
          .limit(1)
          .get()

        if (!query.empty) {
          const userDoc = query.docs[0]
          await userDoc.ref.update({
            subscriptionId: null,
            subscriptionStatus: 'canceled',
            updatedAt: new Date(),
          })
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any
        const customerId = invoice.customer

        const query = await db
          .collection('users')
          .where('stripeCustomerId', '==', customerId)
          .limit(1)
          .get()

        if (!query.empty) {
          const userDoc = query.docs[0]
          await db.collection('invoices').add({
            userId: userDoc.id,
            stripeInvoiceId: invoice.id,
            amount: invoice.total,
            currency: invoice.currency,
            status: invoice.status,
            paidAt: new Date(invoice.paid_at * 1000),
            createdAt: new Date(),
          })
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any
        console.error(`Payment failed for invoice ${invoice.id}`)
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
