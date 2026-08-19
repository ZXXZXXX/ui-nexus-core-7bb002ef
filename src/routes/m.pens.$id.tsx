import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Home,
  ChevronRight,
  ChevronDown,
  Beef,
  Syringe,
  Bug,
  Footprints,
  PlayCircle,
  ClipboardList,
} from "lucide-react";
import { MobileShell } from "@/components/mobile-shell";

export const Route = createFileRoute("/m/pens/$id")({
  head: () => ({ meta: [{ title: "牛栏详情 · 奇点智牧" }] }),
  component: PenDetailPage,
});

type CowStatus = "健康" | "观察中" | "治疗中" | "异常" | "死淘";
const statusTone: Record<CowStatus, string> = {
  健康: "tag tag-success",
  观察中: "tag tag-warning",
  治疗中: "tag tag-info",
  异常: "tag tag-danger",
  死淘: "tag tag-muted",
};

const PEN_PER_BARN = 4;
const LARGE_PEN_COWS = 100;

const BARN_TYPE: Record<number, string> = {
  1: "成牛舍",
  2: "成牛舍",
  3: "病牛舍",
  4: "产后护理舍",
  5: "围产舍",
  6: "犊牛舍",
  7: "干奶舍",
  8: "成牛舍",
};

// 与 m.search.tsx 中 stockFor 保持一致
function stockFor(barnType: string, barnIdx: number, penIdx: number) {
  const seed = barnIdx * 17 + penIdx * 5;
  if (barnType === "病牛舍" || barnType === "产后护理舍") {
    return 4 + (seed % 22); // 4 ~ 25
  }
  return 90 + (seed % 21); // 90 ~ 110
}

function parsePenId(raw: string) {
  // 形如 B001-3，表示 1 号牛舍 · 全场第 3 栏
  const m = raw.match(/^B(\d{3})-(\d+)$/);
  if (!m) return { barnIdx: 1, globalPenNo: 1, localPenIdx: 1 };
  const barnIdx = parseInt(m[1], 10);
  const globalPenNo = parseInt(m[2], 10);
  const localPenIdx = ((globalPenNo - 1) % PEN_PER_BARN) + 1;
  return { barnIdx, globalPenNo, localPenIdx };
}

function cowIdFor(barnIdx: number, localPenIdx: number, i: number) {
  const seq =
    (barnIdx - 1) * PEN_PER_BARN * LARGE_PEN_COWS + (localPenIdx - 1) * LARGE_PEN_COWS + i + 1;
  return `01-24-${String(2000 + seq).padStart(4, "0")}`;
}
function statusFor(barnType: string, i: number): CowStatus {
  // 同一牛栏内牛只状态须与牛舍类型一致：
  // - 病牛舍：基本都是治疗中，偶有观察中（待移入过抗/休药栏）
  // - 产后护理舍：处于护理观察期
  // - 其他舍（成牛 / 犊牛 / 干奶 / 围产 等）：默认都是健康
  if (barnType === "病牛舍") {
    return i % 7 === 3 ? "观察中" : "治疗中";
  }
  if (barnType === "产后护理舍") {
    return "观察中";
  }
  return "健康";
}

type GroupOrder = {
  id: string;
  type: string;
  kind: "免疫" | "驱虫" | "修蹄";
  desc: string;
  status: "执行中" | "待执行";
  time: string;
  person: string;
  progress: { done: number; total: number };
};

const kindIcon = { 免疫: Syringe, 驱虫: Bug, 修蹄: Footprints } as const;

