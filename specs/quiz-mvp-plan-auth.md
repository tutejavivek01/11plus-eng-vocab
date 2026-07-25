# Migrate Auth: Google OAuth → Email/Password

## Context

The app currently uses NextAuth v4 with a Google OAuth provider + the Prisma adapter (database sessions). The user wants to switch to local email/password authentication instead — no OAuth, no third-party dependency for login. `CLAUDE.md` and `specs/quiz-mvp.md` have already been updated (approved in a prior step) to describe this target state. This plan covers the actual code migration to match those docs.

Confirmed decision: **minimum password length is 8 characters, no additional complexity rules** (no forced uppercase/digit/symbol) — the user confirmed this via question, replacing the "TBD" in `specs/quiz-mvp.md`'s open questions.

The quiz domain itself (`Word`, `QuizAttempt`, `QuizAnswer`, `lib/quiz/*`, `app/api/quiz*`) is untouched — everything there already consumes `session.user.id` generically and needs no changes beyond updating four hardcoded sign-in redirects and one home-page link.

## Key design decisions

- **Password hashing: `bcryptjs`**, not `bcrypt`/`argon2`. Both alternatives use native C++ bindings, which is exactly the kind of dependency that causes Vercel serverless deployment friction (wrong-platform prebuilt binaries, cold-start issues) — the project's stated free-tier constraint. `bcryptjs` is pure JS, zero native-binding risk, and fast enough for MVP signup volume. Cost factor 10 (bcrypt's standard default).
- **No Prisma adapter.** NextAuth v4's Credentials provider does not support database sessions — switching to `session: { strategy: "jwt" }` is mandatory, not optional. `User` rows are read/written directly via Prisma in a hand-rolled signup route and in `authorize()`, not through adapter magic.
- **Schema**: drop `Account`, `Session`, `VerificationToken` entirely (nothing uses them once there's no OAuth provider and no DB sessions). `User.email` becomes required + unique (was nullable, to tolerate optional OAuth email — now it's the login identifier). Add `User.passwordHash` (required) and `User.createdAt` (matches the `createdAt` convention already used on `Word`/`QuizAttempt`).
- **`jwt`/`session` callback restructuring, not just adapter removal.** The current `session({ session, user })` callback reads `user.id` from the adapter-resolved DB user — under JWT strategy, `session()` receives `{ session, token }` instead, with no `user` argument at all. A new `jwt({ token, user })` callback must persist `user.id` onto `token.id` on the initial sign-in call (when `user` is defined), and `session()` must read `token.id` instead. Getting this backwards silently breaks `session.user.id` on every request.
- **`pages: { signIn: "/signin" }`** in `authOptions`, pointing at a new custom page (NextAuth's default built-in sign-in page doesn't render a usable Credentials form well and isn't styled to match the app).
- **Auto-sign-in after signup.** Creating a `User` row via the signup API doesn't establish a session by itself (no adapter-driven shortcut). The signup form calls `signIn("credentials", {...})` with the same credentials immediately after a successful signup response, then redirects to `/`.
- **Generic auth error messages.** `authorize()` returns `null` (never throws, never distinguishes "no such user" vs "wrong password") to avoid user-enumeration leaks.

## Schema change (`prisma/schema.prisma`)

Replace the `User`/`Account`/`Session`/`VerificationToken` block with:

```prisma
model User {
  id           String        @id @default(cuid())
  name         String?
  email        String        @unique
  passwordHash String
  createdAt    DateTime      @default(now())
  quizAttempts QuizAttempt[]
}
```

Delete `Account`, `Session`, `VerificationToken` models. `Word`, `QuizAttempt`, `QuizAnswer`, `Difficulty`, `QuestionType` are untouched.

**Local dev DB migration** (User table confirmed at 0 rows, so no data-loss concern): edit schema → `npx prisma generate` → `npx prisma db push` (same workaround used for the original schema, since this embedded `prisma dev` server's shadow-database support is broken for `migrate dev`) → generate a proper migration file via `npx prisma migrate diff --from-migrations prisma/migrations --to-schema prisma/schema.prisma --script > prisma/migrations/<timestamp>_credentials_auth/migration.sql` (diff against the *existing* migration history this time, not `--from-empty`, since there's already one migration on disk) → manually inspect the generated SQL (expect `DROP TABLE "Account"/"Session"/"VerificationToken"`, `ALTER TABLE "User" ... ADD COLUMN "passwordHash"`, `ALTER COLUMN "email" SET NOT NULL`) before treating it as final.

## `lib/auth.ts` (full rewrite)

```ts
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user) return null;
        const isValid = await compare(credentials.password, user.passwordHash);
        if (!isValid) return null;
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/signin" },
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user) session.user.id = token.id;
      return session;
    },
  },
};
```

No `adapter` key at all (not `undefined` — omitted).

## `types/next-auth.d.ts`

Keep the existing `Session.user.id` augmentation, add a second module augmentation so `token.id` is typed without casts:

```ts
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
  }
}
```

## New: `lib/auth/validation.ts` (pure, unit-tested — matches `lib/quiz/*.ts` convention)

```ts
export const MIN_PASSWORD_LENGTH = 8;

export function isValidEmail(email: string): boolean { /* pragmatic regex, not RFC-5322-complete */ }
export function isValidPassword(password: string): boolean {
  return typeof password === "string" && password.length >= MIN_PASSWORD_LENGTH;
}
```

Test file `lib/auth/validation.test.ts`: valid/invalid email formats, password length boundary (7 rejected, 8 accepted), empty/missing inputs.

## New: `app/api/auth/signup/route.ts`

`POST` only, body `{ email, password, name? }`:
1. Parse JSON (matches existing route pattern of `.catch(() => null)`).
2. Validate via `isValidEmail`/`isValidPassword` → `400` with a clear message on failure.
3. Normalize email (`.trim().toLowerCase()`).
4. Check existing user by email → `409 { error: "An account with this email already exists" }` if found.
5. `bcryptjs.hash(password, 10)`.
6. `prisma.user.create({ data: { email, passwordHash, name: name || null } })` wrapped in try/catch for the race-condition case (concurrent signups with the same email) — catch Prisma's `P2002` and still return the same 409, not a raw 500.
7. Success: `201 { id, email }` — never echo password/hash.

## New: `app/signup/page.tsx` and `app/signin/page.tsx`

Client components (`"use client"`), styled consistently with `components/QuizSetupForm.tsx` (Tailwind classes already used for buttons/inputs elsewhere in the app).

- **Signup**: email + password + optional name fields → `POST /api/auth/signup` → on success, call `signIn("credentials", { email, password, redirect: false })` → on success `router.push("/")`; on failure fall back to redirecting to `/signin` with a message. On signup API failure, show the returned `error` inline (mirrors `QuizPlayClient.tsx`'s error-handling pattern).
- **Signin**: email + password fields → `signIn("credentials", { email, password, redirect: false })` → generic "Invalid email or password" message on `result.error`, `router.push("/")` on success.

No `SessionProvider` needed anywhere — `signIn()` talks to NextAuth's API routes directly and doesn't require React context.

## Update existing call sites

- `redirect("/api/auth/signin")` → `redirect("/signin")` in: `app/quiz/setup/page.tsx`, `app/quiz/play/page.tsx`, `app/history/page.tsx`, `app/history/[id]/page.tsx`.
- `app/page.tsx`: replace the single "Sign in with Google" `<a>` (signed-out branch) with two `Link`s — "Sign in" → `/signin`, "Sign up" → `/signup`. The sign-out `<a href="/api/auth/signout">` in the signed-in branch is unchanged (works identically under JWT sessions).

## Dependencies

- Remove: `@next-auth/prisma-adapter`.
- Add: `bcryptjs` (dependencies), `@types/bcryptjs` (devDependencies).
- Unchanged: `next-auth`, `@prisma/client`, `@prisma/adapter-pg`, `pg`, `prisma` (note: `@prisma/adapter-pg` is the Prisma-7 *database driver* adapter used by `lib/prisma.ts` — unrelated to the removed NextAuth adapter despite the similar name; do not remove it).

## `.env.local`

Remove `GOOGLE_CLIENT_ID=""` and `GOOGLE_CLIENT_SECRET=""`. Keep `DATABASE_URL`, `NEXTAUTH_URL`. Double-check `NEXTAUTH_SECRET` is a real random value (not left as the placeholder string) before manual sign-in testing, since it now directly signs/encrypts the JWT session rather than just being used for CSRF/internal tokens.

## Testing plan

- **Unit (Vitest)**: `lib/auth/validation.test.ts` only — everything else here (`authorize()`, the signup route, the pages) depends on Prisma/DB/NextAuth request handling, which this project's existing convention deliberately doesn't unit-test directly (same reasoning already applied to the quiz API routes).
- **Throwaway smoke script** (`smoke-test.ts` at repo root, `npx tsx smoke-test.ts`, deleted after — same pattern used twice already in this repo): create a user with a bcrypt-hashed password directly via Prisma, assert the stored hash isn't plaintext and looks like a bcrypt hash; assert `compare()` succeeds with the right password and fails with the wrong one; assert a duplicate-email `create()` throws Prisma's `P2002`; clean up the test user afterward.
- **Manual browser click-through** (can't be scripted): signup → auto-signed-in → lands on `/`; sign out; sign in with those same credentials; sign in with a wrong password shows a generic error; direct navigation to `/quiz/setup` while signed out redirects to `/signin` (not the old `/api/auth/signin`).

## Build order

1. Schema + `lib/auth.ts` + `types/next-auth.d.ts` + dependency swap + `.env.local` cleanup → `prisma generate` + `prisma db push` → verify via the throwaway smoke script, then delete it.
2. `lib/auth/validation.ts` (+ tests) → `app/api/auth/signup/route.ts` → `app/signup/page.tsx` → `app/signin/page.tsx` → verify via manual browser click-through against the local dev server.
3. Update the four `redirect()` call sites + `app/page.tsx` → verify signed-out direct navigation to each protected page lands on `/signin`.
4. Generate and commit the migration SQL file (now that schema is proven working) → final `npm run lint` / `npm run test` / `npm run build` clean → grep the repo for any lingering `GoogleProvider`, `@next-auth/prisma-adapter`, or hardcoded `/api/auth/signin` references as a last sanity check.

## Critical files

- `prisma/schema.prisma`
- `lib/auth.ts`
- `types/next-auth.d.ts`
- `lib/auth/validation.ts` (new)
- `app/api/auth/signup/route.ts` (new)
- `app/signin/page.tsx`, `app/signup/page.tsx` (new)
- `app/page.tsx`
