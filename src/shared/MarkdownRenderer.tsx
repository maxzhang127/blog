import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { Components } from "react-markdown";
import "./MarkdownRenderer.scss";

type MarkdownRendererProps = {
  content: string;
};

export type TocItem = {
  level: number;
  text: string;
  id: string;
};

/**
 * Markdown渲染器组件，支持：
 * - GitHub Flavored Markdown（表格、删除线等）
 * - 自动标题锚点生成
 * - 代码语法高亮
 * - 图片懒加载
 *
 * TOC提取请使用独立的extractToc函数。
 */
export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // 自定义组件配置
  const components: Components = {
    // 代码块高亮
    code({ inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || "");
      const language = match ? match[1] : "";

      if (!inline && language) {
        return (
          <SyntaxHighlighter
            style={oneDark}
            language={language}
            PreTag="div"
            className="markdown-code-block"
            {...props}
          >
            {String(children).replace(/\n$/, "")}
          </SyntaxHighlighter>
        );
      }

      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },

    // 图片懒加载与错误处理
    img({ src, alt, ...props }) {
      const [error, setError] = React.useState(false);

      if (error) {
        return (
          <div className="markdown-img-error">
            <span className="markdown-img-error-icon">🖼️</span>
            <span className="markdown-img-error-text">{alt || "图片加载失败"}</span>
          </div>
        );
      }

      return (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setError(true)}
          className="markdown-img"
          {...props}
        />
      );
    },

    // 链接处理
    a({ href, children, ...props }) {
      // 外链在新标签页打开
      const isExternal = href?.startsWith("http://") || href?.startsWith("https://");
      return (
        <a
          href={href}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          {...props}
        >
          {children}
        </a>
      );
    },
  };

  return (
    <div className="markdown-renderer">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: "wrap" }],
        ]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
