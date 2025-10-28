/**
 * TypeScript types for subscription and billing system
 * Corresponds to Supabase database tables
 */

// Plan types available in the system
export type PlanType = 'free' | 'pro' | 'enterprise' | 'trial'

// Subscription status
export type PlanStatus = 'active' | 'cancelled' | 'expired' | 'suspended'

// Reset periods
export type ResetPeriod = 'daily' | 'weekly' | 'monthly' | 'never'

// Search status types
export type SearchStatus = 'success' | 'blocked' | 'failed' | 'cancelled'

// Reset types
export type ResetType = 'scheduled' | 'manual' | 'upgrade' | 'downgrade'

/**
 * User subscription record from database
 */
export interface UserSubscription {
  id: string
  user_id: string
  plan_type: PlanType
  plan_status: PlanStatus
  search_limit: number
  searches_used: number
  searches_remaining: number
  reset_period: ResetPeriod
  last_reset_date: string
  next_reset_date: string
  billing_cycle_start: string | null
  billing_cycle_end: string | null
  created_at: string
  updated_at: string
}

/**
 * Plan features and pricing information
 */
export interface PlanFeatures {
  id: string
  plan_type: PlanType
  plan_name: string
  plan_description: string | null
  search_limit: number
  reset_period: ResetPeriod
  can_export_results: boolean
  can_save_history: boolean
  can_share_searches: boolean
  has_api_access: boolean
  has_priority_support: boolean
  max_history_items: number
  price_monthly_usd: number
  price_yearly_usd: number
  display_order: number
  is_visible: boolean
  created_at: string
  updated_at: string
}

/**
 * Search usage log entry
 */
export interface SearchUsageLog {
  id: string
  user_id: string
  search_id: string
  query_preview: string | null
  search_status: SearchStatus
  plan_type_at_search: string
  searches_used_before: number
  searches_used_after: number
  was_quota_exceeded: boolean
  ip_address: string | null
  user_agent: string | null
  response_time_ms: number | null
  searched_at: string
  metadata: Record<string, any>
}

/**
 * Quota reset history entry
 */
export interface QuotaResetHistory {
  id: string
  user_id: string
  reset_type: ResetType
  searches_used_before_reset: number
  searches_limit: number
  reset_at: string
  previous_reset_at: string | null
  triggered_by: string | null
  notes: string | null
}

/**
 * Response from check_search_quota function
 */
export interface QuotaCheckResult {
  can_search: boolean
  searches_remaining: number
  plan_type: PlanType
  reset_date: string
  message: string
}

/**
 * Response from increment_search_count function
 */
export interface IncrementSearchResult {
  success: boolean
  searches_used: number
  searches_remaining: number
  message: string
}

/**
 * Subscription context state
 */
export interface SubscriptionContextState {
  subscription: UserSubscription | null
  planFeatures: PlanFeatures | null
  isLoading: boolean
  error: string | null
  
  // Actions (read-only + refresh)
  refreshSubscription: () => Promise<void>
  getQuotaStatus: () => Promise<any> // Gets fresh quota from backend API
  
  // Helpers
  hasQuota: () => boolean
  getQuotaPercentage: () => number
  
  // Deprecated (for backward compatibility)
  checkQuota: () => Promise<QuotaCheckResult | null>
  incrementSearch: (searchId: string, queryPreview?: string) => Promise<IncrementSearchResult | null>
}

/**
 * User quota information for display
 */
export interface UserQuotaInfo {
  plan: PlanType
  searches_used: number
  searches_remaining: number
  search_limit: number
  reset_date: string
  can_search: boolean
}

/**
 * Plan comparison data for upgrade prompts
 */
export interface PlanComparison {
  free: PlanFeatures
  pro: PlanFeatures
  enterprise?: PlanFeatures
}
