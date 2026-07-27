import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Difficulty } from "@prisma/client";

const VALID_DIFFICULTIES = new Set(["EASY", "MEDIUM", "HARD"]);
const DICTIONARY_TOPIC = "general-vocabulary";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const word: string | undefined = body?.word?.trim();
  const definition: string | undefined = body?.definition?.trim();
  const difficulty: string | undefined = body?.difficulty;
  const synonym: string = body?.synonym?.trim() ?? "";
  const antonym: string = body?.antonym?.trim() ?? "";

  if (!word || !definition) {
    return NextResponse.json({ error: "Word and definition are required" }, { status: 400 });
  }
  if (!difficulty || !VALID_DIFFICULTIES.has(difficulty)) {
    return NextResponse.json({ error: "Difficulty must be EASY, MEDIUM, or HARD" }, { status: 400 });
  }

  try {
    const created = await prisma.word.create({
      data: {
        word,
        definition,
        topic: DICTIONARY_TOPIC,
        difficulty: difficulty as Difficulty,
        synonym: synonym || null,
        antonym: antonym || null,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "P2002") {
      return NextResponse.json(
        { error: `"${word}" already exists in the dictionary.` },
        { status: 409 }
      );
    }
    throw error;
  }
}
