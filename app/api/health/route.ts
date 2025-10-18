import { NextRequest, NextResponse } from 'next/server'

/** Backend API base URL from environment or default to localhost */
const API_BASE_URL = process.env.BACKEND_API_URL || 'http://localhost:8000'

export async function GET(request: NextRequest) {
  try {
    // Forward the health check to the backend
    const backendUrl = `${API_BASE_URL}/health`
    console.log(`Testing backend health at: ${backendUrl}`)

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    if (!response.ok) {
      return NextResponse.json({
        status: 'error',
        message: `Backend returned ${response.status}: ${response.statusText}`,
        backend_url: backendUrl
      }, { status: response.status })
    }

    const data = await response.json()

    return NextResponse.json({
      status: 'success',
      message: 'Backend is healthy',
      backend_url: backendUrl,
      backend_response: data
    })

  } catch (error) {
    console.error('Backend health check failed:', error)

    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      backend_url: API_BASE_URL,
      error_type: error instanceof Error ? error.name : 'Unknown'
    }, { status: 500 })
  }
}