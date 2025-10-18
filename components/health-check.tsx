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
  backend_url: string
  backend_response?: any
  error_type?: string
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
              <CardTitle>Connection Status</CardTitle>
              <CardDescription>
                Testing connection to backend API
              </CardDescription>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Backend URL:</span>
          <code className="text-sm bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
            {health?.backend_url || 'Loading...'}
          </code>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Connection Error:</strong> {error}
            </AlertDescription>
          </Alert>
        )}

        {health?.status === 'error' && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Backend Error:</strong> {health.message}
              {health.error_type && (
                <div className="mt-2 text-xs">
                  Error Type: {health.error_type}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {health?.status === 'success' && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Success:</strong> {health.message}
              {health.backend_response && (
                <div className="mt-2 text-xs">
                  <details>
                    <summary className="cursor-pointer font-medium">Backend Response</summary>
                    <pre className="mt-2 text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded overflow-auto">
                      {JSON.stringify(health.backend_response, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-center pt-4">
          <Button onClick={checkHealth} disabled={loading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Checking...' : 'Check Again'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}