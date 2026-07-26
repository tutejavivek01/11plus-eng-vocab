import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isValidTestNumber } from "@/lib/quiz/fixedTests";
import { PracticeTestPlayClient } from "@/components/PracticeTestPlayClient";

export default async function PracticeTestPlayPage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/signin");
  }

  const { number: raw } = await params;
  const number = Number(raw);
  if (!isValidTestNumber(number)) {
    notFound();
  }

  return <PracticeTestPlayClient number={number} />;
}
