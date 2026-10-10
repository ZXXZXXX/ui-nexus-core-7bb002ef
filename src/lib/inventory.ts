/**
 * 库存管理显示规则（唯一来源）
 * - 库存列表以「商品编码」为唯一维度，一个编码一行
 * - 常驻规则：药品只要有过入库记录，就常驻库存列表，即使当前库存为 0
 * - 默认按当前库存量倒序排列
 */

export type Status = "物资正常" | "物资临期" | "余量紧张";

export type Item = {
  sku: string; name: string; cat: string; spec: string; stock: number; min: number; price: number;
  unit: string; expiry: string; status: Status; updatedAt: string; purchaseDate: string;
  supplier: string; maker: string; approvalNo: string; batchNo: string; prodDate: string; shelfLife: string;
};

export const inventory: Item[] = [
  { sku: "01-00063", price: 48.50, name: "乳房炎抗生素 5mg", cat: "抗生素", spec: "100ml（含5g）/瓶", stock: 86, min: 50, unit: "盒", expiry: "2026-11", status: "物资正常", updatedAt: "2026-08-20", supplier: "华牧兽药供应链", maker: "齐鲁动物保健品有限公司", approvalNo: "兽药字(2024)010321", batchNo: "B24A0631", prodDate: "2024-11-08", shelfLife: "24 个月", purchaseDate: "2024-11-12" },
  { sku: "02-00214", price: 26.00, name: "口蹄疫疫苗 A 型", cat: "疫苗", spec: "50ml/瓶", stock: 12, min: 30, unit: "支", expiry: "2026-06", status: "余量紧张", updatedAt: "2026-08-19", supplier: "中牧生物", maker: "中牧实业股份有限公司", approvalNo: "兽药生字(2023)190024", batchNo: "V23F0912", prodDate: "2024-06-14", shelfLife: "24 个月", purchaseDate: "2024-06-20" },
  { sku: "03-00306", price: 132.00, name: "伊维菌素注射液", cat: "驱虫药", spec: "100ml（含1g）/瓶", stock: 48, min: 20, unit: "瓶", expiry: "2026-07", status: "物资临期", updatedAt: "2026-08-14", supplier: "华牧兽药供应链", maker: "河北远征药业有限公司", approvalNo: "兽药字(2022)070118", batchNo: "Y22C0455", prodDate: "2024-07-01", shelfLife: "24 个月", purchaseDate: "2024-07-05" },
  { sku: "04-00412", price: 9.80, name: "复合维生素注射液", cat: "营养类", spec: "10ml/支", stock: 120, min: 60, unit: "支", expiry: "2027-02", status: "物资正常", updatedAt: "2026-08-02", supplier: "瑞普生物", maker: "天津瑞普生物技术股份有限公司", approvalNo: "兽药字(2023)120507", batchNo: "N23K0088", prodDate: "2025-02-20", shelfLife: "24 个月", purchaseDate: "2025-02-25" },
  { sku: "05-00521", price: 75.00, name: "戊二醛消毒液", cat: "消毒类", spec: "5L/桶", stock: 18, min: 30, unit: "L", expiry: "2026-12", status: "余量紧张", updatedAt: "2026-07-21", supplier: "洁牧环境", maker: "山东洁牧生物科技有限公司", approvalNo: "兽药字(2024)150233", batchNo: "X24D0210", prodDate: "2024-12-05", shelfLife: "24 个月", purchaseDate: "2024-12-10" },
  { sku: "06-00633", price: 118.00, name: "氟尼新葡甲胺注射液", cat: "解热镇痛", spec: "100ml（含5g）/瓶", stock: 64, min: 25, unit: "瓶", expiry: "2026-10", status: "物资正常", updatedAt: "2026-07-15", supplier: "华牧兽药供应链", maker: "齐鲁动物保健品有限公司", approvalNo: "兽药字(2024)010902", batchNo: "F24B0177", prodDate: "2024-10-16", shelfLife: "24 个月", purchaseDate: "2024-10-20" },
  { sku: "01-00063", price: 52.00, name: "乳房炎抗生素 5mg", cat: "抗生素", spec: "100ml（含5g）/瓶", stock: 24, min: 50, unit: "盒", expiry: "2027-03", status: "物资正常", updatedAt: "2026-08-26", supplier: "华牧兽药供应链", maker: "齐鲁动物保健品有限公司", approvalNo: "兽药字(2024)010321", batchNo: "B25A0142", prodDate: "2025-03-12", shelfLife: "24 个月", purchaseDate: "2025-03-18" },
  { sku: "03-00306", price: 126.00, name: "伊维菌素注射液", cat: "驱虫药", spec: "100ml（含1g）/瓶", stock: 30, min: 20, unit: "瓶", expiry: "2027-01", status: "物资正常", updatedAt: "2026-08-22", supplier: "华牧兽药供应链", maker: "河北远征药业有限公司", approvalNo: "兽药字(2022)070118", batchNo: "Y25A0771", prodDate: "2025-01-09", shelfLife: "24 个月", purchaseDate: "2025-01-15" },
  // 已领用完，当前库存 0，但有过入库 → 仍常驻库存列表
  { sku: "07-00741", price: 18.00, name: "头孢噻呋钠注射液", cat: "抗生素", spec: "1g/瓶", stock: 0, min: 20, unit: "瓶", expiry: "2027-05", status: "余量紧张", updatedAt: "2026-08-25", supplier: "华牧兽药供应链", maker: "齐鲁动物保健品有限公司", approvalNo: "兽药字(2024)010455", batchNo: "C25B0330", prodDate: "2025-05-10", shelfLife: "24 个月", purchaseDate: "2025-05-16" },
  { sku: "08-00855", price: 6.50, name: "注射用缩宫素", cat: "催产类", spec: "10IU/支", stock: 0, min: 15, unit: "支", expiry: "2026-12", status: "余量紧张", updatedAt: "2026-08-18", supplier: "瑞普生物", maker: "天津瑞普生物技术股份有限公司", approvalNo: "兽药字(2023)120731", batchNo: "O25D0119", prodDate: "2024-12-18", shelfLife: "24 个月", purchaseDate: "2024-12-24" },
  // 已建档但从未入库 → 不进入库存列表
  { sku: "09-00912", price: 3.20, name: "硫酸阿托品注射液", cat: "急救类", spec: "2ml:1mg/支", stock: 0, min: 10, unit: "支", expiry: "2027-06", status: "物资正常", updatedAt: "2026-06-02", supplier: "中牧生物", maker: "中牧实业股份有限公司", approvalNo: "兽药字(2023)190388", batchNo: "A25E0007", prodDate: "2025-06-02", shelfLife: "24 个月", purchaseDate: "" },
];

