-- CreateEnum
CREATE TYPE "FixedTestBand" AS ENUM ('EASY', 'MEDIUM', 'HARD', 'MIX');

-- AlterTable
ALTER TABLE "QuizAttempt" ADD COLUMN     "fixedTestId" TEXT;

-- CreateTable
CREATE TABLE "FixedTest" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "band" "FixedTestBand" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FixedTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FixedTestQuestion" (
    "id" TEXT NOT NULL,
    "fixedTestId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "contentId" TEXT NOT NULL,
    "questionType" "QuestionType" NOT NULL,
    "prompt" TEXT NOT NULL,
    "options" TEXT[],
    "correctText" TEXT NOT NULL,
    "explanation" TEXT,

    CONSTRAINT "FixedTestQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FixedTest_number_key" ON "FixedTest"("number");

-- CreateIndex
CREATE INDEX "FixedTest_band_idx" ON "FixedTest"("band");

-- CreateIndex
CREATE INDEX "FixedTestQuestion_fixedTestId_idx" ON "FixedTestQuestion"("fixedTestId");

-- CreateIndex
CREATE UNIQUE INDEX "FixedTestQuestion_fixedTestId_orderIndex_key" ON "FixedTestQuestion"("fixedTestId", "orderIndex");

-- CreateIndex
CREATE INDEX "QuizAttempt_userId_fixedTestId_idx" ON "QuizAttempt"("userId", "fixedTestId");

-- AddForeignKey
ALTER TABLE "FixedTestQuestion" ADD CONSTRAINT "FixedTestQuestion_fixedTestId_fkey" FOREIGN KEY ("fixedTestId") REFERENCES "FixedTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_fixedTestId_fkey" FOREIGN KEY ("fixedTestId") REFERENCES "FixedTest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
