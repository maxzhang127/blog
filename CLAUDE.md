# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

```bash
npm install                 # 安装依赖
npm run fetch              # 从 Nextcloud WebDAV 获取内容（需要配置 .env.local）
npm run build              # 执行完整构建流程（包括内容生成和 Vite 构建）
npm run deploy             # 部署 dist 文件夹到服务器（需要配置 .env.local）
npm run dev                # 启动开发服务器
npm run preview            # 预览构建产物
```

构建和部署流程说明：

- `npm run fetch` 从配置的 Nextcloud WebDAV 下载 Markdown 文档到本地 `content/` 目录
- `npm run build` 先生成内容索引，再执行 Vite 构建，输出到 `dist/`
- `npm run deploy` 使用 rsync over SSH 增量同步 `dist/` 到远程服务器（仅上传变化的文件）

## 项目架构

这是一个基于 Nextcloud WebDAV 的构建期内容源博客，采用多页面应用（MPA）架构：

### 技术栈

- **构建工具**: Vite 5 + TypeScript
- **前端框架**: React 18 + Ant Design 5
- **样式**: Sass/SCSS
- **内容获取**: WebDAV API（仅构建期使用）

### 目录结构

```
src/
├── pages/              # 页面组件（按功能分组）
│   ├── home/          # 首页
│   └── post/          # 文章页
├── shared/            # 共享组件和工具
│   ├── contentApi.ts  # 内容 API
│   ├── AppShell.tsx   # 应用外壳
│   └── types.ts       # 类型定义
├── styles/            # 全局样式
└── *.html             # 各页面入口文件

scripts/               # 构建脚本
├── fetch.ts           # WebDAV 内容获取
├── build.ts           # 完整构建流程
└── lib/               # 构建工具函数
```

### 多入口配置

项目配置了多个构建入口：

- `src/index.html` → 首页
- `src/posts/index.html` → 文章列表页
- `src/post/index.html` → 单篇文章页

## 环境配置

复制 `.env.example` 为 `.env.local` 并配置相应信息：

```bash
cp .env.example .env.local
```

### 内容获取（必需）

用于 `npm run fetch` 从 Nextcloud WebDAV 拉取内容：

- `NEXTCLOUD_BLOG_WEBDAV_URL`: WebDAV 端点 URL（不包含认证信息）
- `NEXTCLOUD_USERNAME`: Nextcloud 用户名
- `NEXTCLOUD_APP_PASSWORD`: Nextcloud 应用专用密码

### 部署配置（可选）

用于 `npm run deploy` 部署到远程服务器：

- `DEPLOY_HOST`: 服务器地址或 IP（必需）
- `DEPLOY_USER`: SSH 用户名（必需）
- `DEPLOY_PATH`: 服务器上的目标路径（必需）
- `DEPLOY_PORT`: SSH 端口，默认 22（可选）
- `DEPLOY_SSH_KEY_PATH`: SSH 私钥路径（可选，不设置则使用默认密钥）

## 开发约定

### 安全要求

- WebDAV 凭证仅在构建期使用，绝不进入浏览器端代码
- 所有敏感信息必须放在 `.env.local`（已被 gitignore）
- 避免在日志中打印包含凭证的 URL

### 代码规范

- TypeScript 严格模式，2 空格缩进
- 组件使用 `PascalCase`，工具函数使用 `camelCase`
- 样式文件与组件同目录放置
- WebDAV 相关代码集中在 `scripts/lib/` 下

### 分支和提交规范

- 采用 Conventional Commits 格式
- 主分支: `main`
- PR 需要包含测试计划和风险评估

## 注意事项

- 该项目当前处于 M0 阶段（决策与工程底座）
- 内容获取和构建需要分两步执行：先 `npm run fetch` 再 `npm run build`
- 构建产物部署到静态服务器（如 Nginx）
- 项目使用中文作为主要交流语言

### Windows 用户部署说明

`npm run deploy` 依赖 `rsync` 命令，Windows 用户需要确保系统中已安装 rsync：

1. **Git Bash（推荐）**: Git for Windows 自带 rsync，在 Git Bash 中运行 `npm run deploy`
2. **WSL2**: 在 WSL2 环境中运行（需要配置 SSH 密钥）
3. **Cygwin**: 安装 Cygwin 并添加 rsync 包

如果无法使用 rsync，可以手动使用 FTP/SFTP 客户端（如 FileZilla）上传 `dist/` 文件夹

## 编码规范

### 函数和文件长度

- **单个函数**: 建议不超过 **50 行**（不含空行和注释）
  - 超过此限制时应考虑拆分为多个子函数
  - 复杂业务逻辑优先提取为独立函数，而非内联
- **单个文件**: 建议不超过 **400 行**（不含空行和注释）
  - 超过时应考虑按职责拆分为多个模块
  - 例外：自动生成的类型定义、配置文件等
- **单行代码**: 建议不超过 **100 字符**
  - 超长链式调用、类型声明等可适当换行
  - 优先可读性，不强制一行一表达式

### JSDoc 注释规范

#### 必须添加 JSDoc 的场景

