import { describe, it, expect } from "bun:test";
import {
  kbDiseaseWoType,
  symptomsForWoType,
  prescriptionsForWoType,
  symptomInWoType,
  rxInWoType,
  pruneForWoType,
} from "./disease-wo-type";

describe("疾病所属工单类型", () => {
  it("未选工单类型时没有可关联的症状和处方", () => {
    expect(symptomsForWoType("")).toHaveLength(0);
    expect(prescriptionsForWoType("")).toHaveLength(0);
  });
  it("疾病治疗工单下只列出疾病治疗处方", () => {
    const list = prescriptionsForWoType("疾病治疗");
    expect(list.length).toBeGreaterThan(0);
    expect(list.every((r) => r.kind === "disease")).toBe(true);
  });
  it("修蹄处方不能关联到疾病治疗工单", () => {
    expect(rxInWoType("RX-000072", "疾病治疗")).toBe(false);
    expect(rxInWoType("RX-000072", "修蹄")).toBe(true);
  });
  it("子宫炎症状属于疾病治疗工单，不属于免疫工单", () => {
    expect(symptomInWoType("SY-001", "疾病治疗")).toBe(true);
    expect(symptomInWoType("SY-001", "免疫")).toBe(false);
  });
  it("腐蹄病归属修蹄工单", () => {
    expect(kbDiseaseWoType({ id: "DZ-035003", cat: "DL-06", rx: [] })).toBe("修蹄");
  });
  it("切换工单类型会移除不属于新类型的症状与处方", () => {
    const r = pruneForWoType(
      { symptoms: [{ code: "SY-001" }], prescriptions: [{ code: "RX-000005" }, { code: "RX-000072" }] },
      "修蹄",
    );
    expect(r.symptoms).toHaveLength(0);
    expect(r.prescriptions.map((p) => p.code)).toEqual(["RX-000072"]);
    expect(r.removed).toBe(2);
  });
});
