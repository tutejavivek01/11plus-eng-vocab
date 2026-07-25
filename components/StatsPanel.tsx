import { TOPICS } from "@/lib/quiz/constants";
import type { HistoryStats } from "@/lib/quiz/stats";

function topicLabel(topic: string): string {
  return TOPICS.find((t) => t.value === topic)?.label ?? topic;
}

export function StatsPanel({ stats }: { stats: HistoryStats }) {
  return (
    <div className="grid grid-cols-3 gap-3 rounded border border-black/[.1] p-4 dark:border-white/[.15]">
      <div className="text-center">
        <p className="text-2xl font-semibold">{stats.totalAttempts}</p>
        <p className="text-xs text-zinc-500">Attempts</p>
      </div>
      <div className="text-center">
        <p className="text-2xl font-semibold">{stats.averageScorePercent}%</p>
        <p className="text-xs text-zinc-500">Average score</p>
      </div>
      <div className="text-center">
        <p className="text-2xl font-semibold">{stats.bestTopic ? topicLabel(stats.bestTopic.topic) : "—"}</p>
        <p className="text-xs text-zinc-500">Best topic</p>
      </div>
    </div>
  );
}
