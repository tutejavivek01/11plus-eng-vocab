import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function Header() {
  const session = await getServerSession(authOptions);

  return (
    <header className="border-b border-black/[.08] bg-black/[.04] dark:border-white/[.145] dark:bg-black/[.2]">
      <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-x-8 gap-y-3 px-6 py-4">
        <Link href="/" className="font-semibold">
          11+ Vocab
        </Link>
        {session?.user && (
          <div className="flex flex-1 flex-wrap items-center justify-between gap-x-8 gap-y-3">
            <nav className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
              <Link
                href="/history"
                className="text-zinc-600 transition-colors hover:text-foreground dark:text-zinc-400"
              >
                History
              </Link>
              <Link
                href="/practice-tests"
                className="text-zinc-600 transition-colors hover:text-foreground dark:text-zinc-400"
              >
                Practice Tests
              </Link>
              <Link
                href="/dictionary"
                className="text-zinc-600 transition-colors hover:text-foreground dark:text-zinc-400"
              >
                Dictionary
              </Link>
              <Link
                href="/settings"
                className="text-zinc-600 transition-colors hover:text-foreground dark:text-zinc-400"
              >
                Settings
              </Link>
            </nav>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">
                {session.user.name ?? session.user.email}
              </span>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- NextAuth API route, not an app page */}
              <a
                href="/api/auth/signout"
                className="rounded-full border border-black/[.08] px-3 py-1 text-zinc-600 transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:text-zinc-400 dark:hover:bg-white/[.06]"
              >
                Sign out
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
