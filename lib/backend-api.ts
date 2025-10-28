/**
 * Backend API Client - Backend-Authoritative Operations
 * 
 * Purpose: All write operations go through backend API
 * Frontend: Read-only + trigger
 * 
 * Architecture:
 * - Backend owns: quota, history, search execution
 * - Frontend: triggers API, displays results, caches locally
 * - No direct database writes from frontend
 * 
 * Security:
 * - Uses anon key only (safe to expose)
 * - Backend validates JWT on every request
 * - No service_role key in frontend
 */

import { createClient } from '@/lib/supabase/client'

// Backend API base URL
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000'

/**
 * Get authorization header with JWT token
 */
async function getAuthHeader(): Promise<Record<string, string>> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.access_token) {
    throw new Error('No authentication session. Please sign in.')
  }
  
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json'
  }
}

// ============================================================================
// TYPES
// ============================================================================

export interface SearchRequest {
  query: string
}

export interface SearchResponse {
  search_id: string
  status: 'success' | 'failed' | 'pending'
  query: string
  final_answer: string
  citations: Citation[]
  sources: Source[]
  agent_steps?: AgentStep[]
  quota: QuotaInfo
  completed_at: string
}

export interface Citation {
  url: string
  title: string
  section?: string
  content: string
  relevance_score: number
  trust_score?: number
}

export interface Source {
  url: string
  title: string
  content: string
}

export interface AgentStep {
  agent: string
  status: string
  details: string
  timestamp: string
}

export interface QuotaInfo {
  searches_used: number
  searches_remaining: number
  plan_type: string
}

export interface QuotaStatus {
  searches_used: number
  searches_remaining: number
  plan_type: string
  billing_cycle_start?: string
  billing_cycle_end?: string
  has_quota: boolean
}

export interface HistoryItem {
  id: string
  user_id: string
  query: string
  response?: string
  status: 'pending' | 'success' | 'failed'
  citations?: Citation[]
  created_at: string
  completed_at?: string
}

export interface HistoryResponse {
  history: HistoryItem[]
  total: number
  page: number
  per_page: number
}

// ============================================================================
// SEARCH API
// ============================================================================

/**
 * Execute backend-authoritative search
 * 
 * Backend handles:
 * 1. JWT validation
 * 2. Atomic quota check & decrement
 * 3. Search execution
 * 4. History storage
 * 5. Usage logging
 * 
 * Frontend receives:
 * - Complete search results
 * - Updated quota info
 * - Search ID for tracking
 */
export async function executeSearch(query: string): Promise<SearchResponse> {
  try {
    const headers = await getAuthHeader()
    
    const response = await fetch(`${BACKEND_URL}/api/search`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query })
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail?.message || error.detail || 'Search failed')
    }
    
    return await response.json()
  } catch (error) {
    console.error('❌ Search execution failed:', error)
    throw error
  }
}

/**
 * Stream search progress via SSE
 * 
 * Returns an EventSource for real-time updates:
 * - quota_checked
 * - search_created
 * - agent_step (progress)
 * - search_completed
 */
export async function streamSearch(
  query: string,
  onProgress: (event: any) => void,
  onComplete: (result: any) => void,
  onError: (error: any) => void
): Promise<() => void> {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.access_token) {
      throw new Error('No authentication session')
    }
    
    // Encode query for URL
    const encodedQuery = encodeURIComponent(query)
    const url = `${BACKEND_URL}/api/search/stream?query=${encodedQuery}`
    
    // Create EventSource with Authorization header (using proxy pattern)
    const eventSource = new EventSource(url)
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        if (data.event === 'error') {
          onError(new Error(data.message))
          eventSource.close()
        } else if (data.event === 'search_completed') {
          onComplete(data)
          eventSource.close()
        } else {
          onProgress(data)
        }
      } catch (e) {
        console.error('Failed to parse SSE event:', e)
      }
    }
    
    eventSource.onerror = (error) => {
      console.error('SSE error:', error)
      onError(error)
      eventSource.close()
    }
    
    // Return cleanup function
    return () => eventSource.close()
    
  } catch (error) {
    console.error('❌ Failed to start search stream:', error)
    onError(error)
    return () => {}
  }
}

