# 里程碑与工作计划（PRD -> 工程工作包）

本文档把 `docs/prd.md` 拆解为可交付的里程碑与可直接建工单的工作包（ticket），并在 `docs/plan/M0`、`docs/plan/M1`、`docs/plan/M2` 里提供每个里程碑的落地检查清单。

里程碑文件夹：
- `docs/plan/M0/`：需求澄清与技术底座定稿
- `docs/plan/M1/`：MVP 核心（构建期拉取 + 列表/详情渲染）
- `docs/plan/M2/`：完善（标签/分类/搜索 + 体验与质量）

详细工作包与排期：
- `docs/plan/development-plan.md`
- `docs/plan/M0/work-packages.md`
- `docs/plan/M1/work-packages.md`
- `docs/plan/M2/work-packages.md`

---

## A. PRD 摘要

- 产品目标（MVP）：提供一个只读展示的博客站点（列表、详情、标签/分类、基础搜索），内容源来自 Nextcloud WebDAV，构建期拉取生成静态站点。
- 用户与场景：访客浏览/检索/阅读；内容维护者在 Nextcloud 直接维护 Markdown 与资源文件，更新后触发重新构建发布。
- 关键约束：
  - 运行时为纯静态资源，不依赖自建服务端 API，也不在浏览器侧访问 WebDAV。
  - WebDAV 仅在构建期使用，且只使用 `PROPFIND` 与 `GET`，不执行任何写操作。
  - WebDAV 凭证只存在于构建环境（本地或 CI），不得进入浏览器端产物与日志输出。

## B. 需求清单（按 Must/Should/Could）

Must（MVP 必须具备）
- 内容接入：构建期通过 WebDAV 拉取 `posts/` 下 Markdown；解析 Front Matter 与文件名日期；构建失败时给出明确失败原因（CI/本地输出）。
- 首页/列表：按时间倒序卡片展示；分页；字段缺失不阻塞渲染。
- 详情页：Markdown 渲染；标题锚点与目录 TOC；代码高亮；图片懒加载；站内链接解析；封面图（如存在）。
- 标签/分类：聚合浏览与筛选后可进入详情页。
- 搜索：在元数据字段（标题/摘要/标签/分类）内搜索，提供无结果空态。
- 通用页面：404、空态页、关于页（静态内容）。
- 体验与反馈：列表与详情提供加载态（skeleton/占位）；错误态提示清晰且有返回入口。

Should（提升体验，MVP 内优先）
- 性能：在 50 篇文章以内，列表首屏 < 2s、详情首屏 < 2s（网络正常）。
- 可访问性：标题层级语义正确、可键盘导航、图片具备 `alt` 文本。
- 移动端适配：阅读排版与 TOC 行为在移动端可用。

Could（后续迭代/记录）
- RSS 与 `sitemap.xml`（PRD 已记录为后续迭代）。
- 全文搜索索引（构建期生成）。
- 评论系统、统计系统、暗色模式与主题定制。

## C. 范围边界（In/Out/Non-goals）

In-scope
- 只读博客展示：列表、详情、标签/分类、元数据搜索、关于页、404/空态。
- 构建期拉取与静态化：从 Nextcloud WebDAV 生成静态产物（页面与索引）。

Out-of-scope / Non-goals（本版不做）
- 站内编辑、草稿、发布/撤回、上传附件、内容写入与移动。
- 账号体系与登录（访客侧不需要认证流程）。
- 评论系统与统计系统（仅记录为后续迭代）。

## D. 关键澄清问题（按优先级排序）

P0（阻塞 M1 实现）
1. 构建触发机制：手动触发 / 定时触发 / 内容变更触发，目标更新频率是多少？
2. 资源策略（`assets/`）：构建产物是否需要同步 `assets/` 到站点同源（推荐）？还是允许文章引用 Nextcloud 资源直链（需要可公开访问 URL 的明确规则）？
3. WebDAV 根目录与访问方式：博客根目录的固定路径、是否存在多环境（本地/CI）差异、鉴权方式（App Password）与凭证轮换策略。

P1（影响工程方案与路由）
4. 站点技术栈：Next.js 静态导出（`output: "export"`）或 Vite SSG 等方案，团队偏好与部署环境约束是什么？
5. 路由与兼容：是否需要子路径部署（例如 `/blog/`）？静态资源与路由的 basePath 需求是什么？

P2（不阻塞 MVP，但影响体验与后续工作量）
6. SEO 预期：是否在 MVP 阶段就要求 `sitemap.xml` / RSS 输出？若不要求，计划进入哪个里程碑？

