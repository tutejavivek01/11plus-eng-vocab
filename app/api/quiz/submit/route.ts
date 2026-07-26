import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  validateAnswers,
  UnknownWordError,
  type AnswerResult,
  type SubmittedAnswer,
} from "@/lib/quiz/validateAnswers";
import {
  validateSpellingAnswers,
  UnknownSpellingQuestionError,
  type SpellingAnswerResult,
  type SubmittedSpellingAnswer,
} from "@/lib/quiz/validateSpellingAnswers";
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

  const spellingAnswers = answers.filter(
    (a): a is SubmittedSpellingAnswer => a.questionType === "SPOT_MISSPELLING"
  );
  const wordAnswers = answers.filter((a) => a.questionType !== "SPOT_MISSPELLING");

  const [spellingQuestions, words] = await Promise.all([
    spellingAnswers.length
      ? prisma.spellingQuestion.findMany({ where: { id: { in: spellingAnswers.map((a) => a.wordId) } } })
      : Promise.resolve([]),
    wordAnswers.length
      ? prisma.word.findMany({
          where: { id: { in: wordAnswers.map((a) => a.wordId) } },
          select: { id: true, word: true, definition: true, synonym: true, antonym: true },
        })
      : Promise.resolve([]),
  ]);

  const resultsByWordId = new Map<string, AnswerResult | SpellingAnswerResult>();
  try {
    const { results: wordResults } = validateAnswers(words, wordAnswers);
    for (const r of wordResults) resultsByWordId.set(r.wordId, r);
    const { results: spellingResults } = validateSpellingAnswers(spellingQuestions, spellingAnswers);
    for (const r of spellingResults) resultsByWordId.set(r.wordId, r);
  } catch (error) {
    if (error instanceof UnknownWordError || error instanceof UnknownSpellingQuestionError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }

  const results = answers.map((a) => resultsByWordId.get(a.wordId)!);
  const score = results.filter((r) => r.isCorrect).length;

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
          explanation: "explanation" in r ? r.explanation : null,
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
