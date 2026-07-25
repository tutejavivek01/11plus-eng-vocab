import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isValidEmail, isValidPassword, MIN_PASSWORD_LENGTH } from "@/lib/auth/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const rawEmail = body?.email;
  const password: string | undefined = body?.password;
  const name: string | undefined = body?.name;

  if (!isValidEmail(rawEmail) || !isValidPassword(password)) {
    return NextResponse.json(
      { error: `Please enter a valid email and a password of at least ${MIN_PASSWORD_LENGTH} characters.` },
      { status: 400 }
    );
  }

  const email = rawEmail.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const passwordHash = await hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: { email, passwordHash, name: name || null },
    });
    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }
    throw error;
  }
}
