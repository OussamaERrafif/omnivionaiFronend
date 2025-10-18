"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { SearchHistory } from "@/components/search-history"
import { useHistory } from "@/components/history-context"
import { createClient } from "@/lib/supabase/client"
import { 
  loadSearchHistory, 
  deleteSearchHistory, 
  clearAllSearchHistory,
  SearchHistoryItem 
} from "@/lib/supabase/history"

export function GlobalSearchHistory() {
  const router = useRouter()
  const pathname = usePathname()
  const { isHistoryOpen, setIsHistoryOpen } = useHistory()
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([])
  const [isSignedIn, setIsSignedIn] = useState(false)
  const supabase = createClient()

  // Check authentication
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setIsSignedIn(!!user)
    }

    checkUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsSignedIn(!!session?.user)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  // Load search history from Supabase when user signs in
  useEffect(() => {
    const fetchHistory = async () => {
      if (isSignedIn) {
        try {
          const history = await loadSearchHistory()
          setSearchHistory(history)
        } catch (error) {
          console.error('Failed to load search history:', error)
        }
      } else {
        setSearchHistory([])
      }
    }
    
    fetchHistory()
  }, [isSignedIn])

  // Reload history when the history panel is opened
  useEffect(() => {
    const fetchHistory = async () => {
      if (isHistoryOpen && isSignedIn) {
        try {
          const history = await loadSearchHistory()
          setSearchHistory(history)
        } catch (error) {
          console.error('Failed to load search history:', error)
        }
      }
    }
    
    fetchHistory()
  }, [isHistoryOpen, isSignedIn])

  const handleHistorySelect = (search: SearchHistoryItem) => {
    router.push(`/search/${search.id}?q=${encodeURIComponent(search.query)}`)
    setIsHistoryOpen(false)
  }

  const handleDeleteHistory = async (id: string) => {
    try {
      await deleteSearchHistory(id)
      setSearchHistory((prev) => prev.filter((item) => item.id !== id))
    } catch (error) {
      console.error('Failed to delete search history:', error)
    }
  }

  const handleClearAllHistory = async () => {
    try {
      await clearAllSearchHistory()
      setSearchHistory([])
    } catch (error) {
      console.error('Failed to clear search history:', error)
    }
  }

  return (
    <SearchHistory
      isOpen={isHistoryOpen}
      history={searchHistory}
      onSelect={handleHistorySelect}
      onClose={() => setIsHistoryOpen(false)}
      onDelete={handleDeleteHistory}
      onClearAll={handleClearAllHistory}
    />
  )
}
