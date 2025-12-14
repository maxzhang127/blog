import React from "react";
import { Anchor } from "antd";
import type { TocItem } from "./MarkdownRenderer";
import "./TableOfContents.scss";

type TableOfContentsProps = {
  items: TocItem[];
};

/**
 * 文章目录组件，显示文章的标题结构并支持点击跳转。
 *
 * @example
 * ```tsx
 * <TableOfContents items={tocItems} />
 * ```
 */
export function TableOfContents({ items }: TableOfContentsProps) {
  if (items.length === 0) {
    return null;
  }

  // 转换为Ant Design Anchor所需的格式
  const anchorItems = items.map((item) => ({
    key: item.id,
    href: `#${item.id}`,
    title: item.text,
    level: item.level,
  }));

  return (
    <div className="table-of-contents">
      <div className="toc-title">目录</div>
      <Anchor
        className="toc-anchor"
        items={anchorItems}
        offsetTop={80}
        targetOffset={80}
      />
    </div>
  );
}
