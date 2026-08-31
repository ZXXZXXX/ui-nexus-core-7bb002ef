import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  Camera,
  Beef,
  ChevronRight,
  ChevronDown,
  MapPin,
  CloudSun,
  Wind,
  Thermometer,
  Inbox,
  Pill,
  Syringe,
  Footprints,
  Stethoscope,
  PackageX,
  Package,
 ArrowUpRight,
  TrendingUp,
  Check,
  Baby,
  FileText,
  CheckCircle2,
  PlayCircle,
  Clock,
  DoorOpen,
  Truck,
  ArrowLeftRight,
  ArrowRightLeft,
} from "lucide-react";
import tasksDoneCelebrateAsset from "@/assets/today-task-complete-sparkles.svg.asset.json";
const tasksDoneCelebrate = tasksDoneCelebrateAsset.url;

import { MobileShell } from "@/components/mobile-shell";
import { EmptyState } from "@/components/empty-state";
import { RoleSwitchSheet } from "@/components/role-switch-sheet";
import { GreetingDialog } from "@/components/m/greeting-dialog";
import { useRole, roleLabel, roleGroup, canVisit, type Role } from "@/lib/mobile-role";


import { Activity, BookMarked, ClipboardCheck, AlertTriangle } from "lucide-react";
import { PICKUPS, useClaimed } from "@/lib/pickup-store";
import { FARMS, useFarmId, setFarmId, useFarm } from "@/lib/farm-store";
import { QrCode } from "lucide-react";
import grasslandHero from "@/assets/grassland-hero.png";


export const Route = createFileRoute("/m/homepage")({
  head: () => ({ meta: [{ title: "首页 · 奇点智牧" }] }),
  component: MHomePage,
});

const colorMap: Record<string, string> = {
  brand: "bg-brand-subtle text-primary",
  warning: "bg-[var(--state-warning)]/25 text-[var(--state-alert)]",
  alert: "bg-[var(--state-warning)]/25 text-[var(--state-alert)]",
  danger: "bg-[var(--state-danger)]/12 text-[var(--state-danger)]",
  info: "bg-[#E6F7FE] text-[#22ACEB]",
  purple: "bg-[var(--effect-ai-purple)]/15 text-[var(--effect-ai-purple)]",
  success: "bg-[var(--state-success)]/15 text-[var(--state-success)]",
  muted: "bg-surface-subtle text-text-secondary",
};

const toneTextMap: Record<string, string> = {
  brand: "text-primary",
  warning: "text-[var(--state-alert)]",
  alert: "text-[var(--state-alert)]",
  danger: "text-[var(--state-danger)]",
  info: "text-[var(--effect-ai-cyan)]",
  purple: "text-[var(--effect-ai-purple)]",
  success: "text-[var(--state-success)]",
  muted: "text-text-secondary",
};


function MHomePage() {
  const role = useRole();
  void role;
  const claimed = useClaimed();
  const pendingPickups = PICKUPS.filter((p) => !claimed.includes(p.id));
  const farm = useFarm();
  const [reportOpen, setReportOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);




  return (
    <MobileShell>
      <GreetingDialog count={pendingPickups.length + 6} />
      {/* 牧场切换（全局数据） */}
      <FarmSwitcher />

      {/* 顶部欢迎 —— 渐变信息面板 */}
      <header className="relative overflow-hidden text-white">
        <img
          src={grasslandHero}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover scale-125 origin-top blur-[1px]"
        />
        {/* 暗色遮罩，保证文字可读 */}
        <div className="absolute inset-0 bg-black/5" />
        {/* 底部柔和过渡到页面背景 */}
        <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-b from-transparent to-[var(--bg-page)]" />



        <div className="relative px-4 pt-5 pb-6">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => setRoleOpen(true)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 active:scale-95 transition-transform"
              >
                <span className="text-caption text-white/95">{roleLabel[role]}</span>
              </button>
              <div className="text-[18px] leading-tight font-semibold text-white mt-1.5 drop-shadow-sm">李师傅</div>
              <div className="text-caption text-white/85 mt-0.5 inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {farm.name} · {farm.region}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setReportOpen(true)}
                className="h-9 px-3 rounded-full bg-white text-primary inline-flex items-center gap-1 text-caption font-semibold shadow-[0_6px_18px_-4px_rgba(0,0,0,0.35)] ring-2 ring-white/40 active:scale-[.97] transition-transform"
              >
                <Camera className="h-3.5 w-3.5" />
                现场上报
              </button>
              <Link
                to="/m/prep"
                className="h-9 px-3 rounded-full bg-white text-primary inline-flex items-center gap-1 text-caption font-semibold shadow-[0_6px_18px_-4px_rgba(0,0,0,0.35)] ring-2 ring-white/40 active:scale-[.97] transition-transform"
              >
                <Pill className="h-3.5 w-3.5" />
                备药
              </Link>
            </div>
          </div>

        </div>

      </header>

      {/* ============ 数据统计(分角色) ============ */}
      <StatsSection role={role} />





      {/* ============ 工作任务(管理员/场长无待办) ============ */}
      {role !== "admin" && role !== "manager" && (
        <section className="px-4 mt-5">
          <SectionTitle
            title="今日任务"
            hint={`共计 ${getTaskCount(role)} 项`}
          />

          <TodayTaskList role={role} />
        </section>
      )}

      {/* ============ 金刚区:速查与近况 ============ */}
      {roleGroup[role] === "internal" && (
        <section className="px-4 mt-5 mb-4">
          <SectionTitle title="速查与近况" />

          <div className="grid grid-cols-3 gap-2.5">
            <KBShortcut
              to="/m/kb_symptoms"
              icon={Activity}
              tone="info"
              label="症状库"
              trendName="持续高烧"
              trendValue="14"
            />
            <KBShortcut
              to="/m/kb_diseases"
              icon={BookMarked}
              tone="brand"
              label="疾病库"
              trendName="乳房炎"
              trendValue="9"
            />
            <KBShortcut
              to="/m/kb_drugs"
              icon={Pill}
              tone="purple"
              label="药品库"
              trendName="头孢噻呋钠"
              trendValue="24"
            />
          </div>

        </section>
      )}






      {/* 现场上报 类型选择 */}
      {reportOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center"
          onClick={() => setReportOpen(false)}
        >
          <div
            className="w-full max-w-[440px] bg-card rounded-t-2xl p-4 pb-[calc(env(safe-area-inset-bottom)+16px)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-card-title text-foreground mb-3">现场上报</div>
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                to="/m/report"
                onClick={() => setReportOpen(false)}
                className="rounded-xl border border-border bg-card p-3 active:bg-surface-subtle"
              >
                <span className="h-9 w-9 rounded-lg bg-brand-subtle text-primary inline-flex items-center justify-center">
                  <Stethoscope className="h-4 w-4" />
                </span>
                <div className="mt-2 text-body font-medium text-foreground">健康上报</div>
                <div className="text-caption text-text-tertiary mt-0.5">疾病、修蹄、产后等</div>
              </Link>
              <Link
                to="/m/drug-report"
                onClick={() => setReportOpen(false)}
                className="rounded-xl border border-border bg-card p-3 active:bg-surface-subtle"
              >
                <span className="h-9 w-9 rounded-lg bg-[var(--state-warning)]/15 text-[var(--state-alert)] inline-flex items-center justify-center">
                  <PackageX className="h-4 w-4" />
                </span>
                <div className="mt-2 text-body font-medium text-foreground">药品上报</div>
                <div className="text-caption text-text-tertiary mt-0.5">损耗 / 退料登记</div>
              </Link>
            </div>
            <button
              onClick={() => setReportOpen(false)}
              className="mt-3 w-full h-10 rounded-lg text-body-sm text-text-secondary active:bg-surface-subtle"
            >
              取消
            </button>
          </div>
        </div>
      )}
      <RoleSwitchSheet open={roleOpen} onClose={() => setRoleOpen(false)} />
    </MobileShell>

  );
}

// ---------------- 数据 ----------------
export type TaskKind = "工单" | "基础事件" | "异常排查";
export type HomeTask = {
  id: string;
  target: string;
  conclusion: string;
  type: string; // 工单类型 / 检查项目名称 / 异常数据来源
  status: "待诊断" | "进行中";
  minutesAgo: number;
  kind?: TaskKind; // 缺省为「工单」
  dueDate?: string; // 基础事件：平台给出的完成期限
  cattleId?: string; // 异常排查：跳转牛只档案
};


