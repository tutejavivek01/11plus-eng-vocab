import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidTestNumber, PRACTICE_TEST_TOPIC_SENTINEL } from "@/lib/quiz/fixedTests";

interface SubmittedFixedTestAnswer {
  fixedTestQuestionId: string;
  selectedText: string;
}

export async function POST(request: Request, { params }: { params: Promise<{ number: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { number: raw } = await params;
  const number = Number(raw);
  if (!isValidTestNumber(number)) {
    return NextResponse.json({ error: "Invalid test number" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const answers: SubmittedFixedTestAnswer[] | undefined = body?.answers;

  const test = await prisma.fixedTest.findUnique({
    where: { number },
    include: { questions: { orderBy: { orderIndex: "asc" } } },
  });
  if (!test) {
    return NextResponse.json({ error: "Test not found" }, { status: 404 });
  }

  if (!Array.isArray(answers) || answers.length !== test.questions.length) {
    return NextResponse.json({ error: "Answers do not match test length" }, { status: 400 });
  }

  const answersByQuestionId = new Map(answers.map((a) => [a.fixedTestQuestionId, a.selectedText]));
  if (!test.questions.every((q) => answersByQuestionId.has(q.id))) {
    return NextResponse.json({ error: "Answers do not match this test's questions" }, { status: 400 });
  }

  const results = test.questions.map((q) => {
    const selectedText = answersByQuestionId.get(q.id)!;
    return {
      wordId: q.contentId,
      questionType: q.questionType,
      prompt: q.prompt,
      selectedText,
      correctText: q.correctText,
      explanation: q.explanation ?? undefined,
      isCorrect: selectedText === q.correctText,
    };
  });

  const score = results.filter((r) => r.isCorrect).length;

  const attempt = await prisma.quizAttempt.create({
    data: {
      userId: session.user.id,
      topic: PRACTICE_TEST_TOPIC_SENTINEL,
      length: test.questions.length,
      score,
      fixedTestId: test.id,
      answers: {
        create: results.map((r, index) => ({
          wordId: r.wordId,
          questionType: r.questionType,
          promptText: r.prompt,
          correctText: r.correctText,
          selectedText: r.selectedText,
          isCorrect: r.isCorrect,
          explanation: r.explanation ?? null,
          orderIndex: index,
        })),
      },
    },
  });

  return NextResponse.json({
    attemptId: attempt.id,
    score,
    length: test.questions.length,
    results,
  });
}
