import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Activity,
  Search,
  

  X,
  Send,
  Pill,
  Pencil,
  Trash2,
  Sparkles,
  CheckCircle2,
  
  Camera,
  Video,
  PlayCircle,
  Mic,
  Square,
  UserPlus,
  User,
  Repeat2,
  RefreshCw,
  FileText,
  ChevronDown,
  AlertTriangle,
  Package,
} from "lucide-react";
import { MobileShell } from "@/components/mobile-shell";


import { TagPicker } from "@/components/m/tag-picker";
import { DiseasePicker } from "@/components/disease-picker";
import { Switch } from "@/components/ui/switch";
import { getOrderEarTagLabel } from "@/lib/work-order-cattle";
import { CowProfileCard } from "@/components/m/cow-profile-card";






export const Route = createFileRoute("/m/health/$id_/diagnose")({
  head: () => ({ meta: [{ title: "诊断记录 · 奇点智牧" }] }),
  component: DiagnosePage,
});

// 上报时的症状（带入）
const reportedSymptoms = ["体温 39.8℃", "分泌物恶臭"];

// 候选症状词库（来自晟安标准处方 · 子宫炎类诊断要点）
const symptomLibrary = [
  "体温 > 39.5℃", "体温 39.8℃", "阴道黏膜层撕裂",
  "分泌物恶臭", "分泌物含 >50% 脓", "分泌物气味正常含脓",
  "直肠检查子宫异常", "产后 5 天以上", "产后 10 天内", "产后 21-28 天",
  "助产 3 分及以上", "双胎 / 死胎",
  "采食下降", "反刍减少", "精神沉郁",
];

// 疾病库（关联症状）；每个疾病可包含多个治疗处方方案
type Plan = { id: string; name: string; desc?: string; note?: string; items: Prescription[] };
type Disease = { name: string; symptoms: string[]; plans: Plan[] };
// 来源：晟安标准处方 · 子宫炎类（产道创伤 / 产后子宫炎 / 子宫内膜炎）
const diseaseLibrary: Disease[] = [
  {
    name: "产道创伤",
    symptoms: ["阴道黏膜层撕裂", "助产 3 分及以上"],
    plans: [
      {
        id: "p1",
        name: "处方 1 · 5% 头孢噻呋 + 氟尼辛",
        desc: "疗程 3-5 天；助产后凉水冲洗外阴 5 分钟，损伤处涂抹碘甘油每天 2 次连用 5 天",
        items: [
          { id: "r1", kind: "drug", name: "5% 盐酸头孢噻呋（畜可健）", maker: "礼蓝动保", spec: "100ml / 瓶", use: "肌肉注射", dose: "4.4", doseUnit: "ml", dosePer: "100kg", timesPerDay: "1", days: "3" },
          { id: "r2", kind: "drug", name: "氟尼辛葡甲胺（福欣安）", maker: "礼蓝动保", spec: "100ml / 瓶", use: "静脉推注", dose: "4", doseUnit: "ml", dosePer: "100kg", timesPerDay: "1", days: "3" },
        ],
      },
      {
        id: "p2",
        name: "处方 2 · 10% 头孢噻呋 + 氟尼辛",
        desc: "疗程 3-5 天，3 天 1 次给药；产道损伤 >5cm 须 PGA 可吸收线缝合，5 天后拆线",
        items: [
          { id: "r1", kind: "drug", name: "10% 盐酸头孢噻呋注射液（畜可健 / 欣利达）", maker: "礼蓝动保", spec: "100ml / 瓶", use: "肌肉注射", dose: "20", doseUnit: "ml", dosePer: "fixed", timesPerDay: "1", days: "1" },
          { id: "r2", kind: "drug", name: "氟尼辛葡甲胺（福欣安）", maker: "礼蓝动保", spec: "100ml / 瓶", use: "静脉推注", dose: "4", doseUnit: "ml", dosePer: "100kg", timesPerDay: "1", days: "3" },
        ],
      },
    ],
  },
  {
    name: "产后子宫炎",
    symptoms: ["体温 > 39.5℃", "体温 39.8℃", "分泌物恶臭", "分泌物含 >50% 脓", "分泌物气味正常含脓", "产后 10 天内", "产后 5 天以上"],
    plans: [
      {
        id: "p1",
        name: "处方 1 · 青霉素钠 + 氟尼辛",
        desc: "产后 10 天内；青霉素钠 2.2 万单位/kg，1 天 2 次连用 3 天",
        items: [
          { id: "r1", kind: "drug", name: "注射用青霉素钠（联治灵）", maker: "联治灵", spec: "2.4g / 瓶", use: "肌肉注射", dose: "2.4", doseUnit: "g", dosePer: "fixed", timesPerDay: "2", days: "3", isSpecialDrug: true },
          { id: "r2", kind: "drug", name: "氟尼辛葡甲胺（福欣安）", maker: "礼蓝动保", spec: "100ml / 瓶", use: "静脉推注", dose: "4", doseUnit: "ml", dosePer: "100kg", timesPerDay: "1", days: "3" },
        ],
      },
      {
        id: "p2",
        name: "处方 2 · 5% 头孢噻呋 + 氟尼辛",
        desc: "产后 10 天内，1 天 1 次连用 3 天",
        items: [
          { id: "r1", kind: "drug", name: "5% 盐酸头孢噻呋（畜可健）", maker: "礼蓝动保", spec: "100ml / 瓶", use: "肌肉注射", dose: "4.4", doseUnit: "ml", dosePer: "100kg", timesPerDay: "1", days: "3" },
          { id: "r2", kind: "drug", name: "氟尼辛葡甲胺（福欣安）", maker: "礼蓝动保", spec: "100ml / 瓶", use: "静脉推注", dose: "4", doseUnit: "ml", dosePer: "100kg", timesPerDay: "1", days: "3" },
        ],
      },
      {
        id: "p3",
        name: "处方 3 · 10% 头孢噻呋 + 利福昔明灌注",
        desc: "产后 5 天以上；辅助利福昔明子宫灌注 100 mL/次，2 天一次连用 2-3 次",
        items: [
          { id: "r1", kind: "drug", name: "10% 盐酸头孢噻呋注射液（畜可健 / 欣利达）", maker: "礼蓝动保", spec: "100ml / 瓶", use: "肌肉注射", dose: "20", doseUnit: "ml", dosePer: "fixed", timesPerDay: "1", days: "1" },
          { id: "r2", kind: "drug", name: "氟尼辛葡甲胺（福欣安）", maker: "礼蓝动保", spec: "100ml / 瓶", use: "静脉推注", dose: "4", doseUnit: "ml", dosePer: "100kg", timesPerDay: "1", days: "3" },
          { id: "r3", kind: "drug", name: "利福昔明子宫注入剂（澳利舒）", maker: "澳利舒", spec: "100ml / 瓶", use: "乳房灌注", dose: "100", doseUnit: "ml", dosePer: "fixed", timesPerDay: "1", days: "2" },
        ],
      },
    ],
  },
  {
    name: "子宫内膜炎",
    symptoms: ["直肠检查子宫异常", "分泌物含 >50% 脓", "分泌物气味正常含脓", "产后 21-28 天"],
    plans: [
      {
        id: "p1",
        name: "处方 1 · 青霉素钠 + 氟尼辛",
        desc: "产后 21-28 天；直肠按压排脓后用药。青霉素钠肌注 1 天 2 次连用 3 天；氟尼辛葡甲胺静注 1 天 1 次连用 3 天",
        items: [
          { id: "r1", kind: "drug", name: "注射用青霉素钠（联治灵 400 万 / 远征 400 万 / 联治灵 1600 万）", maker: "联治灵 / 远征", spec: "2.4g / 瓶", use: "肌肉注射", dose: "2.4", doseUnit: "g", dosePer: "fixed", timesPerDay: "2", days: "3", isSpecialDrug: true, usageMethod: "1 天 2 次，连用 3 天", doseByWeight: "200–400kg=2.4g；400–600kg=4.8g；600–900kg=7.2g；≥900kg=9.6g" },
          { id: "r2", kind: "drug", name: "氟尼辛葡甲胺注射液（福欣安）", maker: "礼蓝动保", spec: "100ml / 瓶", use: "静脉注射", dose: "20", doseUnit: "ml", dosePer: "fixed", timesPerDay: "1", days: "3", usageMethod: "1 天 1 次，连用 3 天", doseByWeight: "200–400kg=10ml；400–600kg=20ml；600–900kg=30ml；≥900kg=35ml" },
        ],
      },

      {
        id: "p2",
        name: "处方 2 · 利福昔明子宫灌注",
        desc: "利福昔明 100 mL/次，2 天 1 次连用 2-3 次",
        items: [
          { id: "r1", kind: "drug", name: "利福昔明子宫注入剂（澳利舒）", maker: "澳利舒", spec: "100ml / 瓶", use: "乳房灌注", dose: "100", doseUnit: "ml", dosePer: "fixed", timesPerDay: "1", days: "2" },
        ],
      },
    ],
  },
];

// 牛只体重档位（用于自动计算剂量）
const WEIGHT_OPTIONS: { label: string; value: number }[] = [
  { label: "200～400 kg", value: 300 },
  { label: "400～600 kg", value: 500 },
  { label: "600～900 kg", value: 750 },
  { label: "900 kg 以上", value: 1000 },
];
const weightLabelOf = (v: number | null) =>
  v == null ? null : WEIGHT_OPTIONS.find((o) => o.value === v)?.label ?? `${v} kg`;

// 库存（仓库实时在册量；用于提交校验）
// packSize / packUnit 用于按规格换算展示（如 "6 瓶"、"2 支"）
const drugStock: Record<string, { qty: number; unit: string; packSize?: number; packUnit?: string }> = {
  "氟尼辛葡甲胺注射液": { qty: 120, unit: "ml", packSize: 100, packUnit: "瓶" },
  "头孢噻呋钠": { qty: 2, unit: "g", packSize: 1, packUnit: "支" }, // 故意偏少，触发缺药提示
  "碳酸氢钠": { qty: 5000, unit: "g", packSize: 500, packUnit: "袋" },
  "复合维生素 B": { qty: 800, unit: "ml", packSize: 100, packUnit: "瓶" },
  "50% 葡萄糖": { qty: 2000, unit: "ml", packSize: 500, packUnit: "瓶" },
  "口服补液盐": { qty: 30, unit: "包", packSize: 1, packUnit: "包" },
  "氟尼辛葡甲胺": { qty: 200, unit: "ml", packSize: 100, packUnit: "瓶" },
  "5% 盐酸头孢噻呋（畜可健）": { qty: 600, unit: "ml", packSize: 100, packUnit: "瓶" },
  "10% 盐酸头孢噻呋注射液（畜可健）": { qty: 400, unit: "ml", packSize: 100, packUnit: "瓶" },
  "10% 盐酸头孢噻呋注射液（欣利达）": { qty: 0, unit: "ml", packSize: 100, packUnit: "瓶" },
  "氟尼辛葡甲胺（福欣安）": { qty: 600, unit: "ml", packSize: 100, packUnit: "瓶" },
};

