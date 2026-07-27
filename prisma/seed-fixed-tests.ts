import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  generateQuiz,
  getCorrectAnswer,
  type QuestionType,
  type WordRecord,
} from "../lib/quiz/generateQuiz";

interface WordRecordWithDifficulty extends WordRecord {
  difficulty: "EASY" | "MEDIUM" | "HARD";
}
import { toGeneratedSpellingQuestion, type SpellingQuestionRecord } from "../lib/quiz/spellingQuestions";
import { FIXED_TEST_BANDS, getBandForNumber } from "../lib/quiz/fixedTests";

config({ path: ".env.local" });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const VOCAB_TOPICS = ["synonyms", "antonyms", "general-vocabulary"] as const;
const DIFFICULTY_BANDS = ["EASY", "MEDIUM", "HARD"] as const;

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

interface BakedQuestion {
  contentId: string;
  questionType: QuestionType;
  prompt: string;
  options: string[];
  correctText: string;
  explanation: string | null;
  wordText: string | null;
}

function bakeVocabQuestions(subjects: WordRecord[], topicPool: WordRecord[]): BakedQuestion[] {
  const pool = [...subjects, ...topicPool];
  const generated = generateQuiz(pool, subjects.length);
  return generated.map((q) => {
    const subject = subjects.find((s) => s.id === q.wordId)!;
    return {
      contentId: q.wordId,
      questionType: q.questionType,
      prompt: q.prompt,
      options: q.options,
      correctText: getCorrectAnswer(subject, q.questionType, q.variant),
      explanation: null,
      wordText: subject.word,
    };
  });
}

function bakeSpellingQuestions(subjects: SpellingQuestionRecord[]): BakedQuestion[] {
  return subjects.map((sq) => {
    const q = toGeneratedSpellingQuestion(sq);
    return {
      contentId: sq.id,
      questionType: q.questionType,
      prompt: q.prompt,
      options: q.options,
      correctText: sq.correctOption,
      explanation: sq.explanation,
      wordText: null,
    };
  });
}

async function main() {
  const wordsByTopic = new Map<string, WordRecordWithDifficulty[]>();
  for (const topic of VOCAB_TOPICS) {
    const words = await prisma.word.findMany({
      where: { topic },
      select: { id: true, word: true, definition: true, synonym: true, antonym: true, difficulty: true },
    });
    wordsByTopic.set(topic, words);
  }

  const spellingPool = shuffle(await prisma.spellingQuestion.findMany());
  if (spellingPool.length < 144) {
    console.warn(
      `Warning: only ${spellingPool.length} spelling questions available; need 144 for zero repeats across all 48 tests.`
    );
  }

  // Pre-shuffle each topic's subject pool once per band (and once for MIX), so slicing
  // 3-consecutive-per-test-index guarantees zero repeats within that band.
  const subjectPoolsByTopicBand = new Map<string, WordRecordWithDifficulty[]>();
  for (const topic of VOCAB_TOPICS) {
    const allWords = wordsByTopic.get(topic)!;
    for (const band of DIFFICULTY_BANDS) {
      const filtered = allWords.filter((w) => w.difficulty === band);
      subjectPoolsByTopicBand.set(`${topic}:${band}`, shuffle(filtered));
    }
    subjectPoolsByTopicBand.set(`${topic}:MIX`, shuffle(allWords));
  }

  let created = 0;
  let skipped = 0;

  for (let number = 1; number <= 48; number++) {
    const existing = await prisma.fixedTest.findUnique({ where: { number } });
    if (existing) {
      skipped++;
      continue;
    }

    const band = getBandForNumber(number)!;
    const bandStart = FIXED_TEST_BANDS.find((b) => b.value === band)!.range[0];
    const testIndexInBand = number - bandStart; // 0-11

    const baked: BakedQuestion[] = [];
    for (const topic of VOCAB_TOPICS) {
      const subjectPool = subjectPoolsByTopicBand.get(`${topic}:${band}`)!;
      const subjects = subjectPool.slice(testIndexInBand * 3, testIndexInBand * 3 + 3);
      if (subjects.length < 3) {
        throw new Error(
          `Not enough ${band} words in topic "${topic}" for test #${number} (need 3, pool has ${subjectPool.length}).`
        );
      }
      baked.push(...bakeVocabQuestions(subjects, wordsByTopic.get(topic)!));
    }

    const spellingSubjects = spellingPool.slice((number - 1) * 3, number * 3);
    if (spellingSubjects.length < 3) {
      throw new Error(`Not enough spelling questions remaining for test #${number}.`);
    }
    baked.push(...bakeSpellingQuestions(spellingSubjects));

    const finalOrder = shuffle(baked);

    await prisma.fixedTest.create({
      data: {
        number,
        band,
        questions: {
          create: finalOrder.map((q, i) => ({
            orderIndex: i,
            contentId: q.contentId,
            questionType: q.questionType,
            prompt: q.prompt,
            options: q.options,
            correctText: q.correctText,
            explanation: q.explanation,
            wordText: q.wordText,
          })),
        },
      },
    });
    created++;
  }

  console.log(`Created ${created} fixed test(s), skipped ${skipped} already-existing test(s).`);
  console.log("Total FixedTest rows:", await prisma.fixedTest.count());
  console.log("Total FixedTestQuestion rows:", await prisma.fixedTestQuestion.count());
}

main()
  .catch((e) => {
    console.error("SEED FAILED:", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
