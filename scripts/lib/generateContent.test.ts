import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { generateContent } from "./generateContent";

describe("generateContent", () => {
  let tmpRepoRoot: string;
  let tmpPostsDir: string;

  beforeEach(async () => {
    // 创建临时测试目录
    tmpRepoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "blog-test-"));
    tmpPostsDir = path.join(tmpRepoRoot, "posts");
    await fs.mkdir(tmpPostsDir, { recursive: true });
  });

  afterEach(async () => {
    // 清理临时目录
    await fs.rm(tmpRepoRoot, { recursive: true, force: true });
  });

  it("应该成功生成包含有效文章的索引", async () => {
    // 准备测试文章
    const post1 = `---
title: 测试文章 1
slug: test-post-1
createdAt: 2024-01-15
summary: 这是测试文章 1 的摘要
tags: [tag1, tag2]
category: 技术
---
# 测试文章 1

这是正文内容。`;

    const post2 = `---
title: 测试文章 2
slug: test-post-2
createdAt: 2024-01-20
updatedAt: 2024-01-25
summary: 这是测试文章 2 的摘要
---
# 测试文章 2

这是正文内容。`;

    await fs.writeFile(path.join(tmpPostsDir, "post1.md"), post1, "utf8");
    await fs.writeFile(path.join(tmpPostsDir, "post2.md"), post2, "utf8");

    // 执行内容生成
    await generateContent({ repoRoot: tmpRepoRoot });

    // 验证生成的索引文件
    const indexPath = path.join(tmpRepoRoot, "public", "content", "posts-index.json");
    const indexContent = await fs.readFile(indexPath, "utf8");
    const index = JSON.parse(indexContent);

    expect(index.posts).toHaveLength(2);
    expect(index.generatedAt).toBeDefined();

    // 验证文章按日期降序排列（最新的在前）
    expect(index.posts[0].slug).toBe("test-post-2");
    expect(index.posts[1].slug).toBe("test-post-1");

    // 验证第一篇文章的字段
    expect(index.posts[0]).toMatchObject({
      title: "测试文章 2",
      slug: "test-post-2",
      createdAt: "2024-01-20T00:00:00.000Z",
      updatedAt: "2024-01-25T00:00:00.000Z",
      summary: "这是测试文章 2 的摘要",
      sourcePath: "post2.md",
    });

    // 验证第二篇文章的字段
    expect(index.posts[1]).toMatchObject({
      title: "测试文章 1",
      slug: "test-post-1",
      createdAt: "2024-01-15T00:00:00.000Z",
      summary: "这是测试文章 1 的摘要",
      tags: ["tag1", "tag2"],
      category: "技术",
      sourcePath: "post1.md",
    });

    // 验证文章文件已复制到输出目录
    const copiedPost1 = await fs.readFile(
      path.join(tmpRepoRoot, "public", "content", "posts", "post1.md"),
      "utf8"
    );
    expect(copiedPost1).toBe(post1);
  });

  it("应该在 posts 目录不存在时抛出错误", async () => {
    await fs.rm(tmpPostsDir, { recursive: true });

    await expect(generateContent({ repoRoot: tmpRepoRoot })).rejects.toThrow(
      "Missing local posts directory"
    );
  });

  it("应该在 posts 目录为空时抛出错误", async () => {
    await expect(generateContent({ repoRoot: tmpRepoRoot })).rejects.toThrow(
      "No markdown files found"
    );
  });

  it("应该在文章缺少 title 时抛出错误", async () => {
    const invalidPost = `---
slug: test-post
createdAt: 2024-01-15
---
内容`;

    await fs.writeFile(path.join(tmpPostsDir, "invalid.md"), invalidPost, "utf8");

    await expect(generateContent({ repoRoot: tmpRepoRoot })).rejects.toThrow(
      "invalid.md: missing or invalid title"
    );
  });

  it("应该在文章缺少 slug 时抛出错误", async () => {
    const invalidPost = `---
title: 测试文章
createdAt: 2024-01-15
---
内容`;

    await fs.writeFile(path.join(tmpPostsDir, "invalid.md"), invalidPost, "utf8");

    await expect(generateContent({ repoRoot: tmpRepoRoot })).rejects.toThrow(
      "invalid.md: missing or invalid slug"
    );
  });

  it("应该在文章缺少 createdAt 时抛出错误", async () => {
    const invalidPost = `---
title: 测试文章
slug: test-post
---
内容`;

    await fs.writeFile(path.join(tmpPostsDir, "invalid.md"), invalidPost, "utf8");

    await expect(generateContent({ repoRoot: tmpRepoRoot })).rejects.toThrow(
      "invalid.md: missing or invalid createdAt"
    );
  });

  it("应该在 createdAt 格式无效时抛出错误", async () => {
    const invalidPost = `---
title: 测试文章
slug: test-post
createdAt: invalid-date
---
内容`;

    await fs.writeFile(path.join(tmpPostsDir, "invalid.md"), invalidPost, "utf8");

    await expect(generateContent({ repoRoot: tmpRepoRoot })).rejects.toThrow(
      "invalid.md: invalid createdAt date: invalid-date"
    );
  });

  it("应该在存在 slug 冲突时抛出错误", async () => {
    const post1 = `---
title: 文章 1
slug: duplicate-slug
createdAt: 2024-01-15
---
内容 1`;

    const post2 = `---
title: 文章 2
slug: duplicate-slug
createdAt: 2024-01-16
---
内容 2`;

    await fs.writeFile(path.join(tmpPostsDir, "post1.md"), post1, "utf8");
    await fs.writeFile(path.join(tmpPostsDir, "post2.md"), post2, "utf8");

    await expect(generateContent({ repoRoot: tmpRepoRoot })).rejects.toThrow(
      "slug conflict: duplicate-slug"
    );
  });

  it("应该支持嵌套目录中的文章", async () => {
    const subDir = path.join(tmpPostsDir, "subdir");
    await fs.mkdir(subDir, { recursive: true });

    const post = `---
title: 嵌套文章
slug: nested-post
createdAt: 2024-01-15
---
内容`;

    await fs.writeFile(path.join(subDir, "nested.md"), post, "utf8");

    await generateContent({ repoRoot: tmpRepoRoot });

    const indexPath = path.join(tmpRepoRoot, "public", "content", "posts-index.json");
    const indexContent = await fs.readFile(indexPath, "utf8");
    const index = JSON.parse(indexContent);

    expect(index.posts).toHaveLength(1);
    expect(index.posts[0].sourcePath).toBe("subdir/nested.md");

    // 验证文件已复制到正确的子目录
    const copiedPath = path.join(tmpRepoRoot, "public", "content", "posts", "subdir", "nested.md");
    const exists = await fs
      .access(copiedPath)
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(true);
  });

  it("应该正确处理可选字段缺失的情况", async () => {
    const minimalPost = `---
title: 最小文章
slug: minimal-post
createdAt: 2024-01-15
---
内容`;

    await fs.writeFile(path.join(tmpPostsDir, "minimal.md"), minimalPost, "utf8");

    await generateContent({ repoRoot: tmpRepoRoot });

    const indexPath = path.join(tmpRepoRoot, "public", "content", "posts-index.json");
    const indexContent = await fs.readFile(indexPath, "utf8");
    const index = JSON.parse(indexContent);

    expect(index.posts).toHaveLength(1);
    expect(index.posts[0]).toMatchObject({
      title: "最小文章",
      slug: "minimal-post",
      createdAt: "2024-01-15T00:00:00.000Z",
      sourcePath: "minimal.md",
    });
    expect(index.posts[0].summary).toBeUndefined();
    expect(index.posts[0].tags).toBeUndefined();
    expect(index.posts[0].category).toBeUndefined();
    expect(index.posts[0].updatedAt).toBeUndefined();
  });
});