// 库存展示：优先按规格换算成整数包装数量（如 "6 瓶"），无 packSize 时回退到原始量
function formatStockDisplay(name: string): string {
  const s = drugStock[name];
  if (!s) return "暂无库存";
  if (s.qty <= 0) return "暂无库存";
  if (s.packSize && s.packUnit) {
    const packs = Math.floor(s.qty / s.packSize);
    if (packs > 0) return `库存 ${packs} ${s.packUnit}`;
  }
  return `库存 ${s.qty}${s.unit}`;
}


// 用药/疾病规则限制（提交时触发二次确认）
const RULES = {
  diseaseReportMax: 2,         // 同一疾病累计上报次数上限
  drugTotalDoseFactorMax: 3,   // 累计剂量相对单次基准的倍数上限
  drugUsageCountMax: 5,        // 同一药品累计使用次数上限
};

// 本牛只历史用药/上报（模拟）
const cattleHistory = {
  diseaseCount: { "产后子宫炎": 1, "子宫内膜炎": 1 } as Record<string, number>,
  drugUsage: {
    "注射用青霉素钠（联治灵）": { totalDose: 4.8, unit: "g", count: 4 },
    "氟尼辛葡甲胺（福欣安）": { totalDose: 24, unit: "ml", count: 3 },
  } as Record<string, { totalDose: number; unit: string; count: number }>,
};


type SlotKey = "morning" | "noon" | "evening";
const SLOT_LABEL: Record<SlotKey, string> = {
  morning: "上午",
  noon: "中午",
  evening: "晚上",
};

type Prescription = {
  id: string;
  kind: "drug" | "therapy";
  name: string;
  days: string;
  // 用药处方
  maker?: string;
  spec?: string;
  use?: string;
  dose?: string;
  doseUnit?: string;
  timesPerDay?: string;
  // 是否区分时间段
  splitTime?: boolean;
  slots?: Partial<Record<SlotKey, string>>;
  // 治疗手段
  therapyMethod?: string;
  frequency?: string;
  // 剂量换算方式：默认按 500kg 体重基准换算
  dosePer?: "100kg" | "500kg" | "fixed";
  // 是否属于特殊药品（仅在特殊处方中显示「特殊」标签）
  isSpecialDrug?: boolean;
  // 用药方法（覆盖 "N 次/天 · 连用 M 天" 的默认显示，例如 "3 天 1 次"）
  usageMethod?: string;
  // 按体重区间给药（覆盖自动/固定剂量显示）
  doseByWeight?: string;
  // 按非盲乳数给药（乳注类，与体重无关）
  doseByQuarter?: string;
  // 药品品牌备选（当同一处方允许多个厂商 / 品牌互替时提供）
  alternatives?: string[];
};

// 解析 "10% 盐酸头孢噻呋注射液（畜可健 / 欣利达）" -> 前缀 + 多品牌
function parseBrandAlternatives(name: string): { prefix: string; brands: string[] } | null {
  const m = name.match(/^(.*?)（([^（）]+)）\s*$/);
  if (!m) return null;
  const inner = m[2];
  if (!/[\/／]/.test(inner)) return null;
  const brands = inner.split(/[\/／]/).map((s) => s.trim()).filter(Boolean);
  if (brands.length < 2) return null;
  return { prefix: m[1].trim(), brands };
}

function pickDefaultBrand(prefix: string, brands: string[]): string {
  const withStock = brands.filter((b) => (drugStock[`${prefix}（${b}）`]?.qty ?? 0) > 0);
  const pool = withStock.length > 0 ? withStock : [...brands];
  pool.sort((a, b) => a.localeCompare(b, "zh"));
  return pool[0];
}

// 体重相关剂量计算（mL/g 等）。fixed 表示单次固定剂量
function computePerDose(r: Prescription, w: number): number {
  const base = parseFloat(r.dose || "0");
  if (Number.isNaN(base) || base <= 0) return 0;
  if (r.dosePer === "fixed") return base;
  if (r.dosePer === "100kg") return Math.round(base * (w / 100) * 10) / 10;
  return Math.round(base * (w / 500) * 10) / 10;
}

// === 产后护理：固定症状池、固定结论、固定标准处方 ===
export const POSTPARTUM_NORMAL_TAG = "一切正常";
const POSTPARTUM_SYMPTOMS = [
  POSTPARTUM_NORMAL_TAG,
  "产犊难易度 ≥ 3",
  "产道损伤等级 ≥ 2",
  "产犊数量 ≥ 2",
  "犊牛体重 ≥ 45kg",
  "犊牛为「死胎」",
  "早产",
  "双胎或以上",
  "胎衣不下",
];

// 产犊记录 → 症状映射（产后护理待诊断工单会自动带入）
type CalvingRecord = {
  difficulty: number;      // 产犊难易度评分 0-4
  injury: number;          // 产道损伤等级 1-3
  calfCount: number;       // 产犊数量
  calfWeightMax: number;   // 最重犊牛体重 kg
  stillbirth: boolean;     // 是否有死胎
  preterm: boolean;        // 是否早产
  retainedPlacenta: boolean; // 是否胎衣不下
};
const CALVING_RECORDS: Record<string, CalvingRecord> = {
  "PP-2601": { difficulty: 3, injury: 2, calfCount: 2, calfWeightMax: 42, stillbirth: false, preterm: false, retainedPlacenta: true },
  "PP-2602": { difficulty: 1, injury: 1, calfCount: 1, calfWeightMax: 46, stillbirth: true,  preterm: true,  retainedPlacenta: false },
};
function calvingToSymptoms(r: CalvingRecord): string[] {
  const out: string[] = [];
  if (r.difficulty >= 3) out.push(`产犊难易度 ${r.difficulty} 分`);
  if (r.injury >= 2) out.push(`产道损伤 ${r.injury} 级`);
  if (r.calfCount >= 2) out.push(`产犊数量 ${r.calfCount} 头`);
  if (r.calfWeightMax >= 45) out.push(`犊牛体重 ${r.calfWeightMax}kg`);
  if (r.stillbirth) out.push("犊牛为「死胎」");
  if (r.preterm) out.push("早产");
  if (r.retainedPlacenta) out.push("胎衣不下");
  return Array.from(new Set(out));
}
const POSTPARTUM_DISEASE: Disease = {
  name: "产后高危",
  symptoms: POSTPARTUM_SYMPTOMS.filter((s) => s !== POSTPARTUM_NORMAL_TAG),
  plans: [
    {
      id: "pp-1",
      name: "处方1 · 5% 头孢噻呋 + 氟尼辛",
      desc: "14 天疗程",
      note: "产后 7 天体温监测异常牛只，进一步体格检查确定病因，按照产后子宫炎、肺炎、乳房炎等相应方案进行治疗。",
      items: [
        { id: "r1", kind: "drug", name: "5% 盐酸头孢噻呋注射液（畜可健）", maker: "礼蓝动保", spec: "100ml / 瓶", use: "肌肉注射 / 皮下注射", dose: "4.4", doseUnit: "ml", dosePer: "100kg", timesPerDay: "1", days: "3", usageMethod: "1 天 1 次，连用 3 天", doseByWeight: "200–400kg=10ml；400–600kg=20ml；600–900kg=30ml；≥900kg=35ml" },
        { id: "r2", kind: "drug", name: "氟尼辛葡甲胺注射液（福欣安）", maker: "礼蓝动保", spec: "100ml / 瓶", use: "静脉注射", dose: "4", doseUnit: "ml", dosePer: "100kg", timesPerDay: "1", days: "3", usageMethod: "1 天 1 次，连用 3 天", doseByWeight: "200–400kg=10ml；400–600kg=20ml；600–900kg=30ml；≥900kg=35ml" },
        { id: "c1", kind: "therapy", name: "直肠体温", therapyMethod: "检查", frequency: "1 天 1 次", days: "14", usageMethod: "测量并记录牛只直肠体温（数字输入）" },
        { id: "c2", kind: "therapy", name: "情况评估", therapyMethod: "检查", frequency: "1 天 1 次", days: "14", usageMethod: "拍摄牛只正前方、正后方照片（图片视频）" },
      ],
    },
    {
      id: "pp-2",
      name: "处方2 · 10% 头孢噻呋 + 氟尼辛",
      desc: "14 天疗程",
      note: "产后 7 天体温监测异常牛只，进一步体格检查确定病因，按照产后子宫炎、肺炎、乳房炎等相应方案进行治疗。",
      items: [
        { id: "r1", kind: "drug", name: "10% 盐酸头孢噻呋注射液（畜可健 / 欣利达）", maker: "礼蓝动保", spec: "100ml / 瓶", use: "肌肉注射 / 皮下注射", dose: "20", doseUnit: "ml", dosePer: "fixed", timesPerDay: "1", days: "1", usageMethod: "3 天 1 次", doseByWeight: "200–400kg=5ml；400–600kg=10ml；600–900kg=15ml；≥900kg=20ml" },
        { id: "r2", kind: "drug", name: "氟尼辛葡甲胺注射液（福欣安）", maker: "礼蓝动保", spec: "100ml / 瓶", use: "静脉注射", dose: "4", doseUnit: "ml", dosePer: "100kg", timesPerDay: "1", days: "3", usageMethod: "1 天 1 次，连用 3 天", doseByWeight: "200–400kg=10ml；400–600kg=20ml；600–900kg=30ml；≥900kg=35ml" },
        { id: "c1", kind: "therapy", name: "直肠体温", therapyMethod: "检查", frequency: "1 天 1 次", days: "14", usageMethod: "测量并记录牛只直肠体温（数字输入）" },
        { id: "c2", kind: "therapy", name: "情况评估", therapyMethod: "检查", frequency: "1 天 1 次", days: "14", usageMethod: "拍摄牛只正前方、正后方照片（图片视频）" },
      ],
    },
  ],
};

// 产后正常：对应"产后检查"处方（14 天连续检查，非用药任务）
const POSTPARTUM_NORMAL_DISEASE: Disease = {
  name: "产后正常",
  symptoms: [POSTPARTUM_NORMAL_TAG],
  plans: [
    {
      id: "pp-check",
      name: "产后检查",
      desc: "14 天产后连续检查",
      note: "为期 14 天的产后检查任务，包含直肠体温数字记录和牛只正前方、正后方照片采集。",
      items: [
        {
          id: "c1",
          kind: "therapy",
          name: "直肠体温",
          therapyMethod: "检查",
          frequency: "1 天 1 次",
          days: "14",
          usageMethod: "测量并记录牛只直肠体温（数字输入）",
        },
        {
          id: "c2",
          kind: "therapy",
          name: "情况评估",
          therapyMethod: "检查",
          frequency: "1 天 1 次",
          days: "14",
          usageMethod: "拍摄牛只正前方、正后方照片（图片视频）",
        },
      ],
    },
  ],
};

