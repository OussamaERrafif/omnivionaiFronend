"use client"

import { useState } from "react"
import { Crown, Zap, Star, AlertTriangle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UserSettingsDialog } from "./user-settings-dialog"
import { PlanType } from "@/types/subscription"

interface QuotaExceededDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  currentPlan: PlanType
  searchesUsed: number
  searchLimit: number
  nextResetDate: string
}

export function QuotaExceededDialog({
  isOpen,
  onOpenChange,
  currentPlan,
  searchesUsed,
  searchLimit,
  nextResetDate,
}: QuotaExceededDialogProps) {
  const [showSettings, setShowSettings] = useState(false)

  const planIcons = {
    free: Star,
    pro: Zap,
    enterprise: Crown,
    trial: Star,
  }

  const planColors = {
    free: "text-gray-600",
    pro: "text-blue-600",
    enterprise: "text-purple-600",
    trial: "text-orange-600",
  }

  const Icon = planIcons[currentPlan]

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <DialogTitle className="text-xl">Search Limit Reached</DialogTitle>
            <DialogDescription>
              You've used all {searchLimit} searches included in your{' '}
              <span className={`font-semibold ${planColors[currentPlan]}`}>
                {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} Plan
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Current Usage */}
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Current Usage</span>
                <Badge variant="outline" className="text-xs">
                  <Icon className="mr-1 h-3 w-3" />
                  {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
                </Badge>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Searches Used</span>
                  <span className="font-medium">{searchesUsed} / {searchLimit}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-orange-500 h-2 rounded-full"
                    style={{ width: `${(searchesUsed / searchLimit) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Resets on {formatDate(nextResetDate)}
                </p>
              </div>
            </div>

            {/* Upgrade Options */}
            <div className="space-y-3">
              <h4 className="font-medium text-center">Ready to upgrade?</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false)
                    setShowSettings(true)
                  }}
                  className="flex flex-col items-center gap-1 h-auto py-3"
                >
                  <Zap className="h-4 w-4 text-blue-600" />
                  <span className="text-xs">Pro Plan</span>
                  <span className="text-xs text-muted-foreground">$19/mo</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false)
                    setShowSettings(true)
                  }}
                  className="flex flex-col items-center gap-1 h-auto py-3"
                >
                  <Crown className="h-4 w-4 text-purple-600" />
                  <span className="text-xs">Enterprise</span>
                  <span className="text-xs text-muted-foreground">$99/mo</span>
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Maybe Later
              </Button>
              <Button
                onClick={() => {
                  onOpenChange(false)
                  setShowSettings(true)
                }}
                className="flex-1"
              >
                View Plans
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <UserSettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
        initialTab="billing"
      />
    </>
  )
}