import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeHistoryStats } from "@/lib/quiz/stats";
import { TOPICS } from "@/lib/quiz/constants";
import { getUserAttemptHistory, confidencePercent, computeConfidenceTier } from "@/lib/quiz/wordHistory";
import { StatsPanel } from "@/components/StatsPanel";
import { AttemptList } from "@/components/AttemptList";
import { ConfidenceMeter } from "@/components/ConfidenceMeter";
import { WordHistoryTable, type WordHistoryRow } from "@/components/WordHistoryTable";
import { WordHistoryTabs } from "@/components/WordHistoryTabs";

export default async function HistoryPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/signin");
  }

  const userId = session.user.id;

  const attempts = await prisma.quizAttempt.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, topic: true, length: true, score: true, createdAt: true },
  });

  const stats = computeHistoryStats(attempts);

  const rollups = await getUserAttemptHistory(userId);
  const allWordIds = [...new Set([...rollups.values()].flatMap((r) => r.words.map((w) => w.wordId)))];
  const words = await prisma.word.findMany({
    where: { id: { in: allWordIds } },
    select: { id: true, word: true, definition: true, synonym: true, antonym: true, difficulty: true },
  });
  const wordById = new Map(words.map((w) => [w.id, w]));

  const tabs = TOPICS.map(({ value, label }) => {
    const rollup = rollups.get(value);
    const percent = confidencePercent(rollup?.words ?? []);
    const tier = computeConfidenceTier(percent);

    const rows: WordHistoryRow[] = [];
    for (const w of rollup?.words ?? []) {
      const word = wordById.get(w.wordId);
      if (!word) continue;
      rows.push({
        wordId: w.wordId,
        word: word.word,
        definition: word.definition,
        synonym: word.synonym,
        antonym: word.antonym,
        difficulty: word.difficulty,
        lastCorrect: w.lastCorrect,
        attemptCount: w.attemptCount,
      });
    }

    return {
      value,
      label,
      content: (
        <div className="flex flex-col gap-4">
          <ConfidenceMeter percent={percent} tier={tier} />
          <WordHistoryTable rows={rows} />
        </div>
      ),
    };
  });

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">Progress history</h1>
      <StatsPanel stats={stats} />
      <section>
        <h2 className="mb-3 text-lg font-semibold">Word-by-word history</h2>
        <WordHistoryTabs tabs={tabs} />
      </section>
      <section>
        <h2 className="mb-3 text-lg font-semibold">Recent attempts</h2>
        <AttemptList attempts={attempts} />
      </section>
    </main>
  );
}
