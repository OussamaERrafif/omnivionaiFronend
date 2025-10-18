export type StepCategory =
  | "thinking"
  | "searching"
  | "retrieving"
  | "verifying"
  | "synthesizing"
  | "formatting"

export interface Source {
  title: string
  domain: string
  url?: string
  favicon?: string
  verified?: boolean
  confidence?: number
}

export interface SearchStepMetadata {
  timeTaken?: string
  confidence?: number
  sourcesFound?: number
}

export interface SearchStep {
  id: string
  category?: StepCategory
  status: "active" | "complete" | "pending"
  message: string
  queries?: string[]
  results?: Source[]
  metadata?: SearchStepMetadata
  
  // Legacy fields for backward compatibility
  type?: "status" | "query" | "reviewing"
  search_queries?: string[]
  sites_visited?: string[]
  sources_found?: number
  sources?: Array<{ title: string; domain: string; favicon?: string }>
}
