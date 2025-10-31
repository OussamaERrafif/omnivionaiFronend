/**
 * Search mode types for the OmniAI search system
 */

export type SearchMode = "deep" | "moderate" | "quick" | "sla";

export interface SearchModeConfig {
  value: SearchMode;
  label: string;
  description: string;
  icon: string;
  sources: number;
  iterations: number;
  isDefault?: boolean;
}

export const SEARCH_MODES: Record<SearchMode, SearchModeConfig> = {
  deep: {
    value: "deep",
    label: "Deep",
    description: "5 sources • 3 iterations • 10s timeout",
    icon: "🔬",
    sources: 5,
    iterations: 3,
    isDefault: true,
  },
  moderate: {
    value: "moderate",
    label: "Moderate",
    description: "3 sources • 2 iterations • 7s timeout",
    icon: "⚖️",
    sources: 3,
    iterations: 2,
  },
  quick: {
    value: "quick",
    label: "Quick",
    description: "2 sources • 1 iteration • 5s timeout",
    icon: "⚡",
    sources: 2,
    iterations: 1,
  },
  sla: {
    value: "sla",
    label: "SLA",
    description: "1 source • No iterations • 3s timeout",
    icon: "🎯",
    sources: 1,
    iterations: 0,
  },
};
