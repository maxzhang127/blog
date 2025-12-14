import fs from "node:fs/promises";

/**
 *
 * @param error
 */
function isErrnoWithCode(error: unknown): error is { code: string } {
  return (
    !!error &&
    typeof error === "object" &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
  );
}

/**
 *
 * @param options
 * @param options.sourceDir
 * @param options.targetDir
 * @param options.backupDir
 */
export async function atomicReplaceDirectory(options: {
  sourceDir: string;
  targetDir: string;
  backupDir: string;
}): Promise<void> {
  const { sourceDir, targetDir, backupDir } = options;

  await fs.rm(backupDir, { recursive: true, force: true });

  try {
    try {
      await fs.rename(targetDir, backupDir);
    } catch (error) {
      if (!isErrnoWithCode(error) || error.code !== "ENOENT") {
        throw error;
      }
    }

    await fs.rename(sourceDir, targetDir);
    await fs.rm(backupDir, { recursive: true, force: true });
  } catch (error) {
    // 尝试清理源目录，失败不影响主错误
    try {
      await fs.rm(sourceDir, { recursive: true, force: true });
    } catch {
      // 清理失败不影响错误处理
    }

    // 尝试回滚到备份，失败不影响主错误
    try {
      await fs.rm(targetDir, { recursive: true, force: true });
      await fs.rename(backupDir, targetDir);
    } catch {
      // 回滚失败不影响错误处理
    }

    throw error;
  }
}
