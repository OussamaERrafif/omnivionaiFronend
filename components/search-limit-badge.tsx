/**
 * Search Limit Badge Component
 * Displays remaining searches with visual indicators
 */

"use client"

import React from 'react'
import { Search, Sparkles, AlertCircle } from 'lucide-react'
import { useQuota } from '@/contexts/subscription-context'
import {
  getQuotaColorScheme,
  formatResetDate,
  hasUnlimitedSearches,
  isFreePlan,
} from '@/lib/supabase/subscriptions'
import { cn } from '@/lib/utils'

interface SearchLimitBadgeProps {
  variant?: 'default' | 'compact' | 'detailed'
  showResetTime?: boolean
  className?: string
}

export function SearchLimitBadge({
  variant = 'default',
  showResetTime = true,
  className,
}: SearchLimitBadgeProps) {
  const { searchesRemaining, searchLimit, planType, resetDate, canSearch } = useQuota()

  // Don't show badge if loading or no subscription data
  if (searchLimit === 0) {
    return null
  }

  const isUnlimited = hasUnlimitedSearches(searchLimit)
  const colors = getQuotaColorScheme(searchesRemaining, searchLimit)

  // Compact variant (for mobile/small spaces)
  if (variant === 'compact') {
    return (
      <div className={cn('inline-flex items-center gap-1.5', className)}>
        {isUnlimited ? (
          <div className="flex items-center gap-1 text-xs">
            <Sparkles className="h-3 w-3 text-blue-500" />
            <span className="font-medium text-blue-600 dark:text-blue-400">Unlimited</span>
          </div>
        ) : (
          <div className={cn('flex items-center gap-1 text-xs font-medium', colors.text)}>
            <Search className="h-3 w-3" />
            <span>{searchesRemaining}</span>
          </div>
        )}
      </div>
    )
  }

  // Detailed variant (for settings/billing pages)
  if (variant === 'detailed') {
    return (
      <div className={cn('rounded-lg border p-4', colors.bg, colors.border, className)}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {isUnlimited ? (
                <>
                  <Sparkles className={cn('h-5 w-5', colors.icon)} />
                  <h3 className="font-semibold text-base">Unlimited Searches</h3>
                </>
              ) : (
                <>
                  {canSearch ? (
                    <Search className={cn('h-5 w-5', colors.icon)} />
                  ) : (
                    <AlertCircle className={cn('h-5 w-5', colors.icon)} />
                  )}
                  <h3 className="font-semibold text-base">
                    {searchesRemaining} of {searchLimit} Searches Remaining
                  </h3>
                </>
              )}
            </div>

            {!isUnlimited && (
              <>
                {/* Progress bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                  <div
                    className={cn(
                      'h-2 rounded-full transition-all duration-300',
                      searchesRemaining === 0
                        ? 'bg-red-500'
                        : searchesRemaining <= 1
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    )}
                    style={{
                      width: `${(searchesRemaining / searchLimit) * 100}%`,
                    }}
                  />
                </div>

                {showResetTime && resetDate && (
                  <p className="text-sm text-muted-foreground">
                    Resets: {formatResetDate(resetDate)}
                  </p>
                )}
              </>
            )}

            {isUnlimited && (
              <p className="text-sm text-muted-foreground">
                Enjoy unlimited AI-powered searches with your {planType} plan
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Default variant (for header)
  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      {isUnlimited ? (
        <div
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border',
            colors.badge
          )}
        >
          <Sparkles className="h-4 w-4" />
          <span>Unlimited</span>
        </div>
      ) : (
        <div
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border',
            colors.badge
          )}
        >
          {canSearch ? (
            <Search className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <span>
            {searchesRemaining} search{searchesRemaining !== 1 ? 'es' : ''} left
          </span>
        </div>
      )}

      {!isUnlimited && showResetTime && resetDate && isFreePlan(planType) && (
        <span className="text-xs text-muted-foreground hidden sm:inline">
          • Resets {formatResetDate(resetDate)}
        </span>
      )}
    </div>
  )
}

/**
 * Simplified badge for quick display
 */
export function QuotaBadge({ className }: { className?: string }) {
  return <SearchLimitBadge variant="compact" showResetTime={false} className={className} />
}
