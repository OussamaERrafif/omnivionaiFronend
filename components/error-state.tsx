"use client"

import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
  variant?: "error" | "warning" | "info"
}

export function ErrorState({ 
  title = "Something went wrong",
  message, 
  onRetry,
  variant = "error" 
}: ErrorStateProps) {
  const colors = {
    error: {
      bg: "bg-destructive/5",
      border: "border-destructive/30",
      text: "text-destructive",
      icon: "text-destructive"
    },
    warning: {
      bg: "bg-amber-500/5",
      border: "border-amber-500/30",
      text: "text-amber-500",
      icon: "text-amber-500"
    },
    info: {
      bg: "bg-blue-500/5",
      border: "border-blue-500/30",
      text: "text-blue-400",
      icon: "text-blue-400"
    }
  }

  const style = colors[variant]

  return (
    <Card 
      className={`p-8 text-center ${style.bg} ${style.border}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
        <div className={`w-16 h-16 rounded-full ${style.bg} flex items-center justify-center`}>
          <AlertTriangle className={`w-8 h-8 ${style.icon}`} aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h3 className={`text-lg font-semibold ${style.text}`}>
            {title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {message}
          </p>
        </div>
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            className={`${style.border} hover:${style.bg} focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
            aria-label="Retry action"
          >
            <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
            Try Again
          </Button>
        )}
      </div>
    </Card>
  )
}

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-16 px-4" role="status">
      {icon && (
        <div className="w-20 h-20 rounded-2xl bg-muted/20 border border-border/30 flex items-center justify-center mx-auto mb-6">
          {icon}
        </div>
      )}
      <h3 className="text-xl font-semibold text-foreground mb-2">
        {title}
      </h3>
      <p className="text-muted-foreground text-base max-w-md mx-auto mb-6">
        {description}
      </p>
      {action && (
        <Button
          onClick={action.onClick}
          className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}
