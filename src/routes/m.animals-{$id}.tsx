import { createFileRoute, Link, useParams, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useRef, useEffect } from "react";
import {
  Beef,
  ClipboardPlus,
  ChevronDown,
  Clock,
  MapPin,
  ArrowRight,
  ArrowRightLeft,
  ChevronRight,
  X,
  Activity,
  Radio,
  Watch,
  FilePlus2,
  Baby,
  LogOut,
  Stethoscope,
  MessageSquareWarning,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { markAlertHandled } from "@/lib/alert-store";
import { MobileShell } from "@/components/mobile-shell";
import { cowStatusOf, locateCow } from "@/lib/cow-status";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";



export const Route = createFileRoute("/m/animals-{$id}")({
  head: () => ({ meta: [{ title: "牛只详情 · 奇点智牧" }] }),
  component: AnimalDetailPage,
});

type Device = {
  kind: "collar" | "ear";
  id: string;
  name: string;
  status: "正常" | "异常" | "离线";
  alertText?: string;
};

function AnimalDetailPage() {
  const { id } = useParams({ from: "/m/animals-{$id}" });
  const navigate = useNavigate();

  const baseStatus = cowStatusOf(id);
  const isLeft = baseStatus === "死淘";
  const { barnIdx } = locateCow(id);

  const a = {
    id,
    farm: "1 号牧场",
    barn: isLeft ? "—（已离场）" : `${barnIdx} 号牛舍`,

    breed: "荷斯坦",
    sex: "母",
    type: "哺乳牛",
    ageDays: 1218,
    health: baseStatus as "健康" | "观察中" | "异常" | "治疗中" | "死淘",
    withdrawalDays: baseStatus === "治疗中" ? 3 : 0,
    withdrawalUntil: "2026-05-28",
    lactationDays: isLeft ? 0 : 168,
    pregnancyDays: isLeft ? 0 : 92,
    parity: 3,
  };

  const devices: Device[] = isLeft
    ? []
    : baseStatus === "异常"
      ? [
          { kind: "collar", id: "D-COL-012", name: "颈环项圈 · Nedap", status: "正常" },
          { kind: "ear", id: "D-EAR-088", name: "耳温设备 · smaXtec", status: "异常", alertText: "耳部温度偏高 39.8℃" },
        ]
      : [
          { kind: "collar", id: "D-COL-012", name: "颈环项圈 · Nedap", status: "正常" },
          { kind: "ear", id: "D-EAR-088", name: "耳温设备 · smaXtec", status: "正常" },
        ];

  // 强制"观察中"（至次日 00:00 解除）
  const obsKey = `cow-observe-${id}`;
  const [observeUntil, setObserveUntil] = useState<number | null>(null);
  useEffect(() => {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(obsKey) : null;
    const ts = raw ? Number(raw) : 0;
    if (ts && ts > Date.now()) setObserveUntil(ts);
    else if (raw) window.localStorage.removeItem(obsKey);
  }, [obsKey]);

  const observing = !isLeft && observeUntil != null && observeUntil > Date.now();
  const abnormal = a.health === "异常";
  if (observing) a.health = "观察中";


  const [feedbackOpen, setFeedbackOpen] = useState(false);


  const [recordOpen, setRecordOpen] = useState(false);






  const [tab, setTab] = useState<"diagnoses" | "meds" | "moves" | "tests">("diagnoses");

  const ageLabel = a.ageDays > 90 ? `${Math.floor(a.ageDays / 30)} 月龄` : `${a.ageDays} 日龄`;

  // 滚动到基础信息离开视窗时，标题显示耳号 + 牧场 + 牛舍
  const infoEndRef = useRef<HTMLDivElement>(null);
  const [showTitleId, setShowTitleId] = useState(false);
  useEffect(() => {
    const el = infoEndRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setShowTitleId(!entry.isIntersecting),
      { root: null, threshold: 0, rootMargin: "-48px 0px 0px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <MobileShell
      title={
        showTitleId ? (
          <div className="leading-tight">
            <div className="text-body font-semibold truncate">#{a.id}</div>
            <div className="text-caption opacity-80 truncate">{a.farm} · {a.barn}</div>
          </div>
        ) : ""
      }
      back
      hideTabBar
      headerTone="brand"
    >
      <div className="pb-28">
        {/* 头部 */}
        <div className="-mt-px">
          <div className={`rounded-b-3xl px-5 pt-2 pb-5 text-primary-foreground relative overflow-hidden shadow-lg ${isLeft ? "bg-gradient-to-b from-[#7A8899] to-[#5A6675] shadow-black/10" : "bg-gradient-to-b from-primary to-[#00823F] shadow-primary/20"}`}>
            <Beef className="absolute -right-6 -bottom-6 h-36 w-36 opacity-[0.08]" strokeWidth={1} />

            {/* 标题行 */}
            <div className="relative flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-[26px] font-mono font-semibold leading-none tracking-tight">
                  #{a.id}
                </div>
                <div className="mt-2 inline-flex items-center gap-1 text-caption opacity-90">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{a.farm} · {a.barn}</span>
                </div>
              </div>
              <div className="shrink-0 inline-flex items-center gap-1.5">
                <span
                  className={`h-6 px-2 rounded-full inline-flex items-center gap-1 text-[11px] font-semibold ${
                    a.health === "死淘"
                      ? "bg-[#F0F2F4] text-[#64748B]"
                      : a.health === "异常"
                      ? "bg-[#FFE4E1] text-[#D9534F]"
                      : a.health === "观察中"
                      ? "bg-[#FFF7E6] text-[#B8860B]"
                      : a.health === "治疗中"
                      ? "bg-[#E6F7FE] text-[#22ACEB]"
                      : "bg-[#E8F5E9] text-[#2E7D32]"
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                  {a.health}
                </span>
                {(abnormal || observing) && (
                  <button
                    type="button"
                    aria-label="异常反馈"
                    onClick={() => setFeedbackOpen(true)}
                    className="h-6 w-6 rounded-full bg-white/20 border border-white/25 inline-flex items-center justify-center active:scale-95 transition-transform"
                  >
                    <MessageSquareWarning className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

            </div>

            {/* 基础信息 */}
            <div className="relative mt-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 divide-y divide-white/10">
              <div className="grid grid-cols-3 divide-x divide-white/10">
                <HeaderInfo label="品种" value={a.breed} />
                <HeaderInfo label="类别" value={a.type} />
                <HeaderInfo label={a.ageDays > 90 ? "月龄" : "日龄"} value={ageLabel} />
            </div>
            <div ref={infoEndRef} />
              <div className="grid grid-cols-3 divide-x divide-white/10">
                <HeaderInfo label="泌乳天数" value={`${a.lactationDays} 天`} />
                <HeaderInfo label="怀孕天数" value={a.pregnancyDays > 0 ? `${a.pregnancyDays} 天` : "—"} />
                <HeaderInfo label="胎次" value={`${a.parity} 胎`} />
              </div>
            </div>

            {/* 全部工单 */}
            <Link
              to="/m/animals-orders/$id"
              params={{ id: a.id }}
              className="relative mt-3 flex items-center justify-center gap-1 h-9 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 text-body-sm font-medium text-primary-foreground active:bg-white/25"
            >
              查看全部工单
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>


        {/* 休药期 */}
        {a.withdrawalDays > 0 && a.health !== "治疗中" && (
          <section className="px-4 mt-3">
            <div className="bg-[#FFF1F0] border border-[#FFA39E] rounded-lg px-3 py-2 inline-flex items-center justify-between w-full">
              <span className="inline-flex items-center gap-1.5 text-body-sm font-medium text-[#CF1322] min-w-0">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">休药期至 {a.withdrawalUntil}</span>
              </span>
              <span className="ml-2 shrink-0 bg-[#FF4D4F] text-white text-caption px-1.5 py-0.5 rounded-full font-bold">
                剩 {a.withdrawalDays} 天
              </span>
            </div>
          </section>
        )}

        {/* 外接设备 */}

        {!isLeft && (
        <section className="px-4 mt-4">

          <div className="flex items-center justify-between mb-2">
            <h3 className="text-card-title text-foreground inline-flex items-center gap-1.5">
              <Watch className="h-4 w-4 text-primary" />
              外接设备
            </h3>
            {devices.length > 0 && (
              <Link
                to="/m/animals-device/$id"
                params={{ id: a.id }}
                className="text-caption text-primary inline-flex items-center gap-0.5 active:opacity-70"
              >
                查看全部
                <ChevronRight className="h-3 w-3" />
              </Link>
            )}
          </div>

          {devices.length === 0 ? (
            <div className="rounded-xl bg-card border border-dashed border-border p-5 text-center text-caption text-text-tertiary">
              暂无外接设备
            </div>
          ) : (
            <div className="space-y-2">
              {devices.map((d) => (
                <Link
                  key={d.id}
                  to="/m/animals-device/$id"
                  params={{ id: a.id }}
                  search={{ kind: d.kind }}
                  className="block rounded-xl bg-card border border-border p-3 active:bg-surface-subtle"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`h-9 w-9 rounded-lg inline-flex items-center justify-center shrink-0 ${
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
                        d.status === "异常"
                          ? "tag tag-danger"
                          : d.status === "离线"
                          ? "tag tag-warning"
                          : "tag tag-success"
                      }
                    >
                      {d.status}
                    </span>
                    <ChevronRight className="h-4 w-4 text-text-tertiary shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          )}

        </section>
        )}


        {/* 近7日产奶数据 */}
        {!isLeft && (
          <section className="px-4 mt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-card-title text-foreground inline-flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-primary" />
                产奶数据
              </h3>
              <span className="text-caption text-text-tertiary">最近7天</span>
            </div>
            <div className="rounded-2xl bg-card border border-border p-4">
              <MilkChart />
            </div>
          </section>
        )}



        {/* Tabs */}
        <section className="px-4 mt-5">
          <div className="flex items-center gap-6 border-b border-border">
            {[
              { key: "diagnoses" as const, label: "诊断记录" },
              { key: "meds" as const, label: "用药记录" },
              { key: "tests" as const, label: "检测记录" },
              { key: "moves" as const, label: "转栏记录" },
            ].map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`relative h-10 text-body-sm font-medium transition-colors ${
                    active ? "text-foreground" : "text-text-tertiary"
                  }`}
                >
                  {t.label}
                  {active && (
                    <span className="absolute left-1/2 -translate-x-1/2 bottom-0 h-[2px] w-6 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-3">
            {tab === "meds" ? <MedicationHistory /> : tab === "diagnoses" ? <DiagnosisHistory /> : tab === "tests" ? <TestHistory /> : <MoveHistory />}
          </div>
        </section>
      </div>

      {/* 底部：记录 + 健康上报（离场牛只不展示） */}
      {!isLeft && (
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] bg-card/85 backdrop-blur-lg border-t border-border p-3 pb-[calc(env(safe-area-inset-bottom)+12px)] shadow-[0_-8px_30px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setRecordOpen(true)}
            className="h-12 px-4 rounded-2xl bg-brand-subtle text-primary text-body font-semibold inline-flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform"
          >
            <FilePlus2 className="h-4 w-4" /> 记录
          </button>
          <Link
            to="/m/report"
            search={{ target: a.id, barn: a.barn, lock: 1 } as never}
            className="flex-1 h-12 rounded-2xl bg-primary text-primary-foreground text-body font-semibold inline-flex items-center justify-center gap-1.5 shadow-lg shadow-primary/30 active:scale-[0.98] transition-transform"
          >
            <ClipboardPlus className="h-4 w-4" /> 健康上报
          </Link>
        </div>
      </div>
      )}


      {/* 记录选择 Sheet */}
      {recordOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center"
          onClick={() => setRecordOpen(false)}
        >
          <div
            className="w-full max-w-[440px] bg-card rounded-t-2xl pb-[calc(env(safe-area-inset-bottom)+16px)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 h-12 flex items-center justify-between border-b border-border">
              <div className="text-body font-medium text-foreground inline-flex items-center gap-1.5">
                <FilePlus2 className="h-4 w-4 text-primary" />
                记录事件
              </div>
              <button
                type="button"
                onClick={() => setRecordOpen(false)}
                className="h-8 w-8 -mr-2 inline-flex items-center justify-center text-text-tertiary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-3 space-y-2">
              <RecordOption
                icon={<Baby className="h-5 w-5" />}
                title="产犊记录"
                desc="记录本次分娩情况：犊牛、难产、产后处置"
                onClick={() => {
                  setRecordOpen(false);
                  navigate({ to: "/m/events/$type/$id", params: { type: "calving", id: a.id } });
                }}
              />
              <RecordOption
                icon={<Stethoscope className="h-5 w-5" />}
                title="基础检查"
                desc="体温、子宫分泌物、酮病、尿液 PH、孕检"
                onClick={() => {
                  setRecordOpen(false);
                  navigate({ to: "/m/events/$type/$id", params: { type: "exam", id: a.id } });
                }}
              />
              <RecordOption
                icon={<ArrowRightLeft className="h-5 w-5" />}
                title="转栏/转群"
                desc="调整所在牛舍 / 栏位"
                onClick={() => {
                  setRecordOpen(false);
                  navigate({ to: "/m/events/$type/$id", params: { type: "transfer", id: a.id } });
                }}
              />
              <RecordOption
                icon={<LogOut className="h-5 w-5" />}
                title="离场记录"
                desc="淘汰、死亡、出售等离场事件"
                onClick={() => {
                  setRecordOpen(false);
                  navigate({ to: "/m/events/$type/$id", params: { type: "leave", id: a.id } });
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 异常反馈弹窗 */}
      {feedbackOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-8"
          onClick={() => setFeedbackOpen(false)}
        >
          <div
            className="w-full max-w-[340px] bg-card rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 pt-5 pb-4 text-center space-y-2">
              <div className="mx-auto h-11 w-11 rounded-full bg-[#FFF7E6] text-[#B8860B] inline-flex items-center justify-center">
                <MessageSquareWarning className="h-5 w-5" />
              </div>
              <div className="text-section text-foreground">牛只是否需要报病治疗？</div>
              <div className="text-caption text-text-tertiary">
                #{a.id} 当前存在异常预警
                {observing && observeUntil
                  ? `，已标记为观察中（${new Date(observeUntil).toLocaleDateString("zh-CN")} 00:00 解除）`
                  : ""}
              </div>
            </div>
            <div className="p-3 pt-0 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setFeedbackOpen(false);
                  navigate({ to: "/m/animals-evidence/$id", params: { id } });
                }}
                className="h-11 rounded-xl border border-border text-body-sm text-text-secondary bg-card active:bg-surface-subtle"
              >
                无需治疗
              </button>
              <button
                type="button"
                onClick={() => {
                  markAlertHandled(a.id); // 异常排查任务当天从今日任务列表清除
                  setFeedbackOpen(false);
                  navigate({
                    to: "/m/report",
                    search: { target: a.id, barn: a.barn, lock: 1 } as never,
                  });
                }}
                className="h-11 rounded-xl bg-primary text-primary-foreground text-body-sm font-medium"
              >
                健康上报
              </button>
            </div>
          </div>
        </div>
      )}

    </MobileShell>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] leading-tight text-text-tertiary">{label}</div>
      <div className="text-body-sm text-foreground truncate mt-0.5">{value}</div>
    </div>
  );
}

function HeaderInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 px-3 py-2.5">
      <div className="text-caption opacity-75">{label}</div>
      <div className="text-body font-semibold truncate mt-1">{value}</div>
    </div>
  );
}


