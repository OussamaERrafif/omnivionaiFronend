/**
 * Utility functions for the AI Deep Search frontend application.
 * 
 * This module provides core utilities including:
 * - CSS class merging utilities
 * - API client functions for backend communication
 * - TypeScript interfaces for API data types
 * 
 * @module lib/utils
 */

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { createClient } from '@/lib/supabase/client'
import { SearchMode } from '@/types/search-mode'

/**
 * Merges CSS class names using clsx and tailwind-merge.
 * 
 * This utility combines multiple class names and intelligently merges
 * Tailwind CSS classes to avoid conflicts (e.g., if both 'px-2' and 'px-4'
 * are provided, only the last one will be applied).
 * 
 * @param inputs - Variable number of class values (strings, objects, arrays)
 * @returns Merged and deduplicated class string
 * 
 * @example
 * ```tsx
 * cn('px-2 py-1', isActive && 'bg-blue-500', className)
 * // Returns: 'px-2 py-1 bg-blue-500 custom-class'
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// API configuration - Now using Next.js API routes
const API_BASE_URL = "/api"

/**
 * Represents a single source citation with metadata from the research.
 * 
 * Contains comprehensive information about a source including its URL,
 * content, relevance, and trust metrics.
 */
export interface Citation {
  /** The URL of the source */
  url: string
  /** Title of the source document/page */
  title: string
  /** Section within the source where content was found */
  section: string
  /** Unique identifier for the paragraph/content block */
  paragraph_id: string
  /** Extracted content text */
  content: string
  /** Relevance score (0.0-1.0) based on query match */
  relevance_score: number
  /** ISO timestamp of when the source was retrieved */
  timestamp: string
  /** Trust verification status */
  trust_flag: string
  /** Numeric trust score (0-100) */
  trust_score: number
  /** Whether the source is from a trusted domain */
  is_trusted: boolean
  /** Human-readable trust category (e.g., "Academic Source") */
  trust_category: string
  /** Domain name of the source */
  domain: string
}

/**
 * Complete search result response from the backend.
 * 
 * Contains the synthesized answer, all citations, confidence metrics,
 * and formatted markdown content.
 */
export interface SearchResponse {
  /** Synthesized answer to the research query */
  answer: string
  /** Array of all sources cited in the answer */
  citations: Citation[]
  /** Overall confidence score (0.0-1.0) for the answer */
  confidence_score: number
  /** Full research paper in markdown format */
  markdown_content: string
}

/**
 * Real-time progress update during streaming search.
 * 
 * Provides information about the current stage of the research pipeline
 * with optional metadata like search queries and visited sites.
 */
export interface ProgressUpdate {
  /** Current pipeline step (e.g., "validation", "research") */
  step: string
  /** Step status (e.g., "started", "completed", "failed") */
  status: string
  /** Human-readable progress description */
  details: string
  /** ISO timestamp of the update */
  timestamp: string
  /** Overall progress percentage (0.0-100.0) */
  progress_percentage: number
  /** Search queries being used (if applicable) */
  search_queries?: string[]
  /** URLs being visited (if applicable) */
  sites_visited?: string[]
  /** Number of sources found (if applicable) */
  sources_found?: number
}

/**
 * Wrapper for streaming search responses (Server-Sent Events format).
 * 
 * Each SSE message is one of these types with corresponding data payload.
 */
export interface StreamingResponse {
  /** Response type indicator */
  type: "progress" | "result" | "error"
  /** Generic data payload (for errors) */
  data?: any
  /** Progress update (if type="progress") */
  progress?: ProgressUpdate
  /** Final result (if type="result") */
  result?: SearchResponse
}

/**
 * Execute a research query with standard JSON response.
 * 
 * This function sends a POST request to the backend API and returns
 * the complete search result. Use this for simple queries without
 * real-time progress updates.
 * 
 * @param query - The research question or topic to investigate
 * @param searchMode - Search mode: "deep", "moderate", "quick", or "sla". Default is "deep"
 * @returns Promise resolving to the complete search response
 * @throws Error if the request fails or the query is invalid (400) or server error (500)
 * 
 * @example
 * ```typescript
 * try {
 *   const result = await searchQuery("What is quantum computing?", "deep");
 *   console.log(result.answer);
 *   console.log(`Found ${result.citations.length} citations`);
 * } catch (error) {
 *   console.error("Search failed:", error.message);
 * }
 * ```
 */
