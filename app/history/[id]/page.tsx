import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ScoreSummary } from "@/components/ScoreSummary";
import { MissedQuestionsReview } from "@/components/MissedQuestionsReview";
import { TOPICS } from "@/lib/quiz/constants";

function topicLabel(topic: string): string {
  return TOPICS.find((t) => t.value === topic)?.label ?? topic;
}

export default async function HistoryAttemptPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/signin");
  }

  const { id } = await params;
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id },
    include: { answers: { orderBy: { orderIndex: "asc" } } },
  });

  if (!attempt || attempt.userId !== session.user.id) {
    notFound();
  }

  const missed = attempt.answers
    .filter((a) => !a.isCorrect)
    .map((a) => ({ prompt: a.promptText, selectedText: a.selectedText, correctText: a.correctText }));

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-6">
      <div>
        <Link href="/history" className="text-sm text-zinc-500 underline">
          Back to history
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{topicLabel(attempt.topic)}</h1>
        <p className="text-sm text-zinc-500">{new Date(attempt.createdAt).toLocaleString()}</p>
      </div>
      <ScoreSummary score={attempt.score} length={attempt.length} />
      <MissedQuestionsReview missed={missed} />
    </main>
  );
}
