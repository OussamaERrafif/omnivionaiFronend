/**
 * Backend History API Client
 * 
 * All history operations go through backend API.
 * Frontend is READ-ONLY + TRIGGER.
 * 
 * Owner: Backend (authoritative)
 * Frontend: Read via API, trigger operations via API
 * 
 * NEVER write directly to Supabase from frontend!
 */

import { createClient } from '@/lib/supabase/client'

const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000'

export interface SearchHistoryItem {
  id: string
  user_id: string
  search_id: string
  encrypted_query: string
  encrypted_results: string
  created_at: string
  updated_at: string
}

export interface HistoryResponse {
  history: SearchHistoryItem[]
  total: number
  page: number
  per_page: number
}

/**
 * Get authorization header with JWT token
 */
async function getAuthHeader(): Promise<{ Authorization: string } | {}> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.access_token) {
    console.warn('⚠️ No session token available for history API')
    return {}
  }
  
  return {
    Authorization: `Bearer ${session.access_token}`
  }
}

/**
 * Get search history from backend API
 * 
 * Backend authoritative - only way to read history
 */
export async function getSearchHistory(
  limit: number = 20,
  offset: number = 0
): Promise<HistoryResponse> {
  try {
    const headers = await getAuthHeader()
    
    const response = await fetch(
      `${BACKEND_API_URL}/history?limit=${limit}&offset=${offset}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      }
    )
    
    if (!response.ok) {
      if (response.status === 401) {
        console.error('❌ Unauthorized - please sign in')
        return {
          history: [],
          total: 0,
          page: 1,
          per_page: limit
        }
      }
      throw new Error(`Failed to fetch history: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data as HistoryResponse
    
  } catch (error) {
    console.error('❌ Error fetching search history:', error)
    return {
      history: [],
      total: 0,
      page: 1,
      per_page: limit
    }
  }
}

/**
 * Delete a specific search history item via backend API
 * 
 * Backend authoritative - only backend can delete
 */
export async function deleteSearchHistoryItem(searchId: string): Promise<boolean> {
  try {
    const headers = await getAuthHeader()
    
    const response = await fetch(
      `${BACKEND_API_URL}/history/${searchId}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      }
    )
    
    if (!response.ok) {
      throw new Error(`Failed to delete history: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data.success || false
    
  } catch (error) {
    console.error('❌ Error deleting search history:', error)
    return false
  }
}

/**
 * Clear all search history via backend API
 * 
 * Backend authoritative - only backend can clear
 */
export async function clearAllSearchHistory(): Promise<boolean> {
  try {
    const headers = await getAuthHeader()
    
    const response = await fetch(
      `${BACKEND_API_URL}/history`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      }
    )
    
    if (!response.ok) {
      throw new Error(`Failed to clear history: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data.success || false
    
  } catch (error) {
    console.error('❌ Error clearing search history:', error)
    return false
  }
}

/**
 * DEPRECATED: saveSearchHistory
 * 
 * History is now saved automatically by backend after search.
 * Frontend should NOT call this directly.
 * 
 * This function exists only for backward compatibility.
 */
export async function saveSearchHistory(
  searchId: string,
  query: string,
  results: any[]
): Promise<void> {
  console.warn(
    '⚠️ DEPRECATED: saveSearchHistory called from frontend. ' +
    'History is now saved automatically by backend. ' +
    'Remove this call from your code.'
  )
  // No-op - backend handles this now
}