function RecordOption({
  icon,
  title,
  desc,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 w-full rounded-xl p-3 active:bg-surface-subtle text-left"
    >
      <span className="h-10 w-10 rounded-xl bg-brand-subtle text-primary inline-flex items-center justify-center shrink-0">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-body-sm font-medium text-foreground">{title}</div>
        <div className="text-caption text-text-tertiary truncate">{desc}</div>
      </div>
      <ChevronRight className="h-4 w-4 text-text-tertiary shrink-0" />
    </button>
  );
}

/* 产奶数据（表格） */
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
    <div className="overflow-x-auto -mx-1 px-1">
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



type MedRecord = {
  id: string;
  date: string;
  drug: string;
  manufacturer: string;
  dose: string;
  operator: string;
  orderId: string;
};

const ALL_MEDS: MedRecord[] = [
  { id: "M-0518-1", date: "2026-05-18", drug: "氟尼辛葡甲胺注射液", manufacturer: "齐鲁动保", dose: "2ml · 肌肉注射", operator: "李雨晴", orderId: "WO-2026-0518" },
  { id: "M-0518-2", date: "2026-05-18", drug: "头孢噻呋钠", manufacturer: "瑞普生物", dose: "1g · 肌肉注射", operator: "李雨晴", orderId: "WO-2026-0518" },
  { id: "M-0519-1", date: "2026-05-19", drug: "头孢噻呋钠", manufacturer: "瑞普生物", dose: "1g · 肌肉注射", operator: "李雨晴", orderId: "WO-2026-0518" },
  { id: "M-0520-1", date: "2026-05-20", drug: "头孢噻呋钠", manufacturer: "瑞普生物", dose: "1g · 肌肉注射", operator: "李雨晴", orderId: "WO-2026-0518" },
  { id: "M-0510-1", date: "2026-05-10", drug: "维生素 B 复合注射液", manufacturer: "上海同仁", dose: "10ml · 肌肉注射", operator: "周凯", orderId: "WO-2026-0510" },
  { id: "M-0421", date: "2026-04-21", drug: "伊维菌素注射液", manufacturer: "中牧股份", dose: "1ml / 50kg · 皮下注射", operator: "周凯", orderId: "DW-2026-0421" },
  { id: "M-0315", date: "2026-03-15", drug: "青霉素 G 钾", manufacturer: "华北制药", dose: "400 万 IU · 肌肉注射", operator: "李雨晴", orderId: "WO-2026-0315" },
  { id: "M-0118", date: "2026-01-18", drug: "口蹄疫疫苗", manufacturer: "中农威特", dose: "2ml · 颈部皮下", operator: "赵敏", orderId: "IM-2026-0118" },
];
const TODAY = new Date("2026-05-29");

