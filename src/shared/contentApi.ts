import type { PostIndexItem, PostsIndex } from "./types";

/**
 * Removes Front Matter from markdown text.
 *
 * Front Matter is the YAML metadata section at the top of markdown files,
 * enclosed by `---` delimiters. This function strips it out and returns
 * only the content body.
 *
 * @param markdown - Raw markdown text with Front Matter
 * @returns Markdown content without Front Matter
 *
 * @example
 * ```ts
 * const raw = "---\ntitle: Hello\n---\n# Content";
 * const content = stripFrontMatter(raw);
 * // Returns: "# Content"
 * ```
 */
function stripFrontMatter(markdown: string): string {
  // 匹配以 --- 开头和结尾的 Front Matter 块
  const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
  const match = markdown.match(frontMatterRegex);

  if (match) {
    // 移除 Front Matter，返回剩余内容
    return markdown.slice(match[0].length);
  }

  // 如果没有 Front Matter，直接返回原文
  return markdown;
}

/**
 * Fetches the build-generated posts index.
 *
 * This index is created during build time by scanning all markdown files.
 * The index is cached by the browser and should be lightweight.
 */
export async function fetchPostsIndex(): Promise<PostsIndex> {
  const response = await fetch("/content/posts-index.json");
  if (!response.ok) {
    throw new Error(`Failed to load posts index (${response.status})`);
  }
  return (await response.json()) as PostsIndex;
}

/**
 * Fetches markdown content for a post, with Front Matter stripped.
 *
 * The function fetches the raw markdown file and removes the Front Matter
 * section (YAML metadata at the top), returning only the content body.
 *
 * @param post - The post index item containing sourcePath
 * @returns The markdown content without Front Matter
 */
export async function fetchPostMarkdown(post: PostIndexItem): Promise<string> {
  const response = await fetch(`/content/posts/${post.sourcePath}`);
  if (!response.ok) {
    throw new Error(`Failed to load post markdown (${response.status})`);
  }
  const rawMarkdown = await response.text();

  // 去除Front Matter，只返回正文内容
  return stripFrontMatter(rawMarkdown);
}
