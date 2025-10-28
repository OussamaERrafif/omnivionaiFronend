/**
 * Subscription Context Provider - Read-Only
 * 
 * OWNERSHIP MODEL (Backend-Authoritative):
 * - Backend: Owns ALL subscription writes (quota, plan changes, billing)
 * - Frontend: Reads from backend API + real-time updates
 * - No direct database writes from frontend
 * 
 * Features:
 * - Real-time subscription updates via Supabase
 * - Local caching for fast UX
 * - Automatic refresh on auth changes
 * - Read-only quota display
 */

"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './auth-context'
import { createClient } from '@/lib/supabase/client'
import { BackendAPI } from '@/lib/backend-api'
import type {
  UserSubscription,
  PlanFeatures,
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
   * Fetch subscription from database (READ-ONLY)
   * 
   * This reads the current subscription state.
   * Backend is authoritative - updates happen via webhooks/backend API.
   */
  const fetchSubscription = useCallback(async () => {
    if (!user) return null

    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.error('Error fetching subscription:', error)
        return null
      }

      return data as UserSubscription
    } catch (err) {
      console.error('Failed to fetch subscription:', err)
      return null
    }
  }, [user, supabase])

  /**
   * Fetch plan features from database (READ-ONLY, public data)
   * 
   * Plan features are public and can be cached aggressively.
   */
  const fetchPlanFeatures = useCallback(async (planType: string) => {
    try {
      const { data, error } = await supabase
        .from('plan_features')
        .select('*')
        .eq('plan_type', planType)
        .single()

      if (error) {
        console.error('Error fetching plan features:', error)
        return null
      }

      return data as PlanFeatures
    } catch (err) {
      console.error('Failed to fetch plan features:', err)
      return null
    }
  }, [supabase])

  /**
   * Refresh subscription and plan features (READ-ONLY)
   * 
   * Call this when you need fresh data from backend.
   * Real-time updates will also trigger this automatically.
   */
  const refreshSubscription = useCallback(async () => {
    try {
      setError(null)
      setIsLoading(true)

      if (!user) {
        setSubscription(null)
        setPlanFeatures(null)
        setIsLoading(false)
        return
      }

      // Fetch subscription
      const sub = await fetchSubscription()
      setSubscription(sub)

      // Fetch plan features if we have a subscription
      if (sub) {
        const features = await fetchPlanFeatures(sub.plan_type)
        setPlanFeatures(features)
      }
    } catch (err) {
      console.error('Error refreshing subscription:', err)
      setError('Failed to load subscription data')
    } finally {
      setIsLoading(false)
    }
  }, [user, fetchSubscription, fetchPlanFeatures])

  /**
   * Get fresh quota status from backend API
   * 
   * This bypasses cache and gets real-time quota from backend.
   * Use this before critical operations.
   */
  const getQuotaStatus = useCallback(async () => {
    try {
      const quotaStatus = await BackendAPI.getQuotaStatus()
      
      // Update local subscription state with fresh quota
      if (subscription) {
        setSubscription({
          ...subscription,
          searches_used: quotaStatus.searches_used,
          searches_remaining: quotaStatus.searches_remaining,
        })
      }
      
      return quotaStatus
    } catch (err) {
      console.error('Failed to get quota status:', err)
      throw err
    }
  }, [subscription])

  /**
   * Initialize subscription data on mount and auth changes
   */
  useEffect(() => {
    refreshSubscription()
  }, [refreshSubscription])

  /**
   * Set up real-time subscription updates
   * 
   * Listen for changes to user_subscriptions table.
   * When backend updates quota/plan, frontend updates automatically.
   */
  useEffect(() => {
    if (!user) return

    // Subscribe to real-time changes
    const channel = supabase
      .channel('subscription-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'user_subscriptions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('📡 Real-time subscription update:', payload)
          
          if (payload.eventType === 'DELETE') {
            setSubscription(null)
          } else {
            // UPDATE or INSERT
            const newSub = payload.new as UserSubscription
            setSubscription(newSub)
            
            // Update plan features if plan changed
            if (newSub.plan_type !== subscription?.plan_type) {
              fetchPlanFeatures(newSub.plan_type).then(setPlanFeatures)
            }
          }
        }
      )
      .subscribe()

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase, subscription?.plan_type, fetchPlanFeatures])

  /**
   * Helper: Check if user has quota remaining
   */
  const hasQuota = useCallback(() => {
    return (subscription?.searches_remaining || 0) > 0
  }, [subscription])

  /**
   * Helper: Get quota percentage
   */
  const getQuotaPercentage = useCallback(() => {
    if (!subscription || !planFeatures) return 0
    
    const total = planFeatures.search_limit
    const used = subscription.searches_used
    
    if (total === 0) return 0
    return (used / total) * 100
  }, [subscription, planFeatures])

  // Context value
  const value: SubscriptionContextState = {
    subscription,
    planFeatures,
    isLoading,
    error,
    
    // Actions (read-only + refresh)
    refreshSubscription,
    getQuotaStatus,
    
    // Helpers
    hasQuota,
    getQuotaPercentage,
    
    // Deprecated (removed)
    checkQuota: async () => {
      console.warn(
        '⚠️ DEPRECATED: checkQuota() is no longer supported.\n' +
        'Backend checks quota automatically during search.\n' +
        'Use hasQuota() or subscription.searches_remaining instead.'
      )
      return {
        can_search: hasQuota(),
        searches_remaining: subscription?.searches_remaining || 0,
        plan_type: subscription?.plan_type || 'free',
        reset_date: subscription?.billing_cycle_end || '',
        message: 'Use backend API for quota checks'
      }
    },
    
    incrementSearch: async () => {
      console.error(
        '❌ DEPRECATED: incrementSearch() is no longer supported.\n' +
        'Backend handles quota decrement automatically during search.\n' +
        'Use BackendAPI.executeSearch() instead.'
      )
      throw new Error('Frontend cannot increment search count. Use backend API.')
    }
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
 * Migration Guide for Developers
 * 
 * OLD (Direct Database Writes):
 * ❌ const { can_search } = await checkQuota()
 * ❌ await incrementSearch(searchId, query)
 * ❌ await supabase.from('user_subscriptions').update(...)
 * 
 * NEW (Backend-Authoritative):
 * ✅ const result = await BackendAPI.executeSearch(query)
 * ✅ const quotaStatus = await subscription.getQuotaStatus()
 * ✅ const hasQuota = subscription.hasQuota()
 * ✅ Display: {subscription.searches_remaining} searches left
 * 
 * Benefits:
 * - No quota bypass possible
 * - Atomic operations prevent race conditions
 * - Backend enforces all business rules
 * - Real-time updates for instant UI feedback
 */
