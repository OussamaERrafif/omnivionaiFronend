"use client"

import { Globe, ExternalLink, CheckCircle2 } from "lucide-react"
import { motion } from "framer-motion"
import type { Source } from "@/types/search-step"
import { useState } from "react"

interface AgentStepSourcesProps {
  sources: Source[]
  sourcesFound?: number
}

export function AgentStepSources({ sources, sourcesFound }: AgentStepSourcesProps) {
  const [expandedSource, setExpandedSource] = useState<number | null>(null)

  if (sources.length === 0) return null

  const getDomainName = (domain: string) => {
    const withoutWww = domain.replace(/^www\./, "")
    const parts = withoutWww.split(".")
    return parts[0]
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-2 pl-2 border-l-2 border-border/50"
    >
      <div className="flex items-center gap-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Sources Found</p>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
          {sources.length} {sources.length === 1 ? "source" : "sources"}
        </span>
      </div>
      <div className="grid gap-1.5 max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        {sources.map((source, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group relative"
          >
            <button
              onClick={() => {
                if (source.url) {
                  window.open(source.url, '_blank', 'noopener,noreferrer');
                }
                setExpandedSource(expandedSource === index ? null : index);
              }}
              className="w-full flex items-center gap-2 text-xs bg-background/60 backdrop-blur-sm border border-border/50 rounded-lg px-3 py-2 hover:bg-accent/50 hover:border-border transition-all duration-200"
            >
              <Globe className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <span className="text-foreground/80 truncate flex-1 text-left font-medium">
                {source.title || source.domain}
              </span>
              {source.verified && <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />}
              {source.confidence !== undefined && (
                <span className="text-[10px] text-muted-foreground font-mono">
                  {Math.round(source.confidence * 100)}%
                </span>
              )}
              <span className="text-[10px] text-muted-foreground uppercase font-mono">
                {getDomainName(source.domain)}
              </span>
              {source.url && (
                <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </button>

            {expandedSource === index && source.url && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-1 p-2 bg-muted/30 rounded-md text-[10px] text-muted-foreground font-mono break-all"
              >
                {source.url}
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