/** 出入库流水（用于计算期初 / 期间 / 期末） */
export type Move = { sku: string; date: string; in: number; out: number };
export const moves: Move[] = [
  { sku: "01-00063", date: "2026-08-02", in: 40, out: 12 },
  { sku: "01-00063", date: "2026-08-20", in: 20, out: 18 },
  { sku: "02-00214", date: "2026-07-28", in: 30, out: 26 },
  { sku: "02-00214", date: "2026-08-19", in: 0, out: 14 },
  { sku: "03-00306", date: "2026-08-05", in: 24, out: 9 },
  { sku: "03-00306", date: "2026-08-14", in: 12, out: 15 },
  { sku: "04-00412", date: "2026-08-02", in: 60, out: 22 },
  { sku: "05-00521", date: "2026-07-21", in: 10, out: 26 },
  { sku: "06-00633", date: "2026-07-15", in: 36, out: 20 },
  { sku: "06-00633", date: "2026-08-11", in: 18, out: 10 },
  { sku: "07-00741", date: "2026-08-08", in: 30, out: 0 },
  { sku: "07-00741", date: "2026-08-25", in: 0, out: 30 },
  { sku: "08-00855", date: "2026-07-30", in: 40, out: 0 },
  { sku: "08-00855", date: "2026-08-18", in: 0, out: 40 },
];

export type Row = Item & { open: number; inQty: number; outQty: number; close: number };

export function buildRows(from: string, to: string): Row[] {
  const s = from ? Date.parse(from) : null;
  const e = to ? Date.parse(to) + 86399999 : null;
  return inventory.map((i) => {
    let inQty = 0;
    let outQty = 0;
    for (const m of moves) {
      if (m.sku !== i.sku) continue;
      const t = Date.parse(m.date);
      if (s !== null && t < s) continue;
      if (e !== null && t > e) continue;
      inQty += m.in;
      outQty += m.out;
    }
    const close = i.stock;
    return { ...i, inQty, outQty, close, open: close - inQty + outQty };
  });
}

