"use client"

import { SearchIcon, ChevronDown, ChevronUp } from "lucide-react"
import { motion } from "framer-motion"
import { useState } from "react"

interface AgentStepQueriesProps {
  queries: string[]
}

export function AgentStepQueries({ queries }: AgentStepQueriesProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (queries.length === 0) return null

  const displayQueries = queries.slice(1) // Skip the first query as it's usually the main one
  const hasManyQueries = displayQueries.length > 3
  const visibleQueries = hasManyQueries && !isExpanded ? displayQueries.slice(0, 3) : displayQueries

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-2 pl-2 border-l-2 border-border/50"
    >
      <div className="space-y-1.5">
        {visibleQueries.map((query, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-start gap-2 text-sm"
          >
            <SearchIcon className="w-3.5 h-3.5 text-primary/70 flex-shrink-0 mt-0.5" />
            <span className="text-foreground/80">{query}</span>
          </motion.div>
        ))}
        
        {hasManyQueries && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors mt-2 pl-5"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3 h-3" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                Show {displayQueries.length - 3} more queries
              </>
            )}
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}
