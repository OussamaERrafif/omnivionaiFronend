/**
 * Subscription context provider
 * Manages global subscription state across the application
 * 
 * OWNERSHIP MODEL:
 * - Backend: Authoritative source for all subscription data
 * - Frontend: READ-ONLY display + trigger API calls
 * - No direct Supabase writes to subscriptions from frontend
 */

"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './auth-context'
import { createClient } from '@/lib/supabase/client'
import {
  getUserSubscription,
  getPlanFeatures,
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
  const { user } = useAuth()
  const supabase = createClient()

  /**
   * Refresh subscription data from database (READ-ONLY)
   * 
   * Frontend reads subscription for display purposes only.
   * Backend is authoritative for all writes.
   */
  const refreshSubscription = useCallback(async () => {
    try {
      setError(null)
      
      if (!user) {
        setSubscription(null)
        setPlanFeatures(null)
        setIsLoading(false)
        return
      }

      // Get subscription (READ-ONLY)
      const sub = await getUserSubscription()
      setSubscription(sub)

      // Get plan features (READ-ONLY, cached locally for UX)
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
  }, [user])

  /**
   * Check quota - REMOVED
   * 
   * Quota checks now happen on backend only.
   * Backend returns quota info in response headers.
   * Frontend reads quota from subscription data (updated via real-time).
   */
  const checkQuota = useCallback(async (): Promise<QuotaCheckResult | null> => {
    console.warn(
      '⚠️ DEPRECATED: checkQuota called from frontend. ' +
      'Quota checks now happen on backend. ' +
      'Read quota from subscription.searches_remaining instead.'
    )
    
    // Return current subscription quota for backward compatibility
    if (subscription) {
      return {
        can_search: (subscription.searches_remaining || 0) > 0,
        searches_remaining: subscription.searches_remaining || 0,
        plan_type: subscription.plan_type
      } as QuotaCheckResult
    }
    
    return null
  }, [subscription])

  /**
   * Increment search - REMOVED
   * 
   * Search count is now incremented atomically by backend.
   * Frontend should NOT call this directly.
   * Subscription will update via real-time listener.
   */
  const incrementSearch = useCallback(async (
    searchId: string,
    queryPreview?: string
  ): Promise<IncrementSearchResult | null> => {
    console.warn(
      '⚠️ DEPRECATED: incrementSearch called from frontend. ' +
      'Search counts are now incremented by backend automatically. ' +
      'Remove this call from your code.'
    )
    
    // No-op - backend handles this now
    // Real-time listener will update subscription state
    return null
  }, [])

  // Load subscription when user changes
  useEffect(() => {
    refreshSubscription()
  }, [refreshSubscription])

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
