# blog

基于 Nextcloud WebDAV 的构建期内容源博客。

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填写 Nextcloud WebDAV 配置

# 3. 拉取内容
npm run fetch

# 4. 启动开发服务器
npm run dev
```

## 构建与发布

```bash
# 构建生产版本
npm run build

# 预览构建产物
npm run preview
```

产物输出到：`dist/`

## 开发工作流

### 代码质量检查

```bash
# 运行所有测试
npm test

# 监听模式运行测试
npm run test:watch

# 生成测试覆盖率报告
npm run test:coverage

# 代码风格检查
npm run lint

# 自动修复代码风格问题
npm run lint:fix

# 格式化代码
npm run format
```

### 测试说明

项目使用 Vitest 进行测试，当前包含 **44 个测试用例**，覆盖：

- ✅ 内容校验逻辑（Front Matter 字段、日期格式、slug 唯一性）
- ✅ 索引生成流程（文件扫描、排序、输出）
- ✅ 原子目录替换（防止构建产物不一致）

详细的测试指南请查看 [`docs/testing.md`](./docs/testing.md)。

## 发布与回滚

- **发布**：使用 Nginx 静态托管 `dist/`（将站点 `root` 指向构建产物目录）
- **回滚**：通过 Nextcloud 的文件版本/回收站回滚内容后，重新执行 `npm run fetch && npm run build` 并发布

## 项目文档

- 📋 [项目规划](./docs/plan/) - 里程碑与工作包拆解
- 📝 [产品需求文档](./docs/prd.md) - 需求与约束
- 🧪 [测试指南](./docs/testing.md) - 测试说明与最佳实践
- ⚙️ [开发指南](./CLAUDE.md) - 编码规范与工程约定
