"use client"

import { useEffect, useState } from "react"

const PROMPTS = [
  "How does quantum computing work?",
  "What are the latest AI developments?",
  "Benefits of intermittent fasting...",
  "Renewable energy solutions...",
  "Digital marketing trends 2025...",
  "Effective online learning strategies...",
]

export function TypingPlaceholder() {
  const [currentPrompt, setCurrentPrompt] = useState(0)
  const [displayText, setDisplayText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const prompt = PROMPTS[currentPrompt]
    const typingSpeed = isDeleting ? 30 : 80
    const pauseTime = isDeleting ? 500 : 2000

    const timeout = setTimeout(() => {
      if (!isDeleting && displayText === prompt) {
        setTimeout(() => setIsDeleting(true), pauseTime)
      } else if (isDeleting && displayText === "") {
        setIsDeleting(false)
        setCurrentPrompt((prev) => (prev + 1) % PROMPTS.length)
      } else {
        setDisplayText(
          isDeleting ? prompt.substring(0, displayText.length - 1) : prompt.substring(0, displayText.length + 1),
        )
      }
    }, typingSpeed)

    return () => clearTimeout(timeout)
  }, [displayText, isDeleting, currentPrompt])

  return <span className="text-muted-foreground/60">{displayText}</span>
}
