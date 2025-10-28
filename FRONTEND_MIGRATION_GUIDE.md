# Frontend Migration Guide - Ownership Model Update

**Branch:** `newstructure`  
**Status:** Migration in Progress  
**Breaking Changes:** Yes - Read carefully!

---

## 🎯 What Changed?

We've implemented a **strict ownership model** where:
- **Backend is authoritative** for all data writes
- **Frontend is read-only + trigger** for all operations
- No client can bypass quota, mutate history, or circumvent security

---

## ⚠️ Breaking Changes

### 1. Search History - Now Backend Only

#### ❌ OLD WAY (REMOVED):
```typescript
import { saveSearchHistory } from '@/lib/supabase/history'

// DON'T DO THIS - This writes directly to Supabase from frontend
await saveSearchHistory(searchId, query, results)
```

#### ✅ NEW WAY:
```typescript
// History is saved AUTOMATICALLY by backend after search
// Frontend doesn't need to do anything!

// To read history:
import { getSearchHistory } from '@/lib/backend-history-api'

const { history, total } = await getSearchHistory(20, 0)
```

### 2. Quota Checks - Now Backend Only

#### ❌ OLD WAY (REMOVED):
```typescript
import { checkSearchQuota } from '@/lib/supabase/subscriptions'

// DON'T DO THIS - Quota can be bypassed
const quota = await checkSearchQuota()
if (quota.can_search) {
  // Do search
}
```

#### ✅ NEW WAY:
```typescript
// Backend checks quota automatically when you call search API
// Just call the search endpoint - backend will enforce quota

const response = await fetch('/api/search', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ query })
})

// If quota exceeded, backend returns 429 status
if (response.status === 429) {
  // Show upgrade prompt
}

// Read quota from subscription context (updated via real-time)
const { subscription } = useSubscription()
console.log(`${subscription?.searches_remaining} searches remaining`)
```

### 3. Search Count Increment - Now Backend Only

#### ❌ OLD WAY (REMOVED):
```typescript
import { incrementSearchCount } from '@/lib/supabase/subscriptions'

// DON'T DO THIS - Can be bypassed
await incrementSearchCount(searchId, queryPreview)
```

#### ✅ NEW WAY:
```typescript
// Backend increments count ATOMICALLY after successful search
// Frontend doesn't need to do anything!

// Subscription will update via real-time listener
// UI will automatically show updated quota
```

### 4. Subscription Updates - Backend Only

#### ❌ OLD WAY (REMOVED):
```typescript
// DON'T write directly to user_subscriptions table
const { error } = await supabase
  .from('user_subscriptions')
  .update({ plan_type: 'pro' })
  .eq('user_id', userId)
```

#### ✅ NEW WAY:
```typescript
// Subscriptions are updated by backend via webhooks
// Frontend triggers checkout and waits for webhook

// 1. Trigger checkout
const checkoutUrl = await createCheckoutSession(planId)
window.location.href = checkoutUrl

// 2. Backend receives webhook and updates subscription
// 3. Real-time listener updates frontend automatically
```

---

## 🔄 Migration Checklist

### Files to Update

- [ ] **Remove** `import { saveSearchHistory }` from all components
- [ ] **Remove** `import { checkSearchQuota }` from all components  
- [ ] **Remove** `import { incrementSearchCount }` from all components
- [ ] **Update** history reads to use `@/lib/backend-history-api`
- [ ] **Update** quota display to read from subscription context
- [ ] **Remove** any direct Supabase writes to:
  - `user_subscriptions`
  - `search_usage_logs`
  - `encrypted_search_history`

### Components to Audit

1. **Search Components**
   - Remove quota check before search
   - Remove history save after search
   - Remove search count increment
   - Add error handling for 429 (quota exceeded)

2. **History Components**
   - Update to use `getSearchHistory()` from backend API
   - Update to use `deleteSearchHistoryItem()` from backend API
   - Update to use `clearAllSearchHistory()` from backend API

3. **Billing Components**
   - Ensure checkout triggers only
   - Remove direct subscription updates
   - Rely on webhooks + real-time listeners

4. **Subscription Context**
   - Already updated - now read-only
   - `checkQuota()` - deprecated (logs warning)
   - `incrementSearch()` - deprecated (logs warning)
   - `refreshSubscription()` - read-only refresh

---

## 📋 Code Patterns

### Pattern 1: Execute Search with Quota Check

