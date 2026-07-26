import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 className="text-3xl font-bold">11+ Vocabulary Quiz</h1>

      {session?.user ? (
        <div className="flex w-full flex-col gap-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Signed in as {session.user.name ?? session.user.email}
          </p>
          <Link
            href="/quiz/setup"
            className="rounded-full bg-foreground px-5 py-3 font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            Start a quiz
          </Link>
          <Link
            href="/history"
            className="rounded-full border border-black/[.08] px-5 py-3 font-medium transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
          >
            Progress history
          </Link>
        </div>
      ) : (
        <div className="flex w-full flex-col gap-4">
          <Link
            href="/signin"
            className="rounded-full bg-foreground px-5 py-3 font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-full border border-black/[.08] px-5 py-3 font-medium transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
          >
            Sign up
          </Link>
        </div>
      )}
    </main>
  );
}
