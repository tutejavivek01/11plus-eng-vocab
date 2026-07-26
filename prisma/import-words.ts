import { config } from "dotenv";
import { readFileSync } from "fs";
import { PrismaClient, Difficulty } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

config({ path: ".env.local" });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const VALID_TOPICS = new Set(["synonyms", "antonyms", "spellings", "general-vocabulary"]);
const VALID_DIFFICULTY = new Set(["EASY", "MEDIUM", "HARD"]);

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        row.push(field);
        field = "";
      } else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(field);
        field = "";
        if (row.length > 1 || row[0] !== "") rows.push(row);
        row = [];
      } else {
        field += c;
      }
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const PLACEHOLDER_VALUES = new Set(["n/a", "na", "none", "-"]);

function firstValue(cell: string | undefined): string | null {
  if (!cell) return null;
  const first = cell.split(",")[0].trim();
  if (first === "" || PLACEHOLDER_VALUES.has(first.toLowerCase())) return null;
  return first;
}

async function main() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error("Usage: tsx prisma/import-words.ts <path-to-csv>");
    process.exit(1);
  }

  const raw = readFileSync(csvPath, "utf8");
  const rows = parseCsv(raw);
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const dataRows = rows.slice(1);

  const col = (name: string) => header.indexOf(name);
  const idx = {
    word: col("word"),
    definition: col("definition"),
    topic: col("topic"),
    difficulty: col("difficulty"),
    synonym: col("synonym"),
    antonym: col("antonym"),
  };

  const words: {
    word: string;
    definition: string;
    topic: string;
    difficulty: Difficulty;
    synonym: string | null;
    antonym: string | null;
  }[] = [];

  const errors: string[] = [];

  dataRows.forEach((r, i) => {
    const lineNum = i + 2; // +1 for header, +1 for 1-based
    const word = r[idx.word]?.trim();
    const definition = r[idx.definition]?.trim();
    const topic = r[idx.topic]?.trim();
    const difficulty = r[idx.difficulty]?.trim();

    if (!word || !definition || !topic || !difficulty) {
      errors.push(`Line ${lineNum}: missing required field(s)`);
      return;
    }
    if (!VALID_TOPICS.has(topic)) {
      errors.push(`Line ${lineNum}: invalid topic "${topic}"`);
      return;
    }
    if (!VALID_DIFFICULTY.has(difficulty)) {
      errors.push(`Line ${lineNum}: invalid difficulty "${difficulty}"`);
      return;
    }

    words.push({
      word,
      definition,
      topic,
      difficulty: difficulty as Difficulty,
      synonym: firstValue(r[idx.synonym]),
      antonym: firstValue(r[idx.antonym]),
    });
  });

  if (errors.length > 0) {
    console.error(`Found ${errors.length} invalid row(s), aborting import:`);
    errors.slice(0, 20).forEach((e) => console.error(`  ${e}`));
    if (errors.length > 20) console.error(`  ...and ${errors.length - 20} more`);
    process.exit(1);
  }

  console.log(`Parsed ${words.length} valid rows from ${csvPath}. Importing...`);
  const result = await prisma.word.createMany({ data: words });
  console.log(`Inserted ${result.count} words.`);
}

main()
  .catch((e) => {
    console.error("IMPORT FAILED:", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