export const homeTasks: HomeTask[] = [
  // 疾病治疗 · 待诊断（子宫炎类：产道创伤 / 产后子宫炎 / 子宫内膜炎）
  { id: "WO-2381", target: "#01-24-2381", conclusion: "产道创伤 · 阴道黏膜层撕裂", type: "疾病治疗", status: "待诊断", minutesAgo: 2 },
  { id: "WO-2382", target: "#01-24-2270", conclusion: "产后子宫炎 · 体温 39.8℃", type: "疾病治疗", status: "待诊断", minutesAgo: 8 },
  { id: "WO-2383", target: "#01-24-2156", conclusion: "产后子宫炎 · 分泌物恶臭", type: "疾病治疗", status: "待诊断", minutesAgo: 15 },
  { id: "WO-2384", target: "#01-24-2298", conclusion: "产后子宫炎 · 脓性分泌物", type: "疾病治疗", status: "待诊断", minutesAgo: 23 },
  { id: "WO-2385", target: "#01-24-2188", conclusion: "子宫内膜炎 · 直肠检查异常", type: "疾病治疗", status: "待诊断", minutesAgo: 31 },
  { id: "WO-2386", target: "#01-24-2102", conclusion: "子宫内膜炎 · 产后 24 天", type: "疾病治疗", status: "待诊断", minutesAgo: 42 },
  { id: "WO-2387", target: "#01-24-2250", conclusion: "产后子宫炎 · 产后 12 天", type: "疾病治疗", status: "待诊断", minutesAgo: 56 },
  // 疾病治疗 · 进行中
  { id: "WO-2298", target: "#01-24-2298", conclusion: "产后子宫炎处方 2 · 复诊", type: "疾病治疗", status: "进行中", minutesAgo: 12 },
  { id: "WO-2299", target: "#01-24-2270", conclusion: "产后子宫炎处方 1 · 疗程第 2 天", type: "疾病治疗", status: "进行中", minutesAgo: 25 },
  { id: "WO-2300", target: "#01-24-2188", conclusion: "子宫内膜炎处方 1 · 疗程第 2 天", type: "疾病治疗", status: "进行中", minutesAgo: 38 },
  { id: "WO-2301", target: "#01-24-2156", conclusion: "产后子宫炎处方 3 · 利福昔明灌注", type: "疾病治疗", status: "进行中", minutesAgo: 51 },
  { id: "WO-2302", target: "#01-24-2102", conclusion: "产道创伤处方 1 · 碘甘油局部处理", type: "疾病治疗", status: "进行中", minutesAgo: 67 },
  { id: "WO-2303", target: "#01-24-2233", conclusion: "子宫内膜炎处方 2 · 灌注第 2 次", type: "疾病治疗", status: "进行中", minutesAgo: 82 },
  { id: "WO-2440", target: "#01-24-2440", conclusion: "产后子宫炎 · 观察期满复查", type: "疾病治疗", status: "进行中", minutesAgo: 95 },
  // 产后护理 · 进行中
  { id: "PP-2501", target: "#01-24-2710", conclusion: "产后 3 天护理执行", type: "产后护理", status: "进行中", minutesAgo: 28 },
  // 疫苗免疫 · 进行中
  { id: "YM-1041", target: "#01-24-2041", conclusion: "口蹄疫加强免疫", type: "疫苗免疫", status: "进行中", minutesAgo: 5 },
  { id: "YM-1042", target: "#01-24-2042", conclusion: "布病强免疫", type: "疫苗免疫", status: "进行中", minutesAgo: 18 },
  { id: "YM-1043", target: "#01-24-2043", conclusion: "牛流行热免疫", type: "疫苗免疫", status: "进行中", minutesAgo: 33 },
  { id: "YM-1044", target: "#01-24-2044", conclusion: "炭疽芽孢苗免疫", type: "疫苗免疫", status: "进行中", minutesAgo: 47 },
  { id: "YM-1045", target: "#01-24-2045", conclusion: "副伤寒免疫", type: "疫苗免疫", status: "进行中", minutesAgo: 62 },
  { id: "YM-1046", target: "#01-24-2120", conclusion: "漏针补免", type: "疫苗免疫", status: "进行中", minutesAgo: 78 },
  { id: "YM-1047", target: "#01-24-2047", conclusion: "结核检疫排查", type: "疫苗免疫", status: "进行中", minutesAgo: 95 },
  // 疫苗免疫 · 同内容批量演示（口蹄疫疫苗、颈部肌注）
  { id: "YM-1051", target: "#01-24-2051", conclusion: "口蹄疫加强免疫", type: "疫苗免疫", status: "进行中", minutesAgo: 101 },
  { id: "YM-1052", target: "#01-24-2052", conclusion: "口蹄疫加强免疫", type: "疫苗免疫", status: "进行中", minutesAgo: 104 },
  { id: "YM-1053", target: "#01-24-2053", conclusion: "口蹄疫加强免疫", type: "疫苗免疫", status: "进行中", minutesAgo: 108 },
  { id: "YM-1054", target: "#01-24-2054", conclusion: "口蹄疫加强免疫", type: "疫苗免疫", status: "进行中", minutesAgo: 113 },
  { id: "YM-1055", target: "#01-24-2055", conclusion: "口蹄疫加强免疫", type: "疫苗免疫", status: "进行中", minutesAgo: 118 },
  // 修蹄 · 进行中（来源：晟安标准处方 · 肢蹄病类）
  { id: "HF-0702", target: "#01-24-2150", conclusion: "腐蹄病处方 1 · 头孢噻呋+氟尼辛", type: "修蹄", status: "进行中", minutesAgo: 7 },
  { id: "HF-0703", target: "#01-24-2151", conclusion: "腐蹄病处方 2 · 青霉素+生理盐水", type: "修蹄", status: "进行中", minutesAgo: 22 },
  { id: "HF-0704", target: "#01-24-2188", conclusion: "蹄趾皮炎 · 护蹄膏包扎", type: "修蹄", status: "进行中", minutesAgo: 36 },
  { id: "HF-0705", target: "#01-24-2298", conclusion: "蹄底溃疡 · 清创引流 + 蹄垫", type: "修蹄", status: "进行中", minutesAgo: 49 },
  { id: "HF-0706", target: "#01-24-2199", conclusion: "蹄疣 · 防腐生肌散", type: "修蹄", status: "进行中", minutesAgo: 64 },
  { id: "HF-0707", target: "#01-24-2210", conclusion: "白线病 · 远轴侧蹄壁清创", type: "修蹄", status: "进行中", minutesAgo: 80 },
  { id: "HF-0708", target: "#01-24-2211", conclusion: "功能性蹄浴液喷蹄", type: "修蹄", status: "进行中", minutesAgo: 99 },

  // 基础事件类（平台下发：基础检查 + 转群/转栏）
  { id: "EX-0901", target: "#01-24-2311", conclusion: "体温检查", type: "体温检查", status: "进行中", minutesAgo: 10, kind: "基础事件", dueDate: "2026-08-10" },
  { id: "EX-0902", target: "#01-24-2312", conclusion: "酮病检查", type: "酮病检查", status: "进行中", minutesAgo: 26, kind: "基础事件", dueDate: "2026-08-12" },
  { id: "EX-0903", target: "#01-24-2313", conclusion: "孕检", type: "孕检", status: "进行中", minutesAgo: 44, kind: "基础事件", dueDate: "2026-08-08" },
  { id: "EX-0904", target: "#01-24-2325", conclusion: "子宫分泌物检查", type: "子宫分泌物检查", status: "进行中", minutesAgo: 52, kind: "基础事件", dueDate: "2026-08-11" },
  { id: "EX-0905", target: "#01-24-2338", conclusion: "尿液 PH 值检查", type: "尿液 PH 值检查", status: "进行中", minutesAgo: 61, kind: "基础事件", dueDate: "2026-08-13" },
  // 孕检 · 批量演示
  { id: "EX-0911", target: "#01-24-2401", conclusion: "孕检", type: "孕检", status: "进行中", minutesAgo: 12, kind: "基础事件", dueDate: "2026-08-08" },
  { id: "EX-0912", target: "#01-24-2402", conclusion: "孕检", type: "孕检", status: "进行中", minutesAgo: 18, kind: "基础事件", dueDate: "2026-08-08" },
  { id: "EX-0913", target: "#01-24-2403", conclusion: "孕检", type: "孕检", status: "进行中", minutesAgo: 24, kind: "基础事件", dueDate: "2026-08-08" },
  { id: "EX-0914", target: "#01-24-2404", conclusion: "孕检", type: "孕检", status: "进行中", minutesAgo: 30, kind: "基础事件", dueDate: "2026-08-09" },
  // 酮病检查 · 批量演示
  { id: "EX-0921", target: "#01-24-2411", conclusion: "酮病检查", type: "酮病检查", status: "进行中", minutesAgo: 14, kind: "基础事件", dueDate: "2026-08-12" },
  { id: "EX-0922", target: "#01-24-2412", conclusion: "酮病检查", type: "酮病检查", status: "进行中", minutesAgo: 21, kind: "基础事件", dueDate: "2026-08-12" },
  { id: "EX-0923", target: "#01-24-2413", conclusion: "酮病检查", type: "酮病检查", status: "进行中", minutesAgo: 29, kind: "基础事件", dueDate: "2026-08-12" },
  { id: "EX-0924", target: "#01-24-2414", conclusion: "酮病检查", type: "酮病检查", status: "进行中", minutesAgo: 40, kind: "基础事件", dueDate: "2026-08-13" },
  // 尿液 PH 值检测 · 批量演示
  { id: "EX-0931", target: "#01-24-2421", conclusion: "尿液 PH 值检查", type: "尿液 PH 值检查", status: "进行中", minutesAgo: 16, kind: "基础事件", dueDate: "2026-08-13" },
  { id: "EX-0932", target: "#01-24-2422", conclusion: "尿液 PH 值检查", type: "尿液 PH 值检查", status: "进行中", minutesAgo: 23, kind: "基础事件", dueDate: "2026-08-13" },
  { id: "EX-0933", target: "#01-24-2423", conclusion: "尿液 PH 值检查", type: "尿液 PH 值检查", status: "进行中", minutesAgo: 34, kind: "基础事件", dueDate: "2026-08-13" },
  { id: "EX-0934", target: "#01-24-2424", conclusion: "尿液 PH 值检查", type: "尿液 PH 值检查", status: "进行中", minutesAgo: 45, kind: "基础事件", dueDate: "2026-08-14" },
  // 布病 A19 疫苗免疫抗体检测 · 批量演示
  { id: "EX-0941", target: "#01-24-2431", conclusion: "布病 A19 疫苗免疫抗体检测", type: "布病 A19 免疫抗体检测", status: "进行中", minutesAgo: 11, kind: "基础事件", dueDate: "2026-08-15" },
  { id: "EX-0942", target: "#01-24-2432", conclusion: "布病 A19 疫苗免疫抗体检测", type: "布病 A19 免疫抗体检测", status: "进行中", minutesAgo: 19, kind: "基础事件", dueDate: "2026-08-15" },
  { id: "EX-0943", target: "#01-24-2433", conclusion: "布病 A19 疫苗免疫抗体检测", type: "布病 A19 免疫抗体检测", status: "进行中", minutesAgo: 27, kind: "基础事件", dueDate: "2026-08-15" },
  { id: "EX-0944", target: "#01-24-2434", conclusion: "布病 A19 疫苗免疫抗体检测", type: "布病 A19 免疫抗体检测", status: "进行中", minutesAgo: 38, kind: "基础事件", dueDate: "2026-08-16" },
  // 后备牛 IBR/BVDV 免疫抗体检测 · 批量演示
  { id: "EX-0951", target: "#01-24-2441", conclusion: "后备牛 IBR/BVDV 免疫抗体检测", type: "IBR/BVDV 免疫抗体检测", status: "进行中", minutesAgo: 13, kind: "基础事件", dueDate: "2026-08-16" },
  { id: "EX-0952", target: "#01-24-2442", conclusion: "后备牛 IBR/BVDV 免疫抗体检测", type: "IBR/BVDV 免疫抗体检测", status: "进行中", minutesAgo: 22, kind: "基础事件", dueDate: "2026-08-16" },
  { id: "EX-0953", target: "#01-24-2443", conclusion: "后备牛 IBR/BVDV 免疫抗体检测", type: "IBR/BVDV 免疫抗体检测", status: "进行中", minutesAgo: 31, kind: "基础事件", dueDate: "2026-08-16" },
  { id: "EX-0954", target: "#01-24-2444", conclusion: "后备牛 IBR/BVDV 免疫抗体检测", type: "IBR/BVDV 免疫抗体检测", status: "进行中", minutesAgo: 43, kind: "基础事件", dueDate: "2026-08-17" },
  { id: "TR-0201", target: "#01-24-2352", conclusion: "由 3 号牛舍转入 泌乳一群（1 号牛舍）", type: "转群/转栏", status: "进行中", minutesAgo: 15, kind: "基础事件", dueDate: "2026-08-09" },
  { id: "TR-0202", target: "#01-24-2364", conclusion: "由 病牛舍 转回 泌乳二群（2 号牛舍）", type: "转群/转栏", status: "进行中", minutesAgo: 33, kind: "基础事件", dueDate: "2026-08-10" },
  // 6 月龄牛只转群 · 批量演示
  { id: "TR-0311", target: "#01-25-1101", conclusion: "6 月龄转群 · 转入 育成一群（5 号牛舍）", type: "转群/转栏", status: "进行中", minutesAgo: 17, kind: "基础事件", dueDate: "2026-08-11" },
  { id: "TR-0312", target: "#01-25-1102", conclusion: "6 月龄转群 · 转入 育成一群（5 号牛舍）", type: "转群/转栏", status: "进行中", minutesAgo: 24, kind: "基础事件", dueDate: "2026-08-11" },
  { id: "TR-0313", target: "#01-25-1103", conclusion: "6 月龄转群 · 转入 育成一群（5 号牛舍）", type: "转群/转栏", status: "进行中", minutesAgo: 36, kind: "基础事件", dueDate: "2026-08-11" },
  // 犊牛转育成交接转群 · 批量演示
  { id: "TR-0321", target: "#01-26-0201", conclusion: "犊牛转育成交接 · 转入 育成二群（6 号牛舍）", type: "转群/转栏", status: "进行中", minutesAgo: 20, kind: "基础事件", dueDate: "2026-08-12" },
  { id: "TR-0322", target: "#01-26-0202", conclusion: "犊牛转育成交接 · 转入 育成二群（6 号牛舍）", type: "转群/转栏", status: "进行中", minutesAgo: 28, kind: "基础事件", dueDate: "2026-08-12" },
  { id: "TR-0323", target: "#01-26-0203", conclusion: "犊牛转育成交接 · 转入 育成二群（6 号牛舍）", type: "转群/转栏", status: "进行中", minutesAgo: 41, kind: "基础事件", dueDate: "2026-08-12" },
  // 围产转群 · 批量演示
  { id: "TR-0331", target: "#01-24-2501", conclusion: "围产转群 · 转入 围产群（产房 1 号）", type: "转群/转栏", status: "进行中", minutesAgo: 9, kind: "基础事件", dueDate: "2026-08-10" },
  { id: "TR-0332", target: "#01-24-2502", conclusion: "围产转群 · 转入 围产群（产房 1 号）", type: "转群/转栏", status: "进行中", minutesAgo: 26, kind: "基础事件", dueDate: "2026-08-10" },
  { id: "TR-0333", target: "#01-24-2503", conclusion: "围产转群 · 转入 围产群（产房 1 号）", type: "转群/转栏", status: "进行中", minutesAgo: 47, kind: "基础事件", dueDate: "2026-08-10" },

  // 异常排查类（设备预警）
  { id: "AL-0101", target: "#01-24-2405", conclusion: "耳温异常", type: "耳温数据", status: "进行中", minutesAgo: 6, kind: "异常排查", cattleId: "01-24-2405" },
  { id: "AL-0102", target: "#01-24-2418", conclusion: "颈环异常", type: "颈环数据", status: "进行中", minutesAgo: 19, kind: "异常排查", cattleId: "01-24-2418" },
  { id: "AL-0103", target: "#01-24-2432", conclusion: "奶量异常", type: "奶量数据", status: "进行中", minutesAgo: 35, kind: "异常排查", cattleId: "01-24-2432" },
];


