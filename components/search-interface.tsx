/**
 * Main search interface component for AI Deep Search.
 * 
 * This component provides the primary user interface for executing research queries
 * with real-time progress tracking. It includes:
 * - Search input with validation
 * - Real-time progress updates via Server-Sent Events
 * - Tabbed interface for viewing research, steps, and sources
 * - Mobile-responsive design with sheets for mobile views
 * - Authentication integration with Supabase
 * - Automatic search history saving
 * 
 * @module components/search-interface
 */

"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { Search, Loader2, FileText, List, BookOpen, Sparkles, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SearchProgress } from "@/components/search-progress"
import { SearchResults } from "@/components/search-results"
import { Badge } from "@/components/ui/badge"
import { searchQueryStreaming, searchQuery, type SearchResponse, type ProgressUpdate } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useIsMobile } from "@/hooks/use-mobile"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useQuota } from "@/contexts/subscription-context"
import { SearchLimitWarning, SearchLimitBanner } from "@/components/search-limit-warning"
import { useToast } from "@/hooks/use-toast"

/**
 * Props for the SearchInterface component.
 */
interface SearchInterfaceProps {
  /** Callback when a search completes successfully */
  onSearch: (query: string, results: any[], searchResponse?: any) => void
  /** Current search state including query and results */
  currentSearch: { query: string; results: any[]; searchResponse?: any } | null
}

/**
 * Represents a single step in the research pipeline for display.
 */
interface SearchStep {
  /** Unique identifier for the step */
  id: string
  /** Type of step for icon/styling */
  type: "status" | "query" | "reviewing"
  /** Human-readable message for the step */
  message: string
  /** Search queries generated (if applicable) */
  queries?: string[]
  /** Sources being visited (if applicable) */
  sources?: Array<{ title: string; domain: string; favicon?: string }>
  /** Current status of the step */
  status: "active" | "complete"
}

/**
 * SearchInterface component - Main search UI with real-time progress.
 * 
 * Manages the complete search lifecycle from query input to result display,
 * including progress tracking, error handling, and result storage.
 * 
 * @param props - Component props
 * @returns React component
 */
