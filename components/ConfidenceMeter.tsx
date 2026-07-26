import { TIER_BADGE_CLASS, TIER_LABEL } from "@/lib/quiz/confidenceStyles";
import type { ConfidenceTier } from "@/lib/quiz/wordHistory";

export function ConfidenceMeter({
  percent,
  tier,
}: {
  percent: number | null;
  tier: ConfidenceTier;
}) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium ${TIER_BADGE_CLASS[tier]}`}
    >
      <span>{TIER_LABEL[tier]}</span>
      {percent !== null && <span className="text-xs opacity-80">{Math.round(percent)}%</span>}
    </div>
  );
}
