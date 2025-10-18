"use client"

import { useEffect, useState } from "react"
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
  const [supabase] = useState(() => createClient())

  useEffect(() => {
    console.log('UserButton: Component mounted, starting auth check')
    
    let mounted = true
    let timeoutId: NodeJS.Timeout

    const initAuth = async () => {
      try {
        // Set a safety timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          if (mounted && loading) {
            console.log('UserButton: Timeout reached, stopping loading')
            setLoading(false)
          }
        }, 3000) // 3 second timeout

        console.log('UserButton: Fetching session...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        console.log('UserButton: Session result:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          userEmail: session?.user?.email,
          error: error?.message
        })

        if (!mounted) {
          console.log('UserButton: Component unmounted, aborting')
          return
        }

        clearTimeout(timeoutId)

        if (error) {
          console.error('UserButton: Session error:', error)
          setUser(null)
          setLoading(false)
          return
        }

        if (session?.user) {
          console.log('UserButton: User found, setting state')
          setUser(session.user)
        } else {
          console.log('UserButton: No user in session')
          setUser(null)
        }
        
        setLoading(false)
      } catch (error) {
        console.error('UserButton: Unexpected error:', error)
        if (mounted) {
          clearTimeout(timeoutId)
          setUser(null)
          setLoading(false)
        }
      }
    }

    // Initialize immediately
    initAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('UserButton: Auth event:', event, 'has user:', !!session?.user)

      if (!mounted) return

      // Handle all auth events
      switch (event) {
        case 'SIGNED_IN':
        case 'TOKEN_REFRESHED':
        case 'USER_UPDATED':
          if (session?.user) {
            console.log('UserButton: Updating user from event:', event)
            setUser(session.user)
            setLoading(false)
          }
          break
        case 'SIGNED_OUT':
          console.log('UserButton: User signed out')
          setUser(null)
          setLoading(false)
          break
        case 'INITIAL_SESSION':
          // This fires on page load
          if (session?.user) {
            console.log('UserButton: Initial session detected')
            setUser(session.user)
            setLoading(false)
          } else {
            setLoading(false)
          }
          break
      }
    })

    return () => {
      console.log('UserButton: Cleanup')
      mounted = false
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [supabase, loading])

  const handleSignOut = async () => {
    try {
      console.log('UserButton: Signing out...')
      setLoading(true)
      await supabase.auth.signOut()
      setUser(null)
      window.location.href = '/'
    } catch (error) {
      console.error('UserButton: Sign out error:', error)
      setLoading(false)
    }
  }

  // Show loading state
  if (loading) {
    console.log('UserButton: Rendering loading state')
    return (
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-full animate-pulse"></div>
      </div>
    )
  }

  // Don't render if no user
  if (!user) {
    console.log('UserButton: No user, rendering nothing')
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
          <Button variant="ghost" className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full">
            <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
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