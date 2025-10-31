/*
"use client"

import { useState, useEffect } from "react"
import { Check, Crown, Zap, Star, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { PlanFeatures, PlanType } from "@/types/subscription"

interface BillingModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  trigger?: React.ReactNode
  currentPlan?: PlanType
  plans?: PlanFeatures[]
}

const planIcons = {
  free: Star,
  pro: Zap,
  enterprise: Crown,
  trial: Star,
}

const planColors = {
  free: "text-gray-600",
  pro: "text-blue-600",
  enterprise: "text-purple-600",
  trial: "text-orange-600",
}

export function BillingModal({ isOpen, onOpenChange, trigger, currentPlan = 'free', plans }: BillingModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Default plans if not provided
  const defaultPlans: PlanFeatures[] = [
    {
      id: 'free',
      plan_type: 'free',
      plan_name: 'Free',
      plan_description: 'Perfect for getting started',
      search_limit: 10,
      reset_period: 'monthly',
      can_export_results: false,
      can_save_history: true,
      can_share_searches: false,
      has_api_access: false,
      has_priority_support: false,
      max_history_items: 50,
      price_monthly_usd: 0,
      price_yearly_usd: 0,
      display_order: 1,
      is_visible: true,
      created_at: '',
      updated_at: '',
    },
    {
      id: 'pro',
      plan_type: 'pro',
      plan_name: 'Pro',
      plan_description: 'For power users and small teams',
      search_limit: 500,
      reset_period: 'monthly',
      can_export_results: true,
      can_save_history: true,
      can_share_searches: true,
      has_api_access: true,
      has_priority_support: true,
      max_history_items: 1000,
      price_monthly_usd: 19,
      price_yearly_usd: 190,
      display_order: 2,
      is_visible: true,
      created_at: '',
      updated_at: '',
    },
    {
      id: 'enterprise',
      plan_type: 'enterprise',
      plan_name: 'Enterprise',
      plan_description: 'For large organizations',
      search_limit: 5000,
      reset_period: 'monthly',
      can_export_results: true,
      can_save_history: true,
      can_share_searches: true,
      has_api_access: true,
      has_priority_support: true,
      max_history_items: -1, // unlimited
      price_monthly_usd: 99,
      price_yearly_usd: 990,
      display_order: 3,
      is_visible: true,
      created_at: '',
      updated_at: '',
    },
  ]

  const displayPlans = plans || defaultPlans

  const handleUpgrade = async (planType: PlanType) => {
    if (planType === 'free' || planType === currentPlan) return

    setIsLoading(true)
    setSelectedPlan(planType)

    try {
      const response = await fetch('/api/lemonsqueezy/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planType,
          billingCycle,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create checkout session')
      }

      const { checkoutUrl } = await response.json()

      // Redirect to Lemon Squeezy checkout
      window.location.href = checkoutUrl
    } catch (error) {
      console.error('Checkout error:', error)
      toast({
        title: "Checkout Error",
        description: error instanceof Error ? error.message : "Failed to create checkout session. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setSelectedPlan(null)
    }
  }

  const getPrice = (plan: PlanFeatures) => {
    if (plan.plan_type === 'free') return { price: 0, period: '' }
    const price = billingCycle === 'monthly' ? plan.price_monthly_usd : plan.price_yearly_usd
    const period = billingCycle === 'monthly' ? '/month' : '/year'
    return { price, period }
  }

  const getSavings = (plan: PlanFeatures) => {
    if (plan.plan_type === 'free' || billingCycle === 'monthly') return null
    const monthlyTotal = plan.price_monthly_usd * 12
    const yearlyPrice = plan.price_yearly_usd
    const savings = monthlyTotal - yearlyPrice
    const percentage = Math.round((savings / monthlyTotal) * 100)
    return { amount: savings, percentage }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Choose Your Plan
          </DialogTitle>
          <p className="text-muted-foreground text-center">
            Unlock the full potential of AI-powered research
          </p>
        </DialogHeader>

        {/* Billing Cycle Toggle */}
        <div className="flex justify-center mb-6">
          <div className="bg-muted p-1 rounded-lg">
            <Button
              variant={billingCycle === 'monthly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setBillingCycle('monthly')}
              className="px-4"
            >
              Monthly
            </Button>
            <Button
              variant={billingCycle === 'yearly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setBillingCycle('yearly')}
              className="px-4"
            >
              Yearly
              <Badge variant="secondary" className="ml-2 text-xs">
                Save up to 17%
              </Badge>
            </Button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayPlans.map((plan) => {
            const Icon = planIcons[plan.plan_type]
            const isCurrentPlan = plan.plan_type === currentPlan
            const isPopular = plan.plan_type === 'pro'
            const { price, period } = getPrice(plan)
            const savings = getSavings(plan)

            return (
              <Card
                key={plan.id}
                className={`relative ${isPopular ? 'border-primary shadow-lg' : ''} ${
                  isCurrentPlan ? 'ring-2 ring-primary' : ''
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      Most Popular
                    </Badge>
                  </div>
                )}

                {isCurrentPlan && (
                  <div className="absolute -top-3 right-4">
                    <Badge variant="outline">Current Plan</Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className={`mx-auto mb-2 ${planColors[plan.plan_type]}`}>
                    <Icon size={32} />
                  </div>
                  <CardTitle className="text-xl">{plan.plan_name}</CardTitle>
                  <CardDescription>{plan.plan_description}</CardDescription>

                  <div className="mt-4">
                    <div className="text-3xl font-bold">
                      ${price}
                      <span className="text-lg font-normal text-muted-foreground">
                        {period}
                      </span>
                    </div>
                    {savings && (
                      <p className="text-sm text-green-600 mt-1">
                        Save ${savings.amount} ({savings.percentage}%)
                      </p>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-green-500" />
                      <span className="text-sm">
                        {plan.search_limit === -1 ? 'Unlimited' : plan.search_limit} searches
                        {plan.reset_period !== 'never' && ` per ${plan.reset_period.slice(0, -2)}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-green-500" />
                      <span className="text-sm">
                        {plan.max_history_items === -1 ? 'Unlimited' : plan.max_history_items} history items
                      </span>
                    </div>

                    {plan.can_export_results && (
                      <div className="flex items-center gap-2">
                        <Check size={16} className="text-green-500" />
                        <span className="text-sm">Export results</span>
                      </div>
                    )}

                    {plan.can_share_searches && (
                      <div className="flex items-center gap-2">
                        <Check size={16} className="text-green-500" />
                        <span className="text-sm">Share searches</span>
                      </div>
                    )}

                    {plan.has_api_access && (
                      <div className="flex items-center gap-2">
                        <Check size={16} className="text-green-500" />
                        <span className="text-sm">API access</span>
                      </div>
                    )}

                    {plan.has_priority_support && (
                      <div className="flex items-center gap-2">
                        <Check size={16} className="text-green-500" />
                        <span className="text-sm">Priority support</span>
                      </div>
                    )}
                  </div>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    variant={isCurrentPlan ? "outline" : "default"}
                    disabled={isCurrentPlan || isLoading}
                    onClick={() => handleUpgrade(plan.plan_type)}
                  >
                    {isLoading && selectedPlan === plan.plan_type ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : isCurrentPlan ? (
                      'Current Plan'
                    ) : plan.plan_type === 'free' ? (
                      'Get Started'
                    ) : (
                      `Upgrade to ${plan.plan_name}`
                    )}
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-8 border-t pt-6">
          <h3 className="text-lg font-semibold mb-4 text-center">Frequently Asked Questions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-1">Can I change plans anytime?</h4>
              <p className="text-muted-foreground">Yes, you can upgrade or downgrade your plan at any time.</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">What payment methods do you accept?</h4>
              <p className="text-muted-foreground">We accept all major credit cards and PayPal.</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Is there a free trial?</h4>
              <p className="text-muted-foreground">Start with our free plan and upgrade anytime.</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Do you offer refunds?</h4>
              <p className="text-muted-foreground">30-day money-back guarantee on all paid plans.</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
*/
