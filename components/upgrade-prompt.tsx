/**
 * Upgrade Prompt Component
 * Displays upgrade options and plan comparison
 */

"use client"

import React, { useEffect, useState } from 'react'
import { Check, Sparkles, TrendingUp, X } from 'lucide-react'
import { LiquidGlassButton } from '@/components/ui/liquid-glass-button'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getAllPlanFeatures } from '@/lib/supabase/subscriptions'
import type { PlanFeatures } from '@/types/subscription'
import { cn } from '@/lib/utils'

interface UpgradePromptProps {
  className?: string
  variant?: 'card' | 'full'
  onUpgrade?: (planType: string) => void
}

export function UpgradePrompt({ className, variant = 'card', onUpgrade }: UpgradePromptProps) {
  const [plans, setPlans] = useState<PlanFeatures[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadPlans = async () => {
      const allPlans = await getAllPlanFeatures()
      // Filter out trial and only show free, pro, enterprise
      const displayPlans = allPlans.filter(p => p.plan_type !== 'trial')
      setPlans(displayPlans)
      setIsLoading(false)
    }
    loadPlans()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (variant === 'card') {
    const proPlan = plans.find(p => p.plan_type === 'pro')
    if (!proPlan) return null

    return (
      <Card className={cn('border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background', className)}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Upgrade to Pro</CardTitle>
              <CardDescription>Unlock unlimited searches</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {[
              'Unlimited AI searches',
              'Export & share results',
              'Unlimited history',
              'Priority support',
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-3xl font-bold">${proPlan.price_monthly_usd}</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <LiquidGlassButton
              onClick={() => onUpgrade?.(proPlan.plan_type)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Upgrade Now
            </LiquidGlassButton>
            <p className="text-xs text-center text-muted-foreground mt-2">
              Save 20% with annual billing
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Full comparison view
  return (
    <div className={cn('w-full', className)}>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Choose Your Plan</h2>
        <p className="text-muted-foreground">
          Upgrade to unlock unlimited searches and premium features
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isPopular = plan.plan_type === 'pro'
          const isFree = plan.plan_type === 'free'

          return (
            <Card
              key={plan.id}
              className={cn(
                'relative',
                isPopular && 'border-blue-500 dark:border-blue-400 shadow-lg scale-105'
              )}
            >
              {isPopular && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                  <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    MOST POPULAR
                  </span>
                </div>
              )}

              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {!isFree && <Sparkles className="h-5 w-5 text-blue-500" />}
                  {plan.plan_name}
                </CardTitle>
                <CardDescription>{plan.plan_description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Pricing */}
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">
                      ${plan.price_monthly_usd}
                    </span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  {plan.price_yearly_usd > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      or ${plan.price_yearly_usd}/year (save 20%)
                    </p>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <span>
                      {plan.search_limit > 100
                        ? 'Unlimited searches'
                        : `${plan.search_limit} searches per ${plan.reset_period}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    {plan.can_save_history ? (
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-red-500 flex-shrink-0" />
                    )}
                    <span>
                      {plan.max_history_items > 100
                        ? 'Unlimited history'
                        : `Up to ${plan.max_history_items} saved searches`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    {plan.can_export_results ? (
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-red-500 flex-shrink-0" />
                    )}
                    <span>Export & share results</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    {plan.can_share_searches ? (
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-red-500 flex-shrink-0" />
                    )}
                    <span>Share searches with team</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    {plan.has_api_access ? (
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-red-500 flex-shrink-0" />
                    )}
                    <span>API access</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    {plan.has_priority_support ? (
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                    ) : (
                      <Check className="h-4 w-4 text-gray-400 dark:text-gray-600 flex-shrink-0" />
                    )}
                    <span className={!plan.has_priority_support ? 'text-muted-foreground' : ''}>
                      {plan.has_priority_support ? 'Priority support' : 'Standard support'}
                    </span>
                  </div>
                </div>

                {/* CTA Button */}
                <LiquidGlassButton
                  onClick={() => onUpgrade?.(plan.plan_type)}
                  variant={isFree ? 'outline' : isPopular ? 'default' : 'secondary'}
                  className={cn(
                    'w-full',
                    isPopular && 'bg-blue-600 hover:bg-blue-700 text-white'
                  )}
                  disabled={isFree}
                >
                  {isFree ? 'Current Plan' : 'Upgrade to ' + plan.plan_name}
                </LiquidGlassButton>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="text-center mt-8">
        <p className="text-sm text-muted-foreground">
          All plans include secure encryption, auto-save history, and 24/7 uptime
        </p>
      </div>
    </div>
  )
}

/**
 * Simple upgrade CTA button
 */
export function UpgradeButton({ className }: { className?: string }) {
  return (
    <LiquidGlassButton className={cn('bg-blue-600 hover:bg-blue-700 text-white', className)}>
      <Sparkles className="h-4 w-4 mr-2" />
      Upgrade to Pro
    </LiquidGlassButton>
  )
}
