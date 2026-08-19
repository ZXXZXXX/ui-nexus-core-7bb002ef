import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Search,
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  PlayCircle,
  ChevronRight,
  Stethoscope,
  PackageMinus,
  Footprints,
  Home,
  PackageCheck,
} from "lucide-react";
import { MobileShell } from "@/components/mobile-shell";
import { EmptyState } from "@/components/empty-state";
import { useRole, canVisit, canDiagnose, canExecute } from "@/lib/mobile-role";

import { PICKUPS, useClaimed } from "@/lib/pickup-store";

type HealthSearch = { tab?: string; type?: string };
export const Route = createFileRoute("/m/health/")({
  head: () => ({ meta: [{ title: "工单列表 · 奇点智牧" }] }),
  validateSearch: (s: Record<string, unknown>): HealthSearch => ({
    ...(typeof s.tab === "string" ? { tab: s.tab } : {}),
    ...(typeof s.type === "string" ? { type: s.type } : {}),
  }),
  component: TaskListPage,
});



type Status = "待诊断" | "进行中" | "已完成" | "已终止";
type Kind = "健康" | "损耗" | "修蹄" | "领取";

type Scope = { type: "single"; ear: string } | { type: "batch"; label: string };
type Task = {
  id: string;
  target: string;
  barn: string;
  kind: Kind;
  type: string;
  event: string;
  proposer: string;
  who: string;
  visitor?: string;
  status: Status;
  createdAt: string;
  reportedAt?: string;
  executedAt?: string;
  reviewedAt?: string;
  terminatedAt?: string;
  /** 单只 or 批量 */
  scope: Scope;
  /** 结论 / 疑似结论 */
  conclusion: string;
  /** 具体描述（执行/动作/上下文） */
  desc?: string;
  needPickup: boolean;
  // 损耗专属
  item?: string;
  qty?: string;
  reapply?: { name: string; qty: string };
  // 健康专属
  symptoms?: string[];
  // 领取专属：来源工单号
  source?: string;
};

