"use client"

import { cn } from "@/lib/utils"

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted/50", className)}
      aria-hidden="true"
    />
  )
}

export function SearchResultsSkeleton() {
  return (
    <div className="space-y-8" role="status" aria-label="Loading search results">
      <span className="sr-only">Loading search results...</span>
      
      {/* Header skeleton */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-28" />
        </div>
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
      </div>

      {/* Content skeleton */}
      <div className="rounded-xl border border-border/50 p-10 space-y-6">
        <Skeleton className="h-8 w-2/3" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
        <Skeleton className="h-6 w-1/2" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    </div>
  )
}

export function SourceCardSkeleton() {
  return (
    <div className="block p-6 rounded-xl border border-border/50 space-y-3" role="status">
      <span className="sr-only">Loading source...</span>
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1 space-y-3">
          <Skeleton className="h-6 w-3/4" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <Skeleton className="h-8 w-8 flex-shrink-0" />
      </div>
    </div>
  )
}

export function StepSkeleton() {
  return (
    <div className="py-3" role="status">
      <span className="sr-only">Processing step...</span>
      <div className="flex items-start gap-4">
        <Skeleton className="w-6 h-6 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-4 w-2/3" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
          </div>
        </div>
      </div>
    </div>
  )
}
