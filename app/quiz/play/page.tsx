import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { QuizPlayClient } from "@/components/QuizPlayClient";

export default async function QuizPlayPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/signin");
  }

  return (
    <Suspense
      fallback={
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center p-6">
          <p>Loading quiz...</p>
        </main>
      }
    >
      <QuizPlayClient />
    </Suspense>
  );
}
