/**
 * A single blog post index entry generated at build time from `posts/**/*.md`.
 */
export type PostIndexItem = {
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

/**
 * The generated index file served from `/content/posts-index.json`.
 */
export type PostsIndex = {
  generatedAt: string;
  posts: PostIndexItem[];
};

