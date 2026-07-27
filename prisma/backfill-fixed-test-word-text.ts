import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

config({ path: ".env.local" });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const rows = await prisma.fixedTestQuestion.findMany({
    where: { questionType: { not: "SPOT_MISSPELLING" }, wordText: null },
    select: { id: true, contentId: true },
  });

  console.log(`Found ${rows.length} vocab question(s) missing wordText.`);

  let updated = 0;
  let missingWord = 0;
  for (const row of rows) {
    const word = await prisma.word.findUnique({ where: { id: row.contentId }, select: { word: true } });
    if (!word) {
      missingWord++;
      console.warn(`  No Word row found for FixedTestQuestion ${row.id} (contentId ${row.contentId}); skipping.`);
      continue;
    }
    await prisma.fixedTestQuestion.update({ where: { id: row.id }, data: { wordText: word.word } });
    updated++;
  }

  console.log(`Backfilled ${updated} row(s); ${missingWord} row(s) skipped (no matching Word).`);
}

main()
  .catch((e) => {
    console.error("BACKFILL FAILED:", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
