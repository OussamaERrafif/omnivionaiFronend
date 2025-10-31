import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyWebhookSignature, LemonSqueezyWebhookEvent } from '@/lib/lemonsqueezy'
import { PlanType } from '@/types/subscription'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing webhook signature' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature)) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      )
    }

    const event: LemonSqueezyWebhookEvent = JSON.parse(body)

    console.log('Lemon Squeezy webhook received:', event.event_name)

    const supabase = await createClient()

    switch (event.event_name) {
      case 'order_created':
        await handleOrderCreated(supabase, event)
        break

      case 'subscription_created':
        await handleSubscriptionCreated(supabase, event)
        break

      case 'subscription_updated':
        await handleSubscriptionUpdated(supabase, event)
        break

      case 'subscription_cancelled':
        await handleSubscriptionCancelled(supabase, event)
        break

      case 'subscription_expired':
        await handleSubscriptionExpired(supabase, event)
        break

      default:
        console.log('Unhandled webhook event:', event.event_name)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleOrderCreated(supabase: any, event: LemonSqueezyWebhookEvent) {
  const order = event.data
  const customData = event.meta?.custom_data

  if (!customData?.user_id) return

  // Update user subscription based on the order
  const planType = customData.plan_type as PlanType
  const billingCycle = customData.billing_cycle

  // Calculate next reset date based on billing cycle
  const now = new Date()
  const nextReset = new Date(now)
  if (billingCycle === 'yearly') {
    nextReset.setFullYear(now.getFullYear() + 1)
  } else {
    nextReset.setMonth(now.getMonth() + 1)
  }

  // Get plan limits
  const planLimits = {
    free: { search_limit: 10, reset_period: 'monthly' },
    pro: { search_limit: 500, reset_period: 'monthly' },
    enterprise: { search_limit: 5000, reset_period: 'monthly' },
    trial: { search_limit: 50, reset_period: 'monthly' },
  }

  const limits = planLimits[planType]

  const { error } = await supabase
    .from('user_subscriptions')
    .upsert({
      user_id: customData.user_id,
      plan_type: planType,
      plan_status: 'active',
      search_limit: limits.search_limit,
      searches_used: 0,
      searches_remaining: limits.search_limit,
      reset_period: limits.reset_period,
      last_reset_date: now.toISOString(),
      next_reset_date: nextReset.toISOString(),
      billing_cycle_start: now.toISOString(),
      billing_cycle_end: nextReset.toISOString(),
      updated_at: now.toISOString(),
    })

  if (error) {
    console.error('Failed to update subscription on order created:', error)
  }
}

async function handleSubscriptionCreated(supabase: any, event: LemonSqueezyWebhookEvent) {
  // Similar to order created but for subscription creation
  await handleOrderCreated(supabase, event)
}

async function handleSubscriptionUpdated(supabase: any, event: LemonSqueezyWebhookEvent) {
  const subscription = event.data
  const customData = event.meta?.custom_data

  if (!customData?.user_id) return

  // Handle subscription updates (pause, resume, etc.)
  const status = subscription.attributes.status
  const planStatus = status === 'active' ? 'active' : 'cancelled'

  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      plan_status: planStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', customData.user_id)

  if (error) {
    console.error('Failed to update subscription status:', error)
  }
}

async function handleSubscriptionCancelled(supabase: any, event: LemonSqueezyWebhookEvent) {
  const customData = event.meta?.custom_data

  if (!customData?.user_id) return

  // Downgrade to free plan
  const freeLimits = { search_limit: 10, reset_period: 'monthly' as const }
  const now = new Date()

  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      plan_type: 'free',
      plan_status: 'cancelled',
      search_limit: freeLimits.search_limit,
      searches_used: 0,
      searches_remaining: freeLimits.search_limit,
      reset_period: freeLimits.reset_period,
      last_reset_date: now.toISOString(),
      next_reset_date: now.toISOString(), // Immediate reset
      billing_cycle_end: now.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq('user_id', customData.user_id)

  if (error) {
    console.error('Failed to cancel subscription:', error)
  }
}

async function handleSubscriptionExpired(supabase: any, event: LemonSqueezyWebhookEvent) {
  // Same as cancelled
  await handleSubscriptionCancelled(supabase, event)
}