# M2 工作包（完善与验收）

本文件将 `docs/plan/M2/README.md` 里的范围拆解为可直接建工单的工作包。

---

## Epic A：标签/分类聚合

### M2-T1-01：索引派生 tags/categories 视图模型（规范化）

- Objective：从索引产物派生 tags 与 categories 的聚合数据，并做规范化处理。
- Tasks
  - [ ] 规范化规则：trim、去空、大小写策略（需冻结为固定规则）。
  - [ ] 生成 tags 列表与 categories 列表（含数量、排序规则）。
  - [ ] 添加单元测试：大小写混用、空数组、重复项。
- Acceptance Criteria
  - Given 索引含多篇文章的 tags/category，When 生成聚合数据，Then 去重与排序结果稳定可复现。
- Dependencies：M1-T2-05（索引 schema）。
- Risks：规范化规则改变影响 URL；缓解为在 M2 冻结并写入文档，避免后续变更破坏链接。
- Owner Role：FE
- Estimate：S；Confidence：High

### M2-T1-02：标签列表页与标签详情页（静态生成）

- Objective：实现标签入口：标签列表页与单标签聚合页。
- Tasks
  - [ ] 标签列表页：展示所有 tag 与文章数。
  - [ ] 标签详情页：展示该 tag 下文章列表（复用列表卡片）。
  - [ ] 空态与 404 策略：不存在 tag 时返回 404 或空态（规则固定）。
- Acceptance Criteria
  - Given 任意存在的 tag，When 访问标签详情页，Then 展示对应文章并可跳转详情页。
- Dependencies：M2-T1-01；列表组件（M1-T4-*）。
- Risks：tag 字符导致 URL 不合法；缓解为定义 slugify 规则并在生成阶段统一编码。
- Owner Role：FE
- Estimate：M；Confidence：Med

### M2-T1-03：分类列表页与分类详情页（静态生成）

- Objective：实现分类入口：分类列表页与单分类聚合页。
- Tasks
  - [ ] 分类列表页：展示所有 category 与文章数。
  - [ ] 分类详情页：展示该分类下文章列表（复用列表卡片）。
  - [ ] 空态与 404 策略固定。
- Acceptance Criteria
  - Given 任意 category，When 访问分类详情页，Then 展示对应文章并可进入详情页。
- Dependencies：M2-T1-01；列表组件（M1-T4-*）。
- Risks：分类为空导致页面无意义；缓解为分类为空时入口展示空态并提示内容规范。
- Owner Role：FE
- Estimate：M；Confidence：Med

## Epic B：元数据搜索（非全文）

### M2-T2-01：搜索匹配规则与查询参数协议

- Objective：定义搜索在索引字段上的匹配规则与 URL 协议，保证可复现与可分享。
- Tasks
  - [ ] 定义匹配字段：`title/summary/tags/category`。
  - [ ] 定义匹配规则：大小写策略、空格拆分策略、AND/OR 规则（需冻结）。
  - [ ] 定义 URL 协议：例如 `?q=keyword`，并定义空值行为。
- Acceptance Criteria
  - Given 任意关键词，When 构造搜索 URL，Then 页面能复现相同结果且可分享链接。
- Dependencies：索引字段稳定（M1-T2-05）。
- Risks：规则频繁变更导致结果不可预期；缓解为将规则写入文档并用测试锁定。
- Owner Role：FE
- Estimate：S；Confidence：High

### M2-T2-02：搜索页 UI 与结果列表（复用卡片/空态）

- Objective：实现搜索输入与结果列表展示，并提供无结果空态与清空入口。
- Tasks
  - [ ] 搜索输入框与提交行为（回车/按钮）。
  - [ ] 结果列表复用列表卡片组件；高亮不是必需项（不纳入本票据）。
  - [ ] 无结果空态与清空/返回入口。
- Acceptance Criteria
  - Given 命中标题或标签的关键词，When 搜索，Then 返回匹配文章且可跳转详情页；无匹配时展示空态。
- Dependencies：M2-T2-01；M1-T4-02/M1-T4-04（卡片与空态组件）。
- Risks：文章数增大导致客户端过滤性能下降；缓解为保持索引精简并在后续迭代引入构建期搜索索引（PRD 记录）。
- Owner Role：FE
- Estimate：M；Confidence：Med

## Epic C：移动端适配与可访问性

### M2-T3-01：移动端响应式布局验收（列表/详情/导航）

- Objective：保证核心页面在移动端可读、可用且无横向溢出。
- Tasks
  - [ ] 列表页卡片在移动端的排版与间距调整。
  - [ ] 详情页正文排版、代码块滚动、图片自适应。
  - [ ] 导航在移动端可用（可折叠菜单或等价方案，需固定实现）。
