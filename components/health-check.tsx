'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface HealthResponse {
  status: 'success' | 'error'
  message: string
  backend: {
    status: string
    message: string
    url?: string
    response?: any
  }
  supabase: {
    status: string
    message: string
  }
  error?: string
}

export default function HealthCheck() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const checkHealth = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/health')
      const data: HealthResponse = await response.json()
      setHealth(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check health')
      setHealth(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkHealth()
  }, [])

  const getStatusIcon = () => {
    if (loading) return <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
    if (health?.status === 'success') return <CheckCircle className="h-5 w-5 text-green-500" />
    return <XCircle className="h-5 w-5 text-red-500" />
  }

  const getStatusBadge = () => {
    if (loading) return <Badge variant="secondary">Checking...</Badge>
    if (health?.status === 'success') return <Badge variant="default" className="bg-green-500">Healthy</Badge>
    return <Badge variant="destructive">Unhealthy</Badge>
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <CardTitle>Service Health Check</CardTitle>
              <CardDescription>
                Testing connection to backend API and Supabase
              </CardDescription>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Backend Status */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Backend API</span>
            <Badge variant={health?.backend?.status === 'success' ? 'default' : 'destructive'} className={health?.backend?.status === 'success' ? 'bg-green-500' : ''}>
              {health?.backend?.status === 'success' ? 'Healthy' : 'Unhealthy'}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>URL:</span>
            <code className="text-sm bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
              {health?.backend?.url || 'Loading...'}
            </code>
          </div>
          <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {health?.backend?.message}
          </div>
          {health?.backend?.response && (
            <details className="mt-2">
              <summary className="cursor-pointer text-sm font-medium">Backend Response</summary>
              <pre className="mt-2 text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded overflow-auto">
                {JSON.stringify(health.backend.response, null, 2)}
              </pre>
            </details>
          )}
        </div>

        {/* Supabase Status */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Supabase</span>
            <Badge variant={health?.supabase?.status === 'success' ? 'default' : 'destructive'} className={health?.supabase?.status === 'success' ? 'bg-green-500' : ''}>
              {health?.supabase?.status === 'success' ? 'Connected' : 'Disconnected'}
            </Badge>
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {health?.supabase?.message}
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Connection Error:</strong> {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-center pt-4">
          <Button onClick={checkHealth} disabled={loading} variant="outline">
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )