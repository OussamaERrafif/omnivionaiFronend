/**
 * Next.js API route for streaming search queries with real-time progress.
 * 
 * This route acts as a proxy for Server-Sent Events (SSE) streaming between
 * the frontend and Python backend. It provides:
 * - Real-time progress updates during research
 * - Proper SSE header handling
 * - Response streaming
 * - Error handling
 * 
 * The route forwards GET requests to the backend /search/{query} endpoint
 * and streams the progress updates and final result back to the client.
 * 
 * @module app/api/search/[query]/route
 */

import { NextRequest, NextResponse } from 'next/server'

/** Backend API base URL from environment or default to localhost */
const API_BASE_URL = process.env.BACKEND_API_URL || 'http://localhost:8000'

/**
 * GET handler for streaming search queries.
 * 
 * Accepts a URL-encoded query parameter and streams real-time progress
 * updates from the backend using Server-Sent Events (SSE).
 * 
 * @param request - Next.js request object
 * @param params - Route parameters containing the query
 * @returns Streaming response with progress updates and final result
 * 
 * @example
 * Request:
 * ```
 * GET /api/search/What%20is%20quantum%20computing
 * Accept: text/event-stream
 * ```
 * 
 * Response stream:
 * ```
 * data: {"type":"progress","progress":{"step":"validation",...}}
 * data: {"type":"progress","progress":{"step":"research",...}}
 * data: {"type":"result","result":{"answer":"...",...}}
 * ```
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ query: string }> }
) {
  try {
    const { query } = await params
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    const decodedQuery = decodeURIComponent(query)
    
    // Get search_mode from query parameters
    const searchParams = request.nextUrl.searchParams
    const searchMode = searchParams.get('search_mode') || 'deep'
    
    // Get authorization header from incoming request
    const authHeader = request.headers.get('authorization')
    
    console.log('🔍 [Next.js Proxy] Search request for:', decodedQuery)
    console.log('🎯 [Next.js Proxy] Search mode:', searchMode)
    console.log('🔑 [Next.js Proxy] Auth header present:', !!authHeader)
    
    // Prepare headers for backend request
    const headers: HeadersInit = {
      'Accept': 'text/event-stream',
      'Cache-Control': 'no-cache',
    }
    
    // Forward authorization header if present
    if (authHeader) {
      headers['Authorization'] = authHeader
      console.log('✅ [Next.js Proxy] Forwarding authorization header')
    } else {
      console.log('⚠️ [Next.js Proxy] No authorization header to forward')
    }
    
    // Set up streaming response with search_mode parameter
    const backendUrl = `${API_BASE_URL}/search/${encodeURIComponent(decodedQuery)}?search_mode=${encodeURIComponent(searchMode)}`
    console.log('🌐 [Next.js Proxy] Backend URL:', backendUrl)
    
    const response = await fetch(backendUrl, { headers })

    if (!response.ok) {
      throw new Error(`Backend API failed: ${response.statusText}`)
    }

    // Stream the response back to the client
    return new NextResponse(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Streaming search API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Search failed' },
      { status: 500 }
    )
  }
}
