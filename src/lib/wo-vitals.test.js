import { describe, it, expect } from "bun:test";
import { parseVitals, isTempHigh, isKetoneHigh, fmtTemp, fmtKetone } from "./wo-vitals";

describe("工单体征数据", () => {
  it("从上报文本解析体温", () => {
    expect(parseVitals("产后子宫炎 · 体温 39.8℃").temperature).toBe(39.8);
  });
  it("解析血酮值", () => {
    expect(parseVitals("血酮 1.4 mmol/L").ketone).toBe(1.4);
  });
  it("未填写时显示「未填写」", () => {
    expect(fmtTemp(undefined)).toBe("未填写");
    expect(fmtKetone(undefined)).toBe("未填写");
  });
  it("体温超过 39.3℃ 视为偏高", () => {
    expect(isTempHigh(39.3)).toBe(false);
    expect(isTempHigh(39.4)).toBe(true);
  });
  it("血酮 ≥ 1.2 视为偏高", () => {
    expect(isKetoneHigh(1.1)).toBe(false);
    expect(isKetoneHigh(1.2)).toBe(true);
  });
});
