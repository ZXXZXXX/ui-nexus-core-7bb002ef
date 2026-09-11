/**
 * 药品用药天数限制（药品档案维护，处方配置时用于拦截）。
 * key 为药品展示名称。
 */
export type DrugDayLimit = { minDays?: number; maxDays?: number };

export const DRUG_DAY_LIMITS: Record<string, DrugDayLimit> = {
  "5%盐酸头孢噻呋注射液（畜可健）": { minDays: 3, maxDays: 5 },
  "复合维生素": { minDays: 5, maxDays: 7 },
  "伊维菌素注射液": { minDays: 1, maxDays: 3 },
  "口蹄疫疫苗 A 型": { minDays: 1, maxDays: 1 },
};

/** 取单个药品的天数限制 */
export function drugDayLimit(name?: string): DrugDayLimit {
  if (!name) return {};
  return DRUG_DAY_LIMITS[name] ?? {};
}

/** 一组药品（含替代药品）共同允许的最大用药天数：取各药品上限的最小值 */
export function maxDaysFor(names: (string | undefined)[]): number | undefined {
  const caps = names
    .map((n) => drugDayLimit(n).maxDays)
    .filter((v): v is number => typeof v === "number" && v > 0);
  return caps.length ? Math.min(...caps) : undefined;
}
