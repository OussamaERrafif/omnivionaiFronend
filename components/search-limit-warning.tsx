/**
 * Search Limit Warning Modal
 * Shows warnings when user is low on searches or has exceeded quota
 */

"use client"

import React from 'react'
import { AlertCircle, Sparkles, Clock, TrendingUp } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useQuota } from '@/contexts/subscription-context'
import {
  getQuotaColorScheme,
  formatResetDate,
  getTimeUntilReset,
} from '@/lib/supabase/subscriptions'

interface SearchLimitWarningProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpgrade?: () => void
  variant?: 'low' | 'exceeded'
}

export function SearchLimitWarning({
  open,
  onOpenChange,
  onUpgrade,
  variant = 'low',
}: SearchLimitWarningProps) {
  const { searchesRemaining, searchesUsed, searchLimit, resetDate } = useQuota()
  const colors = getQuotaColorScheme(searchesRemaining, searchLimit)
  const timeUntilReset = resetDate ? getTimeUntilReset(resetDate) : null
  const progressPercentage = (searchesUsed / searchLimit) * 100

  const isExceeded = variant === 'exceeded' || searchesRemaining === 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-full ${colors.bg}`}>
              {isExceeded ? (
                <AlertCircle className={`h-6 w-6 ${colors.icon}`} />
              ) : (
                <Clock className={`h-6 w-6 ${colors.icon}`} />
              )}
            </div>
            <div>
              <DialogTitle className="text-left">
                {isExceeded ? 'Search Limit Reached' : 'Low on Searches'}
              </DialogTitle>
              <DialogDescription className="text-left">
                {isExceeded
                  ? "You've used all your free searches for this month"
                  : `Only ${searchesRemaining} search${searchesRemaining !== 1 ? 'es' : ''} remaining`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Usage Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Monthly Usage</span>
              <span className="font-medium">
                {searchesUsed} / {searchLimit} searches
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Reset Information */}
          {resetDate && (
            <div className={`p-3 rounded-lg border ${colors.bg} ${colors.border}`}>
              <div className="flex items-start gap-2">
                <Clock className={`h-4 w-4 mt-0.5 ${colors.icon}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium">Next Reset</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatResetDate(resetDate)}
                    {timeUntilReset && ` (in ${timeUntilReset.formatted})`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Upgrade Benefits */}
          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-2">
                  Upgrade to Pro
                </h4>
                <ul className="space-y-1.5 text-xs text-blue-700 dark:text-blue-300">
                  <li className="flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-blue-600" />
                    <span>Unlimited AI searches</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-blue-600" />
                    <span>Export & share results</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-blue-600" />
                    <span>Priority support</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-blue-600" />
                    <span>Unlimited history</span>
                  </li>
                </ul>
                <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mt-3">
                  Only $9.99/month
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              onClick={() => {
                onUpgrade?.()
                onOpenChange(false)
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Upgrade Now
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              {isExceeded ? 'Maybe Later' : 'Continue'}
            </Button>
          </div>

          {/* Footer note */}
          {!isExceeded && (
            <p className="text-xs text-center text-muted-foreground">
              You can continue using your remaining{' '}
              {searchesRemaining === 1 ? 'search' : 'searches'} this month
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Compact warning banner for inline display
 */
export function SearchLimitBanner({
  onUpgrade,
  className,
}: {
  onUpgrade?: () => void
  className?: string
}) {
  const { searchesRemaining, canSearch } = useQuota()

  if (canSearch && searchesRemaining > 1) {
    return null
  }

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border ${
        searchesRemaining === 0
          ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
          : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800'
      } ${className}`}
    >
      <div className="flex items-center gap-2">
        <AlertCircle
          className={`h-4 w-4 ${
            searchesRemaining === 0
              ? 'text-red-600 dark:text-red-400'
              : 'text-yellow-600 dark:text-yellow-400'
          }`}
        />
        <p className="text-sm font-medium">
          {searchesRemaining === 0
            ? 'Monthly search limit reached'
            : `Only ${searchesRemaining} search left this month`}
        </p>
      </div>
      {onUpgrade && (
        <Button
          size="sm"
          variant="ghost"
          onClick={onUpgrade}
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:text-blue-400"
        >
          Upgrade
        </Button>
      )}
    </div>
  )
}