// 数据来源：晟安标准处方 · 子宫炎类 / 产后护理 / 肢蹄病类 / 干奶
const tasks: Task[] = [
  // === 疾病治疗 · 子宫炎类（待诊断 / 进行中 / 已完成）===
  { id: "WO-2381", target: "#01-24-2381", barn: "产房 1 号", kind: "健康", type: "疾病治疗", event: "产道创伤 · 阴道黏膜层撕裂", proposer: "陈晓东", who: "李雨晴", visitor: "王主管", status: "待诊断", createdAt: "2026-05-28", reportedAt: "2026-05-28", scope: { type: "single", ear: "#01-24-2381" }, conclusion: "疑似产道创伤", desc: "助产后阴道黏膜层撕裂，出血 >5cm，需外科处理 + 抗生素", needPickup: true, symptoms: ["阴道黏膜层撕裂", "助产 3 分及以上", "外阴红肿"] },
  { id: "WO-2382", target: "#01-24-2270", barn: "病牛舍", kind: "健康", type: "疾病治疗", event: "产后子宫炎 · 体温 39.8℃", proposer: "陈晓东", who: "李雨晴", visitor: "王主管", status: "待诊断", createdAt: "2026-05-29", reportedAt: "2026-05-29", scope: { type: "single", ear: "#01-24-2270" }, conclusion: "疑似产后子宫炎", desc: "产后 6 天体温 39.8℃，分泌物恶臭", needPickup: true, symptoms: ["体温 39.8℃", "分泌物恶臭", "产后 10 天内"] },
  { id: "WO-2385", target: "#01-24-2188", barn: "病牛舍", kind: "健康", type: "疾病治疗", event: "子宫内膜炎 · 直肠检查异常", proposer: "李雨晴", who: "—", visitor: "王主管", status: "待诊断", createdAt: "2026-05-29", reportedAt: "2026-05-29", scope: { type: "single", ear: "#01-24-2188" }, conclusion: "疑似子宫内膜炎", desc: "产后 24 天直肠检查子宫异常，分泌物含 >50% 脓", needPickup: true, symptoms: ["直肠检查子宫异常", "分泌物含 >50% 脓", "产后 21-28 天"] },

  { id: "WO-2298", target: "#01-24-2298", barn: "病牛舍", kind: "健康", type: "疾病治疗", event: "产后子宫炎 · 处方 2 复诊", proposer: "李雨晴", who: "李雨晴", visitor: "王主管", status: "进行中", createdAt: "2026-05-27", executedAt: "2026-05-28", scope: { type: "single", ear: "#01-24-2298" }, conclusion: "产后子宫炎", desc: "5% 头孢噻呋 + 氟尼辛 处方 2，用药第 3 天复诊", needPickup: true, symptoms: ["分泌物含 >50% 脓"] },
  { id: "WO-2299", target: "#01-24-2270", barn: "病牛舍", kind: "健康", type: "疾病治疗", event: "产后子宫炎 · 处方 1 疗程第 2 天", proposer: "李雨晴", who: "李雨晴", visitor: "王主管", status: "进行中", createdAt: "2026-05-28", executedAt: "2026-05-28", scope: { type: "single", ear: "#01-24-2270" }, conclusion: "产后子宫炎", desc: "青霉素钠 + 氟尼辛葡甲胺，1 天 2 次连用 3 天", needPickup: true, symptoms: ["体温 39.8℃", "分泌物恶臭"] },
  { id: "WO-2300", target: "#01-24-2188", barn: "病牛舍", kind: "健康", type: "疾病治疗", event: "子宫内膜炎 · 处方 1 疗程第 2 天", proposer: "李雨晴", who: "李雨晴", visitor: "王主管", status: "进行中", createdAt: "2026-05-28", executedAt: "2026-05-28", scope: { type: "single", ear: "#01-24-2188" }, conclusion: "子宫内膜炎", desc: "直肠按压排脓 + 青霉素钠 + 氟尼辛葡甲胺", needPickup: true, symptoms: ["直肠检查子宫异常"] },
  { id: "WO-2301", target: "#01-24-2156", barn: "病牛舍", kind: "健康", type: "疾病治疗", event: "产后子宫炎 · 处方 3 灌注", proposer: "李雨晴", who: "李雨晴", visitor: "王主管", status: "进行中", createdAt: "2026-05-26", executedAt: "2026-05-27", scope: { type: "single", ear: "#01-24-2156" }, conclusion: "产后子宫炎", desc: "10% 头孢噻呋 + 利福昔明子宫灌注 100ml", needPickup: true, symptoms: ["产后 5 天以上", "分泌物含 >50% 脓"] },
  { id: "WO-2440", target: "#01-24-2440", barn: "病牛舍", kind: "健康", type: "疾病治疗", event: "产后子宫炎 · 待复查", proposer: "陈晓东", who: "李雨晴", visitor: "王主管", status: "进行中", createdAt: "2026-05-20", executedAt: "2026-05-22", reviewedAt: "2026-05-25", scope: { type: "single", ear: "#01-24-2440" }, conclusion: "产后子宫炎（处方已执行完成，待复查验收）", desc: "3 天疗程执行完成，待兽医复查体温与分泌物", needPickup: false, symptoms: ["分泌物恶臭"] },
  { id: "WO-2199", target: "#01-24-2199", barn: "病牛舍", kind: "健康", type: "疾病治疗", event: "产后子宫炎 · 复查超时自动归档", proposer: "陈晓东", who: "李雨晴", visitor: "王主管", status: "已完成", createdAt: "2026-05-08", executedAt: "2026-05-10", reviewedAt: "2026-05-13", scope: { type: "single", ear: "#01-24-2199" }, conclusion: "产后子宫炎 · 48 小时未复查自动归档", desc: "复查任务触发后 48 小时无人执行，系统自动归档", needPickup: false, symptoms: ["分泌物恶臭"] },

  // === 产后护理（14 天连续检查 + 保健处方）===
  { id: "PP-2501", target: "#01-24-2710", barn: "产房 1 号", kind: "健康", type: "产后护理", event: "产后检查 · 第 3/14 天", proposer: "平台下发", who: "周凯", visitor: "—", status: "进行中", createdAt: "2026-05-25", executedAt: "2026-05-28", scope: { type: "single", ear: "#01-24-2710" }, conclusion: "产后检查", desc: "直肠体温数字录入 + 正前/正后照片采集，日 1 次连续 14 天", needPickup: false, symptoms: [] },
  { id: "PP-2502", target: "#01-24-2722", barn: "产房 1 号", kind: "健康", type: "产后护理", event: "产后保健 · 助产 4 分预防", proposer: "平台下发", who: "周凯", visitor: "—", status: "进行中", createdAt: "2026-05-27", executedAt: "2026-05-28", scope: { type: "single", ear: "#01-24-2722" }, conclusion: "产后保健（处方 1）", desc: "5% 头孢噻呋 4.4ml/100kg IM + 氟尼辛葡甲胺 IV，1 天 1 次连用 3 天", needPickup: true, symptoms: [] },
  { id: "PP-2503", target: "#01-24-2735", barn: "产房 2 号", kind: "健康", type: "产后护理", event: "产后保健 · 双胎预防", proposer: "平台下发", who: "周凯", visitor: "—", status: "进行中", createdAt: "2026-05-26", executedAt: "2026-05-27", scope: { type: "single", ear: "#01-24-2735" }, conclusion: "产后保健（处方 2）", desc: "10% 头孢噻呋 20ml IM 3 天 1 次 + 氟尼辛葡甲胺，连用 3 天", needPickup: true, symptoms: [] },
  { id: "PP-2601", target: "#01-24-2801", barn: "产房 1 号", kind: "健康", type: "产后护理", event: "产犊后待诊断", proposer: "平台下发", who: "—", visitor: "王主管", status: "待诊断", createdAt: "2026-05-29", reportedAt: "2026-05-29 06:42", scope: { type: "single", ear: "#01-24-2801" }, conclusion: "产犊后待诊断", desc: "牛只于 2026/05/29 06:42 产犊，请前往诊断是否需要特殊产后护理", needPickup: false, symptoms: [] },
  { id: "PP-2602", target: "#01-24-2815", barn: "产房 2 号", kind: "健康", type: "产后护理", event: "产犊后待诊断", proposer: "平台下发", who: "—", visitor: "王主管", status: "待诊断", createdAt: "2026-05-29", reportedAt: "2026-05-29 14:08", scope: { type: "single", ear: "#01-24-2815" }, conclusion: "产犊后待诊断", desc: "牛只于 2026/05/29 14:08 产犊，请前往诊断", needPickup: false, symptoms: [] },

  // === 修蹄工单 · 肢蹄病类 ===
  { id: "HF-0702", target: "#01-24-2150", barn: "病牛舍", kind: "修蹄", type: "修蹄", event: "腐蹄病 · 处方 1", proposer: "周凯", who: "外部·张师傅", visitor: "王主管", status: "进行中", createdAt: "2026-05-28", executedAt: "2026-05-28", scope: { type: "single", ear: "#01-24-2150" }, conclusion: "腐蹄病", desc: "10% 头孢噻呋 25ml IM 3 天 1 次 + 氟尼辛 4.4ml/100kg IV，患蹄清创消毒", needPickup: true },
  { id: "HF-0703", target: "#01-24-2151", barn: "病牛舍", kind: "修蹄", type: "修蹄", event: "腐蹄病 · 处方 2 备用", proposer: "周凯", who: "外部·张师傅", visitor: "王主管", status: "进行中", createdAt: "2026-05-27", executedAt: "2026-05-28", scope: { type: "single", ear: "#01-24-2151" }, conclusion: "腐蹄病", desc: "青霉素钠 IM + 0.9% 氯化钠 IV，1 天 1 次连用 3 天", needPickup: true },
  { id: "HF-0704", target: "#01-24-2188", barn: "病牛舍", kind: "修蹄", type: "修蹄", event: "蹄趾皮炎 · 护蹄膏包扎", proposer: "周凯", who: "外部·张师傅", visitor: "王主管", status: "进行中", createdAt: "2026-05-27", executedAt: "2026-05-28", scope: { type: "single", ear: "#01-24-2188" }, conclusion: "蹄趾皮炎", desc: "清洗清创后涂抹护蹄膏并包扎，每 3 天换药 1 次", needPickup: true },
  { id: "HF-0705", target: "#01-24-2298", barn: "病牛舍", kind: "修蹄", type: "修蹄", event: "蹄底溃疡 · 清创引流", proposer: "周凯", who: "外部·张师傅", visitor: "王主管", status: "进行中", createdAt: "2026-05-26", executedAt: "2026-05-27", scope: { type: "single", ear: "#01-24-2298" }, conclusion: "蹄底溃疡", desc: "双氧水 + 10% 浓碘酊消毒，剔除腐烂角质深挖至真皮，健趾加垫蹄垫", needPickup: true },
  { id: "HF-0706", target: "#01-24-2199", barn: "病牛舍", kind: "修蹄", type: "修蹄", event: "蹄疣 · 防腐生肌散", proposer: "周凯", who: "外部·张师傅", visitor: "王主管", status: "进行中", createdAt: "2026-05-26", executedAt: "2026-05-27", scope: { type: "single", ear: "#01-24-2199" }, conclusion: "蹄疣", desc: "蹄部清洗消毒后局部涂抹防腐生肌散（祛呋宁）", needPickup: true },
  { id: "HF-0707", target: "#01-24-2210", barn: "病牛舍", kind: "修蹄", type: "修蹄", event: "白线病 · 远轴侧蹄壁清创", proposer: "周凯", who: "外部·张师傅", visitor: "王主管", status: "进行中", createdAt: "2026-05-25", executedAt: "2026-05-26", scope: { type: "single", ear: "#01-24-2210" }, conclusion: "白线病", desc: "清创同蹄底溃疡，牺牲部分远轴侧蹄壁保证引流，10% 浓碘酊消毒", needPickup: true },
  { id: "HF-0708", target: "3 号牛舍", barn: "3 号牛舍", kind: "修蹄", type: "修蹄", event: "功能性蹄浴液喷蹄", proposer: "周凯", who: "外部·张师傅", visitor: "王主管", status: "进行中", createdAt: "2026-05-24", executedAt: "2026-05-25", scope: { type: "batch", label: "3 号牛舍 32 头" }, conclusion: "蹄趾皮炎（群体预防）", desc: "功能性蹄浴液按说明浓度喷蹄，连续 5-7 天", needPickup: true },
  { id: "HF-0688", target: "#01-24-2270", barn: "病牛舍", kind: "修蹄", type: "修蹄", event: "蹄底溃疡 · 已完成", proposer: "周凯", who: "外部·张师傅", visitor: "王主管", status: "已完成", createdAt: "2026-05-12", executedAt: "2026-05-12", scope: { type: "single", ear: "#01-24-2270" }, conclusion: "蹄底溃疡", desc: "清创 + 蹄垫", needPickup: true },

  // === 干奶工单 · 乳注处方 ===
  { id: "GN-0208", target: "#01-24-2208", barn: "干奶舍", kind: "健康", type: "干奶", event: "干奶 · 待诊断", proposer: "平台下发", who: "李雨晴", visitor: "—", status: "待诊断", createdAt: "2026-05-28", executedAt: "—", scope: { type: "single", ear: "#01-24-2208" }, conclusion: "常规干奶", desc: "达到干奶日龄，待兽医诊断并开具乳注处方", needPickup: false },
  { id: "GN-0185", target: "#01-24-2185", barn: "干奶舍", kind: "健康", type: "干奶", event: "干奶 · 处方 2 茹通", proposer: "平台下发", who: "李雨晴", visitor: "—", status: "进行中", createdAt: "2026-05-28", executedAt: "2026-05-28", scope: { type: "single", ear: "#01-24-2185" }, conclusion: "常规干奶", desc: "硫酸头孢喹肟乳房注入剂（茹通）3g/支，一次量乳注", needPickup: true },
  { id: "GN-0120", target: "#01-24-2120", barn: "干奶舍", kind: "健康", type: "干奶", event: "干奶 · 处方 4 畜可健", proposer: "平台下发", who: "李雨晴", visitor: "—", status: "进行中", createdAt: "2026-05-27", executedAt: "2026-05-28", scope: { type: "single", ear: "#01-24-2120" }, conclusion: "常规干奶", desc: "盐酸头孢噻呋乳房注入剂（畜可健）8ml/支，一次量乳注", needPickup: true },

  // === 疫苗免疫（保留原样例）===
  { id: "YM-2501", target: "1 号牛舍", barn: "1 号牛舍", kind: "健康", type: "免疫", event: "口蹄疫常规免疫（平台下发）", proposer: "平台下发", who: "李雨晴", visitor: "—", status: "进行中", createdAt: "2026-05-28", executedAt: "2026-05-28", scope: { type: "batch", label: "1 号牛舍 全群" }, conclusion: "口蹄疫常规免疫", desc: "平台统一下发的免疫计划，按批次注射免疫药物", needPickup: true, symptoms: [] },
  { id: "WO-2401", target: "犊牛舍 A", barn: "犊牛舍 A", kind: "健康", type: "免疫", event: "口蹄疫加强免疫", proposer: "周凯", who: "周凯", visitor: "王主管", status: "进行中", createdAt: "2026-05-29", executedAt: "2026-05-29", scope: { type: "batch", label: "犊牛舍 A 全群" }, conclusion: "口蹄疫加强免疫", desc: "犊牛批次 B-07", needPickup: true, symptoms: [] },

  // === 已终止示例 ===
  { id: "WO-2324", target: "#01-24-2324", barn: "5 号牛舍", kind: "健康", type: "疾病治疗", event: "疑似产后子宫炎 · 已终止", proposer: "张伟", who: "王建国", visitor: "王主管", status: "已终止", createdAt: "2026-05-26", terminatedAt: "2026-05-26", scope: { type: "single", ear: "#01-24-2324" }, conclusion: "复检体温正常，取消治疗", desc: "牛只自愈，工单终止", needPickup: false, symptoms: ["体温升高"] },
  { id: "YM-2042", target: "1 号牛舍", barn: "1 号牛舍", kind: "健康", type: "疫苗", event: "疫苗补免", proposer: "周凯", who: "周凯", visitor: "王医生", status: "已终止", createdAt: "2026-05-28", terminatedAt: "2026-05-28", scope: { type: "batch", label: "1 号牛舍 全群" }, conclusion: "疫苗补免", desc: "计划调整，暂不执行", needPickup: true },

  // === 损耗（列表已过滤，保留数据）===
  { id: "LS-1029", target: "口蹄疫疫苗 A 型", barn: "2 号牛舍", kind: "损耗", type: "物资损耗", event: "冷链断电", proposer: "孙明", who: "李雨晴", visitor: "王主管", status: "待诊断", createdAt: "2026-05-28", reportedAt: "2026-05-28", scope: { type: "batch", label: "8 支" }, conclusion: "冷链断电导致失效", needPickup: false, item: "口蹄疫疫苗 A 型", qty: "8 支", reapply: { name: "口蹄疫疫苗 A 型", qty: "8 支" } },
];

