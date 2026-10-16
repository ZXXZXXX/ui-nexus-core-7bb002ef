// 用药异常规则：两个互斥选项对「提交记录」校验的影响完全不同
// - 计算参数调整（param）：改变需要校验的内容（期望用量按新参数重算），不放开任何提交限制
// - 部分药品未使用（partial）：不改变校验内容，仅放开提交限制（原因必填）
// 页面（m.health.$id.tsx）与规则测试共用这里的判断，避免两处口径不一致。

import { type PlanDrug, actualDoseText, totalDoseText } from "./wo-plan";

export type AbnormalMode = "none" | "param" | "partial";

/** 用药异常：可选体重区间（取区间代表体重重新计算用量） */
export const WEIGHT_BANDS: { label: string; kg: number }[] = [
  { label: "<300kg", kg: 250 },
  { label: "300–450kg", kg: 400 },
  { label: "450–600kg", kg: 550 },
  { label: ">600kg", kg: 650 },
];

const TEAT_TOTAL = 4;

/** 乳房给药（乳房灌注、乳头管注入等） */
export const isUdderUse = (use?: string) => Boolean(use && /乳/.test(use));

/** 按体重折算的剂量写法：每 100kg 多少 或 每 kg 多少 */
export const isWeightDose = (dose: string) => /\/\s*(100\s*)?kg/i.test(dose);

/** 处方是否涉及变量计算：只有涉及才允许选择「计算参数调整」 */
export const hasVarCalc = (drugs: PlanDrug[]) =>
  drugs.some((d) => isWeightDose(d.dose) || isUdderUse(d.use));

/** 非盲乳乳区数 */
export const activeTeatCount = (blindTeats: number) => Math.max(0, TEAT_TOTAL - blindTeats);

/**
 * 本次任务应当校验的用量文本。
 * 只有「计算参数调整」会改变它；「部分药品未使用」保持原处方用量不变。
 */
export function expectedDose(o: {
  drug?: PlanDrug;
  mode: AbnormalMode;
  baseWeight: number;
  bandKg?: number;
  blindTeats: number;
  batchCount: number;
  origDoseText?: string;
  origTotalText?: string;
}): { dose?: string; total?: string } {
  if (o.mode !== "param" || !o.drug) return { dose: o.origDoseText, total: o.origTotalText };
  const weight = o.bandKg ?? o.baseWeight;
  let dose = actualDoseText(o.drug.dose, weight);
  if (isUdderUse(o.drug.use)) {
    const m = dose.match(/^([\d.]+)\s*(.*)$/);
    if (m) {
      const teats = activeTeatCount(o.blindTeats);
      dose = `${Math.round(parseFloat(m[1]) * teats * 10) / 10}${m[2]}（${teats} 个乳区）`;
    }
  }
  return { dose, total: totalDoseText(dose, o.batchCount) ?? undefined };
}

/** 药品板块是否满足提交条件 */
export function medScanReady(o: {
  hasMed: boolean;
  mode: AbnormalMode;
  unableMed: boolean;
  unableReason: string;
  unablePhotos: number;
  partialReason: string;
  pickupClaimed: boolean;
  missingScans: number;
}): boolean {
  if (!o.hasMed) return true;
  if (o.unableMed) return o.unableReason.trim().length > 0 && o.unablePhotos > 0;
  // 取消校验限制：原因填写即可提交，未录入药品不再逐个要求扫码
  if (o.mode === "partial") return o.partialReason.trim().length > 0;
  // 计算参数调整只换校验内容，扫码/领药要求照旧
  return o.pickupClaimed && o.missingScans === 0;
}

/** 治疗记录照片是否必填 */
export function evidenceRequired(o: {
  hasMed: boolean;
  mode: AbnormalMode;
  unableMed: boolean;
  scannedMeds: number;
}): boolean {
  return o.hasMed && !o.unableMed && (o.mode !== "partial" || o.scannedMeds > 0);
}
