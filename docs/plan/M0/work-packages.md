# M0 工作包（需求确认与技术底座）

本文件将 `docs/plan/M0/README.md` 里的范围拆解为可直接建工单的工作包。

---

## M0-T1（拆分）：澄清问题与决策记录（P0/P1 收敛）

### M0-T1-01：构建触发与发布流程定稿

- Objective：明确内容更新到站点生效的触发方式与发布流程，并固化为可执行步骤。
- Tasks
  - [ ] 明确触发方式：手动 / 定时 / 内容变更触发（选择其一或组合，并写出规则）。
  - [ ] 明确发布链路：构建产物生成位置、发布目标（静态托管）、回滚方式（版本化或原子替换）。
  - [ ] 明确失败处理：构建失败不影响已发布版本；失败告警/通知方式。
- Acceptance Criteria
  - Given 一次内容更新，When 触发构建与发布，Then 站点在约定时间内更新到新版本且可回滚到上一版本。
- Dependencies：发布平台（CI、对象存储/CDN、静态托管）与权限。
- Risks：触发策略不清导致更新不稳定；缓解为把触发规则写成可执行清单并纳入发布检查。
- Owner Role：TPM/DevOps
- Estimate：S；Confidence：Med

### M0-T1-02：`assets/` 策略定稿（同源同步 vs 直链）

- Objective：确定资源可访问策略，并定义 Markdown 资源引用到 URL 的映射规则。
- Tasks
  - [ ] 决策：同源同步或 Nextcloud 直链（二选一）。
  - [ ] 定义 `assets/...` 的路径规则与允许范围（禁止越权路径）。
  - [ ] 定义缺失资源的处理：构建期阻断或运行时降级提示（需写清楚）。
- Acceptance Criteria
  - Given Markdown 引用 `assets/...`，When 构建并部署静态站点，Then 图片/附件 URL 在浏览器中可访问且不触发鉴权弹窗。
- Dependencies：Nextcloud 资源权限与公开访问策略（若选择直链）。
- Risks：直链需要权限边界与 URL 规则；缓解为优先选择同源同步并在文档中固定路径一致性。
- Owner Role：Tech Lead/FE
- Estimate：S；Confidence：Med

### M0-T1-03：SSG 技术栈与部署形态定稿（含 basePath）

- Objective：选择静态导出方案，并验证路由、分页与子路径部署的可行性。
- Tasks
  - [ ] 选择 SSG 技术栈（Next.js 静态导出或 Vite SSG）并写出选择理由与约束。
  - [ ] 明确是否需要 basePath（例如 `/blog/`），并验证静态资源路径与路由行为。
  - [ ] 验证分页与详情路由能静态生成（含 404 行为）。
- Acceptance Criteria
  - Given 选定技术栈与部署形态，When 输出静态站点，Then 在目标托管环境中路由与资源路径均可访问。
- Dependencies：部署环境（域名/路径/路由规则）约束。
- Risks：静态导出与路由策略冲突；缓解为在 M0 做最小 POC 验证并冻结结论。
- Owner Role：FE/DevOps
- Estimate：M；Confidence：Med

### M0-T1-04：安全与日志策略定稿（凭证与敏感信息）

- Objective：制定凭证管理、日志脱敏与产物审计规则，作为后续实现硬门禁。
- Tasks
  - [ ] 定义 `.env.local` 与 CI secrets 的变量名与注入方式（不写入仓库）。
  - [ ] 定义日志策略：禁止输出包含 token 的 URL、禁止输出敏感 header；必要时对值进行 mask。
  - [ ] 定义产物审计项：构建完成后检查产物中不出现凭证串。
- Acceptance Criteria
  - Given 任意构建日志与产物，When 执行审计，Then 不包含 WebDAV 凭证或敏感 header 值。
- Dependencies：CI 平台 secrets 管理能力。
- Risks：调试时误输出敏感信息；缓解为提供统一日志工具并将审计加入 CI。
- Owner Role：DevOps/FE
- Estimate：S；Confidence：High

### M0-T1-05：决策记录归档

- Objective：把 M0 的关键结论固化为可追溯的决策记录，作为后续实现依据。
- Tasks
  - [ ] 在 `docs/plan/M0/` 下新增/补充决策记录文档（路径、资产策略、SSG、触发方式、安全策略）。
  - [ ] 在 `docs/prd.md` 的“待确认”条目中标注结论与链接（如需）。
- Acceptance Criteria
  - Given M0 的 P0/P1 问题，When 查看文档，Then 每条都有结论、原因与工程约束（命令/路径/部署形态）。
- Dependencies：M0-T1-01~04 输出。
- Risks：文档与实现偏离；缓解为将文档链接到后续工单并在 PR 模板中检查。
- Owner Role：TPM/Tech Lead
- Estimate：S；Confidence：High

## M0-T2（拆分）：工程化脚手架与静态构建通路

### M0-T2-01：初始化项目与基础脚本（dev/lint/test/build）

