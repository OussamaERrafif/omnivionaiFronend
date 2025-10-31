"use client"

import { useEffect, useState } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { SearchResultsInterface } from "@/components/search-results-interface"
import { Loader2 } from "lucide-react"
import { AnimatedBackground } from "@/components/animated-background"
import { createClient } from "@/lib/supabase/client"
import { useHistory } from "@/components/history-context"
import { saveSearchHistory, loadSearchHistory } from "@/lib/supabase/history"

export default function SearchResultsPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const searchId = params.id as string
  const query = searchParams.get('q') || ''
  const searchMode = (searchParams.get('mode') as "deep" | "moderate" | "quick" | "sla") || 'deep'
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [cachedResults, setCachedResults] = useState<any>(null)
  const [isLoadingCache, setIsLoadingCache] = useState(true)
  const supabase = createClient()
  const { isHistoryOpen, setIsHistoryOpen } = useHistory()

  // Check authentication
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setIsSignedIn(!!user)
      setIsLoaded(true)
    }

    checkUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsSignedIn(!!session?.user)
      setIsLoaded(true)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  // Redirect to home if not authenticated
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/')
    }
  }, [isLoaded, isSignedIn, router])

  // Load cached results from history if they exist (only once when authenticated)
  useEffect(() => {
    const loadCachedResults = async () => {
      if (!isSignedIn) {
        setIsLoadingCache(false)
        return
      }

      try {
        const history = await loadSearchHistory()
        const cachedSearch = history.find(item => item.id === searchId)
        
        if (cachedSearch) {
          setCachedResults({
            results: cachedSearch.results,
            searchResponse: cachedSearch.searchResponse
          })
        }
      } catch (error) {
        console.error('Failed to load cached results:', error)
      } finally {
        setIsLoadingCache(false)
      }
    }

    if (isSignedIn && isLoaded) {
      loadCachedResults()
    } else if (!isSignedIn && isLoaded) {
      setIsLoadingCache(false)
    }
  }, [isSignedIn, isLoaded, searchId]) // Keep searchId since each search page has unique ID

  // Save search to database when search completes
  const handleSearchComplete = async (results: any[], searchResponse?: any) => {
    if (!isSignedIn) {
      console.log('Skipping save: User not signed in')
      return
    }
    
    try {
      console.log('Saving search history...', { 
        searchId, 
        query, 
        resultsCount: results?.length || 0,
        hasSearchResponse: !!searchResponse 
      })
      
      // Save to database (encrypted)
      await saveSearchHistory(searchId, query, results, searchResponse)
      console.log('Search history saved successfully')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Failed to save search history:', {
        error: errorMessage,
        searchId,
        query
      })
      // Don't show error to user, just log it
    }
  }

  // Show loading state only while checking authentication
  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated particle background */}
      <AnimatedBackground />
      
      {/* Static background effects */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,oklch(0.2_0_0/0.05)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.2_0_0/0.05)_1px,transparent_1px)] bg-[size:4rem_4rem]" aria-hidden="true" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,oklch(0.7_0.19_240/0.15),transparent)]" aria-hidden="true" />

      <div className="relative z-10">
        {/* Main content */}
        <div className="flex pt-20">
          <main 
            className={`flex-1 transition-all duration-300 ${isHistoryOpen ? "lg:mr-80" : "mr-0"}`}
            role="main"
            aria-label="Search results"
          >
            <SearchResultsInterface 
              initialQuery={query}
              searchMode={searchMode}
              searchId={searchId}
              onSearchComplete={handleSearchComplete}
              cachedResults={cachedResults}
              isLoadingCache={isLoadingCache}
            />
          </main>
        </div>
      </div>
    </div>
  )
}