// === 干奶：固定症状池、固定结论「干奶处理」，5 个乳注处方（按非盲乳数给药）===
const DRYING_SYMPTOMS = ["确认已孕", "干奶后乳区仍旧漏奶"];
const DRYING_QUARTER_DOSE_3G = "1=1 支；2=2 支；3=3 支；4=4 支";
const DRYING_DISEASE: Disease = {
  name: "干奶处理",
  symptoms: DRYING_SYMPTOMS,
  plans: [
    {
      id: "dry-1",
      name: "处方1 · 头孢喹肟乳注（牧全欣）",
      desc: "1 天疗程 · 按非盲乳数一次量乳注",
      note: "干奶后 3 天进入复查窗口，需填写转栏信息（任务时限 24 小时）。",
      items: [
        { id: "r1", kind: "drug", name: "硫酸头孢喹肟乳房注入剂 干乳期（牧全欣）", maker: "礼蓝动保", spec: "3g / 支", use: "乳房灌注", dose: "1", doseUnit: "支", dosePer: "fixed", timesPerDay: "1", days: "1", usageMethod: "一次量给药", doseByQuarter: DRYING_QUARTER_DOSE_3G },
      ],
    },
    {
      id: "dry-2",
      name: "处方2 · 头孢喹肟乳注（茹通）",
      desc: "1 天疗程 · 按非盲乳数一次量乳注",
      note: "干奶后 3 天进入复查窗口，需填写转栏信息（任务时限 24 小时）。",
      items: [
        { id: "r1", kind: "drug", name: "硫酸头孢喹肟乳房注入剂（干乳期）（茹通）", maker: "瑞普生物", spec: "3g / 支", use: "乳房灌注", dose: "1", doseUnit: "支", dosePer: "fixed", timesPerDay: "1", days: "1", usageMethod: "一次量给药", doseByQuarter: DRYING_QUARTER_DOSE_3G },
      ],
    },
    {
      id: "dry-3",
      name: "处方3 · 头孢喹肟乳注（海喹宁）",
      desc: "1 天疗程 · 按非盲乳数一次量乳注",
      note: "干奶后 3 天进入复查窗口，需填写转栏信息（任务时限 24 小时）。",
      items: [
        { id: "r1", kind: "drug", name: "硫酸头孢喹肟乳房注入剂（干乳期）（海喹宁）", maker: "齐鲁动保", spec: "3g / 支", use: "乳房灌注", dose: "1", doseUnit: "支", dosePer: "fixed", timesPerDay: "1", days: "1", usageMethod: "一次量给药", doseByQuarter: DRYING_QUARTER_DOSE_3G },
      ],
    },
    {
      id: "dry-4",
      name: "处方4 · 头孢噻呋乳注（畜可健）",
      desc: "1 天疗程 · 按非盲乳数一次量乳注",
      note: "干奶后 3 天进入复查窗口，需填写转栏信息（任务时限 24 小时）。",
      items: [
        { id: "r1", kind: "drug", name: "盐酸头孢噻呋乳房注入剂 干乳期（畜可健）", maker: "礼蓝动保", spec: "8ml / 支", use: "乳房灌注", dose: "1", doseUnit: "支", dosePer: "fixed", timesPerDay: "1", days: "1", usageMethod: "一次量给药", doseByQuarter: DRYING_QUARTER_DOSE_3G },
      ],
    },
    {
      id: "dry-5",
      name: "处方5 · 头孢喹肟乳注（赛福魁）",
      desc: "1 天疗程 · 按非盲乳数一次量乳注",
      note: "干奶后 3 天进入复查窗口，需填写转栏信息（任务时限 24 小时）。",
      items: [
        { id: "r1", kind: "drug", name: "硫酸头孢喹肟乳房注入剂 干乳期（赛福魁）", maker: "扬州威克", spec: "3g / 支", use: "乳房灌注", dose: "1", doseUnit: "支", dosePer: "fixed", timesPerDay: "1", days: "1", usageMethod: "一次量给药", doseByQuarter: DRYING_QUARTER_DOSE_3G },
      ],
    },
  ],
};



// 药品库（用于编辑弹层中搜索匹配）
type DrugItem = { name: string; maker: string; spec: string; recommendedUse: string; defaultUnit: string; allowedUses: string[]; isSpecial?: boolean };
const drugLibrary: DrugItem[] = [
  { name: "氟尼辛葡甲胺注射液", maker: "齐鲁动保", spec: "100ml / 瓶", recommendedUse: "肌肉注射", defaultUnit: "ml", allowedUses: ["肌肉注射", "静脉注射"] },
  { name: "头孢噻呋钠", maker: "礼蓝动保", spec: "1g / 支", recommendedUse: "肌肉注射", defaultUnit: "g", allowedUses: ["肌肉注射", "皮下注射"] },
  { name: "碳酸氢钠", maker: "华北制药", spec: "500g / 袋", recommendedUse: "口服", defaultUnit: "g", allowedUses: ["口服", "灌服"] },
  { name: "复合维生素 B", maker: "扬州威克", spec: "100ml / 瓶", recommendedUse: "肌肉注射", defaultUnit: "ml", allowedUses: ["肌肉注射", "静脉注射"] },
  { name: "50% 葡萄糖", maker: "石药集团", spec: "500ml / 瓶", recommendedUse: "静脉注射", defaultUnit: "ml", allowedUses: ["静脉注射"] },
  { name: "口服补液盐", maker: "瑞普生物", spec: "100g / 包", recommendedUse: "口服", defaultUnit: "g", allowedUses: ["口服", "灌服"] },
  { name: "青霉素钠", maker: "华北制药", spec: "80 万 IU / 支", recommendedUse: "肌肉注射", defaultUnit: "IU", allowedUses: ["肌肉注射", "静脉注射", "乳房灌注"], isSpecial: true },
  { name: "土霉素注射液", maker: "齐鲁动保", spec: "100ml / 瓶", recommendedUse: "肌肉注射", defaultUnit: "ml", allowedUses: ["肌肉注射", "静脉注射"] },
  { name: "维生素 C 注射液", maker: "石药集团", spec: "10ml / 支", recommendedUse: "静脉注射", defaultUnit: "ml", allowedUses: ["静脉注射", "肌肉注射"] },
  { name: "地塞米松磷酸钠", maker: "瑞普生物", spec: "5ml / 支", recommendedUse: "肌肉注射", defaultUnit: "ml", allowedUses: ["肌肉注射", "静脉注射"], isSpecial: true },
  { name: "5% 盐酸头孢噻呋（畜可健）", maker: "礼蓝动保", spec: "100ml / 瓶", recommendedUse: "肌肉注射", defaultUnit: "ml", allowedUses: ["肌肉注射"] },
  { name: "10% 盐酸头孢噻呋注射液（畜可健 / 欣利达）", maker: "礼蓝动保", spec: "100ml / 瓶", recommendedUse: "肌肉注射", defaultUnit: "ml", allowedUses: ["肌肉注射"] },
  { name: "氟尼辛葡甲胺（福欣安）", maker: "礼蓝动保", spec: "100ml / 瓶", recommendedUse: "静脉推注", defaultUnit: "ml", allowedUses: ["静脉推注", "静脉注射", "肌肉注射"] },
];

// 使用方式枚举
const useMethods = [
  "肌肉注射",
  "静脉注射",
  "静脉推注",
  "皮下注射",
  "乳房灌注",
  "口服",
  "灌服",
  "外用涂抹",
];





// 治疗手段枚举
const therapyMethods = [
  "检查",
  "按摩",
  "热敷",
  "冷敷",
  "灌肠",
  "物理治疗",
  "针灸",
  "蹄部修整",
  "隔离观察",
  "补液护理",
];

const executorPool = ["李雨晴", "张师傅", "王师傅", "刘师傅", "赵师傅", "陈师傅"];

