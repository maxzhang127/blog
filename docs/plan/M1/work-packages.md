# M1 工作包（MVP 核心）

本文件将 `docs/plan/M1/README.md` 里的范围拆解为可直接建工单的工作包，目标是以 1–3 个工作日为粒度推进。

---

## Epic A：WebDAV 只读访问层（构建期）

### M1-T1-01：WebDAV 配置集中化（`src/lib/webdav/config.ts`）

- Objective：集中管理 WebDAV endpoint、博客根路径与目录约定，并提供统一的 env 映射入口。
- Tasks
  - [ ] 定义 `baseUrl`、`blogRootPath`、`postsPath`、`assetsPath` 的配置模型。
  - [ ] 定义 env 变量清单（仅构建期可用），并明确默认值与必填项。
  - [ ] 定义“禁止在浏览器端读取 WebDAV 配置”的工程约束（构建期专用）。
- Acceptance Criteria
  - Given 构建期环境变量，When 读取 config，Then 能得到完整路径与目录约定且缺失项会明确报错。
- Dependencies：M0-T1-03（技术栈与构建形态）；M0-T1-04（安全策略）。
- Risks：路径拼接不一致导致线上资源 404；缓解为集中化并在单测中覆盖典型组合。
- Owner Role：FE
- Estimate：S；Confidence：High

### M1-T1-02：HTTP 请求封装（只读、超时、重试、脱敏）

- Objective：实现 WebDAV 的请求层，支持 `PROPFIND`/`GET`，并保证日志脱敏与错误可定位。
- Tasks
  - [ ] 实现 Basic Auth（或 M0 决策的鉴权方式），只在构建期注入。
  - [ ] 实现超时、重试与并发控制（以构建稳定性为目标）。
  - [ ] 实现日志脱敏：禁止输出 Authorization、Cookie 等敏感 header 值。
  - [ ] 约束 API：不暴露 `PUT/DELETE/MOVE/COPY` 等写方法入口。
- Acceptance Criteria
  - Given 错误凭证或不可达 URL，When 发起请求，Then 错误类型与路径信息可定位且日志不含敏感信息。
- Dependencies：M0-T1-04。
- Risks：重试导致构建时间拉长；缓解为限制最大重试次数与退避策略。
- Owner Role：FE
- Estimate：M；Confidence：Med

### M1-T1-03：`PROPFIND` XML 解析（目录条目模型）

- Objective：将 Nextcloud WebDAV 的 `PROPFIND` 响应解析为稳定的目录条目列表。
- Tasks
  - [ ] 定义目录条目模型：路径、类型（file/collection）、大小、mtime、etag（如有）。
  - [ ] 基于样例 XML 实现解析，并覆盖字段缺失/命名差异场景。
  - [ ] 为解析添加单元测试（fixture XML），避免联调依赖真实 WebDAV。
- Acceptance Criteria
  - Given 一份 `PROPFIND` XML fixture，When 解析，Then 能得到正确的条目数量、路径与类型，并在字段缺失时行为稳定。
- Dependencies：M1-T1-02（HTTP 层）。
- Risks：XML 字段差异导致解析脆弱；缓解为以“必须字段最小集”为核心并对可选字段做容错。
- Owner Role：FE
- Estimate：M；Confidence：Med

### M1-T1-04：`GET` 文件下载（Markdown/二进制资源）

- Objective：支持下载 Markdown 与二进制资源（若选择同源同步），并处理编码与错误类型。
- Tasks
  - [ ] 实现 Markdown 下载（文本编码处理）与二进制下载（buffer/stream）。
  - [ ] 统一 404/403/5xx 的错误映射与报错格式（必须包含远端路径）。
  - [ ] 添加单元测试：下载成功、404、权限不足、超时。
- Acceptance Criteria
  - Given fixture server 或 stub，When 下载文件，Then 能按内容类型返回正确数据，并在错误时返回可定位的错误对象。
