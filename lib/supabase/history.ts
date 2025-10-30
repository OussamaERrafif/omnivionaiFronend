/**
 * Supabase database functions for encrypted search history
 * Handles saving and retrieving encrypted search history from the database
 */

import { createClient } from '@/lib/supabase/client'
import { encryptSearchHistory, decryptSearchHistory, getUsernameFromEmail } from '@/lib/encryption'
import { diagnoseEncryptedData, logEncryptionDiagnostics } from '@/lib/encryption-diagnostics'

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
    // Validate inputs
    if (!searchId || typeof searchId !== 'string') {
      throw new Error('Invalid searchId parameter')
    }
    if (!query || typeof query !== 'string') {
      throw new Error('Invalid query parameter')
    }
    if (!Array.isArray(results)) {
      throw new Error('Results must be an array')
    }

    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) {
      throw new Error(`Authentication error: ${userError.message}`)
    }
    if (!user) {
      throw new Error('User not authenticated')
    }
    if (!user.email) {
      throw new Error('User email not found')
    }
    
    // Use email as username for encryption
    const username = getUsernameFromEmail(user.email)
    
    if (!username) {
      throw new Error('Failed to generate username from email')
    }
    
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
    
    if (!encryptedQuery || !encryptedResults) {
      throw new Error('Encryption failed - empty encrypted data')
    }
    
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
      console.error('Failed to save search history:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      })
      throw new Error(`Database error: ${insertError.message || 'Failed to save search history'}`)
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const errorDetails = {
      message: errorMessage,
      error: error,
      stack: error instanceof Error ? error.stack : undefined
    }
    console.error('Error saving search history:', errorDetails)
    throw new Error(`Failed to save search history: ${errorMessage}`)
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
    const corruptedItems: string[] = []
    
    for (const item of encryptedHistory as EncryptedHistoryRow[]) {
      try {
        // Validate encrypted data exists
        if (!item.encrypted_query || !item.encrypted_results) {
          console.warn(`Skipping history item ${item.id}: missing encrypted data`)
          corruptedItems.push(item.id)
          continue
        }

        // Diagnose encrypted data before attempting to decrypt
        const queryDiag = diagnoseEncryptedData(item.encrypted_query)
        const resultsDiag = diagnoseEncryptedData(item.encrypted_results)
        
        if (!queryDiag.isValid || !resultsDiag.isValid) {
          console.warn(`Skipping history item ${item.id}: corrupted encrypted data`)
          logEncryptionDiagnostics(item.id, item.encrypted_query, item.encrypted_results)
          corruptedItems.push(item.id)
          continue
        }

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
        console.error(`Failed to decrypt history item ${item.id}:`, {
          error: decryptError,
          itemId: item.id,
          searchId: item.search_id,
          hasEncryptedQuery: !!item.encrypted_query,
          hasEncryptedResults: !!item.encrypted_results,
          encryptedQueryLength: item.encrypted_query?.length,
          encryptedResultsLength: item.encrypted_results?.length
        })
        logEncryptionDiagnostics(item.id, item.encrypted_query, item.encrypted_results)
        corruptedItems.push(item.id)
        // Skip corrupted items
        continue
      }
    }
    
    // Clean up corrupted items from database
    if (corruptedItems.length > 0) {
      console.warn(`Found ${corruptedItems.length} corrupted history items, cleaning up...`)
      try {
        await supabase
          .from('encrypted_search_history')
          .delete()
          .in('id', corruptedItems)
        console.log(`Successfully deleted ${corruptedItems.length} corrupted items`)
      } catch (cleanupError) {
        console.error('Failed to clean up corrupted items:', cleanupError)
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
