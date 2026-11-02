/**
 * 工单体征数据（体温 / 血酮）的展示规则。
 * 小程序上报与诊断表单都可选填这两项，PC 与小程序的「上报记录」「诊断记录」需原样回显。
 */
export type Vitals = { temperature?: number; ketone?: number };

/** 体温正常上限（℃），超过视为偏高 */
export const TEMP_HIGH = 39.3;
/** 血酮提示亚临床酮病的阈值（mmol/L） */
export const KETONE_HIGH = 1.2;

/** 从上报/诊断文本里解析已填写的体温、血酮（演示数据用） */
export function parseVitals(...texts: (string | undefined | null)[]): Vitals {
  const s = texts.filter(Boolean).join(" ");
  const t = s.match(/体温\s*(?:回升至\s*)?(\d{2}(?:\.\d+)?)\s*℃/);
  const k = s.match(/血酮\s*(\d+(?:\.\d+)?)/);
  return {
    temperature: t ? Number(t[1]) : undefined,
    ketone: k ? Number(k[1]) : undefined,
  };
}

export function isTempHigh(v?: number) {
  return v !== undefined && v > TEMP_HIGH;
}

export function isKetoneHigh(v?: number) {
  return v !== undefined && v >= KETONE_HIGH;
}

export function fmtTemp(v?: number) {
  return v === undefined ? "未填写" : `${v.toFixed(1)} ℃`;
}

export function fmtKetone(v?: number) {
  return v === undefined ? "未填写" : `${v.toFixed(1)} mmol/L`;
}