## E. 方案草图（组件/数据流/关键决策）

### 组件与数据流

- 构建期（本地或 CI）
  - 使用 WebDAV 凭证执行 `PROPFIND` 列出 `posts/`（以及按策略处理 `assets/`）。
  - `GET` 拉取每篇 Markdown，解析 Front Matter 与正文，生成结构化索引（建议输出为 `public/content/index.json` 或等价位置）。
  - 生成静态页面产物（列表页、详情页、标签/分类页、搜索页、关于页、404）。
- 运行时（浏览器）
  - 仅加载静态产物与索引文件；不包含 WebDAV 凭证；不直接请求 WebDAV。

### 关键技术决策（需在 M0 定稿）

1. SSG 框架选择
   - 选项 A：Next.js（静态导出）——路由与页面生成机制成熟，适合直接输出静态站点。
   - 选项 B：Vite + React + SSG 方案——构建更轻量，但需额外选型与约束静态路由生成方式。
2. `assets/` 策略
   - 选项 A（推荐）：构建期将 `assets/` 同步到站点同源路径（保证渲染 URL 可访问、避免鉴权与跨域问题）。
   - 选项 B：使用 Nextcloud 可公开访问的直链 URL（需要明确生成规则与权限边界）。
3. Markdown 渲染与安全
   - Markdown 渲染需要支持：TOC、标题锚点、代码高亮、图片 lazy、站内链接解析。
   - 若允许 Markdown 内嵌 HTML，需明确是否启用与安全策略（默认关闭或进行严格 sanitize）。

## F. Epic 列表（含目标与验收）

Epic 1：需求与决策定稿（M0）
- 目标：将 PRD 的“待确认”项收敛为可实现的工程输入，并形成决策记录。
- 验收：P0/P1 问题有明确结论；目录约定、路由规则、资产策略、构建触发方式均已落文档。

Epic 2：工程化与静态构建通路（M0）
- 目标：项目可在本地与 CI 进行一致的构建与静态产物输出。
- 验收：`npm run build` 能产出静态站点；敏感信息不进入产物；基础 lint/test 可运行。

Epic 3：构建期内容抓取与索引生成（M1）
- 目标：从 WebDAV 拉取 `posts/` 并生成稳定的内容索引供页面消费。
- 验收：对 50 篇以内文章可稳定构建；失败时输出明确错误；不依赖运行时 WebDAV。

Epic 4：核心页面与阅读体验（M1）
- 目标：列表与详情页满足 MVP 阅读体验（TOC、锚点、代码高亮、图片与链接）。
- 验收：列表可分页浏览；详情页渲染正确；404/空态/渲染失败提示清晰。

Epic 5：检索与分类浏览 + 体验完善（M2）
- 目标：标签/分类/搜索可用，移动端与可访问性达标，文档与发布流程完善。
- 验收：标签/分类聚合可用；元数据搜索可用；移动端可读；关键非功能指标可验收。

## G. 工作包（可直接建 Jira/Linear/Tapd 的 ticket 列表）

> 约定：每个 ticket 尽量控制在 1–3 天可交付；涉及不确定项时，先落“决策/澄清”ticket 再做实现 ticket。

### M0-T1：澄清问题与决策记录（P0/P1 收敛）

- Objective：将 `docs/prd.md` 的待确认项收敛为可执行的工程输入，并形成可追溯的决策记录。
- Tasks（Checklist）
  - [ ] 确认构建触发方式与目标更新频率（手动/定时/变更触发）。
  - [ ] 确认 `assets/` 策略：同源同步 or Nextcloud 直链，并明确 URL 规则与权限边界。
  - [ ] 确认站点部署形态：根路径或子路径（basePath）部署需求。
  - [ ] 确认 SSG 技术栈（Next.js 静态导出 or Vite SSG）并记录原因。
  - [ ] 输出决策记录（建议新增 `docs/plan/M0/decisions.md` 或在 `docs/plan/M0/README.md` 固化）。
- Acceptance Criteria（可验证）
  - Given PRD 的 P0/P1 问题清单，When 评审完成，Then 每个问题都有明确结论与对应的工程约束（路径/URL/命令/部署形态）。
  - Given 构建与运行时约束，When 检查决策记录，Then 明确写出“凭证仅存在于构建环境、产物不含凭证、仅使用 PROPFIND/GET”。