- Objective：建立可持续迭代的工程底座，确保本地与 CI 可复现构建。
- Tasks
  - [ ] 初始化 TypeScript 工程与目录结构。
  - [ ] 补齐 `package.json` 脚本：`dev`/`lint`/`test`/`build`。
  - [ ] 统一格式化与 lint 规则，并在 CI 中执行。
- Acceptance Criteria
  - Given 新环境，When 执行 `npm install && npm run fetch && npm run build`，Then 构建成功并输出可部署静态产物。
- Dependencies：M0-T1-03（技术栈结论）。
- Risks：脚手架选择错误导致后续大改；缓解为先做 POC 再初始化。
- Owner Role：FE
- Estimate：M；Confidence：Med

### M0-T2-02：静态导出样例路由验证（列表/详情/404）

- Objective：在正式实现前验证静态导出能力与路由策略。
- Tasks
  - [ ] 创建最小页面：列表页、详情页（基于 fixture slug）、404 页。
  - [ ] 验证静态导出后路由可访问（含 basePath 情况）。
  - [ ] 记录限制项（例如动态路由、分页 URL 结构的约束）。
- Acceptance Criteria
  - Given 静态导出产物，When 在目标托管方式下访问，Then 列表/详情/404 均可按预期工作。
- Dependencies：M0-T1-03。
- Risks：分页与详情路由策略选错；缓解为在 M0 明确 URL 结构并固化。
- Owner Role：FE
- Estimate：S；Confidence：High

### M0-T2-03：CI 最小流水线（install/lint/test/build）

- Objective：将构建门禁前置到 CI，保证每次变更可复现。
- Tasks
  - [ ] 固定 Node 版本与依赖锁策略（npm lockfile）。
  - [ ] CI 执行：`npm ci`（或等价）+ `npm run lint` + `npm test` + `npm run build`。
  - [ ] 在 CI 中注入（或占位）环境变量，并验证不会泄露到产物。
- Acceptance Criteria
  - Given 任意 PR，When CI 运行，Then 基础门禁全绿且产物检查通过。
- Dependencies：CI 平台配置权限。
- Risks：CI 与本地环境不一致；缓解为固定版本并文档化。
- Owner Role：DevOps/FE
- Estimate：S；Confidence：Med

## M0-T3（拆分）：内容约定与校验规则（slug/Front Matter/目录结构）

### M0-T3-01：内容约定文档固化（目录/命名/路由）

- Objective：把目录约定、文件命名与路由映射写成可执行规范。
- Tasks
  - [ ] 固化 WebDAV 博客根目录的相对结构：`posts/`、`assets/`。
  - [ ] 固化文章文件命名：`yyyy-mm-dd--slug.md`，并定义 slug 合法字符集。
  - [ ] 固化路由规则：详情页以 `slug` 唯一标识；日期用于排序展示（优先 `createdAt`）。
- Acceptance Criteria
  - Given 任意文章文件，When 按规范命名与填写 Front Matter，Then 可唯一映射到站点路由且排序稳定。
- Dependencies：M0-T1-03（路由形态/basePath）。
- Risks：规范不清导致内容维护成本上升；缓解为提供示例与校验错误说明。
- Owner Role：TPM/FE
- Estimate：S；Confidence：High

### M0-T3-02：校验规则分级（阻断项 vs 警告项）

- Objective：定义“构建必须失败”的阻断项与“仅提示”的警告项，减少线上风险。
- Tasks
  - [ ] 阻断项：必填字段缺失、slug 冲突、命名不合规、非法路径引用等。
  - [ ] 警告项：缺少 `summary`/`cover`、tags 为空、可选字段格式不规范等。
  - [ ] 定义错误输出格式：必须包含文件路径与规则名称。
- Acceptance Criteria
  - Given 一组输入文件，When 触发校验，Then 阻断项会导致构建失败且可定位；警告项不会阻断但有清晰提示。
- Dependencies：内容维护流程对“阻断项”的接受度。
- Risks：规则过严阻塞发布；缓解为先以警告上线，再按风险升级为阻断项。
- Owner Role：FE/QA
- Estimate：S；Confidence：High

### M0-T3-03：fixture 内容样例（用于离线构建与测试）

- Objective：提供可重复使用的内容样例，用于本地与 CI 的离线验证与回归测试。
- Tasks
  - [ ] 准备最小 `posts/` 样例（含多级标题、代码块、图片引用、站内链接）。
  - [ ] 准备最小 `assets/` 样例（图片/附件），与 `assets/` 策略兼容。
  - [ ] 将 fixture 用于静态导出样例路由与渲染回归。
- Acceptance Criteria
  - Given 不连接真实 WebDAV 的环境，When 使用 fixture 构建，Then 列表/详情渲染可验收且测试可稳定运行。
- Dependencies：M0-T1-02（`assets/` 策略结论）。
- Risks：fixture 与真实内容差异过大；缓解为选取真实内容的代表性片段并定期同步。
- Owner Role：FE/QA
- Estimate：S；Confidence：Med