export function SearchInterface({ onSearch, currentSearch }: SearchInterfaceProps) {
  const [query, setQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchSteps, setSearchSteps] = useState<SearchStep[]>([])
  const [validationError, setValidationError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"research" | "steps" | "sources">("research")
  const [elapsedTime, setElapsedTime] = useState(0)
  const [searchStartTime, setSearchStartTime] = useState<number | null>(null)
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [stepsSheetOpen, setStepsSheetOpen] = useState(false)
  const [sourcesSheetOpen, setSourcesSheetOpen] = useState(false)
  const [showLimitWarning, setShowLimitWarning] = useState(false)
  const supabase = createClient()
  const isMobile = useIsMobile()
  const { canSearch, searchesRemaining, checkQuota, incrementSearch } = useQuota()
  const { toast } = useToast()

  const tabMeta = useMemo(
    () => {
      const meta: Array<{ value: "research" | "steps" | "sources"; label: string; icon: LucideIcon; count?: number }> = [
        {
          value: "research",
          label: "Research",
          icon: FileText,
          count: currentSearch?.results?.length ?? 0,
        },
      ]

      if (isSearching || searchSteps.length > 0) {
        meta.push({
          value: "steps",
          label: "Steps",
          icon: List,
          count: searchSteps.length,
        })
      }

      if (currentSearch && currentSearch.results.length > 0) {
        meta.push({
          value: "sources",
          label: "Sources",
          icon: BookOpen,
          count: currentSearch.results.length,
        })
      }

      return meta
    },
    [currentSearch, isSearching, searchSteps.length],
  )

  useEffect(() => {
    if (!tabMeta.some((tab) => tab.value === activeTab)) {
      setActiveTab("research")
    }
  }, [tabMeta, activeTab])

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

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isSearching && searchStartTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - searchStartTime) / 1000))
      }, 100)
    } else if (!isSearching) {
      if (interval) clearInterval(interval)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isSearching, searchStartTime])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    // Clear any previous validation errors
    setValidationError(null)

    // Check if user is logged in
    if (!isSignedIn) {
      // Trigger sign in dialog from layout
      const buttons = document.querySelectorAll('button')
      for (const button of buttons) {
        if (button.textContent?.trim() === 'Sign In') {
          button.click()
          break
        }
      }
      return
    }

    // Check quota before searching
    const quotaCheck = await checkQuota()
    if (quotaCheck && !quotaCheck.can_search) {
      setShowLimitWarning(true)
      toast({
        title: "Search Limit Reached",
        description: "You've used all your free searches for this month. Upgrade to Pro for unlimited searches.",
        variant: "destructive",
      })
      return
    }

    // Show warning if low on searches (1 remaining)
    if (searchesRemaining === 1) {
      setShowLimitWarning(true)
      // But allow them to continue after seeing the warning
    }

    setIsSearching(true)
    setSearchSteps([])
    setActiveTab("steps")
    setElapsedTime(0)
    setSearchStartTime(Date.now())

    let searchResult: SearchResponse | null = null
    let searchError: string | null = null

    try {
      // Try streaming first
      await searchQueryStreaming(
        query.trim(),
        (progress: ProgressUpdate) => {
          // Build enhanced message with details
          let enhancedMessage = progress.details

          // Map progress updates to search steps
          const stepId = `step-${progress.step}-${Date.now()}-${Math.random().toString(36).substring(7)}`
          setSearchSteps((prev) => [
            ...prev.map(step => ({ ...step, status: "complete" as const })),
            {
              id: stepId,
              type: "status" as const,
              message: enhancedMessage,
              status: "active" as const,
              search_queries: progress.search_queries,
              sites_visited: progress.sites_visited,
              sources_found: progress.sources_found,
            }
          ])
        },
        (result: SearchResponse) => {
          searchResult = result
          // Mark current step as complete
          setSearchSteps((prev) => prev.map((step) =>
            step.status === "active" ? { ...step, status: "complete" as const } : step
          ))
        },
        (error: string) => {
          searchError = error
          // Check if it's a validation error
          setValidationError(error)
          setSearchSteps((prev) => [
            ...prev,
            {
              id: `error-${Date.now()}-${Math.random().toString(36).substring(7)}`,
              type: "status" as const,
              message: `❌ ${error}`,
              status: "complete" as const,
            }
          ])
        }
      )
    } catch (error) {
      console.log("Streaming failed, trying regular search...", error)

      // Fallback to regular search if streaming fails
      try {
        setSearchSteps([{
          id: `fallback-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          type: "status" as const,
          message: "Performing search...",
          status: "active" as const,
        }])

        searchResult = await searchQuery(query.trim())

        setSearchSteps((prev) => prev.map((step) =>
          step.status === "active" ? { ...step, status: "complete" as const, message: "Search completed" } : step
        ))
      } catch (fallbackError) {
        searchError = fallbackError instanceof Error ? fallbackError.message : "Search failed"
        setValidationError(searchError)
        setSearchSteps((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            type: "status" as const,
            message: `❌ ${searchError}`,
            status: "complete" as const,
          }
        ])
      }
    }

    setIsSearching(false)
    setActiveTab("research")
    setSearchStartTime(null)

    if (searchResult && !searchError) {
      // Convert backend response to frontend format
      const results = searchResult.citations.map((citation, index) => ({
        id: citation.paragraph_id || `citation-${index}`,
        title: citation.title,
        description: citation.content,
        source: citation.domain,
        url: citation.url,
        metadata: {
          date: citation.timestamp,
          author: citation.trust_category,
          relevance_score: citation.relevance_score,
          trust_score: citation.trust_score,
          is_trusted: citation.is_trusted,
        }
      }))

      // Increment search count after successful search
      const searchId = `search-${Date.now()}`
      const incrementResult = await incrementSearch(searchId, query)
      
      if (incrementResult && incrementResult.success) {
        toast({
          title: "Search Complete",
          description: `${incrementResult.searches_remaining} search${incrementResult.searches_remaining !== 1 ? 'es' : ''} remaining this month`,
        })
      }

      onSearch(query, results, searchResult)
    }
  }

  const hasSteps = isSearching || searchSteps.length > 0
  const hasSources = !!(currentSearch && currentSearch.results.length > 0)

  const renderResearch = () => {
    if (isSearching && !currentSearch) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 py-16 sm:py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-center">
            <p className="text-sm text-muted-foreground sm:text-base">Analyzing and gathering information...</p>
            <p className="mt-1 text-xs text-muted-foreground/80 sm:text-sm">{elapsedTime}s elapsed</p>
          </div>
        </div>
      )
    }

    if (currentSearch) {
      return (
        <div className="space-y-6 sm:space-y-8">
          {isSearching && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Updating with newly verified sources...
            </div>
          )}
          <div className="animate-fade-in-up">
            <SearchResults
              query={currentSearch.query}
              results={currentSearch.results}
              searchResponse={currentSearch.searchResponse}
            />
          </div>
        </div>
      )
    }

    return (
      <div className="animate-fade-in px-4 py-24 text-center sm:py-28">
        <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 sm:h-20 sm:w-20 sm:rounded-3xl">
          <div className="absolute inset-0 animate-pulse rounded-2xl bg-primary/10 sm:rounded-3xl" aria-hidden="true" />
          <Search className="relative h-8 w-8 text-primary sm:h-10 sm:w-10" aria-hidden="true" />
        </div>
        <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Start Your Research</h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground sm:text-base">
          Enter a query above to begin deep search across multiple authoritative sources.
        </p>
      </div>
    )
  }

  const renderSteps = () => {
    if (searchSteps.length === 0) {
      if (isSearching) {
        return (
          <div className="flex items-center justify-center py-16 sm:py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary sm:h-8 sm:w-8" />
          </div>
        )
      }

      return (
        <div className="rounded-xl border border-dashed border-border/60 bg-card/40 p-6 text-center">
          <p className="text-sm text-muted-foreground">Steps will appear here once a search is running.</p>
        </div>
      )
    }

    return (
      <div className="space-y-6 sm:space-y-8">
        {searchSteps.map((step, index) => (
          <div key={step.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
            <SearchProgress step={step} roundNumber={index + 1} />
          </div>
        ))}
      </div>
    )
  }

  const renderSources = () => {
    if (!currentSearch || currentSearch.results.length === 0) {
      if (isSearching) {
        return (
          <div className="rounded-xl border border-dashed border-border/60 bg-card/40 p-6 text-center">
            <p className="text-sm text-muted-foreground">Retrieving the best sources for you...</p>
          </div>
        )
      }

      return (
        <div className="rounded-xl border border-dashed border-border/60 bg-card/40 p-6 text-center">
          <p className="text-sm text-muted-foreground">Sources will appear here after your next search.</p>
        </div>
      )
    }

    const grouped = currentSearch.results.reduce((acc: Record<string, any[]>, result: any, index: number) => {
      const category = result.metadata.author || "Web Resources"
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push({ ...result, citationNumber: index + 1 })
      return acc
    }, {})

    return (
      <div className="space-y-6 sm:space-y-8">
        {Object.entries(grouped).map(([category, sources]: [string, any]) => (
          <div key={category} className="animate-fade-in-up">
            <div className="mb-4 flex items-center gap-3 sm:mb-6">
              <h3 className="text-lg font-semibold text-foreground sm:text-2xl">{category}</h3>
              <span className="rounded-md bg-muted/30 px-3 py-1 text-xs text-muted-foreground sm:text-sm">{sources.length}</span>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {sources.map((result: any) => (
                <a
                  key={result.id}
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block rounded-lg border border-border/50 bg-card/60 p-4 transition-all duration-300 hover:border-primary/50 hover:bg-card/80 hover:shadow-lg hover:shadow-primary/5 sm:rounded-xl sm:p-5"
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-sm font-bold text-primary sm:h-10 sm:w-10 sm:text-base">
                      [{result.citationNumber}]
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex items-start gap-2">
                        <h4 className="line-clamp-2 text-sm font-semibold text-foreground transition-colors group-hover:text-primary sm:text-base">
                          {result.title}
                        </h4>
                      </div>
                      {result.description && (
                        <p className="mb-3 line-clamp-2 text-xs text-muted-foreground sm:text-sm">{result.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="max-w-[200px] truncate font-medium text-primary/80">{result.source}</span>
                        {result.metadata.date && (
                          <>
                            <span aria-hidden="true">•</span>
                            <span>Retrieved {result.metadata.date}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/50 bg-card/30 backdrop-blur-xl sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <form onSubmit={handleSearch} className="max-w-3xl mx-auto" role="search">
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/5 rounded-xl blur-xl group-hover:bg-primary/10 transition-all duration-500" aria-hidden="true" />
              <div className="relative">
                <Search 
                  className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-hover:text-primary transition-colors duration-300 pointer-events-none" 
                  aria-hidden="true"
                />
                <Input
                  type="text"
                  placeholder="Ask anything..."
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    // Clear validation error when user types
                    if (validationError) setValidationError(null)
                  }}
                  className="w-full h-12 sm:h-14 pl-10 sm:pl-14 pr-24 sm:pr-28 bg-card border-border/50 focus:border-primary/50 rounded-xl transition-all duration-300 text-sm sm:text-base shadow-lg shadow-black/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  disabled={isSearching}
                  aria-label="Search query input"
                  aria-describedby="search-hint"
                  autoComplete="off"
                />
                <span id="search-hint" className="sr-only">
                  Enter your search query and press enter or click search button
                </span>
                <Button
                  type="submit"
                  disabled={isSearching || !query.trim()}
                  size="sm"
                  className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 h-9 sm:h-10 px-4 sm:px-6 bg-primary hover:bg-primary/90 rounded-lg font-medium shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                  aria-label={isSearching ? "Searching..." : "Start search"}
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin sm:mr-2" aria-hidden="true" />
                      <span className="hidden sm:inline">Searching</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" aria-hidden="true" />
                      <span className="hidden sm:inline">Search</span>
                      <span className="sm:hidden">Go</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {/* Validation Error Message */}
            {validationError && (
              <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-destructive">
                      {validationError}
                    </p>
                  </div>
                  <button
                    onClick={() => setValidationError(null)}
                    className="flex-shrink-0 text-destructive/60 hover:text-destructive transition-colors"
                    aria-label="Dismiss error"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
            
            {/* Search Limit Banner */}
            {isSignedIn && (
              <SearchLimitBanner 
                className="mt-3" 
                onUpgrade={() => {
                  // Navigate to billing/upgrade page or show upgrade dialog
                  window.location.href = '/upgrade'
                }}
              />
            )}
          </form>
        </div>
        
        {/* Search Limit Warning Modal */}
        <SearchLimitWarning
          open={showLimitWarning}
          onOpenChange={setShowLimitWarning}
          variant={canSearch ? 'low' : 'exceeded'}
          onUpgrade={() => {
            window.location.href = '/upgrade'
          }}
        />
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "research" | "steps" | "sources")}
        className="w-full"
      >
        {(isSearching || currentSearch) && tabMeta.length > 1 && (
          <div className="border-b border-border/30 bg-card/10 backdrop-blur-sm">
            <div className="container mx-auto px-4 sm:px-6">
              <div className="mx-auto flex max-w-4xl flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:py-4">
                <TabsList className="no-scrollbar flex w-full justify-start gap-1 overflow-x-auto rounded-full bg-card/40 p-1 text-xs sm:w-auto sm:rounded-xl sm:bg-card/20 sm:text-sm">
                  {tabMeta.map((tab) => {
                    const Icon = tab.icon
                    return (
                      <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 font-medium text-muted-foreground transition-colors data-[state=active]:bg-primary/10 data-[state=active]:text-foreground sm:px-4"
                      >
                        <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
                        <span>{tab.label}</span>
                        {tab.count && tab.count > 0 ? (
                          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-[10px] font-semibold uppercase tracking-wide text-primary">
                            {tab.count}
                          </Badge>
                        ) : null}
                      </TabsTrigger>
                    )
                  })}
                </TabsList>

                {isSearching && (
                  <div className="flex items-center gap-3 sm:py-0" role="status" aria-live="polite">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-1.5 w-24 overflow-hidden rounded-full bg-muted/30 sm:w-32"
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={45}
                        aria-valuenow={Math.min(elapsedTime, 45)}
                        aria-label="Search progress"
                      >
                        <div
                          className="relative h-full rounded-full bg-gradient-to-r from-primary via-primary/80 to-primary transition-all duration-300 ease-out"
                          style={{ width: `${Math.min((elapsedTime / 45) * 100, 100)}%` }}
                        >
                          <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" aria-hidden="true" />
                        </div>
                      </div>
                      <span className="font-mono text-xs text-muted-foreground sm:text-sm" aria-label={`Elapsed time: ${elapsedTime} seconds`}>
                        {elapsedTime}s
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="container mx-auto px-4 py-8 sm:px-6 sm:py-12">
          <div className="mx-auto w-full max-w-4xl space-y-8">
            {isMobile && (hasSteps || hasSources) && (
              <div className="flex flex-wrap gap-2">
                {hasSteps && (
                  <Sheet open={stepsSheetOpen} onOpenChange={setStepsSheetOpen}>
                    <SheetTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex-1 justify-center gap-2 rounded-lg border-border/60 bg-card/60 text-sm font-medium sm:flex-none sm:w-auto"
                      >
                        <List className="h-4 w-4" aria-hidden="true" />
                        Steps timeline
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl border-border/40 bg-background/95 p-0">
                      <div className="flex h-full flex-col">
                        <SheetHeader className="px-6 pt-6">
                          <SheetTitle className="text-lg font-semibold text-foreground">Search steps</SheetTitle>
                        </SheetHeader>
                        <ScrollArea className="flex-1 px-6 pb-8 pt-4">
                          {renderSteps()}
                        </ScrollArea>
                      </div>
                    </SheetContent>
                  </Sheet>
                )}

                {hasSources && (
                  <Sheet open={sourcesSheetOpen} onOpenChange={setSourcesSheetOpen}>
                    <SheetTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex-1 justify-center gap-2 rounded-lg border-border/60 bg-card/60 text-sm font-medium sm:flex-none sm:w-auto"
                      >
                        <BookOpen className="h-4 w-4" aria-hidden="true" />
                        Sources
                        {tabMeta.find((tab) => tab.value === "sources")?.count ? (
                          <Badge className="ml-1 rounded-full bg-primary px-2 py-0 text-[11px] font-semibold text-primary-foreground">
                            {tabMeta.find((tab) => tab.value === "sources")?.count}
                          </Badge>
                        ) : null}
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl border-border/40 bg-background/95 p-0">
                      <div className="flex h-full flex-col">
                        <SheetHeader className="px-6 pt-6">
                          <SheetTitle className="text-lg font-semibold text-foreground">Sources</SheetTitle>
                        </SheetHeader>
                        <ScrollArea className="flex-1 px-6 pb-8 pt-4">
                          {renderSources()}
                        </ScrollArea>
                      </div>
                    </SheetContent>
                  </Sheet>
                )}
              </div>
            )}

            <TabsContent value="research" className="mt-0 focus:outline-none">
              {renderResearch()}
            </TabsContent>

            {tabMeta.some((tab) => tab.value === "steps") && (
              <TabsContent value="steps" className="mt-0 focus:outline-none">
                {renderSteps()}
              </TabsContent>
            )}

            {tabMeta.some((tab) => tab.value === "sources") && (
              <TabsContent value="sources" className="mt-0 focus:outline-none">
                {renderSources()}
              </TabsContent>
            )}
          </div>
        </div>
      </Tabs>
    </div>
  )
}
