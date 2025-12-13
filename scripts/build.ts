import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { build as viteBuild } from "vite";
import { atomicReplaceDirectory } from "./lib/atomicReplaceDirectory";
import { generateContent } from "./lib/generateContent";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

async function main() {
  dotenv.config({ path: path.join(repoRoot, ".env.local") });
  await generateContent({ repoRoot });

  const distDir = path.join(repoRoot, "dist");
  const tmpDir = path.join(repoRoot, "dist.__tmp__");
  const backupDir = path.join(repoRoot, "dist.__backup__");

  await viteBuild({
    configFile: path.join(repoRoot, "vite.config.ts"),
    build: { outDir: tmpDir, emptyOutDir: true },
  });

  await atomicReplaceDirectory({
    sourceDir: tmpDir,
    targetDir: distDir,
    backupDir,
  });

  const distRelative = path.relative(process.cwd(), distDir) || "dist";
  process.stdout.write(`Generated ${distRelative}\n`);
}

main().catch((error: unknown) => {
  const message =
    error && typeof error === "object" && "stack" in error && error.stack
      ? String(error.stack)
      : String(error);

  process.stderr.write(`Build failed: ${message}\n`);
  process.exit(1);
});