- Dependencies：M1-T1-02。
- Risks：二进制写盘策略与静态产物目录冲突；缓解为在 M0 明确产物目录，并在实现中集中写盘入口。
- Owner Role：FE
- Estimate：M；Confidence：Med

### M1-T1-05：递归枚举 `posts/`（过滤与排序输入）

- Objective：在构建期稳定枚举 `posts/` 下的 Markdown 文件列表，并产出可预测顺序供后续抓取。
- Tasks
  - [ ] 定义递归策略（深度、是否跟随子目录）与过滤规则（只接受 `.md`）。
  - [ ] 支持从 WebDAV 目录条目生成待抓取列表（含远端路径）。
  - [ ] 添加测试：空目录、混合文件类型、嵌套目录。
- Acceptance Criteria
  - Given 目录条目输入，When 生成抓取列表，Then 仅包含 `.md` 且顺序稳定（按路径或按时间规则固定）。
- Dependencies：M1-T1-03。
- Risks：目录很大导致 `PROPFIND` 成本高；缓解为限制范围与记录后续增量策略（M2-T4）。
- Owner Role：FE
- Estimate：S；Confidence：Med

### M1-T1-06：错误类型归一与构建期报错格式

- Objective：为构建链路提供统一错误结构，确保 CI/本地失败可快速定位。
- Tasks
  - [ ] 定义错误分类：AuthError、NotFoundError、NetworkError、ParseError、ValidationError。
  - [ ] 统一输出格式：错误类型 + 远端路径 + 本地目标（如有）+ 原因。
  - [ ] 在构建入口捕获并汇总错误，输出清晰摘要（禁止输出敏感信息）。
- Acceptance Criteria
  - Given 任意失败场景，When 构建失败，Then 控制台输出包含错误类型与路径定位信息且不包含敏感信息。
- Dependencies：M0-T1-04；M1-T1-02。
- Risks：错误被吞导致 CI 假绿；缓解为对阻断错误直接退出非 0。
- Owner Role：FE/DevOps
- Estimate：S；Confidence：High

## Epic B：索引生成（posts 元数据）

### M1-T2-01：文件名解析（`yyyy-mm-dd--slug.md`）与日期回退规则

- Objective：从文件名提取日期与 slug，并与 Front Matter 做一致性校验。
- Tasks
  - [ ] 实现文件名解析：日期、slug、扩展名校验。
  - [ ] 定义排序日期优先级：优先 `createdAt`，否则使用文件名日期。
  - [ ] 定义 slug 一致性规则：Front Matter `slug` 必须与文件名 slug 一致。
- Acceptance Criteria
  - Given 一组文件名，When 解析，Then 能得到日期与 slug；不合规命名会产生可定位错误。
- Dependencies：M0-T3-01（内容约定定稿）。
- Risks：历史内容不符合命名规则；缓解为提供迁移指引或临时兼容策略（需明确写入决策记录）。
- Owner Role：FE/QA
- Estimate：S；Confidence：High

### M1-T2-02：Front Matter 解析与必填字段校验

- Objective：解析 Markdown 的 Front Matter，校验必填字段并产出结构化元数据。
- Tasks
  - [ ] 解析字段：`title/slug/createdAt`（必填）与 `updatedAt/summary/tags/category/cover`（选填）。
  - [ ] 校验字段类型与格式：ISO 日期、`tags` 为数组、`cover` 为相对路径。
  - [ ] 对缺失选填字段实现兼容（不阻断渲染）。
- Acceptance Criteria
  - Given 一篇 Markdown，When 解析，Then 必填缺失会阻断并指出文件；选填缺失不阻断且输出为空值策略明确。
- Dependencies：M0-T3-02（阻断/警告分级）。
- Risks：Front Matter 格式不一致；缓解为在校验中提供具体修复建议（字段名与期望类型）。
- Owner Role：FE
- Estimate：M；Confidence：Med

### M1-T2-03：slug 全站唯一性检查（阻断项）