type RoleFilter = { status: "待诊断" | "进行中"; type: string; label: string };
export const roleFilterMap: Partial<Record<Role, RoleFilter>> = {
  vet: { status: "待诊断", type: "疾病治疗", label: "待诊断 / 待执行 / 待复查" },
  vet_assistant: { status: "进行中", type: "疾病治疗", label: "执行中 · 疾病治疗" },
  immunizer: { status: "进行中", type: "疫苗免疫", label: "执行中 · 疫苗免疫" },
  hoof_trimmer: { status: "进行中", type: "修蹄", label: "执行中 · 修蹄" },
};

const VET_EXEC_TYPES = new Set(["疾病治疗", "产后护理"]);

export function getRoleTasks(role: Role): HomeTask[] {
  // 场长无工单处理权限，不返回任何待办
  if (role === "manager") return [];
  const filter = roleFilterMap[role];
  if (!filter) return [];
  if (role === "vet") {
    const diagnoses = homeTasks.filter((t) => t.status === "待诊断" && t.type === "疾病治疗");
    const executions = homeTasks.filter(
      (t) =>
        t.status === "进行中" &&
        VET_EXEC_TYPES.has(t.type) &&
        diseaseTaskMeta[t.id]?.task !== "待复查",
    );
    const reviews = homeTasks.filter(
      (t) => t.type === "疾病治疗" && diseaseTaskMeta[t.id]?.task === "待复查",
    );
    // 保证三类都在首页露出:待诊断 3 / 待执行 2 / 待复查 2
    return [...diagnoses.slice(0, 3), ...executions.slice(0, 2), ...reviews.slice(0, 2)];
  }
  const base = homeTasks.filter((t) => t.status === filter.status && t.type === filter.type);
  return base.filter((t) => diseaseTaskMeta[t.id]?.task !== "待复查");
}

