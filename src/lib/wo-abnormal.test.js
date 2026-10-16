import { describe, expect, it } from "bun:test";
import {
  WEIGHT_BANDS,
  evidenceRequired,
  expectedDose,
  hasVarCalc,
  medScanReady,
} from "./wo-abnormal";

const weightDrug = { name: "头孢", spec: "100ml/瓶", manufacturer: "x", use: "肌肉注射", dose: "4.4mL/100kg", method: "1天1次", qty: "1 瓶", isPrescription: true, isSpecial: false, kind: "drug" };
const udderDrug = { name: "乳房药", spec: "20ml/支", manufacturer: "x", use: "乳房灌注", dose: "20mL", method: "1天1次", qty: "1 支", isPrescription: true, isSpecial: false, kind: "drug" };
const fixedDrug = { name: "固定量药", spec: "10ml/支", manufacturer: "x", use: "静脉推注", dose: "25mL", method: "1天1次", qty: "1 支", isPrescription: true, isSpecial: false, kind: "drug" };

const base = { hasMed: true, unableMed: false, unableReason: "", unablePhotos: 0, pickupClaimed: true, missingScans: 0 };

describe("用药异常：两个选项对提交校验的不同影响", () => {
  it("计算参数调整改变需要校验的用量", () => {
    const band = WEIGHT_BANDS.find((b) => b.label === "<300kg");
    expect(expectedDose({ drug: weightDrug, mode: "param", baseWeight: 500, bandKg: band?.kg, blindTeats: 0, batchCount: 1, origDoseText: "22mL / 次" }).dose).toBe("11mL / 次");
  });

  it("计算参数调整按非盲乳数换算乳房给药用量", () => {
    expect(expectedDose({ drug: udderDrug, mode: "param", baseWeight: 500, blindTeats: 1, batchCount: 1, origDoseText: "20mL / 次" }).dose).toBe("60mL（3 个乳区）");
  });

  it("计算参数调整不放开任何提交限制", () => {
    expect(medScanReady({ ...base, mode: "param", partialReason: "", missingScans: 1 })).toBe(false);
    expect(medScanReady({ ...base, mode: "param", partialReason: "", pickupClaimed: false })).toBe(false);
    expect(medScanReady({ ...base, mode: "param", partialReason: "" })).toBe(true);
  });

  it("部分药品未使用不改变需要校验的用量", () => {
    const band = WEIGHT_BANDS.find((b) => b.label === "<300kg");
    expect(expectedDose({ drug: weightDrug, mode: "partial", baseWeight: 500, bandKg: band?.kg, blindTeats: 0, batchCount: 1, origDoseText: "22mL / 次", origTotalText: "264mL" })).toEqual({ dose: "22mL / 次", total: "264mL" });
  });

  it("部分药品未使用只在原因填写后放开提交限制", () => {
    expect(medScanReady({ ...base, mode: "partial", partialReason: "牛只应激无法继续注射", pickupClaimed: false, missingScans: 3 })).toBe(true);
    expect(medScanReady({ ...base, mode: "partial", partialReason: "   ", missingScans: 3 })).toBe(false);
  });

  it("部分药品未使用时未录入药品不强制上传照片", () => {
    expect(evidenceRequired({ hasMed: true, mode: "partial", unableMed: false, scannedMeds: 0 })).toBe(false);
    expect(evidenceRequired({ hasMed: true, mode: "none", unableMed: false, scannedMeds: 0 })).toBe(true);
  });

  it("不涉及变量计算的处方不开放计算参数调整", () => {
    expect(hasVarCalc([fixedDrug])).toBe(false);
    expect(hasVarCalc([fixedDrug, weightDrug])).toBe(true);
    expect(hasVarCalc([fixedDrug, udderDrug])).toBe(true);
  });
});
