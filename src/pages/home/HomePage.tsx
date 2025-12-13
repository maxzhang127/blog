import { Button, Card, Space, Typography } from "antd";
import React from "react";
import { AppShell } from "../../shared/AppShell";

/**
 * Home page.
 */
export function HomePage() {
  return (
    <AppShell activeKey="home">
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <Card>
          <Typography.Title level={2} style={{ marginTop: 0 }}>
            blog
          </Typography.Title>
          <Typography.Paragraph>
            这是一个构建期从 Nextcloud 拉取 Markdown 并生成静态产物的多页面站点骨架。
          </Typography.Paragraph>
          <Button type="primary" href="/posts/">
            查看文章列表
          </Button>
        </Card>
      </Space>
    </AppShell>
  );
}