function getTaskCount(role: Role) {
  if (role === "admin" || role === "manager") return 0;
  return getRoleTasks(role).length;
}

export function formatTimeAgo(minutes: number) {
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  return `${days}天前`;
}

export const typeMeta: Record<string, { icon: typeof Pill; bg: string; text: string }> = {
  "疾病治疗": { icon: Pill, bg: "bg-brand-subtle", text: "text-primary" },
  "疫苗免疫": { icon: Syringe, bg: "bg-[#E6F7FE]", text: "text-[#0EA5E9]" },
  "修蹄":     { icon: Footprints, bg: "bg-[#FFF5DF]", text: "text-[#F59E0B]" },
  "产后护理": { icon: Baby, bg: "bg-[#F3E8FF]", text: "text-[#9333EA]" },
  // 基础事件类
  "体温检查":       { icon: ClipboardCheck, bg: "bg-[#E6F7FE]", text: "text-[#0EA5E9]" },
  "子宫分泌物检查": { icon: ClipboardCheck, bg: "bg-[#E6F7FE]", text: "text-[#0EA5E9]" },
  "酮病检查":       { icon: ClipboardCheck, bg: "bg-[#E6F7FE]", text: "text-[#0EA5E9]" },
  "尿液 PH 值检查": { icon: ClipboardCheck, bg: "bg-[#E6F7FE]", text: "text-[#0EA5E9]" },
  "布病 A19 免疫抗体检测": { icon: ClipboardCheck, bg: "bg-[#E6F7FE]", text: "text-[#0EA5E9]" },
  "IBR/BVDV 免疫抗体检测": { icon: ClipboardCheck, bg: "bg-[#E6F7FE]", text: "text-[#0EA5E9]" },
  "孕检":           { icon: ClipboardCheck, bg: "bg-[#E6F7FE]", text: "text-[#0EA5E9]" },
  "转群/转栏":      { icon: ArrowRightLeft, bg: "bg-[#EEF2FF]", text: "text-[#6366F1]" },
  // 异常排查类（警示色）
  "耳温数据": { icon: AlertTriangle, bg: "bg-[#FEF2F2]", text: "text-[#DC2626]" },
  "颈环数据": { icon: AlertTriangle, bg: "bg-[#FEF2F2]", text: "text-[#DC2626]" },
  "奶量数据": { icon: AlertTriangle, bg: "bg-[#FEF2F2]", text: "text-[#DC2626]" },
};


/** 基础事件类可筛选的事件类型：牛只档案中的基础检查项目 + 转群/转栏 */
export const BASIC_EVENT_TYPES = [
  "体温检查",
  "子宫分泌物检查",
  "酮病检查",
  "尿液 PH 值检查",
  "孕检",
  "转群/转栏",
];

// 疾病治疗工单的疾病名称 + 任务类型（用于统一卡片文案）
export type TaskChip = "待诊断" | "待执行" | "待复查" | "待治愈" | "已完成";
export const diseaseTaskMeta: Record<string, { disease: string; task: TaskChip }> = {
  "WO-2381": { disease: "产道创伤", task: "待诊断" },
  "WO-2382": { disease: "疾病不详", task: "待诊断" },
  "WO-2383": { disease: "产后子宫炎", task: "待诊断" },
  "WO-2384": { disease: "产后子宫炎", task: "待诊断" },
  "WO-2385": { disease: "子宫内膜炎", task: "待诊断" },
  "WO-2386": { disease: "子宫内膜炎", task: "待诊断" },
  "WO-2387": { disease: "产后子宫炎", task: "待诊断" },
  "WO-2298": { disease: "产后子宫炎", task: "待复查" },
  "WO-2299": { disease: "产后子宫炎", task: "待执行" },
  "WO-2300": { disease: "子宫内膜炎", task: "待执行" },
  "WO-2301": { disease: "产后子宫炎", task: "待执行" },
  "WO-2302": { disease: "产道创伤", task: "待执行" },
  "WO-2303": { disease: "子宫内膜炎", task: "待执行" },
  "WO-2440": { disease: "产后子宫炎", task: "待复查" },
};

// 任务类型 chip 颜色
export const taskChipStyle: Record<TaskChip, string> = {
  "待诊断": "bg-[#FFF5DF] text-[#B45309]",
  "待执行": "bg-[#E6F7FE] text-[#0EA5E9]",
  "待复查": "bg-[#E6F7FE] text-[#0EA5E9]",
  "待治愈": "bg-[#F3E8FF] text-[#9333EA]",
  "已完成": "bg-[#EFFBF1] text-[#00A14F]",
};

// 卡片"具体内容"数据源
// 待诊断:症状标签
export const SYMPTOM_TAGS: Record<string, string> = {
  "WO-2381": "阴道黏膜撕裂、出血 >5cm",
  "WO-2382": "高热、恶臭分泌物",
  "WO-2383": "恶臭分泌物、体温正常",
  "WO-2384": "脓性分泌物、产后 5 天",
  "WO-2385": "直肠检查异常、脓性分泌物",
  "WO-2386": "中度子宫内膜炎、产后 26 天",
  "WO-2387": "含脓分泌物、产后 12 天",
};
// 待执行:{药品名称}+{用药方法} 或 {任务名称}+{具体操作}
export const EXEC_BRIEF: Record<string, string> = {
  "WO-2298": "5% 头孢噻呋、肌肉注射 + 氟尼辛、静脉注射",
  "WO-2299": "青霉素钠、肌肉注射 + 氟尼辛、静脉注射",
  "WO-2300": "青霉素钠、肌肉注射 + 氟尼辛、静脉注射",
  "WO-2301": "10% 头孢噻呋、肌肉注射 + 利福昔明、子宫灌注",
  "WO-2302": "碘甘油、局部涂抹 + PGA 缝合线拆线",
  "WO-2303": "利福昔明、子宫灌注",
  "WO-2440": "直肠体温、测量记录 + 情况评估、拍照",
  "PP-2501": "直肠体温、测量记录 + 情况评估、拍照",
  "HF-0702": "5% 头孢噻呋、肌肉注射 + 氟尼辛、静脉注射",
  "HF-0703": "青霉素钠、肌肉注射 + 生理盐水冲洗",
  "HF-0704": "护蹄膏、局部包扎",
  "HF-0705": "清创引流 + 蹄垫粘贴",
  "HF-0706": "防腐生肌散、局部涂抹",
  "HF-0707": "远轴侧蹄壁、清创",
  "HF-0708": "功能性蹄浴液、喷蹄",
  "YM-1041": "口蹄疫疫苗、颈部肌注",
  "YM-1042": "布病疫苗、颈部皮下注射",
  "YM-1043": "牛流行热疫苗、颈部肌注",
  "YM-1044": "炭疽芽孢苗、皮下注射",
  "YM-1045": "副伤寒疫苗、颈部肌注",
  "YM-1046": "漏针补免、颈部肌注",
  "YM-1047": "结核菌素、皮内注射",
  "YM-1051": "口蹄疫疫苗、颈部肌注",
  "YM-1052": "口蹄疫疫苗、颈部肌注",
  "YM-1053": "口蹄疫疫苗、颈部肌注",
  "YM-1054": "口蹄疫疫苗、颈部肌注",
  "YM-1055": "口蹄疫疫苗、颈部肌注",
};
// 待复查:复查任务描述
export const REVIEW_BRIEF: Record<string, string> = {
  "WO-2298": "直肠体温 + 分泌物评估",
  "WO-2440": "直肠体温 + 子宫恢复评估",
};
// 异常排查:具体的异常数据描述
export const ALERT_BRIEF: Record<string, string> = {
  "AL-0101": "耳温连续 6h 高于 39.5℃，最高 40.1℃",
  "AL-0102": "反刍时长较 7 日均值下降 38%，活动量偏低",
  "AL-0103": "今日产奶量较 7 日均值下降 24%（22.6kg）",
};

