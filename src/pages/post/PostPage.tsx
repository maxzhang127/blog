import { Alert, Button, Card, Space, Spin, Typography } from "antd";
import React from "react";
import { fetchPostMarkdown, fetchPostsIndex } from "../../shared/contentApi";
import type { PostIndexItem } from "../../shared/types";
import { AppShell } from "../../shared/AppShell";

function getSlugFromLocation(): string | null {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");
  return slug && slug.trim().length > 0 ? slug : null;
}

function usePostContent(slug: string | null) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [post, setPost] = React.useState<PostIndexItem | null>(null);
  const [markdown, setMarkdown] = React.useState<string>("");

  React.useEffect(() => {
    let cancelled = false;

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

  return (
    <AppShell activeKey="posts">
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <Card>
          <Space direction="vertical" size={8} style={{ width: "100%" }}>
            <Button href="/posts/">返回列表</Button>
            <Typography.Title level={2} style={{ marginTop: 0 }}>
              {post?.title ?? "文章"}
            </Typography.Title>
            {post?.createdAt ? (
              <Typography.Text type="secondary">{post.createdAt}</Typography.Text>
            ) : null}
          </Space>
        </Card>

        {loading ? <Spin /> : null}
        {error ? <Alert type="error" message="加载失败" description={error} /> : null}
        {!loading && !error ? (
          <Card>
            <pre className="markdown">{markdown}</pre>
          </Card>
        ) : null}
      </Space>
    </AppShell>
  );
}
