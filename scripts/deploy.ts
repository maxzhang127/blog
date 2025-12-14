import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

/**
 * Retrieves a required environment variable.
 *
 * @param name - Environment variable name
 * @returns The environment variable value
 * @throws Error if the variable is not set
 */
function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`缺少必需的环境变量: ${name}，请检查 .env.local 文件`);
  }
  return value;
}

/**
 * Executes rsync command to deploy dist folder to remote server.
 *
 * This function performs incremental synchronization using rsync over SSH,
 * which only transfers changed files and maintains file permissions.
 */
async function main() {
  dotenv.config({ path: path.join(repoRoot, ".env.local") });

  const deployHost = requiredEnv("DEPLOY_HOST");
  const deployUser = requiredEnv("DEPLOY_USER");
  const deployPath = requiredEnv("DEPLOY_PATH");
  const deployPort = process.env.DEPLOY_PORT ?? "22";
  const deployKeyPath = process.env.DEPLOY_SSH_KEY_PATH;

  const distDir = path.join(repoRoot, "dist");
  const relativeDistDir = path.relative(process.cwd(), distDir);

  // 构建 rsync 命令
  const rsyncArgs = [
    "-avz", // archive mode, verbose, compress
    "--delete", // delete files on server that don't exist locally
    "--progress", // show progress
    "-e",
    `ssh -p ${deployPort}${deployKeyPath ? ` -i "${deployKeyPath}"` : ""}`,
    `${distDir}/`, // 注意：末尾的 / 表示同步目录内容而非目录本身
    `${deployUser}@${deployHost}:${deployPath}`,
  ];

  const command = `rsync ${rsyncArgs.join(" ")}`;

  console.log(`正在部署 ${relativeDistDir} 到 ${deployUser}@${deployHost}:${deployPath}...`);
  console.log(`执行命令: ${command}\n`);

  try {
    execSync(command, {
      cwd: repoRoot,
      stdio: "inherit", // 继承标准输入输出，实时显示 rsync 进度
    });

    console.log(`\n✅ 部署成功！`);
  } catch (error) {
    throw new Error(`rsync 部署失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

main().catch((error: unknown) => {
  const message =
    error && typeof error === "object" && "stack" in error && error.stack
      ? String(error.stack)
      : String(error);

  process.stderr.write(`❌ 部署失败: ${message}\n`);
  process.exit(1);
});
