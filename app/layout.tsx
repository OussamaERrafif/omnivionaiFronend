"use client"

import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { HistoryProvider } from '@/components/history-context'
import { SubscriptionProvider } from '@/contexts/subscription-context'
import { AuthProvider } from '@/contexts/auth-context'
import { GlobalSearchHistory } from '@/components/global-search-history'
import { Header } from '@/components/header'
import { AuthDialog } from '@/components/auth-dialog'
import { PasswordResetDialog } from '@/components/password-reset-dialog'
import { useEffect, useState } from 'react'
import './globals.css'

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

  useEffect(() => {
    const openAuthDialog = (event: Event) => {
      const { mode } = (event as CustomEvent<{ mode?: "signin" | "signup" }>).detail || {}
      setAuthMode(mode === "signup" ? "signup" : "signin")
      setShowAuthDialog(true)
    }

    window.addEventListener("omniai:open-auth", openAuthDialog)
    return () => window.removeEventListener("omniai:open-auth", openAuthDialog)
  }, [])

  return (
    <html lang="en" suppressHydrationWarning>
      <link rel="icon" href="/Blackicon.ico" />
      <body className="font-sans">
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