// 任务卡片「具体内容」（含基础事件 / 异常排查类）
export function taskCardContent(t: HomeTask, chip: TaskChip | null) {
  if (t.kind === "基础事件") {
    if (t.type === "转群/转栏")
      return `${t.conclusion}，请在${t.dueDate}前完成转群。`;
    return `平台下发${t.type}任务，请在${t.dueDate}前完成。`;
  }
  if (t.kind === "异常排查") return ALERT_BRIEF[t.id] ?? t.conclusion;
  return taskContentByChip(t.id, chip, t.conclusion);
}



export function taskContentByChip(id: string, chip: TaskChip | null, fallback: string) {
  if (chip === "待诊断") return SYMPTOM_TAGS[id] ?? fallback;
  if (chip === "待复查") return REVIEW_BRIEF[id] ?? "测温 + 复查评估";
  if (chip === "待执行") return EXEC_BRIEF[id] ?? fallback;
  return fallback;
}

export function truncateCJK(s: string, max = 5) {
  return [...s].length > max ? [...s].slice(0, max).join("") + "…" : s;
}

function TodayTaskList({ role }: { role: Role }) {
  const renderAllDone = () => (
    <div className="mt-3 flex items-center gap-3 min-h-[136px] rounded-2xl bg-card px-4 py-3">
      <img
        src={tasksDoneCelebrate}
        alt=""
        width={112}
        height={112}
        loading="lazy"
        className="h-[104px] w-[104px] shrink-0 object-contain"
      />
      <div className="flex flex-col">
        <div className="text-card-title text-foreground font-semibold">今日任务已全部完成</div>
        <div className="text-body-sm text-text-tertiary mt-1">辛苦啦,今天的工作都处理完了</div>
      </div>
    </div>
  );

  if (role === "admin") {
    return (
      <div className="mt-3 flex items-center gap-3 min-h-[136px] rounded-2xl bg-card px-4 py-3">
        <img
          src={tasksDoneCelebrate}
          alt=""
          width={112}
          height={112}
          loading="lazy"
          className="h-[104px] w-[104px] shrink-0 object-contain"
        />
        <div className="flex flex-col">
          <div className="text-card-title text-foreground font-semibold">管理员无待办任务</div>
          <div className="text-body-sm text-text-tertiary mt-1">
            可在工单列表中查看全场工单
          </div>
        </div>
      </div>
    );
  }

  const matched = getRoleTasks(role);
  const visible = matched.slice(0, 2);
  const hasPeek = matched.length > 1;
  const remaining = matched.length;


  if (visible.length === 0) {
    return renderAllDone();
  }

  return (
    <div className="mt-3 space-y-2.5">
      {visible.map((t, idx) => {
        const isPeek = idx === 1;
        const meta = typeMeta[t.type] ?? typeMeta["疾病治疗"];
        const Icon = meta.icon;
        const isExam = t.kind === "基础事件";
        const isReview =
          t.type === "疾病治疗" && diseaseTaskMeta[t.id]?.task === "待复查";
        const isExecution =
          t.status === "进行中" && VET_EXEC_TYPES.has(t.type) && !isReview;
        const actionText = isExam
          ? "记录"
          : isReview
            ? "复查"
            : isExecution
              ? "执行"
              : "诊断";

        const chip: TaskChip | null =
          t.type === "疾病治疗"
            ? diseaseTaskMeta[t.id]?.task ?? null
            : t.status === "进行中"
              ? "待执行"
              : t.status === "待诊断"
                ? "待诊断"
                : null;
        const cattleId = t.target.startsWith("#") ? t.target : null;
        const groupTarget = cattleId ? null : t.target;
        const barn = cattleId
          ? `${((Number(t.target.slice(-1)) || 1) % 4) + 1} 号牛舍`
          : "";
        const pk = isExecution ? PICKUPS.find((p) => p.source === t.id) : null;
        const body = (
          <div className="px-3.5 py-3">
            {/* 顶部: 类型 + 编号 + 状态 + 时间 */}
            <div className="flex items-center gap-1.5">
              <span
                className={`h-5 w-5 rounded-full ${meta.bg} ${meta.text} inline-flex items-center justify-center shrink-0`}
              >
                <Icon className="h-3 w-3" strokeWidth={2} />
              </span>
              <span className="text-body-sm text-text-secondary">{t.type}</span>
              <span className="text-caption text-text-tertiary font-mono">{t.id}</span>
              {chip && (
                <span
                  className={`inline-flex items-center px-1.5 h-[18px] rounded-full text-caption leading-none ${taskChipStyle[chip]}`}
                >
                  {chip}
                </span>
              )}
              <span className="ml-auto text-caption text-text-tertiary">
                {formatTimeAgo(t.minutesAgo)}
              </span>
            </div>

            {/* 主体 */}
            <div className="mt-2.5">
              <div className="flex items-baseline gap-2 min-w-0">
                <span className="text-[17px] font-semibold text-foreground font-mono leading-tight truncate">
                  {cattleId ?? groupTarget}
                </span>
                {barn && (
                  <span className="text-body-sm text-text-tertiary shrink-0 truncate">
                    {barn}
                  </span>
                )}
              </div>
              <div className="mt-1.5 text-body-sm text-text-secondary truncate">
                <span className="text-text-tertiary mr-1.5">具体内容</span>
                {taskContentByChip(t.id, chip, t.conclusion)}
              </div>
            </div>

            {/* 底部: 领物 + 操作 */}
            <div className="mt-3 flex items-center justify-between">
              {chip === "待诊断" ? (
                <span className="inline-flex items-center gap-1 text-caption text-text-tertiary">
                  <Package className="h-3.5 w-3.5" />
                  -
                </span>
              ) : isReview ? (
                <span className="inline-flex items-center gap-1 text-caption text-text-tertiary">
                  <Package className="h-3.5 w-3.5" />
                  无需领物
                </span>
              ) : pk ? (
                <span className="inline-flex items-center gap-1 text-caption text-text-tertiary">
                  <Package className="h-3.5 w-3.5" />
                  需要领物
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-caption text-text-tertiary">
                  <Package className="h-3.5 w-3.5" />
                  无需领物
                </span>
              )}
              <span className="inline-flex items-center gap-0.5 text-body-sm text-primary">
                {actionText}
                <ChevronRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>
        );
        const linkCls =
          "block rounded-2xl border border-border bg-card overflow-hidden active:bg-surface-subtle";

        if (isPeek) {
          // 1/3 高度预览,底部渐隐
          return (
            <div
              key={t.id}
              aria-hidden
              className="relative rounded-t-2xl border border-b-0 border-border bg-card overflow-hidden pointer-events-none"
              style={{
                height: 44,
                maskImage:
                  "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,0) 100%)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,0) 100%)",
              }}
            >
              {body}
            </div>
          );
        }

        return isExam ? (
          <Link
            key={t.id}
            to="/m/events/$type/$id"
            params={{ type: "exam", id: t.target.replace("#", "") }}
            search={{ item: t.type }}
            className={linkCls}
          >
            {body}
          </Link>
        ) : isReview ? (

          <Link key={t.id} to="/m/health/$id/review" params={{ id: t.id }} className={linkCls}>
            {body}
          </Link>
        ) : isExecution ? (
          <Link key={t.id} to="/m/health/$id/execute" params={{ id: t.id }} className={linkCls}>
            {body}
          </Link>
        ) : (
          <Link key={t.id} to="/m/health/$id" params={{ id: t.id }} className={linkCls}>
            {body}
          </Link>
        );
      })}
      {hasPeek && (
        <Link
          to="/m/health/today"
          className="mt-1 flex items-center justify-center gap-0.5 text-body-sm text-text-secondary active:text-primary"
        >
          查看全部
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}











// ---------------- 数据统计 ----------------
function StatsSection({ role }: { role: Role }) {
  const isOps = role === "admin" || role === "manager";
  if (isOps) return <OpsOverview />;
  return <PersonalWorkStats />;
}

function OpsOverview() {
  type KpiItem = {
    label: string;
    value: string;
    unit: string;
    tone: string;
    bg: string;
    visual: "bars" | "ring" | "spark" | "clock" | "truck";
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  };
  const kpis: KpiItem[] = [
    {
      label: "存栏牛只",
      value: "12,486",
      unit: "头",
      tone: "var(--brand)",
      bg: "color-mix(in oklab, var(--brand) 10%, #FFFFFF)",
      visual: "bars",
      icon: Beef,
    },
    {
      label: "休药隔离",
      value: "38",
      unit: "头",
      tone: "#FF8A3D",
      bg: "color-mix(in oklab, #FF8A3D 10%, #FFFFFF)",
      visual: "clock",
      icon: Pill,
    },
    {
      label: "新生牛犊",
      value: "126",
      unit: "头",
      tone: "#2E8CF0",
      bg: "color-mix(in oklab, #2E8CF0 8%, #FFFFFF)",
      visual: "spark",
      icon: Baby,
    },
    {
      label: "离场牛只",
      value: "92",
      unit: "头",
      tone: "var(--effect-ai-purple)",
      bg: "color-mix(in oklab, var(--effect-ai-purple) 10%, #FFFFFF)",
      visual: "truck",
      icon: DoorOpen,
    },
  ];
  return (
    <section className="px-4 -mt-1 relative z-10">
      <SectionTitle title="运营概览" hint="本月" />
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div
              key={k.label}
              className="relative rounded-2xl p-3.5 overflow-hidden aspect-[1.9/1]"
              style={{ background: k.bg }}
            >
              <div className="flex items-center gap-1.5">
                <Icon className="h-4 w-4" style={{ color: k.tone }} />
                <span className="text-body-sm text-foreground">{k.label}</span>
              </div>
              <div className="absolute left-3.5 bottom-3 flex items-baseline gap-1">
                <span
                  className="text-[30px] leading-none font-semibold tabular-nums"
                  style={{ color: k.tone }}
                >
                  {k.value}
                </span>
                <span className="text-caption text-text-tertiary">{k.unit}</span>
              </div>
              <StatVisual variant={k.visual} tone={k.tone} />
            </div>
          );
        })}
      </div>
      <HealthTrendChart />
    </section>
  );
}

