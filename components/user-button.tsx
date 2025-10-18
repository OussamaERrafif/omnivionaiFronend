"use client"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
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
import { LogOut, Settings } from "lucide-react"
import { UserSettingsDialog } from "./user-settings-dialog"

export function UserButton() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const supabase = createClient()
  const initializedRef = useRef(false)

  useEffect(() => {
    // Prevent double initialization in React Strict Mode
    if (initializedRef.current) {
      console.log('UserButton: Already initialized, skipping')
      return
    }
    initializedRef.current = true

    console.log('UserButton: Initializing component')

    let mounted = true

    const initAuth = async () => {
      try {
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        console.log('UserButton: Session check:', { 
          hasSession: !!session, 
          hasUser: !!session?.user,
          error: error?.message 
        })

        if (!mounted) return

        if (error) {
          console.error('UserButton: Session error:', error)
          setLoading(false)
          return
        }

        if (session?.user) {
          console.log('UserButton: Setting user from session')
          setUser(session.user)
        }
        
        setLoading(false)
      } catch (error) {
        console.error('UserButton: Init error:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    // Initialize auth state
    initAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('UserButton: Auth state changed:', event, 'has user:', !!session?.user)

      if (!mounted) return

      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)
        setLoading(false)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setLoading(false)
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Update user on token refresh
        setUser(session.user)
      } else if (event === 'USER_UPDATED' && session?.user) {
        // Update user when profile changes
        setUser(session.user)
      }
    })

    return () => {
      console.log('UserButton: Cleaning up')
      mounted = false
      subscription.unsubscribe()
    }
  }, []) // Empty dependency array - only run once

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      window.location.href = '/' // Use href instead of reload for cleaner navigation
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
    console.log('UserButton: No user, not rendering')
    return null
  }

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
          <Button variant="ghost" className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full">
            <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
              {avatarUrl && (
                <AvatarImage 
                  src={avatarUrl} 
                  alt={`${fullName}'s avatar`}
                />
              )}
              <AvatarFallback className="bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {fullName}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowSettings(true)}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={handleSignOut} 
            className="text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <UserSettingsDialog 
        open={showSettings} 
        onOpenChange={setShowSettings} 
      />
    </>
  )
}