function MedicationHistory() {
  const [expanded, setExpanded] = useState(false);
  const { visible, recentCount, totalCount } = useMemo(() => {
    const cutoff = new Date(TODAY);
    cutoff.setDate(cutoff.getDate() - 20);
    const sorted = [...ALL_MEDS].sort((a, b) => (a.date < b.date ? 1 : -1));
    const recent = sorted.filter((m) => new Date(m.date) >= cutoff);
    return { visible: expanded ? sorted : recent, recentCount: recent.length, totalCount: sorted.length };
  }, [expanded]);
  const groups = useMemo(() => {
    const map = new Map<string, MedRecord[]>();
    for (const m of visible) {
      if (!map.has(m.date)) map.set(m.date, []);
      map.get(m.date)!.push(m);
    }
    return Array.from(map.entries());
  }, [visible]);
  const hasMore = totalCount > recentCount;
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-caption text-text-tertiary">
          {expanded ? `全部 ${totalCount} 条` : `近 20 天 ${recentCount} 条`}
        </span>
      </div>
      {groups.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-6 text-center text-caption text-text-tertiary">
          近 20 天无用药记录
        </div>
      ) : (
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
      )}
      {hasMore && (
        <div className="mt-3 flex justify-center">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="h-8 px-4 rounded-full bg-primary/8 text-primary text-caption font-medium inline-flex items-center gap-1 active:bg-primary/15 transition-colors"
          >
            {expanded ? "收起" : `展开全部 ${totalCount} 条`}
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        </div>
      )}
    </div>
  );
}

