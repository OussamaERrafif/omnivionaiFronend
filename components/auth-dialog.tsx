/**
 * Authentication dialog component for sign in and sign up.
 * 
 * This component provides a unified authentication modal that supports:
 * - Sign in with email and password
 * - Sign up with email, password, and full name
 * - Password validation and confirmation
 * - Email validation
 * - Error handling and user feedback
 * - Forgot password flow
 * - Mode switching between sign in and sign up
 * 
 * Integrates with Supabase Auth for authentication backend.
 * 
 * @module components/auth-dialog
 */

"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { LiquidGlassButton } from "@/components/ui/liquid-glass-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Mail, Lock, User, CheckCircle2 } from "lucide-react"

/**
 * Props for the AuthDialog component.
 */
interface AuthDialogProps {
  /** Whether the dialog is currently open */
  open: boolean
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void
  /** Current auth mode (sign in or sign up) */
  mode: "signin" | "signup"
  /** Optional callback to switch auth mode */
  onModeChange?: (mode: "signin" | "signup") => void
  /** Optional callback when "forgot password" is clicked */
  onForgotPassword?: () => void
}

/**
 * AuthDialog component - Unified authentication modal.
 * 
 * Provides sign in and sign up functionality with validation,
 * error handling, and integration with Supabase Auth.
 * 
 * @param props - Component props
 * @returns React component
 */
export function AuthDialog({ open, onOpenChange, mode, onModeChange, onForgotPassword }: AuthDialogProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  const resetForm = () => {
    setEmail("")
    setPassword("")
    setConfirmPassword("")
    setFullName("")
    setError(null)
    setMessage(null)
    setSuccess(false)
  }

  const validateSignup = () => {
    if (!email || !password) {
      setError("Please fill in all required fields")
      return false
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      return false
    }

    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match")
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address")
      return false
    }

    return true
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)
    setSuccess(false)

    if (!validateSignup()) {
      setLoading(false)
      return
    }

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              full_name: fullName || undefined,
            },
          },
        })
        
        if (error) throw error
        
        setSuccess(true)
        setMessage(`We've sent a confirmation email to ${email}. Please check your inbox and click the confirmation link to activate your account.`)
        // Don't reset form immediately so user can see their email
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        
        if (error) {
          // Provide more specific error messages
          if (error.message.includes("Invalid login credentials")) {
            throw new Error("Invalid email or password. Please try again.")
          }
          throw error
        }
        
        setSuccess(true)
        setMessage("Sign in successful! Redirecting...")
        
        // Close modal immediately and reload
        setTimeout(() => {
          onOpenChange(false)
          // window.location.reload()
        }, 500)
      }
    } catch (error: any) {
      setError(error.message || "An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleModeSwitch = () => {
    resetForm()
    if (onModeChange) {
      onModeChange(mode === "signin" ? "signup" : "signin")
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm()
      onOpenChange(isOpen)
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "signin" ? "Welcome Back" : "Create Your Account"}
          </DialogTitle>
          <DialogDescription>
            {mode === "signin"
              ? "Sign in to continue your AI research journey"
              : "Join us to unlock powerful AI-powered search"}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4">
              <CheckCircle2 className="w-16 h-16 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-center space-y-3">
              <h3 className="font-bold text-xl text-green-700 dark:text-green-400">
                {mode === "signup" ? "Check Your Email!" : "Success!"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm px-4">
                {message}
              </p>
              {mode === "signup" && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-700 dark:text-blue-400 font-medium">
                    📧 Didn't receive the email? Check your spam folder or contact support.
                  </p>
                </div>
              )}
            </div>
            {mode === "signup" && (
              <Button
                onClick={() => {
                  resetForm()
                  onOpenChange(false)
                }}
                variant="default"
                className="mt-4"
              >
                Got it, thanks!
              </Button>
            )}
          </div>
        ) : (
          <form onSubmit={handleAuth} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name (Optional)</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {mode === "signin" && onForgotPassword && (
                  <button
                    type="button"
                    onClick={onForgotPassword}
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pl-10"
                />
              </div>
              {mode === "signup" && (
                <p className="text-xs text-muted-foreground">
                  Must be at least 6 characters
                </p>
              )}
            </div>

            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="pl-10"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {message && !success && (
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-700 dark:text-green-400">{message}</p>
              </div>
            )}

            <LiquidGlassButton type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "signin" ? "Sign In" : "Create Account"}
            </LiquidGlassButton>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  {mode === "signin" ? "Don't have an account?" : "Already have an account?"}
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleModeSwitch}
              disabled={loading}
            >
              {mode === "signin" ? "Create Account" : "Sign In Instead"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
