/**
 * Custom React hook for navigating to search results pages.
 * 
 * This hook provides utilities for creating unique search IDs and
 * navigating to search results pages with proper URL encoding.
 * 
 * @module hooks/use-search-navigation
 */

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { SearchMode } from "@/types/search-mode"

/**
 * Generate a unique search ID for a query.
 * 
 * Creates a URL-friendly ID combining:
 * - Slugified query text (truncated to 30 chars)
 * - Unix timestamp
 * - Random string (6 chars)
 * 
 * This ensures each search has a unique URL while keeping the query
 * visible in the URL for better UX and SEO.
 * 
 * @param query - The search query
 * @returns Unique search ID string
 * 
 * @example
 * ```typescript
 * generateSearchId("What is AI?")
 * // Returns: "what-is-ai-1699564800000-a3f9k2"
 * ```
 */
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

/**
 * Hook for programmatic navigation to search results.
 * 
 * Provides functions and state for navigating to search results pages
 * with unique IDs and proper query parameter encoding.
 * 
 * @returns Object with navigateToSearch function and isNavigating state
 * 
 * @example
 * ```tsx
 * function SearchForm() {
 *   const { navigateToSearch, isNavigating } = useSearchNavigation();
 *   
 *   const handleSubmit = (query: string) => {
 *     navigateToSearch(query);
 *   };
 *   
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       <input type="text" />
 *       <button disabled={isNavigating}>
 *         {isNavigating ? "Loading..." : "Search"}
 *       </button>
 *     </form>
 *   );
 * }
 * ```
 */
export function useSearchNavigation() {
  const [isNavigating, setIsNavigating] = useState(false)
  const router = useRouter()

  // Reset navigation state when component mounts (e.g., when returning to home page)
  useEffect(() => {
    setIsNavigating(false)
  }, [])

  /**
   * Navigate to a search results page for the given query.
   * 
   * Creates a unique search ID and navigates to `/search/[id]?q=[query]&mode=[searchMode]`.
   * Sets isNavigating to true during navigation.
   * 
   * @param query - The search query (will be trimmed)
   * @param searchMode - The search mode (defaults to "deep")
   */
  const navigateToSearch = (query: string, searchMode: SearchMode = "deep") => {
    if (!query.trim()) return

    setIsNavigating(true)
    const searchId = generateSearchId(query.trim())
    
    // Navigate to search results page with unique ID and search mode
    router.push(`/search/${searchId}?q=${encodeURIComponent(query.trim())}&mode=${encodeURIComponent(searchMode)}`)
    
    // Reset navigation state after a short delay to allow navigation to complete
    // This ensures the button becomes enabled again if navigation fails or is cancelled
    setTimeout(() => {
      setIsNavigating(false)
    }, 2000)
  }

  return { navigateToSearch, isNavigating }
}