function HealthTrendChart() {
  const months = ["12月", "1月", "2月", "3月", "4月", "5月"];
  const onset = [62, 58, 71, 65, 78, 87];
  const cured = [57, 54, 64, 61, 71, 79];
  const dead = [5, 4, 7, 4, 8, 11];
  const W = 320;
  const H = 160;
  const padL = 28;
  const padR = 12;
  const padT = 12;
  const padB = 22;
  const maxY = 100;
  const xStep = (W - padL - padR) / (months.length - 1);
  const x = (i: number) => padL + i * xStep;
  const y = (v: number) => padT + (1 - v / maxY) * (H - padT - padB);
  const path = (arr: number[]) =>
    arr.map((v, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(v)}`).join(" ");
  const yTicks = [0, 20, 40, 60, 80, 100];
  return (
    <div className="mt-3 rounded-xl border border-border bg-card p-3">
      <div className="flex items-center justify-between">
        <div className="text-body font-medium text-foreground">健康趋势</div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full h-auto">
        {yTicks.map((t) => (
          <g key={t}>
            <line
              x1={padL}
              x2={W - padR}
              y1={y(t)}
              y2={y(t)}
              stroke="var(--border)"
              strokeWidth={0.5}
            />
            <text
              x={padL - 4}
              y={y(t) + 3}
              textAnchor="end"
              fontSize={9}
              fill="var(--text-tertiary)"
            >
              {t}
            </text>
          </g>
        ))}
        <path d={path(onset)} fill="none" stroke="#22ACEB" strokeWidth={2} />
        <path d={path(cured)} fill="none" stroke="var(--brand)" strokeWidth={2} />
        <path
          d={path(dead)}
          fill="none"
          stroke="var(--state-danger)"
          strokeWidth={2}
          strokeDasharray="3 3"
        />
        {onset.map((v, i) => (
          <circle key={`o${i}`} cx={x(i)} cy={y(v)} r={2.5} fill="#22ACEB" />
        ))}
        {cured.map((v, i) => (
          <circle key={`c${i}`} cx={x(i)} cy={y(v)} r={2.5} fill="var(--brand)" />
        ))}
        {dead.map((v, i) => (
          <circle key={`d${i}`} cx={x(i)} cy={y(v)} r={2.5} fill="var(--state-danger)" />
        ))}
        {months.map((m, i) => (
          <text
            key={m}
            x={x(i)}
            y={H - 6}
            textAnchor="middle"
            fontSize={10}
            fill="var(--text-tertiary)"
          >
            {m}
          </text>
        ))}
      </svg>
      <div className="mt-2 flex items-center justify-center gap-3 text-caption text-text-secondary">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-[#22ACEB]" />发病
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-[var(--brand)]" />治愈
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-[var(--state-danger)]" />死淘
        </span>
      </div>
    </div>
  );
}

const WORK_SCOPES = [
  { id: "all", label: "全部" },
  { id: "ud", label: "其他" },
] as const;
type WorkScope = (typeof WORK_SCOPES)[number]["id"];

const WORK_SCOPE_DATA: Record<WorkScope, { total: string; rate: string; doing: string; overdue: string }> = {
  all: { total: "128", rate: "75", doing: "14", overdue: "6" },
  ud: { total: "46", rate: "82", doing: "5", overdue: "2" },
};

function PersonalWorkStats() {
  type StatItem = {
    label: string;
    value: string;
    unit: string;
    tone: string;
    bg: string;
    visual: "bars" | "ring" | "spark" | "clock";
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  };
  const [scope, setScope] = useState<WorkScope>("all");
  const d = WORK_SCOPE_DATA[scope];
  const stats: StatItem[] = [
    {
      label: scope === "ud" ? "派工单量" : "全部工单",
      value: d.total,
      unit: "单",
      tone: "#FF8A3D",
      bg: "color-mix(in oklab, #FF8A3D 10%, #FFFFFF)",
      visual: "bars",
      icon: FileText,
    },
    {
      label: "完成率",
      value: d.rate,
      unit: "%",
      tone: "var(--state-success)",
      bg: "color-mix(in oklab, var(--state-success) 10%, #FFFFFF)",
      visual: "ring",
      icon: CheckCircle2,
    },
    {
      label: "进行中",
      value: d.doing,
      unit: "单",
      tone: "#2E8CF0",
      bg: "color-mix(in oklab, #2E8CF0 8%, #FFFFFF)",
      visual: "spark",
      icon: PlayCircle,
    },
    {
      label: "逾期数",
      value: d.overdue,
      unit: "单",
      tone: "#F15454",
      bg: "color-mix(in oklab, #F15454 8%, #FFFFFF)",
      visual: "clock",
      icon: Clock,
    },
  ];
  return (
    <section className="px-4 -mt-1 relative z-10">
      <SectionTitle
        title="工作概览"
        right={
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-caption text-text-tertiary">本月</span>
            <span className="h-2.5 w-px bg-border" />
            <button
              onClick={() => setScope((prev) => (prev === "all" ? "ud" : "all"))}
              className="flex items-center gap-1 text-caption leading-none text-primary font-medium"
            >
              {WORK_SCOPES.find((s) => s.id === scope)?.label}
              <ArrowLeftRight className="h-3 w-3" />
            </button>
          </div>
        }
      />


      <div className="grid grid-cols-2 gap-2.5">

        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="relative rounded-2xl p-3.5 overflow-hidden aspect-[1.9/1]"
              style={{ background: s.bg }}
            >
              <div className="flex items-center gap-1.5">
                <Icon className="h-4 w-4" style={{ color: s.tone }} />
                <span className="text-body-sm text-foreground">{s.label}</span>
              </div>
              <div className="absolute left-3.5 bottom-3 flex items-baseline gap-1">
                <span
                  className="text-[30px] leading-none font-semibold tabular-nums"
                  style={{ color: s.tone }}
                >
                  {s.value}
                </span>
                <span className="text-caption text-text-tertiary">{s.unit}</span>
              </div>
              <StatVisual variant={s.visual} tone={s.tone} />
            </div>
          );
        })}
      </div>
    </section>
  );
}


function StatVisual({ variant, tone }: { variant: "bars" | "ring" | "spark" | "clock" | "truck"; tone: string }) {
  if (variant === "bars") {
    return (
      <div className="absolute right-3 bottom-3 flex items-end gap-1.5" style={{ color: tone }}>
        <span className="block w-[5px] rounded-full bg-current" style={{ height: 10, opacity: 0.5 }} />
        <span className="block w-[5px] rounded-full bg-current" style={{ height: 16, opacity: 0.55 }} />
        <span className="block w-[5px] rounded-full bg-current" style={{ height: 22, opacity: 0.6 }} />
        <span className="block w-[5px] rounded-full bg-current" style={{ height: 28, opacity: 0.7 }} />
      </div>
    );
  }
  if (variant === "ring") {
    const r = 16;
    const c = 2 * Math.PI * r;
    return (
      <svg className="absolute right-2.5 bottom-2.5" width="42" height="42" viewBox="0 0 42 42">
        <circle cx="21" cy="21" r={r} fill="none" stroke={tone} strokeOpacity="0.2" strokeWidth="3" />
        <circle
          cx="21" cy="21" r={r} fill="none" stroke={tone} strokeWidth="3" strokeLinecap="round"
          strokeDasharray={`${c * 0.75} ${c}`} transform="rotate(-90 21 21)"
        />
        <path d="M15 21.5 L19 25.5 L27 17" fill="none" stroke={tone} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (variant === "spark") {
    const line = "M4 30 C 12 30, 16 18, 24 18 S 36 32, 44 28 S 58 6, 78 6";
    const area = `${line} L 78 40 L 4 40 Z`;
    const gid = `spark-grad-${tone.replace(/[^a-zA-Z0-9]/g, "")}`;
    return (
      <svg className="absolute right-2 bottom-2" width="82" height="42" viewBox="0 0 82 42" fill="none">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={tone} stopOpacity="0.22" />
            <stop offset="100%" stopColor={tone} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${gid})`} />
        <path d={line} stroke={tone} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    );
  }
  if (variant === "truck") {
    return (
      <svg className="absolute right-2 bottom-2" width="60" height="42" viewBox="0 0 60 42" fill="none">
        {/* cargo box */}
        <rect x="4" y="10" width="30" height="20" rx="2" stroke={tone} strokeWidth="2.2" fill={tone} fillOpacity="0.12" />
        {/* cab */}
        <path d="M34 16 L46 16 L54 24 L54 30 L34 30 Z" stroke={tone} strokeWidth="2.2" strokeLinejoin="round" fill={tone} fillOpacity="0.12" />
        {/* window */}
        <path d="M37 18 L45 18 L50.5 23.5 L37 23.5 Z" fill={tone} fillOpacity="0.28" />
        {/* wheels */}
        <circle cx="14" cy="32" r="3.4" fill="#fff" stroke={tone} strokeWidth="2.2" />
        <circle cx="44" cy="32" r="3.4" fill="#fff" stroke={tone} strokeWidth="2.2" />
      </svg>
    );
  }
  // clock
  const cx = 22, cy = 22, r = 15;
  const dots = Array.from({ length: 12 }, (_, i) => {
    // dotted portion: bottom-left half (angles 120°–330° going counter-clockwise via left)
    const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle), i };
  });
  return (
    <svg className="absolute right-2.5 bottom-2.5" width="44" height="44" viewBox="0 0 44 44" fill="none">
      {dots.map((d) => (
        // draw dots on left/bottom arc only (indices 6..11 → 6,7,8,9,10,11 = left side)
        (d.i >= 6 && d.i <= 11) || d.i === 0 ? (
          <circle key={d.i} cx={d.x} cy={d.y} r="1.2" fill={tone} fillOpacity="0.35" />
        ) : null
      ))}
      {/* solid arc: top-right through right down to bottom (from 12 o'clock to ~5 o'clock) */}
      <path d="M22 7 A15 15 0 0 1 32.6 32.6" stroke={tone} strokeWidth="2.6" strokeLinecap="round" fill="none" />
      {/* hour hand pointing to ~4 (lower-right) */}
      <path d="M22 22 L29 27" stroke={tone} strokeWidth="2.6" strokeLinecap="round" fill="none" />
      {/* minute hand pointing up */}
      <path d="M22 22 L22 12" stroke={tone} strokeWidth="2.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// ---------------- 子组件 ----------------
function SectionTitle({
  title,
  hint,
  to,
  search,
  right,
}: {
  title: string;
  hint?: string;
  to?: string;
  search?: Record<string, unknown>;
  right?: ReactNode;
}) {
  if (to) {
    return (
      <Link
        to={to as never}
        search={search as never}
        className="flex items-center justify-between mb-2 active:opacity-70"
      >
        <h3 className="text-section-title text-foreground">{title}</h3>
        {hint && (
          <span className="inline-flex items-center gap-0.5 text-caption text-text-tertiary">
            {hint}
            <ChevronRight className="h-3 w-3" />
          </span>
        )}
      </Link>
    );
  }
  return (
    <div className="flex items-center justify-between gap-2 mb-2">
      <h3 className="text-section-title text-foreground">{title}</h3>
      {right ?? (hint && <span className="text-caption text-text-tertiary">{hint}</span>)}
    </div>
  );
}



const toneAccentMap: Record<string, string> = {
  brand: "var(--brand)",
  warning: "var(--state-warning)",
  danger: "var(--state-danger)",
  info: "#F6A11D",
  purple: "#15A6E9",
  success: "var(--state-success)",
  muted: "var(--text-secondary)",
};
function SummaryCard({
  icon: Icon,
  tone,
  label,
  value,
  trend,
  trendDir,
}: {
  icon: typeof Beef;
  tone: keyof typeof colorMap;
  label: string;
  value: string;
  trend?: string;
  trendDir?: "up" | "down";
}) {
  const trendTone =
    trendDir === "down"
      ? "bg-[color-mix(in_srgb,var(--state-danger)_12%,transparent)] text-[var(--state-danger)]"
      : colorMap[tone];
  return (
    <div className="rounded-2xl bg-card border border-border/70 p-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <div className="flex items-start justify-between gap-2">
        <span className="text-caption text-text-secondary leading-tight">{label}</span>
        <span className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${colorMap[tone]}`}>
          <Icon className="h-3.5 w-3.5" strokeWidth={2} />
        </span>
      </div>
      <div className="mt-3 text-[26px] leading-none font-semibold text-foreground tabular-nums tracking-tight">
        {value}
      </div>
      {trend && (
        <div className="mt-2.5">
          <span className={`inline-flex items-center gap-0.5 h-5 px-1.5 rounded-md text-caption font-medium tabular-nums ${trendTone}`}>
            {trendDir === "down" ? "↘" : "↗"} {trend}
          </span>
        </div>
      )}
    </div>
  );
}



function DataCard({
  icon: Icon,
  tone,
  label,
  value,
  sub,
  compact,
  trend,
  trendDir,
}: {
  icon: typeof Beef;
  tone: keyof typeof colorMap;
  label: string;
  value: string;
  sub?: string;
  compact?: boolean;
  trend?: string;
  trendDir?: "up" | "down";
}) {
  if (compact) {
    return (
      <div className="rounded-xl bg-card border border-border p-3">
        <div className="flex items-center gap-2">
          <span className={`h-7 w-7 rounded-md flex items-center justify-center ${colorMap[tone]}`}>
            <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
          </span>
          <span className="text-caption text-text-secondary truncate">{label}</span>
        </div>
        <div className="mt-2 text-card-title text-foreground tabular-nums">{value}</div>
        {sub && <div className="text-caption text-text-tertiary mt-0.5 truncate">{sub}</div>}
      </div>
    );
  }
  const accent = toneAccentMap[tone];
  return (
    <div
      className="relative rounded-2xl bg-card border border-border p-3.5 overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(135deg, color-mix(in oklab, ${accent} 8%, transparent) 0%, color-mix(in oklab, ${accent} 0%, transparent) 60%)`,
      }}
    >
      {/* 角落水印图标 */}
      <span
        className="pointer-events-none absolute -right-3 -bottom-3 opacity-[0.08]"
        style={{ color: accent }}
      >
        <Icon className="h-20 w-20" strokeWidth={1.25} />
      </span>
      {/* 顶部：图标 + 标签 + 趋势 */}
      <div className="relative flex items-center justify-between">
        <span
          className={`h-9 w-9 rounded-xl flex items-center justify-center ${colorMap[tone]} shadow-[0_4px_12px_-6px]`}
          style={{ boxShadow: `0 6px 14px -8px ${accent}` }}
        >
          <Icon className="h-4.5 w-4.5" strokeWidth={2} />
        </span>
        {trend && (
          <span
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-caption font-medium tabular-nums"
            style={{
              backgroundColor: `color-mix(in oklab, ${accent} 14%, transparent)`,
              color: accent,
            }}
          >
            {trendDir === "down" ? (
              <ArrowUpRight className="h-2.5 w-2.5 rotate-90" />
            ) : (
              <TrendingUp className="h-2.5 w-2.5" />
            )}
            {trend}
          </span>
        )}
      </div>
      {/* 数值 */}
      <div className="relative mt-3 text-section-title text-foreground tabular-nums leading-none">
        {value}
      </div>
      {/* 标签 + 子说明 */}
      <div className="relative mt-1.5 flex items-center justify-between">
        <span className="text-caption text-text-secondary truncate">{label}</span>
        {sub && <span className="text-caption text-text-tertiary shrink-0 ml-2">{sub}</span>}
      </div>
    </div>
  );
}

