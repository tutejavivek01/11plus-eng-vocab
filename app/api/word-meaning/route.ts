import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchWordMeaning } from "@/lib/wordMeaning";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const word = new URL(request.url).searchParams.get("word");
  if (!word) {
    return NextResponse.json({ error: "Missing word" }, { status: 400 });
  }

  return NextResponse.json(await fetchWordMeaning(word));
}
