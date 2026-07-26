import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildFixedTestSummaries } from "@/lib/quiz/fixedTests";
import { PracticeTestsList } from "@/components/PracticeTestsList";

export default async function PracticeTestsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/signin");
  }

  const tests = await prisma.fixedTest.findMany({
    orderBy: { number: "asc" },
    select: { id: true, number: true, band: true },
  });
  const attempts = await prisma.quizAttempt.findMany({
    where: { userId: session.user.id, fixedTestId: { not: null } },
    select: { id: true, fixedTestId: true, score: true, createdAt: true },
  });
  const summaries = buildFixedTestSummaries(tests, attempts);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">Practice Tests</h1>
      <PracticeTestsList summaries={summaries} />
    </main>
  );
}