1. **所有导出的公共 API**（函数、类、接口、类型别名）
2. **所有 React 组件**（导出与否均需要）
3. **业务逻辑复杂的内部函数**（尤其是算法、转换逻辑）
4. **行为不明显的工具函数**（如 `safeJoin`、`toRelativePath` 等）

#### 不需要 JSDoc 的场景

1. **类型声明本身已足够清晰**（如简单的 getter/setter）
2. **私有的简单辅助函数**（如 `toArray`、`delay` 等自解释函数）
3. **测试文件中的测试用例**

#### JSDoc 格式要求

````typescript
/**
 * 简短的一句话描述（必需）。
 *
 * 可选的详细说明段落，解释：
 * - 函数的业务意图（而非实现细节）
 * - 特殊的边界情况
 * - 使用示例（如果API不直观）
 *
 * @param paramName - 参数说明（TypeScript 类型已提供类型信息，此处只需业务含义）
 * @returns 返回值说明（重点是业务含义，而非类型）
 * @throws 可能抛出的异常及触发条件
 *
 * @example
 * ```typescript
 * const result = myFunction({ foo: 'bar' });
 * ```
 */
````

**重要原则**：

- TypeScript 已提供类型信息，JSDoc **不要重复类型声明**
- 重点描述 **"为什么"** 而非 **"是什么"**
- 避免无意义的注释（如 `@param id - The ID`）
- 优先写自解释的代码，而非依赖注释补救

#### 实际示例对比

❌ **冗余的 JSDoc**（类型信息已在 TS 中）:

```typescript
/**
 * Fetch posts index
 * @returns {Promise<PostsIndex>} The posts index
 */
export async function fetchPostsIndex(): Promise<PostsIndex> { ... }
```

✅ **有价值的 JSDoc**（解释业务含义）:

```typescript
/**
 * Fetches the build-generated posts index.
 *
 * This index is created during build time by scanning all markdown files.
 * The index is cached by the browser and should be lightweight.
 */
export async function fetchPostsIndex(): Promise<PostsIndex> { ... }
```

### React 组件规范

- **Props 接口**: 优先使用 `type` 定义，必须导出（便于外部扩展）
- **组件顺序**: Props 类型 → 组件函数 → 样式定义 → 子组件
- **Hooks 顺序**: 按依赖关系从上到下（useState → useEffect → useMemo → useCallback）
- **事件处理**: 优先 `handleXxx` 命名（如 `handleClick`），避免 `onXxx`

### 错误处理规范

- **所有异步操作**: 必须处理错误情况
- **用户可见错误**: 提供有意义的中文错误消息
- **开发者错误**: 可使用英文，但必须包含上下文信息
- **网络请求**: 包含 HTTP 状态码和请求路径
- **避免**: 吞掉异常（空 catch 块）、使用 `any` 类型的 error

### TypeScript 使用规范

- **严格模式**: 必须启用 `strict: true`
- **类型断言**: 尽量避免 `as`，优先类型守卫（type guard）
- **any 类型**: 仅允许在以下场景：
  - 第三方库缺少类型定义
  - 动态 JSON 解析后立即验证
  - 使用时必须添加注释说明原因
- **接口 vs 类型**: 优先 `type`，除非需要声明合并（declaration merging）

### 文件和目录命名

- **组件文件**: `PascalCase.tsx`（如 `HomePage.tsx`）
- **工具函数**: `camelCase.ts`（如 `contentApi.ts`）
- **类型定义**: `types.ts` 或 `*.types.ts`
- **样式文件**: 与组件同名 `.scss`（如 `HomePage.scss`）
- **目录**: `kebab-case`（特殊情况下可用 `camelCase`）

### 导入顺序

1. Node.js 内置模块（如 `node:fs`）
2. 第三方库（如 `react`、`antd`）
3. 项目内模块（使用相对路径）
4. 类型导入（使用 `import type`）
5. 样式文件

各组之间保留一个空行。

## 代码质量工具

项目已配置 ESLint 和 Prettier 来自动化编码规范检查。

### 可用命令

```bash
npm run lint           # 检查代码规范问题
npm run lint:fix       # 自动修复可修复的问题
npm run format         # 格式化所有代码文件
npm run format:check   # 检查代码格式（不修改文件）
```

### 使用建议

1. **开发前**：运行 `npm run lint` 查看现有问题
2. **开发中**：配置 IDE 自动保存时格式化（推荐使用 Prettier 插件）
3. **提交前**：运行 `npm run lint:fix && npm run format` 自动修复问题
4. **CI/CD**：在流水线中运行 `npm run format:check && npm run lint` 确保代码质量

### 配置文件说明

- `eslint.config.js` - ESLint 配置（ESLint 9 扁平配置格式）
- `.prettierrc.json` - Prettier 代码格式化配置
- `.prettierignore` - Prettier 忽略文件列表

### 常见警告处理

**JSDoc 警告**：导出的函数和组件需要添加 JSDoc 注释。对于内部辅助函数，如果类型和命名已经足够清晰，可以忽略警告。

**函数行数警告**：单个函数超过 50 行时会警告，应考虑拆分为多个子函数。

**非空断言警告**：避免使用 `!` 运算符，优先使用可选链 `?.` 或类型守卫。
