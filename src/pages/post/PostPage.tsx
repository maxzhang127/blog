import { Alert, Button, Card, Col, Row, Space, Spin, Tag, Typography } from "antd";
import React from "react";
import { fetchPostMarkdown, fetchPostsIndex } from "../../shared/contentApi";
import type { PostIndexItem } from "../../shared/types";
import { AppShell } from "../../shared/AppShell";
import { MarkdownRenderer } from "../../shared/MarkdownRenderer";
import { TableOfContents } from "../../shared/TableOfContents";
import { extractToc } from "../../shared/extractToc";
import { formatDate } from "../../shared/formatDate";
import "./PostPage.scss";

/**
 *
 */
function getSlugFromLocation(): string | null {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");
  return slug && slug.trim().length > 0 ? slug : null;
}

/**
 *
 * @param slug
 */
function usePostContent(slug: string | null) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [post, setPost] = React.useState<PostIndexItem | null>(null);
  const [markdown, setMarkdown] = React.useState<string>("");

  React.useEffect(() => {
    let cancelled = false;

    /**
     *
     */
    async function run() {
      if (!slug) {
        setError("Missing slug");
        setLoading(false);
        return;
      }

      try {
        const index = await fetchPostsIndex();
        const matched = index.posts.find((p) => p.slug === slug) ?? null;
        if (!matched) {
          throw new Error(`Post not found: ${slug}`);
        }

        const text = await fetchPostMarkdown(matched);
        if (!cancelled) {
          setPost(matched);
          setMarkdown(text);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { loading, error, post, markdown };
}

/**
 * Post detail page (client-side fetches markdown text).
 */
export function PostPage() {
  const slug = getSlugFromLocation();
  const { loading, error, post, markdown } = usePostContent(slug);

  // 从Markdown提取TOC
  const tocItems = React.useMemo(() => {
    if (!markdown) return [];
    return extractToc(markdown);
  }, [markdown]);

  return (
    <AppShell activeKey="posts">
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        {/* 文章头部 */}
        <Card>
          <Space direction="vertical" size={8} style={{ width: "100%" }}>
            <Button href="/posts/">返回列表</Button>
            <Typography.Title level={2} style={{ marginTop: 0 }}>
              {post?.title ?? "文章"}
            </Typography.Title>

            {/* 元信息 */}
            <Space size={12} wrap>
              {post?.createdAt ? (
                <Typography.Text type="secondary">
                  发布于 {formatDate(post.createdAt)}
                </Typography.Text>
              ) : null}
              {post?.updatedAt ? (
                <Typography.Text type="secondary">
                  更新于 {formatDate(post.updatedAt)}
                </Typography.Text>
              ) : null}
              {post?.category ? <Tag color="blue">{post.category}</Tag> : null}
              {post?.tags?.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </Space>

            {/* 摘要 */}
            {post?.summary ? (
              <Typography.Paragraph type="secondary" style={{ marginTop: 8 }}>
                {post.summary}
              </Typography.Paragraph>
            ) : null}
          </Space>
        </Card>

        {/* 加载和错误状态 */}
        {loading ? (
          <Card>
            <Spin tip="加载中..." />
          </Card>
        ) : null}
        {error ? (
          <Alert type="error" message="加载失败" description={error} />
        ) : null}

        {/* 正文内容 + TOC */}
        {!loading && !error ? (
          <Row gutter={[24, 24]}>
            <Col xs={24} xl={18}>
              <Card className="post-content-card">
                <MarkdownRenderer content={markdown} />
              </Card>
            </Col>
            {tocItems.length > 0 ? (
              <Col xs={0} xl={6}>
                <TableOfContents items={tocItems} />
              </Col>
            ) : null}
          </Row>
        ) : null}
      </Space>
    </AppShell>
  );
}
