import { describe, it, expect } from "vitest";
import { toIsoDate, asOptionalString, asOptionalStringArray } from "./validators";

describe("toIsoDate", () => {
  it("应该将有效的日期字符串转换为 ISO 格式", () => {
    const result = toIsoDate("2024-01-15", "createdAt", "test.md");
    expect(result).toBe("2024-01-15T00:00:00.000Z");
  });

  it("应该将有效的 Date 对象转换为 ISO 格式", () => {
    const date = new Date("2024-01-15T10:30:00Z");
    const result = toIsoDate(date, "createdAt", "test.md");
    expect(result).toBe("2024-01-15T10:30:00.000Z");
  });

  it("应该在日期字符串无效时抛出错误", () => {
    expect(() => {
      toIsoDate("invalid-date", "createdAt", "test.md");
    }).toThrow("test.md: invalid createdAt date: invalid-date");
  });

  it("应该在日期字符串为空时抛出错误", () => {
    expect(() => {
      toIsoDate("", "createdAt", "test.md");
    }).toThrow("test.md: missing or invalid createdAt");
  });

  it("应该在日期字符串只有空格时抛出错误", () => {
    expect(() => {
      toIsoDate("   ", "createdAt", "test.md");
    }).toThrow("test.md: missing or invalid createdAt");
  });

  it("应该在 Date 对象无效时抛出错误", () => {
    const invalidDate = new Date("invalid");
    expect(() => {
      toIsoDate(invalidDate, "createdAt", "test.md");
    }).toThrow("test.md: invalid createdAt date");
  });

  it("应该在值为 undefined 时抛出错误", () => {
    expect(() => {
      toIsoDate(undefined, "createdAt", "test.md");
    }).toThrow("test.md: missing or invalid createdAt");
  });

  it("应该在值为 null 时抛出错误", () => {
    expect(() => {
      toIsoDate(null, "createdAt", "test.md");
    }).toThrow("test.md: missing or invalid createdAt");
  });

  it("应该在值为数字时抛出错误", () => {
    expect(() => {
      toIsoDate(123456789, "createdAt", "test.md");
    }).toThrow("test.md: missing or invalid createdAt");
  });
});

describe("asOptionalString", () => {
  it("应该返回非空字符串", () => {
    expect(asOptionalString("hello")).toBe("hello");
  });

  it("应该去除首尾空格", () => {
    expect(asOptionalString("  hello  ")).toBe("hello");
  });

  it("应该在字符串为空时返回 undefined", () => {
    expect(asOptionalString("")).toBeUndefined();
  });

  it("应该在字符串只有空格时返回 undefined", () => {
    expect(asOptionalString("   ")).toBeUndefined();
  });

  it("应该在值为 undefined 时返回 undefined", () => {
    expect(asOptionalString(undefined)).toBeUndefined();
  });

  it("应该在值为 null 时返回 undefined", () => {
    expect(asOptionalString(null)).toBeUndefined();
  });

  it("应该在值为数字时返回 undefined", () => {
    expect(asOptionalString(123)).toBeUndefined();
  });

  it("应该在值为对象时返回 undefined", () => {
    expect(asOptionalString({ key: "value" })).toBeUndefined();
  });

  it("应该在值为数组时返回 undefined", () => {
    expect(asOptionalString(["hello"])).toBeUndefined();
  });
});

describe("asOptionalStringArray", () => {
  it("应该返回字符串数组", () => {
    expect(asOptionalStringArray(["tag1", "tag2", "tag3"])).toEqual(["tag1", "tag2", "tag3"]);
  });

  it("应该去除数组中每个字符串的首尾空格", () => {
    expect(asOptionalStringArray([" tag1 ", "  tag2", "tag3  "])).toEqual(["tag1", "tag2", "tag3"]);
  });

  it("应该过滤掉非字符串元素", () => {
    expect(asOptionalStringArray(["tag1", 123, "tag2", null, "tag3", undefined])).toEqual([
      "tag1",
      "tag2",
      "tag3",
    ]);
  });

  it("应该在所有元素都是非字符串时返回 undefined", () => {
    expect(asOptionalStringArray([123, null, undefined, {}])).toBeUndefined();
  });

  it("应该在数组为空时返回 undefined", () => {
    expect(asOptionalStringArray([])).toBeUndefined();
  });

  it("应该在值不是数组时返回 undefined", () => {
    expect(asOptionalStringArray("not an array")).toBeUndefined();
  });

  it("应该在值为 undefined 时返回 undefined", () => {
    expect(asOptionalStringArray(undefined)).toBeUndefined();
  });

  it("应该在值为 null 时返回 undefined", () => {
    expect(asOptionalStringArray(null)).toBeUndefined();
  });

  it("应该在值为对象时返回 undefined", () => {
    expect(asOptionalStringArray({ key: "value" })).toBeUndefined();
  });

  it("应该处理包含空字符串的数组", () => {
    expect(asOptionalStringArray(["tag1", "", "tag2", "   "])).toEqual(["tag1", "tag2"]);
  });
});
