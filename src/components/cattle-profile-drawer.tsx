import { useMemo, useRef, useState } from "react";
import {
  Beef,
  MapPin,
  Clock,
  Watch,
  Radio,
  Activity,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  FilePlus2,
  MessageSquareWarning,
  ListChecks,
} from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { markAlertHandled } from "@/lib/alert-store";

/**
 * PC「牛只信息」档案详情抽屉。
 * 字段与操作与小程序端 /m/animals-{id} 保持一致：
 * 基础信息（耳号/牧场/牛舍/品种/类别/月龄/泌乳天数/怀孕天数/胎次）、
 * 休药期、外接设备、近 7 日产奶趋势、诊断 / 用药 / 检测 / 转栏记录，
 * 操作：查看全部工单、异常反馈、记录（产犊 / 基础检查 / 转栏 / 离场）、健康上报。
 */

export type CattleProfile = {
  ear: string;
  farm: string;
  barn: string;
  breed: string;
  sex: string;
  type: string;
  ageDays: number;
  health: "健康" | "观察中" | "异常" | "治疗中" | "死淘";
  withdrawalDays: number;
  withdrawalUntil: string;
  lactationDays: number;
  pregnancyDays: number;
  parity: number;
};

type Device = {
  kind: "collar" | "ear";
  id: string;
  name: string;
  status: "正常" | "异常" | "-";
};

const DEVICES: Device[] = [
  { kind: "collar", id: "D-COL-012", name: "颈环项圈 · Nedap", status: "正常" },
  { kind: "ear", id: "D-EAR-088", name: "耳温设备 · smaXtec", status: "异常" },
];

// 检查数据：各检查项目最近一次结果
const EXAM_DATA: { name: string; result: string; date: string; abnormal?: boolean }[] = [
  { name: "尿液 PH 值", result: "8.2", date: "2026-08-08" },
  { name: "酮病检测", result: "阳性（1.4 mmol/L）", date: "2026-08-07", abnormal: true },
  { name: "孕检", result: "已孕 92 天", date: "2026-07-30" },
  { name: "体温", result: "39.8 ℃", date: "2026-08-10", abnormal: true },
  { name: "子宫分泌物", result: "清亮无异味", date: "2026-08-05" },
];


