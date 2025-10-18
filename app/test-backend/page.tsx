'use client'

import { useState, useEffect } from 'react'

export default function TestBackendPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState<string>('')
  const [backendUrl, setBackendUrl] = useState<string>('')

  const testBackend = async () => {
    setStatus('loading')
    setMessage('Testing backend connection...')

    try {
      // Test the health endpoint
      const response = await fetch('/api/health')

      if (response.ok) {
        const data = await response.json()
        setStatus('success')
        setMessage(`✅ Backend is connected! Status: ${JSON.stringify(data, null, 2)}`)
      } else {
        setStatus('error')
        setMessage(`❌ Backend returned error: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      setStatus('error')
      setMessage(`❌ Failed to connect to backend: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  useEffect(() => {
    // Get backend URL from environment (client-side safe way)
    const url = typeof window !== 'undefined' ?
      (window.location.origin + '/api') :
      'Loading...'
    setBackendUrl(url)
    testBackend()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Backend Connection Test
          </h1>

          <div className="mb-4">
            <p className="text-sm text-gray-600">Testing connection to:</p>
            <p className="font-mono text-xs bg-gray-100 p-2 rounded mt-1">
              {backendUrl}
            </p>
          </div>

          <div className={`mb-4 p-4 rounded-lg ${
            status === 'loading' ? 'bg-blue-50 border-blue-200' :
            status === 'success' ? 'bg-green-50 border-green-200' :
            'bg-red-50 border-red-200'
          } border`}>
            <div className="flex items-center justify-center mb-2">
              {status === 'loading' && (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              )}
              {status === 'success' && (
                <div className="text-green-500 text-xl">✓</div>
              )}
              {status === 'error' && (
                <div className="text-red-500 text-xl">✗</div>
              )}
            </div>

            <pre className={`text-sm whitespace-pre-wrap ${
              status === 'success' ? 'text-green-700' :
              status === 'error' ? 'text-red-700' :
              'text-blue-700'
            }`}>
              {message}
            </pre>
          </div>

          <button
            onClick={testBackend}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Testing...' : 'Test Again'}
          </button>
        </div>
      </div>
    </div>
  )
}