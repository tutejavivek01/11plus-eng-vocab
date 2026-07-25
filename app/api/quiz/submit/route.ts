import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateAnswers, UnknownWordError, type SubmittedAnswer } from "@/lib/quiz/validateAnswers";
import { ALLOWED_QUIZ_LENGTHS, TOPICS, type QuizLength, type Topic } from "@/lib/quiz/constants";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const topic: Topic | undefined = body?.topic;
  const length: QuizLength | undefined = body?.length;
  const answers: SubmittedAnswer[] | undefined = body?.answers;

  if (!topic || !TOPICS.some((t) => t.value === topic)) {
    return NextResponse.json({ error: "Invalid topic" }, { status: 400 });
  }
  if (!length || !ALLOWED_QUIZ_LENGTHS.includes(length)) {
    return NextResponse.json({ error: "Invalid quiz length" }, { status: 400 });
  }
  if (!Array.isArray(answers) || answers.length !== length) {
    return NextResponse.json({ error: "Answers do not match quiz length" }, { status: 400 });
  }

  const wordIds = answers.map((a) => a.wordId);
  const words = await prisma.word.findMany({
    where: { id: { in: wordIds } },
    select: { id: true, word: true, definition: true, synonym: true, antonym: true },
  });

  let score: number;
  let results: ReturnType<typeof validateAnswers>["results"];
  try {
    ({ score, results } = validateAnswers(words, answers));
  } catch (error) {
    if (error instanceof UnknownWordError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }

  const attempt = await prisma.quizAttempt.create({
    data: {
      userId: session.user.id,
      topic,
      length,
      score,
      answers: {
        create: results.map((r, index) => ({
          wordId: r.wordId,
          questionType: r.questionType,
          promptText: r.prompt,
          correctText: r.correctText,
          selectedText: r.selectedText,
          isCorrect: r.isCorrect,
          orderIndex: index,
        })),
      },
    },
  });

  return NextResponse.json({
    attemptId: attempt.id,
    score,
    length,
    results,
  });
}
