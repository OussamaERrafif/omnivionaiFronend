"use client"

import type { Metadata } from 'next'
import Link from 'next/link'
import { Inter } from 'next/font/google'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import Image from 'next/image'
import { Menu } from 'lucide-react'
import { ThemeProvider } from '@/components/theme-provider'
import { HistoryProvider } from '@/components/history-context'
import { SubscriptionProvider } from '@/contexts/subscription-context'
import { GlobalSearchHistory } from '@/components/global-search-history'
import { Header } from '@/components/header'
import { AuthDialog } from '@/components/auth-dialog'
import { PasswordResetDialog } from '@/components/password-reset-dialog'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin")
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const [supabase, setSupabase] = useState<any>(null)

  useEffect(() => {
    try {
      console.log('Layout: Creating Supabase client...')
      const client = createClient()
      setSupabase(client)
      console.log('Layout: Supabase client created successfully')

      const checkUser = async () => {
        console.log('Layout: Checking for authenticated user...')
        const {
          data: { user },
          error
        } = await client.auth.getUser()
        console.log('Layout: User check result:', user, 'Error:', error)
        setIsSignedIn(!!user)
      }

      checkUser()

      const {
        data: { subscription },
      } = client.auth.onAuthStateChange((_event, session) => {
        console.log('Layout: Auth state changed:', _event, 'User:', session?.user)
        setIsSignedIn(!!session?.user)
      })

      return () => subscription.unsubscribe()
    } catch (error) {
      // Supabase not configured, skip auth checks
      console.warn('Layout: Supabase not configured:', error)
    }
  }, [])

  const handleSignIn = () => {
    setAuthMode("signin")
    setShowAuthDialog(true)
  }

  const handleSignUp = () => {
    setAuthMode("signup")
    setShowAuthDialog(true)
  }

  const handleForgotPassword = () => {
    setShowAuthDialog(false)
    setShowPasswordReset(true)
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <link rel="icon" href="/Blackicon.ico" />
      <body className={`font-sans ${inter.variable} ${GeistMono.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SubscriptionProvider>
            <HistoryProvider>
              <Header isSignedIn={isSignedIn} onSignIn={handleSignIn} onSignUp={handleSignUp} />
              {children}
              <GlobalSearchHistory />
            <Analytics />
            <AuthDialog
              open={showAuthDialog}
              onOpenChange={setShowAuthDialog}
              mode={authMode}
              onModeChange={setAuthMode}
              onForgotPassword={handleForgotPassword}
            />
            <PasswordResetDialog
              open={showPasswordReset}
              onOpenChange={setShowPasswordReset}
            />
            </HistoryProvider>
          </SubscriptionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
