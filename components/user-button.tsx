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
  const [showSettings, setShowSettings] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      setAvatarUrl(user?.user_metadata?.avatar_url || null)
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setAvatarUrl(session?.user?.user_metadata?.avatar_url || null)
    })

    // Listen for avatar updates from settings dialog
    const handleAvatarUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ avatarUrl: string | null }>
      setAvatarUrl(customEvent.detail.avatarUrl)
    }

    window.addEventListener('avatar-updated', handleAvatarUpdate)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('avatar-updated', handleAvatarUpdate)
    }
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.reload()
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
