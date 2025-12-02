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
    const { priceId, userId } = body;

    if (!priceId || !userId) {
      return NextResponse.json(
        { error: 'priceId and userId are required' },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=true`,
      metadata: { userId },
      client_reference_id: userId,
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', {
      message: error?.message || 'Unknown error',
      type: error?.type,
      code: error?.code,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { error: 'Failed to create checkout session', details: error?.message },
      { status: 500 }
    );
  }
}