function TaskOverviewCard({
  to,
  search,
  icon: Icon,
  tone,
  label,
  value,
}: {
  to: string;
  search?: Record<string, string>;
  icon: typeof Inbox;
  tone: keyof typeof colorMap;
  label: string;
  value: string;
}) {
  return (
    <Link
      to={to}
      search={search as never}
      className="rounded-xl bg-card border border-border p-3 flex flex-col gap-2 active:bg-surface-subtle"
    >
      <div className="flex items-center justify-between">
        <span className={`h-7 w-7 rounded-md flex items-center justify-center ${colorMap[tone]}`}>
          <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
        </span>
        <ChevronRight className="h-3.5 w-3.5 text-text-tertiary" />
      </div>
      <div>
        <div className="text-caption text-text-secondary">{label}</div>
        <div className="text-section-title text-foreground tabular-nums mt-0.5">{value}</div>
      </div>
    </Link>
  );
}

function KBShortcut({
  to,
  tone,
  label,
  trendName,
  trendValue,
}: {
  to: string;
  icon?: typeof Beef;
  tone: keyof typeof colorMap;
  label: string;
  trendName: string;
  trendValue: string;
}) {
  const accent = toneAccentMap[tone];
  return (
    <Link
      to={to}
      className="group relative block h-[110px] active:scale-[0.98] transition-transform"
      aria-label={label}
    >
      {/* 顶部 tab —— 与后片共用同一底色，确保边缘连续 */}
      <div
        className="absolute left-0 top-0 h-4 w-[44%] rounded-tl-[14px] rounded-tr-[10px]"
        style={{ background: accent }}
      />
      {/* 文件夹后片 */}
      <div
        className="absolute inset-x-0 bottom-0 top-3 rounded-tr-[14px] rounded-b-[14px]"
        style={{
          background: accent,
          boxShadow: `0 10px 22px -12px color-mix(in oklab, ${accent} 70%, transparent)`,
        }}
      />
      {/* 上沿一体化高光 */}
      <div
        aria-hidden
        className="absolute left-0 right-0 top-0 h-[26px] rounded-tl-[14px] rounded-tr-[14px] pointer-events-none"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 100%)",
        }}
      />

      {/* 白色"纸张"露出 */}
      <div className="absolute left-2.5 right-2.5 top-[18px] h-[38px] overflow-hidden">
        <div className="absolute left-1 right-3 top-1 h-[34px] rounded-[5px] bg-white/95 shadow-sm rotate-[-2deg]">
          <div className="px-1.5 pt-1.5 space-y-[3px]">
            <div className="h-[3px] w-[60%] rounded-full bg-black/15" />
            <div className="h-[3px] w-[80%] rounded-full bg-black/10" />
            <div className="h-[3px] w-[45%] rounded-full bg-black/10" />
          </div>
        </div>
        <div className="absolute left-2 right-1 top-0 h-[34px] rounded-[5px] bg-white shadow-sm rotate-[1.5deg]">
          <div className="px-1.5 pt-1.5 space-y-[3px]">
            <div className="h-[3px] w-[55%] rounded-full bg-black/15" />
            <div className="h-[3px] w-[75%] rounded-full bg-black/10" />
            <div className="h-[3px] w-[40%] rounded-full bg-black/10" />
          </div>
        </div>
      </div>
      {/* 文件夹前袋 */}
      <div
        className="absolute inset-x-0 bottom-0 h-[60px] rounded-[14px] rounded-tl-[6px] overflow-hidden"
        style={{
          background: `linear-gradient(180deg, color-mix(in oklab, ${accent} 90%, #fff) 0%, ${accent} 100%)`,
          boxShadow: `inset 0 1px 0 color-mix(in oklab, #fff 35%, transparent), 0 6px 14px -8px color-mix(in oklab, ${accent} 80%, transparent)`,
        }}
      >
        {/* 高光 */}
        <span
          className="absolute -top-4 -left-4 h-12 w-20 rounded-full opacity-50 blur-xl"
          style={{ background: "rgba(255,255,255,0.55)" }}
        />
        <div className="relative h-full px-2.5 pt-1.5 pb-2 flex flex-col justify-between text-white">
          <div className="text-quick-card-title drop-shadow-sm">{label}</div>
          <div className="flex items-center justify-between text-caption text-white/90 leading-none">
            <span className="truncate max-w-[7em] font-medium">{trendName}</span>
            <span className="shrink-0 inline-flex items-center gap-0.5 tabular-nums font-semibold">
              <TrendingUp className="h-2 w-2" />
              {trendValue}
            </span>
          </div>
        </div>

      </div>
    </Link>
  );
}





