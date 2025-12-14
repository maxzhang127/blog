import type { PostIndexItem, PostsIndex } from "./types";

/**
 * Fetches the build-generated posts index.
 */
export async function fetchPostsIndex(): Promise<PostsIndex> {
  const response = await fetch("/content/posts-index.json");
  if (!response.ok) {
    throw new Error(`Failed to load posts index (${response.status})`);
  }
  return (await response.json()) as PostsIndex;
}

/**
 * Fetches raw markdown content for a post.
 * @param post
 */
export async function fetchPostMarkdown(post: PostIndexItem): Promise<string> {
  const response = await fetch(`/content/posts/${post.sourcePath}`);
  if (!response.ok) {
    throw new Error(`Failed to load post markdown (${response.status})`);
  }
  return await response.text();
}