type MoveRecord = {
  id: string;
  date: string;
  from: string;
  to: string;
  orderId: string | null;
  reason: string;
  operator: string;
};

const ALL_MOVES: MoveRecord[] = [
  { id: "MV-0518", date: "2026-05-18", from: "1 号牛舍", to: "3 号牛舍", orderId: "WO-2026-0518", reason: "疾病治疗", operator: "李雨晴" },
  { id: "MV-0410", date: "2026-04-10", from: "隔离舍", to: "1 号牛舍", orderId: "WO-2026-0405", reason: "治愈", operator: "李雨晴" },
  { id: "MV-0320", date: "2026-03-20", from: "1 号牛舍", to: "隔离舍", orderId: "WO-2026-0318", reason: "继续观察", operator: "李雨晴" },
  { id: "MV-0301", date: "2026-03-01", from: "犊牛舍", to: "1 号牛舍", orderId: null, reason: "调群", operator: "王场长" },
  { id: "MV-0101", date: "2026-01-10", from: "产房", to: "犊牛舍", orderId: null, reason: "断奶分群", operator: "周凯" },
];

function MoveHistory() {
  if (ALL_MOVES.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center text-caption text-text-tertiary">
        暂无转栏记录
      </div>
    );
  }
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
              <span className="text-text-tertiary">原因</span>
              <span className="text-foreground">{m.reason}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="text-text-tertiary">工单</span>
              {m.orderId ? (
                <Link
                  to="/m/health/$id"
                  params={{ id: m.orderId }}
                  className="font-mono text-primary inline-flex items-center gap-0.5"
                >
                  {m.orderId}
                  <ChevronRight className="h-3 w-3" />
                </Link>
              ) : (
                <span className="font-mono text-text-tertiary">-</span>
              )}
            </span>
          </div>
        </div>
      ))}
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
  if (ALL_DIAGNOSES.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center text-caption text-text-tertiary">
        暂无诊断记录
      </div>
    );
  }
  return (
    <div>
      <div className="text-caption text-text-tertiary mb-1">共 {ALL_DIAGNOSES.length} 条</div>
      <div className="rounded-xl border border-border bg-card divide-y divide-border">
        {ALL_DIAGNOSES.map((d) => (
          <div key={d.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className="shrink-0 font-mono text-caption text-text-secondary">{d.date}</span>
              <span className="truncate text-body-sm text-foreground">{d.disease}</span>
            </div>
            <span className="shrink-0 text-caption text-text-secondary">{d.doctor}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

type TestRecord = {
  id: string;
  date: string;
  item: string;
  conclusion: "阴性" | "阳性" | "合格" | "不合格";
  submitter: string;
  submitterOrg?: string;
  submitTime?: string;
  attachments?: number;
};
const ALL_TESTS: TestRecord[] = [
  { id: "T-0620", date: "2026-06-20", item: "生鲜乳体细胞检测", conclusion: "合格", submitter: "李雨晴", submitterOrg: "牧场自有实验室", submitTime: "2026-06-20 09:42", attachments: 3 },
  { id: "T-0605", date: "2026-06-05", item: "布病抗体筛查", conclusion: "阴性", submitter: "周凯", submitterOrg: "第三方检测机构", submitTime: "2026-06-05 14:20", attachments: 2 },
  { id: "T-0512", date: "2026-05-12", item: "结核病检测", conclusion: "阴性", submitter: "王场长", submitterOrg: "牧场自有实验室", submitTime: "2026-05-12 10:05", attachments: 0 },
  { id: "T-0418", date: "2026-04-18", item: "乳房炎病原培养", conclusion: "阳性", submitter: "李雨晴", submitterOrg: "牧场自有实验室", submitTime: "2026-04-18 16:31", attachments: 4 },
];

function TestHistory() {
  const [active, setActive] = useState<TestRecord | null>(null);

  if (ALL_TESTS.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center text-caption text-text-tertiary">
        暂无检测记录
      </div>
    );
  }
  const tone = (c: TestRecord["conclusion"]) =>
    c === "阳性" || c === "不合格"
      ? "bg-red-50 text-red-600"
      : "bg-emerald-50 text-emerald-600";
  return (
    <div>
      <div className="text-caption text-text-tertiary mb-1">共 {ALL_TESTS.length} 条</div>
      <div className="rounded-xl border border-border bg-card divide-y divide-border">
        {ALL_TESTS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActive(t)}
            className="w-full px-3 py-2.5 text-left active:bg-surface-subtle"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="shrink-0 font-mono text-caption text-text-secondary">{t.date}</span>
                <span className="truncate text-body-sm text-foreground">{t.item}</span>
              </div>
              <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-caption ${tone(t.conclusion)}`}>
                {t.conclusion}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-caption text-text-tertiary">
              <span>提交人 {t.submitter}</span>
              {!!t.attachments && (
                <span className="inline-flex items-center gap-0.5">
                  <ImageIcon className="h-3 w-3" /> {t.attachments}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      <Sheet open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl p-0 max-h-[85vh] overflow-y-auto">
          <SheetHeader className="px-4 pt-4 pb-2 text-left">
            <SheetTitle className="text-section">检测结果详情</SheetTitle>
          </SheetHeader>
          {active && (
            <div className="px-4 pb-[calc(env(safe-area-inset-bottom)+20px)] space-y-4">
              <DetailRow label="检测项目" value={active.item} />
              <DetailRow label="最终结论" value={active.conclusion} />
              <DetailRow
                label="结论提交人"
                value={active.submitterOrg ? `${active.submitter}（${active.submitterOrg}）` : active.submitter}
              />
              <DetailRow label="结论提交时间" value={active.submitTime ?? active.date} />
              <div>
                <div className="text-caption text-text-tertiary mb-2">检测详情</div>
                {active.attachments ? (
                  <div className="grid grid-cols-3 gap-2">
                    {Array.from({ length: active.attachments }).map((_, i) => (
                      <div
                        key={i}
                        className="aspect-square rounded-xl bg-gradient-to-br from-surface-subtle to-border border border-border inline-flex items-center justify-center text-text-tertiary"
                      >
                        <ImageIcon className="h-6 w-6" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-border bg-card p-4 text-center text-caption text-text-tertiary">
                    暂无附件
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-caption text-text-tertiary">{label}</div>
      <div className="mt-0.5 text-body text-foreground">{value}</div>
    </div>
  );
}

