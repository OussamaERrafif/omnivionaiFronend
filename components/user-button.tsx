"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import { useAuth } from "@/contexts/auth-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogOut, Settings, User as UserIcon, Shield, CreditCard, Sparkles } from "lucide-react"
import { UserSettingsDialog } from "./user-settings-dialog"

export function UserButton() {
  const { user, loading, signOut } = useAuth()
  const [showSettings, setShowSettings] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
      window.location.href = '/'
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-full animate-pulse"></div>
      </div>
    )
  }

  // Don't render if no user
  if (!user) {
    return null
  }

  console.log('UserButton: Rendering user button for:', user.email)

  const avatarUrl = user.user_metadata?.avatar_url || null
  const fullName = user.user_metadata?.full_name || "User"
  const initials = user.email
    ?.split("@")[0]
    .substring(0, 2)
    .toUpperCase() || "U"

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-full border border-border/50 bg-background/50 hover:bg-accent/50 transition-all duration-300 hover:ring-2 hover:ring-primary/20 hover:border-primary/30">
            <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
              {avatarUrl && (
                <AvatarImage
                  src={avatarUrl}
                  alt={`${fullName}'s avatar`}
                  onError={(e) => {
                    console.log('UserButton: Avatar failed to load')
                    e.currentTarget.style.display = 'none'
                  }}
                />
              )}
              <AvatarFallback className="bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64 p-2 rounded-2xl border-border/40 bg-background/95 backdrop-blur-xl shadow-2xl shadow-black/10" align="end" forceMount>
          <DropdownMenuLabel className="font-normal p-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border border-primary/20 bg-primary/5">
                {avatarUrl && (
                  <AvatarImage src={avatarUrl} alt={`${fullName}'s avatar`} />
                )}
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col space-y-0.5">
                <p className="text-sm font-bold leading-none tracking-tight">
                  {fullName}
                </p>
                <p className="text-xs leading-none text-muted-foreground font-medium">
                  {user.email}
                </p>
              </div>
            </div>
            {/* Optional pro badge */}
            <div className="mt-3 flex items-center justify-between rounded-md bg-gradient-to-r from-primary/10 to-primary/5 px-3 py-2 border border-primary/10">
              <span className="text-xs font-semibold text-primary/80 flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> Free Plan</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary cursor-pointer transition-colors">Upgrade</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-border/50 mx-2" />
          <div className="p-1">
            <DropdownMenuItem onClick={() => setShowSettings(true)} className="rounded-xl cursor-pointer hover:bg-accent focus:bg-accent py-2.5 px-3 transition-colors">
              <Settings className="mr-2.5 h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Settings & Profile</span>
            </DropdownMenuItem>
          </div>
          <DropdownMenuSeparator className="bg-border/50 mx-2" />
          <div className="p-1">
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-destructive focus:text-destructive focus:bg-destructive/10 rounded-xl cursor-pointer py-2.5 px-3 transition-colors"
            >
              <LogOut className="mr-2.5 h-4 w-4" />
              <span className="font-medium">Sign out</span>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <UserSettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
      />
    </>
  )
}