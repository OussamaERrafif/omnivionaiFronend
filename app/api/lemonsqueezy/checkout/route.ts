import { NextRequest, NextResponse } from 'next/server'
import { createCheckoutSession } from '@/lib/lemonsqueezy'
import { createClient } from '@/lib/supabase/server'
import { PlanType } from '@/types/subscription'

export async function POST(request: NextRequest) {
  try {
    const { planType, billingCycle } = await request.json()

    if (!planType || !billingCycle) {
      return NextResponse.json(
        { error: 'Missing required fields: planType, billingCycle' },
        { status: 400 }
      )
    }

    // Validate plan type
    const validPlanTypes: PlanType[] = ['free', 'pro', 'enterprise', 'trial']
    if (!validPlanTypes.includes(planType)) {
      return NextResponse.json(
        { error: 'Invalid plan type' },
        { status: 400 }
      )
    }

    if (planType === 'free' || planType === 'trial') {
      return NextResponse.json(
        { error: 'Free and trial plans do not require checkout' },
        { status: 400 }
      )
    }

    // Validate billing cycle
    if (!['monthly', 'yearly'].includes(billingCycle)) {
      return NextResponse.json(
        { error: 'Invalid billing cycle. Must be monthly or yearly' },
        { status: 400 }
      )
    }

    // Get user from session
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Debug: Log environment variables
    console.log('Environment variables check:')
    console.log('NEXT_PUBLIC_LEMON_SQUEEZY_STORE_ID:', process.env.NEXT_PUBLIC_LEMON_SQUEEZY_STORE_ID)
    console.log('NEXT_PUBLIC_LEMON_SQUEEZY_API_KEY exists:', !!process.env.NEXT_PUBLIC_LEMON_SQUEEZY_API_KEY)
    console.log('All env vars starting with LEMON:', Object.keys(process.env).filter(key => key.includes('LEMON')))

    // Get base URL from request
    const protocol = request.headers.get('x-forwarded-proto') || 'http'
    const host = request.headers.get('host') || 'localhost:3000'
    const baseUrl = `${protocol}://${host}`

    // Get plan pricing (this should come from your database or config)
    const planPrices = {
      pro: { monthly: 19, yearly: 190 },
      enterprise: { monthly: 99, yearly: 990 },
    }

    const price = planPrices[planType as keyof typeof planPrices]?.[billingCycle as 'monthly' | 'yearly']

    if (!price) {
      return NextResponse.json(
        { error: 'Invalid plan configuration' },
        { status: 400 }
      )
    }

    // Create checkout session
    const checkoutUrl = await createCheckoutSession({
      planType,
      billingCycle,
      price,
      userId: user.id,
      userEmail: user.email,
      baseUrl,
    })

    return NextResponse.json({
      checkoutUrl,
      success: true,
    })

  } catch (error) {
    console.error('Checkout API error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}