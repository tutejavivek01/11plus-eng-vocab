import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateQuiz, InsufficientWordsError, type WordRecord } from "@/lib/quiz/generateQuiz";
import { toGeneratedSpellingQuestion, type SpellingQuestionRecord } from "@/lib/quiz/spellingQuestions";
import { ALLOWED_QUIZ_LENGTHS, TOPICS, type QuizLength, type Topic } from "@/lib/quiz/constants";

const MAX_POOL_SIZE = 200;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const topic: Topic | undefined = body?.topic;
  const length: QuizLength | undefined = body?.length;

  if (!topic || !TOPICS.some((t) => t.value === topic)) {
    return NextResponse.json({ error: "Invalid topic" }, { status: 400 });
  }
  if (!length || !ALLOWED_QUIZ_LENGTHS.includes(length)) {
    return NextResponse.json({ error: "Invalid quiz length" }, { status: 400 });
  }

  if (topic === "spellings") {
    const rows = await prisma.$queryRaw<SpellingQuestionRecord[]>`
      SELECT "id", "sentence", "correctOption", "explanation"
      FROM "SpellingQuestion"
      ORDER BY random()
      LIMIT ${length}
    `;
    if (rows.length < length) {
      return NextResponse.json(
        {
          error: `Not enough spelling questions for a ${length}-question quiz (only ${rows.length} available). Try a shorter quiz.`,
        },
        { status: 422 }
      );
    }
    return NextResponse.json({ topic, length, questions: rows.map(toGeneratedSpellingQuestion) });
  }

  const poolLimit = Math.min(length * 4, MAX_POOL_SIZE);
  const pool = await prisma.$queryRaw<WordRecord[]>`
    SELECT "id", "word", "definition", "synonym", "antonym"
    FROM "Word"
    WHERE "topic" = ${topic}
    ORDER BY random()
    LIMIT ${poolLimit}
  `;

  if (pool.length < length) {
    return NextResponse.json(
      {
        error: `Not enough words in this topic for a ${length}-question quiz (only ${pool.length} available). Try a shorter quiz or a different topic.`,
      },
      { status: 422 }
    );
  }

  try {
    const questions = generateQuiz(pool, length);
    return NextResponse.json({ topic, length, questions });
  } catch (error) {
    if (error instanceof InsufficientWordsError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    throw error;
  }
}
