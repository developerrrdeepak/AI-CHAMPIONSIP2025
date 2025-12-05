'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, CreditCard, Loader2 } from 'lucide-react';
import { useFirebase } from '@/firebase';
import { stripeClient, PRICING_PLANS } from '@/lib/stripe-client';

export default function BillingPage() {
  const { user } = useFirebase();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const loadSubscription = async () => {
      const data = await stripeClient.getSubscription(user.uid);
      setSubscription(data.subscription);
      setLoading(false);
    };

    loadSubscription();
  }, [user]);

  const handleSubscribe = async (priceId: string, planId: string) => {
    if (!user) return;

    setCheckoutLoading(planId);
    const result = await stripeClient.createCheckoutSession(priceId, user.uid);
    
    if (result.url) {
      window.location.href = result.url;
    } else {
      setCheckoutLoading(null);
    }
  };

  const handleManageBilling = async () => {
    if (!subscription?.customerId) return;

    const result = await stripeClient.createPortalSession(subscription.customerId);
    if (result.url) {
      window.location.href = result.url;
    }
  };

  const currentPlan = subscription?.items?.data?.[0]?.price?.id || 'free';

  return (
    <div className="space-y-8 py-6">
      <PageHeader
        title="Billing & Subscription"
        description="Manage your subscription and payment methods"
      />

      {subscription && (
        <Card>
          <CardHeader>
            <CardTitle>Current Subscription</CardTitle>
            <CardDescription>Your active plan and billing details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {Object.values(PRICING_PLANS).find(p => p.priceId === currentPlan)?.name || 'Free'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Status: <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                    {subscription.status}
                  </Badge>
                </p>
              </div>
              <Button onClick={handleManageBilling}>
                <CreditCard className="h-4 w-4 mr-2" />
                Manage Billing
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.values(PRICING_PLANS).map((plan) => (
          <Card key={plan.id} className={plan.id === 'pro' ? 'border-primary shadow-lg' : ''}>
            <CardHeader>
              {plan.id === 'pro' && (
                <Badge className="w-fit mb-2">Most Popular</Badge>
              )}
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>
                <span className="text-3xl font-bold">${plan.price}</span>
                {plan.price > 0 && <span className="text-muted-foreground">/month</span>}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              {plan.id === 'free' ? (
                <Button variant="outline" className="w-full" disabled>
                  Current Plan
                </Button>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => handleSubscribe(plan.priceId, plan.id)}
                  disabled={checkoutLoading === plan.id || currentPlan === plan.priceId}
                >
                  {checkoutLoading === plan.id ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : currentPlan === plan.priceId ? (
                    'Current Plan'
                  ) : (
                    'Subscribe'
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enterprise Plan</CardTitle>
          <CardDescription>
            Need custom features, dedicated support, or SSO? Contact us for enterprise pricing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline">
            Contact Sales
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
