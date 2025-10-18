/**
 * Search progress component for displaying real-time research pipeline steps.
 * 
 * This component visualizes each step of the AI Deep Search research process,
 * showing:
 * - Current step with animated icon
 * - Step category (thinking, searching, retrieving, etc.)
 * - Search queries being executed
 * - Sources being visited
 * - Metadata about the step (sources found, elapsed time)
 * 
 * The component uses framer-motion for smooth animations and provides
 * a clear visual indication of what the system is currently doing.
 * 
 * @module components/search-progress
 */

"use client"

import { motion } from "framer-motion"
import type { SearchStep, StepCategory, Source } from "@/types/search-step"
import { AgentStepIcon } from "./agent-step-icon"
import { AgentStepQueries } from "./agent-step-queries"
import { AgentStepSources } from "./agent-step-sources"
import { AgentStepMeta } from "./agent-step-meta"
import { Loader2, Brain, Search, FileSearch, ShieldCheck, Sparkles, Activity } from "lucide-react"

/**
 * Props for the SearchProgress component.
 */
interface SearchProgressProps {
  /** The current search step being executed */
  step: SearchStep
  /** Optional round number for iterative research */
  roundNumber?: number
}

/**
 * Infer the step category from the step message.
 * 
 * Analyzes the step message text to determine which category it belongs to
 * (thinking, searching, retrieving, verifying, synthesizing, formatting).
 * 
 * @param message - The step message text
 * @returns The inferred step category
 */
function inferCategory(message: string): StepCategory {
  const msg = message.toLowerCase()

  if (msg.includes("analyz") || msg.includes("query") || msg.includes("thinking")) {
    return "thinking"
  } else if (msg.includes("search") || msg.includes("gather")) {
    return "searching"
  } else if (msg.includes("summar") || msg.includes("content") || msg.includes("retriev")) {
    return "retrieving"
  } else if (msg.includes("verif") || msg.includes("check") || msg.includes("cross-check")) {
    return "verifying"
  } else if (
    msg.includes("synth") ||
    msg.includes("creating") ||
    msg.includes("combining") ||
    msg.includes("generat")
  ) {
    return "synthesizing"
  } else if (msg.includes("format") || msg.includes("preparing") || msg.includes("citation")) {
    return "formatting"
  }

  return "thinking"
}

export function SearchProgress({ step, roundNumber }: SearchProgressProps) {
  const category = step.category || inferCategory(step.message)

  const queries = step.queries || step.search_queries || []
  const sitesVisited = step.sites_visited || []
  const legacySources = step.sources || []

  const sources: Source[] = step.results || [
    ...sitesVisited.map((domain) => ({
      title: domain,
      domain: domain,
    })),
    ...legacySources.map((s) => ({
      title: s.title,
      domain: s.domain,
      favicon: s.favicon,
    })),
  ]

  const sourcesFound = step.metadata?.sourcesFound || step.sources_found

  const getInlineIcon = () => {
    const iconMap: Record<StepCategory, React.ReactElement> = {
      thinking: <Brain className="w-3.5 h-3.5 text-primary/70" />,
      searching: <Search className="w-3.5 h-3.5 text-primary/70" />,
      retrieving: <FileSearch className="w-3.5 h-3.5 text-primary/70" />,
      verifying: <ShieldCheck className="w-3.5 h-3.5 text-green-500/70" />,
      synthesizing: <Sparkles className="w-3.5 h-3.5 text-primary/70" />,
      formatting: <Activity className="w-3.5 h-3.5 text-primary/70" />,
    }
    return iconMap[category] || <Activity className="w-3.5 h-3.5 text-primary/70" />
  }

  const getCategoryColor = () => {
    if (category === "verifying") return "text-green-500"
    if (category === "synthesizing") return "text-primary"
    return "text-foreground"
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative py-4 pl-6 border-l-2 border-border/30 hover:border-primary/40 transition-colors duration-300 bg-card/30 backdrop-blur-sm rounded-lg border border-border/20 shadow-sm hover:shadow-md transition-shadow duration-300"
    >
      {step.status === "active" && (
        <motion.div
          className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/0 via-primary to-primary/0"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
        />
      )}

      <div className="flex items-start gap-3">
        <div className="flex items-center justify-center flex-shrink-0 mt-0.5">
          <AgentStepIcon category={category} status={step.status} />
        </div>

        {/* Content */}
        <div className="flex-1 space-y-3">
          {roundNumber && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                Round {roundNumber}
              </span>
            </div>
          )}
          {/* Main message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="space-y-1"
          >
            <div className="flex items-center gap-2">
              {getInlineIcon()}
              <p className={`text-sm font-medium ${getCategoryColor()}`}>{step.message}</p>
              {step.status === "active" && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                >
                  <Loader2 className="w-4 h-4 text-primary" />
                </motion.div>
              )}
            </div>
          </motion.div>

          <AgentStepQueries queries={queries} />
          <AgentStepSources sources={sources} sourcesFound={sourcesFound} />
          <AgentStepMeta metadata={step.metadata} status={step.status} />
        </div>
      </div>
    </motion.div>
  )
}
