import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCorrectAnswer, type QuestionType, type Variant } from "@/lib/quiz/generateQuiz";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const wordId: string | undefined = body?.wordId;
  const questionType: QuestionType | undefined = body?.questionType;
  const variant: Variant | undefined = body?.variant;
  const selectedText: string | undefined = body?.selectedText;

  if (!wordId || !questionType || typeof selectedText !== "string") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const word = await prisma.word.findUnique({
    where: { id: wordId },
    select: { id: true, word: true, definition: true, synonym: true, antonym: true },
  });
  if (!word) {
    return NextResponse.json({ error: "Word not found" }, { status: 404 });
  }

  const correctText = getCorrectAnswer(word, questionType, variant);
  return NextResponse.json({ isCorrect: selectedText === correctText, correctText });
}
