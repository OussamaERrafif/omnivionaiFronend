/**
 * Subscription context provider
 * Manages global subscription state across the application
 */

"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  getUserSubscription,
  getPlanFeatures,
  checkSearchQuota,
  incrementSearchCount,
} from '@/lib/supabase/subscriptions'
import type {
  UserSubscription,
  PlanFeatures,
  QuotaCheckResult,
  IncrementSearchResult,
  SubscriptionContextState,
} from '@/types/subscription'

const SubscriptionContext = createContext<SubscriptionContextState | undefined>(undefined)

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null)
  const [planFeatures, setPlanFeatures] = useState<PlanFeatures | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  /**
   * Refresh subscription data from database
   */
  const refreshSubscription = useCallback(async () => {
    try {
      setError(null)
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setSubscription(null)
        setPlanFeatures(null)
        setIsLoading(false)
        return
      }

      // Get subscription
      const sub = await getUserSubscription()
      setSubscription(sub)

      // Get plan features
      if (sub) {
        const features = await getPlanFeatures(sub.plan_type)
        setPlanFeatures(features)
      }
    } catch (err) {
      console.error('Error refreshing subscription:', err)
      setError('Failed to load subscription data')
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  /**
   * Check if user can perform a search
   */
  const checkQuota = useCallback(async (): Promise<QuotaCheckResult | null> => {
    try {
      const result = await checkSearchQuota()
      
      // Refresh subscription to get updated counts
      if (result) {
        await refreshSubscription()
      }
      
      return result
    } catch (err) {
      console.error('Error checking quota:', err)
      return null
    }
  }, [refreshSubscription])

  /**
   * Increment search count after successful search
   */
  const incrementSearch = useCallback(async (
    searchId: string,
    queryPreview?: string
  ): Promise<IncrementSearchResult | null> => {
    try {
      const result = await incrementSearchCount(searchId, queryPreview)
      
      // Refresh subscription to get updated counts
      if (result) {
        await refreshSubscription()
      }
      
      return result
    } catch (err) {
      console.error('Error incrementing search:', err)
      return null
    }
  }, [refreshSubscription])

  // Load subscription on mount and auth changes
  useEffect(() => {
    refreshSubscription()

    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN') {
          await refreshSubscription()
        } else if (event === 'SIGNED_OUT') {
          setSubscription(null)
          setPlanFeatures(null)
        }
      }
    )

    return () => {
      authSubscription.unsubscribe()
    }
  }, [supabase, refreshSubscription])

  // Listen for subscription updates via real-time
  useEffect(() => {
    if (!subscription?.user_id) return

    const channel = supabase
      .channel('subscription-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_subscriptions',
          filter: `user_id=eq.${subscription.user_id}`,
        },
        () => {
          // Refresh subscription when database changes
          refreshSubscription()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [subscription?.user_id, supabase, refreshSubscription])

  const value: SubscriptionContextState = {
    subscription,
    planFeatures,
    isLoading,
    error,
    refreshSubscription,
    checkQuota,
    incrementSearch,
  }

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  )
}

/**
 * Hook to use subscription context
 */
export function useSubscription() {
  const context = useContext(SubscriptionContext)
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider')
  }
  return context
}

/**
 * Hook to get quota information
 */
export function useQuota() {
  const { subscription, checkQuota, incrementSearch } = useSubscription()

  const canSearch = subscription ? subscription.searches_remaining > 0 : true
  const searchesRemaining = subscription?.searches_remaining ?? 0
  const searchesUsed = subscription?.searches_used ?? 0
  const searchLimit = subscription?.search_limit ?? 3
  const planType = subscription?.plan_type ?? 'free'
  const resetDate = subscription?.next_reset_date ?? ''

  return {
    canSearch,
    searchesRemaining,
    searchesUsed,
    searchLimit,
    planType,
    resetDate,
    checkQuota,
    incrementSearch,
  }
}
