import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidTestNumber } from "@/lib/quiz/fixedTests";

export async function POST(request: Request, { params }: { params: Promise<{ number: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { number: raw } = await params;
  const number = Number(raw);
  if (!isValidTestNumber(number)) {
    return NextResponse.json({ error: "Invalid test number" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const fixedTestQuestionId: string | undefined = body?.fixedTestQuestionId;
  const selectedText: string | undefined = body?.selectedText;

  if (!fixedTestQuestionId || typeof selectedText !== "string") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const question = await prisma.fixedTestQuestion.findUnique({
    where: { id: fixedTestQuestionId },
    include: { fixedTest: { select: { number: true } } },
  });
  if (!question || question.fixedTest.number !== number) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  return NextResponse.json({
    isCorrect: selectedText === question.correctText,
    correctText: question.correctText,
    explanation: question.explanation ?? undefined,
  });
}
