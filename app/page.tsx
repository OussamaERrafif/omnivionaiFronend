/**
 * Landing page component for AI Deep Search.
 * 
 * This is the main entry point for the application, providing:
 * - Animated hero section with search input
 * - Example queries organized by topic
 * - Quick search functionality
 * - Authentication integration
 * - Responsive design with mobile support
 * 
 * The landing page is designed to be engaging and help users quickly
 * understand the capabilities of the AI Deep Search system.
 * 
 * @module app/page
 */

"use client"

import { useState, type FormEvent, Suspense, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AnimatedBackground } from "@/components/animated-background"
import { TypingPlaceholder } from "@/components/typing-placeholder"
import { useSearchNavigation } from "@/hooks/use-search-navigation"
import { EXAMPLE_QUERIES_BY_TOPIC } from "@/lib/example-queries"
import { createClient } from "@/lib/supabase/client"

/**
 * LandingPage component - Main entry point and hero section.
 * 
 * Displays the app branding, search input, and example queries to help
 * users get started quickly. Includes animated elements for visual appeal.
 * 
 * @returns React component
 */
export default function LandingPage() {
  const [query, setQuery] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const { navigateToSearch, isNavigating } = useSearchNavigation()
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setIsSignedIn(!!user)
    }

    checkUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsSignedIn(!!session?.user)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleSearch = (e: FormEvent) => {
    e.preventDefault()
    
    // Check if user is logged in
    if (!isSignedIn) {
      // Trigger sign in dialog from layout
      const buttons = document.querySelectorAll('button')
      for (const button of buttons) {
        if (button.textContent?.trim() === 'Sign In') {
          button.click()
          break
        }
      }
      return
    }
    
    navigateToSearch(query)
  }

  const handleExampleClick = (example: string) => {
    // Check if user is logged in
    if (!isSignedIn) {
      // Trigger sign in dialog from layout
      const buttons = document.querySelectorAll('button')
      for (const button of buttons) {
        if (button.textContent?.trim() === 'Sign In') {
          button.click()
          break
        }
      }
      return
    }
    
    setQuery(example)
    // Auto-submit after a brief moment
    setTimeout(() => navigateToSearch(example), 300)
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Animated particle background - fixed to cover full viewport */}
      <div className="fixed inset-0 pointer-events-none">
        <Suspense fallback={null}>
          <AnimatedBackground />
        </Suspense>

        {/* Static background effects - reduced intensity */}
        <div
          className="absolute inset-0 bg-[linear-gradient(to_right,oklch(0.2_0_0/0.03)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.2_0_0/0.03)_1px,transparent_1px)] bg-[size:4rem_4rem]"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,oklch(0.7_0.19_240/0.08),transparent)]"
          aria-hidden="true"
        />
      </div>

      {/* Thinking overlay */}
      <AnimatePresence>
        {isNavigating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-4"
            >
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-lg text-muted-foreground">Preparing your search...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="relative z-10 flex-1 px-4 pt-24 pb-16 sm:px-6 sm:pb-24" role="search">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 sm:gap-16">
          {/* Hero text */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-4 text-center sm:space-y-6"
          >
            <h2 className="text-4xl font-bold tracking-tight text-foreground text-balance sm:text-5xl md:text-6xl lg:text-7xl">
              What can I help you
              <motion.span
                className="mt-2 block text-primary"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                research today?
              </motion.span>
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground/80 text-pretty sm:text-xl md:text-2xl">
              Ask me anything and I&apos;ll search the web to surface the most relevant, cited, and trustworthy information.
            </p>
          </motion.div>

          {/* Search form */}
          <motion.form
            onSubmit={handleSearch}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mx-auto w-full max-w-3xl"
          >
            <div className="relative group">
              <motion.div
                className="absolute -inset-1 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 rounded-2xl blur-xl"
                animate={{
                  opacity: isFocused ? 1 : 0,
                }}
                transition={{ duration: 0.3 }}
              />
              <motion.div
                className="relative flex items-center gap-2 rounded-xl border-2 border-border bg-background p-4 shadow-lg transition-all duration-300 sm:gap-3 sm:rounded-2xl sm:p-5"
                animate={{
                  borderColor: isFocused ? "oklch(0.7 0.19 240 / 0.5)" : "oklch(0.922 0 0)",
                  scale: isFocused ? 1.01 : 1,
                }}
                whileHover={{ scale: 1.005 }}
              >
                <Search className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                <Input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder=""
                  className="flex-1 border-0 bg-transparent text-base sm:text-lg focus-visible:ring-0 focus-visible:ring-offset-0 px-2"
                  autoFocus
                  aria-label="Search query"
                />
                {!query && (
                  <div className="absolute left-14 sm:left-16 pointer-events-none">
                    <TypingPlaceholder />
                  </div>
                )}
                <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} className="flex-shrink-0">
                  <Button
                    type="submit"
                    size="lg"
                    disabled={!query.trim() || isNavigating}
                    className="rounded-lg px-6 text-sm font-semibold shadow-md transition-all duration-300 hover:shadow-lg disabled:opacity-50 sm:rounded-xl sm:px-8 sm:text-base"
                  >
                    {isNavigating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
                  </Button>
                </motion.div>
              </motion.div>
            </div>
          </motion.form>

          {/* Example queries by topic */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mx-auto w-full max-w-4xl"
          >
            <p className="mb-6 text-center text-sm text-muted-foreground">
              Explore topics: <span className="sr-only">Press Enter to search</span>
            </p>
            <div className="space-y-6">
              {EXAMPLE_QUERIES_BY_TOPIC.map((category, categoryIndex) => {
                const TopicIcon = category.icon
                return (
                  <motion.div
                    key={category.topic}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.7 + categoryIndex * 0.1 }}
                    className="space-y-3"
                  >
                    {/* Topic Header */}
                    <div className="flex items-center gap-2 px-1">
                      <TopicIcon className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-semibold text-foreground">
                        {category.topic}
                      </h3>
                    </div>
                    
                    {/* Topic Queries */}
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      {category.queries.map((query, queryIndex) => (
                        <motion.button
                          key={queryIndex}
                          onClick={() => handleExampleClick(query.text)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleExampleClick(query.text)
                            }
                          }}
                          className="group relative overflow-hidden rounded-lg border border-border bg-background/60 p-3 text-left text-xs sm:text-sm text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-foreground hover:border-primary/50"
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          tabIndex={0}
                          aria-label={query.description}
                          title={query.description}
                        >
                          <motion.div
                            className="absolute inset-0 bg-primary/10 opacity-0 transition-opacity group-hover:opacity-100"
                            initial={false}
                          />
                          <span className="relative z-10 line-clamp-2">
                            {query.text}
                          </span>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <motion.footer
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="relative z-10 text-center py-6 text-xs sm:text-sm text-muted-foreground border-t border-border/50 backdrop-blur-xl bg-background/80"
      >
        <p>Omnivionai will search the web and provide cited, trustworthy answers</p>
      </motion.footer>
    </div>
  )
}