- Objective：保证详情页路由唯一，避免覆盖与不可预期跳转。
- Tasks
  - [ ] 在索引生成阶段建立 slug 集合并检测重复。
  - [ ] 发生冲突时输出冲突文件列表与 slug 值，构建退出非 0。
- Acceptance Criteria
  - Given 两篇文章 slug 相同，When 构建索引，Then 构建失败并列出冲突文件路径。
- Dependencies：M1-T2-01；M1-T2-02。
- Risks：内容维护者不易发现冲突；缓解为在错误信息中给出“推荐改名策略”与示例。
- Owner Role：FE/QA
- Estimate：S；Confidence：High

### M1-T2-04：摘要生成规则（summary fallback）

- Objective：在缺少 Front Matter `summary` 时生成稳定摘要，供列表与搜索使用。
- Tasks
  - [ ] 定义摘要优先级：优先使用 `summary`，否则从正文提取前 N 字（去掉标题/代码块的规则需明确）。
  - [ ] 定义长度与截断规则（字符数与省略号规则固定）。
  - [ ] 添加测试：有 summary/无 summary、多语言字符、含代码块。
- Acceptance Criteria
  - Given 不同 Markdown 输入，When 生成摘要，Then 输出稳定且不会包含明显不应出现在摘要中的内容（如大量代码块）。
- Dependencies：M1-T2-02。
- Risks：摘要提取规则影响搜索质量；缓解为规则固定并把全文搜索作为后续迭代（PRD 记录）。
- Owner Role：FE
- Estimate：S；Confidence：Med

### M1-T2-05：索引产物格式（`index.json`）与确定性输出

- Objective：生成运行时可消费的索引文件，并保证输出确定性（可复现、便于缓存与 diff）。
- Tasks
  - [ ] 定义索引 schema（字段、排序、分页所需字段）。
  - [ ] 固定排序：按日期倒序，其次按 slug（或路径）稳定排序。
  - [ ] 固定序列化：字段顺序、时间格式、空值策略。
- Acceptance Criteria
  - Given 内容不变，When 连续构建两次，Then `index.json` 内容一致（字节级一致或可解释一致性标准）。
- Dependencies：M1-T2-01~04。
- Risks：非确定性输出导致缓存失效；缓解为在生成器中强制排序与稳定序列化。
- Owner Role：FE
- Estimate：S；Confidence：High

### M1-T2-06：索引生成入口脚本（构建期执行）

- Objective：把“抓取 -> 解析 -> 校验 -> 输出索引”的流程接入构建命令，作为发布门禁。
- Tasks
  - [ ] 新增构建期脚本入口（例如 `npm run build:content`），明确输入与输出路径。
  - [ ] 将入口脚本接入 `npm run build` 的前置步骤（或 CI pipeline），保证构建失败即阻断发布。
  - [ ] 支持 `DRY_RUN`/fixture 模式，便于不连接真实 WebDAV 的离线回归。
- Acceptance Criteria
  - Given 任意构建环境，When 执行构建，Then 会先生成索引并在失败时阻断；fixture 模式不依赖真实 WebDAV。
- Dependencies：M0-T2-03（CI）；M0-T3-03（fixture）。
- Risks：构建脚本与 SSG 构建顺序不一致；缓解为将顺序写入脚本与文档。
- Owner Role：FE/DevOps
- Estimate：M；Confidence：Med

### M1-T2-07：WebDAV 响应 stub 与集成测试（不打真实端点）

- Objective：用可控的 stub/fixture 验证抓取与索引生成的集成行为，避免测试依赖真实 Nextcloud。
- Tasks
  - [ ] 提供 `PROPFIND`/`GET` 的 stub 响应 fixture（XML + Markdown + 资源）。
  - [ ] 编写集成测试：从 stub 生成索引并断言输出 schema、排序、错误处理。
  - [ ] 覆盖错误场景：鉴权失败、404、解析失败、slug 冲突。
