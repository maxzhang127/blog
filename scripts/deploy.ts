import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import SftpClient from "ssh2-sftp-client";

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
 * Recursively gets all files in a directory.
 *
 * @param dir - Directory path
 * @param baseDir - Base directory for calculating relative paths
 * @returns Array of file paths with their relative paths
 */
async function getAllFiles(dir: string, baseDir: string = dir): Promise<{ absolute: string; relative: string }[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: { absolute: string; relative: string }[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await getAllFiles(fullPath, baseDir)));
    } else {
      files.push({
        absolute: fullPath,
        relative: path.relative(baseDir, fullPath).replace(/\\/g, "/"),
      });
    }
  }

  return files;
}

/**
 * Deploys dist folder to remote server using SFTP.
 *
 * This function uploads all files from the dist directory to the remote server,
 * creating directories as needed.
 */
async function main() {
  dotenv.config({ path: path.join(repoRoot, ".env.local") });

  const deployHost = requiredEnv("DEPLOY_HOST");
  const deployUser = requiredEnv("DEPLOY_USER");
  const deployPath = requiredEnv("DEPLOY_PATH");
  const deployPort = parseInt(process.env.DEPLOY_PORT ?? "22", 10);
  const deployPassword = process.env.DEPLOY_PASSWORD;
  const deployKeyPath = process.env.DEPLOY_SSH_KEY_PATH;

  const distDir = path.join(repoRoot, "dist");
  const relativeDistDir = path.relative(process.cwd(), distDir);

  // 检查 dist 目录是否存在
  try {
    await fs.access(distDir);
  } catch {
    throw new Error(`dist 目录不存在: ${distDir}\n请先运行 npm run build`);
  }

  console.log(`正在部署 ${relativeDistDir} 到 ${deployUser}@${deployHost}:${deployPath}...\n`);

  const sftp = new SftpClient();

  try {
    // 连接配置
    const connectConfig: any = {
      host: deployHost,
      port: deployPort,
      username: deployUser,
    };

    // 优先使用 SSH 密钥，否则使用密码
    if (deployKeyPath) {
      const keyContent = await fs.readFile(deployKeyPath, "utf-8");
      connectConfig.privateKey = keyContent;
      console.log(`使用 SSH 密钥: ${deployKeyPath}`);
    } else if (deployPassword) {
      connectConfig.password = deployPassword;
      console.log(`使用密码认证`);
    } else {
      // 尝试使用默认密钥
      const defaultKeys = [
        path.join(process.env.HOME || process.env.USERPROFILE || "", ".ssh", "id_ed25519"),
        path.join(process.env.HOME || process.env.USERPROFILE || "", ".ssh", "id_rsa"),
      ];

      let keyFound = false;
      for (const keyPath of defaultKeys) {
        try {
          const keyContent = await fs.readFile(keyPath, "utf-8");
          connectConfig.privateKey = keyContent;
          console.log(`使用默认 SSH 密钥: ${keyPath}`);
          keyFound = true;
          break;
        } catch {
          // 继续尝试下一个密钥
        }
      }

      if (!keyFound) {
        throw new Error(
          "未配置认证方式！请在 .env.local 中设置 DEPLOY_PASSWORD 或 DEPLOY_SSH_KEY_PATH，或确保 ~/.ssh/id_ed25519 或 ~/.ssh/id_rsa 存在"
        );
      }
    }

    console.log(`正在连接到 ${deployHost}:${deployPort}...`);
    await sftp.connect(connectConfig);
    console.log("✓ 已连接\n");

    // 确保远程目录存在
    try {
      await sftp.mkdir(deployPath, true);
    } catch (error) {
      // 目录可能已存在，忽略错误
    }

    // 获取所有文件
    const files = await getAllFiles(distDir);
    console.log(`找到 ${files.length} 个文件需要上传\n`);

    let uploaded = 0;
    for (const file of files) {
      const remotePath = `${deployPath}/${file.relative}`;
      const remoteDir = path.dirname(remotePath).replace(/\\/g, "/");

      // 确保远程目录存在
      try {
        await sftp.mkdir(remoteDir, true);
      } catch {
        // 目录可能已存在
      }

      // 上传文件
      await sftp.put(file.absolute, remotePath);
      uploaded++;
      console.log(`[${uploaded}/${files.length}] ${file.relative}`);
    }

    console.log(`\n✅ 部署成功！已上传 ${uploaded} 个文件`);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`SFTP 部署失败: ${error.message}`);
    }
    throw error;
  } finally {
    await sftp.end();
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
