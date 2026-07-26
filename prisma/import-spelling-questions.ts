import { config } from "dotenv";
import { readFileSync } from "fs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { parseCsv } from "./csv";

config({ path: ".env.local" });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const VALID_ANSWERS = new Set(["A", "B", "C", "D", "E"]);

async function main() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error("Usage: tsx prisma/import-spelling-questions.ts <path-to-csv>");
    process.exit(1);
  }

  const raw = readFileSync(csvPath, "utf8");
  const rows = parseCsv(raw);
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const dataRows = rows.slice(1);

  const col = (name: string) => header.indexOf(name);
  const idx = {
    question: col("question"),
    answer: col("answer"),
    explanation: col("explanation"),
  };

  const questions: { sentence: string; correctOption: string; explanation: string }[] = [];
  const errors: string[] = [];

  dataRows.forEach((r, i) => {
    const lineNum = i + 2; // +1 for header, +1 for 1-based
    const sentence = r[idx.question]?.trim();
    const correctOption = r[idx.answer]?.trim().toUpperCase();
    const explanation = r[idx.explanation]?.trim();

    if (!sentence || !correctOption || !explanation) {
      errors.push(`Line ${lineNum}: missing required field(s)`);
      return;
    }
    if (!VALID_ANSWERS.has(correctOption)) {
      errors.push(`Line ${lineNum}: invalid answer "${correctOption}" (must be A-E)`);
      return;
    }

    questions.push({ sentence, correctOption, explanation });
  });

  if (errors.length > 0) {
    console.error(`Found ${errors.length} invalid row(s), aborting import:`);
    errors.slice(0, 20).forEach((e) => console.error(`  ${e}`));
    if (errors.length > 20) console.error(`  ...and ${errors.length - 20} more`);
    process.exit(1);
  }

  console.log(`Parsed ${questions.length} valid rows from ${csvPath}. Importing...`);
  const result = await prisma.spellingQuestion.createMany({ data: questions, skipDuplicates: true });
  console.log(`Inserted ${result.count} spelling questions.`);
}

main()
  .catch((e) => {
    console.error("IMPORT FAILED:", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