- Dependencies：产品/运维/内容维护者对 Nextcloud 目录、权限、发布流程的确认。
- Risks：决策迟滞导致实现反复；缓解方式是优先锁定 P0 决策并冻结变更窗口。
- Owner Role：TPM/Tech Lead
- Estimate：S；Confidence：Med

### M0-T2：工程化脚手架与静态构建通路

- Objective：建立可持续迭代的工程底座，并跑通“构建 -> 输出静态产物”的最短路径。
- Tasks（Checklist）
  - [ ] 初始化工程（TypeScript、lint、format、test），补齐 `package.json` 脚本：`dev`/`lint`/`test`/`build`。
  - [ ] 选择并固化静态导出方案（与 M0-T1 决策一致），确保产物可静态部署。
  - [ ] 规划构建期内容生成的落点目录（例如 `public/content/`）与缓存策略（只描述策略，不引入不必要复杂度）。
  - [ ] 明确 `.env.local`/CI secrets 约定，禁止输出包含 token 的 URL/headers 到日志。
- Acceptance Criteria（可验证）
  - Given 新拉起环境，When 执行 `npm install && npm run fetch && npm run build`，Then 生成可部署的静态产物且构建成功。
  - Given 构建日志，When 检查输出，Then 不包含 WebDAV 凭证或敏感 header。
- Dependencies：M0-T1（技术栈/部署形态结论）。
- Risks：静态导出能力与路由需求冲突；缓解方式是在 M0 先验证样例路由的可导出性。
- Owner Role：FE/DevOps
- Estimate：M；Confidence：Med

### M0-T3：内容约定与校验规则（slug、Front Matter、目录结构）

- Objective：把内容输入约束变成可自动校验的规则，避免构建期“隐性坏数据”导致线上不可预期。
- Tasks（Checklist）
  - [ ] 固化目录约定：博客根目录下 `posts/`、`assets/` 的相对位置与访问路径。
  - [ ] 固化文件命名与路由映射：`yyyy-mm-dd--slug.md` 与 Front Matter `slug` 一致性。
  - [ ] 定义校验规则：必填字段缺失、slug 全站唯一、日期解析优先级、非法路径引用（非 `assets/`）等。
  - [ ] 设计校验失败策略：构建失败（阻断发布）并输出可定位到文件的错误信息。
- Acceptance Criteria（可验证）
  - Given 一组 Markdown 输入，When 运行校验，Then 能准确报出缺失字段/slug 冲突/命名不合规并指向具体文件。
  - Given 校验通过的输入，When 构建索引，Then 路由与排序结果稳定可复现。
- Dependencies：PRD 的内容约定；M0-T1 的 `assets/` 策略与 basePath 结论。
- Risks：过严规则阻塞内容发布；缓解方式是规则分级（阻断项 vs 警告项）并写清楚。
- Owner Role：FE/QA
- Estimate：S；Confidence：High

### M1-T1：WebDAV 只读客户端与配置集中化

- Objective：实现构建期可复用的 WebDAV 访问层，严格限定为只读（`PROPFIND`/`GET`），并集中管理 endpoint/path。
- Tasks（Checklist）
  - [ ] 在 `src/lib/webdav/` 下设计模块边界：`config.ts`（baseUrl/根路径/目录约定）、client（请求封装）、types（响应模型）。
  - [ ] 支持 `PROPFIND` 列目录与 `GET` 拉取文件内容，包含超时与重试策略（以构建稳定性为目标）。
  - [ ] 统一错误类型：鉴权失败、不可达、404、解析失败，便于构建期报错定位。
  - [ ] 确保不会引入 `PUT`/`DELETE`/`MOVE`/`COPY` 等写操作路径。
- Acceptance Criteria（可验证）
  - Given WebDAV 配置与凭证，When 执行列表与读取，Then 能成功返回目录条目与 Markdown 内容。
  - Given 无权限或不可达，When 构建期调用，Then 抛出可读错误并能定位到具体路径/原因。
- Dependencies：M0-T1（WebDAV 路径、鉴权方式、日志脱敏约束）。
- Risks：Nextcloud WebDAV 响应差异（XML 字段差异）导致解析脆弱；缓解方式是基于样例响应编写解析与测试用例。
- Owner Role：FE
- Estimate：M；Confidence：Med

### M1-T2：构建期抓取与索引生成（posts 元数据）