/** 单个药品在时间范围内的每日出入库与结存 */
export function buildDaily(row: Row, from: string, to: string) {
  const ms = moves.filter((m) => m.sku === row.sku);
  const s = from ? Date.parse(from) : null;
  const e = to ? Date.parse(to) + 86399999 : null;
  const inRange = ms.filter((m) => {
    const t = Date.parse(m.date);
    return (s === null || t >= s) && (e === null || t <= e);
  });
  if (!inRange.length) {
    const d = to || from || new Date().toISOString().slice(0, 10);
    return [{ date: d, open: row.open, inQty: 0, outQty: 0, close: row.open }];
  }
  const dates = inRange.map((m) => Date.parse(m.date)).sort((a, b) => a - b);
  const start = s ?? dates[0];
  const end = e !== null ? e - 86399999 : dates[dates.length - 1];
  const out: { date: string; open: number; inQty: number; outQty: number; close: number }[] = [];
  let open = row.open;
  for (let t = start; t <= end; t += 86400000) {
    const date = new Date(t).toISOString().slice(0, 10);
    const day = inRange.filter((m) => m.date === date);
    const inQty = day.reduce((a, m) => a + m.in, 0);
    const outQty = day.reduce((a, m) => a + m.out, 0);
    const close = open + inQty - outQty;
    out.push({ date, open, inQty, outQty, close });
    open = close;
  }
  return out;
}

/* ------------------------------ 出入库记录 ------------------------------ */

export type Rec = { date: string; qty: number; via: string; operator: string; note?: string; batch?: string };

export const inbound: Record<string, Rec[]> = {
  "01-00063": [
    { date: "2026-08-20 09:12", qty: 20, via: "调拨入库", operator: "王磊", note: "", batch: "B25A0142" },
    { date: "2026-08-02 14:30", qty: 40, via: "采购入库", operator: "李静" },
  ],
  "02-00214": [
    { date: "2026-08-06 11:20", qty: 2, via: "盘点差异入库", operator: "赵敏", note: "月度盘点实物多于账面，调增 2" },
    { date: "2026-07-28 10:05", qty: 30, via: "采购入库", operator: "李静" },
  ],
  "03-00306": [
    { date: "2026-08-14 08:40", qty: 12, via: "退料入库", operator: "赵敏", note: "三级库未用完退回", batch: "Y25A0771" },
    { date: "2026-08-05 16:20", qty: 24, via: "调拨入库", operator: "王磊" },
  ],
  "04-00412": [{ date: "2026-08-02 11:00", qty: 60, via: "采购入库", operator: "李静" }],
  "05-00521": [{ date: "2026-07-21 09:30", qty: 10, via: "调拨入库", operator: "王磊" }],
  "06-00633": [
    { date: "2026-08-11 15:10", qty: 18, via: "退料入库", operator: "赵敏" },
    { date: "2026-08-01 10:15", qty: 3, via: "盘点差异入库", operator: "赵敏", note: "上期漏记入库，盘点后补入 3" },
    { date: "2026-07-15 09:00", qty: 36, via: "采购入库", operator: "李静" },
  ],
  "07-00741": [{ date: "2026-08-08 09:20", qty: 30, via: "采购入库", operator: "李静", batch: "C25B0330" }],
  "08-00855": [{ date: "2026-07-30 10:40", qty: 40, via: "调拨入库", operator: "王磊", batch: "O25D0119" }],
};