// ============================================================================
// QUOTA API
// ============================================================================

/**
 * Get current quota status (read-only)
 * 
 * Backend authoritative - frontend just displays
 */
export async function getQuotaStatus(): Promise<QuotaStatus> {
  try {
    const headers = await getAuthHeader()
    
    const response = await fetch(`${BACKEND_URL}/api/quota`, {
      method: 'GET',
      headers
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to get quota status')
    }
    
    return await response.json()
  } catch (error) {
    console.error('❌ Failed to get quota status:', error)
    throw error
  }
}

// ============================================================================
// HISTORY API
// ============================================================================

/**
 * Get search history (read-only)
 * 
 * Backend authoritative - frontend cannot write history
 */
export async function getSearchHistory(
  page: number = 1,
  perPage: number = 20
): Promise<HistoryResponse> {
  try {
    const headers = await getAuthHeader()
    
    const offset = (page - 1) * perPage
    const response = await fetch(
      `${BACKEND_URL}/history?limit=${perPage}&offset=${offset}`,
      {
        method: 'GET',
        headers
      }
    )
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to get history')
    }
    
    return await response.json()
  } catch (error) {
    console.error('❌ Failed to get search history:', error)
    throw error
  }
}

/**
 * Delete a search history item
 * 
 * Backend authoritative - frontend triggers deletion
 */
export async function deleteSearchHistoryItem(searchId: string): Promise<void> {
  try {
    const headers = await getAuthHeader()
    
    const response = await fetch(`${BACKEND_URL}/history/${searchId}`, {
      method: 'DELETE',
      headers
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to delete history item')
    }
  } catch (error) {
    console.error('❌ Failed to delete history item:', error)
    throw error
  }
}

/**
 * Clear all search history
 * 
 * Backend authoritative - frontend triggers deletion
 */
export async function clearAllSearchHistory(): Promise<void> {
  try {
    const headers = await getAuthHeader()
    
    const response = await fetch(`${BACKEND_URL}/history`, {
      method: 'DELETE',
      headers
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to clear history')
    }
  } catch (error) {
    console.error('❌ Failed to clear history:', error)
    throw error
  }
}

// ============================================================================
// DEPRECATED FUNCTIONS (DO NOT USE)
// ============================================================================

/**
 * @deprecated Use executeSearch() instead
 * Frontend should NEVER write to database directly
 */
export function saveSearchHistory() {
  console.error(
    '❌ DEPRECATED: saveSearchHistory() - Use backend API executeSearch() instead!\n' +
    'Frontend is READ-ONLY. All writes must go through backend.'
  )
  throw new Error('Direct database writes are not allowed. Use backend API.')
}

/**
 * @deprecated Use getQuotaStatus() instead
 * Frontend should NEVER check quota directly
 */
export function checkSearchQuota() {
  console.error(
    '❌ DEPRECATED: checkSearchQuota() - Backend checks quota automatically!\n' +
    'Quota is enforced atomically by backend. Frontend just displays quota info.'
  )
  throw new Error('Direct quota checks are not allowed. Backend enforces quota.')
}

/**
 * @deprecated Use executeSearch() instead
 * Frontend should NEVER increment search count
 */
export function incrementSearchCount() {
  console.error(
    '❌ DEPRECATED: incrementSearchCount() - Backend handles quota automatically!\n' +
    'Quota is decremented atomically by backend during search execution.'
  )
  throw new Error('Direct quota updates are not allowed. Backend handles this.')
}

// ============================================================================
// EXPORTS
// ============================================================================

export const BackendAPI = {
  // Search
  executeSearch,
  streamSearch,
  
  // Quota (read-only)
  getQuotaStatus,
  
  // History (read-only + trigger deletion)
  getSearchHistory,
  deleteSearchHistoryItem,
  clearAllSearchHistory,
}

export default BackendAPI