- Objective：构建期拉取 `posts/` 下文章并生成索引文件，供静态页面渲染与搜索/聚合使用。
- Tasks（Checklist）
  - [ ] 通过 `PROPFIND` 枚举文章文件（递归策略与分页策略需明确）。
  - [ ] `GET` 拉取 Markdown，解析 Front Matter 与正文摘要（摘要规则需明确）。
  - [ ] 生成结构化索引（建议 JSON）：包含 `title/slug/createdAt/updatedAt/summary/tags/category/cover` 与路由路径。
  - [ ] 与 M0-T3 校验集成：数据不合规时构建失败并输出文件定位信息。
  - [ ] 输出索引到静态可访问位置，并确保产物不包含 WebDAV 凭证或内部路径信息。
- Acceptance Criteria（可验证）
  - Given `posts/` 下 50 篇文章，When 运行构建，Then 索引生成成功且排序符合规则（优先 `createdAt`，否则文件名日期）。
  - Given 输入数据存在 slug 冲突或缺失字段，When 构建，Then 失败并给出明确报错（文件路径 + 规则）。
- Dependencies：M1-T1；M0-T3。
- Risks：构建时间随文章数量线性增长；缓解方式是在 M2 记录并实施缓存/增量策略（按需）。
- Owner Role：FE
- Estimate：M；Confidence：Med

### M1-T3：Markdown 渲染管线（TOC/锚点/高亮/链接/图片）

- Objective：为详情页提供稳定可控的 Markdown 渲染能力，满足 PRD 的阅读体验要求。
- Tasks（Checklist）
  - [ ] 选型并实现 Markdown 渲染：标题锚点、TOC 结构抽取、代码高亮主题、图片 lazy、站内链接解析与 rewrite。
  - [ ] 处理封面图字段 `cover`：相对路径解析到可访问 URL（与 `assets/` 策略一致）。
  - [ ] 明确安全策略：是否允许内嵌 HTML；若允许需启用 sanitize 并配置允许列表。
  - [ ] 为渲染失败提供降级：展示错误提示与返回入口，不白屏。
- Acceptance Criteria（可验证）
  - Given 包含多级标题/代码块/图片/链接的文章，When 渲染详情页，Then TOC 可点击跳转且代码高亮可读。
  - Given 图片加载失败，When 展示页面，Then 显示 `alt` 文本与明确错误反馈（不影响正文阅读）。
- Dependencies：M0-T1（`assets/` 策略与安全策略结论）；M1-T2（索引与文章内容获取）。
- Risks：渲染链路引入 XSS 风险；缓解方式是默认禁用 raw HTML 或启用严格 sanitize。
- Owner Role：FE
- Estimate：M；Confidence：Med

### M1-T4：页面—文章列表（分页/卡片/空态/加载态）

- Objective：实现首页/列表页的核心浏览能力，符合字段缺失不阻塞的要求。
- Tasks（Checklist）
  - [ ] 列表页数据源对接索引文件；按时间倒序渲染卡片（title/summary/cover/tags/category/date）。
  - [ ] 实现分页（规则需明确：页大小、URL 结构）。
  - [ ] 实现加载态与空态：无文章、无结果时文案与返回入口清晰。
- Acceptance Criteria（可验证）
  - Given 索引中存在文章，When 打开首页，Then 可在 2s 内看到首屏列表（50 篇以内，网络正常）。
  - Given 文章缺少 `cover` 或 `summary`，When 渲染卡片，Then 页面布局不破坏且不报错。
- Dependencies：M1-T2（索引生成与字段定义）。
- Risks：分页 URL 与静态导出冲突；缓解方式是在 M0/M1 先验证静态路由生成策略。
- Owner Role：FE
- Estimate：M；Confidence：Med

### M1-T5：页面—文章详情（渲染/封面/404/错误态）

- Objective：实现文章详情页，保证路由、渲染、错误态闭环。
- Tasks（Checklist）
  - [ ] 基于 `slug` 生成静态路由；详情页读取对应文章数据与渲染结果。
  - [ ] 详情页布局：标题、日期、标签/分类、封面图（如有）、正文、TOC（桌面端）。
  - [ ] 404 与错误态：slug 不存在、渲染失败时提供明确提示与返回入口。
- Acceptance Criteria（可验证）
  - Given 任意合法 slug，When 进入详情页，Then 正文渲染正确且 TOC 跳转准确。
  - Given 不存在的 slug，When 访问详情页，Then 返回 404 页面且提供返回首页入口。