- Acceptance Criteria
  - Given stub server，When 运行测试，Then 不访问真实网络且能覆盖成功/失败分支。
- Dependencies：测试框架选型（Vitest/Jest）与项目脚手架（M0）。
- Risks：fixture 维护成本；缓解为最小代表集并把 schema 变更纳入测试回归。
- Owner Role：FE/QA
- Estimate：M；Confidence：Med

### M1-T2-08：构建期产物审计（敏感信息扫描）

- Objective：在 CI 中增加“敏感信息不进入产物”的硬门禁。
- Tasks
  - [ ] 明确需要扫描的目录（静态产物、索引文件、日志输出）。
  - [ ] 添加扫描规则：env 变量值、Authorization 形态、Nextcloud 用户名/路径模式（按需）。
  - [ ] 在发现命中时阻断构建并输出命中位置（禁止输出命中内容原文）。
- Acceptance Criteria
  - Given 任意构建产物，When 执行审计，Then 未命中敏感规则；命中时构建失败且可定位到文件路径。
- Dependencies：M0-T1-04（安全策略）。
- Risks：误报导致阻断；缓解为规则白名单与逐步收紧策略。
- Owner Role：DevOps/FE
- Estimate：S；Confidence：Med

## Epic C：Markdown 渲染能力（详情页核心体验）

### M1-T3-01：Markdown 基础渲染（标题锚点）

- Objective：实现 Markdown -> HTML 的渲染通路，并为标题生成稳定锚点 id。
- Tasks
  - [ ] 选型渲染链路（remark/rehype 或等价方案），输出 HTML/React 结构。
  - [ ] 实现标题锚点生成规则（稳定、可复现、避免冲突）。
  - [ ] 为渲染失败提供错误边界与降级输出。
- Acceptance Criteria
  - Given 含多级标题的 Markdown，When 渲染，Then 标题具备稳定锚点且可通过 `#anchor` 定位。
- Dependencies：M0-T1-03（框架/渲染方式）。
- Risks：锚点生成规则与历史文章不兼容；缓解为在 M0 通过 fixture 固化规则并写入文档。
- Owner Role：FE
- Estimate：M；Confidence：Med

### M1-T3-02：TOC 生成与渲染（结构抽取）

- Objective：从 Markdown 渲染结果抽取 TOC 结构，并在详情页可用。
- Tasks
  - [ ] 定义 TOC 数据结构：层级、标题文本、锚点。
  - [ ] 从 AST 或渲染阶段抽取 TOC，并保证与锚点一致。
  - [ ] 实现 TOC 组件：点击跳转、当前章节高亮（如实现需定义规则）。
- Acceptance Criteria
  - Given 含多级标题的文章，When 展示详情页，Then TOC 可点击跳转到对应标题位置。
- Dependencies：M1-T3-01。
- Risks：滚动高亮跨浏览器差异；缓解为先实现点击跳转，滚动高亮作为可选增强。
- Owner Role：FE
- Estimate：M；Confidence：Med

### M1-T3-03：代码高亮（主题与样式）

- Objective：为代码块提供可读的高亮样式，满足 PRD 阅读体验要求。
- Tasks
  - [ ] 选型高亮方案并接入渲染链路。
  - [ ] 引入高亮样式并确保与整体排版一致。
  - [ ] 覆盖无语言标注代码块的 fallback 行为。
- Acceptance Criteria
  - Given 含代码块的文章，When 渲染，Then 代码块具备稳定高亮样式且可读。
- Dependencies：M1-T3-01。
- Risks：高亮库体积影响性能；缓解为选择轻量方案并按需加载（与框架能力一致）。
- Owner Role：FE
- Estimate：S；Confidence：Med

### M1-T3-04：链接解析与 rewrite（站内链接/资源链接）

