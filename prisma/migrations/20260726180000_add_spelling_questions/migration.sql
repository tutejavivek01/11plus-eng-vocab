-- AlterEnum
ALTER TYPE "QuestionType" ADD VALUE 'SPOT_MISSPELLING';

-- AlterTable
ALTER TABLE "QuizAnswer" ADD COLUMN     "explanation" TEXT;

-- CreateTable
CREATE TABLE "SpellingQuestion" (
    "id" TEXT NOT NULL,
    "sentence" TEXT NOT NULL,
    "correctOption" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpellingQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SpellingQuestion_sentence_key" ON "SpellingQuestion"("sentence");
