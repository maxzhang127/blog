# M0：需求确认与技术底座定稿

## 目标

- 把 `docs/prd.md` 的待确认项收敛为可执行的工程输入（路径/URL/触发方式/资产策略/部署形态）。
- 跑通项目工程底座：本地与 CI 可一致构建静态产物。
- 固化内容约定与校验规则，避免坏数据进入发布链路。

## 范围

In-scope
- 决策与约束定稿：构建触发、`assets/` 策略、basePath、SSG 技术栈。
- 工程脚手架：TypeScript、lint/test/build 脚本与静态导出通路。
- 内容约定与校验：slug 唯一、Front Matter 必填、命名规则与失败策略。

Out-of-scope
- 任何页面功能的完整实现（列表/详情/标签/搜索在 M1/M2 交付）。

## 工作包清单

- `M0-T1`：澄清问题与决策记录（见 `docs/plan/README.md`）
- `M0-T2`：工程化脚手架与静态构建通路（见 `docs/plan/README.md`）
- `M0-T3`：内容约定与校验规则（见 `docs/plan/README.md`）

详细拆分与验收口径：`docs/plan/M0/work-packages.md`

## 里程碑退出标准（验收）

- P0/P1 澄清问题全部有结论并落文档。
- `npm install && npm run fetch && npm run build` 可输出静态产物，且日志与产物不含任何 WebDAV 凭证。
- 内容校验规则明确，构建失败信息可定位到具体文件与规则。
