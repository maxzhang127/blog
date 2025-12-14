import { unified } from "unified";
import remarkParse from "remark-parse";
import { visit } from "unist-util-visit";
import type { Heading } from "mdast";
import type { TocItem } from "./MarkdownRenderer";

/**
 * 从Markdown文本中提取目录结构（TOC）。
 *
 * 该函数解析Markdown文本，提取所有标题（h1-h6），并生成包含
 * 标题层级、文本内容和锚点ID的目录结构。
 *
 * @param markdown - Markdown源文本
 * @returns 目录项数组，包含层级、文本和ID
 *
 * @example
 * ```ts
 * const toc = extractToc("# Title\n## Subtitle");
 * // [{ level: 1, text: "Title", id: "title" }, ...]
 * ```
 */
export function extractToc(markdown: string): TocItem[] {
  const tocItems: TocItem[] = [];

  const tree = unified().use(remarkParse).parse(markdown);

  visit(tree, "heading", (node: Heading) => {
    const text = node.children
      .filter((child) => child.type === "text")
      .map((child) => ("value" in child ? String(child.value) : ""))
      .join("");

    if (text) {
      // 生成ID（与rehype-slug保持一致）
      const id = text
        .toLowerCase()
        .replace(/[^\w\u4e00-\u9fa5]+/g, "-")
        .replace(/^-+|-+$/g, "");

      tocItems.push({
        level: node.depth,
        text,
        id,
      });
    }
  });

  return tocItems;
}
