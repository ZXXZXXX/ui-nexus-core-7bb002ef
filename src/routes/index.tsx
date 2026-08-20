import { createFileRoute, Link } from "@tanstack/react-router";
import { Fragment, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { AppHeader } from "@/components/app-header";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import grasslandHero from "@/assets/grassland-hero.png";
import { SHIFT_STAFF } from "@/lib/assignee-store";
import { ImmunizationRateCard } from "@/components/immunization-rate-card";
import { DiseaseStatsSection } from "@/components/disease-stats-section";
import { HerdSection } from "@/components/dashboard/herd-section";
import { CalvingSection } from "@/components/dashboard/calving-section";
import { CullingSection } from "@/components/dashboard/culling-section";
import { DrugSection } from "@/components/dashboard/drug-section";
import { WorkOrderSection } from "@/components/dashboard/workorder-section";
import { AlertSection, alertCounts } from "@/components/dashboard/alert-section";
import { OpsSection } from "@/components/dashboard/ops-section";
import { ExecFocusSection } from "@/components/dashboard/exec-focus-section";
import { GroupExecSection, farmCountFor, CURRENT_REGION, CURRENT_FARM, regionMetrics, farmMetrics } from "@/components/dashboard/group-exec-section";
import { StatVisual, type StatVisualVariant } from "@/components/stat-visual";



import { useDashboardView, useTopicOrder, scopeOptions, useDataLevel, levelMeta, scaleValue } from "@/lib/dashboard-view";



import {
  Inbox,
  ArrowUpRight,
  Beef,
  Baby,
  Pill,
  ClipboardList,

  Syringe,
  Stethoscope,
  ChevronRight,
  Bell,
  UserPlus,
  ArrowDownToLine,
  ArrowUpFromLine,
  PackageMinus,
  Activity,
  AlertTriangle,
  Building2,
  Leaf,
} from "lucide-react";



export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "首页总览 — 奇点智牧" },
      { name: "description", content: "运营驾驶舱：核心指标、待处理申请与待办" },
    ],
  }),
  component: HomePage,
});




type MetricCard = {
  label: string;
  value: string;
  unit: string;
  trend: string;
  delta: string;
  icon: typeof Stethoscope;
  anchor: string;
  good: boolean;
  topic: string;
  /** 绝对数量指标：随统计层级上卷；比率类指标不随层级变化 */
  absolute?: boolean;
  /** 主题色，用于图标、数值与装饰元素 */
  tone: string;
  /** 右下角装饰图形 */
  visual: StatVisualVariant;
};

const metricCards: MetricCard[] = [
  { topic: "存栏总数", label: "（至今日）存栏总数", value: "4060", unit: "头", trend: "up", delta: "+38 头", icon: Beef, anchor: "topic-herd", good: true, absolute: true, tone: "var(--brand)", visual: "bars" },
  { topic: "产犊总数", label: "（本月）产犊数", value: "179", unit: "头", trend: "up", delta: "+12 头", icon: Baby, anchor: "topic-calving", good: true, absolute: true, tone: "#FF8A3D", visual: "spark" },
  { topic: "死淘总数", label: "（本月）死淘数", value: "45", unit: "头", trend: "down", delta: "-6 头", icon: Activity, anchor: "topic-culling", good: true, absolute: true, tone: "var(--state-danger)", visual: "truck" },
  { topic: "治愈/报病数量", label: "（本月）治愈 / 发病头次", value: "337 / 365", unit: "头次", trend: "down", delta: "-4.2 %", icon: Stethoscope, anchor: "topic-disease", good: true, absolute: true, tone: "var(--state-success)", visual: "bars" },
  { topic: "头均药费", label: "（本月）头均用药费用", value: "42.6", unit: "元/头", trend: "up", delta: "+6.9 %", icon: Pill, anchor: "topic-drug", good: false, tone: "var(--effect-ai-purple)", visual: "spark" },
  { topic: "免疫完成率", label: "（最近一次）疫苗完成率", value: "93.1", unit: "%", trend: "up", delta: "+2.3 %", icon: Syringe, anchor: "topic-vaccine", good: true, tone: "var(--effect-ai-cyan)", visual: "ring" },
  { topic: "工单完成率", label: "（本月）工单完成率", value: "94.7", unit: "%", trend: "up", delta: "+1.8 %", icon: ClipboardList, anchor: "topic-workorder", good: true, tone: "var(--effect-ai-purple)", visual: "ring" },
];

