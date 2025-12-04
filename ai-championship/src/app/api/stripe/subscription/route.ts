
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia'
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ subscription: null });
    }

    const customers = await stripe.customers.list({
      limit: 1,
      metadata: { userId }
    });

    if (customers.data.length === 0) {
      return NextResponse.json({ subscription: null });
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customers.data[0].id,
      status: 'active',
      limit: 1
    });

    return NextResponse.json({
      subscription: subscriptions.data[0] || null,
      customerId: customers.data[0].id
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
