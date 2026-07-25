# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

An 11+ vocabulary quiz app. Users log in, take quizzes drawn from a word bank, and their progress/scores are saved per user. Deployed on Vercel's free tier, so all choices below are made to stay within free-tier limits (serverless function duration, no long-running processes, low-cost/free Postgres).

This repo is greenfield — if `package.json` does not exist yet, scaffold with:
```
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias "@/*"
```

## Tech stack

- **Framework**: Next.js (App Router, `app/` directory)
- **Styling**: Tailwind CSS
- **Auth**: NextAuth.js (Auth.js) using the Credentials provider for local email/password signup and sign-in. No OAuth provider and no Prisma adapter — the Credentials provider requires JWT sessions in NextAuth v4 (not database sessions), so `User` rows are read/written directly via Prisma rather than through the adapter
- **Database**: Vercel Postgres (Neon) — free tier
- **ORM**: Prisma
- **Testing**: Vitest (+ React Testing Library for components)
- **Word data**: stored in Postgres via Prisma (a `Word` model), never hardcoded into components/logic or shipped as static JSON

## Commands

```
npm run dev              # start local dev server
npm run build            # production build
npm run start            # run production build locally
npm run lint             # eslint
npm run test             # run vitest once
npm run test -- <name>   # run a single test file or test name match
npm run test:watch       # vitest in watch mode

npx prisma migrate dev   # create/apply a migration locally
npx prisma generate      # regenerate the Prisma client after schema changes
npx prisma studio        # inspect/edit DB data locally
```

Add these scripts to `package.json` as the project is scaffolded if they don't already exist (Vitest scripts and the `test` script are not part of the default `create-next-app` output).

## Environment variables

Required in `.env.local` (and as Vercel project env vars for deployment):
```
DATABASE_URL=          # Vercel Postgres (Neon) connection string
NEXTAUTH_SECRET=       # random secret for NextAuth (also signs the JWT session)
NEXTAUTH_URL=          # http://localhost:3000 in dev
```
Never commit `.env.local`. Vercel's free-tier Postgres connection limits are low — always go through Prisma's connection pooling (use the pooled `DATABASE_URL` Vercel/Neon provides, not a direct connection) to avoid exhausting connections in serverless functions.

## Architecture

**Word data (database-backed)**
Vocabulary lives in a `Word` table in Postgres (via Prisma), not in JSON files or hardcoded arrays. A typical shape: `{ id, word, definition, options[] (or a related `WordOption` table), correctAnswer, topic, difficulty }`. Quiz pages/API routes query this table via Prisma — word content is never inlined in components or route handlers. Adding a new word list means inserting rows (via a seed script or an admin route), not touching app code. Use `prisma/seed.ts` (`npx prisma db seed`) to bulk-load word sets rather than one-off manual inserts.

**Auth flow**
NextAuth is configured in `app/api/auth/[...nextauth]/route.ts` (or `lib/auth.ts`) with the `CredentialsProvider`, `session: { strategy: "jwt" }`, and no Prisma adapter — NextAuth v4's Credentials provider does not support database sessions, so there is nothing for an adapter to persist. Two things are hand-rolled instead of relying on adapter magic:
- **Signup**: a dedicated route (e.g. `app/api/auth/signup/route.ts`, outside the NextAuth catch-all) accepts `{ email, password, name? }`, validates the input, checks for an existing user by email, hashes the password (bcrypt) and creates the `User` row directly via Prisma. Never store or log plain-text passwords.
- **Sign-in**: the Credentials provider's `authorize()` callback looks up the `User` by email via Prisma, compares the submitted password against the stored hash with bcrypt, and returns the user object on success or `null` on failure. A `jwt` callback puts `user.id` on the token, and a `session` callback copies it onto `session.user.id`, so `getServerSession` still exposes the user's id exactly as before.

Route/page access control is done via `getServerSession` (App Router server components/route handlers) rather than client-side checks, since this is what protects quiz progress data — this is unchanged from the OAuth-based setup.

**Data model (Prisma schema)**
Since sessions are JWT-based and there's no OAuth provider, the schema does not need NextAuth's `Account`, `Session`, or `VerificationToken` tables — only a `User` table (with `email` unique and a `passwordHash` field) is required for auth. Beyond that, the schema should have:
- `Word` (and optionally `WordOption`) — the vocabulary content itself.
- `QuizAttempt` (or similar), keyed by `userId`, recording which word(s)/topic were attempted, the score, and a timestamp, so progress can be queried per user.

Keep `Word` and `QuizAttempt` conceptually separate even though both live in Postgres: `Word` is shared content, `QuizAttempt` is per-user state.

**Request flow for a quiz**
Quiz pages/API routes query the `Word` table via Prisma (e.g. a random/filtered selection by topic or difficulty) to build a quiz, render it client-side, and on completion POST the result to an API route (`app/api/quiz-attempts/route.ts` or similar), which re-validates the answers against the `Word` table server-side and writes a `QuizAttempt` row via Prisma after confirming the session via `getServerSession`. Do not trust client-submitted scores — always re-check against the DB's correct answers.

**Deployment constraints (Vercel free tier)**
- Serverless functions have a duration limit — keep API routes fast (small, indexed queries; no batch jobs).
- No persistent in-memory state between requests — anything that must survive a request goes to Postgres.
- Watch Neon's free-tier connection limits: reuse a single Prisma client instance (module-level singleton) rather than instantiating `PrismaClient` per request, to avoid exhausting connections under serverless concurrency.
