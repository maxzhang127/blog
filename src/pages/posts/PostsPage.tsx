import { Alert, Card, List, Space, Spin, Tag, Typography } from "antd";
import React from "react";
import { AppShell } from "../../shared/AppShell";
import { fetchPostsIndex } from "../../shared/contentApi";
import type { PostIndexItem } from "../../shared/types";

/**
 *
 */
function usePostsIndex() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [posts, setPosts] = React.useState<PostIndexItem[]>([]);

  React.useEffect(() => {
    let cancelled = false;

    /**
     *
     */
    async function run() {
      try {
        const index = await fetchPostsIndex();
        if (!cancelled) {
          setPosts(index.posts);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return { loading, error, posts };
}

/**
 * Posts list page.
 */
export function PostsPage() {
  const { loading, error, posts } = usePostsIndex();

  return (
    <AppShell activeKey="posts">
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <Card>
          <Typography.Title level={2} style={{ marginTop: 0 }}>
            文章列表
          </Typography.Title>
          <Typography.Paragraph type="secondary">
            共 {posts.length} 篇文章
          </Typography.Paragraph>
        </Card>

        {loading ? (
          <Card>
            <Spin tip="加载中..." />
          </Card>
        ) : null}

        {error ? (
          <Alert type="error" message="加载失败" description={error} />
        ) : null}

        {!loading && !error ? (
          <Card>
            <List
              dataSource={posts}
              renderItem={(post) => (
                <List.Item key={post.slug}>
                  <List.Item.Meta
                    title={
                      <a href={`/post/?slug=${encodeURIComponent(post.slug)}`}>
                        {post.title}
                      </a>
                    }
                    description={
                      <Space direction="vertical" size={4}>
                        {post.summary ? (
                          <Typography.Text type="secondary">{post.summary}</Typography.Text>
                        ) : null}
                        <Space size={8}>
                          {post.createdAt ? (
                            <Typography.Text type="secondary">
                              发布于 {post.createdAt}
                            </Typography.Text>
                          ) : null}
                          {post.category ? <Tag>{post.category}</Tag> : null}
                          {post.tags?.map((tag) => (
                            <Tag key={tag}>{tag}</Tag>
                          ))}
                        </Space>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        ) : null}
      </Space>
    </AppShell>
  );
}
