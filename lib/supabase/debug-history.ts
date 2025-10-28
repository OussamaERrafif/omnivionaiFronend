/**
 * Debug utility for testing search history operations
 */

import { createClient } from '@/lib/supabase/client'

export async function debugSearchHistory() {
  console.log('=== Starting Search History Debug ===')
  
  try {
    const supabase = createClient()
    
    // Test 1: Check authentication
    console.log('Test 1: Checking authentication...')
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('❌ Auth error:', userError)
      return
    }
    
    if (!user) {
      console.error('❌ No user found')
      return
    }
    
    console.log('✅ User authenticated:', {
      id: user.id,
      email: user.email
    })
    
    // Test 2: Check database connection
    console.log('\nTest 2: Checking database connection...')
    const { data: tables, error: tableError } = await supabase
      .from('encrypted_search_history')
      .select('*')
      .limit(1)
    
    if (tableError) {
      console.error('❌ Database error:', {
        message: tableError.message,
        details: tableError.details,
        hint: tableError.hint,
        code: tableError.code
      })
      return
    }
    
    console.log('✅ Database connection successful')
    console.log('Sample data:', tables)
    
    // Test 3: Test insert operation
    console.log('\nTest 3: Testing insert operation...')
    const testData = {
      user_id: user.id,
      search_id: `test-${Date.now()}`,
      encrypted_query: 'test-query',
      encrypted_results: 'test-results'
    }
    
    const { data: insertData, error: insertError } = await supabase
      .from('encrypted_search_history')
      .insert(testData)
      .select()
    
    if (insertError) {
      console.error('❌ Insert error:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      })
      return
    }
    
    console.log('✅ Insert successful:', insertData)
    
    // Test 4: Test upsert operation
    console.log('\nTest 4: Testing upsert operation...')
    const { data: upsertData, error: upsertError } = await supabase
      .from('encrypted_search_history')
      .upsert({
        ...testData,
        encrypted_query: 'updated-query'
      }, {
        onConflict: 'user_id,search_id'
      })
      .select()
    
    if (upsertError) {
      console.error('❌ Upsert error:', {
        message: upsertError.message,
        details: upsertError.details,
        hint: upsertError.hint,
        code: upsertError.code
      })
      return
    }
    
    console.log('✅ Upsert successful:', upsertData)
    
    // Test 5: Clean up test data
    console.log('\nTest 5: Cleaning up test data...')
    const { error: deleteError } = await supabase
      .from('encrypted_search_history')
      .delete()
      .eq('search_id', testData.search_id)
    
    if (deleteError) {
      console.error('❌ Delete error:', deleteError)
    } else {
      console.log('✅ Cleanup successful')
    }
    
    console.log('\n=== Debug Complete ===')
    
  } catch (error) {
    console.error('❌ Unexpected error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      error
    })
  }
}