// 进行中对执行人即“执行中”
const tabs: { key: Status | "全部" | "执行中"; label: string }[] = [
  { key: "全部", label: "全部" },
  { key: "待诊断", label: "待诊断" },
  { key: "执行中", label: "执行中" },
  { key: "已完成", label: "已完成" },
  
  { key: "已终止", label: "已终止" },
];


const statusTone: Record<Status, { tag: string; icon: typeof PlayCircle; color: string }> = {
  待诊断: { tag: "tag tag-warning", icon: ClipboardList, color: "" },
  进行中: { tag: "tag tag-info", icon: PlayCircle, color: "" },
  已完成: { tag: "tag tag-success", icon: CheckCircle2, color: "" },
  已终止: { tag: "tag tag-danger", icon: AlertTriangle, color: "" },
};



const kindIcon: Record<Kind, typeof Stethoscope> = {
  健康: Stethoscope,
  损耗: PackageMinus,
  修蹄: Footprints,
  领取: PackageCheck,
};

function cleanName(name: string) {
  return name.replace(/^(内部|外部)·/, "");
}

// 疾病工单的诊断/疑似 + 初诊/复诊 元数据（对齐晟安标准处方文档）
const diseaseMeta: Record<string, { visit: "初诊" | "复诊"; diagnosis?: string; suspected?: string }> = {
  "WO-2381": { visit: "初诊", suspected: "产道创伤" },
  "WO-2382": { visit: "初诊", suspected: "产后子宫炎" },
  "WO-2385": { visit: "初诊", suspected: "子宫内膜炎" },
  "WO-2298": { visit: "复诊", diagnosis: "产后子宫炎" },
  "WO-2299": { visit: "初诊", diagnosis: "产后子宫炎" },
  "WO-2300": { visit: "初诊", diagnosis: "子宫内膜炎" },
  "WO-2301": { visit: "初诊", diagnosis: "产后子宫炎" },
  "WO-2440": { visit: "初诊", diagnosis: "产后子宫炎" },
  "WO-2199": { visit: "初诊", diagnosis: "产后子宫炎" },
  "WO-2324": { visit: "初诊", suspected: "产后子宫炎" },
};
const reviewTaskSet = new Set<string>(["WO-2440", "WO-2298"]);
const observeDaysMap: Record<string, number> = {};
const obsExpiredOrders = new Set<string>([]);
// 今日具体执行任务已完成的进行中工单（靠后展示，操作改为「查看」）
const todayDoneSet = new Set<string>(["WO-2401", "HF-0708"]);

