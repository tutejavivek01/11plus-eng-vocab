import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeHistoryStats } from "@/lib/quiz/stats";
import { StatsPanel } from "@/components/StatsPanel";
import { AttemptList } from "@/components/AttemptList";

export default async function HistoryPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/signin");
  }

  const attempts = await prisma.quizAttempt.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, topic: true, length: true, score: true, createdAt: true },
  });

  const stats = computeHistoryStats(attempts);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">Progress history</h1>
      <StatsPanel stats={stats} />
      <AttemptList attempts={attempts} />
    </main>
  );
}