function DiagnosePage() {
  const { id } = useParams({ from: "/m/health/$id_/diagnose" });
  const navigate = useNavigate();

  // 工单类型判断
  const isPostpartum = id.toUpperCase().startsWith("PP");
  const isDrying = id.toUpperCase().startsWith("GN");
  const effectiveSymptomLibrary = isPostpartum
    ? POSTPARTUM_SYMPTOMS
    : isDrying
      ? DRYING_SYMPTOMS
      : symptomLibrary;
  const effectiveDiseaseLibrary = isPostpartum
    ? [POSTPARTUM_NORMAL_DISEASE, POSTPARTUM_DISEASE]
    : isDrying
      ? [DRYING_DISEASE]
      : diseaseLibrary;

  // 症状（带入上报症状；产后护理带入产犊记录映射的症状；干奶无上报症状）
  const postpartumPrefill = useMemo(
    () => (isPostpartum ? calvingToSymptoms(CALVING_RECORDS[id.toUpperCase()] ?? { difficulty: 0, injury: 0, calfCount: 1, calfWeightMax: 0, stillbirth: false, preterm: false, retainedPlacenta: false }) : []),
    [isPostpartum, id],
  );
  const [symptoms, setSymptoms] = useState<string[]>(() => (isPostpartum ? postpartumPrefill : isDrying ? [] : reportedSymptoms));
  const [symptomInput, setSymptomInput] = useState("");

  // 疾病
  const [disease, setDisease] = useState<string>("");
  const [diseaseQuery, setDiseaseQuery] = useState("");
  const [diseasePickerOpen, setDiseasePickerOpen] = useState(false);


  // 标准处方（系统内置，按疾病提供多个完整方案，二选一/三选一；按体重自动算量）
  const [stdPlans, setStdPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [cattleWeight, setCattleWeight] = useState<number | null>(null);
  // 特殊处方独立体重（用户需分别选择，提交时校验一致）
  const [specialCattleWeight, setSpecialCattleWeight] = useState<number | null>(null);
  // 特殊处方（需填原因，可自由编辑）
  const [specialReason, setSpecialReason] = useState("");
  const [specialPlanDesc, setSpecialPlanDesc] = useState("");
  const [specialList, setSpecialList] = useState<Prescription[]>([]);
  const [editingRx, setEditingRx] = useState<Prescription | null>(null);
  const [planSheetOpen, setPlanSheetOpen] = useState(false);
  const [weightSheetTarget, setWeightSheetTarget] = useState<null | "std" | "special">(null);
  const [specialOpen, setSpecialOpen] = useState(false);

  // 提交校验弹窗
  type Shortage = { name: string; need: number; stock: number; unit: string };
  type Violation = { kind: "disease" | "drug"; title: string; detail: string };
  const [submitCheck, setSubmitCheck] = useState<
    | { stage: "stock"; shortages: Shortage[] }
    | { stage: "rules"; violations: Violation[] }
    | null
  >(null);



  const earTagLabel = getOrderEarTagLabel(id);

  // 体征数据
  const [temperature, setTemperature] = useState("");
  const [ketone, setKetone] = useState("");
  // 是否需要每日测量体温（治疗执行任务中带入测温步骤）
  const [dailyTempRequired, setDailyTempRequired] = useState(true);

  // 现场记录
  const [photos, setPhotos] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [audios, setAudios] = useState<{ id: string; duration: number }[]>([]);
  const [note, setNote] = useState("");
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordSec, setRecordSec] = useState(0);

  useEffect(() => {
    if (!recording) return;
    const t = setInterval(() => setRecordSec((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [recording]);

  const startRecord = () => {
    setShowMediaPicker(false);
    setRecordSec(0);
    setRecording(true);
  };
  const stopRecord = () => {
    if (recordSec > 0) {
      setAudios((prev) => [...prev, { id: `a${Date.now()}`, duration: recordSec }]);
    }
    setRecording(false);
    setRecordSec(0);
  };
  const fmtSec = (n: number) => `${Math.floor(n / 60).toString().padStart(2, "0")}:${(n % 60).toString().padStart(2, "0")}`;



  // 指派执行人
  const [executor, setExecutor] = useState("");
  const [showExecutorPicker, setShowExecutorPicker] = useState(false);
  const [executorQuery, setExecutorQuery] = useState("");
  const executorMatches = useMemo(() => {
    const kw = executorQuery.trim();
    const list = kw ? executorPool.filter((n) => n.includes(kw)) : executorPool;
    return list.slice(0, 8);
  }, [executorQuery]);

  // 按匹配症状数排序的候选疾病
  const rankedDiseases = useMemo(() => {
    const kw = diseaseQuery.trim().toLowerCase();
    return effectiveDiseaseLibrary
      .map((d) => ({
        ...d,
        matched: d.symptoms.filter((s) => symptoms.includes(s)).length,
      }))
      .filter((d) => !kw || d.name.toLowerCase().includes(kw))
      .sort((a, b) => b.matched - a.matched);
  }, [diseaseQuery, symptoms, effectiveDiseaseLibrary]);

  // 候选症状（去除已选）
  const symptomSuggestions = useMemo(() => {
    const kw = symptomInput.trim().toLowerCase();
    return effectiveSymptomLibrary
      .filter((s) => !symptoms.includes(s))
      .filter((s) => !kw || s.toLowerCase().includes(kw))
      .slice(0, 8);
  }, [symptomInput, symptoms, effectiveSymptomLibrary]);

  // 产后护理工单：症状、疾病、处方均不预填，由兽医人工选择

  const addSymptom = (s: string) => {
    if (!s || symptoms.includes(s)) return;
    setSymptoms((prev) => [...prev, s]);
    setSymptomInput("");
  };

  const removeSymptom = (s: string) =>
    setSymptoms((prev) => prev.filter((x) => x !== s));

  const pickDisease = (d: (typeof rankedDiseases)[number]) => {
    setDisease(d.name);
    setDiseaseQuery(d.name);
    // 优先选择所有药品都有库存的方案；若都齐全或都缺，则按方案名称升序排序
    const cloned = d.plans.map((p) => ({
      ...p,
      items: p.items.map((it) => {
        if (it.kind !== "drug") return { ...it };
        const alt = parseBrandAlternatives(it.name);
        if (!alt) return { ...it };
        const brand = pickDefaultBrand(alt.prefix, alt.brands);
        return {
          ...it,
          name: `${alt.prefix}（${brand}）`,
          alternatives: alt.brands.map((b) => `${alt.prefix}（${b}）`),
        };
      }),
    }));
    const scored = cloned
      .map((p) => {
        const drugItems = p.items.filter((it) => it.kind === "drug");
        const allInStock = drugItems.length > 0 && drugItems.every((it) => (drugStock[it.name]?.qty ?? 0) > 0);
        return { p, allInStock };
      })
      .sort((a, b) => {
        if (a.allInStock !== b.allInStock) return a.allInStock ? -1 : 1;
        return a.p.name.localeCompare(b.p.name, "zh");
      });
    const sortedPlans = scored.map((s) => s.p);
    setStdPlans(sortedPlans);
    setSelectedPlanId(sortedPlans[0]?.id ?? "");
    setDiseasePickerOpen(false);
  };

  // 症状变更（产后护理：一切正常 与其它症状互斥；选中「一切正常」自动落诊断＝产后正常 + 产后检查处方）
  const handleSymptomsChange = (next: string[]) => {
    if (!isPostpartum) {
      setSymptoms(next);
      return;
    }
    const prevHasNormal = symptoms.includes(POSTPARTUM_NORMAL_TAG);
    const nextHasNormal = next.includes(POSTPARTUM_NORMAL_TAG);
    let final = next;
    if (nextHasNormal && !prevHasNormal) {
      // 用户刚勾选「一切正常」：清空其他症状
      final = [POSTPARTUM_NORMAL_TAG];
    } else if (nextHasNormal && next.length > 1) {
      // 用户在已有「一切正常」时勾选其它：移除「一切正常」
      final = next.filter((s) => s !== POSTPARTUM_NORMAL_TAG);
    }
    setSymptoms(final);

    const isNormal = final.length === 1 && final[0] === POSTPARTUM_NORMAL_TAG;
    if (isNormal) {
      const d = POSTPARTUM_NORMAL_DISEASE;
      pickDisease({ ...d, matched: 1 } as (typeof rankedDiseases)[number]);
    } else if (disease === POSTPARTUM_NORMAL_DISEASE.name) {
      // 取消「一切正常」时清空自动带入的诊断
      setDisease("");
      setDiseaseQuery("");
      setStdPlans([]);
      setSelectedPlanId("");
    }
  };

  // 品牌替换弹层
  const [brandSheet, setBrandSheet] = useState<{ planId: string; rxId: string } | null>(null);
  const switchBrand = (newName: string) => {
    if (!brandSheet) return;
    setStdPlans((prev) =>
      prev.map((p) =>
        p.id !== brandSheet.planId
          ? p
          : {
              ...p,
              items: p.items.map((it) =>
                it.id === brandSheet.rxId ? { ...it, name: newName } : it,
              ),
            },
      ),
    );
    setBrandSheet(null);
  };

  const selectedPlan = useMemo(
    () => stdPlans.find((p) => p.id === selectedPlanId) ?? null,
    [stdPlans, selectedPlanId],
  );

  // 是否需要根据体重计算剂量：任一用药项 dosePer !== "fixed" 或声明了按体重区间
  const drugNeedsWeight = (r: Prescription) =>
    r.kind === "drug" && ((!!r.dosePer && r.dosePer !== "fixed") || !!r.doseByWeight);
  const stdNeedsWeight = useMemo(
    () => (selectedPlan?.items ?? []).some(drugNeedsWeight),
    [selectedPlan],
  );
  const specialNeedsWeight = useMemo(
    () => specialList.some(drugNeedsWeight),
    [specialList],
  );
  const needsWeight = stdNeedsWeight || specialNeedsWeight;

  const removeSpecialRx = (rxId: string) =>
    setSpecialList((prev) => prev.filter((r) => r.id !== rxId));

  const saveRxEdit = () => {
    if (!editingRx) return;
    setSpecialList((prev) => prev.map((r) => (r.id === editingRx.id ? editingRx : r)));
    setEditingRx(null);
  };

  const addSpecial = (kind: "drug" | "therapy") => {
    const nextId = `s${Date.now()}`;
    const base: Prescription =
      kind === "drug"
        ? {
            id: nextId,
            kind: "drug",
            name: "",
            maker: "",
            spec: "",
            use: "",
            dose: "",
            doseUnit: "ml",
            timesPerDay: "2",
            days: "3",
            splitTime: false,
            slots: {},
          }
        : {
            id: nextId,
            kind: "therapy",
            name: "",
            therapyMethod: "",
            frequency: "",
            days: "3",
          };
    setEditingRx(base);
    setSpecialList((prev) => [...prev, base]);
  };

  const doSubmit = () => {
    setSubmitCheck(null);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(`health:dailyTemp:${id}`, dailyTempRequired ? "1" : "0");
    }
    toast.success("诊断已提交");
    navigate({ to: "/m/health/$id", params: { id }, search: { tab: "review" } });
  };

  const submit = () => {
    if (symptoms.length === 0) {
      toast.error("请至少填写一个症状");
      return;
    }
    const temp = parseFloat(temperature);
    if (!isPostpartum && !isDrying) {
      if (!temperature.trim() || Number.isNaN(temp)) {
        toast.error("请填写牛只体温");
        return;
      }
      if (temp < 30 || temp > 45) {
        toast.error("体温应在 30 ~ 45 ℃ 之间");
        return;
      }
    } else if (temperature.trim()) {
      if (Number.isNaN(temp) || temp < 30 || temp > 45) {
        toast.error("体温应在 30 ~ 45 ℃ 之间");
        return;
      }
    }
    if (ketone.trim()) {
      const k = parseFloat(ketone);
      if (Number.isNaN(k) || k < 0 || k > 10) {
        toast.error("血酮值应在 0 ~ 10 mmol/L 之间");
        return;
      }
    }
    if (!disease) {
      toast.error("请选择疾病");
      return;
    }
    const planItems = selectedPlan?.items ?? [];
    if (planItems.length === 0 && specialList.length === 0) {
      toast.error("请选择一个标准处方方案或开具特殊处方");
      return;
    }
    if (stdNeedsWeight && cattleWeight == null) {
      toast.error("请选择标准处方的牛只体重以自动计算剂量");
      return;
    }
    if (specialNeedsWeight && specialCattleWeight == null) {
      toast.error("请选择特殊处方的牛只体重以自动计算剂量");
      return;
    }
    if (
      stdNeedsWeight &&
      specialNeedsWeight &&
      cattleWeight !== specialCattleWeight
    ) {
      toast.error("标准处方与特殊处方所选牛只体重不一致，请核对");
      return;
    }
    if (specialList.length > 0 && !specialReason.trim()) {
      toast.error("请填写开具特殊处方的原因");
      return;
    }
    if (specialList.some((r) => r.kind === "drug" && (!r.name || !r.dose))) {
      toast.error("请补全特殊处方的药品与剂量");
      return;
    }
    if (specialList.some((r) => r.kind === "therapy" && !r.therapyMethod)) {
      toast.error("请补全特殊理疗的治疗手段");
      return;
    }
    if (photos.length === 0 && videos.length === 0) {
      toast.error("请上传至少一张照片或一段视频");
      return;
    }

    // 汇总所有药品处方（标准 + 特殊），分别按各自体重计算
    const stdDrugs = planItems.filter((r) => r.kind === "drug");
    const specDrugs = specialList.filter((r) => r.kind === "drug");
    const stdW = cattleWeight ?? 500;
    const specW = specialCattleWeight ?? cattleWeight ?? 500;

    // 1) 库存校验
    const shortages: Shortage[] = [];
    const need: Record<string, { qty: number; unit: string }> = {};
    const accumulate = (r: Prescription, w: number) => {
      const perDose = computePerDose(r, w);
      if (perDose <= 0) return;
      const times = parseFloat(r.timesPerDay || "1") || 1;
      const days = parseFloat(r.days || "1") || 1;
      const total = Math.round(perDose * times * days * 10) / 10;
      const unit = r.doseUnit || "ml";
      if (!need[r.name]) need[r.name] = { qty: 0, unit };
      need[r.name].qty = Math.round((need[r.name].qty + total) * 10) / 10;
    };
    stdDrugs.forEach((r) => accumulate(r, stdW));
    specDrugs.forEach((r) => accumulate(r, specW));
    for (const [name, n] of Object.entries(need)) {
      const stock = drugStock[name];
      if (!stock || stock.qty < n.qty) {
        shortages.push({
          name,
          need: n.qty,
          stock: stock?.qty ?? 0,
          unit: stock?.unit ?? n.unit,
        });
      }
    }

    if (shortages.length > 0) {
      setSubmitCheck({ stage: "stock", shortages });
      return;
    }

    proceedRuleCheck();
  };

  // 2) 规则校验（库存通过或用户已确认继续后触发）
  const proceedRuleCheck = () => {
    const planItems = selectedPlan?.items ?? [];
    const stdDrugs = planItems.filter((r) => r.kind === "drug");
    const specDrugs = specialList.filter((r) => r.kind === "drug");
    const stdW = cattleWeight ?? 500;
    const specW = specialCattleWeight ?? cattleWeight ?? 500;

    const violations: Violation[] = [];
    const reported = cattleHistory.diseaseCount[disease] ?? 0;
    if (reported + 1 > RULES.diseaseReportMax) {
      violations.push({
        kind: "disease",
        title: `「${disease}」上报次数超限`,
        detail: `当前：${reported + 1} 次；限制：${RULES.diseaseReportMax} 次。`,
      });
    }
    const evalDrug = (r: Prescription, w: number) => {
      const perDose = computePerDose(r, w);
      if (perDose <= 0) return;
      const times = parseFloat(r.timesPerDay || "1") || 1;
      const days = parseFloat(r.days || "1") || 1;
      const addDose = Math.round(perDose * times * days * 10) / 10;
      const addCount = Math.round(times * days);
      const hist = cattleHistory.drugUsage[r.name];
      if (!hist) return;
      const unit = hist.unit;
      const nextDose = Math.round((hist.totalDose + addDose) * 10) / 10;
      const nextCount = hist.count + addCount;
      const doseCap = Math.round(RULES.drugTotalDoseFactorMax * perDose * 10) / 10;
      if (nextDose > doseCap) {
        violations.push({
          kind: "drug",
          title: `「${r.name}」累计剂量超限`,
          detail: `当前：${nextDose}${unit}；限制：${doseCap}${unit}。`,
        });
      }
      if (nextCount > RULES.drugUsageCountMax) {
        violations.push({
          kind: "drug",
          title: `「${r.name}」累计使用次数超限`,
          detail: `当前：${nextCount} 次；限制：${RULES.drugUsageCountMax} 次。`,
        });
      }
    };
    stdDrugs.forEach((r) => evalDrug(r, stdW));
    specDrugs.forEach((r) => evalDrug(r, specW));

    if (violations.length === 0) {
      doSubmit();
      return;
    }
    setSubmitCheck({ stage: "rules", violations });
  };


  return (
    <MobileShell title="诊断记录" back hideTabBar>
      <div className="pb-28">
        {/* 工单号（吸顶） */}
        <div className="sticky top-12 z-20 bg-[var(--bg-page)] px-4 pt-3 pb-2 border-b border-border">
          <div className="text-caption text-text-tertiary inline-flex items-center gap-1.5">
            <span>工单</span>
            <span className="font-mono text-text-secondary">{id}</span>
            <span className="text-text-tertiary">·</span>
            <span className="font-mono text-text-secondary">{earTagLabel}</span>
          </div>
        </div>

        {/* 顶部提示 */}
        <div className="px-4 pt-2 pb-1">
          <div className="flex items-center gap-1.5 text-caption text-primary">
            <Sparkles className="h-3 w-3" />
            {isPostpartum
              ? "平台下发的产后护理工单，请勾选症状并核对治疗方案"
              : isDrying
                ? "平台下发的干奶工单，请勾选依据并选择乳注处方"
                : "已自动将上报信息填写至下方，方便编辑更改"}
          </div>
        </div>

        <div className="px-4 space-y-3">
          {/* ===== 牛只情况 分组 ===== */}
          <div className="pt-1 pb-0.5 flex items-center gap-2">
            <span className="text-section-title text-foreground font-medium">牛只情况</span>
            <span className="text-caption text-text-tertiary">症状、体征数据与现场记录</span>
          </div>

          {/* === 症状标签 === */}
          <Section
            title="症状标签"
            required
            hint="输入关键词搜索，或直接创建"
          >
            <TagPicker
              selected={symptoms}
              onChange={handleSymptomsChange}
              presets={effectiveSymptomLibrary}
              disableCreate={isPostpartum || isDrying}
            />
          </Section>


          {/* === 体征数据 === */}
          <Section title="体征数据">

            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <div className="text-caption text-text-tertiary mb-1">
                  体温 {isPostpartum || isDrying ? <span className="text-text-tertiary">(选填)</span> : <span className="text-[var(--state-danger)]">*</span>}
                </div>
                <div className="relative">
                  <input
                    inputMode="decimal"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    placeholder="如 39.2"
                    maxLength={5}
                    className="h-10 w-full pl-3 pr-10 rounded-lg bg-white border border-border text-body-sm placeholder:text-text-tertiary focus:outline-none focus:border-primary"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-caption text-text-tertiary">℃</span>
                </div>
              </label>
              <label className="block">
                <div className="text-caption text-text-tertiary mb-1">
                  血酮 <span className="text-text-tertiary">(选填)</span>
                </div>
                <div className="relative">
                  <input
                    inputMode="decimal"
                    value={ketone}
                    onChange={(e) => setKetone(e.target.value)}
                    placeholder="如 1.2"
                    maxLength={5}
                    className="h-10 w-full pl-3 pr-16 rounded-lg bg-white border border-border text-body-sm placeholder:text-text-tertiary focus:outline-none focus:border-primary"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-caption text-text-tertiary">mmol/L</span>
                </div>
              </label>
            </div>
          </Section>









          {/* === 现场记录（前置:体征数据之后即上传，便于诊断参考） === */}
          <Section title="现场记录">
            {/* 照片 / 视频 */}
            <div>
              <div className="text-caption text-text-tertiary mb-2 inline-flex items-center gap-1">
                <Camera className="h-3 w-3" /> 照片 / 视频
                <span className="text-[var(--state-danger)]">*</span>
                <span>· {photos.length + videos.length} 条</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {photos.map((_, i) => (
                  <div key={`p-${i}`} className="relative aspect-square rounded-lg bg-gradient-to-br from-surface-subtle to-border border border-border">
                    <button
                      onClick={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-card border border-border text-text-secondary inline-flex items-center justify-center"
                      aria-label="删除照片"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {videos.map((_, i) => (
                  <div key={`v-${i}`} className="relative aspect-square rounded-lg bg-gradient-to-br from-surface-subtle to-border border border-border inline-flex items-center justify-center">
                    <PlayCircle className="h-5 w-5 text-text-tertiary" />
                    <button
                      onClick={() => setVideos((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-card border border-border text-text-secondary inline-flex items-center justify-center"
                      aria-label="删除视频"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setShowMediaPicker(true)}
                  className="aspect-square rounded-lg border border-dashed border-border bg-surface-subtle text-text-tertiary inline-flex flex-col items-center justify-center gap-0.5"
                >
                  <Camera className="h-4 w-4" />
                  <span className="text-caption">添加</span>
                </button>
              </div>
            </div>

            {/* 录音 */}
            <div className="mt-3">
              <div className="text-caption text-text-tertiary mb-2 inline-flex items-center gap-1">
                <Mic className="h-3 w-3" /> 录音 · {audios.length} 条
              </div>
              <div className="space-y-2">
                {audios.map((a, i) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-2 h-10 px-3 rounded-lg bg-surface-subtle border border-border"
                  >
                    <PlayCircle className="h-4 w-4 text-primary" />
                    <div className="flex-1 h-1 rounded-full bg-border overflow-hidden">
                      <div className="h-full w-1/3 bg-primary/40" />
                    </div>
                    <span className="text-caption text-text-tertiary tabular-nums">{fmtSec(a.duration)}</span>
                    <button
                      onClick={() => setAudios((prev) => prev.filter((_, idx) => idx !== i))}
                      className="h-5 w-5 rounded-full bg-card border border-border text-text-secondary inline-flex items-center justify-center"
                      aria-label="删除录音"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {recording ? (
                  <button
                    onClick={stopRecord}
                    className="w-full h-10 px-3 rounded-lg bg-[var(--state-danger)]/10 border border-[var(--state-danger)]/40 text-[var(--state-danger)] text-body-sm inline-flex items-center justify-center gap-2"
                  >
                    <span className="relative inline-flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--state-danger)] opacity-60 animate-ping" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--state-danger)]" />
                    </span>
                    正在录音 {fmtSec(recordSec)}
                    <Square className="h-3.5 w-3.5 ml-1" /> 点击结束
                  </button>
                ) : (
                  <button
                    onClick={() => { setRecordSec(0); setRecording(true); }}
                    className="w-full h-10 px-3 rounded-lg border border-dashed border-border text-body-sm text-text-tertiary inline-flex items-center justify-center gap-1.5"
                  >
                    <Mic className="h-3.5 w-3.5" /> 点击开始录音
                  </button>
                )}
              </div>
            </div>

            {/* 文字描述 */}
            <div className="mt-3">
              <div className="text-caption text-text-tertiary mb-2">文字描述<span className="text-[var(--state-danger)] ml-0.5">*</span></div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="补充体征、用药反应、隔离建议等"
                className="w-full px-3 py-2 rounded-lg bg-white border border-border text-body-sm placeholder:text-text-tertiary focus:outline-none focus:border-primary resize-none"
              />
              <div className="text-caption text-text-tertiary text-right mt-1">{note.length} / 500</div>
            </div>
          </Section>

          {/* ===== 诊断结论 分组 ===== */}
          <div className="pt-1 pb-0.5 flex items-center gap-2">
            <span className="text-section-title text-foreground font-medium">诊断结论</span>
            <span className="text-caption text-text-tertiary">根据症状选择或新建疾病</span>
          </div>

          {/* === 疾病名称 === */}
          <Section
            title="疾病名称"
            extra={
              <span className="text-caption text-text-tertiary inline-flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-primary" />
                按症状匹配排序
              </span>
            }
          >
            {disease ? (
              <div className="rounded-lg border border-primary/20 bg-brand-subtle p-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="text-body-sm text-primary font-medium truncate">
                    {disease}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setDiseasePickerOpen(true)}
                  className="text-caption text-text-tertiary shrink-0"
                >
                  重选
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setDiseasePickerOpen(true)}
                className="w-full h-11 rounded-lg border border-dashed border-border bg-card text-body-sm text-text-secondary inline-flex items-center justify-center gap-1 active:bg-surface-subtle"
              >
                <Search className="h-4 w-4" />
                选择疾病名称
              </button>
            )}
          </Section>

          {/* ===== 治疗方案 分组 ===== */}
          <div className="pt-1 pb-0.5 flex items-center gap-2">
            <span className="text-section-title text-foreground font-medium">治疗方案</span>
            <span className="text-caption text-text-tertiary">标准 / 特殊处方与执行设置</span>
          </div>

          {/* === 标准处方 === */}
          <Section
            title="标准处方"
            extra={
              <span className="text-caption text-text-tertiary">
                {stdPlans.length === 0
                  ? "选择疾病后载入"
                  : `共 ${stdPlans.length} 个方案`}
              </span>
            }
          >
            {stdPlans.length === 0 ? (
              <div className="text-caption text-text-tertiary text-center py-4">
                选择疾病后将自动载入系统推荐处方方案
              </div>
            ) : (
              <div className="space-y-3">
                {/* 牛只体重（下拉选择）— 仅当标准处方中有按体重计算的用药项时展示 */}
                {stdNeedsWeight && (
                  <div>
                    <div className="text-caption text-text-tertiary mb-1.5">
                      牛只体重 <span className="text-[var(--state-danger)]">*</span>
                      <span className="ml-1 text-text-tertiary">用于自动计算剂量</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setWeightSheetTarget("std")}
                      className="h-10 w-full px-3 rounded-lg bg-white border border-border text-body-sm inline-flex items-center justify-between"
                    >
                      <span className={cattleWeight == null ? "text-text-tertiary" : "text-foreground"}>
                        {cattleWeight == null ? "请选择牛只体重" : weightLabelOf(cattleWeight)}
                      </span>
                      <ChevronDown className="h-3.5 w-3.5 text-text-tertiary" />
                    </button>
                  </div>
                )}


                {/* 当前方案 */}
                {selectedPlan && (
                  <div className="rounded-lg border border-primary bg-brand-subtle/40 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-body text-foreground font-medium">
                          {selectedPlan.name}
                        </div>
                        <div className="text-caption text-text-tertiary mt-0.5 inline-flex items-start gap-1">
                          <FileText className="h-3 w-3 shrink-0 mt-0.5" />
                          <span>补充说明：{selectedPlan.note || "-"}</span>
                        </div>
                      </div>
                      {stdPlans.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setPlanSheetOpen(true)}
                          aria-label="切换方案"
                          title="切换方案"
                          className="shrink-0 h-7 w-7 inline-flex items-center justify-center rounded-md text-primary bg-card"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                      )}

                    </div>

                    <ul className="mt-3 space-y-2">
                      {selectedPlan.items.map((r) => {
                        const isTherapy = r.kind === "therapy";
                        const unit = r.doseUnit || "ml";
                        const baseDose = parseFloat(r.dose || "");
                        const w = cattleWeight ?? 0;
                        const isFixed = r.dosePer === "fixed";
                        const basisKg = r.dosePer === "100kg" ? 100 : 500;
                        const computedDose =
                          !isTherapy && !Number.isNaN(baseDose)
                            ? isFixed
                              ? baseDose
                              : w > 0
                                ? computePerDose(r, w)
                                : null
                            : null;
                        return (
                          <li
                            key={r.id}
                            className="rounded-md border border-border bg-card p-2.5"
                          >
                            <div className="flex items-start gap-1.5">
                              {isTherapy ? (
                                <Activity className="h-3.5 w-3.5 text-[#22ACEB] shrink-0 mt-0.5" />
                              ) : (
                                <Pill className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                              )}
                              <span className="text-body text-foreground min-w-0 flex-1">
                                {r.name}
                              </span>
                              {!isTherapy && r.alternatives && r.alternatives.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => setBrandSheet({ planId: selectedPlan.id, rxId: r.id })}
                                  className="shrink-0 inline-flex items-center gap-0.5 h-6 px-1.5 rounded-md text-caption text-primary hover:bg-brand-subtle"
                                >
                                  更换 <ChevronDown className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                            <div className="text-caption text-text-tertiary mt-1">
                              {isTherapy
                                ? [r.therapyMethod, r.frequency, r.days && `${r.days} 天`].filter(Boolean).join(" · ")
                                : [r.spec, r.use, r.usageMethod || [r.timesPerDay && `${r.timesPerDay} 次 / 天`, r.days && `连用 ${r.days} 天`].filter(Boolean).join(" · ")].filter(Boolean).join(" · ")}
                            </div>
                            {!isTherapy && (
                              <div className="text-caption text-primary mt-1 inline-flex items-start gap-1">
                                <Sparkles className="h-3 w-3 mt-0.5 shrink-0" />
                                <span>
                                {r.doseByQuarter
                                  ? `按非盲乳数：${r.doseByQuarter}（执行时选择）`
                                  : r.doseByWeight
                                  ? (cattleWeight != null
                                      ? (() => {
                                          const seg = r.doseByWeight!.split(/[；;]/).find((s) => {
                                            const m = s.match(/(\d+)\s*[-–~]\s*(\d+)/);
                                            if (m) {
                                              const lo = +m[1], hi = +m[2];
                                              return cattleWeight >= lo && cattleWeight < hi;
                                            }
                                            const ge = s.match(/[≥>]=?\s*(\d+)/);
                                            if (ge) return cattleWeight >= +ge[1];
                                            return false;
                                          });
                                          const dv = seg?.split("=")[1]?.trim();
                                          return dv ? `按体重区间：${dv} / 次` : "按体重区间计算";
                                        })()
                                      : "按体重区间计算 · 请选择体重")
                                  : isFixed
                                    ? `固定剂量 ${baseDose}${unit} / 次`
                                    : computedDose !== null
                                      ? `自动剂量 ${computedDose}${unit} / 次`
                                      : `请选择体重以计算剂量`}
                                </span>
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

              </div>
            )}
          </Section>


          {/* === 特殊处方 === */}
          <Section
            title="特殊处方"
            extra={
              <span className="text-caption text-text-tertiary">
                {specialList.length > 0 ? `${specialList.length} 项` : "可选"}
              </span>
            }
          >
            {!specialOpen && specialList.length === 0 ? (
              <button
                type="button"
                onClick={() => setSpecialOpen(true)}
                className="w-full h-10 rounded-lg border border-dashed border-border text-body-sm text-text-secondary inline-flex items-center justify-center gap-1.5"
              >
                <FileText className="h-3.5 w-3.5 text-primary" /> 开具特殊处方
              </button>
            ) : (
              <div className="space-y-3">
                <label className="block">
                  <div className="text-caption text-text-tertiary mb-1">
                    开具原因 <span className="text-[var(--state-danger)]">*</span>
                  </div>
                  <textarea
                    value={specialReason}
                    onChange={(e) => setSpecialReason(e.target.value)}
                    maxLength={200}
                    rows={2}
                    placeholder="如标准处方过敏、合并感染、孕期禁用等"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-border text-body-sm placeholder:text-text-tertiary focus:outline-none focus:border-primary resize-none"
                  />
                  <div className="text-caption text-text-tertiary text-right">{specialReason.length} / 200</div>
                </label>

                <label className="block">
                  <div className="text-caption text-text-tertiary mb-1">补充说明</div>
                  <textarea
                    value={specialPlanDesc}
                    onChange={(e) => setSpecialPlanDesc(e.target.value)}
                    maxLength={200}
                    rows={2}
                    placeholder="如：用药前后需监测体温、注意过敏反应、理疗操作细节等"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-border text-body-sm placeholder:text-text-tertiary focus:outline-none focus:border-primary resize-none"
                  />
                  <div className="text-caption text-text-tertiary text-right">{specialPlanDesc.length} / 200</div>
                </label>

                {/* 特殊处方 · 牛只体重（仅当特殊处方中有按体重计算的用药项时展示） */}
                {specialNeedsWeight && (
                  <div>
                    <div className="text-caption text-text-tertiary mb-1.5">
                      牛只体重 <span className="text-[var(--state-danger)]">*</span>
                      <span className="ml-1 text-text-tertiary">用于特殊处方剂量计算，需与标准处方一致</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setWeightSheetTarget("special")}
                      className="h-10 w-full px-3 rounded-lg bg-white border border-border text-body-sm inline-flex items-center justify-between"
                    >
                      <span className={specialCattleWeight == null ? "text-text-tertiary" : "text-foreground"}>
                        {specialCattleWeight == null ? "请选择牛只体重" : weightLabelOf(specialCattleWeight)}
                      </span>
                      <ChevronDown className="h-3.5 w-3.5 text-text-tertiary" />
                    </button>
                  </div>
                )}


                {specialList.length > 0 && (
                  <ul className="space-y-2">
                    {specialList.map((r) => {
                      const isTherapy = r.kind === "therapy";
                      const unit = r.doseUnit || "ml";
                      return (
                        <li key={r.id} className="rounded-lg border border-border bg-card p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start gap-1.5">
                                {isTherapy ? (
                                  <Activity className="h-3.5 w-3.5 text-[#22ACEB] shrink-0 mt-0.5" />
                                ) : (
                                  <Pill className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                                )}
                                <span className="text-body text-foreground min-w-0 flex-1">
                                  {r.name || (isTherapy ? "未填写治疗手段" : "未填写药品")}
                                </span>
                                {!isTherapy && r.isSpecialDrug && (
                                  <span className="tag tag-muted shrink-0">特殊</span>
                                )}
                              </div>
                              <div className="text-caption text-text-tertiary mt-1">
                                {isTherapy
                                  ? [r.therapyMethod, r.frequency, r.days && `${r.days} 天`].filter(Boolean).join(" · ")
                                  : [
                                      r.spec,
                                      r.use,
                                      r.dose && `${r.dose}${unit} / 次`,
                                      r.timesPerDay && `${r.timesPerDay} 次 / 天`,
                                      r.days && `${r.days} 天`,
                                    ].filter(Boolean).join(" · ")}
                              </div>
                            </div>
                            <div className="flex items-center gap-0.5 shrink-0">
                              <button
                                onClick={() => setEditingRx({ ...r })}
                                className="h-7 w-7 inline-flex items-center justify-center rounded-md text-primary hover:bg-brand-subtle"
                                aria-label="编辑"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => removeSpecialRx(r.id)}
                                className="h-7 w-7 inline-flex items-center justify-center rounded-md text-[var(--state-danger)] hover:bg-[color-mix(in_oklab,var(--state-danger)_8%,transparent)]"
                                aria-label="删除"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {(() => {
                  const reasonReady = specialReason.trim().length > 0;
                  return (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          disabled={!reasonReady}
                          onClick={() => {
                            if (!reasonReady) {
                              toast.error("请先填写开具原因");
                              return;
                            }
                            addSpecial("drug");
                          }}
                          className={`h-9 rounded-lg border border-dashed text-body-sm inline-flex items-center justify-center gap-1.5 ${
                            reasonReady
                              ? "border-border text-text-secondary"
                              : "border-border/60 text-text-tertiary opacity-60 cursor-not-allowed"
                          }`}
                        >
                          <Pill className="h-3.5 w-3.5 text-primary" /> 新增用药
                        </button>
                        <button
                          type="button"
                          disabled={!reasonReady}
                          onClick={() => {
                            if (!reasonReady) {
                              toast.error("请先填写开具原因");
                              return;
                            }
                            addSpecial("therapy");
                          }}
                          className={`h-9 rounded-lg border border-dashed text-body-sm inline-flex items-center justify-center gap-1.5 ${
                            reasonReady
                              ? "border-border text-text-secondary"
                              : "border-border/60 text-text-tertiary opacity-60 cursor-not-allowed"
                          }`}
                        >
                          <Activity className="h-3.5 w-3.5 text-[#22ACEB]" /> 新增非用药
                        </button>
                      </div>
                      {!reasonReady && (
                        <div className="text-caption text-text-tertiary text-center">
                          填写开具原因后才能新增特殊处方
                        </div>
                      )}
                    </>
                  );
                })()}


                {specialList.length === 0 && (
                  <button
                    type="button"
                    onClick={() => { setSpecialOpen(false); setSpecialReason(""); }}
                    className="w-full text-caption text-text-tertiary hover:text-text-secondary"
                  >
                    收起
                  </button>
                )}
              </div>
            )}

          </Section>




          {/* === 指派执行人 === */}
          <Section
            title="指派执行人"
            extra={<span className="text-caption text-text-tertiary">可选</span>}
          >
            {executor ? (
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-brand-subtle text-primary text-body">
                  <User className="h-3.5 w-3.5" />
                  {executor}
                </span>
                <button
                  onClick={() => setShowExecutorPicker(true)}
                  className="text-body-sm text-text-tertiary underline"
                >
                  更换
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowExecutorPicker(true)}
                className="w-full h-10 px-3 rounded-lg border border-dashed border-border text-body-sm text-text-tertiary inline-flex items-center justify-center gap-1.5"
              >
                <UserPlus className="h-3.5 w-3.5" /> 选择执行人（可选）
              </button>
            )}
          </Section>
        </div>
      </div>

      {/* 编辑处方弹层 */}
      {editingRx && (
        <DrugEditor
          value={editingRx}
          onChange={setEditingRx}
          onCancel={() => setEditingRx(null)}
          onSave={saveRxEdit}
        />
      )}

      {/* 底部提交按钮 */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] bg-card border-t border-border p-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
        <button
          onClick={submit}
          className="w-full h-11 rounded-lg bg-primary text-primary-foreground text-body inline-flex items-center justify-center gap-1.5"
        >
          <Send className="h-4 w-4" /> 提交诊断
        </button>
      </div>




      {/* 添加媒体选择弹层 */}
      {showMediaPicker && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end" onClick={() => setShowMediaPicker(false)}>
          <div
            className="w-full max-w-[440px] mx-auto bg-card rounded-t-2xl p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-section-title text-foreground">添加现场记录</div>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => { setPhotos((prev) => [...prev, `p${Date.now()}`]); setShowMediaPicker(false); }}
                className="flex flex-col items-center justify-center gap-2 h-24 rounded-xl border border-border bg-surface-subtle text-text-secondary"
              >
                <Camera className="h-6 w-6" />
                <span className="text-body-sm">拍照</span>
              </button>
              <button
                onClick={() => { setVideos((prev) => [...prev, `v${Date.now()}`]); setShowMediaPicker(false); }}
                className="flex flex-col items-center justify-center gap-2 h-24 rounded-xl border border-border bg-surface-subtle text-text-secondary"
              >
                <Video className="h-6 w-6" />
                <span className="text-body-sm">拍视频</span>
              </button>
              <button
                onClick={startRecord}
                className="flex flex-col items-center justify-center gap-2 h-24 rounded-xl border border-border bg-surface-subtle text-text-secondary"
              >
                <Mic className="h-6 w-6" />
                <span className="text-body-sm">录音</span>
              </button>
            </div>
            <button
              onClick={() => setShowMediaPicker(false)}
              className="w-full h-10 rounded-lg border border-border text-body-sm text-text-secondary"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 选择执行人弹层 */}
      {showExecutorPicker && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end" onClick={() => setShowExecutorPicker(false)}>
          <div
            className="w-full max-w-[440px] mx-auto bg-card rounded-t-2xl p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-section-title text-foreground">选择执行人</div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" />
              <input
                value={executorQuery}
                onChange={(e) => setExecutorQuery(e.target.value)}
                placeholder="搜索姓名"
                className="h-10 w-full pl-9 pr-3 rounded-lg bg-white border border-border text-body-sm placeholder:text-text-tertiary focus:outline-none focus:border-primary"
              />
            </div>
            <div className="space-y-1.5">
              {executorMatches.map((name) => (
                <button
                  key={name}
                  onClick={() => { setExecutor(name); setShowExecutorPicker(false); setExecutorQuery(""); }}
                  className={`w-full h-10 rounded-lg border text-body-sm inline-flex items-center justify-center gap-1.5 ${executor === name ? "border-primary bg-brand-subtle text-primary" : "border-border bg-white text-text-secondary"}`}
                >
                  <User className="h-3.5 w-3.5" />
                  {name}
                </button>
              ))}
            </div>
            <button
              onClick={() => { setShowExecutorPicker(false); setExecutorQuery(""); }}
              className="w-full h-10 rounded-lg border border-border text-body-sm text-text-secondary"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 选择牛只体重 */}
      {weightSheetTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end" onClick={() => setWeightSheetTarget(null)}>
          <div
            className="w-full bg-card rounded-t-2xl p-4 space-y-3 h-[75vh] max-h-[75vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="text-section text-foreground font-medium">
                选择牛只体重{weightSheetTarget === "special" ? "（特殊处方）" : ""}
              </div>
              <button
                onClick={() => setWeightSheetTarget(null)}
                className="h-7 w-7 inline-flex items-center justify-center rounded-md text-text-tertiary"
                aria-label="关闭"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <ul className="divide-y divide-border rounded-lg border border-border overflow-hidden">
              {WEIGHT_OPTIONS.map((opt) => {
                const current = weightSheetTarget === "std" ? cattleWeight : specialCattleWeight;
                const active = current === opt.value;
                return (
                  <li key={opt.value}>
                    <button
                      type="button"
                      onClick={() => {
                        if (weightSheetTarget === "std") setCattleWeight(opt.value);
                        else setSpecialCattleWeight(opt.value);
                        setWeightSheetTarget(null);
                      }}
                      className={`w-full px-3 py-3 flex items-center justify-between text-left ${
                        active ? "bg-brand-subtle/40 text-primary" : "bg-card text-foreground"
                      }`}
                    >
                      <span className="text-body">{opt.label}</span>
                      {active && <CheckCircle2 className="h-4 w-4 text-primary" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {/* 切换标准处方方案 */}
      {planSheetOpen && (

        <div className="fixed inset-0 z-50 bg-black/40 flex items-end" onClick={() => setPlanSheetOpen(false)}>
          <div
            className="w-full bg-card rounded-t-2xl p-4 space-y-3 h-[75vh] max-h-[75vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="text-section text-foreground font-medium">选择标准处方方案</div>
              <button
                onClick={() => setPlanSheetOpen(false)}
                className="h-7 w-7 inline-flex items-center justify-center rounded-md text-text-tertiary"
                aria-label="关闭"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <ul className="space-y-2">
              {stdPlans.map((plan) => {
                const active = plan.id === selectedPlanId;
                return (
                  <li key={plan.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPlanId(plan.id);
                        setPlanSheetOpen(false);
                      }}
                      className={`w-full text-left rounded-lg border p-3 transition-colors ${
                        active ? "border-primary bg-brand-subtle/40" : "border-border bg-card"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-body text-foreground font-medium">{plan.name}</div>
                          <div className="text-caption text-text-tertiary mt-0.5">{plan.desc || "-"}</div>
                          <div className="text-caption text-text-tertiary mt-1">
                            包含 {plan.items.length} 项 ·{" "}
                            {plan.items.filter((i) => i.kind === "drug").length} 用药 /{" "}
                            {plan.items.filter((i) => i.kind === "therapy").length} 理疗
                          </div>
                        </div>
                        <span
                          className={`shrink-0 h-5 w-5 rounded-full border inline-flex items-center justify-center ${
                            active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"
                          }`}
                        >
                          {active && <CheckCircle2 className="h-3.5 w-3.5" />}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {/* 品牌替换抽屉 */}
      {brandSheet && (() => {
        const plan = stdPlans.find((p) => p.id === brandSheet.planId);
        const rx = plan?.items.find((i) => i.id === brandSheet.rxId);
        if (!plan || !rx || !rx.alternatives) return null;
        return (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-end" onClick={() => setBrandSheet(null)}>
            <div
              className="w-full bg-card rounded-t-2xl p-4 space-y-3 h-[75vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div className="text-section text-foreground font-medium">更换药品</div>
                <button
                  onClick={() => setBrandSheet(null)}
                  className="h-7 w-7 inline-flex items-center justify-center rounded-md text-text-tertiary"
                  aria-label="关闭"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <ul className="space-y-2 flex-1 overflow-y-auto -mx-1 px-1">
                {rx.alternatives.map((name) => {
                  const active = name === rx.name;
                  const qty = drugStock[name]?.qty ?? 0;
                  const inStock = qty > 0;
                  return (
                    <li key={name}>
                      <button
                        type="button"
                        onClick={() => switchBrand(name)}
                        className={`w-full text-left rounded-lg border p-3 transition-colors ${
                          active ? "border-primary bg-brand-subtle/40" : "border-border bg-card"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-body text-foreground">{name}</div>
                            <div className="text-caption mt-0.5">
                              {inStock ? (
                                <span className="text-primary">{formatStockDisplay(name)}</span>
                              ) : (
                                <span className="text-[var(--state-danger)]">暂无库存</span>
                              )}
                            </div>
                          </div>
                          <span
                            className={`shrink-0 h-5 w-5 rounded-full border inline-flex items-center justify-center ${
                              active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"
                            }`}
                          >
                            {active && <CheckCircle2 className="h-3.5 w-3.5" />}
                          </span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        );
      })()}

      {/* 提交校验：缺药 / 规则二次确认 */}
      {submitCheck && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setSubmitCheck(null)}
        >
          <div
            className="w-full max-w-sm bg-card rounded-2xl p-4 space-y-3 max-h-[75vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[var(--state-warning,#F59E0B)]" />
              <div className="text-section text-foreground font-medium">
                {submitCheck.stage === "rules" ? "规则告警" : "提交前请确认"}
              </div>
            </div>

            {submitCheck.stage === "stock" && (
              <div className="space-y-1.5">
                <div className="text-caption text-text-tertiary inline-flex items-center gap-1">
                  <Package className="h-3.5 w-3.5" /> 库存不足（请联系管理人员调拨库存）
                </div>
                <ul className="rounded-lg border border-border divide-y divide-border">
                  {submitCheck.shortages.map((s) => (
                    <li key={s.name} className="px-3 py-2">
                      <div className="text-body-sm text-foreground">{s.name}</div>
                      <div className="text-caption text-text-tertiary mt-0.5">
                        需要 {s.need}
                        {s.unit} · 库存 {s.stock}
                        {s.unit} · 缺 {Math.round((s.need - s.stock) * 10) / 10}
                        {s.unit}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {submitCheck.stage === "rules" && (
              <div className="space-y-1.5">
                <ul className="rounded-lg border border-[var(--state-danger)]/30 bg-[color-mix(in_oklab,var(--state-danger)_4%,transparent)] divide-y divide-[var(--state-danger)]/20">
                  {submitCheck.violations.map((v, i) => (
                    <li key={i} className="px-3 py-2">
                      <div className="text-body-sm text-foreground">{v.title}</div>
                      <div className="text-caption text-text-tertiary mt-0.5">{v.detail}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setSubmitCheck(null)}
                className="flex-1 h-10 rounded-lg border border-border text-body-sm text-text-secondary"
              >
                返回修改
              </button>
              <button
                onClick={() => {
                  if (submitCheck.stage === "stock") {
                    setSubmitCheck(null);
                    proceedRuleCheck();
                  } else {
                    doSubmit();
                  }
                }}
                className={`flex-1 h-10 rounded-lg text-body-sm text-white font-medium ${
                  submitCheck.stage === "rules"
                    ? "bg-[var(--state-danger)]"
                    : "bg-primary"
                }`}
              >
                {submitCheck.stage === "rules" ? "仍旧提交" : "知道了，继续提交"}
              </button>
            </div>
          </div>
        </div>
      )}

      <DiseasePicker
        open={diseasePickerOpen}
        onClose={() => setDiseasePickerOpen(false)}
        diseases={effectiveDiseaseLibrary.map((d) => ({ name: d.name, symptoms: d.symptoms }))}
        selectedName={disease || undefined}
        matchedSymptoms={symptoms}
        onSelect={(d) => {
          const full = rankedDiseases.find((x) => x.name === d.name);
          if (full) pickDisease(full);
        }}
      />

    </MobileShell>


  );
}


function Section({
  title,
  children,
  extra,
  required,
  hint,
}: {
  title: string;
  children: React.ReactNode;
  extra?: React.ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className="rounded-xl bg-card border border-border p-4">
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="text-card-title text-foreground">
            {title}
            {required && <span className="text-[var(--state-danger)] ml-1">*</span>}
          </div>
          {hint && <span className="text-caption text-text-tertiary truncate">{hint}</span>}
        </div>
        {extra}
      </div>
      {children}
    </div>
  );
}


function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-caption text-text-tertiary">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full px-3 rounded-lg bg-white border border-border text-body-sm focus:outline-none focus:border-primary"
      />
    </label>
  );
}

function DrugEditor({
  value,
  onChange,
  onCancel,
  onSave,
}: {
  value: Prescription;
  onChange: (v: Prescription) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const isTherapy = value.kind === "therapy";
  const [query, setQuery] = useState(value.name);
  const [focused, setFocused] = useState(false);
  const matches = useMemo(() => {
    const kw = query.trim().toLowerCase();
    if (!kw) return drugLibrary.slice(0, 6);
    return drugLibrary.filter((d) => d.name.toLowerCase().includes(kw)).slice(0, 6);
  }, [query]);
  const matched = drugLibrary.find((d) => d.name === value.name);

  const pickDrug = (d: DrugItem) => {
    onChange({
      ...value,
      name: d.name,
      maker: d.maker,
      spec: d.spec,
      use: value.use || d.recommendedUse,
      doseUnit: value.doseUnit || d.defaultUnit,
      isSpecialDrug: d.isSpecial ?? false,
    });
    setQuery(d.name);
    setFocused(false);
  };


  const setSlot = (k: SlotKey, v: string) =>
    onChange({ ...value, slots: { ...(value.slots || {}), [k]: v } });

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end" onClick={onCancel}>
      <div
        className="w-full max-w-[440px] mx-auto bg-card rounded-t-2xl h-[75vh] max-h-[75vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 pt-4 pb-2 shrink-0">
          <div className="text-section-title text-foreground">
            {isTherapy ? "编辑治疗手段" : "编辑药品"}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 space-y-4">
        {isTherapy ? (
          <>
            {/* 治疗手段类型 */}
            <div className="space-y-1.5">
              <span className="text-caption text-text-tertiary">治疗手段</span>
              <div className="flex flex-wrap gap-1.5">
                {therapyMethods.map((m) => {
                  const active = value.therapyMethod === m;
                  return (
                    <button
                      key={m}
                      onClick={() =>
                        onChange({
                          ...value,
                          therapyMethod: m,
                          name: value.name || m,
                        })
                      }
                      className={`h-8 px-3 rounded-full text-caption transition-colors ${
                        active
                          ? "bg-primary text-primary-foreground"
                          : "bg-white border border-border text-text-secondary"
                      }`}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 名称 */}
            <label className="block space-y-1">
              <span className="text-caption text-text-tertiary">方案名称</span>
              <input
                value={value.name}
                onChange={(e) => onChange({ ...value, name: e.target.value })}
                placeholder="如 乳房热敷按摩"
                className="h-10 w-full px-3 rounded-lg bg-white border border-border text-body-sm focus:outline-none focus:border-primary"
              />
            </label>

            {/* 频次 / 天数 */}
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-caption text-text-tertiary">频次</span>
                <input
                  value={value.frequency || ""}
                  onChange={(e) => onChange({ ...value, frequency: e.target.value })}
                  placeholder="如 2 次 / 天"
                  className="h-10 w-full px-3 rounded-lg bg-white border border-border text-body-sm focus:outline-none focus:border-primary"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-caption text-text-tertiary">持续天数</span>
                <div className="relative">
                  <input
                    value={value.days}
                    onChange={(e) => onChange({ ...value, days: e.target.value })}
                    inputMode="numeric"
                    placeholder="如 3"
                    className="h-10 w-full pl-3 pr-9 rounded-lg bg-white border border-border text-body-sm focus:outline-none focus:border-primary"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-caption text-text-tertiary">天</span>
                </div>
              </label>
            </div>
          </>
        ) : (
          <>
            {/* 药品搜索 */}
            <div className="space-y-1">
              <span className="text-caption text-text-tertiary">药品名称</span>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                <input
                  value={query}
                  onChange={(e) => {
                    const next = e.target.value;
                    setQuery(next);
                    setFocused(true);
                    // 只允许从药品库中选择:输入框仅用于搜索,不直接写入 name
                    // 当输入内容与已选药品不一致时,清空已选药品信息
                    if (value.name && next !== value.name) {
                      onChange({ ...value, name: "", maker: "", spec: "" });
                    }
                  }}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setTimeout(() => setFocused(false), 150)}
                  placeholder="输入关键字从药品库选择"
                  className="h-10 w-full pl-9 pr-3 rounded-lg bg-white border border-border text-body-sm focus:outline-none focus:border-primary"
                />
                {focused && matches.length > 0 && (
                  <div className="absolute z-10 left-0 right-0 mt-1 rounded-lg border border-border bg-card shadow-lg max-h-60 overflow-auto">
                    {matches.map((d) => (
                      <button
                        key={d.name}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => pickDrug(d)}
                        className="w-full text-left px-3 py-2.5 hover:bg-surface-subtle border-b border-border last:border-b-0"
                      >
                        <div className="text-body-sm text-foreground">{d.name}</div>
                        <div className="text-caption text-text-tertiary mt-0.5">
                          {d.maker} · {d.spec}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {focused && matches.length === 0 && (
                  <div className="absolute z-10 left-0 right-0 mt-1 rounded-lg border border-border bg-card shadow-lg px-3 py-3 text-caption text-text-tertiary">
                    药品库中暂无匹配项,请联系管理员录入后再开具
                  </div>
                )}
              </div>
              {matched ? (
                <div className="rounded-md bg-brand-subtle border border-primary/15 px-2.5 py-1.5 text-caption text-text-secondary mt-1.5">
                  <span className="text-primary font-medium">{matched.maker}</span>
                  <span className="mx-1.5 text-text-tertiary">·</span>
                  规格 {matched.spec}
                </div>
              ) : query.trim() && !value.name ? (
                <div className="text-caption text-[var(--state-alert)] mt-1.5">
                  请从下拉列表中选择药品
                </div>
              ) : null}
            </div>

            {/* 使用方式 */}
            <div className="space-y-1.5">
              <span className="text-caption text-text-tertiary">使用方式</span>
              <div className="flex flex-wrap gap-1.5">
                {(matched?.allowedUses ?? useMethods).map((m) => {
                  const active = value.use === m;
                  const recommended = matched?.recommendedUse === m;
                  return (
                    <button
                      key={m}
                      onClick={() => onChange({ ...value, use: m })}
                      className={`h-8 px-3 rounded-full text-caption transition-colors inline-flex items-center gap-1 ${
                        active
                          ? "bg-primary text-primary-foreground"
                          : "bg-white border border-border text-text-secondary"
                      }`}
                    >
                      <span>{m}</span>
                      {recommended && (
                        <span
                          className={`text-caption px-1 rounded ${
                            active
                              ? "bg-white/20 text-primary-foreground"
                              : "bg-brand-subtle text-primary"
                          }`}
                        >
                          推荐
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {matched && (
                <div className="text-caption text-text-tertiary">
                  根据药品说明书，仅可选择以上使用方式
                </div>
              )}
            </div>

            {/* 区分用药时间段 切换 */}
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-body-sm text-foreground">区分用药时间段</div>
                <div className="text-caption text-text-tertiary mt-0.5">
                  开启后按上午 / 中午 / 晚上分别填写剂量
                </div>
              </div>
              <Switch
                checked={!!value.splitTime}
                onCheckedChange={(checked) =>
                  onChange({ ...value, splitTime: checked })
                }
              />
            </div>

            {/* 剂量 */}
            {value.splitTime ? (
              <div className="space-y-1.5">
                <div className="text-caption text-text-tertiary">分时段剂量</div>
                <div className="grid grid-cols-3 gap-2">
                  {(["morning", "noon", "evening"] as SlotKey[]).map((k) => (
                    <label key={k} className="block space-y-1">
                      <span className="text-caption text-text-tertiary">
                        {SLOT_LABEL[k]}
                      </span>
                      <div className="relative">
                        <input
                          value={value.slots?.[k] || ""}
                          onChange={(e) => setSlot(k, e.target.value)}
                          placeholder="剂量"
                          inputMode="decimal"
                          className="h-10 w-full pl-3 pr-9 rounded-lg bg-white border border-border text-body-sm focus:outline-none focus:border-primary"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-caption text-text-tertiary">
                          {value.doseUnit || "ml"}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-caption text-text-tertiary">单次用量</span>
                  <div className="relative">
                    <input
                      value={value.dose || ""}
                      onChange={(e) => onChange({ ...value, dose: e.target.value })}
                      inputMode="decimal"
                      placeholder="如 2"
                      className="h-10 w-full pl-3 pr-10 rounded-lg bg-white border border-border text-body-sm focus:outline-none focus:border-primary"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-caption text-text-tertiary">
                      {value.doseUnit || "ml"}
                    </span>
                  </div>
                </label>

                <label className="block space-y-1">
                  <span className="text-caption text-text-tertiary">每天次数</span>
                  <div className="relative">
                    <input
                      value={value.timesPerDay || ""}
                      onChange={(e) => onChange({ ...value, timesPerDay: e.target.value })}
                      inputMode="numeric"
                      placeholder="如 2"
                      className="h-10 w-full pl-3 pr-12 rounded-lg bg-white border border-border text-body-sm focus:outline-none focus:border-primary"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-caption text-text-tertiary">次 / 天</span>
                  </div>
                </label>
              </div>
            )}



            {/* 用药天数 */}
            <label className="block space-y-1">
              <span className="text-caption text-text-tertiary">用药天数</span>
              <div className="relative">
                <input
                  value={value.days}
                  onChange={(e) => onChange({ ...value, days: e.target.value })}
                  inputMode="numeric"
                  placeholder="如 3"
                  className="h-10 w-full pl-3 pr-9 rounded-lg bg-white border border-border text-body-sm focus:outline-none focus:border-primary"
                />

                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-caption text-text-tertiary">天</span>
              </div>
            </label>
          </>
        )}
        </div>
        <div className="px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-border shrink-0 bg-card">
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="flex-1 h-10 rounded-lg border border-border text-body-sm text-text-secondary"
            >
              取消
            </button>
            <button
              onClick={onSave}
              className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-body-sm"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