/** 集团管理者视角下的指标卡口径覆盖 */
const groupCardOverride: Record<string, Partial<MetricCard>> = {
  "topic-herd": { topic: "总存栏数", label: "（至今日）集团总存栏", value: "29500", unit: "头", delta: "+286 头", trend: "up", good: true, tone: "var(--brand)", visual: "bars" },
  "topic-calving": { topic: "早产率", label: "（本月）早产率", value: "3.96", unit: "%", delta: "-0.4 pp", trend: "down", good: true, tone: "#2E8CF0", visual: "ring" },
  "topic-culling": { topic: "死淘总数", label: "（本月）死亡 + 淘汰", value: "344", unit: "头", delta: "-21 头", trend: "down", good: true, tone: "var(--state-danger)", visual: "truck" },
  "topic-disease": { topic: "治愈率", label: "（本月）治愈率", value: "91.4", unit: "%", delta: "+1.6 pp", trend: "up", good: true, tone: "var(--state-success)", visual: "ring" },
  "topic-drug": { topic: "总药费支出", label: "（本月）集团总药费", value: "122.1", unit: "万元", delta: "+4.3 %", trend: "up", good: false, absolute: false, tone: "var(--effect-ai-purple)", visual: "spark" },
  "topic-vaccine": { topic: "平均诊疗天数", label: "（本月）平均诊疗天数", value: "4.4", unit: "天", delta: "-0.3 天", trend: "down", good: true, absolute: false, tone: "var(--effect-ai-cyan)", visual: "clock" },
};

/** 集团视角额外指标卡：发病率（首）、头均药费（末） */
const groupLeadCard: MetricCard = {
  topic: "发病率", label: "（本月）发病率", value: "2.8", unit: "%", trend: "down", delta: "-0.3 pp",
  icon: Stethoscope, anchor: "topic-panorama", good: true,
  tone: "#FF8A3D", visual: "spark",
};
const groupTailCard: MetricCard = {
  topic: "头均药费", label: "（本月）头均用药费用", value: "41.4", unit: "元/头", trend: "up", delta: "+3.1 %",
  icon: Pill, anchor: "topic-panorama", good: false,
  tone: "var(--effect-ai-purple)", visual: "spark",
};





/** 区域管理者视角：与集团口径一致，但只统计本区域 */
const rm = regionMetrics(CURRENT_REGION);
const regionCardOverride: Record<string, Partial<MetricCard>> = {
  "topic-herd": { topic: "总存栏数", label: `（至今日）${CURRENT_REGION}总存栏`, value: String(rm.herd), unit: "头", delta: "+96 头", trend: "up", good: true, tone: "var(--brand)", visual: "bars" },
  "topic-calving": { topic: "早产率", label: "（本月）区域早产率", value: String(rm.pretermRate), unit: "%", delta: "-0.3 pp", trend: "down", good: true, tone: "#2E8CF0", visual: "ring" },
  "topic-culling": { topic: "死淘总数", label: "（本月）死亡 + 淘汰", value: String(rm.deathCull), unit: "头", delta: "-8 头", trend: "down", good: true, tone: "var(--state-danger)", visual: "truck" },
  "topic-disease": { topic: "治愈率", label: "（本月）区域治愈率", value: String(rm.cure), unit: "%", delta: "+1.2 pp", trend: "up", good: true, tone: "var(--state-success)", visual: "ring" },
  "topic-drug": { topic: "总药费支出", label: "（本月）区域总药费", value: (rm.drugFee / 10000).toFixed(1), unit: "万元", delta: "+2.8 %", trend: "up", good: false, absolute: false, tone: "var(--effect-ai-purple)", visual: "spark" },
  "topic-vaccine": { topic: "平均诊疗天数", label: "（本月）平均诊疗天数", value: String(rm.days), unit: "天", delta: "-0.2 天", trend: "down", good: true, absolute: false, tone: "var(--effect-ai-cyan)", visual: "clock" },
};
const regionLeadCard: MetricCard = {
  topic: "发病率", label: "（本月）区域发病率", value: String(rm.sick), unit: "%", trend: "down", delta: "-0.2 pp",
  icon: Stethoscope, anchor: "topic-panorama", good: true, tone: "#FF8A3D", visual: "spark",
};
const regionTailCard: MetricCard = {
  topic: "工单完成率", label: "（本月）工单完成率", value: "92.6", unit: "%", trend: "up", delta: "+1.8 pp",
  icon: ClipboardList, anchor: "topic-vet-order", good: true, tone: "var(--effect-ai-purple)", visual: "ring",
};


