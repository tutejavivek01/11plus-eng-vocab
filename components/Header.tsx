import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function Header() {
  const session = await getServerSession(authOptions);

  return (
    <header className="border-b border-black/[.08] dark:border-white/[.145]">
      <div className="mx-auto flex w-full max-w-md items-center justify-between px-6 py-4">
        <Link href="/" className="font-semibold">
          11+ Vocab
        </Link>
        {session?.user && (
          <div className="flex items-center gap-3">
            <Link href="/history" className="text-sm text-zinc-600 dark:text-zinc-400">
              History
            </Link>
            <Link href="/settings" className="text-sm text-zinc-600 dark:text-zinc-400">
              Settings
            </Link>
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {session.user.name ?? session.user.email}
            </span>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- NextAuth API route, not an app page */}
            <a href="/api/auth/signout" className="text-sm text-zinc-500 underline">
              Sign out
            </a>
          </div>
        )}
      </div>
    </header>
  );
}
