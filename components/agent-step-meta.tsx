"use client"

import { Clock, TrendingUp } from "lucide-react"
import { motion } from "framer-motion"
import type { SearchStepMetadata } from "@/types/search-step"

interface AgentStepMetaProps {
  metadata?: SearchStepMetadata
  status: "active" | "complete" | "pending"
}

export function AgentStepMeta({ metadata, status }: AgentStepMetaProps) {
  if (!metadata) return null

  const { timeTaken, confidence } = metadata

  if (status !== "complete" && !confidence) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="flex items-center gap-3 text-xs text-muted-foreground"
    >
      {status === "complete" && (
        <>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span>Completed</span>
          </div>
          {timeTaken && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{timeTaken}</span>
            </div>
          )}
        </>
      )}
      {confidence !== undefined && (
        <div className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          <span>{Math.round(confidence * 100)}% confidence</span>
        </div>
      )}
    </motion.div>
  )
}