```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function SearchForm() {
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleSearch = async (query: string) => {
    try {
      setError(null)
      
      // Get session token
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setError('Please sign in to search')
        return
      }

      // Call backend - quota check happens automatically
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
      })

      // Handle quota exceeded
      if (response.status === 429) {
        const errorData = await response.json()
        setError(errorData.detail?.message || 'Search quota exceeded')
        // Show upgrade modal
        return
      }

      // Handle other errors
      if (!response.ok) {
        throw new Error('Search failed')
      }

      // Get results
      const results = await response.json()
      
      // Read updated quota from headers (optional)
      const quotaRemaining = response.headers.get('X-Search-Limit')
      console.log(`Quota remaining: ${quotaRemaining}`)
      
      // Display results
      // ...
      
    } catch (err) {
      setError('Search failed. Please try again.')
    }
  }

  return (
    // Your form JSX
    <></>
  )
}
```

### Pattern 2: Display Search History

```typescript
'use client'

import { useEffect, useState } from 'react'
import { getSearchHistory, deleteSearchHistoryItem } from '@/lib/backend-history-api'
import type { SearchHistoryItem } from '@/lib/backend-history-api'

export function SearchHistory() {
  const [history, setHistory] = useState<SearchHistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      setLoading(true)
      const { history: items } = await getSearchHistory(20, 0)
      setHistory(items)
    } catch (error) {
      console.error('Failed to load history:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (searchId: string) => {
    const success = await deleteSearchHistoryItem(searchId)
    if (success) {
      // Refresh history
      loadHistory()
    }
  }

  return (
    <div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <ul>
          {history.map((item) => (
            <li key={item.id}>
              {/* Display history item */}
              <button onClick={() => handleDelete(item.search_id)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

### Pattern 3: Display Quota (Read from Subscription Context)

```typescript
'use client'

import { useSubscription } from '@/contexts/subscription-context'

export function QuotaDisplay() {
  const { subscription, isLoading } = useSubscription()

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!subscription) {
    return <div>Please sign in</div>
  }

  const searchesRemaining = subscription.searches_remaining || 0
  const planType = subscription.plan_type
  
  // Subscription updates via real-time listener automatically!
  
  return (
    <div>
      <p>Plan: {planType}</p>
      <p>Searches Remaining: {searchesRemaining}</p>
      {searchesRemaining === 0 && (
        <button onClick={() => {/* Open upgrade modal */}}>
          Upgrade to Pro
        </button>
      )}
    </div>
  )
}
```

---

## 🧪 Testing Your Migration

### Test 1: Quota Enforcement
1. Create a free account
2. Use all 3 searches
3. Try 4th search
4. ✅ Should get 429 error from backend
5. ✅ Frontend should show upgrade prompt

### Test 2: History Persistence
1. Execute a search
2. Wait 2 seconds
3. Navigate to history page
4. ✅ Search should appear in history (saved by backend)

### Test 3: Subscription Update
1. Upgrade to Pro via checkout
2. Complete payment
3. Wait for webhook (2-5 seconds)
4. ✅ Subscription context should update automatically
5. ✅ Quota should show "unlimited" or higher limit

### Test 4: Real-time Updates
1. Open app in two browser tabs
2. Execute search in tab 1
3. ✅ Tab 2 should show updated quota immediately (via real-time)

---

## 🚨 Common Mistakes

### ❌ Mistake 1: Calling checkQuota Before Search
```typescript
// DON'T DO THIS
const quota = await checkSearchQuota()
if (quota.can_search) {
  await executeSearch() // Quota can change between check and execution!
}
```

### ✅ Correct: Let Backend Enforce
```typescript
// Backend checks atomically
const response = await fetch('/api/search', {...})
if (response.status === 429) {
  // Handle quota exceeded
}
```

### ❌ Mistake 2: Saving History from Frontend
```typescript
// DON'T DO THIS
await saveSearchHistory(searchId, query, results)
```

### ✅ Correct: Backend Saves Automatically
```typescript
// Just execute search - backend saves history
const results = await fetch('/api/search', {...})
```

### ❌ Mistake 3: Reading Quota from Supabase Directly
```typescript
// DON'T DO THIS
const { data } = await supabase
  .from('user_subscriptions')
  .select('searches_remaining')
```

### ✅ Correct: Read from Subscription Context
```typescript
const { subscription } = useSubscription()
const quotaRemaining = subscription?.searches_remaining || 0
```

---

## 📚 Additional Resources

- [Architecture Ownership Doc](./ARCHITECTURE_OWNERSHIP.md)
- [Backend API Documentation](../backend/README_API.md)
- [Supabase RLS Policies](./docs/database-security.md)

---

**Questions?** Check the architecture doc or ask the backend team!

**Last Updated:** October 28, 2025