function truncateCJK(s: string, max = 5) {
  const arr = Array.from(s);
  return arr.length > max ? arr.slice(0, max).join("") + "…" : s;
}

function diseaseTitleParts(o: Task) {
  if (o.type !== "疾病治疗") return null;
  const m = diseaseMeta[o.id];
  const visit = m?.visit ?? "初诊";
  const name = truncateCJK(m?.diagnosis || m?.suspected || "疾病不详");
  let task: string | null = null;
  if (o.status === "进行中") {
    if (obsExpiredOrders.has(o.id)) task = "待治愈";
    else if (observeDaysMap[o.id]) task = "观察";
    else if (reviewTaskSet.has(o.id)) task = "复查";
    else task = "执行";
  }
  return { visit, name, task };
}




function TaskListPage() {
  const role = useRole();
  const isVisitor = canVisit(role);
  const claimed = useClaimed();
  const search = Route.useSearch();
  const initialTab: (typeof tabs)[number]["key"] = search.tab === "执行中"
    ? "执行中"
    : role === "admin"
      ? "全部"
      : isVisitor
        ? "待诊断"
        : "全部";
  const [tab, setTab] = useState<(typeof tabs)[number]["key"]>(initialTab);
  const [q, setQ] = useState("");
  const [selTypes, setSelTypes] = useState<Set<string>>(new Set());
  const [selBarns, setSelBarns] = useState<Set<string>>(new Set());
  const [filterOpen, setFilterOpen] = useState(false);
  const toggleIn = (set: Set<string>, v: string) => {
    const next = new Set(set);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    return next;
  };
  const typeFilter = search.type;


  // 列表仅展示工单卡片：排除领取（取物）和损耗（物资）
  let list: Task[] = tasks.filter((t) => t.kind !== "损耗");
  void claimed;
  void PICKUPS;
  if (role === "hoof_trimmer") list = list.filter((t) => t.kind === "修蹄");
  if (role === "immunizer") list = list.filter((t) => t.type === "免疫");
  if (role === "vet_assistant") list = list.filter((t) => t.type === "疾病治疗" || t.type === "产后护理" || t.type === "干奶");
  if (role === "vet") list = list.filter((t) => t.type === "疾病治疗" || t.type === "产后护理" || t.type === "干奶");
  // 场长：仅可查看自己上报的工单，且无处理权限
  if (role === "manager") list = list.filter((t) => t.proposer === "李雨晴");

  if (typeFilter) {
    list = list.filter((o) => o.type === typeFilter || (typeFilter === "疫苗免疫" && o.type === "免疫"));
  }

  // 可筛选项（基于当前角色可见范围）
  const typeOptions = Array.from(new Set(list.map((o) => o.type))).sort((a, b) => a.localeCompare(b, "zh"));
  const barnOptions = Array.from(new Set(list.map((o) => o.barn))).sort((a, b) => a.localeCompare(b, "zh"));
  const typeCount = (t: string) => list.filter((o) => o.type === t).length;
  const barnCount = (b: string) => list.filter((o) => o.barn === b).length;

  if (selTypes.size > 0) list = list.filter((o) => selTypes.has(o.type));
  if (selBarns.size > 0) list = list.filter((o) => selBarns.has(o.barn));

  if (tab === "执行中") list = list.filter((o) => o.status === "进行中");
  else if (tab !== "全部") list = list.filter((o) => o.status === tab);


  const kw = q.trim().toLowerCase();
  if (kw) {
    list = list.filter((o) => {
      return (
        o.id.toLowerCase().includes(kw) ||
        o.target.toLowerCase().includes(kw) ||
        o.event.toLowerCase().includes(kw) ||
        o.kind.toLowerCase().includes(kw) ||
        o.type.toLowerCase().includes(kw) ||
        o.barn.toLowerCase().includes(kw)
      );
    });
  }

  return (
    <MobileShell title="工单列表">
      {/* 搜索 */}
      <div className="px-4 pt-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索工单号 / 执行对象 / 工单类型 / 牛舍"
            className="h-10 w-full pl-9 pr-3 rounded-lg bg-card border border-border text-body-sm placeholder:text-text-tertiary"
          />
        </div>
      </div>

      {/* 筛选：工单类型 / 牛舍 */}
      <div className="px-4 mt-3">
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          className={`h-9 px-3 inline-flex items-center gap-1.5 rounded-full border text-body-sm ${
            filterCount > 0
              ? "border-primary bg-brand-subtle text-primary"
              : "border-border bg-card text-text-secondary"
          }`}
        >
          <Filter className="h-4 w-4 shrink-0" />
          <span className="truncate max-w-[14rem]">{filterSummary}</span>
          {filterCount > 0 && (
            <span className="text-caption tabular-nums text-primary/70">{filterCount}</span>
          )}
          <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
        </button>
      </div>

      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent side="bottom" hideClose className="rounded-t-2xl p-0 max-h-[85vh] flex flex-col">
          <SheetHeader className="px-4 pt-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <SheetTitle className="text-section">筛选条件</SheetTitle>
            <button
              type="button"
              onClick={() => {
                setSelTypes(new Set());
                setSelBarns(new Set());
              }}
              className="text-body-sm text-text-secondary"
            >
              重置
            </button>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-4">
            <section>
              <div className="text-body-sm text-text-secondary mb-2">工单类型</div>
              <div className="flex flex-wrap gap-2">
                {typeOptions.map((t) => {
                  const sel = selTypes.has(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSelTypes((s) => toggleIn(s, t))}
                      className={`h-9 px-3 rounded-full border text-body-sm ${
                        sel ? "border-primary bg-primary/5 text-primary" : "border-border bg-card text-text-secondary"
                      }`}
                    >
                      {t}
                      <span className="ml-1 text-caption tabular-nums opacity-70">{typeCount(t)}</span>
                    </button>
                  );
                })}
              </div>
            </section>
            <section>
              <div className="text-body-sm text-text-secondary mb-2">所属牛舍</div>
              <div className="space-y-2">
                {barnOptions.map((b) => {
                  const sel = selBarns.has(b);
                  return (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setSelBarns((s) => toggleIn(s, b))}
                      className={`w-full min-h-10 px-3 py-2.5 flex items-center gap-3 rounded-xl border transition-colors ${
                        sel ? "border-primary bg-primary/5" : "border-border bg-card"
                      }`}
                    >
                      <span className="flex-1 text-left text-body text-foreground">{b}</span>
                      <span className="text-body-sm tabular-nums text-text-tertiary">{barnCount(b)} 个工单</span>
                      <span
                        className={`h-5 w-5 rounded-md flex items-center justify-center border ${
                          sel ? "bg-primary border-primary" : "border-border bg-card"
                        }`}
                      >
                        {sel && <Check className="h-3.5 w-3.5 text-primary-foreground" strokeWidth={3} />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
          <div className="px-4 py-3 border-t border-border">
            <button
              type="button"
              onClick={() => setFilterOpen(false)}
              className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-body font-medium"
            >
              确定
            </button>
          </div>
        </SheetContent>
      </Sheet>


      {/* 状态 Tabs */}
      <div className="px-4 mt-3 flex gap-1.5 overflow-x-auto no-scrollbar">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`shrink-0 h-8 px-3 rounded-full text-body-sm transition-colors ${
              tab === t.key
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-text-secondary"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>


      {/* 列表 —— 按牛舍分组 */}
      <div className="px-4 mt-3 pb-4 space-y-4">
        {list.length === 0 && (
          <EmptyState
            icon={ClipboardList}
            title={`暂无${tab === "全部" ? "" : tab}工单`}
            desc={q ? "试试更换关键词或切换状态筛选" : "新记录会在这里显示，请下拉刷新"}
          />
        )}
        {Object.entries(
          list.reduce<Record<string, Task[]>>((acc, t) => {
            (acc[t.barn] ||= []).push(t);
            return acc;
          }, {})
        )
          .sort(([a], [b]) => a.localeCompare(b, "zh"))
          .map(([barn, rawItems]) => {
            const items = [...rawItems].sort((a, b) => {
              const aDone = a.status === "进行中" && todayDoneSet.has(a.id) ? 1 : 0;
              const bDone = b.status === "进行中" && todayDoneSet.has(b.id) ? 1 : 0;
              return aDone - bDone;
            });
            return (
            <section key={barn}>
              <div className="sticky top-0 z-[1] -mx-4 px-4 py-2 bg-background/85 backdrop-blur flex items-center gap-2">
                <span className="h-6 w-6 rounded-md bg-brand-subtle text-primary inline-flex items-center justify-center">
                  <Home className="h-3.5 w-3.5" />
                </span>
                <span className="text-body-sm font-medium text-foreground">{barn}</span>
                <span className="text-caption text-text-tertiary">共 {items.length} 项</span>
              </div>
              <div className="space-y-2.5 mt-1">
                {items.map((o) => {
                  const s = statusTone[o.status];
                  const Icon = s.icon;
                  const KIcon = kindIcon[o.kind];
                  const isPickup = o.kind === "领取";
                  const canVisitThis = canDiagnose(role, o.type) && o.status === "待诊断";
                  const isVetView = role === "vet";
                  const isObserving = !!observeDaysMap[o.id] && !obsExpiredOrders.has(o.id);
                  const isReviewNode = reviewTaskSet.has(o.id);
                  const todayDone = o.status === "进行中" && todayDoneSet.has(o.id);
                  const canExecuteThis =
                    canExecute(role) && o.status === "进行中" && !isObserving && !todayDone &&
                    (isReviewNode ? isVetView : true);


                  // 统一 Footer 元信息：左侧时间·人员
                  let metaTimeLabel = "";
                  let metaTime = "";
                  let metaPersonLabel = "";
                  let metaPersonName = "";
                  if (o.status === "待诊断") {
                    metaTimeLabel = "上报";
                    metaTime = o.reportedAt ?? o.createdAt;
                    metaPersonLabel = "上报";
                    metaPersonName = o.proposer ?? "—";
                  } else if (o.status === "进行中" || o.status === "已完成") {
                    metaTimeLabel = "执行";
                    metaTime = o.executedAt ?? o.createdAt;
                    metaPersonLabel = "执行";
                    metaPersonName = o.who;
                  } else if (o.status === "已终止") {
                    metaTimeLabel = "终止";
                    metaTime = o.terminatedAt ?? o.createdAt;
                    metaPersonLabel = "诊断";
                    metaPersonName = o.visitor ?? "—";
                  }

                  const ctaText = isPickup
                    ? (o.status === "已完成" ? "查看清单" : "领取")
                    : canVisitThis
                      ? "诊断"
                      : canExecuteThis
                        ? (isReviewNode ? "复查" : "执行")
                        : "查看";

                  const commonInner = (
                    <div className="flex flex-col gap-2">
                      {/* Header 区：编号·类型 + 状态 */}
                      <div className="flex items-center gap-1.5 text-body-sm h-5">
                        <span className="font-mono text-text-tertiary text-caption">{o.id}</span>
                        <span className="text-text-tertiary">·</span>
                        <span className="inline-flex items-center gap-1 text-caption text-text-tertiary">
                          <KIcon className="h-3 w-3" />{o.type}
                        </span>
                        {o.status === "进行中" && !isPickup && (
                          <span className="text-caption text-text-tertiary">
                            · {o.needPickup ? "需领物" : "无需领物"}
                          </span>
                        )}
                        <span className={`${s.tag} inline-flex items-center gap-1 ml-auto`}>
                          <Icon className="h-3 w-3" />
                          {isPickup && o.status === "进行中" ? "待领取" : o.status === "进行中" ? "执行中" : o.status}
                        </span>
                      </div>

                      {/* Title 区：对象 · 初诊/复诊 · 疾病名称 · 任务 —— 单行 truncate */}
                      <div className="text-card-title text-foreground truncate h-[26px] leading-[26px]">
                        {(() => {
                          const head = o.scope.type === "single" ? o.scope.ear : o.scope.label;
                          const parts = diseaseTitleParts(o);
                          if (parts) {
                            const segs = [parts.visit, parts.name];
                            if (parts.task) segs.push(parts.task);
                            return (
                              <>
                                {head}
                                <span className="text-text-tertiary"> · </span>
                                {segs.join(" · ")}
                              </>
                            );
                          }
                          if (o.type === "产后护理" && o.status === "进行中") {
                            return (
                              <>
                                {head}
                                <span className="text-text-tertiary"> · </span>
                                {`初诊 · ${o.conclusion} · 执行`}
                              </>
                            );
                          }
                          return (
                            <>
                              {head}
                              <span className="text-text-tertiary"> · </span>
                              {o.conclusion}
                            </>
                          );
                        })()}
                      </div>

                      {/* Desc 区：描述 —— 单行 line-clamp-1，无内容占位保持高度 */}
                      <div className="text-body-sm text-text-secondary truncate h-[22px] leading-[22px]">
                        {o.desc || <span className="text-text-tertiary/0">·</span>}
                      </div>

                      {/* Footer 区：时间·人员 + 操作 */}
                      <div className="flex items-center text-caption text-text-tertiary pt-2 border-t border-border/60 h-9">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <span className="shrink-0">
                            {metaTimeLabel} <span className="text-text-secondary">{metaTime}</span>
                          </span>
                          <span className="text-text-tertiary/60">·</span>
                          <span className="flex items-center gap-1 min-w-0">
                            {cleanName(metaPersonName) === "平台下发" ? (
                              <span className="text-text-secondary">平台</span>
                            ) : (
                              <>
                                <span className="shrink-0">{metaPersonLabel}</span>
                                <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-caption inline-flex items-center justify-center shrink-0">
                                  {cleanName(metaPersonName).charAt(0)}
                                </span>
                                <span className="text-text-secondary truncate">{cleanName(metaPersonName)}</span>
                              </>
                            )}
                          </span>
                        </div>
                        <span className={`ml-2 inline-flex items-center gap-0.5 shrink-0 ${
                          ctaText === "查看" ? "text-text-secondary" : "text-primary font-medium"
                        }`}>
                          {ctaText}
                          <ChevronRight className="h-3.5 w-3.5" />
                        </span>
                      </div>

                    </div>
                  );
                  const cls = `block rounded-xl bg-card border p-4 active:bg-surface-subtle ${
                    isPickup && o.status === "进行中" ? "border-primary/30" : "border-border"
                  }`;
                  return isPickup ? (
                    <Link key={o.id} to="/m/health/$id/execute/$pickupId" params={{ id: o.source ?? o.id, pickupId: o.id }} className={cls}>
                      {commonInner}
                    </Link>

                  ) : (
                    <Link key={o.id} to="/m/health/$id" params={{ id: o.id }} className={cls}>
                      {commonInner}
                    </Link>
                  );
                })}

              </div>
            </section>
            );
          })}
      </div>
    </MobileShell>
  );
}