- Dependencies：M1-T2、M1-T3。
- Risks：TOC 与锚点在不同浏览器表现不一致；缓解方式是引入跨浏览器手动验收清单（Chrome/Edge/Safari/Firefox）。
- Owner Role：FE/QA
- Estimate：M；Confidence：Med

### M1-T6：资产处理落地（同源同步 or 直链）

- Objective：让 Markdown 中 `assets/...` 引用在站点运行时可访问，并与 M0 决策保持一致。
- Tasks（Checklist）
  - [ ] 若采用同源同步：构建期拉取 `assets/` 并输出到静态产物目录，保持路径一致性。
  - [ ] 若采用直链：实现从相对路径到可公开访问 URL 的映射规则，并验证权限与跨域。
  - [ ] 在 Markdown 渲染中统一应用资源 URL 解析（图片/附件/封面）。
- Acceptance Criteria（可验证）
  - Given Markdown 引用 `assets/...`，When 构建并部署静态站点，Then 图片与附件 URL 在浏览器中可访问。
  - Given 资源缺失，When 打开页面，Then 显示清晰的降级提示，不导致页面白屏。
- Dependencies：M0-T1（资源策略定稿）；M1-T3（渲染链路）；M1-T2（构建期抓取）。
- Risks：资源量大导致构建时间/产物体积增长；缓解方式是按目录增量同步与缓存（M2 处理）。
- Owner Role：FE/DevOps
- Estimate：M；Confidence：Med

### M2-T1：标签/分类聚合页（浏览与筛选）

- Objective：提供标签与分类的聚合浏览能力，并与列表/详情形成闭环导航。
- Tasks（Checklist）
  - [ ] 从索引生成 tags 与 categories 视图模型（去重、排序规则明确）。
  - [ ] 实现标签列表页与标签详情页（该 tag 下文章列表）。
  - [ ] 实现分类列表页与分类详情页（该分类下文章列表）。
  - [ ] 统一空态与返回入口。
- Acceptance Criteria（可验证）
  - Given 任意 tag/category，When 进入聚合页，Then 展示对应文章列表并可跳转详情页。
  - Given 无 tag/category 数据，When 访问聚合页，Then 呈现清晰空态且不报错。
- Dependencies：M1-T2（索引字段 `tags/category`）。
- Risks：内容不规范（大小写、空数组）导致聚合混乱；缓解方式是索引生成阶段做规范化（trim、去空、大小写策略）。
- Owner Role：FE
- Estimate：M；Confidence：Med

### M2-T2：元数据搜索（title/summary/tags/category）

- Objective：实现 PRD 约束内的搜索能力（不做全文搜索），并提供可用的交互与空态。
- Tasks（Checklist）
  - [ ] 搜索数据源：索引字段集合；明确匹配规则（大小写、分词策略、AND/OR 规则）。
  - [ ] 实现搜索输入与结果列表页；结果点击进入详情页。
  - [ ] 无结果空态与清空/返回入口。
- Acceptance Criteria（可验证）
  - Given 关键字命中标题或标签，When 搜索，Then 返回匹配文章且结果可跳转详情。
  - Given 无匹配，When 搜索，Then 展示无结果空态与返回入口。
- Dependencies：M1-T2（索引可在运行时访问）。
- Risks：在文章数增长时客户端筛选性能下降；缓解方式是构建期生成轻量搜索索引并做前缀/倒排（后续迭代）。
- Owner Role：FE
- Estimate：S；Confidence：High

### M2-T3：移动端适配与可访问性验收

- Objective：让核心页面在移动端阅读与交互可用，并满足基本可访问性要求。
- Tasks（Checklist）
  - [ ] 响应式布局：列表卡片、详情正文排版、导航在移动端可用。
  - [ ] TOC 行为：桌面端侧边展示；移动端采用折叠/抽屉等不遮挡阅读的形式（实现方案需与实际 UI 一致）。
  - [ ] 可访问性检查：语义化标题层级、键盘可达、可见焦点样式、图片 `alt`、空态与错误态文案明确。
- Acceptance Criteria（可验证）
  - Given 移动端视口，When 浏览列表与详情，Then 不出现横向溢出且正文可读。
  - Given 键盘导航，When 遍历交互元素，Then 可见焦点且可操作完成核心路径（列表->详情->返回）。
- Dependencies：M1 页面完成；样式体系确定。
- Risks：移动端 TOC 与长文滚动冲突；缓解方式是约束 TOC 的默认展开与交互手势。
- Owner Role：FE/QA
- Estimate：M；Confidence：Med

### M2-T4：构建性能与稳定性验收（含缓存策略落地）

