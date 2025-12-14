# 测试指南

本项目使用 Vitest 作为测试框架，提供了完整的单元测试和集成测试覆盖。

## 运行测试

```bash
# 运行所有测试（单次运行）
npm test

# 监听模式（文件变化时自动重新运行）
npm run test:watch

# 运行测试并生成覆盖率报告
npm run test:coverage

# 使用可视化界面运行测试
npm run test:ui
```

## 测试结构

### 单元测试

#### validators.test.ts

测试内容校验相关的工具函数：

- `toIsoDate()` - 日期转换和校验（9 个测试用例）
  - 有效的日期字符串和 Date 对象转换
  - 无效日期、空值、错误类型的处理
- `asOptionalString()` - 可选字符串转换（9 个测试用例）
  - 字符串 trim 和空值过滤
  - 非字符串类型的处理
- `asOptionalStringArray()` - 可选字符串数组转换（10 个测试用例）
  - 数组元素过滤和 trim
  - 空数组和非数组类型的处理

#### atomicReplaceDirectory.test.ts

测试原子目录替换功能：

- 基本替换操作
- 已存在目标目录的备份和替换
- 不存在目标目录时的处理
- 备份目录清理
- 包含子目录的复杂结构处理

### 集成测试

#### generateContent.test.ts

测试完整的内容生成流程（10 个测试用例）：

- **成功场景**：
  - 生成包含有效文章的索引
  - 文章按日期降序排列
  - 嵌套目录中的文章处理
  - 可选字段缺失的情况
- **错误场景**：
  - content 目录不存在或为空
  - 缺少必填字段（title/slug/createdAt）
  - 日期格式无效
  - slug 冲突

所有集成测试都使用临时文件系统，测试完成后自动清理。

## WebDAV 相关测试

WebDAV 下载逻辑（`downloadMarkdownTree.ts`）由于涉及网络请求，目前**不包含**在自动化测试中。建议的测试方式：

### 手动测试

```bash
# 配置 .env.local 后运行
npm run fetch
```

### 为何不自动化测试 WebDAV？

1. **外部依赖**：需要真实的 Nextcloud 服务器
2. **凭证管理**：CI 环境中管理 WebDAV 凭证复杂
3. **测试稳定性**：网络请求易受环境影响

### 未来改进方向

如果需要自动化测试 WebDAV 逻辑，可以考虑：

- 使用 Mock Server（如 `nock`、`msw`）模拟 WebDAV 响应
- 提取可测试的纯函数（如 URL 解析、路径处理等）
- 在 E2E 测试环境中集成真实的 WebDAV 服务器

## 测试覆盖范围

当前测试覆盖了 M0 阶段的核心功能：

- ✅ 内容校验规则（Front Matter 必填字段、日期格式、slug 唯一性）
- ✅ 索引生成逻辑（文件扫描、排序、输出）
- ✅ 原子目录替换（防止构建产物不一致）
- ⚠️ WebDAV 下载逻辑（手动测试）
- ❌ 前端组件（计划在 M1/M2 补充）

## 编写新测试

### 命名规范

- 测试文件命名：`*.test.ts` 或 `*.spec.ts`
- 测试文件位置：与被测试文件同目录

### 测试模板

```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";

describe("模块或函数名", () => {
  // 每个测试前执行
  beforeEach(() => {
    // 设置测试环境
  });

  // 每个测试后执行
  afterEach(() => {
    // 清理测试环境
  });

  it("应该[预期行为]", () => {
    // Arrange（准备）
    const input = "测试输入";

    // Act（执行）
    const result = functionUnderTest(input);

    // Assert（断言）
    expect(result).toBe("预期输出");
  });

  it("应该在[异常情况]时抛出错误", () => {
    expect(() => {
      functionUnderTest("无效输入");
    }).toThrow("预期的错误消息");
  });
});
```

### 测试用例设计原则

1. **边界值测试**：空值、空字符串、空数组
2. **错误路径测试**：无效输入、缺失字段、类型错误
3. **正常路径测试**：典型使用场景
4. **隔离性**：每个测试独立运行，不依赖其他测试
5. **可读性**：测试名称清晰描述预期行为

## CI 集成

测试已集成到 npm scripts 中，可以在 CI 流水线中使用：

```yaml
# 示例 GitHub Actions 配置
- name: Run tests
  run: npm test

- name: Check coverage
  run: npm run test:coverage
```

**注意**：CI 环境中需要确保 Node.js 版本 >= 18.19.0（见 `package.json` 的 `engines` 字段）。
