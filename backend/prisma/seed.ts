import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "node:url";

const prisma = new PrismaClient();

type CriterionRow = {
  section: string;
  categoryCode: string;
  categoryName: string;
  ref: string;
  question: string;
  sortOrder: number;
};

async function main() {
  const seedDir = path.dirname(fileURLToPath(import.meta.url));
  const raw = readFileSync(path.join(seedDir, "..", "data", "criteria.json"), "utf8");
  const rows = JSON.parse(raw) as CriterionRow[];

  for (const row of rows) {
    await prisma.criterion.upsert({
      where: { ref: row.ref },
      update: {
        section: row.section,
        categoryCode: row.categoryCode,
        categoryName: row.categoryName,
        question: row.question,
        sortOrder: row.sortOrder,
      },
      create: row,
    });
  }

  console.info(`Seeded ${rows.length} criteria from CHECKLIST (3).xlsx.`);
  console.info("Imported verbatim. Source quirks left as written:");
  console.info("- C4.1 and C4.2 repeat reporting questions that also appear in section A.");
  console.info("- D1.3 is a community-channel question filed under Energy conservation.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
