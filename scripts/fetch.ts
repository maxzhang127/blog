import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { atomicReplaceDirectory } from "./lib/atomicReplaceDirectory";
import { downloadMarkdownTree } from "./lib/downloadMarkdownTree";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function normalizeDirectoryUrl(url: URL): URL {
  const copy = new URL(url);
  if (!copy.pathname.endsWith("/")) {
    copy.pathname += "/";
  }
  return copy;
}

function normalizeSubdir(subdir: string): string {
  const trimmed = subdir.trim();
  if (trimmed === "" || trimmed === "." || trimmed === "./") return "";

  const withoutLeadingSlash = trimmed.replace(/^\/+/, "");
  if (withoutLeadingSlash === "") return "";

  return withoutLeadingSlash.endsWith("/")
    ? withoutLeadingSlash
    : `${withoutLeadingSlash}/`;
}

async function main() {
  dotenv.config({ path: path.join(repoRoot, ".env.local") });

  const blogWebdavUrl = normalizeDirectoryUrl(
    new URL(requiredEnv("NEXTCLOUD_BLOG_WEBDAV_URL"))
  );
  if (blogWebdavUrl.username || blogWebdavUrl.password) {
    throw new Error(
      "NEXTCLOUD_BLOG_WEBDAV_URL must not include credentials (use NEXTCLOUD_USERNAME / NEXTCLOUD_APP_PASSWORD)."
    );
  }

  const username = requiredEnv("NEXTCLOUD_USERNAME");
  const appPassword = requiredEnv("NEXTCLOUD_APP_PASSWORD");
  const postsSubdir = normalizeSubdir(
    process.env.NEXTCLOUD_POSTS_SUBDIR ?? "posts/"
  );
  const localPostsDirName = process.env.LOCAL_POSTS_DIR ?? "posts";

  const postsWebdavUrl = new URL(postsSubdir, blogWebdavUrl);
  const localPostsDir = path.join(repoRoot, localPostsDirName);
  const tmpDir = path.join(repoRoot, `${localPostsDirName}.__tmp__`);
  const backupDir = path.join(repoRoot, `${localPostsDirName}.__backup__`);

  await fs.rm(tmpDir, { recursive: true, force: true });
  await fs.mkdir(tmpDir, { recursive: true });

  await downloadMarkdownTree({
    rootUrl: postsWebdavUrl,
    username,
    appPassword,
    destinationDir: tmpDir,
  });

  await atomicReplaceDirectory({
    sourceDir: tmpDir,
    targetDir: localPostsDir,
    backupDir,
  });

  const postsRelative =
    path.relative(process.cwd(), localPostsDir) || localPostsDirName;
  process.stdout.write(`Fetched posts to ${postsRelative}\n`);
}

main().catch((error: unknown) => {
  const message =
    error && typeof error === "object" && "stack" in error && error.stack
      ? String(error.stack)
      : String(error);

  process.stderr.write(`Fetch failed: ${message}\n`);
  process.exit(1);
});
