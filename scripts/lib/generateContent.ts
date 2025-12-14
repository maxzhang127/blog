import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { atomicReplaceDirectory } from "./atomicReplaceDirectory";
import { toIsoDate, asOptionalString, asOptionalStringArray } from "./validators";

type PostFrontMatter = {
  title?: unknown;
  slug?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  summary?: unknown;
  tags?: unknown;
  category?: unknown;
  cover?: unknown;
};

type PostIndexItem = {
  title: string;
  slug: string;
  createdAt: string;
  updatedAt?: string;
  summary?: string;
  tags?: string[];
  category?: string;
  cover?: string;
  sourcePath: string;
};

type PostsIndex = {
  generatedAt: string;
  posts: PostIndexItem[];
};

/**
 *
 * @param rootDir
 */
async function listMarkdownFiles(rootDir: string): Promise<string[]> {
  const results: string[] = [];
  /**
   *
   * @param dir
   */
  async function walk(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }
      if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
        results.push(fullPath);
      }
    }
  }
  await walk(rootDir);
  return results.sort();
}

/**
 *
 * @param options
 * @param options.repoRoot
 */
export async function generateContent(options: { repoRoot: string }): Promise<void> {
  const { repoRoot } = options;
  const localPostsDirName = process.env.LOCAL_POSTS_DIR ?? "content";
  const postsDir = path.join(repoRoot, localPostsDirName);

  try {
    const stats = await fs.stat(postsDir);
    if (!stats.isDirectory()) {
      throw new Error(`${postsDir} is not a directory`);
    }
  } catch {
    throw new Error(
      `Missing local posts directory (${localPostsDirName}). Run \`npm run fetch\` first.`
    );
  }

  const markdownFiles = await listMarkdownFiles(postsDir);
  if (markdownFiles.length === 0) {
    throw new Error(
      `No markdown files found in ${localPostsDirName}/. Run \`npm run fetch\` first.`
    );
  }

  const slugToFile = new Map<string, string>();
  const posts: PostIndexItem[] = [];

  for (const absolutePath of markdownFiles) {
    const relativePath = path.relative(postsDir, absolutePath);
    const fileText = await fs.readFile(absolutePath, "utf8");
    const parsed = matter(fileText);
    const data = parsed.data as PostFrontMatter;

    const title = asOptionalString(data.title);
    if (!title) {
      throw new Error(`${relativePath}: missing or invalid title`);
    }

    const slug = asOptionalString(data.slug);
    if (!slug) {
      throw new Error(`${relativePath}: missing or invalid slug`);
    }

    if (slugToFile.has(slug)) {
      throw new Error(`slug conflict: ${slug} (${slugToFile.get(slug)} vs ${relativePath})`);
    }
    slugToFile.set(slug, relativePath);

    const createdAt = toIsoDate(data.createdAt, "createdAt", relativePath);
    const updatedAt = data.updatedAt
      ? toIsoDate(data.updatedAt, "updatedAt", relativePath)
      : undefined;

    posts.push({
      title,
      slug,
      createdAt,
      updatedAt,
      summary: asOptionalString(data.summary),
      tags: asOptionalStringArray(data.tags),
      category: asOptionalString(data.category),
      cover: asOptionalString(data.cover),
      sourcePath: relativePath.split(path.sep).join("/"),
    });
  }

  posts.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const index: PostsIndex = {
    generatedAt: new Date().toISOString(),
    posts,
  };

  const contentDir = path.join(repoRoot, "public", "content");
  const tmpDir = path.join(repoRoot, "public", "content.__tmp__");
  const backupDir = path.join(repoRoot, "public", "content.__backup__");
  const postsOutDir = path.join(tmpDir, "posts");

  await fs.rm(tmpDir, { recursive: true, force: true });
  await fs.mkdir(postsOutDir, { recursive: true });

  for (const absolutePath of markdownFiles) {
    const relativePath = path.relative(postsDir, absolutePath);
    const destinationPath = path.join(postsOutDir, relativePath);
    await fs.mkdir(path.dirname(destinationPath), { recursive: true });
    await fs.copyFile(absolutePath, destinationPath);
  }

  await fs.writeFile(
    path.join(tmpDir, "posts-index.json"),
    JSON.stringify(index, null, 2) + "\n",
    "utf8"
  );

  await atomicReplaceDirectory({
    sourceDir: tmpDir,
    targetDir: contentDir,
    backupDir,
  });
}
