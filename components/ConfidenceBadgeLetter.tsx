import { TIER_BADGE_CLASS, TIER_LABEL, TIER_LETTER } from "@/lib/quiz/confidenceStyles";
import type { ConfidenceTier } from "@/lib/quiz/wordHistory";

export function ConfidenceBadgeLetter({ tier }: { tier: ConfidenceTier }) {
  return (
    <span
      aria-label={TIER_LABEL[tier]}
      title={TIER_LABEL[tier]}
      className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold ${TIER_BADGE_CLASS[tier]}`}
    >
      {TIER_LETTER[tier]}
    </span>
  );
}
