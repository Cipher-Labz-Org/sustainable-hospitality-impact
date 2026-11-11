import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const frontendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(frontendDir, "..");
const schemaPath = path.join(repoRoot, "backend", "prisma", "schema.prisma");
const frontendNodeModules = path.join(frontendDir, "node_modules");
const repoNodeModules = path.join(repoRoot, "node_modules");
const generateDir = path.join(frontendDir, ".prisma-generate");

function isLinkToFrontend(targetPath) {
  try {
    const existing = fs.lstatSync(targetPath);
    if (!existing.isSymbolicLink() && !existing.isDirectory()) return false;
    const resolved = fs.realpathSync(targetPath);
    return resolved === fs.realpathSync(frontendNodeModules);
  } catch {
    return false;
  }
}

function linkRepoNodeModules() {
  if (!fs.existsSync(frontendNodeModules)) return;
  if (isLinkToFrontend(repoNodeModules)) return;

  // Vercel has no root node_modules. A leftover real directory from the
  // pre-split app would hide frontend packages from Turbopack's repo root.
  if (process.env.VERCEL && fs.existsSync(repoNodeModules) && !isLinkToFrontend(repoNodeModules)) {
    fs.rmSync(repoNodeModules, { recursive: true, force: true });
  }

  if (fs.existsSync(repoNodeModules)) return;

  fs.symlinkSync(
    frontendNodeModules,
    repoNodeModules,
    process.platform === "win32" ? "junction" : "dir",
  );
}

function schemaWithFrontendOutput(schema) {
  const outputDir = path.join(frontendNodeModules, ".prisma", "client").replaceAll("\\", "/");
  return schema.replace(/generator client \{[\s\S]*?\}/m, (block) => {
    if (/output\s*=/.test(block)) {
      return block.replace(/output\s*=\s*"[^"]*"/, `output = "${outputDir}"`);
    }
    return block.replace(/\{/, `{\n  output          = "${outputDir}"`);
  });
}

function generatePrismaClient() {
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Prisma schema not found at ${schemaPath}`);
  }

  fs.mkdirSync(generateDir, { recursive: true });
  const tmpSchema = path.join(generateDir, "schema.prisma");
  fs.writeFileSync(tmpSchema, schemaWithFrontendOutput(fs.readFileSync(schemaPath, "utf8")));

  const prismaCli = path.join(frontendNodeModules, "prisma", "build", "index.js");
  const env = {
    ...process.env,
    PRISMA_GENERATE_SKIP_AUTOINSTALL: "true",
    // Generate only reads the schema. A placeholder keeps installs from failing
    // when DATABASE_URL is not injected yet; runtime still requires the real value.
    DATABASE_URL:
      process.env.DATABASE_URL ||
      "postgresql://prisma:prisma@127.0.0.1:5432/prisma?schema=public",
  };

  try {
    const result = fs.existsSync(prismaCli)
      ? spawnSync(process.execPath, [prismaCli, "generate", `--schema=${tmpSchema}`], {
          cwd: frontendDir,
          env,
          stdio: "inherit",
        })
      : spawnSync("npx", ["prisma", "generate", `--schema=${tmpSchema}`], {
          cwd: frontendDir,
          env,
          stdio: "inherit",
          shell: true,
        });

    if (result.status !== 0) {
      const generated = path.join(frontendNodeModules, ".prisma", "client", "index.js");
      if (fs.existsSync(generated)) {
        console.warn("prisma generate failed; using the existing generated client.");
        return;
      }
      process.exit(result.status ?? 1);
    }
  } finally {
    fs.rmSync(generateDir, { recursive: true, force: true });
  }
}

linkRepoNodeModules();
generatePrismaClient();
