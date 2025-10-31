"use client"

import type React from "react"
import { useState, useEffect, useMemo, FormEvent, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search, Loader2, FileText, List, BookOpen, Shield, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { SearchProgress } from "@/components/search-progress"
import { SearchResults } from "@/components/search-results"
import { searchQueryStreaming, searchQuery as performSearchQuery, type SearchResponse, type ProgressUpdate } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useIsMobile } from "@/hooks/use-mobile"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"

interface SearchResultsInterfaceProps {
  initialQuery: string
  searchMode?: "deep" | "moderate" | "quick" | "sla"
  searchId: string
  onSearchComplete: (results: any[], searchResponse?: any) => void
  cachedResults?: { results: any[]; searchResponse?: any } | null
  isLoadingCache?: boolean
}

interface SearchStep {
  id: string
  type: "status" | "query" | "reviewing"
  message: string
  queries?: string[]
  sources?: Array<{ title: string; domain: string; favicon?: string }>
  status: "active" | "complete"
  search_queries?: string[]
  sites_visited?: string[]
  sources_found?: number
}

// Generate unique search ID with random characters
function generateSearchId(query: string): string {
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 8)
  const querySlug = query
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 30)
  
  return `${querySlug}-${timestamp}-${randomStr}`
}

export function SearchResultsInterface({ initialQuery, searchMode = "deep", searchId, onSearchComplete, cachedResults, isLoadingCache = false }: SearchResultsInterfaceProps) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)
  const [currentSearchMode, setCurrentSearchMode] = useState<"deep" | "moderate" | "quick" | "sla">(searchMode)
  const [currentQuery, setCurrentQuery] = useState(initialQuery)
  const [isSearching, setIsSearching] = useState(false)
  const [searchSteps, setSearchSteps] = useState<SearchStep[]>([])
  const [activeTab, setActiveTab] = useState<"research" | "steps" | "sources">("research")
  const [elapsedTime, setElapsedTime] = useState(0)
  const [searchStartTime, setSearchStartTime] = useState<number | null>(null)
  const [searchResult, setSearchResult] = useState<SearchResponse | null>(null)
  const [results, setResults] = useState<any[]>([])
  const [stepsSheetOpen, setStepsSheetOpen] = useState(false)
  const [sourcesSheetOpen, setSourcesSheetOpen] = useState(false)
  const isMobile = useIsMobile()
  const stepsContainerRef = useRef<HTMLDivElement>(null)
  const lastStepRef = useRef<HTMLDivElement>(null)
  const hasLoadedCache = useRef(false)

  // Load cached results if available (only once)
  useEffect(() => {
    if (cachedResults && !hasLoadedCache.current) {
      console.log('📦 Loading cached results:', cachedResults.results?.length, 'items')
      hasLoadedCache.current = true
      setResults(cachedResults.results || [])
      setSearchResult(cachedResults.searchResponse || null)
      setActiveTab("research")
      setIsSearching(false)
    }
  }, [cachedResults])

  const tabMeta = useMemo(() => {
    const meta: Array<{ value: "research" | "steps" | "sources"; label: string; icon: LucideIcon; count?: number }> = [
      {
        value: "research",
        label: "Research",
        icon: FileText,
        count: results.length,
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

    if (results.length > 0) {
      meta.push({
        value: "sources",
        label: "Sources",
        icon: BookOpen,
        count: results.length,
      })
    }

    return meta
  }, [isSearching, results.length, searchSteps.length])

  useEffect(() => {
    if (!tabMeta.some((tab) => tab.value === activeTab)) {
      setActiveTab("research")
    }
  }, [tabMeta, activeTab])

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

  // Auto-scroll to latest step when new steps are added
  useEffect(() => {
    if (searchSteps.length > 0 && isSearching && activeTab === "steps") {
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        lastStepRef.current?.scrollIntoView({ 
          behavior: "smooth", 
          block: "nearest" 
        })
      })
    }
  }, [searchSteps.length, isSearching, activeTab])

  // Auto-execute search on mount (only if no cached results and not loading cache)
  useEffect(() => {
    // Wait until cache loading is complete before deciding to search
    if (isLoadingCache) {
      console.log('⏳ Waiting for cache to load...')
      return
    }
    
    // Only perform search if we have a query, no results yet, and no cached data
    if (initialQuery && !searchResult && !cachedResults && results.length === 0 && !isSearching) {
      console.log('🔍 No cached results found, starting new search for:', initialQuery)
      performSearch(initialQuery)
    } else if (cachedResults) {
      console.log('✅ Using cached results, skipping search')
    }
  }, [initialQuery, isLoadingCache, cachedResults]) // Now we can safely depend on these

  const performSearch = async (searchQuery: string) => {
    setIsSearching(true)
    setSearchSteps([])
    setActiveTab("steps")
    setElapsedTime(0)
    setSearchStartTime(Date.now())
    setCurrentQuery(searchQuery)

    let searchResponse: SearchResponse | null = null
    let searchError: string | null = null

    try {
      // Try streaming first
      await searchQueryStreaming(
        searchQuery.trim(),
        currentSearchMode,
        (progress: ProgressUpdate) => {
          let enhancedMessage = progress.details
          
          // Check if this is an update to an existing step or a new one
          setSearchSteps((prev) => {
            // Create a unique key based on step number and message to detect true duplicates
            const stepKey = `${progress.step}-${enhancedMessage}`
            
            // Look for an existing step with the same step number that is still active
            // or has the exact same message (to catch duplicates)
            const existingIndex = prev.findIndex(s => {
              const existingStepNum = s.id.split('-')[1]
              const isSameStep = existingStepNum === progress.step.toString()
              const isSameMessage = s.message === enhancedMessage
              return isSameStep && (s.status === "active" || isSameMessage)
            })
            
            if (existingIndex >= 0) {
              // Update the existing step instead of creating a new one
              const updated = [...prev]
              updated[existingIndex] = {
                ...updated[existingIndex],
                message: enhancedMessage,
                search_queries: progress.search_queries || updated[existingIndex].search_queries,
                sites_visited: progress.sites_visited || updated[existingIndex].sites_visited,
                sources_found: progress.sources_found ?? updated[existingIndex].sources_found,
                status: progress.status === "completed" ? "complete" as const : "active" as const,
              }
              return updated
            } else {
              // Check if this exact step already exists (to prevent true duplicates)
              const isDuplicate = prev.some(s => {
                const existingStepNum = s.id.split('-')[1]
                return existingStepNum === progress.step.toString() && s.message === enhancedMessage
              })
              
              if (isDuplicate) {
                // Skip this duplicate entirely
                return prev
              }
              
              // Check if we need to mark any active step as complete before adding new one
              const lastActiveIndex = prev.findIndex(s => s.status === "active")
              const updated = lastActiveIndex >= 0 
                ? prev.map((s, i) => i === lastActiveIndex ? { ...s, status: "complete" as const } : s)
                : [...prev]
              
              // Add new step
              const stepId = `step-${progress.step}-${Date.now()}`
              updated.push({
                id: stepId,
                type: "status" as const,
                message: enhancedMessage,
                status: "active" as const,
                search_queries: progress.search_queries,
                sites_visited: progress.sites_visited,
                sources_found: progress.sources_found,
              })
              return updated
            }
          })
        },
        (result: SearchResponse) => {
          searchResponse = result
          setSearchSteps((prev) => prev.map((step) =>
            step.status === "active" ? { ...step, status: "complete" as const } : step
          ))
        },
        (error: string) => {
          searchError = error
          setSearchSteps((prev) => [
            ...prev,
            {
              id: `error-${Date.now()}-${Math.random().toString(36).substring(7)}`,
              type: "status" as const,
              message: `Error: ${error}`,
              status: "complete" as const,
            }
          ])
        }
      )
    } catch (error) {
      console.log("Streaming failed, trying regular search...", error)

      try {
        setSearchSteps([{
          id: `fallback-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          type: "status" as const,
          message: "Performing search...",
          status: "active" as const,
        }])

        searchResponse = await performSearchQuery(searchQuery.trim(), currentSearchMode)

        setSearchSteps((prev) => prev.map((step) =>
          step.status === "active" ? { ...step, status: "complete" as const, message: "Search completed" } : step
        ))
      } catch (fallbackError) {
        searchError = fallbackError instanceof Error ? fallbackError.message : "Search failed"
        setSearchSteps((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            type: "status" as const,
            message: `Error: ${searchError}`,
            status: "complete" as const,
          }
        ])
      }
    }

    setIsSearching(false)
    setActiveTab("research")
    setSearchStartTime(null)

    if (searchResponse && !searchError) {
      const formattedResults = searchResponse.citations.map((citation, index) => ({
        id: citation.paragraph_id || `citation-${index}`,
        title: citation.title,
        description: citation.content,
        source: citation.domain,
        url: citation.url,
        metadata: {
          trust_score: citation.trust_score,
          trust_category: citation.trust_category,
          relevance_score: citation.relevance_score,
          is_trusted: citation.is_trusted,
          author: citation.trust_category,
          images: citation.images || [], // Include images from citation
        }
      }))

      setResults(formattedResults)
      setSearchResult(searchResponse)
      onSearchComplete(formattedResults, searchResponse)
    }
  }

  const handleNewSearch = (e: FormEvent) => {
    e.preventDefault()
    if (!query.trim() || query.trim() === currentQuery) return

    const newSearchId = generateSearchId(query.trim())
    router.push(`/search/${newSearchId}?q=${encodeURIComponent(query.trim())}`)
  }

  const hasSteps = isSearching || searchSteps.length > 0
  const hasSources = results.length > 0

  const renderResearch = () => {
    // Show loading state when loading cache
    if (isLoadingCache) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 py-16 sm:py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-center">
            <p className="text-sm text-muted-foreground sm:text-base">Loading search history...</p>
          </div>
        </div>
      )
    }
    
    if (isSearching && results.length === 0) {
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

    if (results.length > 0 && searchResult) {
      return (
        <div className="space-y-6 sm:space-y-8">
          {isSearching && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Updating with newly verified sources...
            </div>
          )}
          <div className="animate-fade-in-up">
            <SearchResults query={currentQuery} results={results} searchResponse={searchResult} />
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
        <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Waiting for a query</h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground sm:text-base">
          Start a new search above to see the synthesized research brief and curated sources.
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
          <p className="text-sm text-muted-foreground">Agent activity will appear here during the next search.</p>
        </div>
      )
    }

    return (
      <div ref={stepsContainerRef} className="space-y-6 sm:space-y-8">
        {searchSteps.map((step, index) => (
          <div 
            key={step.id} 
            ref={index === searchSteps.length - 1 ? lastStepRef : null}
            className="animate-fade-in-up" 
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <SearchProgress step={step} roundNumber={index + 1} />
          </div>
        ))}
      </div>
    )
  }

  const scrollToCitation = (citationNumber: number) => {
    // Switch to research tab first
    setActiveTab("research")
    
    // Wait for tab switch to complete, then scroll
    setTimeout(() => {
      const citationElement = document.getElementById(`citation-${citationNumber}`)
      if (citationElement) {
        citationElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        // Add a brief highlight effect
        citationElement.style.backgroundColor = 'hsl(var(--primary) / 0.2)'
        setTimeout(() => {
          citationElement.style.backgroundColor = ''
        }, 2000)
      }
    }, 100)
  }

  const renderSources = () => {
    if (results.length === 0) {
      if (isSearching) {
        return (
          <div className="rounded-xl border border-dashed border-border/60 bg-card/40 p-6 text-center">
            <p className="text-sm text-muted-foreground">Collecting relevant sources...</p>
          </div>
        )
      }

      return (
        <div className="rounded-xl border border-dashed border-border/60 bg-card/40 p-6 text-center">
          <p className="text-sm text-muted-foreground">No sources yet. Run a search to populate this view.</p>
        </div>
      )
    }

    const grouped = results.reduce((acc: Record<string, any[]>, result: any, index: number) => {
      const category = result.metadata?.trust_category || "Web Resources"
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push({ ...result, citationNumber: index + 1 })
      return acc
    }, {})

    return (
      <div className="space-y-6 sm:space-y-8">
        {Object.entries(grouped).map(([category, group]: [string, any]) => (
          <div key={category} className="animate-fade-in-up">
            <div className="mb-4 flex items-center gap-3 sm:mb-6">
              <h3 className="text-lg font-semibold text-foreground sm:text-2xl">{category}</h3>
              <span className="rounded-md bg-muted/30 px-3 py-1 text-xs text-muted-foreground sm:text-sm">{group.length}</span>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {group.map((result: any, idx: number) => (
                <a
                  key={`${category}-${result.id || result.url || idx}-${result.citationNumber}`}
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block rounded-lg border border-border/50 bg-card/60 p-4 transition-all duration-300 hover:border-primary/50 hover:bg-card/80 hover:shadow-lg hover:shadow-primary/5 sm:rounded-xl sm:p-5"
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <span 
                      onClick={() => scrollToCitation(result.citationNumber)}
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-sm font-bold text-primary cursor-pointer hover:bg-primary/20 transition-colors sm:h-10 sm:w-10 sm:text-base"
                    >
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
                        {result.metadata?.trust_score && (
                          <>
                            <span aria-hidden="true">•</span>
                            <span>{result.metadata.trust_score}% trust</span>
                          </>
                        )}
                        {result.metadata?.trust_category && (
                          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-[11px] font-semibold uppercase tracking-wide text-primary">
                            {result.metadata.trust_category}
                          </Badge>
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
    <div className="container mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-6">
        <form onSubmit={handleNewSearch} className="w-full">
          <div className="relative group">
            <div className="flex items-center gap-2 rounded-xl border-2 border-border bg-background p-3 shadow-sm transition-all duration-300 hover:border-primary/50 focus-within:border-primary sm:gap-3 sm:p-3.5">
              <Search className="h-4 w-4 flex-shrink-0 text-muted-foreground sm:h-5 sm:w-5" />
              <Input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask a new question..."
                className="flex-1 border-0 bg-transparent px-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60 sm:text-base"
              />
              <Button
                type="submit"
                size="sm"
                disabled={!query.trim() || query.trim() === currentQuery || isSearching}
                className="rounded-md px-4 text-sm font-semibold sm:px-5"
              >
                Search
              </Button>
            </div>
          </div>
        </form>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Current query</p>
            <h2 className="text-xl font-bold text-foreground sm:text-2xl md:text-3xl">{currentQuery}</h2>
          </div>
          {searchResult && searchResult.answer && (
            <Badge variant="secondary" className="rounded-full border border-border/60 bg-card/60 text-xs font-medium text-muted-foreground">
              Updated {new Date().toLocaleTimeString()}
            </Badge>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "research" | "steps" | "sources")}> 
          {tabMeta.length > 1 && (
            <div className="border-b border-border/30 bg-card/10 backdrop-blur-sm">
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
                  <div className="flex items-center gap-3" role="status" aria-live="polite">
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
          )}

          <div className="mx-auto mt-6 w-full max-w-4xl space-y-8 sm:mt-8">
            {isMobile && (hasSteps || hasSources) && (
              <div className="flex flex-wrap gap-2">
                {hasSteps && (
                  <Sheet open={stepsSheetOpen} onOpenChange={setStepsSheetOpen}>
                    <SheetTrigger asChild>
                      <Button variant="outline" className="flex-1 justify-center gap-2 rounded-lg border-border/60 bg-card/60 text-sm font-medium sm:flex-none sm:w-auto">
                        <List className="h-4 w-4" aria-hidden="true" />
                        Steps timeline
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl border-border/40 bg-background/95 p-0">
                      <div className="flex h-full flex-col">
                        <SheetHeader className="px-6 pt-6">
                          <SheetTitle className="text-lg font-semibold text-foreground">Agent steps</SheetTitle>
                        </SheetHeader>
                        <ScrollArea className="flex-1 px-6 pb-8 pt-4">{renderSteps()}</ScrollArea>
                      </div>
                    </SheetContent>
                  </Sheet>
                )}

                {hasSources && (
                  <Sheet open={sourcesSheetOpen} onOpenChange={setSourcesSheetOpen}>
                    <SheetTrigger asChild>
                      <Button variant="outline" className="flex-1 justify-center gap-2 rounded-lg border-border/60 bg-card/60 text-sm font-medium sm:flex-none sm:w-auto">
                        <BookOpen className="h-4 w-4" aria-hidden="true" />
                        Sources
                        <Badge className="ml-1 rounded-full bg-primary px-2 py-0 text-[11px] font-semibold text-primary-foreground">{results.length}</Badge>
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl border-border/40 bg-background/95 p-0">
                      <div className="flex h-full flex-col">
                        <SheetHeader className="px-6 pt-6">
                          <SheetTitle className="text-lg font-semibold text-foreground">Sources</SheetTitle>
                        </SheetHeader>
                        <ScrollArea className="flex-1 px-6 pb-8 pt-4">{renderSources()}</ScrollArea>
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
        </Tabs>
      </div>
    </div>
  )
}
