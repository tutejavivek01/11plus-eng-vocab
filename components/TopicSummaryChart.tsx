import { ConfidenceBadgeLetter } from "@/components/ConfidenceBadgeLetter";
import type { TopicSummary } from "@/lib/quiz/topicSummary";

export function TopicSummaryChart({ summaries }: { summaries: TopicSummary[] }) {
  const maxTests = Math.max(1, ...summaries.map((s) => s.testsCount));
  const maxQuestions = Math.max(1, ...summaries.map((s) => s.questionsCount));

  return (
    <div className="flex flex-col gap-4">
      {summaries.map((summary) => (
        <div key={summary.topic}>
          <div className="mb-1 flex items-center gap-2">
            <ConfidenceBadgeLetter tier={summary.confidenceTier} />
            <span className="text-sm font-medium">{summary.label}</span>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="w-20 text-xs text-zinc-500">Tests</span>
              <div className="h-2 flex-1 rounded-full bg-black/[.06] dark:bg-white/[.08]">
                <div
                  className="h-2 rounded-full bg-blue-500"
                  style={{ width: `${(summary.testsCount / maxTests) * 100}%` }}
                />
              </div>
              <span className="w-6 text-right text-xs text-zinc-500">{summary.testsCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-20 text-xs text-zinc-500">Questions</span>
              <div className="h-2 flex-1 rounded-full bg-black/[.06] dark:bg-white/[.08]">
                <div
                  className="h-2 rounded-full bg-purple-500"
                  style={{ width: `${(summary.questionsCount / maxQuestions) * 100}%` }}
                />
              </div>
              <span className="w-6 text-right text-xs text-zinc-500">{summary.questionsCount}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
