import { describe, expect, it } from "bun:test";
import { MESSAGE_CATEGORIES, categoryTag } from "./message-category";

describe("消息类型标签配色", () => {
  it("四类消息各对应一种颜色", () => {
    expect(MESSAGE_CATEGORIES.map(categoryTag)).toEqual([
      "tag-brand",
      "tag-info",
      "tag-warning",
      "tag-pink",
    ]);
  });

  it("四类颜色互不重复", () => {
    const tags = MESSAGE_CATEGORIES.map(categoryTag);
    expect(new Set(tags).size).toBe(MESSAGE_CATEGORIES.length);
  });

  it("未知类别退回中性灰", () => {
    expect(categoryTag("未分类")).toBe("tag-muted");
  });
});
