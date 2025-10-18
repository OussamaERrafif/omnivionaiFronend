import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** Backend API base URL from environment or default to localhost */
const API_BASE_URL = process.env.BACKEND_API_URL || 'http://localhost:8000'

interface HealthResult {
  status: string
  message: string
  url?: string
  response?: any
}

export async function GET(request: NextRequest) {
  const results = {
    backend: { status: 'unknown', message: '', url: '' } as HealthResult,
    supabase: { status: 'unknown', message: '' } as HealthResult
  }

  try {
    // Check Supabase first
    try {
      const supabase = await createClient()
      // Try to get current session to verify Supabase connection
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        results.supabase = { status: 'error', message: `Supabase auth error: ${error.message}` }
      } else {
        results.supabase = { status: 'success', message: 'Supabase is connected' }
      }
    } catch (supabaseError) {
      results.supabase = {
        status: 'error',
        message: supabaseError instanceof Error ? supabaseError.message : 'Supabase connection failed'
      }
    }

    // Forward the health check to the backend
    const backendUrl = `${API_BASE_URL}/health`
    console.log(`Testing backend health at: ${backendUrl}`)
    results.backend.url = backendUrl

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    if (!response.ok) {
      results.backend = {
        status: 'error',
        message: `Backend returned ${response.status}: ${response.statusText}`,
        url: backendUrl
      }
    } else {
      const data = await response.json()
      results.backend = {
        status: 'success',
        message: 'Backend is healthy',
        url: backendUrl,
        response: data
      }
    }

    // Determine overall status
    const overallStatus = (results.backend.status === 'success' && results.supabase.status === 'success') ? 'success' : 'error'

    return NextResponse.json({
      status: overallStatus,
      message: overallStatus === 'success' ? 'All services are healthy' : 'Some services are unhealthy',
      backend: results.backend,
      supabase: results.supabase
    })

  } catch (error) {
    console.error('Health check failed:', error)

    // If we haven't set backend status yet, set it
    if (results.backend.status === 'unknown') {
      results.backend = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        url: API_BASE_URL
      }
    }

    return NextResponse.json({
      status: 'error',
      message: 'Health check failed',
      backend: results.backend,
      supabase: results.supabase,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}