- Objective：将 Markdown 内相对链接解析为正确的站内路由与资源 URL。
- Tasks
  - [ ] 定义站内链接规则：指向文章的相对链接如何映射到 `slug` 路由。
  - [ ] 定义资源链接规则：`assets/...` 如何映射到运行时可访问 URL（与 M0 决策一致）。
  - [ ] 覆盖边界：外链保持原样、非法路径阻断或降级提示（规则需明确）。
- Acceptance Criteria
  - Given Markdown 中的图片/附件/文章链接，When 渲染，Then 链接均指向可访问的 URL（站内跳转或资源访问）。
- Dependencies：M0-T1-02（`assets/` 策略）；M1-T2-\*（slug/索引）。
- Risks：链接规则不一致导致 404；缓解为在 fixture 中覆盖典型链接并加回归测试。
- Owner Role：FE
- Estimate：M；Confidence：Med

### M1-T3-05：图片 lazy 与加载失败降级

- Objective：实现图片懒加载，并在图片失败时展示 `alt` 与明确提示，不影响正文阅读。
- Tasks
  - [ ] 为图片渲染增加 lazy 策略（属性或组件实现，按框架选择）。
  - [ ] 加载失败时降级展示：`alt` 文本 + 错误提示样式。
  - [ ] 添加组件测试：成功/失败渲染分支。
- Acceptance Criteria
  - Given 图片资源 404，When 展示详情页，Then 图片区域展示 `alt` 与提示文案，正文不白屏。
- Dependencies：M1-T3-01；M1-T3-04。
- Risks：图片组件行为在不同浏览器差异；缓解为跨浏览器手动验收清单（M2-T3）。
- Owner Role：FE/QA
- Estimate：S；Confidence：Med

### M1-T3-06：Markdown 安全策略（raw HTML 与 sanitize）

- Objective：明确并实现 Markdown 安全策略，降低 XSS 风险。
- Tasks
  - [ ] 决策：是否允许 raw HTML（默认禁用）。
  - [ ] 若允许：启用 sanitize 并配置允许标签/属性白名单。
  - [ ] 添加安全回归测试：脚本注入、事件属性注入等。
- Acceptance Criteria
  - Given 含潜在恶意内容的 Markdown，When 渲染，Then 不会执行脚本且输出符合安全策略。
- Dependencies：M0-T1-04（安全策略）。
- Risks：过度 sanitize 影响展示；缓解为白名单最小集并提供可配置项（构建期）。
- Owner Role：FE/QA
- Estimate：M；Confidence：Med

## Epic D：页面实现（列表/详情/通用页面）

### M1-T4-01：列表页数据接入（从索引读取）

- Objective：列表页读取索引并按时间倒序展示文章条目。
- Tasks
  - [ ] 列表页读取索引产物（JSON）并渲染。
  - [ ] 处理字段缺失：无 `cover`/`summary` 不阻断且布局稳定。
  - [ ] 增加加载态与错误态（索引缺失/解析失败）。
- Acceptance Criteria
  - Given 索引可访问，When 打开首页，Then 展示倒序列表且在 50 篇文章以内、网络正常时首屏 2s 内可见文章列表；索引不可用时展示清晰错误态与返回入口。
- Dependencies：M1-T2-05（索引产物格式）。
- Risks：索引体积影响首屏；缓解为字段精简并按需拆分（后续迭代）。
- Owner Role：FE
- Estimate：M；Confidence：Med

### M1-T4-02：文章卡片组件（字段映射与样式）

- Objective：实现列表卡片展示，包含标题、摘要、封面、标签/分类、日期等信息（存在则展示）。
- Tasks
  - [ ] 设计卡片组件 props（与索引字段一致）。
  - [ ] 显示逻辑：可选字段缺失时不占位或采用统一空策略。
  - [ ] 添加组件测试：字段缺失、超长标题/摘要截断。
- Acceptance Criteria
  - Given 不同字段组合的文章数据，When 渲染卡片，Then 布局稳定且不报错。
