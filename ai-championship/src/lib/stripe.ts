import Stripe from 'stripe'

export const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null as any

export interface PricingPlan {
  id: string
  name: string
  description: string
  price: number
  currency: string
  interval: 'month' | 'year'
  features: string[]
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for small teams',
    price: 29,
    currency: 'usd',
    interval: 'month',
    features: [
      'Up to 10 job postings',
      'Up to 100 candidate profiles',
      'Basic AI matching',
      'Email support',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'For growing companies',
    price: 99,
    currency: 'usd',
    interval: 'month',
    features: [
      'Unlimited job postings',
      'Up to 1000 candidate profiles',
      'Advanced AI matching',
      'Interview scheduling',
      'Analytics dashboard',
      'Priority support',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations',
    price: 299,
    currency: 'usd',
    interval: 'month',
    features: [
      'Unlimited everything',
      'Custom integrations',
      'Dedicated account manager',
      'API access',
      'White-label option',
      '24/7 phone support',
    ],
  },
]

export async function createCheckoutSession(
  customerId: string,
  planId: string,
  successUrl: string,
  cancelUrl: string
) {
  const plan = PRICING_PLANS.find(p => p.id === planId)
  if (!plan) {
    throw new Error(`Plan ${planId} not found`)
  }

  const price = Math.round(plan.price * 100)

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [
      {
        price_data: {
          currency: plan.currency,
          product_data: {
            name: plan.name,
            description: plan.description,
          },
          recurring: {
            interval: plan.interval,
            interval_count: 1,
          },
          unit_amount: price,
        },
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
  })

  return session
}

export async function createOrUpdateCustomer(
  customerId: string,
  email: string,
  metadata?: Record<string, string>
) {
  try {
    const customers = await stripe.customers.list({
      email: email,
      limit: 1,
    })

    if (customers.data.length > 0) {
      return await stripe.customers.update(customers.data[0].id, {
        metadata: metadata,
      })
    }
  } catch {
  }

  return await stripe.customers.create({
    email: email,
    metadata: metadata,
  })
}

export async function getCustomerSubscriptions(customerId: string) {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
  })

  return subscriptions.data
}

export async function cancelSubscription(subscriptionId: string) {
  return await stripe.subscriptions.cancel(subscriptionId)
}

export async function updateSubscription(
  subscriptionId: string,
  planId: string
) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const plan = PRICING_PLANS.find(p => p.id === planId)

  if (!plan) {
    throw new Error(`Plan ${planId} not found`)
  }

  const price = Math.round(plan.price * 100)

  return await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        price_data: {
          currency: plan.currency,
          product: subscription.items.data[0].price?.product as string,
          recurring: {
            interval: plan.interval,
          },
          unit_amount: price,
        },
      },
    ],
  })
}

export async function getInvoices(customerId: string) {
  const invoices = await stripe.invoices.list({
    customer: customerId,
  })

  return invoices.data
}

export function constructEvent(body: string | Buffer, signature: string) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not set')
  }

  return stripe.webhooks.constructEvent(body, signature, webhookSecret)
}
