/**
 * Supabase subscription and quota management utilities
 * Handles all database operations for the search limit feature
 */

import { createClient } from './client'
import type {
  UserSubscription,
  PlanFeatures,
  QuotaCheckResult,
  IncrementSearchResult,
  SearchUsageLog,
  PlanType,
} from '@/types/subscription'

/**
 * Get the current user's subscription
 */
export async function getUserSubscription(): Promise<UserSubscription | null> {
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('Failed to get user:', userError)
      return null
    }
    
    // Get subscription
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    if (error) {
      console.error('Failed to get subscription:', error)
      return null
    }
    
    return data as UserSubscription
  } catch (error) {
    console.error('Error getting user subscription:', error)
    return null
  }
}

/**
 * Get plan features for a specific plan type
 */
export async function getPlanFeatures(planType: PlanType): Promise<PlanFeatures | null> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('plan_features')
      .select('*')
      .eq('plan_type', planType)
      .single()
    
    if (error) {
      console.error('Failed to get plan features:', error)
      return null
    }
    
    return data as PlanFeatures
  } catch (error) {
    console.error('Error getting plan features:', error)
    return null
  }
}

/**
 * Get all available plan features for comparison
 */
export async function getAllPlanFeatures(): Promise<PlanFeatures[]> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('plan_features')
      .select('*')
      .eq('is_visible', true)
      .order('display_order', { ascending: true })
    
    if (error) {
      console.error('Failed to get plan features:', error)
      return []
    }
    
    return data as PlanFeatures[]
  } catch (error) {
    console.error('Error getting all plan features:', error)
    return []
  }
}

/**
 * Check if user can perform a search (quota check)
 */
export async function checkSearchQuota(): Promise<QuotaCheckResult | null> {
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('Failed to get user:', userError)
      return null
    }
    
    // Call the database function
    const { data, error } = await supabase
      .rpc('check_search_quota', { p_user_id: user.id })
    
    if (error) {
      console.error('Failed to check search quota:', error)
      return null
    }
    
    // RPC returns an array with single result
    return data && data.length > 0 ? data[0] as QuotaCheckResult : null
  } catch (error) {
    console.error('Error checking search quota:', error)
    return null
  }
}

/**
 * Increment search count after successful search
 */
export async function incrementSearchCount(
  searchId: string,
  queryPreview?: string
): Promise<IncrementSearchResult | null> {
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('Failed to get user:', userError)
      return null
    }
    
    // Call the database function
    const { data, error } = await supabase
      .rpc('increment_search_count', {
        p_user_id: user.id,
        p_search_id: searchId,
        p_query_preview: queryPreview || null
      })
    
    if (error) {
      console.error('Failed to increment search count:', error)
      return null
    }
    
    // RPC returns an array with single result
    return data && data.length > 0 ? data[0] as IncrementSearchResult : null
  } catch (error) {
    console.error('Error incrementing search count:', error)
    return null
  }
}

/**
 * Get user's search usage logs (recent history)
 */
export async function getSearchUsageLogs(limit: number = 20): Promise<SearchUsageLog[]> {
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return []
    }
    
    const { data, error } = await supabase
      .from('search_usage_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('searched_at', { ascending: false })
      .limit(limit)
    
    if (error) {
      console.error('Failed to get search usage logs:', error)
      return []
    }
    
    return data as SearchUsageLog[]
  } catch (error) {
    console.error('Error getting search usage logs:', error)
    return []
  }
}

/**
 * Calculate time remaining until quota reset
 */
export function getTimeUntilReset(resetDate: string): {
  hours: number
  minutes: number
  formatted: string
} {
  const now = new Date()
  const reset = new Date(resetDate)
  const diffMs = reset.getTime() - now.getTime()
  
  if (diffMs <= 0) {
    return { hours: 0, minutes: 0, formatted: 'Resetting now...' }
  }
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  
  if (hours > 24) {
    const days = Math.floor(hours / 24)
    return {
      hours,
      minutes,
      formatted: `${days} day${days > 1 ? 's' : ''}`
    }
  }
  
  if (hours > 0) {
    return {
      hours,
      minutes,
      formatted: `${hours}h ${minutes}m`
    }
  }
  
  return {
    hours: 0,
    minutes,
    formatted: `${minutes}m`
  }
}

/**
 * Format reset date for display
 */
export function formatResetDate(resetDate: string): string {
  const date = new Date(resetDate)
  const now = new Date()
  
  // Check if it's today
  if (date.toDateString() === now.toDateString()) {
    return `Today at ${date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })}`
  }
  
  // Check if it's tomorrow
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (date.toDateString() === tomorrow.toDateString()) {
    return `Tomorrow at ${date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })}`
  }
  
  // Otherwise show full date
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

/**
 * Get color scheme based on searches remaining
 */
export function getQuotaColorScheme(searchesRemaining: number, searchLimit: number): {
  badge: string
  text: string
  bg: string
  border: string
  icon: string
} {
  if (searchesRemaining === 0) {
    return {
      badge: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800',
      text: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-950/20',
      border: 'border-red-200 dark:border-red-800',
      icon: 'text-red-500'
    }
  }
  
  if (searchesRemaining === 1) {
    return {
      badge: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-800',
      text: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-50 dark:bg-yellow-950/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      icon: 'text-yellow-500'
    }
  }
  
  if (searchesRemaining === 2) {
    return {
      badge: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800',
      text: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-50 dark:bg-orange-950/20',
      border: 'border-orange-200 dark:border-orange-800',
      icon: 'text-orange-500'
    }
  }
  
  // Pro/unlimited plan
  if (searchLimit > 100) {
    return {
      badge: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800',
      text: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/20',
      border: 'border-blue-200 dark:border-blue-800',
      icon: 'text-blue-500'
    }
  }
  
  // Normal state
  return {
    badge: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800',
    text: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-950/20',
    border: 'border-green-200 dark:border-green-800',
    icon: 'text-green-500'
  }
}

/**
 * Check if user is on free plan
 */
export function isFreePlan(planType: PlanType): boolean {
  return planType === 'free'
}

/**
 * Check if user has unlimited searches
 */
export function hasUnlimitedSearches(searchLimit: number): boolean {
  return searchLimit > 100
}

/**
 * Get plan display name
 */
export function getPlanDisplayName(planType: PlanType): string {
  const names: Record<PlanType, string> = {
    free: 'Free Plan',
    pro: 'Pro Plan',
    enterprise: 'Enterprise Plan',
    trial: 'Trial Plan'
  }
  return names[planType] || planType
}