export function CattleProfileDrawer({
  open,
  onOpenChange,
  cow,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  cow: CattleProfile | null;
}) {
  const [tab, setTab] = useState<"diagnoses" | "meds" | "tests" | "moves" | "events" | "orders" | "screenings">("diagnoses");
  const historyRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);


  const [observed, setObserved] = useState(false);

  if (!cow) return null;

  const health = observed ? "观察中" : cow.health;
  const abnormal = cow.health === "异常" || cow.health === "观察中" || observed;


  const healthCls =
    health === "死淘"
      ? "bg-[#F0F2F4] text-[#64748B]"
      : health === "异常"
      ? "bg-[#FFE4E1] text-[#D9534F]"
      : health === "观察中"
        ? "bg-[#FFF7E6] text-[#B8860B]"
        : health === "治疗中"
          ? "bg-[#FFE8CC] text-[#C9621F]"
          : "bg-[#E8F5E9] text-[#2E7D32]";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[960px] sm:max-w-[960px] p-0 flex flex-col gap-0 bg-[var(--bg-page,var(--background))]"
      >
        {/* 头部：品牌化身份区 */}
        <header className="shrink-0 border-b border-border bg-card">
          <div className="px-7 pt-6 pb-5 bg-[linear-gradient(180deg,var(--brand-subtle,#EFFBF1)_0%,transparent_100%)]">
            <div className="flex items-start gap-4">
              <span className="h-12 w-12 rounded-xl bg-card border border-border text-primary inline-flex items-center justify-center shrink-0 shadow-sm">
                <Beef className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-page-title text-foreground font-mono leading-none">#{cow.ear}</h2>
                  <span className={`h-6 px-2.5 rounded-full inline-flex items-center gap-1.5 text-caption font-medium ${healthCls}`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {health}
                  </span>
                  {abnormal && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-6 px-2 rounded-full text-caption font-normal gap-1 bg-card">
                          <MessageSquareWarning className="h-3.5 w-3.5" />
                          异常反馈
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-36">
                        <DropdownMenuItem
                          onClick={() => {
                            setObserved(true);
                            markAlertHandled(cow.ear);
                            toast.success("已转为观察中，次日 00:00 自动解除");
                          }}
                        >
                          继续观察
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-x-3 gap-y-1 flex-wrap text-body-sm text-text-secondary">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-text-tertiary" />
                    {cow.farm} / {cow.barn}
                  </span>
                  <span className="h-3 w-px bg-border" />
                  <span>{cow.breed}</span>
                  <span className="h-3 w-px bg-border" />
                  <span>{cow.sex}</span>
                  <span className="h-3 w-px bg-border" />
                  <span>{cow.ageDays > 90 ? `${Math.floor(cow.ageDays / 30)} 月龄` : `${cow.ageDays} 日龄`}</span>
                  <span className="h-3 w-px bg-border" />
                  <span>{cow.type}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* 内容 */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-7 py-6 space-y-5">
          {/* 休药期：置顶状态条 */}
          <div
            className={`rounded-xl border px-4 py-3 flex items-center gap-2.5 ${
              cow.withdrawalDays > 0
                ? "border-[#FFCCC7] bg-[#FFF1F0]"
                : "border-[#B7EB8F] bg-[#F6FFED]"
            }`}
          >
            <Clock className={`h-4 w-4 shrink-0 ${cow.withdrawalDays > 0 ? "text-[#CF1322]" : "text-[#389E0D]"}`} />
            <span className={`text-body-sm ${cow.withdrawalDays > 0 ? "text-[#CF1322]" : "text-[#389E0D]"}`}>
              {cow.withdrawalDays > 0
                ? `该牛只处于休药期，至 ${cow.withdrawalUntil} 结束（剩 ${cow.withdrawalDays} 天），期间产奶不可上市。`
                : "该牛只未处于休药期，当前产奶可正常上市。"}
            </span>
          </div>


          {/* 繁育与血统档案 */}
          <Panel title="繁育与档案信息" icon={<ListChecks className="h-4 w-4 text-primary" />} bodyClassName="p-4">
            <div className="grid grid-cols-4 gap-x-6 gap-y-3">
              {breedingFields(cow).map((f) => (
                <div key={f.label} className="flex items-baseline justify-between gap-3 border-b border-border/60 pb-2">
                  <span className="text-body-sm text-text-tertiary shrink-0">{f.label}</span>
                  <span className="text-body-sm text-foreground font-medium tabular-nums truncate">{f.value}</span>
                </div>
              ))}
            </div>
          </Panel>

          <div className="grid grid-cols-2 gap-5 items-stretch">
            {/* 左：产奶数据 */}
            <Panel
              className="h-full min-w-0"
              title="近 7 日产奶数据"
              icon={<Activity className="h-4 w-4 text-primary" />}
              extra={<span className="text-caption text-text-tertiary">单位：kg / 班次</span>}
            >
              <MilkChart />
            </Panel>

            {/* 右：检查数据 */}
            <Panel
              className="h-full min-w-0 flex flex-col"
              title="检查数据"
              icon={<ListChecks className="h-4 w-4 text-primary" />}
              bodyClassName="px-4 py-2 flex-1 flex flex-col"
            >
              <div className="flex flex-1 flex-col">
                {EXAM_DATA.map((e) => (
                  <div
                    key={e.name}
                    className="grid flex-1 grid-cols-[1fr_auto_auto] items-center gap-3 py-2 border-b border-border/70 last:border-0"
                  >
                    <span className="text-body-sm text-text-secondary truncate">{e.name}</span>
                    <span
                      className={`text-body-sm text-right ${e.abnormal ? "text-[#CF1322] font-medium" : "text-foreground font-medium"}`}
                    >
                      {e.result}
                    </span>
                    <span className="text-caption text-text-tertiary tabular-nums w-[86px] text-right">{e.date}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          {/* 外接设备：整宽，置于产奶数据下方 */}
          <Panel title="外接设备" icon={<Watch className="h-4 w-4 text-primary" />} bodyClassName="p-3">
            <div className="grid grid-cols-2 gap-3">
              {DEVICES.map((d) => (
                <div key={d.id} className="rounded-xl bg-muted/50 px-3 py-2.5 flex items-center gap-2.5">
                  <span
                    className={`h-8 w-8 rounded-lg inline-flex items-center justify-center shrink-0 ${
                      d.status === "异常" ? "bg-[#FFF1F0] text-[#CF1322]" : "bg-brand-subtle text-primary"
                    }`}
                  >
                    <Radio className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-body-sm text-foreground truncate">{d.name}</div>
                    <div className="text-caption text-text-tertiary font-mono">{d.id}</div>
                  </div>
                  <span
                    className={
                      d.status === "异常" ? "tag tag-danger" : d.status === "正常" ? "tag tag-success" : "text-body-sm text-text-tertiary"
                    }
                  >
                    {d.status}
                  </span>
                </div>
              ))}
            </div>
          </Panel>



          {/* 历史记录：整宽贯穿 */}
          <div ref={historyRef} className="min-h-[calc(100%-1px)]">
          <Panel title="历史记录" icon={<ListChecks className="h-4 w-4 text-primary" />} bodyClassName="p-4 pt-0">
            <div className="flex items-center gap-6 border-b border-border -mx-4 px-4 overflow-x-auto">

              {[
                { key: "orders" as const, label: "全部工单" },
                { key: "diagnoses" as const, label: "诊断记录" },
                { key: "meds" as const, label: "用药记录" },
                { key: "tests" as const, label: "检测记录" },
                { key: "moves" as const, label: "转栏记录" },
                { key: "events" as const, label: "产犊记录" },
                { key: "screenings" as const, label: "排查记录" },
              ].map((t) => {
                const active = tab === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => {
                      setTab(t.key);
                      const sc = scrollRef.current;
                      const el = historyRef.current;
                      if (sc && el) {
                        sc.scrollTo({ top: el.offsetTop - sc.offsetTop, behavior: "smooth" });
                      }
                    }}

                    className={`relative h-11 shrink-0 text-body-sm transition-colors ${
                      active ? "text-primary font-medium" : "text-text-secondary hover:text-foreground"
                    }`}
                  >
                    {t.label}
                    {active && <span className="absolute left-0 right-0 bottom-0 h-[2px] rounded-full bg-primary" />}
                  </button>
                );
              })}
            </div>

            <div className="pt-4">
              {tab === "meds" ? (
                <MedicationHistory />
              ) : tab === "diagnoses" ? (
                <DiagnosisHistory />
              ) : tab === "tests" ? (
                <TestHistory />
              ) : tab === "events" ? (
                <EventHistory />
              ) : tab === "orders" ? (
                <OrderHistory />
              ) : tab === "screenings" ? (
                <ScreeningHistory />
              ) : (
                <MoveHistory />
              )}
            </div>
          </Panel>
          </div>

        </div>
      </SheetContent>
    </Sheet>
  );
}

/** 繁育与血统档案字段（mock，按耳号派生保持稳定） */
function breedingFields(cow: CattleProfile): { label: string; value: string }[] {
  const seed = Number(cow.ear.replace(/\D/g, "").slice(-4) || 0);
  const pick = (n: number, mod: number, base = 0) => base + ((seed + n) % mod);
  const dateAgo = (days: number) => {
    const d = new Date(Date.now() - days * 86400000);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const female = cow.sex === "母" || cow.sex === "♀";
  const lactating = female && cow.lactationDays > 0;
  const bred = female && cow.pregnancyDays > 0;
  const farmNo = cow.ear.slice(0, 2);
  return [
    { label: "泌乳天数", value: lactating ? `${cow.lactationDays} 天` : "—" },
    { label: "怀孕天数", value: bred ? `${cow.pregnancyDays} 天` : "—" },
    { label: "胎次", value: `${cow.parity} 胎` },
    { label: "出生体重", value: `${(38 + pick(1, 8)).toFixed(0)} kg` },
    { label: "母号", value: `${farmNo}-${18 + pick(2, 5)}-${String(pick(3, 9999)).padStart(4, "0")}` },
    { label: "父号", value: `USA-${1000000 + pick(4, 900000)}` },
    { label: "入群来源", value: pick(5, 3) === 0 ? "本场出生" : pick(5, 3) === 1 ? "外购引进" : "牧场调入" },
    { label: "产后天数", value: lactating ? `${cow.lactationDays} 天` : "—" },
    { label: "配后天数", value: bred ? `${cow.pregnancyDays} 天` : "—" },
    { label: "配次", value: female ? `${1 + pick(6, 4)} 次` : "—" },
    { label: "流产天数", value: female && pick(7, 4) === 0 ? `${pick(8, 90, 10)} 天` : "—" },
    { label: "产犊日期", value: cow.parity > 0 ? dateAgo(cow.lactationDays || 200) : "—" },
    { label: "最近配种日期", value: bred ? dateAgo(cow.pregnancyDays) : "—" },
    { label: "最近围产日期", value: cow.parity > 0 ? dateAgo((cow.lactationDays || 200) + 21) : "—" },
    { label: "干奶日期", value: cow.parity > 0 ? dateAgo((cow.lactationDays || 200) + 60) : "—" },
    { label: "最近流产日期", value: female && pick(7, 4) === 0 ? dateAgo(pick(9, 300, 60)) : "—" },
  ];
}


function Panel({
  title,
  icon,
  extra,
  children,
  bodyClassName = "",
  className = "",
}: {
  title: string;
  icon?: React.ReactNode;
  extra?: React.ReactNode;
  children: React.ReactNode;
  bodyClassName?: string;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-border bg-card shadow-[0_1px_2px_rgba(16,24,40,0.04)] ${className}`}>

      <div className="flex items-center justify-between px-4 h-12 border-b border-border">
        <h3 className="text-card-title text-foreground inline-flex items-center gap-1.5">
          {icon}
          {title}
        </h3>
        {extra}
      </div>
      <div className={bodyClassName || "p-4"}>{children}</div>
    </section>
  );
}


/* ---------------- 产奶趋势 ---------------- */
function MilkChart() {
  const days = ["05-23", "05-24", "05-25", "05-26", "05-27", "05-28", "05-29"];
  const shiftMeta = ["早班", "中班", "晚班"];
  const raw = [
    [12.1, 10.8, 9.5],
    [12.4, 11.0, 9.7],
    [12.0, 10.5, 9.2],
    [12.5, 10.9, 9.6],
    [12.8, 11.2, 9.9],
    [12.3, 10.7, 9.4],
    [12.6, 11.1, 9.8],
  ];
  const totals = raw.map((d) => d.reduce((a, b) => a + b, 0));
  const avg = totals.reduce((a, b) => a + b, 0) / totals.length;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-body-sm">
        <thead>
          <tr className="text-text-tertiary text-caption">
            <th className="text-left font-normal py-2 pr-3">日期</th>
            {shiftMeta.map((s) => (
              <th key={s} className="text-right font-normal py-2 px-3">
                {s}
              </th>
            ))}
            <th className="text-right font-normal py-2 pl-3">日合计</th>
            <th className="text-right font-normal py-2 pl-3">较均值</th>
          </tr>
        </thead>
        <tbody>
          {days.map((d, i) => {
            const diff = totals[i] - avg;
            return (
              <tr key={d} className="border-t border-border">
                <td className="py-2 pr-3 text-foreground">{d}</td>
                {raw[i].map((v, si) => (
                  <td key={si} className="py-2 px-3 text-right tabular-nums text-text-secondary">
                    {v.toFixed(1)}
                  </td>
                ))}
                <td className="py-2 pl-3 text-right tabular-nums font-medium text-foreground">
                  {totals[i].toFixed(1)}
                </td>
                <td
                  className={`py-2 pl-3 text-right tabular-nums ${
                    diff >= 0 ? "text-primary" : "text-[#CF1322]"
                  }`}
                >
                  {diff >= 0 ? "+" : ""}
                  {diff.toFixed(1)}
                </td>
              </tr>
            );
          })}
          <tr className="border-t border-border bg-muted/40">
            <td className="py-2 pr-3 text-text-secondary">7 日均值</td>
            {shiftMeta.map((_, si) => (
              <td key={si} className="py-2 px-3 text-right tabular-nums text-text-secondary">
                {(raw.reduce((a, d) => a + d[si], 0) / raw.length).toFixed(1)}
              </td>
            ))}
            <td className="py-2 pl-3 text-right tabular-nums font-medium text-foreground">{avg.toFixed(1)}</td>
            <td className="py-2 pl-3" />
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- 记录列表（与小程序一致的 mock） ---------------- */
type MedRecord = { id: string; date: string; drug: string; manufacturer: string; dose: string };
const ALL_MEDS: MedRecord[] = [
  { id: "M-0518-1", date: "2026-05-18", drug: "氟尼辛葡甲胺注射液", manufacturer: "齐鲁动保", dose: "2ml · 肌肉注射" },
  { id: "M-0518-2", date: "2026-05-18", drug: "头孢噻呋钠", manufacturer: "瑞普生物", dose: "1g · 肌肉注射" },
  { id: "M-0519-1", date: "2026-05-19", drug: "头孢噻呋钠", manufacturer: "瑞普生物", dose: "1g · 肌肉注射" },
  { id: "M-0520-1", date: "2026-05-20", drug: "头孢噻呋钠", manufacturer: "瑞普生物", dose: "1g · 肌肉注射" },
  { id: "M-0510-1", date: "2026-05-10", drug: "维生素 B 复合注射液", manufacturer: "上海同仁", dose: "10ml · 肌肉注射" },
  { id: "M-0421", date: "2026-04-21", drug: "伊维菌素注射液", manufacturer: "中牧股份", dose: "1ml / 50kg · 皮下注射" },
  { id: "M-0315", date: "2026-03-15", drug: "青霉素 G 钾", manufacturer: "华北制药", dose: "400 万 IU · 肌肉注射" },
  { id: "M-0118", date: "2026-01-18", drug: "口蹄疫疫苗", manufacturer: "中农威特", dose: "2ml · 颈部皮下" },
];
const TODAY = new Date("2026-05-29");

function MedicationHistory() {
  const { visible, totalCount } = useMemo(() => {
    const sorted = [...ALL_MEDS].sort((a, b) => (a.date < b.date ? 1 : -1));
    return { visible: sorted, totalCount: sorted.length };
  }, []);
  const groups = useMemo(() => {
    const map = new Map<string, MedRecord[]>();
    for (const m of visible) {
      if (!map.has(m.date)) map.set(m.date, []);
      map.get(m.date)!.push(m);
    }
    return Array.from(map.entries());
  }, [visible]);

  return (
    <div>
      <div className="text-caption text-text-tertiary mb-2">全部 {totalCount} 条</div>

      <div className="relative pl-4">
        <span className="absolute left-[5px] top-1.5 bottom-1.5 w-px bg-border" />
        <div className="space-y-4">
          {groups.map(([date, items]) => (
            <div key={date} className="relative">
              <span className="absolute -left-4 top-1.5 h-[7px] w-[7px] rounded-full bg-primary ring-2 ring-background" />
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-mono text-caption text-text-secondary">{date}</span>
                <span className="text-caption text-text-tertiary">· {items.length} 条</span>
              </div>
              <div className="space-y-1.5">
                {items.map((m) => (
                  <div key={m.id} className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
                    <div className="text-body-sm text-foreground truncate">{m.drug}</div>
                    <div className="text-caption text-text-tertiary truncate text-center">{m.manufacturer}</div>
                    <div className="text-caption text-text-secondary truncate text-right">{m.dose}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

type DiagnosisRecord = { id: string; date: string; disease: string; doctor: string };
const ALL_DIAGNOSES: DiagnosisRecord[] = [
  { id: "DX-0518", date: "2026-05-18", disease: "急性乳房炎", doctor: "李雨晴" },
  { id: "DX-0405", date: "2026-04-05", disease: "蹄叶炎", doctor: "李雨晴" },
  { id: "DX-0312", date: "2026-03-12", disease: "瘤胃酸中毒", doctor: "周凯" },
  { id: "DX-0125", date: "2026-01-25", disease: "产后子宫炎", doctor: "王场长" },
];

function DiagnosisHistory() {
  return (
    <div>
      <div className="text-caption text-text-tertiary mb-2">共 {ALL_DIAGNOSES.length} 条</div>
      <div className="relative pl-4">
        <span className="absolute left-[5px] top-1.5 bottom-1.5 w-px bg-border" />
        <div className="space-y-4">
          {ALL_DIAGNOSES.map((d) => (
            <div key={d.id} className="relative">
              <span className="absolute -left-4 top-1.5 h-[7px] w-[7px] rounded-full bg-primary ring-2 ring-background" />
              <div className="font-mono text-caption text-text-secondary mb-1">{d.date}</div>
              <div className="flex items-center justify-between gap-3">
                <span className="truncate text-body-sm text-foreground">{d.disease}</span>
                <span className="shrink-0 text-caption text-text-tertiary">诊断人：{d.doctor}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

type TestRecord = { id: string; date: string; item: string; conclusion: "阴性" | "阳性" | "合格" | "不合格"; submitter: string };
const ALL_TESTS: TestRecord[] = [
  { id: "T-0620", date: "2026-06-20", item: "生鲜乳体细胞检测", conclusion: "合格", submitter: "李雨晴" },
  { id: "T-0605", date: "2026-06-05", item: "布病抗体筛查", conclusion: "阴性", submitter: "周凯" },
  { id: "T-0512", date: "2026-05-12", item: "结核病检测", conclusion: "阴性", submitter: "王场长" },
  { id: "T-0418", date: "2026-04-18", item: "乳房炎病原培养", conclusion: "阳性", submitter: "李雨晴" },
];

function TestHistory() {
  const tone = (c: TestRecord["conclusion"]) =>
    c === "阳性" || c === "不合格" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600";
  return (
    <div>
      <div className="text-caption text-text-tertiary mb-1">共 {ALL_TESTS.length} 条</div>
      <div className="rounded-xl border border-border bg-card divide-y divide-border">
        {ALL_TESTS.map((t) => (
          <div key={t.id} className="px-3 py-2.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="shrink-0 font-mono text-caption text-text-secondary">{t.date}</span>
                <span className="truncate text-body-sm text-foreground">{t.item}</span>
              </div>
              <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-caption ${tone(t.conclusion)}`}>{t.conclusion}</span>
            </div>
            <div className="mt-1 text-caption text-text-tertiary">提交人 {t.submitter}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

type MoveRecord = { id: string; date: string; from: string; to: string; orderId: string | null; reason: string; operator: string };
const ALL_MOVES: MoveRecord[] = [
  { id: "MV-0518", date: "2026-05-18", from: "1 号牛舍", to: "3 号牛舍", orderId: "WO-2026-0518", reason: "疾病治疗", operator: "李雨晴" },
  { id: "MV-0410", date: "2026-04-10", from: "隔离舍", to: "1 号牛舍", orderId: "WO-2026-0405", reason: "治愈", operator: "李雨晴" },
  { id: "MV-0320", date: "2026-03-20", from: "1 号牛舍", to: "隔离舍", orderId: "WO-2026-0318", reason: "继续观察", operator: "李雨晴" },
  { id: "MV-0301", date: "2026-03-01", from: "犊牛舍", to: "1 号牛舍", orderId: null, reason: "调群", operator: "王场长" },
  { id: "MV-0101", date: "2026-01-10", from: "产房", to: "犊牛舍", orderId: null, reason: "断奶分群", operator: "周凯" },
];

function MoveHistory() {
  return (
    <div className="space-y-2">
      <div className="text-caption text-text-tertiary mb-1">共 {ALL_MOVES.length} 条</div>
      {ALL_MOVES.map((m) => (
        <div key={m.id} className="rounded-xl border border-border bg-card p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-caption text-text-secondary">{m.date}</span>
            <span className="text-caption text-text-tertiary">· 操作人 {m.operator}</span>
          </div>
          <div className="flex items-center gap-2 text-body-sm text-foreground">
            <span className="flex-1 min-w-0 truncate">{m.from}</span>
            <ArrowRight className="h-3.5 w-3.5 text-text-tertiary shrink-0" />
            <span className="flex-1 min-w-0 truncate text-right">{m.to}</span>
          </div>
          <div className="text-caption text-text-tertiary mt-1 flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <span>原因</span>
              <span className="text-foreground">{m.reason}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span>工单</span>
              <span className="font-mono text-primary">{m.orderId ?? "-"}</span>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

/** 产犊记录：字段与小程序「记录产犊事件」表单完全一致，不额外增加字段 */
type CalvingRecord = {
  calvingTime: string;
  /** 产犊难易度评分 0-4 */
  difficulty: number;
  difficultyText: string;
  /** 产道损伤等级 0-3 */
  injury: number;
  injuryText: string;
  colostrum: {
    use: string;
    quality: string;
    code: string;
    bag: string;
    volume: string;
    brix: string;
  };
  calves: {
    tag: string;
    status: string;
    breed?: string;
    sex?: string;
    weight?: string;
    colostrumCode?: string;
    feedVolume?: string;
    technician?: string;
    keep?: string;
    barn?: string;
    reason?: string;
  }[];
};

const ALL_EVENTS: CalvingRecord[] = [
  {
    calvingTime: "2026-07-30 06:10",
    difficulty: 1,
    difficultyText: "自然分娩",
    injury: 0,
    injuryText: "无损伤",
    colostrum: { use: "饲喂", quality: "优质", code: "CL-20260730-01", bag: "A-12", volume: "5.2 L", brix: "24.5%" },
    calves: [
      {
        tag: "01-26-0731",
        status: "活犊",
        breed: "荷斯坦",
        sex: "母",
        weight: "41.5 kg",
        colostrumCode: "CL-20260730-01",
        feedVolume: "4.0 L",
        technician: "李技术员",
        keep: "留养",
        barn: "犊牛舍 1 号",
      },
    ],
  },
  {
    calvingTime: "2025-08-14 23:40",
    difficulty: 2,
    difficultyText: "轻度助产",
    injury: 1,
    injuryText: "轻度损伤",
    colostrum: { use: "冻存", quality: "合格", code: "CL-20250814-03", bag: "B-05", volume: "4.6 L", brix: "22.1%" },
    calves: [
      {
        tag: "01-25-0815",
        status: "活犊",
        breed: "荷斯坦",
        sex: "公",
        weight: "44.0 kg",
        colostrumCode: "CL-20250814-03",
        feedVolume: "4.0 L",
        technician: "李技术员",
        keep: "不留养",
        reason: "经济价值低",
      },
    ],
  },
];

function KV({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="min-w-0">
      <div className="text-caption text-text-tertiary">{label}</div>
      <div className="text-body-sm text-foreground truncate">{value}</div>
    </div>
  );
}

/** 与小程序评分选择器一致的圆点评分展示 */
function ScorePips({
  label,
  min = 0,
  max,
  value,
  text,
  danger,
}: {
  label: string;
  min?: number;
  max: number;
  value: number;
  text?: string;
  danger?: boolean;
}) {
  const items: number[] = [];
  for (let i = min; i <= max; i++) items.push(i);
  return (
    <div className="min-w-0">
      <div className="text-caption text-text-tertiary mb-1.5">{label}</div>
      <div className="flex items-center gap-1.5">
        {items.map((n) => {
          const active = n === value;
          return (
            <span
              key={n}
              className={`h-7 w-7 shrink-0 rounded-full inline-flex items-center justify-center text-caption tabular-nums ${
                active
                  ? danger
                    ? "bg-[#CF1322] text-white font-medium"
                    : "bg-primary text-primary-foreground font-medium"
                  : "border border-border bg-card text-text-tertiary"
              }`}
            >
              {n}
            </span>
          );
        })}
        {text && <span className="ml-2 text-body-sm text-foreground truncate">{text}</span>}
      </div>
    </div>
  );
}

function EventHistory() {
  return (
    <div className="space-y-3">
      <div className="text-caption text-text-tertiary">共 {ALL_EVENTS.length} 条</div>
      {ALL_EVENTS.map((e) => (
        <div key={e.calvingTime} className="rounded-xl border border-border bg-card overflow-hidden">
          {/* 头部：产犊时间 + 评分图形 */}
          <div className="px-4 py-3 bg-muted/40 border-b border-border flex flex-wrap items-end gap-x-8 gap-y-3">
            <KV label="产犊时间" value={e.calvingTime} />
            <ScorePips label="产犊难易度评分" max={4} value={e.difficulty} text={e.difficultyText} />
            <ScorePips
              label="产道损伤等级"
              max={3}
              value={e.injury}
              text={e.injuryText}
              danger={e.injury > 0}
            />
          </div>

          <div className="p-4 space-y-4">
            {/* 初乳采集 */}
            <section>
              <div className="flex items-center gap-2 mb-2.5">
                <span className="text-body-sm font-medium text-foreground">初乳采集</span>
                <span className="tag tag-brand">{e.colostrum.quality}</span>
                <span className="tag tag-muted">{e.colostrum.use}</span>
                <span className="ml-auto font-mono text-caption text-text-secondary">{e.colostrum.code}</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <KV label="初乳量" value={e.colostrum.volume} />
                <KV label="白力度" value={e.colostrum.brix} />
                <KV label="袋号" value={e.colostrum.bag} />
              </div>
            </section>

            {/* 犊牛 */}
            {e.calves.map((c, i) => (
              <section key={i} className={i > 0 ? "pt-3 border-t border-border/70" : ""}>
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="text-body-sm font-medium text-foreground">犊牛 {i + 1}</span>
                  <span className="font-mono text-body-sm text-primary">#{c.tag}</span>
                  <span className="tag tag-success">{c.status}</span>
                  {c.sex && <span className="tag tag-muted">{c.sex}</span>}
                  <span className={`ml-auto tag ${c.keep === "留养" ? "tag-brand" : "tag-pink"}`}>{c.keep}</span>
                </div>
                <div className="grid grid-cols-3 gap-x-4 gap-y-2">
                  <KV label="品种" value={c.breed} />
                  <KV label="犊牛体重" value={c.weight} />
                  <KV label="技术员" value={c.technician} />
                  <KV label="初乳编码" value={c.colostrumCode} />
                  <KV label="初乳饲喂量" value={c.feedVolume} />
                  <KV label={c.keep === "留养" ? "转入牛舍" : "不留养原因"} value={c.barn ?? c.reason} />
                </div>
              </section>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}




const ALL_ORDERS: {
  id: string;
  date: string;
  attr: "初诊" | "复诊";
  disease: string;
  status: "已完成" | "执行中" | "待执行";
  executor: string;
}[] = [
  { id: "WO-20260808-021", date: "2026-08-08", attr: "复诊", disease: "临床型乳房炎", status: "执行中", executor: "王兽医" },
  { id: "WO-20260805-014", date: "2026-08-05", attr: "初诊", disease: "临床型乳房炎", status: "已完成", executor: "王兽医 / 李技术员" },
  { id: "WO-20260730-018", date: "2026-07-30", attr: "初诊", disease: "产后护理（正常）", status: "已完成", executor: "李技术员" },
  { id: "WO-20260712-006", date: "2026-07-12", attr: "初诊", disease: "转群检查", status: "已完成", executor: "张场长" },
];

function OrderHistory() {
  return (
    <div className="space-y-2">
      <div className="text-caption text-text-tertiary mb-1">共 {ALL_ORDERS.length} 条</div>
      {ALL_ORDERS.map((o) => (
        <div key={o.id} className="rounded-xl border border-border bg-card p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={o.attr === "复诊" ? "tag tag-muted" : "tag tag-brand"}>{o.attr}</span>
            <span className="font-mono text-caption text-text-secondary">{o.id}</span>
            <span className="text-caption text-text-tertiary">· {o.date}</span>
            <span className="ml-auto text-caption text-text-secondary">{o.status}</span>
          </div>
          <div className="text-body-sm text-foreground">{o.disease}</div>
          <div className="text-caption text-text-tertiary mt-1">执行人 {o.executor}</div>
        </div>
      ))}
    </div>
  );
}