export async function searchQuery(query: string, searchMode: SearchMode = "deep"): Promise<SearchResponse> {
  // Get auth token from Supabase session
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token || null
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  }
  
  // Add authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  const response = await fetch(`${API_BASE_URL}/search`, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, search_mode: searchMode }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: response.statusText }))
    const errorMessage = errorData.detail || response.statusText
    
    // Check if it's a validation error (400 status)
    if (response.status === 400) {
      throw new Error(errorMessage)
    }
    
    throw new Error(`Search failed: ${errorMessage}`)
  }

  return response.json()
}

/**
 * Execute a research query with real-time progress updates via Server-Sent Events.
 * 
 * This function streams progress updates from the backend as the research
 * pipeline executes. It provides callbacks for each stage of the research
 * process including validation, analysis, research, and synthesis.
 * 
 * The streaming response uses Server-Sent Events (SSE) to provide real-time
 * updates without polling. This gives users visibility into the research
 * process and improves perceived performance.
 * 
 * @param query - The research question or topic to investigate
 * @param searchMode - Search mode: "deep", "moderate", "quick", or "sla". Default is "deep"
 * @param onProgress - Optional callback for progress updates (called multiple times)
 * @param onResult - Optional callback for the final result (called once)
 * @param onError - Optional callback for errors
 * @returns Promise that resolves when streaming completes or rejects on error
 * 
 * @example
 * ```typescript
 * await searchQueryStreaming(
 *   "What is machine learning?",
 *   "deep",
 *   (progress) => {
 *     console.log(`${progress.step}: ${progress.details}`);
 *     console.log(`Progress: ${progress.progress_percentage}%`);
 *   },
 *   (result) => {
 *     console.log("Search complete!");
 *     console.log(result.answer);
 *   },
 *   (error) => {
 *     console.error("Search error:", error);
 *   }
 * );
 * ```
 */
export async function searchQueryStreaming(
  query: string,
  searchMode: SearchMode = "deep",
  onProgress?: (progress: ProgressUpdate) => void,
  onResult?: (result: SearchResponse) => void,
  onError?: (error: string) => void
): Promise<void> {
  try {
    // Get auth token from Supabase session
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token || null
    
    console.log('🔍 [Client] Starting streaming search for:', query)
    console.log('🎯 [Client] Search mode:', searchMode)
    console.log('🔑 [Client] Auth token present:', !!token)
    console.log('👤 [Client] User ID:', session?.user?.id || 'anonymous')
    
    // Prepare headers
    const headers: HeadersInit = {
      'Accept': 'text/event-stream',
      'Cache-Control': 'no-cache',
    }
    
    // Add authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
      console.log('✅ [Client] Adding authorization header')
    } else {
      console.log('⚠️ [Client] No auth token found - user may not be logged in')
    }
    
    const response = await fetch(`${API_BASE_URL}/search/${encodeURIComponent(query)}?search_mode=${encodeURIComponent(searchMode)}`, {
      headers
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }))
      const errorMessage = errorData.detail || response.statusText
      throw new Error(errorMessage)
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
      throw new Error("Failed to get response reader")
    }

    let buffer = ""

    try {
      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")

        // Keep the last incomplete line in buffer
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim()
            if (data) {
              try {
                const parsed: StreamingResponse = JSON.parse(data)

                switch (parsed.type) {
                  case "progress":
                    if (parsed.progress) {
                      onProgress?.(parsed.progress)
                    }
                    break
                  case "result":
                    if (parsed.result) {
                      onResult?.(parsed.result)
                    }
                    break
                  case "error":
                    onError?.(parsed.data?.error || "Unknown error")
                    break
                }
              } catch (e) {
                console.error("Failed to parse streaming data:", data, e)
              }
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    onError?.(errorMessage)
  }
}