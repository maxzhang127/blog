import { ArrowRightOutlined, CodeOutlined, FileTextOutlined } from "@ant-design/icons";
import { Button, Card, Typography } from "antd";
import React from "react";
import { fetchPostsIndex } from "../../shared/contentApi";
import type { PostIndexItem } from "../../shared/types";
import { AppShell } from "../../shared/AppShell";
import { formatDate } from "../../shared/formatDate";
import "./HomePage.scss";

/**
 * 获取最新文章列表。
 */
function useLatestPosts(limit: number = 6) {
  const [loading, setLoading] = React.useState(true);
  const [posts, setPosts] = React.useState<PostIndexItem[]>([]);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const index = await fetchPostsIndex();
        if (!cancelled) {
          setPosts(index.posts.slice(0, limit));
        }
      } catch (error) {
        console.error("Failed to load posts:", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [limit]);

  return { loading, posts };
}

/**
 * Home page with modern tech aesthetic.
 */
export function HomePage() {
  const { loading, posts } = useLatestPosts(6);

  return (
    <AppShell activeKey="home">
      <div className="home-page">
        {/* Hero Section */}
        <section className="hero">
          <div className="hero-content">
            <div className="hero-badge">
              <CodeOutlined className="badge-icon" />
              <span>技术博客</span>
            </div>
            <h1 className="hero-title">
              构建 · 分享 · 成长
              <span className="title-cursor">_</span>
            </h1>
            <p className="hero-description">
              记录技术探索与实践，分享开发经验与思考。
              <br />
              在代码中寻找美学，在实践中追求卓越。
            </p>
            <div className="hero-actions">
              <Button
                type="primary"
                size="large"
                href="/posts/"
                icon={<FileTextOutlined />}
                className="btn-primary"
              >
                浏览文章
              </Button>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="hero-decoration">
            <div className="deco-grid"></div>
            <div className="deco-circle circle-1"></div>
            <div className="deco-circle circle-2"></div>
          </div>
        </section>

        {/* Latest Posts Section */}
        <section className="latest-posts">
          <div className="section-header">
            <h2 className="section-title">最新文章</h2>
            <a href="/posts/" className="view-all">
              查看全部 <ArrowRightOutlined />
            </a>
          </div>

          <div className="posts-grid">
            {loading ? (
              <div className="loading-text">加载中...</div>
            ) : posts.length === 0 ? (
              <div className="empty-text">暂无文章</div>
            ) : (
              posts.map((post) => (
                <Card
                  key={post.slug}
                  className="post-card"
                  hoverable
                  onClick={() => {
                    window.location.href = `/post/?slug=${encodeURIComponent(post.slug)}`;
                  }}
                >
                  <div className="card-content">
                    <div className="card-header">
                      <Typography.Title level={4} className="card-title">
                        {post.title}
                      </Typography.Title>
                      <time className="card-date">{formatDate(post.createdAt)}</time>
                    </div>

                    {post.summary && (
                      <p className="card-summary">{post.summary}</p>
                    )}

                    <div className="card-footer">
                      {post.category && (
                        <span className="card-category">{post.category}</span>
                      )}
                      {post.tags && post.tags.length > 0 && (
                        <div className="card-tags">
                          {post.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="tag">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
