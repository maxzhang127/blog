# blog

基于 Nextcloud WebDAV 的构建期内容源博客（当前处于 M0：决策与工程底座阶段）。

## 准备

```bash
npm install
cp .env.example .env.local
```

在 `.env.local` 中填写 Nextcloud WebDAV 相关配置（仅用于 `npm run fetch`，不会进入浏览器端产物）。

## 构建（手动触发）

```bash
npm run fetch
npm run build
```

产物输出到：`dist/`

## 发布与回滚（当前约定）

- 发布：使用 Nginx 静态托管 `dist/`（将站点 `root` 指向构建产物目录）。
- 回滚：通过 Nextcloud 的文件版本/回收站回滚内容后，重新执行 `npm run fetch && npm run build` 并发布。

决策记录：`docs/plan/M0/M0-T1-01-build-and-release.md`
