/**
 * Supabase database functions for encrypted search history
 * Handles saving and retrieving encrypted search history from the database
 */

import { createClient } from '@/lib/supabase/client'
import { encryptSearchHistory, decryptSearchHistory, getUsernameFromEmail } from '@/lib/encryption'

export interface SearchHistoryItem {
  id: string
  query: string
  timestamp: Date
  results: any[]
  searchResponse?: any
}

interface EncryptedHistoryRow {
  id: string
  user_id: string
  search_id: string
  encrypted_query: string
  encrypted_results: string
  created_at: string
  updated_at: string
}

/**
 * Save search history to the database (encrypted)
 */
export async function saveSearchHistory(
  searchId: string,
  query: string,
  results: any[],
  searchResponse?: any
): Promise<void> {
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('User not authenticated')
    }
    
    // Use email as username for encryption
    const username = getUsernameFromEmail(user.email || '')
    
    // Prepare data for encryption
    const resultsData = {
      results,
      searchResponse
    }
    
    // Prepare data for encryption - wrap results in an array format
    const resultsToEncrypt = [resultsData]
    
    // Encrypt the data
    const { encryptedQuery, encryptedResults } = await encryptSearchHistory(
      query,
      resultsToEncrypt,
      username
    )
    
    // Save to database (upsert to handle duplicates)
    const { error: insertError } = await supabase
      .from('encrypted_search_history')
      .upsert({
        user_id: user.id,
        search_id: searchId,
        encrypted_query: encryptedQuery,
        encrypted_results: encryptedResults
      }, {
        onConflict: 'user_id,search_id'
      })
    
    if (insertError) {
      console.error('Failed to save search history:', insertError)
      throw insertError
    }
  } catch (error) {
    console.error('Error saving search history:', error)
    throw error
  }
}

/**
 * Load all search history for the current user (decrypted)
 */
export async function loadSearchHistory(): Promise<SearchHistoryItem[]> {
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return []
    }
    
    // Use email as username for decryption
    const username = getUsernameFromEmail(user.email || '')
    
    // Fetch encrypted history from database
    const { data: encryptedHistory, error: fetchError } = await supabase
      .from('encrypted_search_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (fetchError) {
      console.error('Failed to load search history:', fetchError)
      throw fetchError
    }
    
    if (!encryptedHistory || encryptedHistory.length === 0) {
      return []
    }
    
    // Decrypt each history item
    const decryptedHistory: SearchHistoryItem[] = []
    
    for (const item of encryptedHistory as EncryptedHistoryRow[]) {
      try {
        const { query, results } = await decryptSearchHistory(
          item.encrypted_query,
          item.encrypted_results,
          username
        )
        
        // results is an array with one element containing the data
        const decryptedData = results[0] as any
        
        decryptedHistory.push({
          id: item.search_id,
          query,
          timestamp: new Date(item.created_at),
          results: decryptedData?.results || [],
          searchResponse: decryptedData?.searchResponse
        })
      } catch (decryptError) {
        console.error(`Failed to decrypt history item ${item.id}:`, decryptError)
        // Skip corrupted items
        continue
      }
    }
    
    return decryptedHistory
  } catch (error) {
    console.error('Error loading search history:', error)
    return []
  }
}

/**
 * Delete a specific search history item
 */
export async function deleteSearchHistory(searchId: string): Promise<void> {
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('User not authenticated')
    }
    
    // Delete from database
    const { error: deleteError } = await supabase
      .from('encrypted_search_history')
      .delete()
      .eq('user_id', user.id)
      .eq('search_id', searchId)
    
    if (deleteError) {
      console.error('Failed to delete search history:', deleteError)
      throw deleteError
    }
  } catch (error) {
    console.error('Error deleting search history:', error)
    throw error
  }
}

/**
 * Delete all search history for the current user
 */
export async function clearAllSearchHistory(): Promise<void> {
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('User not authenticated')
    }
    
    // Delete all from database
    const { error: deleteError } = await supabase
      .from('encrypted_search_history')
      .delete()
      .eq('user_id', user.id)
    
    if (deleteError) {
      console.error('Failed to clear search history:', deleteError)
      throw deleteError
    }
  } catch (error) {
    console.error('Error clearing search history:', error)
    throw error
  }
}

/**
 * Get the count of search history items for the current user
 */
export async function getSearchHistoryCount(): Promise<number> {
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return 0
    }
    
    // Get count
    const { count, error: countError } = await supabase
      .from('encrypted_search_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
    
    if (countError) {
      console.error('Failed to get search history count:', countError)
      return 0
    }
    
    return count || 0
  } catch (error) {
    console.error('Error getting search history count:', error)
    return 0
  }
}
