import {
  lemonSqueezySetup,
  createCheckout,
  getSubscription as lsGetSubscription,
  cancelSubscription as lsCancelSubscription,
  updateSubscription as lsUpdateSubscription,
} from '@lemonsqueezy/lemonsqueezy.js'
import { PlanType } from '@/types/subscription'

// Initialize Lemon Squeezy
lemonSqueezySetup({
  apiKey: process.env.LEMON_SQUEEZY_API_KEY!,
})

interface CreateCheckoutParams {
  planType: PlanType
  billingCycle: 'monthly' | 'yearly'
  price: number
  userId?: string
  userEmail?: string
  baseUrl?: string
}

// Lemon Squeezy product/variant IDs - these need to be configured in your Lemon Squeezy dashboard
const LEMON_SQUEEZY_PRODUCTS = {
  pro: {
    monthly: process.env.NEXT_PUBLIC_LEMON_SQUEEZY_PRO_MONTHLY_VARIANT_ID,
    yearly: process.env.NEXT_PUBLIC_LEMON_SQUEEZY_PRO_YEARLY_VARIANT_ID,
  },
  enterprise: {
    monthly: process.env.NEXT_PUBLIC_LEMON_SQUEEZY_ENTERPRISE_MONTHLY_VARIANT_ID,
    yearly: process.env.NEXT_PUBLIC_LEMON_SQUEEZY_ENTERPRISE_YEARLY_VARIANT_ID,
  },
}

export async function createCheckoutSession({
  planType,
  billingCycle,
  price,
  userId,
  userEmail,
  baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
}: CreateCheckoutParams): Promise<string> {
  try {
    if (planType === 'free' || planType === 'trial') {
      throw new Error('Free and trial plans do not require checkout')
    }

    const productConfig = LEMON_SQUEEZY_PRODUCTS[planType]
    if (!productConfig) {
      throw new Error(`No product configuration found for plan: ${planType}`)
    }

    const variantId = productConfig[billingCycle]
    if (!variantId) {
      throw new Error(`No variant ID configured for ${planType} ${billingCycle}. Please set NEXT_PUBLIC_LEMON_SQUEEZY_${planType.toUpperCase()}_${billingCycle.toUpperCase()}_VARIANT_ID in your environment variables.`)
    }

    console.log(`Creating checkout for ${planType} ${billingCycle} with variant ID: ${variantId}`)

    // Create checkout session
    const checkout = await createCheckout(
      process.env.NEXT_PUBLIC_LEMON_SQUEEZY_STORE_ID!,
      variantId,
      {
        checkoutData: {
          custom: {
            user_id: userId,
            plan_type: planType,
            billing_cycle: billingCycle,
          },
        },
        productOptions: {
          redirectUrl: `${baseUrl}/billing/success`,
          receiptButtonText: 'Go to Dashboard',
          receiptLinkUrl: `${baseUrl}/dashboard`,
        },
        checkoutOptions: {
          embed: false,
          media: false,
          logo: true,
        },
        ...(userEmail && {
          customer: {
            email: userEmail,
          },
        }),
      }
    )

    console.log('Lemon Squeezy response:', JSON.stringify(checkout, null, 2))

    // Try different ways to access the checkout URL
    let checkoutUrl: string | undefined

    // Method 1: Direct access (SDK might return data directly)
    if (typeof checkout === 'object' && checkout !== null) {
      checkoutUrl = (checkout as any).url || (checkout as any).checkout_url || (checkout as any).data?.url
    }

    // Method 2: Standard API response format (data.data.attributes.url)
    if (!checkoutUrl && (checkout as any)?.data?.data?.attributes?.url) {
      checkoutUrl = (checkout as any).data.data.attributes.url
    }

    // Method 3: Alternative response format
    if (!checkoutUrl && (checkout as any)?.attributes?.url) {
      checkoutUrl = (checkout as any).attributes.url
    }

    // Method 4: Check if the response is the data object directly
    if (!checkoutUrl && (checkout as any)?.data?.attributes?.url) {
      checkoutUrl = (checkout as any).data.attributes.url
    }

    if (!checkoutUrl) {
      console.error('Could not find checkout URL in response. Available keys:', Object.keys(checkout as any))
      throw new Error('Failed to extract checkout URL from Lemon Squeezy response')
    }

    console.log('Successfully extracted checkout URL:', checkoutUrl)
    return checkoutUrl
  } catch (error) {
    console.error('Lemon Squeezy checkout creation error:', error)
    throw new Error('Failed to create checkout session')
  }
}

export async function getSubscription(subscriptionId: string) {
  try {
    const subscription = await lsGetSubscription(subscriptionId)
    return subscription
  } catch (error) {
    console.error('Failed to get subscription:', error)
    throw error
  }
}

export async function cancelSubscription(subscriptionId: string) {
  try {
    const result = await lsCancelSubscription(subscriptionId)
    return result
  } catch (error) {
    console.error('Failed to cancel subscription:', error)
    throw error
  }
}

export async function updateSubscription(subscriptionId: string, updates: any) {
  try {
    const result = await lsUpdateSubscription(subscriptionId, updates)
    return result
  } catch (error) {
    console.error('Failed to update subscription:', error)
    throw error
  }
}

// Webhook verification
export function verifyWebhookSignature(payload: string, signature: string): boolean {
  // Implement webhook signature verification
  // This should use the webhook secret from Lemon Squeezy
  const crypto = require('crypto')
  const hmac = crypto.createHmac('sha256', process.env.LEMON_SQUEEZY_WEBHOOK_SECRET!)
  hmac.update(payload)
  const expectedSignature = hmac.digest('hex')

  return signature === expectedSignature
}

// Types for webhook events
export interface LemonSqueezyWebhookEvent {
  event_name: string
  data: {
    id: string
    type: string
    attributes: any
    relationships?: any
  }
  meta?: {
    custom_data?: {
      user_id?: string
      plan_type?: PlanType
      billing_cycle?: 'monthly' | 'yearly'
    }
  }
}