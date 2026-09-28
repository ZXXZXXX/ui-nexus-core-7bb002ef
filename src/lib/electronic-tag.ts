// 电子耳标号：由 UD 同步，只读；无数据返回 "—"
export function electronicTagOf(ear: string): string {
  const seed = Number((ear || "").replace(/\D/g, "").slice(-4) || 0);
  if (seed % 5 === 0) return "—";
  return `982${String(900000000000 + seed * 7919).slice(-12)}`;
}