/** 牧场级外部视角：与区域口径一致，但只统计本牧场，且隐藏药费 */
const fm = farmMetrics(CURRENT_FARM.farm, CURRENT_FARM.region);
const farmOutCardOverride: Record<string, Partial<MetricCard>> = {
  "topic-herd": { topic: "总存栏数", label: "（至今日）本牧场存栏", value: String(fm.herd), unit: "头", delta: "+42 头", trend: "up", good: true, tone: "var(--brand)", visual: "bars" },
  "topic-calving": { topic: "早产率", label: "（本月）本牧场早产率", value: String(fm.pretermRate), unit: "%", delta: "-0.2 pp", trend: "down", good: true, tone: "#2E8CF0", visual: "ring" },
  "topic-culling": { topic: "死淘总数", label: "（本月）死亡 + 淘汰", value: String(fm.deathCull), unit: "头", delta: "-3 头", trend: "down", good: true, tone: "var(--state-danger)", visual: "truck" },
  "topic-disease": { topic: "治愈率", label: "（本月）本牧场治愈率", value: String(fm.cure), unit: "%", delta: "+0.8 pp", trend: "up", good: true, tone: "var(--state-success)", visual: "ring" },
  "topic-vaccine": { topic: "平均诊疗天数", label: "（本月）平均诊疗天数", value: String(fm.days), unit: "天", delta: "-0.2 天", trend: "down", good: true, absolute: false, tone: "var(--effect-ai-cyan)", visual: "clock" },
};
const farmOutLeadCard: MetricCard = {
  topic: "发病率", label: "（本月）本牧场发病率", value: String(fm.sick), unit: "%", trend: "down", delta: "-0.2 pp",
  icon: Stethoscope, anchor: "topic-panorama", good: true, tone: "#FF8A3D", visual: "spark",
};
const farmOutCalvingCard: MetricCard = {
  topic: "产犊总数", label: "（本月）产犊总数", value: String(fm.calving), unit: "头", trend: "up", delta: "+12 头",
  icon: Baby, anchor: "topic-calving-total", good: true, absolute: true, tone: "#FF8A3D", visual: "spark",
};

type WorkOrderType = "disease" | "vaccine" | "deworm" | "hoof" | "postpartum" | "drying" | "general";
type PendingRequest = {
  id: string;
  type: WorkOrderType;
  target: string;
  targetKind: "cattle" | "barn" | "batch";
  applicant: string;
  applicantRole: string;
  time: string;
  symptoms: string[];
  detail: string;
};

const workOrderTypeMeta: Record<WorkOrderType, { label: string; tone: "warning" | "danger" | "info" | "success" | "muted" }> = {
  disease: { label: "疾病诊疗", tone: "danger" },
  vaccine: { label: "免疫接种", tone: "info" },
  deworm: { label: "驱虫", tone: "warning" },
  hoof: { label: "修蹄", tone: "muted" },
  postpartum: { label: "产后护理", tone: "success" },
  drying: { label: "干奶", tone: "info" },
  general: { label: "常规处置", tone: "muted" },
};

