# Quiz MVP Spec

## Overview
Users create an account with an email and password (or sign back in with the same credentials), then take multiple-choice 11+ vocabulary quizzes drawn from a database-backed word bank, get immediate per-question feedback, see a results summary with a review of missed questions, and can view their past attempts with simple aggregate stats.

## Authentication
- Users sign up with an email address and password, and sign in with the same credentials thereafter — this replaces the previously planned Google OAuth login.
- Basic server-side validation applies: a valid-looking email format and a minimum password length (exact rule TBD at implementation).
- Passwords are never stored or logged in plain text (hashed before being persisted).
- Signed-out users attempting to reach quiz or history pages are redirected to sign-in, same as before.

## In scope for MVP
- Email/password signup and sign-in (replacing Google OAuth)
- Pre-quiz setup: pick a topic and quiz length
- Taking a quiz: one question per screen, multiple choice, immediate feedback
- Results screen: score + review of missed questions
- Progress history page: list of past attempts + simple stats

## Out of scope for MVP
- Password reset / forgot-password flow
- Email verification
- Social/OAuth login providers
- Free-text/typed answers (e.g. spelling input)
- Timers (per-question or whole-quiz)
- Difficulty selection in the pre-quiz setup (difficulty is tagged on words but not user-filterable yet)
- Curated per-word distractors (distractors are randomly sampled, not hand-picked)

## Word content
- Word bank lives in the database (`Word` table via Prisma — see `CLAUDE.md`), not JSON or hardcoded.
- Organized into a few topics/categories (e.g. synonyms, antonyms, spellings, general vocabulary).
- Each word is tagged with a difficulty: Easy / Medium / Hard. Difficulty is stored now but not exposed as a filter in MVP — quizzes draw from all difficulties within the chosen topic.

## Pre-quiz setup
User selects, before starting:
1. **Topic** — one of the available categories.
2. **Length** — number of questions (e.g. 5/10/20; exact options TBD at implementation).

No difficulty picker in MVP.

## Question types
Two formats, mixed within a quiz:
1. **Word → definition**: given a word, choose its correct definition.
2. **Definition → word**: given a definition, choose the correct word.
3. **Synonym/antonym**: "Choose the synonym/antonym of X."

All questions are multiple choice with **4 options** (1 correct + 3 distractors). Distractors are chosen **randomly from other words in the same topic** (not curated per-word).

## Quiz flow
- One question per screen.
- User selects an option → immediately shown correct/incorrect (and the correct answer if they got it wrong) → advances to the next question.
- No timer; user moves at their own pace.
- After the last question, user is taken to the results screen.

## Results screen
- Final score (e.g. "8/10").
- Review list of the questions the user got wrong, each showing the question and the correct answer.
- Option to start another quiz.

## Progress history
A page listing the logged-in user's past quiz attempts:
- Per attempt: date, topic, score.
- Sorted most recent first.
- Simple aggregate stats alongside the list (e.g. average score, best-performing topic — exact stats TBD at implementation).

## Data model implications
Builds on the models described in `CLAUDE.md`:
- `User` — email (unique), passwordHash. No OAuth-related tables (`Account`, `Session`, `VerificationToken`) are needed since auth is email/password with JWT sessions, not the Prisma adapter.
- `Word` — id, word, definition, topic, difficulty (Easy/Medium/Hard).
- `QuizAttempt` — userId, topic, length, score, createdAt. Needs enough detail (or a related `QuizAnswer` table) to reconstruct which questions were missed for the results screen review and for progress history stats.

## Open questions for later
- Exact set of allowed quiz lengths.
- Which aggregate stats to show on the progress history page.
- Whether topics are fixed/seeded or user-manageable.
- Minimum password requirements/validation rules.
- Whether/when to add password reset or email verification post-MVP.
