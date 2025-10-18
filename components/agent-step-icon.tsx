"use client"

import type React from "react"

import { Brain, SearchIcon, FileSearch, ShieldCheck, Sparkles, Activity, Check, Loader2 } from "lucide-react"
import type { StepCategory } from "@/types/search-step"

interface AgentStepIconProps {
  category: StepCategory
  status: "active" | "complete" | "pending"
}

export function AgentStepIcon({ category, status }: AgentStepIconProps) {
  if (status === "complete") {
    return (
      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center animate-in zoom-in-50 duration-300">
        <Check className="w-3 h-3 text-primary" />
      </div>
    )
  }

  const iconMap: Record<StepCategory, React.ReactElement> = {
    thinking: <Brain className="w-4 h-4 text-primary" />,
    searching: <SearchIcon className="w-4 h-4 text-primary" />,
    retrieving: <FileSearch className="w-4 h-4 text-primary" />,
    verifying: <ShieldCheck className="w-4 h-4 text-green-500" />,
    synthesizing: <Sparkles className="w-4 h-4 text-primary" />,
    formatting: <Activity className="w-4 h-4 text-primary" />,
  }

  const Icon = iconMap[category] || <Loader2 className="w-4 h-4 text-primary animate-spin" />

  if (status === "active") {
    return (
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse" />
        <div className="relative">{Icon}</div>
      </div>
    )
  }

  return <div className="opacity-50">{Icon}</div>
}