const pendingRequests: PendingRequest[] = [
  {
    id: "WO-2381",
    type: "disease",
    target: "#01-24-2381",
    targetKind: "cattle",
    applicant: "李兽医",
    applicantRole: "兽医",
    time: "8 分钟前",
    symptoms: ["高热", "食欲不振", "呼吸急促"],
    detail: "牛只 #01-24-2381 持续 2 小时体温高于 40℃，建议转入隔离区并安排血常规检测，预计耗材：抗生素 1 支、采血管 2 支。",
  },
  {
    id: "WO-2380",
    type: "disease",
    target: "3 号牛舍",
    targetKind: "barn",
    applicant: "王巡检",
    applicantRole: "巡检员",
    time: "32 分钟前",
    symptoms: ["乳房肿胀", "产奶下降"],
    detail: "3 号牛舍 4 头泌乳牛出现疑似乳房炎症状，申请兽医介入并启动抗生素治疗流程。",
  },
  {
    id: "WO-2379",
    type: "vaccine",
    target: "B-免疫批次 0512",
    targetKind: "batch",
    applicant: "赵兽医",
    applicantRole: "兽医",
    time: "1 小时前",
    symptoms: ["发情期"],
    detail: "5 头待免疫牛只目前处于发情期，按规程不宜立即免疫。申请将本批免疫计划由 5/12 顺延至 5/15 执行。",
  },
  {
    id: "WO-2376",
    type: "hoof",
    target: "#01-24-2105",
    targetKind: "cattle",
    applicant: "孙助理",
    applicantRole: "兽医助理",
    time: "今日 09:12",
    symptoms: ["跛行", "蹄底溃疡"],
    detail: "牛只 #01-24-2105 出现明显跛行，蹄部肉眼可见溃疡，申请安排修蹄并外敷消炎药。",
  },
  {
    id: "WO-2374",
    type: "postpartum",
    target: "#01-24-2418",
    targetKind: "cattle",
    applicant: "周饲养",
    applicantRole: "饲养员",
    time: "今日 08:30",
    symptoms: ["产后无力", "体温偏低"],
    detail: "产后母牛 #01-24-2418 站立困难，体温 37.8℃，申请兽医到场评估并补充能量制剂。",
  },
];


type NotifTone = "info" | "success" | "warning" | "danger";
type Notif = {
  icon: typeof Bell;
  title: string;
  desc: string;
  time: string;
  tone: NotifTone;
};

const notifications: Notif[] = [
  { icon: UserPlus, title: "3 位新账户已加入", desc: "李巡检、周饲养、王兽医已完成入职诊断", time: "10 分钟前", tone: "info" },
  { icon: ArrowDownToLine, title: "仓库入库登记", desc: "驱虫剂 120 盒、采血管 500 支已入库", time: "32 分钟前", tone: "success" },
  { icon: ArrowUpFromLine, title: "仓库出库登记", desc: "3 号牛舍领用抗生素 8 支、生理盐水 4 瓶", time: "1 小时前", tone: "info" },
  { icon: PackageMinus, title: "库存变更提醒", desc: "疫苗 A 余量降至安全库存以下（剩 12 支）", time: "今日 09:40", tone: "warning" },
  { icon: PackageMinus, title: "库存盘点差异", desc: "5 号牛舍消毒液盘点差异 -2 桶，待复核", time: "今日 08:55", tone: "danger" },
];

const notifToneColor: Record<NotifTone, string> = {
  info: "var(--effect-ai-cyan)",
  success: "var(--state-success)",
  warning: "var(--state-warning)",
  danger: "var(--state-danger)",
};