- Objective：在 PRD 约束下保证构建稳定、可复现，并对 50 篇文章规模满足性能目标。
- Tasks（Checklist）
  - [ ] 定义并记录构建基线指标：抓取耗时、索引生成耗时、静态导出耗时、产物体积。
  - [ ] 引入最小必要的缓存策略（例如基于 ETag/mtime 的跳过下载），避免重复拉取全部内容。
  - [ ] 在 CI 中固定 Node 版本与依赖锁，确保构建可复现。
- Acceptance Criteria（可验证）
  - Given 50 篇文章规模，When 构建，Then 能在可接受时间内完成且失败率可控（指标需在 M0-T1 确认阈值）。
  - Given 内容未变更，When 再次构建，Then 拉取与构建耗时显著下降（缓存命中）。
- Dependencies：M1-T2/M1-T6；CI 环境配置。
- Risks：Nextcloud 响应慢导致构建波动；缓解方式是超时/重试与缓存结合，并在失败时保留上一版本产物。
- Owner Role：FE/DevOps
- Estimate：M；Confidence：Low

### M2-T5：文档与发布流程固化（README/部署/配置）

- Objective：让新成员可按文档复现构建与发布流程，减少隐性知识。
- Tasks（Checklist）
  - [ ] 更新 `README.md`：本地开发、构建、部署形态（静态托管）、必要环境变量说明（使用脱敏示例）。
  - [ ] 补充“内容约定”与“故障排查”文档入口（指向 `docs/prd.md` 与本计划）。
  - [ ] 明确 CI secrets 配置项与轮换策略（不写入仓库）。
- Acceptance Criteria（可验证）
  - Given 新环境，When 按 README 执行，Then 可成功完成本地构建并得到可部署产物。
  - Given CI 配置，When 检查仓库内容，Then 不存在任何凭证明文与敏感 URL 输出。
- Dependencies：M0/M1 的方案定稿与实现落地。
- Risks：文档与实现偏离；缓解方式是将文档作为发布前检查项（release checklist）。
- Owner Role：FE/DevOps
- Estimate：S；Confidence：High

## H. 交付里程碑与上线计划

### 里程碑定义与退出标准

M0（对齐与底座）
- 输出：P0/P1 决策记录定稿；工程脚手架可构建；内容约定与校验规则明确。
- 退出标准：M0-T1~T3 完成，且能在无真实 WebDAV 的情况下跑通基础构建流程（可使用本地 fixture）。

M1（MVP 核心）
- 输出：构建期 WebDAV 拉取与索引生成；文章列表/详情可静态导出；资产策略落地；404/空态/加载态可用。
- 退出标准：M1-T1~T6 完成，且“运行时不访问 WebDAV、产物不含凭证”通过检查。

M2（完善与验收）
- 输出：标签/分类/搜索完成；移动端与可访问性达标；构建性能与稳定性达标；文档完善。
- 退出标准：M2-T1~T5 完成，并完成跨浏览器手动验收（Chrome/Edge/Safari/Firefox 最新两个版本）。

### 上线/发布策略

- 构建与发布：仅在 CI 构建环境注入 WebDAV 凭证，生成静态产物后发布到静态托管（如对象存储/CDN）。
- 回滚：发布以版本化目录或原子替换方式进行，构建失败不影响已发布版本可访问性。
- 配置管理：`.env.local` 仅本地使用；CI secrets 通过平台配置；仓库不存放任何凭证。

### QA 计划提示

- 单元测试：Front Matter 解析、slug 校验、索引生成、URL rewrite。
- 集成测试：基于 fixture 模拟 WebDAV 响应（避免真实打点），验证构建产物与关键页面渲染。
- 手动验收：核心路径（列表->详情->TOC 跳转->返回）、标签/分类、搜索、移动端、图片失败降级。

## I. 风险清单与缓解策略

- 凭证失效/权限变更导致构建失败：在 M0 明确轮换策略；CI 失败告警；保留上一版本产物。
- 资源不可访问（`assets/` 直链权限/CORS）：优先采用同源同步；若直链则明确公开 URL 与权限边界。
- 内容质量不一致（slug 冲突、字段缺失）：以 M0-T3 校验阻断发布；提供可定位错误信息。
- Markdown 安全风险（XSS）：默认禁用 raw HTML 或启用严格 sanitize；限制允许标签与属性。
- 构建时间增长与波动：缓存/增量策略（M2-T4）；限制并行与超时重试；记录基线指标便于回归。
