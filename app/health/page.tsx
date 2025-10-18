import { Suspense } from 'react'
import HealthCheck from '@/components/health-check'

export default function HealthPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Backend Health Check
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Check if the frontend can connect to the backend API
            </p>
          </div>

          <Suspense fallback={<HealthCheckSkeleton />}>
            <HealthCheck />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

function HealthCheckSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
      <div className="animate-pulse">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-4"></div>
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-6"></div>
        <div className="space-y-3">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
        </div>
      </div>
    </div>
  )
}