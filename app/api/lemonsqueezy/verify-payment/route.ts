import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const checkoutId = searchParams.get('checkout_id')

    if (!checkoutId) {
      return NextResponse.json(
        { error: 'Missing checkout_id parameter' },
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

    // Check if subscription was updated in the database
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'Subscription not found. Webhook may not have processed yet.' },
        { status: 404 }
      )
    }

    // Check if subscription is active and upgraded
    if (subscription.plan_status === 'active' && subscription.plan_type !== 'free') {
      return NextResponse.json({
        success: true,
        subscription: {
          plan_type: subscription.plan_type,
          plan_status: subscription.plan_status,
          search_limit: subscription.search_limit,
          next_reset_date: subscription.next_reset_date,
        },
      })
    }

    return NextResponse.json(
      { error: 'Subscription not yet activated' },
      { status: 202 } // Accepted but not ready
    )

  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    )
  }
}