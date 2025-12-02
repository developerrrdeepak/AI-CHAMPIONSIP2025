import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

let stripe: Stripe | null = null;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia'
    });
  }
} catch (error: any) {
  console.error('Stripe initialization failed:', error?.message || error);
}

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { customerId } = body;

    if (!customerId) {
      return NextResponse.json(
        { error: 'customerId is required' },
        { status: 400 }
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe portal error:', {
      message: error?.message || 'Unknown error',
      type: error?.type,
      code: error?.code,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { error: 'Failed to create portal session', details: error?.message },
      { status: 500 }
    );
  }
}
