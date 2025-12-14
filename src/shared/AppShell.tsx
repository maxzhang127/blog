import { Layout, Menu, Typography } from "antd";
import type { MenuProps } from "antd";
import type { PropsWithChildren } from "react";
import React from "react";

/**
 * Shared layout wrapper for multi-page entries.
 * @param props
 */
export function AppShell(props: PropsWithChildren<{ activeKey: "home" | "posts" }>) {
  const items: MenuProps["items"] = [
    { key: "home", label: <a href="/">首页</a> },
    { key: "posts", label: <a href="/posts/">文章</a> },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Layout.Header style={{ display: "flex", alignItems: "center" }}>
        <Typography.Title level={4} style={{ color: "#fff", margin: "0 24px 0 0" }}>
          blog
        </Typography.Title>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[props.activeKey]}
          items={items}
          style={{ flex: 1 }}
        />
      </Layout.Header>
      <Layout.Content>
        <div className="content">{props.children}</div>
      </Layout.Content>
      <Layout.Footer style={{ textAlign: "center" }}>blog</Layout.Footer>
    </Layout>
  );
}
