
'use client';

// Stripe Payment Client
export class StripeClient {
  private publishableKey: string;

  constructor() {
    this.publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
  }

  async createCheckoutSession(priceId: string, userId: string) {
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, userId })
      });

      if (!response.ok) throw new Error('Failed to create checkout session');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Stripe checkout error:', error);
      return { success: false, error };
    }
  }

  async createPortalSession(customerId: string) {
    try {
      const response = await fetch('/api/stripe/create-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId })
      });

      if (!response.ok) throw new Error('Failed to create portal session');
      return await response.json();
    } catch (error) {
      console.error('Stripe portal error:', error);
      return { success: false, error };
    }
  }

  async getSubscription(userId: string) {
    try {
      const response = await fetch(`/api/stripe/subscription?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to get subscription');
      return await response.json();
    } catch (error) {
      console.error('Stripe subscription error:', error);
      return { subscription: null };
    }
  }
}

export const stripeClient = new StripeClient();

// Pricing Plans
export const PRICING_PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    priceId: '',
    features: [
      '5 job postings',
      'Basic candidate matching',
      'Email support',
      '100 AI credits/month'
    ]
  },
  PRO: {
    id: 'pro',
    name: 'Pro',
    price: 49,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || 'price_pro',
    features: [
      'Unlimited job postings',
      'Advanced AI matching',
      'Priority support',
      '1000 AI credits/month',
      'Voice interviews',
      'Analytics dashboard'
    ]
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    priceId: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise',
    features: [
      'Everything in Pro',
      'Unlimited AI credits',
      'Custom integrations',
      'Dedicated support',
      'SSO (WorkOS)',
      'Custom branding',
      'API access'
    ]
  }
};
