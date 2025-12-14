/**
 * 将 ISO 8601 日期字符串格式化为中文友好的显示格式。
 *
 * @param isoDate - ISO 8601 格式的日期字符串（如 "2024-01-15T00:00:00.000Z"）
 * @returns 格式化后的日期字符串（如 "2024年1月15日"）
 *
 * @example
 * ```typescript
 * formatDate("2024-01-15T00:00:00.000Z") // => "2024年1月15日"
 * formatDate("2024-12-05T08:30:00.000Z") // => "2024年12月5日"
 * ```
 */
export function formatDate(isoDate: string): string {
  const date = new Date(isoDate);

  // 检查日期是否有效
  if (isNaN(date.getTime())) {
    return isoDate; // 如果无效，返回原始字符串
  }

  const year = date.getFullYear();
  const month = date.getMonth() + 1; // getMonth() 返回 0-11
  const day = date.getDate();

  return `${year}年${month}月${day}日`;
}
