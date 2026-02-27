import { Microscope, Scale, Zap, Target, type LucideIcon } from "lucide-react";

/**
 * Search mode types for the OmniAI search system
 */

export type SearchMode = "deep" | "moderate" | "quick" | "sla";

export interface SearchModeConfig {
  value: SearchMode;
  label: string;
  description: string;
  icon: LucideIcon;
  sources: number;
  iterations: number;
  isDefault?: boolean;
}

export const SEARCH_MODES: Record<SearchMode, SearchModeConfig> = {
  deep: {
    value: "deep",
    label: "Deep",
    description: "Comprehensive search for complex queries",
    icon: Microscope,
    sources: 5,
    iterations: 3,
    isDefault: true,
  },
  moderate: {
    value: "moderate",
    label: "Moderate",
    description: "Balanced search for everyday queries",
    icon: Scale,
    sources: 3,
    iterations: 2,
  },
  quick: {
    value: "quick",
    label: "Quick",
    description: "Fast searches for simple facts",
    icon: Zap,
    sources: 2,
    iterations: 1,
  },
  sla: {
    value: "sla",
    label: "SLA",
    description: "Guaranteed response time queries",
    icon: Target,
    sources: 1,
    iterations: 0,
  },
};
