/**
 * Application header component with navigation and user controls.
 * 
 * This component provides the main navigation header for the application,
 * including:
 * - Logo and branding
 * - Theme toggle (dark/light mode)
 * - User authentication controls (sign in/sign up/user menu)
 * - Search history access
 * - Mobile-responsive menu with sheet drawer
 * 
 * The header is sticky and uses backdrop blur for a modern glass effect.
 * 
 * @module components/header
 */

"use client"

import Link from 'next/link'
import Image from 'next/image'
import { History, LogIn, Menu, UserPlus } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { UserButton } from '@/components/user-button'
import { SearchLimitBadge } from '@/components/search-limit-badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetClose, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useIsMobile } from '@/hooks/use-mobile'
import { useHistory } from '@/components/history-context'
import { useAuth } from '@/contexts/auth-context'

/**
 * Props for the Header component.
 */
interface HeaderProps {
  /** Callback to open sign in dialog */
  onSignIn: () => void
  /** Callback to open sign up dialog */
  onSignUp: () => void
}

/**
 * Header component - Main navigation and user controls.
 * 
 * Provides responsive navigation with authentication, theme toggling,
 * and search history access. Uses a sheet drawer on mobile devices.
 * 
 * @param props - Component props
 * @returns React component
 */
export function Header({ onSignIn, onSignUp }: HeaderProps) {
  const { user, loading } = useAuth()
  const isSignedIn = !!user
  const { isHistoryOpen, setIsHistoryOpen } = useHistory()
  const isMobile = useIsMobile()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3 py-3 sm:py-4">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/Black.png"
                alt="AI Deep Search"
                width={40}
                height={40}
                className="w-10 h-8 sm:w-12 sm:h-10 dark:hidden"
              />
              <Image
                src="/White.png"
                alt="AI Deep Search"
                width={40}
                height={40}
                className="w-10 h-8 sm:w-12 sm:h-10 hidden dark:block"
              />
            </Link>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-bold tracking-tight">
                <span className="text-foreground">AI Deep </span>
                <span className="text-primary">Search</span>
              </h1>
              <p className="hidden text-xs text-muted-foreground/80 sm:block">
                Your AI research companion — grounded, fast, and verifiable
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {isSignedIn && <SearchLimitBadge variant="default" showResetTime={!isMobile} />}
            
            <ThemeToggle />

            {isSignedIn && !isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                className="rounded-full border border-border/50 bg-background/80 text-muted-foreground backdrop-blur-xl transition-all hover:bg-accent/50 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label={isHistoryOpen ? "Close search history" : "Open search history"}
                title="Search history"
              >
                <History className="h-5 w-5" />
              </Button>
            )}

            {!isMobile && (
              <>
                {!isSignedIn ? (
                  <div className="hidden items-center gap-2 md:flex">
                    <Button
                      variant="ghost"
                      onClick={onSignIn}
                      className="rounded-full px-4 text-sm font-medium text-muted-foreground hover:text-foreground"
                    >
                      Sign In
                    </Button>
                    <Button
                      onClick={onSignUp}
                      className="rounded-full px-5 text-sm font-semibold shadow-sm hover:shadow-md"
                    >
                      Get Started
                    </Button>
                  </div>
                ) : (
                  <div className="hidden md:block">
                    <UserButton />
                  </div>
                )}
              </>
            )}

            {isMobile ? (
              <MobileActions
                isSignedIn={isSignedIn}
                onSignIn={onSignIn}
                onSignUp={onSignUp}
                onOpenHistory={() => setIsHistoryOpen(true)}
              />
            ) : (
              isSignedIn && (
                <div className="md:hidden">
                  <UserButton />
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

interface MobileActionsProps {
  isSignedIn: boolean
  onSignIn: () => void
  onSignUp: () => void
  onOpenHistory: () => void
}

function MobileActions({ isSignedIn, onSignIn, onSignUp, onOpenHistory }: MobileActionsProps) {
  const { isHistoryOpen } = useHistory()

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full border border-border/50 bg-background/80 text-foreground shadow-sm hover:bg-accent/60"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full max-w-xs border-l border-border/40 bg-background/95 p-0 backdrop-blur-xl"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-3 border-b border-border/40 px-5 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/40 bg-card">
              <Image
                src="/Black.png"
                alt="AI Deep Search"
                width={32}
                height={32}
                className="dark:hidden"
              />
              <Image
                src="/White.png"
                alt="AI Deep Search"
                width={32}
                height={32}
                className="hidden dark:block"
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">AI Deep Search</p>
              <p className="text-xs text-muted-foreground">Navigate and manage your account</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-6">
            {isSignedIn ? (
              <div className="space-y-6">
                <div className="rounded-xl border border-border/50 bg-card/40 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Account</span>
                    <UserButton />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Access profile settings or sign out from your account menu.
                  </p>
                </div>

                <SheetClose asChild>
                  <Button
                    variant="secondary"
                    className="w-full justify-start gap-2 rounded-lg"
                    onClick={() => {
                      onOpenHistory()
                    }}
                  >
                    <History className="h-4 w-4" />
                    Search history
                  </Button>
                </SheetClose>

                {isHistoryOpen && (
                  <p className="text-xs text-muted-foreground">
                    Close history from the toggle button at the top of the screen.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <SheetClose asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 rounded-lg"
                    onClick={onSignIn}
                  >
                    <LogIn className="h-4 w-4" />
                    Sign in
                  </Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button className="w-full justify-start gap-2 rounded-lg" onClick={onSignUp}>
                    <UserPlus className="h-4 w-4" />
                    Create account
                  </Button>
                </SheetClose>
              </div>
            )}

            <div className="mt-8 space-y-3 border-t border-border/40 pt-6">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Preferences</p>
              <div className="flex items-center justify-between rounded-xl border border-border/50 bg-card/30 px-4 py-3">
                <span className="text-sm font-medium text-foreground">Theme</span>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}