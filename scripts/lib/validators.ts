/**
 * Validates and converts a value to an ISO date string.
 *
 * @param value - The value to convert (Date object or string)
 * @param fieldName - The name of the field (for error messages)
 * @param filePath - The file path (for error messages)
 * @returns ISO date string
 * @throws Error if the value is invalid or cannot be converted to a date
 */
export function toIsoDate(value: unknown, fieldName: string, filePath: string): string {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new Error(`${filePath}: invalid ${fieldName} date`);
    }
    return value.toISOString();
  }

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${filePath}: missing or invalid ${fieldName}`);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${filePath}: invalid ${fieldName} date: ${value}`);
  }
  return date.toISOString();
}

/**
 * Converts a value to an optional trimmed string.
 *
 * Returns undefined if the value is not a string or is empty after trimming.
 *
 * @param value - The value to convert
 * @returns Trimmed string or undefined
 */
export function asOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

/**
 * Converts a value to an optional string array.
 *
 * Filters out non-string items and empty strings. Returns undefined if the
 * result is empty or the input is not an array.
 *
 * @param value - The value to convert
 * @returns String array or undefined
 */
export function asOptionalStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const strings = value
    .filter((item) => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  return strings.length > 0 ? strings : undefined;
}