- Acceptance Criteria
  - Given 移动端视口，When 浏览列表与详情，Then 无横向溢出且正文可读。
- Dependencies：M1 页面完成。
- Risks：代码块与长链接导致溢出；缓解为固定 `overflow` 策略并加入回归用例。
- Owner Role：FE/QA
- Estimate：M；Confidence：Med

### M2-T3-02：TOC 移动端交互（不遮挡阅读）

- Objective：在移动端提供可用的 TOC 入口，并保证阅读不被遮挡。
- Tasks
  - [ ] 定义移动端 TOC 形态：折叠/抽屉/悬浮按钮（选择其一并固定）。
  - [ ] 实现打开/关闭、点击跳转、跳转后自动收起（规则需明确）。
  - [ ] 添加手动验收清单：长文滚动、旋转屏幕、返回顶部。
- Acceptance Criteria
  - Given 移动端长文，When 打开 TOC 并点击条目，Then 能跳转到目标标题且 UI 不遮挡正文阅读。
- Dependencies：M1-T3-02（TOC 数据与组件）。
- Risks：滚动定位在 Safari 表现差异；缓解为加入 Safari 手动验收与必要的滚动修正策略。
- Owner Role：FE/QA
- Estimate：S；Confidence：Med

### M2-T3-03：可访问性检查与修复（语义/键盘/焦点/alt）

- Objective：满足 PRD 的基础可访问性要求并完成可验证验收。
- Tasks
  - [ ] 标题层级语义化：`h1~h6` 层级合理且 TOC 与正文一致。
  - [ ] 键盘导航：交互元素可聚焦、焦点可见、操作可完成核心路径。
  - [ ] 图片 `alt`：来源规则明确（Front Matter 或 Markdown 原始 alt）。
  - [ ] 错误态/空态文案：可理解且有返回入口。
- Acceptance Criteria
  - Given 键盘导航，When 从首页进入详情并返回，Then 全程可操作且焦点可见。
- Dependencies：M1 页面完成；M1-T3-05（图片降级）。
- Risks：语义调整影响样式；缓解为把语义作为硬约束并在样式中适配。
- Owner Role：FE/QA
- Estimate：M；Confidence：Med

## Epic D：构建性能与稳定性

### M2-T4-01：构建基线指标记录（耗时/体积/失败率）

- Objective：记录构建链路的基线指标，为后续优化提供对比标准。
- Tasks
  - [ ] 定义指标：抓取耗时、索引生成耗时、静态导出耗时、产物体积。
  - [ ] 在 CI 输出指标摘要（不包含敏感信息）。
  - [ ] 将指标阈值写入文档并作为发布前检查项。
- Acceptance Criteria
  - Given 一次构建，When CI 完成，Then 输出可读指标摘要并可用于回归对比。
- Dependencies：CI 已跑通（M0-T2-03）；内容抓取与构建链路完成（M1）。
- Risks：指标口径不一致；缓解为固定测量点与输出格式。
- Owner Role：DevOps/FE
- Estimate：S；Confidence：Med

### M2-T4-02：最小缓存/增量策略（按 etag/mtime 跳过下载）

- Objective：减少重复构建的抓取成本，提升构建稳定性。
- Tasks
  - [ ] 定义缓存 key：etag 或 mtime（需与 WebDAV 返回字段一致）。
  - [ ] 实现“未变更跳过下载”的策略，并保证输出一致性。
  - [ ] 添加回归测试：命中缓存与未命中分支。
- Acceptance Criteria
  - Given 内容未变更，When 连续构建两次，Then 第二次下载量显著减少且索引输出一致。
- Dependencies：M1-T1-03（etag/mtime 解析）；M1-T6-01（若涉及资源同步）。
- Risks：缓存失效导致内容更新不生效；缓解为以 etag/mtime 为准并提供强制全量重建开关。
- Owner Role：FE
- Estimate：M；Confidence：Low

## Epic E：文档与发布流程

### M2-T5-01：README 与配置文档补齐（env/部署/内容约定）

- Objective：让新环境可按文档复现构建与发布，不依赖口口相传。
- Tasks
  - [ ] 更新 `README.md`：本地开发、构建、部署形态、必要 env 变量（脱敏示例）。
  - [ ] 增加内容约定入口：指向 `docs/prd.md` 与 `docs/plan/`。
  - [ ] 增加故障排查：WebDAV 鉴权失败、404、解析失败、slug 冲突的处理指引。
- Acceptance Criteria
  - Given 新成员环境，When 按 README 操作，Then 能完成本地构建并得到可部署产物。
- Dependencies：M1 实现落地后的真实命令与目录。
- Risks：文档与实现偏离；缓解为将 README 更新纳入发布前检查清单。
- Owner Role：FE/DevOps
- Estimate：S；Confidence：High

