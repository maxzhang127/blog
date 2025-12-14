# CI/CD 配置说明

本项目使用 GitHub Actions 进行持续集成，确保每次代码变更都经过严格的质量门禁。

## CI 工作流概览

### 触发条件

- Push 到 `main` 分支
- 针对 `main` 分支的 Pull Request

### 工作流结构

```
quality-checks (代码质量检查)
    ├── 代码格式检查 (Prettier)
    ├── Lint 检查 (ESLint)
    └── TypeScript 类型检查

test (测试)
    ├── 运行单元测试
    ├── 生成覆盖率报告
    └── 上传覆盖率报告（Artifact）

build (构建验证)
    ├── 创建测试用 fixture 内容
    ├── 执行完整构建
    ├── 检查构建产物完整性
    ├── 安全审计（检查敏感信息泄露）
    └── 上传构建产物（Artifact）

all-checks-passed (汇总检查)
    └── 验证所有任务都成功
```

## 质量门禁详解

### 1. 代码质量检查

**目的**：确保代码符合项目规范

**检查项**：

- **代码格式**：使用 Prettier 检查代码格式是否一致
- **Lint**：使用 ESLint 检查代码风格和潜在问题
- **类型检查**：使用 TypeScript 编译器检查类型错误

**失败场景**：

- 代码格式不符合 `.prettierrc.json`
- 违反 ESLint 规则（见 `eslint.config.js`）
- TypeScript 类型错误

**修复方法**：

```bash
# 自动修复格式问题
npm run format

# 自动修复 lint 问题
npm run lint:fix

# 手动修复类型错误
npx tsc --noEmit
```

### 2. 测试

**目的**：确保代码功能正确且不会破坏已有功能

**检查项**：

- 运行所有测试用例（当前 44 个测试）
- 生成测试覆盖率报告
- 上传覆盖率报告供下载查看

**失败场景**：

- 任何测试用例失败
- 测试覆盖率生成失败

**修复方法**：

```bash
# 本地运行测试
npm test

# 查看详细错误信息
npm run test:watch
```

### 3. 构建验证

**目的**：确保项目可以成功构建且产物安全

**检查项**：

#### 3.1 创建测试 fixture

由于 CI 环境中没有 WebDAV 凭证，工作流会自动创建一个最小的测试文章：

- 包含所有必填字段（title、slug、createdAt）
- 放置在 `posts/` 目录
- 用于验证构建流程

#### 3.2 执行构建

运行 `npm run build`，包括：

- 内容索引生成（`posts-index.json`）
- Vite 构建静态产物
- 原子目录替换

#### 3.3 产物完整性检查

验证关键文件存在：

- `dist/` 目录
- `dist/index.html` 入口文件

#### 3.4 安全审计

**这是 M0 的核心安全要求！**

检查构建产物中是否包含敏感信息：

- `NEXTCLOUD_APP_PASSWORD` 环境变量名
- `NEXTCLOUD_USERNAME` 环境变量名
- `app-password` 字符串
- Base64 编码的认证信息（`Basic ...`）

**为何重要**：

- WebDAV 凭证绝不能出现在浏览器端产物中
- 如果发现敏感信息，构建会失败并报错

**失败场景**：

```
⚠️  警告: 在构建产物中发现可能的敏感信息: NEXTCLOUD_APP_PASSWORD
❌ 安全审计失败: 构建产物中包含敏感信息
```

**修复方法**：

1. 检查 `scripts/` 下的构建脚本
2. 确保日志输出不包含完整的 URL（带凭证）
3. 确保环境变量不会被打包到前端代码
4. 使用 `console.log` 时避免输出敏感对象

#### 3.5 上传构建产物

将 `dist/` 目录上传为 Artifact，保留 7 天，方便：

- 下载查看构建结果
- 调试构建问题
- 验证产物内容

## 本地模拟 CI 环境

### 完整检查

```bash
# 模拟完整 CI 流程
npm run format:check && \
npm run lint && \
npx tsc --noEmit && \
npm test && \
npm run build
```

### 创建测试 fixture（用于本地构建测试）

```bash
mkdir -p posts
cat > posts/test-post.md << 'EOF'
---
title: 测试文章
slug: test-post
createdAt: 2024-01-15
summary: 这是一篇用于测试的文章
tags: [test]
---
# 测试文章

这是测试内容。
EOF

npm run build
```

## CI 优化特性

### 1. 并发控制

同一分支/PR 上的新提交会自动取消正在运行的旧工作流，避免资源浪费：

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

### 2. 依赖缓存

使用 `actions/setup-node` 的内置缓存功能，加速依赖安装：

```yaml
- uses: actions/setup-node@v4
  with:
    cache: "npm"
```

### 3. 超时保护

每个任务都设置了超时时间，防止卡住：

- `quality-checks`: 10 分钟
- `test`: 10 分钟
- `build`: 15 分钟

### 4. Artifact 管理

上传的构建产物和覆盖率报告保留 7 天，避免占用存储空间。

## 常见问题

### Q: CI 构建成功，但本地构建失败？

A: 可能原因：

1. 本地缺少 `posts/` 目录（运行 `npm run fetch` 或创建测试 fixture）
2. Node.js 版本不一致（CI 使用 18.19.0，见 `package.json` engines 字段）
3. 依赖版本不一致（删除 `node_modules` 和 `package-lock.json` 重新安装）

### Q: 安全审计误报怎么办？

A: 如果确认不是真实泄露，可以调整 `.github/workflows/ci.yml` 中的 `SENSITIVE_PATTERNS` 模式。

### Q: 如何查看覆盖率报告？

A:

1. 进入 GitHub Actions 页面
2. 点击对应的工作流运行
3. 下载 `coverage-report` Artifact
4. 解压后打开 `coverage/index.html`

### Q: 测试在 CI 中失败但本地通过？

A: 可能原因：

1. 时区差异（使用 UTC 时间测试）
2. 文件系统差异（Windows vs Linux 路径分隔符）
3. 环境变量差异（检查是否依赖特定环境变量）

## 未来改进方向

### M1/M2 阶段可能添加：

- [ ] 自动部署到测试环境
- [ ] PR 预览部署
- [ ] 性能基准测试（构建时间、产物大小）
- [ ] 依赖安全扫描（`npm audit`）
- [ ] 自动生成 Changelog
- [ ] 集成 SonarQube 或 CodeClimate

### 可选的增强功能：

- [ ] Matrix 构建（多 Node.js 版本）
- [ ] 定时构建（每日/每周）
- [ ] Slack/钉钉通知
- [ ] 构建状态徽章（Badge）

## 相关文档

- [测试指南](./testing.md) - 测试编写与最佳实践
- [开发指南](../CLAUDE.md) - 编码规范与工程约定
- [项目规划](./plan/) - 里程碑与工作包
