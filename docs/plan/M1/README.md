# M1：MVP 核心（构建期拉取 + 列表/详情渲染）

## 目标

- 在构建期通过 WebDAV（只读）拉取 `posts/`（及按策略处理 `assets/`），生成索引与静态页面。
- 交付 MVP 核心阅读体验：文章列表、文章详情、TOC/锚点、代码高亮、图片 lazy、链接解析、基础错误态。
- 保证运行时纯静态：不访问 WebDAV、不携带凭证。

## 前置依赖

- M0 决策已定稿（构建触发、`assets/` 策略、SSG 技术栈、basePath）。
- 内容约定可通过校验（slug/Front Matter/命名规则）。

## 工作包清单

- `M1-T1`：WebDAV 只读客户端与配置集中化（见 `docs/plan/README.md`）
- `M1-T2`：构建期抓取与索引生成（见 `docs/plan/README.md`）
- `M1-T3`：Markdown 渲染管线（见 `docs/plan/README.md`）
- `M1-T4`：页面—文章列表（见 `docs/plan/README.md`）
- `M1-T5`：页面—文章详情（见 `docs/plan/README.md`）
- `M1-T6`：资产处理落地（见 `docs/plan/README.md`）

详细拆分与验收口径：`docs/plan/M1/work-packages.md`

## 里程碑退出标准（验收）

- 能从 WebDAV 构建生成静态站点：列表页与详情页可访问且渲染正确。
- 404/空态/加载态可用；渲染失败有明确提示与返回入口。
- 运行时不访问 WebDAV；静态产物与日志不包含凭证或敏感信息。
