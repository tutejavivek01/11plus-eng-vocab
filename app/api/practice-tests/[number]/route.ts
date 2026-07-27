import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidTestNumber } from "@/lib/quiz/fixedTests";
import type { GeneratedQuestion } from "@/lib/quiz/generateQuiz";

export async function GET(request: Request, { params }: { params: Promise<{ number: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { number: raw } = await params;
  const number = Number(raw);
  if (!isValidTestNumber(number)) {
    return NextResponse.json({ error: "Invalid test number" }, { status: 404 });
  }

  const test = await prisma.fixedTest.findUnique({
    where: { number },
    include: { questions: { orderBy: { orderIndex: "asc" } } },
  });
  if (!test) {
    return NextResponse.json({ error: "Test not found" }, { status: 404 });
  }

  const questions: GeneratedQuestion[] = test.questions.map((q) => ({
    wordId: q.id,
    questionType: q.questionType,
    prompt: q.prompt,
    options: q.options,
    word: q.wordText ?? undefined,
  }));

  return NextResponse.json({ number: test.number, band: test.band, questions });
}
