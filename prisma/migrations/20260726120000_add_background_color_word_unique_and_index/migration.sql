-- AlterTable
ALTER TABLE "User" ADD COLUMN     "backgroundColor" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Word_word_topic_key" ON "Word"("word", "topic");

-- CreateIndex
CREATE INDEX "QuizAnswer_wordId_idx" ON "QuizAnswer"("wordId");
