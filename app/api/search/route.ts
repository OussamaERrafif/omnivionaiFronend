/**
 * Next.js API route for search queries.
 * 
 * This route acts as a proxy between the frontend and the Python backend API.
 * It provides:
 * - Request validation
 * - Error handling
 * - Backend API communication
 * - Response transformation
 * 
 * The route forwards POST requests to the backend /search endpoint and
 * returns the structured search response.
 * 
 * @module app/api/search/route
 */

import { NextRequest, NextResponse } from 'next/server'

/** Backend API base URL from environment or default to localhost */
const API_BASE_URL = process.env.BACKEND_API_URL || 'http://localhost:8000'

/**
 * POST handler for search queries.
 * 
 * Accepts a JSON body with a query and forwards it to the backend API.
 * Returns the complete search response with answer, citations, and markdown.
 * 
 * @param request - Next.js request object
 * @returns JSON response with search results or error
 * 
 * @example
 * Request:
 * ```json
 * POST /api/search
 * { "query": "What is quantum computing?" }
 * ```
 * 
 * Response:
 * ```json
 * {
 *   "answer": "...",
 *   "citations": [...],
 *   "confidence_score": 0.95,
 *   "markdown_content": "..."
 * }
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, search_mode } = body

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    // Get authorization header from incoming request
    const authHeader = request.headers.get('authorization')
    
    console.log('🔍 [Next.js POST] Search request for query')
    console.log('🎯 [Next.js POST] Search mode:', search_mode || 'deep (default)')
    console.log('🔑 [Next.js POST] Auth header present:', !!authHeader)
    
    // Prepare headers for backend request
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    // Forward authorization header if present
    if (authHeader) {
      headers['Authorization'] = authHeader
      console.log('✅ [Next.js POST] Forwarding authorization header')
    } else {
      console.log('⚠️ [Next.js POST] No authorization header to forward')
    }

    const response = await fetch(`${API_BASE_URL}/search`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, search_mode: search_mode || 'deep' }),
    })

    if (!response.ok) {
      throw new Error(`Backend API failed: ${response.statusText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Search failed' },
      { status: 500 }
    )
  }
}
