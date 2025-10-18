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
    const getUser = async () => {
      try {
        console.log('UserButton: Starting getUser function')
        
        // First try to get the current session with timeout
        console.log('UserButton: Calling getSession...')
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('getSession timeout')), 5000)
        )
        
        const { data: sessionData, error: sessionError } = await Promise.race([sessionPromise, timeoutPromise]) as any
        console.log('UserButton: Session call completed - data:', !!sessionData?.session, 'error:', sessionError)
        
        if (sessionData?.session?.user) {
          console.log('UserButton: Using user from session')
          setUser(sessionData.session.user)
          setAvatarUrl(sessionData.session.user.user_metadata?.avatar_url || null)
          setLoading(false)
          return
        }
        
        // Fallback: get user data directly if session didn't have user
        console.log('UserButton: Calling getUser...')
        const userPromise = supabase.auth.getUser()
        const userTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('getUser timeout')), 5000)
        )
        
        const {
          data: { user },
          error: userError
        } = await Promise.race([userPromise, userTimeoutPromise]) as any
        console.log('UserButton: User call completed - user:', !!user, 'error:', userError)
        
        setUser(user)
        setAvatarUrl(user?.user_metadata?.avatar_url || null)
        console.log('UserButton: State updated successfully')
      } catch (error) {
        console.error('UserButton: Exception in getUser:', error)
        // If we have an auth state change, use that instead
        setUser(null)
      } finally {
        console.log('UserButton: Setting loading to false')
        setLoading(false)
      }
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: string, session: any) => {
      console.log('UserButton: Auth state changed:', event, 'has session:', !!session)
      setUser(session?.user ?? null)
      setAvatarUrl(session?.user?.user_metadata?.avatar_url || null)
      setLoading(false)
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