function PenDetailPage() {
  const { id } = useParams({ from: "/m/pens/$id" });
  const { barnIdx, globalPenNo, localPenIdx } = useMemo(() => parsePenId(id), [id]);

  const barnId = `B${String(barnIdx).padStart(3, "0")}`;
  const barnType = BARN_TYPE[barnIdx] ?? "成牛舍";
  const title = `${barnIdx} 号牛舍 · ${globalPenNo} 栏`;
  const totalCows = stockFor(barnType, barnIdx, localPenIdx);
  const INITIAL_VISIBLE = 24;

  // mock 整栏工单
  const groupOrders: GroupOrder[] = [
    {
      id: `IM-2026-${String(globalPenNo).padStart(4, "0")}1`,
      type: "整栏免疫 · 口蹄疫加强",
      kind: "免疫",
      desc: "整栏批次免疫，2026 春季加强针",
      status: "执行中",
      time: "2026-05-22 08:00",
      person: "周凯",
      progress: { done: 62, total: 100 },
    },
    {
      id: `DW-2026-${String(globalPenNo).padStart(4, "0")}2`,
      type: "整栏驱虫 · 季度计划",
      kind: "驱虫",
      desc: "伊维菌素皮下注射，覆盖全栏",
      status: "待执行",
      time: "2026-05-25 09:00",
      person: "李雨晴",
      progress: { done: 0, total: 100 },
    },
    {
      id: `HF-2026-${String(globalPenNo).padStart(4, "0")}3`,
      type: "整栏修蹄 · 月度排查",
      kind: "修蹄",
      desc: "全栏蹄部检查 + 异常处置",
      status: "执行中",
      time: "2026-05-20 14:00",
      person: "张师傅",
      progress: { done: 38, total: 100 },
    },
  ];

  const [showAll, setShowAll] = useState(false);
  const visibleCount = Math.min(totalCows, showAll ? totalCows : INITIAL_VISIBLE);
  const cows = useMemo(
    () =>
      Array.from({ length: visibleCount }, (_, i) => ({
        id: cowIdFor(barnIdx, localPenIdx, i),
        status: statusFor(barnType, i),
      })),
    [barnIdx, localPenIdx, barnType, visibleCount],
  );

  return (
    <MobileShell title={`牛栏 · ${globalPenNo} 栏`} back hideTabBar>
      <div className="pb-8">
        {/* 头部 */}
        <div className="px-4 pt-4">
          <div className="rounded-2xl bg-gradient-to-br from-primary/90 to-primary/70 p-5 text-primary-foreground relative overflow-hidden">
            <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="relative flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
                <Home className="h-6 w-6" strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <div className="text-caption opacity-85">牛舍 {barnId} · 全场第 {globalPenNo} 栏</div>
                <div className="text-section-title">{title}</div>
              </div>
              <span className="ml-auto h-7 px-2.5 rounded-full bg-white/15 backdrop-blur inline-flex items-center text-caption">
                {barnType}
              </span>
            </div>
            <div className="relative mt-4 flex items-baseline gap-2">
              <span className="text-page-title tabular-nums">{totalCows}</span>
              <span className="text-caption opacity-85">头 · 当前存栏</span>
            </div>
          </div>
        </div>

        {/* 整栏工单 */}
        <section className="px-4 mt-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-card-title text-foreground">整栏工单</h3>
            <span className="text-caption text-text-tertiary">共 {groupOrders.length} 个</span>
          </div>
          <div className="space-y-2.5">
            {groupOrders.map((o) => {
              const KIcon = kindIcon[o.kind];
              const isWait = o.status === "待执行";
              const StatusIcon = isWait ? ClipboardList : PlayCircle;
              const tagCls = isWait ? "tag tag-warning" : "tag tag-info";
              const pct = Math.round((o.progress.done / o.progress.total) * 100);
              return (
                <Link
                  key={o.id}
                  to="/m/health/$id/execute"
                  params={{ id: o.id }}
                  className="block rounded-xl bg-card border border-border p-4 active:bg-surface-subtle"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 h-5">
                      <span className="font-mono text-text-tertiary text-caption">{o.id}</span>
                      <span className="text-text-tertiary">·</span>
                      <span className="inline-flex items-center gap-1 text-caption text-text-tertiary">
                        <KIcon className="h-3 w-3" />
                        {o.kind}
                      </span>
                      <span className={`${tagCls} inline-flex items-center gap-1 ml-auto`}>
                        <StatusIcon className="h-3 w-3" />
                        {o.status}
                      </span>
                    </div>
                    <div className="text-card-title text-foreground truncate">{o.type}</div>
                    <div className="text-body-sm text-text-secondary truncate">{o.desc}</div>

                    <div className="mt-1">
                      <div className="flex items-center justify-between text-caption text-text-tertiary mb-1">
                        <span>
                          进度 <span className="text-text-secondary tabular-nums">{o.progress.done}/{o.progress.total}</span>
                        </span>
                        <span className="tabular-nums">{pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-surface-subtle overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center text-caption text-text-tertiary pt-2 border-t border-border/60 h-9">
                      <span>
                        计划 <span className="text-text-secondary">{o.time}</span>
                      </span>
                      <span className="text-text-tertiary/60 mx-1.5">·</span>
                      <span className="flex items-center gap-1">
                        执行
                        <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-caption inline-flex items-center justify-center">
                          {o.person.charAt(0)}
                        </span>
                        <span className="text-text-secondary">{o.person}</span>
                      </span>
                      <span className="ml-auto inline-flex items-center gap-0.5 text-primary font-medium">
                        执行
                        <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* 牛只档案 */}
        <section className="px-4 mt-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-card-title text-foreground">牛只档案</h3>
            <span className="text-caption text-text-tertiary">共 {totalCows} 头</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {cows.map((c) => (
              <Link
                key={c.id}
                to="/m/animals-{$id}"
                params={{ id: c.id }}
                className="rounded-xl bg-card border border-border p-3 active:bg-surface-subtle"
              >
                <div className="flex items-center gap-1.5">
                  <Beef className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="text-body-sm font-mono text-foreground truncate">{c.id}</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className={statusTone[c.status]}>{c.status}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-text-tertiary" />
                </div>
              </Link>
            ))}
          </div>
          {!showAll && totalCows > 24 && (
            <div className="mt-3 flex justify-center">
              <button
                onClick={() => setShowAll(true)}
                className="h-9 px-4 rounded-full bg-primary/8 text-primary text-caption font-medium inline-flex items-center gap-1 active:bg-primary/15"
              >
                展开全部 {totalCows} 头
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </section>
      </div>
    </MobileShell>
  );
}