// ---------------- 牧场切换 ----------------
function FarmSwitcher() {
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState<false | "loading" | "done">(false);
  const currentId = useFarmId();
  const ref = useRef<HTMLDivElement>(null);
  const current = FARMS.find((f) => f.id === currentId) ?? FARMS[0];
  const single = FARMS.length === 1;


  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div
      ref={ref}
      className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-border px-4 py-2"
    >

      <button
        type="button"
        onClick={() => !single && setOpen((v) => !v)}
        className="w-full h-11 flex items-center gap-2 active:bg-surface-subtle"
      >
        <span className="h-6 w-6 rounded-md bg-brand-subtle text-primary inline-flex items-center justify-center shrink-0">
          <MapPin className="h-3.5 w-3.5" />
        </span>
        <span className="text-body font-medium text-foreground truncate">{current.name}</span>
        <span className="text-caption text-text-tertiary truncate">· {current.region}</span>
        <span className="flex-1" />
        {single ? (
          <span className="text-caption text-text-tertiary">仅 1 个牧场</span>
        ) : (
          <span className="inline-flex items-center gap-1 text-caption text-primary">
            切换
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
          </span>
        )}
      </button>

      {open && !single && (
        <div className="absolute left-0 right-0 top-full bg-card border border-border shadow-lg rounded-xl mt-1 max-h-[60vh] overflow-y-auto">
          <div className="px-4 py-2 text-caption text-text-tertiary border-b border-border">
            共 {FARMS.length} 个牧场 · 切换后全局数据将同步更新
          </div>
          {FARMS.map((f) => {
            const active = f.id === currentId;
            return (
              <button
                key={f.id}
                onClick={() => {
                  setOpen(false);
                  if (f.id === currentId) return;
                  setSwitching("loading");
                  setFarmId(f.id);
                  window.setTimeout(() => setSwitching("done"), 800);
                  window.setTimeout(() => setSwitching(false), 1500);
                }}
                className={`w-full px-4 py-3 flex items-center gap-3 text-left active:bg-surface-subtle ${
                  active ? "bg-brand-subtle/40" : ""
                }`}
              >
                <span
                  className={`h-8 w-8 rounded-lg inline-flex items-center justify-center shrink-0 ${
                    active ? "bg-primary text-primary-foreground" : "bg-surface-subtle text-text-secondary"
                  }`}
                >
                  <MapPin className="h-4 w-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-body text-foreground">{f.name}</div>
                  <div className="text-caption text-text-tertiary truncate">
                    {f.region} · {f.scale}
                  </div>
                </div>
                {active && <Check className="h-4 w-4 text-primary shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
      {switching && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[2147483646] bg-black/45 backdrop-blur-[2px] flex items-start justify-center pt-[35vh] touch-none" style={{ pointerEvents: "auto" }}>
          <div className="h-28 w-28 rounded-2xl bg-card shadow-2xl flex flex-col items-center justify-center gap-3">
            {switching === "loading" ? (
              <>
                <span className="h-8 w-8 rounded-full border-[3px] border-primary/25 border-t-primary animate-spin" />
                <span className="text-caption text-text-secondary">切换牧场中…</span>
              </>
            ) : (
              <>
                <span className="h-8 w-8 rounded-full bg-primary text-primary-foreground inline-flex items-center justify-center">
                  <Check className="h-5 w-5" strokeWidth={3} />
                </span>
                <span className="text-caption text-text-secondary">切换成功</span>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

