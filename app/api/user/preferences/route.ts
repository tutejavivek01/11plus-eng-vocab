import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidBackgroundPreset } from "@/lib/theme/presets";

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const backgroundColor: string | null | undefined = body?.backgroundColor;

  if (backgroundColor !== null && !isValidBackgroundPreset(backgroundColor ?? "")) {
    return NextResponse.json({ error: "Invalid background preset" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { backgroundColor },
  });

  return NextResponse.json({ backgroundColor });
}