- Dependencies：M1-T2-05。
- Risks：样式调整频繁；缓解为组件化并与排版规范同步（M2 统一验收）。
- Owner Role：FE
- Estimate：S；Confidence：High

### M1-T4-03：分页策略与路由生成

- Objective：实现分页并确保静态导出下可访问（URL 结构固定）。
- Tasks
  - [ ] 定义分页 URL：例如 `/page/2` 或 `/?page=2`（需与静态导出能力匹配）。
  - [ ] 生成分页路由与静态页面（按框架实现）。
  - [ ] 增加分页组件与边界：第一页/最后一页/越界页。
- Acceptance Criteria
  - Given N 篇文章与页大小 P，When 访问分页 URL，Then 列表展示正确范围且越界返回 404 或空态（规则固定）。
- Dependencies：M0-T1-03（路由/静态导出约束）。
- Risks：分页 URL 与静态托管不兼容；缓解为在 M0-T2-02 做样例验证并冻结策略。
- Owner Role：FE
- Estimate：M；Confidence：Med

### M1-T4-04：列表页空态与 skeleton（加载体验）

- Objective：实现列表页加载态与空态，避免白屏与信息缺失。
- Tasks
  - [ ] 实现 skeleton（或占位）加载态。
  - [ ] 实现空态：无文章、无结果（供搜索/筛选复用）。
  - [ ] 文案与返回入口固定（首页/上一页）。
- Acceptance Criteria
  - Given 索引为空或加载失败，When 打开列表页，Then 展示明确空态/错误态且提供返回入口。
- Dependencies：M1-T4-01。
- Risks：不同页面空态风格不一致；缓解为抽象通用 EmptyState 组件。
- Owner Role：FE
- Estimate：S；Confidence：High

### M1-T4-05：全站导航与基础页面框架（Home/Tags/Categories/About）

- Objective：实现基础导航骨架与 About 页面入口，为 M2 的标签/分类补齐信息架构。
- Tasks
  - [ ] 实现顶部导航：主页/标签/分类/关于。
  - [ ] 实现 About 静态页面（内容占位由产品提供）。
  - [ ] 统一布局容器与基础排版（标题层级与语义）。
- Acceptance Criteria
  - Given 任意页面，When 使用导航跳转，Then 路由可用且布局一致；About 页面可访问。
- Dependencies：M0-T1-03（路由/静态导出）。
- Risks：导航结构与最终 IA 不一致；缓解为按 PRD 固定 4 个入口并在 M2 扩展内容。
- Owner Role：FE
- Estimate：S；Confidence：Med

### M1-T5-01：详情页静态路由生成（按 slug）

- Objective：基于 slug 生成详情页静态路由，保证全站唯一与可访问。
- Tasks
  - [ ] 从索引获取 slug 列表并生成静态页面。
  - [ ] 对不存在 slug 的访问返回 404（静态托管策略需与框架一致）。
  - [ ] 增加路由生成测试（基于 fixture 索引）。
- Acceptance Criteria
  - Given 索引中存在的 slug，When 构建静态站点，Then 对应详情页被生成并可访问。
- Dependencies：M1-T2-05（索引稳定）；M1-T2-03（slug 唯一）。
- Risks：slug 路由与 basePath 冲突；缓解为在 M0 冻结 basePath 并写入 config。
- Owner Role：FE
- Estimate：M；Confidence：Med

### M1-T5-02：详情页布局与渲染集成（封面/元信息/正文/TOC）

- Objective：实现详情页 UI，集成 Markdown 渲染与 TOC，满足阅读体验要求。
- Tasks
  - [ ] 详情页展示：标题、日期、标签/分类、封面（如有）。
  - [ ] 集成 Markdown 渲染输出与 TOC 组件（桌面端侧边或等价布局）。
  - [ ] 处理渲染失败：展示错误态与返回入口。
- Acceptance Criteria
  - Given 一篇含封面/标签/代码块的文章，When 打开详情页，Then 展示完整且 TOC 可跳转，并在网络正常时首屏 2s 内可见正文主体；错误分支不白屏。
