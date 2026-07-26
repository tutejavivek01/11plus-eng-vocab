import type { ConfidenceTier } from "./wordHistory";

export const TIER_LABEL: Record<ConfidenceTier, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
  worried: "You should be worried",
  none: "Not attempted",
};

export const TIER_LETTER: Record<ConfidenceTier, string> = {
  high: "H",
  medium: "M",
  low: "L",
  worried: "W",
  none: "–",
};

export const TIER_BADGE_CLASS: Record<ConfidenceTier, string> = {
  high: "border-green-500 bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200",
  medium:
    "border-yellow-500 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200",
  low: "border-orange-500 bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200",
  worried: "border-red-500 bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
  none: "border-zinc-300 bg-zinc-100 text-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};
