'use client'

import React, { useState } from 'react'
import { PRICING_PLANS } from '@/lib/stripe'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle } from 'lucide-react'
import { useAuth } from '@/firebase'

export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const handleSelectPlan = async (planId: string) => {
    if (!user) {
      window.location.href = '/login'
      return
    }

    setLoading(true)
    setError(null)
    setSelectedPlan(planId)

    try {
      const token = await user.getIdToken()
      const origin = typeof window !== 'undefined' ? window.location.origin : ''

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          planId,
          successUrl: `${origin}/dashboard?payment=success`,
          cancelUrl: `${origin}/pricing?payment=canceled`,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { url } = await response.json()
      if (url) {
        window.location.href = url
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setSelectedPlan(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-6xl mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
        <p className="text-xl text-gray-600">
          Choose the perfect plan for your hiring needs
        </p>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {PRICING_PLANS.map(plan => (
          <Card key={plan.id} className="flex flex-col relative">
            {plan.id === 'professional' && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </div>
            )}
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="mb-6">
                <span className="text-4xl font-bold">${plan.price}</span>
                <span className="text-gray-600 ml-2">/{plan.interval}</span>
              </div>

              <ul className="mb-8 space-y-3 flex-1">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center">
                    <CheckCircle className="w-5 h-5 mr-3 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleSelectPlan(plan.id)}
                disabled={loading && selectedPlan === plan.id}
                className={`w-full ${
                  plan.id === 'professional'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                }`}
              >
                {loading && selectedPlan === plan.id ? 'Processing...' : 'Get Started'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 p-6 bg-gray-100 rounded-lg">
        <h3 className="text-xl font-semibold mb-4">Frequently Asked Questions</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Can I change my plan anytime?</h4>
            <p className="text-gray-700">
              Yes! You can upgrade or downgrade your plan anytime. Changes will take effect on your next billing cycle.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Do you offer annual billing?</h4>
            <p className="text-gray-700">
              Contact our sales team for custom annual billing options and enterprise pricing.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">What payment methods do you accept?</h4>
            <p className="text-gray-700">
              We accept all major credit cards through Stripe. No setup fees or hidden charges.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
