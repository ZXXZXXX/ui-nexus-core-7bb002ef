import { describe, expect, it } from "bun:test";
import {
  hiddenAllocatedCattleCount,
  visibleAllocatedCattle,
} from "./loss-allocation";

const ears = [
  "01-24-2381",
  "01-24-2380",
  "01-24-2379",
  "01-24-2378",
  "01-24-2377",
  "01-24-2376",
  "01-24-2375",
];

describe("牛只均摊耳号折叠规则", () => {
  it("默认最多展示 5 个耳号", () => {
    expect(visibleAllocatedCattle(ears, false)).toEqual(ears.slice(0, 5));
  });

  it("显示超过 5 个的隐藏数量", () => {
    expect(hiddenAllocatedCattleCount(ears)).toBe(2);
  });

  it("展开后展示全部耳号", () => {
    expect(visibleAllocatedCattle(ears, true)).toEqual(ears);
  });
});