- Dependencies：M1-T3-\*；M1-T6-03（资源 URL 解析）。
- Risks：排版与代码块样式冲突；缓解为在 fixture 中覆盖典型内容并回归测试。
- Owner Role：FE
- Estimate：M；Confidence：Med

### M1-T5-03：404 与错误态页面（全站一致）

- Objective：实现全站 404 与通用错误态页面，满足 PRD “明确提示与返回入口”。
- Tasks
  - [ ] 实现 404 页面：包含返回首页入口。
  - [ ] 实现通用错误页/错误块：用于索引加载失败、渲染失败等。
  - [ ] 文案与样式统一（可复用组件）。
- Acceptance Criteria
  - Given 不存在的路径或 slug，When 访问，Then 展示 404 且返回入口可用。
- Dependencies：框架路由与静态托管行为（M0 决策）。
- Risks：静态托管下 404 路由行为差异；缓解为在部署环境做一次端到端验收并记录配置。
- Owner Role：FE/QA
- Estimate：S；Confidence：Med

## Epic E：资源处理（`assets/`）

### M1-T6-01：同源同步方案（构建期拉取 `assets/` 到产物）

- Objective：在构建期同步 `assets/` 到静态产物目录，保证运行时同源可访问。
- Tasks
  - [ ] 枚举 `assets/` 目录并下载到产物目录（保持相对路径一致）。
  - [ ] 处理增量：基于 etag/mtime 跳过未变更资源（若在 M1 实施需明确策略）。
  - [ ] 对缺失资源输出警告或阻断（按 M0 决策）。
- Acceptance Criteria
  - Given Markdown 引用 `assets/...`，When 构建完成，Then 对应资源在产物中存在且 URL 可访问。
- Dependencies：M0-T1-02（选择同源同步）。
- Risks：资源量大导致构建耗时与体积增长；缓解为限定范围并在 M2 做缓存/增量优化。
- Owner Role：FE/DevOps
- Estimate：M；Confidence：Med

### M1-T6-02：直链方案（将 `assets/...` rewrite 为 Nextcloud 公网 URL）

- Objective：将 `assets/...` 引用映射为可公开访问的 Nextcloud 直链 URL（不要求同源资源）。
- Tasks
  - [ ] 明确 URL 生成规则与权限边界（必须在 M0 决策中冻结）。
  - [ ] 在渲染阶段将相对路径 rewrite 为直链 URL。
  - [ ] 验证浏览器访问不需要鉴权且不触发 CORS 问题。
- Acceptance Criteria
  - Given 引用 `assets/...` 的文章，When 部署静态站点，Then 浏览器可直接访问资源且无鉴权弹窗。
- Dependencies：M0-T1-02（选择直链）；Nextcloud 公网访问策略。
- Risks：权限变更导致资源突然不可访问；缓解为对资源访问失败提供清晰降级提示，并记录“资源必须公开”的发布检查项。
- Owner Role：FE/DevOps
- Estimate：M；Confidence：Low

### M1-T6-03：资源路径解析统一入口（cover/image/link）

- Objective：统一封面、图片与附件的 URL 解析逻辑，避免分散实现造成不一致。
- Tasks
  - [ ] 统一资源解析函数：输入相对路径，输出运行时 URL。
  - [ ] 在 `cover`、Markdown 图片、附件链接的渲染中统一调用。
  - [ ] 添加测试：非法路径（越权）、空值、不同策略分支。
- Acceptance Criteria
  - Given 任意资源引用，When 渲染页面，Then URL 解析规则一致且非法路径按规则阻断或降级。
- Dependencies：M0-T1-02（策略）；M1-T3-04（链接 rewrite）。
- Risks：策略切换导致大量改动；缓解为把策略封装到单一模块并通过测试锁定行为。
- Owner Role：FE
- Estimate：S；Confidence：High
