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
import { LogOut, User as UserIcon, Settings } from "lucide-react"
import { UserSettingsDialog } from "./user-settings-dialog"

export function UserButton() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    console.log('UserButton: COMPONENT MOUNTED - useEffect triggered')

    // First, try to get the current user from Supabase's internal state
    const checkCurrentUser = async () => {
      try {
        console.log('UserButton: Checking current user from Supabase state')
        // This should work without making network calls
        const { data: { user }, error } = await supabase.auth.getUser()
        console.log('UserButton: Current user check result:', !!user, 'error:', error)

        if (user) {
          console.log('UserButton: Found user in current state, setting data')
          setUser(user)
          setAvatarUrl(user.user_metadata?.avatar_url || null)
          setLoading(false)
          return true
        }
        return false
      } catch (error) {
        console.error('UserButton: Error checking current user:', error)
        return false
      }
    }

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: string, session: any) => {
      console.log('UserButton: Auth state changed:', event, 'has session:', !!session)

      if (event === 'SIGNED_IN' && session?.user) {
        console.log('UserButton: User signed in, setting user data')
        setUser(session.user)
        setAvatarUrl(session.user.user_metadata?.avatar_url || null)
        setLoading(false)
      } else if (event === 'SIGNED_OUT') {
        console.log('UserButton: User signed out, clearing data')
        setUser(null)
        setAvatarUrl(null)
        setLoading(false)
      }
    })

    // Check current state and set fallback
    checkCurrentUser().then((foundUser) => {
      if (!foundUser) {
        // If no user found, set loading to false after a short delay
        setTimeout(() => {
          if (loading) {
            console.log('UserButton: No user found, setting loading to false')
            setLoading(false)
          }
        }, 1000)
      }
    })

    return () => {
      console.log('UserButton: Cleaning up subscription')
      subscription.unsubscribe()
    }
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  // Show loading state while determining auth status
  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
      </div>
    )
  }

  if (!user) return null

  const initials = user.email
    ?.split("@")[0]
    .substring(0, 2)
    .toUpperCase() || "U"

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-10 sm:h-10 sm:w-12 rounded-full">
            <Avatar className="h-8 w-10 sm:h-10 sm:w-12">
              {avatarUrl && (
                <AvatarImage 
                  src={avatarUrl} 
                  alt={user?.user_metadata?.full_name || "User avatar"}
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
                {user.user_metadata?.full_name || "User"}
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
          <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <UserSettingsDialog open={showSettings} onOpenChange={setShowSettings} />
    </>
  )
}
