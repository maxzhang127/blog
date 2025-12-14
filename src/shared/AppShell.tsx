import { Layout } from "antd";
import type { PropsWithChildren } from "react";
import React from "react";
import { Footer } from "./Footer";
import "./AppShell.scss";

/**
 * Shared layout wrapper for multi-page entries.
 * @param props
 */
export function AppShell(props: PropsWithChildren<{ activeKey: "home" | "posts" }>) {
  return (
    <Layout style={{ minHeight: "100vh", background: "#ffffff" }}>
      <Layout.Header className="app-header">
        <div className="header-container">
          <a href="/" className="logo">
            <div className="logo-icon">
              <span className="logo-text">{"</>"}</span>
            </div>
            <span className="logo-name">BLOG</span>
          </a>

          <nav className="nav">
            <a
              href="/"
              className={`nav-link ${props.activeKey === "home" ? "active" : ""}`}
            >
              首页
            </a>
            <a
              href="/posts/"
              className={`nav-link ${props.activeKey === "posts" ? "active" : ""}`}
            >
              文章
            </a>
          </nav>
        </div>
      </Layout.Header>

      <Layout.Content className="app-content">
        <div className="content-wrapper">{props.children}</div>
      </Layout.Content>

      <Layout.Footer style={{ padding: 0, background: "transparent" }}>
        <Footer />
      </Layout.Footer>
    </Layout>
  );
}