function HomePage() {
  const [activeRequest, setActiveRequest] = useState<PendingRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const alertsRef = useRef<HTMLDivElement | null>(null);

  const { scope, config } = useDashboardView();
  const vis = config[scope];
  const topicOrder = useTopicOrder();
  const showInternal = scope !== "farm-out";
  const cardTopicByAnchor: Record<string, keyof typeof vis> = {
    "topic-herd": "herd",
    "topic-calving": "calving",
    "topic-culling": "culling",
    "topic-disease": "disease",
    "topic-drug": "drug",
    "topic-vaccine": "vaccine",
    "topic-workorder": "workorder",
  };
  const { factor, level, levels } = useDataLevel();
  const scaleCardValue = (c: MetricCard) =>
    c.absolute
      ? c.value
          .split("/")
          .map((part) => scaleValue(Number(part.trim().replace(/,/g, "")), factor).toLocaleString())
          .join(" / ")
      : c.value;
  const baseCards = metricCards
    .map((c) =>
      scope === "group"
        ? { ...c, ...groupCardOverride[c.anchor] }
        : scope === "region"
          ? { ...c, ...regionCardOverride[c.anchor] }
          : scope === "farm-out"
            ? { ...c, ...farmOutCardOverride[c.anchor] }
            : c,
    )

    .filter((c) => vis[cardTopicByAnchor[c.anchor]] !== false)
    .sort(
      (a, b) =>
        topicOrder.indexOf(cardTopicByAnchor[a.anchor]) -
        topicOrder.indexOf(cardTopicByAnchor[b.anchor]),
    );
  const isExec = scope === "group" || scope === "region" || scope === "farm-out";
  const showAttendance = !isExec || scope === "farm-out";
  const visibleCards =
    isExec
      ? (() => {
          const map = new Map(baseCards.map((c) => [c.topic, c]));
          const execOrder =
            scope === "group"
              ? [groupLeadCard, map.get("治愈率"), map.get("早产率"), map.get("死淘总数"), map.get("总药费支出"), groupTailCard]
              : scope === "region"
                ? [regionLeadCard, map.get("治愈率"), map.get("死淘总数"), map.get("早产率"), map.get("总药费支出"), regionTailCard]
                : [map.get("总存栏数"), farmOutCalvingCard, map.get("早产率"), farmOutLeadCard, map.get("治愈率"), map.get("死淘总数")];
          return execOrder.filter(Boolean) as MetricCard[];
        })()
      : baseCards;


  const scrollToTopic = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const exportMonthlyAttendance = () => {
    const year = 2026;
    const month = 5;
    const days = new Date(year, month, 0).getDate();
    const rows: string[][] = [["日期", "场次", "姓名", "工号", "状态"]];
    const statusOf = (i: number, dayIdx: number, shiftIdx: number) => {
      const s = SHIFT_STAFF[i];
      if (!s.onShift) return s.offReason === "leave" ? "请假" : "未签到";
      return (dayIdx * 3 + shiftIdx * 5 + i) % 17 === 0 ? "未签到" : "已签到";
    };
    for (let d = 1; d <= days; d++) {
      const date = `${year}/${String(month).padStart(2, "0")}/${String(d).padStart(2, "0")}`;
      (["上午场", "下午场"] as const).forEach((shift, si) => {
        SHIFT_STAFF.forEach((s, i) => {
          rows.push([date, shift, s.name, s.id.toUpperCase(), statusOf(i, d, si)]);
        });
      });
    }
    const csv = "\uFEFF" + rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `出勤明细_${year}-${String(month).padStart(2, "0")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("本月出勤明细已导出");
  };




  const handleVisit = () => {
    if (!activeRequest) return;
    toast.success(`已通过：${workOrderTypeMeta[activeRequest.type].label} · ${activeRequest.target}`);
    setActiveRequest(null);
    setRejectReason("");
  };
  const handleReject = () => {
    if (!activeRequest) return;
    if (!rejectReason.trim()) {
      toast.error("请填写不通过原因");
      return;
    }
    toast.success(`已驳回：${workOrderTypeMeta[activeRequest.type].label} · ${activeRequest.target}`);
    setActiveRequest(null);
    setRejectReason("");
  };

  return (
    <>
      <AppHeader title="首页总览" breadcrumb={["首页"]} />
      <main className="flex-1 px-6 py-6 space-y-5">
        {/* Hero greeting — 三分栏数据条 */}
        <Card className="relative overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-[0_18px_50px_-32px_color-mix(in_oklab,var(--brand)_60%,transparent)]">
          <div
            className={`grid grid-cols-1 divide-y divide-border lg:divide-y-0 lg:divide-x ${
              showAttendance
                ? "lg:grid-cols-[minmax(260px,1fr)_minmax(320px,1.2fr)_minmax(340px,1.3fr)]"
                : "lg:grid-cols-[minmax(260px,1fr)_minmax(320px,1.2fr)]"
            }`}
          >
            {/* 1 · 问候 */}
            <div className="relative overflow-hidden px-5 py-4">
              <img
                src={grasslandHero}
                alt=""
                aria-hidden
                className="pointer-events-none absolute inset-y-0 right-0 h-full w-1/2 object-cover opacity-[0.14]"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-card via-card/90 to-transparent" />
              <div className="relative">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-subtle)] px-2 py-0.5 text-caption font-medium text-[var(--brand)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand)]" />
                    系统正常运行
                  </span>
                </div>
                <h2 className="mt-2 text-page-title font-medium text-text-primary">早上好，场长张磊</h2>
                <p className="mt-1 text-caption text-text-tertiary">2026/05/12 周二 · 1 号牧场</p>
              </div>
            </div>

            {/* 2 · 预警 / 集团视角牧场统计 */}
            <div className="flex flex-col justify-between px-5 py-4">
              <div className="flex items-center justify-between">
                <span className="text-caption text-text-tertiary">
                  {isExec ? (scope === "group" ? "牧场分布" : scope === "region" ? `${CURRENT_REGION} · 牧场分布` : "实时预警") : "实时预警"}
                </span>
                {(!isExec || scope === "farm-out") && (
                  <button
                    type="button"
                    onClick={() => scrollToTopic("topic-alert")}
                    className="text-caption text-[var(--brand)] hover:underline"
                  >
                    查看预警详情 →
                  </button>
                )}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2.5">
                {isExec && scope !== "farm-out" ? (
                  (() => {
                    const fc = farmCountFor(scope === "group" ? null : CURRENT_REGION);
                    return [
                      { key: "牧场总数", count: fc.total, icon: Building2, tone: "--brand" },
                      { key: "普通牧场", count: fc.ordinary, icon: Building2, tone: "--state-alert" },
                      { key: "有机牧场", count: fc.organic, icon: Leaf, tone: "--state-info" },
                    ].map((a) => {
                    const Icon = a.icon;
                    return (
                      <button
                        key={a.key}
                        type="button"
                        className="group flex items-center gap-2.5 rounded-xl border border-border bg-bg-surface px-3 py-2.5 text-left transition-all hover:shadow-elevated hover:border-[var(--brand)]/30"
                      >
                        <span
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                          style={{ background: `color-mix(in oklab, var(${a.tone}) 14%, var(--bg-surface))` }}
                        >
                          <Icon className="h-5 w-5" style={{ color: `var(${a.tone})` }} strokeWidth={1.8} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className="block text-caption text-text-tertiary whitespace-nowrap">{a.key}</span>
                          <span className="mt-0.5 flex items-baseline gap-1">
                            <span
                              className="text-[22px] leading-none font-semibold tabular-nums"
                              style={{ color: `var(${a.tone})` }}
                            >
                              {a.count}
                            </span>
                            <span className="text-caption text-text-tertiary">个</span>
                          </span>
                        </div>
                      </button>
                    );
                    });
                  })()
                ) : (
                  alertCounts.map((a, i) => {
                    const tone = ["--state-danger", "--state-alert", "--brand"][i % 3];
                    const Icon = [PackageMinus, Beef, Activity][i % 3];
                    return (
                      <button
                        key={a.key}
                        type="button"
                        onClick={() => scrollToTopic("topic-alert")}
                        className="group relative overflow-hidden rounded-xl px-3 py-3 text-left transition-all hover:-translate-y-0.5 hover:brightness-105"
                        style={{
                          background: `linear-gradient(140deg, color-mix(in oklab, var(${tone}) 92%, black 4%), color-mix(in oklab, var(${tone}) 72%, white 12%))`,
                          boxShadow: `0 10px 22px -14px color-mix(in oklab, var(${tone}) 90%, transparent)`,
                        }}
                      >
                        <Icon
                          aria-hidden
                          className="pointer-events-none absolute -right-2 -bottom-2 h-12 w-12 text-white/20"
                          strokeWidth={1.8}
                        />
                        <span className="relative block text-caption font-medium text-white/85 whitespace-nowrap">
                          {a.key}
                        </span>
                        <span className="relative mt-1 flex items-baseline gap-1">
                          <span className="text-[30px] leading-none font-semibold tabular-nums text-white">
                            {a.count}
                          </span>
                          <span className="text-caption text-white/80">项</span>
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {showAttendance && (
              <>
                {/* 3 · 出勤 */}
                <div className="flex flex-col justify-between px-5 py-4">
                  <div className="flex items-center justify-between">
                    <span className="text-caption text-text-tertiary">今日到岗</span>
                    <button
                      type="button"
                      onClick={() => setAttendanceOpen(true)}
                      className="text-caption text-[var(--brand)] hover:underline"
                    >
                      出勤明细 →
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-[auto_repeat(3,minmax(0,1fr))] items-center gap-x-3 gap-y-1.5">
                    <span />
                    {["已签", "未签", "请假"].map((t) => (
                      <span key={t} className="text-center text-caption text-text-tertiary">
                        {t}
                      </span>
                    ))}
                    {[
                      { label: "上午场", signed: 6, absent: 1, leave: 1 },
                      { label: "下午场", signed: 5, absent: 2, leave: 1 },
                    ].map((s) => (
                      <Fragment key={s.label}>
                        <span className="text-caption text-text-secondary whitespace-nowrap">{s.label}</span>
                        <span className="text-center text-card-title font-medium tabular-nums text-text-primary">
                          {s.signed}
                        </span>
                        <span className="text-center text-card-title font-medium tabular-nums text-[var(--state-danger)]">
                          {s.absent}
                        </span>
                        <span className="text-center text-card-title font-medium tabular-nums text-[var(--state-alert)]">
                          {s.leave}
                        </span>
                      </Fragment>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>




        {/* 报表口径切换 */}
        <div>
          <h3 className="text-section-title text-foreground">数据看板</h3>
        </div>



        {/* 数据指标卡 1-6 — 点击跳转至对应专题 */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleCards.map((k) => {
            const Icon = k.icon;
            return (
              <Card
                key={k.label}
                onClick={() => scrollToTopic(k.anchor)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    scrollToTopic(k.anchor);
                  }
                }}
                className="relative overflow-hidden border-0 rounded-2xl p-5 transition-all cursor-pointer hover:-translate-y-0.5 hover:shadow-elevated"
                style={{
                  background: `color-mix(in oklab, ${k.tone} 12%, var(--bg-surface))`,
                }}
              >
                <Icon
                  aria-hidden
                  className="pointer-events-none absolute -right-2 -bottom-2 h-16 w-16 opacity-[0.08]"
                  style={{ color: k.tone }}
                  strokeWidth={1.6}
                />
                <div className="relative flex flex-col h-full justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5" style={{ color: k.tone }} />
                    <span className="text-body-sm font-medium text-text-primary">{k.topic}</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span
                      className="tabular-nums font-semibold leading-none"
                      style={{ fontSize: "28px", color: k.tone }}
                    >
                      {scaleCardValue(k)}
                    </span>
                    <span className="text-body-sm text-text-tertiary">{k.unit}</span>
                  </div>
                </div>
                <StatVisual variant={k.visual} tone={k.tone} />
              </Card>
            );
          })}
        </div>


        {/* 专题区：按默认顺序渲染，半宽专题自动两两并排 */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">
          {topicOrder.map((key) => {
            if (key === "ops" && scope !== "region" && scope !== "group" && scope !== "farm-out") return null;
            // 集团 / 区域高管视角：不展示牛群 / 产犊 / 死淘 / 疾病 / 药品 / 疫苗 / 工单 / 预警专题
            if (isExec && ["herd", "calving", "culling", "disease", "drug", "vaccine", "workorder", "alert"].includes(key)) return null;
            const full = key === "drug" || key === "alert" || key === "ops";
            const node =
              key === "herd" ? (
                <HerdSection />
              ) : key === "calving" ? (
                <CalvingSection />
              ) : key === "culling" ? (
                <div id="topic-culling" className="scroll-mt-24 h-full [&>*]:h-full">
                  <CullingSection />
                </div>
              ) : key === "disease" ? (
                <div id="topic-disease" className="scroll-mt-24 h-full [&>*]:h-full">
                  <DiseaseStatsSection />
                </div>
              ) : key === "drug" ? (
                <DrugSection />
              ) : key === "vaccine" ? (
                <div id="topic-vaccine" className="scroll-mt-24 h-full [&>*]:h-full">
                  <ImmunizationRateCard />
                </div>
              ) : key === "workorder" ? (
                <div className="min-w-0 h-full [&>*]:h-full">
                  <WorkOrderSection />
                </div>
              ) : key === "alert" ? (
                <AlertSection />
              ) : isExec ? (
                <GroupExecSection
                  scopeRegion={scope === "group" ? null : scope === "region" ? CURRENT_REGION : null}
                  scopeFarm={scope === "farm-out" ? CURRENT_FARM : null}
                />
              ) : (
                <div className="space-y-6">
                  <ExecFocusSection level="farm" />
                  <OpsSection level="region" />
                </div>

              );


            return (
              <div
                key={key}
                className={`min-w-0 h-full [&>*]:h-full ${full ? "xl:col-span-2" : ""}`}
              >
                {node}
              </div>
            );
          })}
        </div>










      </main>

      <Dialog
        open={!!activeRequest}
        onOpenChange={(open) => {
          if (!open) {
            setActiveRequest(null);
            setRejectReason("");
          }
        }}
      >
        <DialogContent className="sm:max-w-[520px]">
          {activeRequest && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`tag tag-${workOrderTypeMeta[activeRequest.type].tone}`}>
                    {workOrderTypeMeta[activeRequest.type].label}
                  </span>
                  <span className="text-caption text-text-tertiary tabular-nums">{activeRequest.id}</span>
                </div>
                <DialogTitle className="text-card-title">
                  {workOrderTypeMeta[activeRequest.type].label} · {activeRequest.target}
                </DialogTitle>
                <DialogDescription className="text-body-sm text-text-secondary">
                  提出者 {activeRequest.applicantRole} {activeRequest.applicant} · {activeRequest.time}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-1">
                {activeRequest.symptoms.length > 0 && (
                  <div>
                    <p className="text-caption text-text-tertiary mb-1.5">症状标签</p>
                    <div className="flex flex-wrap gap-1.5">
                      {activeRequest.symptoms.map((s) => (
                        <span
                          key={s}
                          className="inline-flex items-center h-[24px] px-2 rounded-md text-caption"
                          style={{
                            background: "color-mix(in oklab, var(--state-warning) 12%, transparent)",
                            color: "#A35A00",
                          }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="rounded-md bg-surface-subtle border border-border p-3">
                  <p className="text-caption text-text-tertiary mb-1">申请详情</p>
                  <p className="text-body-sm text-foreground leading-relaxed">{activeRequest.detail}</p>
                </div>

                <div>
                  <label className="text-caption text-text-tertiary">不通过原因（驳回时必填）</label>
                  <Textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="如需驳回，请简要说明原因…"
                    className="mt-1.5 min-h-[72px] text-body-sm"
                  />
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" className="h-9 text-body-sm font-normal" onClick={handleReject}>
                  不通过
                </Button>
                <Button
                  className="h-9 text-body-sm font-normal bg-primary hover:bg-[var(--brand-hover)] text-primary-foreground"
                  onClick={handleVisit}
                >
                  通过
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 出勤明细 */}
      <Dialog open={attendanceOpen} onOpenChange={setAttendanceOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="text-card-title">今日出勤明细</DialogTitle>
            <DialogDescription className="text-body-sm text-text-secondary">
              2026/05/12 · 1 号牧场
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {(["上午场", "下午场"] as const).map((shift, si) => {
              const list = SHIFT_STAFF.map((s, i) =>
                si === 1 && i === 1 ? { ...s, onShift: false, offReason: "absent" as const } : s
              );
              const groups = [
                { key: "已签到", items: list.filter((s) => s.onShift) },
                { key: "请假", items: list.filter((s) => !s.onShift && s.offReason === "leave") },
                { key: "未签到", items: list.filter((s) => !s.onShift && s.offReason === "absent") },
              ];
              return (
                <div key={shift} className="space-y-2">
                  <div className="text-body font-medium">{shift}</div>
                  {groups.map((g) => (
                    <div key={g.key} className="flex gap-3">
                      <div className="w-16 shrink-0 text-body-sm text-text-secondary">
                        {g.key} {g.items.length}
                      </div>
                      <div className="flex-1 flex flex-wrap gap-1.5">
                        {g.items.length === 0 ? (
                          <span className="text-body-sm text-text-tertiary">—</span>
                        ) : (
                          g.items.map((s) => (
                            <span
                              key={s.id}
                              className="text-body-sm px-2 py-0.5 rounded-md bg-muted text-text-primary"
                            >
                              {s.name}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={exportMonthlyAttendance}>
              <ArrowDownToLine className="h-4 w-4" />
              导出本月出勤明细
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>

  );
}
