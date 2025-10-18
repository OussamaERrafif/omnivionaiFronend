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
import { AuthProvider } from '@/contexts/auth-context'
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
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin")
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [showPasswordReset, setShowPasswordReset] = useState(false)

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
          <AuthProvider>
            <SubscriptionProvider>
              <HistoryProvider>
                <Header onSignIn={handleSignIn} onSignUp={handleSignUp} />
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
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