export const outbound: Record<string, Rec[]> = {
  "01-00063": [
    { date: "2026-08-20 17:40", qty: 18, via: "用药领取", operator: "陈涛", note: "", batch: "B25A0142" },
    { date: "2026-08-10 18:30", qty: 1, via: "盘点差异\n", operator: "赵敏", note: "" },
    { date: "2026-08-02 18:05", qty: 12, via: "用药领取", operator: "陈涛" },
  ],
  "02-00214": [
    { date: "2026-08-19 16:22", qty: 14, via: "用药领取", operator: "刘洋" },
    { date: "2026-07-28 17:50", qty: 26, via: "用药领取", operator: "刘洋" },
  ],
  "03-00306": [
    { date: "2026-08-14 17:15", qty: 15, via: "盘点损耗", operator: "赵敏", note: "储存保管破损", batch: "Y25A0771" },
    { date: "2026-08-05 18:00", qty: 9, via: "用药领取", operator: "陈涛" },
  ],
  "04-00412": [
    { date: "2026-08-08 17:05", qty: 2, via: "盘点差异\n", operator: "赵敏", note: "账实不符，按盘点结果调减 2" },
    { date: "2026-08-02 18:20", qty: 22, via: "用药领取", operator: "陈涛" },
  ],
  "05-00521": [{ date: "2026-07-21 17:30", qty: 26, via: "盘点损耗", operator: "赵敏", note: "取药配药洒漏" }],
  "06-00633": [
    { date: "2026-08-11 17:55", qty: 10, via: "用药领取", operator: "刘洋" },
    { date: "2026-07-15 18:10", qty: 20, via: "用药领取", operator: "陈涛" },
  ],
  "07-00741": [{ date: "2026-08-25 16:40", qty: 30, via: "用药领取", operator: "陈涛", note: "全群乳房炎治疗领用", batch: "C25B0330" }],
  "08-00855": [{ date: "2026-08-18 15:25", qty: 40, via: "用药领取", operator: "刘洋", batch: "O25D0119" }],
};

export type Flow = Rec & { dir: "in" | "out" };

export function buildFlows(sku: string): Flow[] {
  const first = inventory.find((i) => i.sku === sku)?.batchNo;
  return [
    ...(inbound[sku] ?? []).map((r) => ({ ...r, dir: "in" as const })),
    ...(outbound[sku] ?? []).map((r) => ({ ...r, dir: "out" as const })),
  ]
    .map((r) => ({ ...r, batch: r.batch ?? first }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** 该药品是否有过入库记录 */
export function hasInbound(sku: string): boolean {
  return (inbound[sku] ?? []).length > 0;
}

/** 以商品编码为唯一维度的库存行 */
export type SkuRow = {
  sku: string; name: string; spec: string; unit: string; stock: number;
  lastInDate: string; lastInQty: number | null; lastOutDate: string; lastOutQty: number | null;
  batches: Item[];
};

/**
 * 库存列表行：
 * - 同一商品编码合并为一行，当前库存为该编码下所有批次合计
 * - 常驻规则：有过入库记录的药品保留在列表中（当前库存为 0 也保留）；
 *   从未入库的药品不进入库存列表
 */
/** 按规则列排序（仅数值列） */
export function sortSkuRows(rows: SkuRow[], sort = DEFAULT_INVENTORY_SORT): SkuRow[] {
  const dir = sort.dir === "asc" ? 1 : -1;
  return [...rows].sort(
    (a, b) =>
      dir * ((a[sort.key as keyof SkuRow] as number) - (b[sort.key as keyof SkuRow] as number)),
  );
}

export function buildSkuRows(): SkuRow[] {
  const map = new Map<string, Item[]>();
  for (const i of inventory) map.set(i.sku, [...(map.get(i.sku) ?? []), i]);
  const rows: SkuRow[] = [];
  for (const [sku, batches] of map) {
    const stock = batches.reduce((a, b) => a + b.stock, 0);
    if (stock <= 0 && !hasInbound(sku)) continue;
    const flows = buildFlows(sku);
    const lastIn = flows.find((f) => f.dir === "in");
    const lastOut = flows.find((f) => f.dir === "out");
    const b0 = batches[0];
    rows.push({
      sku, name: b0.name, spec: b0.spec, unit: b0.unit, stock,
      lastInDate: lastIn?.date ?? "", lastInQty: lastIn?.qty ?? null,
      lastOutDate: lastOut?.date ?? "", lastOutQty: lastOut?.qty ?? null,
      batches: [...batches].sort((a, b) => a.expiry.localeCompare(b.expiry)),
    });
  }
  return rows;
}

/** 默认排序规则：按当前库存量倒序 */
export const DEFAULT_INVENTORY_SORT: { key: string; dir: "asc" | "desc" } = {
  key: "stock",
  dir: "desc",
};

/* --------------------------- 台账导出可选字段配置 --------------------------- */

export const LEDGER_OPTIONAL: { key: keyof Item; label: string }[] = [
  { key: "supplier", label: "供应商" },
  { key: "maker", label: "生产厂家" },
  { key: "approvalNo", label: "批准文号" },
  { key: "batchNo", label: "生产批号" },
  { key: "prodDate", label: "生产日期" },
  { key: "shelfLife", label: "保质期" },
];
