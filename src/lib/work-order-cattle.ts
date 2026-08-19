// 根据工单号推断对应牛只耳号，与 m.health.$id 中的映射保持一致。
// 用于转栏二次确认弹窗等需要展示具体牛只的场景。
const singleEarMap: Record<string, string> = {
  "WO-2298": "#01-24-2298",
  "WO-2410": "#01-24-2410",
  "WO-2420": "#01-24-2420",
  "WO-2430": "#01-24-2430",
  "WO-2440": "#01-24-2440",
  "HF-0702": "#01-24-2150",
  "HF-0688": "#01-24-2270",
  "PP-2501": "#01-24-2710",
};

export function getOrderEarTagLabel(id: string): string {
  if (singleEarMap[id]) return singleEarMap[id];
  if (id.startsWith("HF")) return "#01-24-2150";
  // 默认单只工单
  return "#01-24-2381";

}

export type ActiveOrderOption = {
  id: string;
  type: string;
  event: string;
  status: "待诊断" | "进行中";
  who: string;
  barn: string;
};

// 同一牛只上其他仍在「待诊断 / 执行中」的工单（用于异常终止-已转交其他工单）
const activeOrdersByEar: Record<string, ActiveOrderOption[]> = {
  "#01-24-2381": [
    { id: "HF-0711", type: "修蹄", event: "蹄底溃疡 · 清创引流", status: "进行中", who: "外部·张师傅", barn: "病牛舍" },
    { id: "WO-2391", type: "疾病治疗", event: "产道创伤 · 复诊待诊断", status: "待诊断", who: "—", barn: "产房 1 号" },
  ],
  "#01-24-2270": [
    { id: "WO-2299", type: "疾病治疗", event: "产后子宫炎 · 处方 1 疗程第 2 天", status: "进行中", who: "李雨晴", barn: "病牛舍" },
  ],
  "#01-24-2298": [
    { id: "HF-0705", type: "修蹄", event: "蹄底溃疡 · 清创引流", status: "进行中", who: "外部·张师傅", barn: "病牛舍" },
  ],
  "#01-24-2150": [
    { id: "WO-2372", type: "疾病治疗", event: "跛行复查 · 待诊断", status: "待诊断", who: "—", barn: "病牛舍" },
  ],
  "#01-24-2710": [
    { id: "PP-2510", type: "产后护理", event: "产后检查 · 第 4/14 天", status: "进行中", who: "周凯", barn: "产房 1 号" },
  ],
};

export function getActiveOrdersForEar(ear: string, excludeId?: string): ActiveOrderOption[] {
  return (activeOrdersByEar[ear] ?? []).filter((o) => o.id !== excludeId);
}
