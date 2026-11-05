import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  ScanLine,
  Package,
  Pill,
  Check,
  X,
  Minus,
  Plus,
  Beef,
  Boxes,
} from "lucide-react";
import { toast } from "sonner";

import { MobileShell } from "@/components/mobile-shell";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ConfirmPickupDialog } from "@/components/m/confirm-pickup-dialog";
import { L3_ITEMS, CURRENT_HOLDER } from "@/lib/level3-items";
import { cn } from "@/lib/utils";

import {
  PICKUPS,
  genScanCode,
  genBatch,
} from "@/lib/pickup-store";
import {
  homeTasks,
  diseaseTaskMeta,
  typeMeta,
  taskContentByChip,
  taskChipStyle,
  type HomeTask,
} from "./m.homepage";
import { useRole } from "@/lib/mobile-role";
import { getOrderEarTagLabel } from "@/lib/work-order-cattle";

export const Route = createFileRoute("/m/prep")({
  head: () => ({ meta: [{ title: "备药 · 奇点智牧" }] }),
  component: PrepPage,
});

let groupIdCounter = 0;
const genGroupId = () => `group-${++groupIdCounter}`;

// 演示药品池：包含三类典型场景
type DrugDef = {
  name: string;
  spec: string;
  scanUnit: "瓶" | "支" | "包装";
  countUnit: "瓶" | "支";
  unitScannable: boolean; // false 表示仅外包装可扫码（情况三）
  packSize?: number; // 情况三：每个外包装容量
  allowMix: boolean;
  stockSources: { manufacturer: string; qty: number }[];
};

const drugPool: DrugDef[] = [
  {
    name: "氟尼辛葡甲胺注射液",
    spec: "100ml / 瓶",
    scanUnit: "瓶",
    countUnit: "瓶",
    unitScannable: true,
    allowMix: false,
    stockSources: [
      { manufacturer: "齐鲁动保", qty: 8 },
      { manufacturer: "瑞普生物", qty: 4 },
    ],
  },
  {
    name: "头孢噻呋钠",
    spec: "1g / 支",
    scanUnit: "包装",
    countUnit: "支",
    unitScannable: false,
    packSize: 4,
    allowMix: true,
    stockSources: [
      { manufacturer: "中牧股份", qty: 30 },
      { manufacturer: "辉瑞动保", qty: 18 },
    ],
  },
  {
    name: "青霉素钠",
    spec: "80 万 IU / 支",
    scanUnit: "包装",
    countUnit: "支",
    unitScannable: false,
    packSize: 10,
    allowMix: true,
    stockSources: [{ manufacturer: "勃林格", qty: 60 }],
  },
  {
    name: "钙注射液",
    spec: "500ml / 瓶",
    scanUnit: "瓶",
    countUnit: "瓶",
    unitScannable: true,
    allowMix: true,
    stockSources: [{ manufacturer: "中牧股份", qty: 22 }],
  },
  {
    name: "维生素 C 注射液",
    spec: "10ml / 支",
    scanUnit: "支",
    countUnit: "支",
    unitScannable: true,
    allowMix: true,
    stockSources: [
      { manufacturer: "齐鲁动保", qty: 40 },
      { manufacturer: "瑞普生物", qty: 25 },
    ],
  },
];

type Entry = {
  code: string;
  drug: DrugDef;
  manufacturer: string;
  batch: string;
  qty: number;       // 取数（按 countUnit 计）
  packSize?: number; // PACK 时该包装总容量
};

type Group = {
  id: string;
  entries: Entry[];
  combo?: boolean; // 用户主动开启的组合用药模式
  comboScope?: "shared" | "single"; // 组合用药使用范围
  comboCattleCount?: number; // 多头牛共用时的牛只数量
};

type Requirement = {
  key: string;            // name + spec
  name: string;
  spec: string;
  unit: string;
  total: number;          // 所需总数
  mfrRequired: string;    // 厂商要求："不限" 或 具体厂商
  taskIds: string[];      // 来源任务
};

/** 从 "2 瓶" 解析数字 */
function parseQtyNum(qty: string): { n: number; unit: string } {
  const m = qty.match(/^\s*(\d+(?:\.\d+)?)\s*(.*)$/);
  if (!m) return { n: 0, unit: "" };
  return { n: Number(m[1]), unit: (m[2] ?? "").trim() };
}

/** 从 "100ml / 瓶" 解析每单位剂量与单位，如 ml / g / IU */
function parseSpecMetric(spec: string): { amount: number; unit: string } | null {
  const pre = spec.split("/")[0].trim();
  if (!pre) return null;
  const m = pre.match(/(\d+(?:\.\d+)?)\s*([^\d].*?)\s*$/);
  if (!m) return null;
  return { amount: Number(m[1]), unit: m[2].trim() };
}


function PrepPage() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [aggOpen, setAggOpen] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [checklistCollapsed, setChecklistCollapsed] = useState(false);
  const [checklistView, setChecklistView] = useState<"drug" | "cattle">("drug");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const computeRequirements = (ids: string[]): Requirement[] => {
    const map = new Map<string, Requirement>();
    ids.forEach((tid) => {
      const pk = PICKUPS.find((p) => p.source === tid);
      if (!pk) return;
      pk.items.forEach((it) => {
        if (it.isMedicine === false) return; // 物料不进入药品清单
        const { n, unit } = parseQtyNum(it.qty);
        const key = `${it.name}|${it.spec ?? ""}`;
        const existing = map.get(key);
        const mfr =
          it.allowMixManufacturer === false
            ? it.stockSources?.[0]?.manufacturer ?? "指定厂商"
            : "不限";
        if (existing) {
          existing.total += n;
          if (!existing.taskIds.includes(tid)) existing.taskIds.push(tid);
        } else {
          map.set(key, {
            key,
            name: it.name,
            spec: it.spec ?? "",
            unit: unit || "",
            total: n,
            mfrRequired: mfr,
            taskIds: [tid],
          });
        }
      });
    });
    return Array.from(map.values());
  };

  const requirements = useMemo(
    () => computeRequirements(selectedTaskIds),
    [selectedTaskIds],
  );

  // 按牛只耳号聚合：每个任务对应一只牛，列出该牛所需药品
  type CattleGroup = {
    earTag: string;
    taskIds: string[];
    items: { key: string; name: string; spec: string; usage?: string; metricTotal: number; metricUnit: string }[];
  };
  const cattleGroups = useMemo<CattleGroup[]>(() => {
    const map = new Map<string, CattleGroup>();
    selectedTaskIds.forEach((tid) => {
      const pk = PICKUPS.find((p) => p.source === tid);
      if (!pk) return;
      const earTag = getOrderEarTagLabel(tid);
      let g = map.get(earTag);
      if (!g) {
        g = { earTag, taskIds: [], items: [] };
        map.set(earTag, g);
      }
      if (!g.taskIds.includes(tid)) g.taskIds.push(tid);
      pk.items.forEach((it) => {
        if (it.isMedicine === false) return;
        const { n } = parseQtyNum(it.qty);
        const metric = parseSpecMetric(it.spec ?? "");
        const key = `${it.name}|${it.spec ?? ""}`;
        const exist = g!.items.find((x) => x.key === key);
        if (exist) {
          exist.metricTotal += metric ? metric.amount * n : n;
        } else {
          g!.items.push({
            key,
            name: it.name,
            spec: it.spec ?? "",
            usage: it.usage,
            metricTotal: metric ? metric.amount * n : n,
            metricUnit: metric ? metric.unit : "",
          });
        }
      });
    });

    return Array.from(map.values());
  }, [selectedTaskIds]);

  // 模拟扫描：循环演示药品池
  const [scanIdx, setScanIdx] = useState(0);

  const makeEntry = (d: DrugDef, existing?: Group): Entry => {
    const sameDrugEntries = existing?.entries.filter((e) => e.drug.name === d.name) ?? [];
    let mfr = d.stockSources[0].manufacturer;
    if (sameDrugEntries.length > 0) {
      const used = sameDrugEntries[0].manufacturer;
      if (!d.allowMix) {
        mfr = used; // 锁定首个厂商
      } else {
        // 允许混用：交替选取已有的厂商以演示情况二
        const opts = d.stockSources.map((s) => s.manufacturer);
        mfr = opts[sameDrugEntries.length % opts.length];
      }
    }
    return {
      code: genScanCode(d.unitScannable ? "UNIT" : "PACK"),
      drug: d,
      manufacturer: mfr,
      batch: genBatch(),
      qty: 1,
      packSize: d.unitScannable ? undefined : d.packSize,
    };
  };

  const addScan = (d: DrugDef, groupId?: string) => {
    setGroups((prev) => {
      if (groupId !== undefined) {
        const idx = prev.findIndex((g) => g.id === groupId);
        if (idx < 0) return prev;
        const existing = prev[idx];
        const entry = makeEntry(d, existing);
        const next = [...prev];
        next[idx] = { ...existing, entries: [...existing.entries, entry] };
        toast.success(`已追加 · ${d.name}`);
        return next;
      }

      // 未指定分组：同类单药品自动聚合到已有卡片
      const sameDrugIdx = prev.findIndex(
        (g) => g.entries.length > 0 && g.entries.every((e) => e.drug.name === d.name),
      );
      if (sameDrugIdx >= 0) {
        const existing = prev[sameDrugIdx];
        const entry = makeEntry(d, existing);
        const next = [...prev];
        next[sameDrugIdx] = { ...existing, entries: [...existing.entries, entry] };
        toast.success(`已追加 · ${d.name}`);
        return next;
      }

      const entry = makeEntry(d);
      toast.success(`已识别 · ${d.name}`);
      return [{ id: genGroupId(), entries: [entry] }, ...prev];
    });
  };

  const handleScan = () => {
    // 演示合并：若已有单药品卡片，每隔一次扫描就再扫一次同一药品
    const singleDrugGroups = groups.filter(
      (g) => !g.combo && g.entries.length > 0 && new Set(g.entries.map((e) => e.drug.name)).size === 1,
    );
    let d: DrugDef;
    if (singleDrugGroups.length > 0 && scanIdx % 2 === 1) {
      const target = singleDrugGroups[singleDrugGroups.length - 1].entries[0].drug;
      d = target;
    } else {
      d = drugPool[scanIdx % drugPool.length];
    }
    setScanIdx((i) => i + 1);
    addScan(d);
  };

  const enableCombo = (gi: number, scope: "shared" | "single", cattleCount?: number) => {
    setGroups((prev) => {
      const next = [...prev];
      next[gi] = {
        ...next[gi],
        combo: true,
        comboScope: scope,
        comboCattleCount: scope === "shared" ? cattleCount : undefined,
      };
      return next;
    });
  };

  const addComboScan = (gi: number) => {
    const group = groups[gi];
    const existingNames = new Set(group.entries.map((e) => e.drug.name));
    const candidates = drugPool.filter((d) => !existingNames.has(d.name));
    const d =
      candidates.length > 0
        ? candidates[scanIdx % candidates.length]
        : drugPool[scanIdx % drugPool.length];
    setScanIdx((i) => i + 1);
    addScan(d, group.id);
  };

  const updateQty = (gi: number, ei: number, qty: number) => {
    setGroups((prev) => {
      const next = [...prev];
      const g = next[gi];
      const max = g.entries[ei].packSize ?? 1;
      const v = Math.max(1, Math.min(max, qty));
      const entries = [...g.entries];
      entries[ei] = { ...entries[ei], qty: v };
      next[gi] = { ...g, entries };
      return next;
    });
  };

  const removeEntry = (gi: number, ei: number) => {
    setGroups((prev) => {
      const next = [...prev];
      const g = next[gi];
      const entries = g.entries.filter((_, i) => i !== ei);
      if (entries.length === 0) return next.filter((_, i) => i !== gi);
      next[gi] = { ...g, entries };
      return next;
    });
  };

  // 已领药品项数：按药品名称+厂商去重统计
  const totalCount = useMemo(() => {
    const keys = new Set<string>();
    groups.forEach((g) => g.entries.forEach((e) => keys.add(`${e.drug.name}|${e.manufacturer}`)));
    return keys.size;
  }, [groups]);


  const l3Unused = L3_ITEMS.filter((i) => !i.used && i.holder === CURRENT_HOLDER).length;

  const handleAggregateConfirm = (ids: string[]) => {
    setAggOpen(false);
    setSelectedTaskIds(ids);
    setChecklistCollapsed(false);
    const count = computeRequirements(ids).length;
    toast.success(`已生成药品清单（${count} 种）`);
  };


  return (
    <MobileShell hideTabBar>
      {/* 顶部栏 */}
      <header className="sticky top-0 z-30 bg-card border-b border-border">
        <div className="h-12 px-2 flex items-center gap-1">
          <button
            onClick={() => navigate({ to: "/m/homepage" })}
            className="h-9 w-9 inline-flex items-center justify-center text-text-secondary active:bg-surface-subtle rounded-lg"
            aria-label="返回"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex-1 text-body font-semibold text-foreground">备药</div>
          <button
            type="button"
            onClick={() => navigate({ to: "/m/level3" })}
            className="relative h-9 w-9 mr-1 inline-flex items-center justify-center rounded-lg text-text-secondary active:bg-surface-subtle"
            aria-label="三级库"
          >
            <Boxes className="h-5 w-5" />
            {l3Unused > 0 && (
              <span className="absolute top-1 right-1 min-w-[15px] h-[15px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] leading-[15px] text-center font-medium">
                {l3Unused > 99 ? "99+" : l3Unused}
              </span>
            )}
          </button>
        </div>
      </header>



      {/* 顶部 1/4 区域：药品清单 */}
      <div className="min-h-[25vh] bg-card flex flex-col">
        {requirements.length > 0 ? (
          <div className="flex-1 flex flex-col min-h-0">
            <div
              className="w-full h-12 px-4 flex items-center gap-2 active:bg-surface-subtle shrink-0"
            >
              <div
                className="flex-1 flex items-center gap-2 min-w-0"
                onClick={() => setChecklistCollapsed((v) => !v)}
              >
                <ClipboardList className="h-4 w-4 text-primary shrink-0" />
                <span className="text-body font-medium text-foreground whitespace-nowrap">药品清单</span>
                <span className="ml-auto inline-flex items-center gap-1 text-caption text-text-tertiary whitespace-nowrap">
                  {checklistView === "drug"
                    ? `共 ${requirements.length} 项`
                    : `共 ${cattleGroups.length} 头`}
                  {checklistCollapsed ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronUp className="h-3.5 w-3.5" />
                  )}
                </span>
              </div>
            </div>

            {/* 视图切换 + 任务统计 */}
            <div className="px-4 pb-3 flex items-center justify-between gap-2">
              <div className="inline-flex p-0.5 rounded-md bg-surface-subtle text-caption">
                <button
                  type="button"
                  onClick={() => {
                    setChecklistView("drug");
                    setChecklistCollapsed(false);
                  }}
                  className={`px-2.5 h-7 rounded ${checklistView === "drug" ? "bg-card text-primary font-medium shadow-sm" : "text-text-tertiary"}`}
                >
                  药品维度
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setChecklistView("cattle");
                    setChecklistCollapsed(false);
                  }}
                  className={`px-2.5 h-7 rounded ${checklistView === "cattle" ? "bg-card text-primary font-medium shadow-sm" : "text-text-tertiary"}`}
                >
                  牛只维度
                </button>
              </div>
              <div className="inline-flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setAggOpen(true)}
                  className="inline-flex items-center gap-1 text-caption text-primary active:opacity-70 shrink-0"
                >
                  选择任务 ({selectedTaskIds.length}项)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTaskIds([])}
                  className="inline-flex items-center gap-1 text-caption text-text-tertiary active:opacity-70 shrink-0"
                >
                  清除
                </button>
              </div>
            </div>


            <div className="px-4 pb-3">
              {checklistView === "drug" ? (
                <>
                  <div className="relative">
                    <div className={cn("divide-y divide-border", checklistCollapsed && "max-h-[96px] overflow-hidden")}>
                      {requirements.map((r, idx) => {
                        if (checklistCollapsed && idx > 0) return null;
                        const displayName = r.name.length > 15 ? `${r.name.slice(0, 15)}...` : r.name;
                        return (
                          <div
                            key={r.key}
                            className="px-1 py-3 flex items-center gap-2 text-body-sm"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="text-foreground font-medium truncate">
                                {displayName}
                              </div>
                              <div className="text-[11px] text-text-secondary truncate mt-0.5">
                                {r.mfrRequired}
                              </div>
                            </div>
                            <div className="w-[80px] shrink-0 text-center text-text-tertiary tabular-nums">
                              {r.spec}
                            </div>
                            <div className="w-[72px] shrink-0 text-right text-foreground font-semibold tabular-nums">
                              {r.total}
                              <span className="text-caption font-normal text-text-tertiary ml-0.5">
                                {r.unit}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {checklistCollapsed && (
                      <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-b from-transparent to-card pointer-events-none" />
                    )}
                  </div>
                  {checklistCollapsed && (
                    <div className="text-center text-caption text-text-tertiary py-2">
                      共 {requirements.length} 项
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="relative">
                    <div className={cn("divide-y divide-border", checklistCollapsed && "max-h-[96px] overflow-hidden")}>
                      {cattleGroups.map((c, idx) => {
                        if (checklistCollapsed && idx > 0) return null;
                        return (
                          <div key={c.earTag} className="px-1 py-3">
                            <div className="flex items-center justify-between mb-2.5">
                              <div className="inline-flex items-center gap-1.5">
                                <Beef className="h-4 w-4 text-primary" />
                                <span className="text-card-title font-semibold text-primary font-mono tracking-wide">
                                  {c.earTag}
                                </span>
                              </div>
                              <span className="text-caption text-text-tertiary">
                                {c.items.length} 项药品
                              </span>
                            </div>
                            <div className="space-y-2.5">
                              {c.items.map((it, itIdx) => {
                                if (checklistCollapsed && itIdx > 0) return null;
                                return (
                                  <div key={it.key} className="flex items-center gap-2 text-body-sm">
                                    <div className="flex-1 min-w-0 truncate text-foreground font-medium">
                                      {it.name}
                                    </div>
                                    <div className="shrink-0 text-text-secondary truncate max-w-[120px]">
                                      {it.usage || "-"}
                                    </div>
                                    <div className="shrink-0 w-[72px] text-right text-foreground font-medium tabular-nums">
                                      {it.metricTotal} {it.metricUnit}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {checklistCollapsed && (
                      <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-b from-transparent to-card pointer-events-none" />
                    )}
                  </div>
                  {checklistCollapsed && (
                    <div className="text-center text-caption text-text-tertiary py-2">
                      共 {cattleGroups.length} 头
                    </div>
                  )}
                </>
              )}
            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col px-4 pt-3 pb-4 min-h-0">
            <div className="flex items-center gap-2 h-8 mb-2 shrink-0">
              <ClipboardList className="h-4 w-4 text-primary" />
              <span className="text-body font-medium text-foreground">药品清单</span>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface-2 p-6 text-center min-h-0">
              <div className="text-body-sm text-text-tertiary mb-4">
                选择任务，快速统计药品清单
              </div>
              <button
                onClick={() => setAggOpen(true)}
                className="h-9 px-4 rounded-lg text-body-sm text-primary inline-flex items-center gap-1.5 border border-primary active:bg-brand-subtle"
              >
                <ClipboardList className="h-4 w-4" />
                选择任务
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 pt-4 pb-36 bg-card flex-1">
        {/* 已领药品 */}
        <div className="flex items-center justify-between h-8 mb-3">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            <span className="text-body font-medium text-foreground">已领药品</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-caption text-text-tertiary">共 {totalCount} 项</span>
            {groups.length > 0 && (
              <button
                onClick={() => setGroups([])}
                className="text-caption text-text-tertiary active:opacity-70"
              >
                清空
              </button>
            )}
          </div>
        </div>

        {groups.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface-2 p-6 flex flex-col items-center justify-center text-center">
            <div className="text-body-sm text-text-tertiary">
              点击下方按钮扫描药品二维码
            </div>
          </div>
        ) : (
          <div className="space-y-3 pb-4">
            {groups.map((g, gi) => (
              <DrugCard
                key={g.id}
                group={g}
                onScanMore={() => addComboScan(gi)}
                onEnableCombo={(scope, count) => enableCombo(gi, scope, count)}
                onUpdateQty={(ei, qty) => updateQty(gi, ei, qty)}
                onRemove={(ei) => removeEntry(gi, ei)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 底部吸底操作栏 */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] bg-card border-t border-border p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] z-40">
        <div className="flex gap-3">
          <button
            onClick={handleScan}
            className="flex-1 h-11 rounded-lg border border-primary text-primary text-body-sm font-semibold inline-flex items-center justify-center gap-1.5 active:bg-brand-subtle"
          >
            <ScanLine className="h-4 w-4" />
            扫码领药
          </button>
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={totalCount === 0}
            className="flex-1 h-11 rounded-lg bg-primary text-white text-body-sm font-semibold active:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            完成领药
            {totalCount > 0 && `（${totalCount} 项）`}
          </button>
        </div>
      </div>

      <ConfirmPickupDialog
        open={confirmOpen}
        comboCount={groups.filter((g) => g.combo).length}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          toast.success(`已生成领药记录（${totalCount} 项）`);
          setGroups([]);
          setSelectedTaskIds([]);
        }}
      />

      {aggOpen && (
        <AggregateDrawer
          initialSelected={selectedTaskIds}
          onClose={() => setAggOpen(false)}
          onConfirm={handleAggregateConfirm}
        />
      )}
    </MobileShell>
  );
}



function DrugCard({
  group,
  onScanMore,
  onEnableCombo,
  onUpdateQty,
  onRemove,
}: {
  group: Group;
  onScanMore: () => void;
  onEnableCombo: (scope: "shared" | "single", cattleCount?: number) => void;
  onUpdateQty: (ei: number, qty: number) => void;
  onRemove: (ei: number) => void;
}) {
  const { entries } = group;
  const totalQty = entries.reduce((s, e) => s + e.qty, 0);
  const comboItemCount = useMemo(() => {
    const keys = new Set<string>();
    entries.forEach((e) => keys.add(`${e.drug.name}|${e.manufacturer}`));
    return keys.size;
  }, [entries]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [comboScope, setComboScope] = useState<"shared" | "single">("single");
  const [cattleCount, setCattleCount] = useState<string>("2");

  useEffect(() => {
    if (confirmOpen) {
      setComboScope("single");
      setCattleCount("2");
    }
  }, [confirmOpen]);

  const distinctDrugs = useMemo(
    () => Array.from(new Map(entries.map((e) => [e.drug.name, e.drug])).values()),
    [entries],
  );
  const isCombo = !!group.combo || distinctDrugs.length > 1;
  const firstDrug = distinctDrugs[0];

  const comboTitle = useMemo(() => {
    const parts = distinctDrugs.slice(0, 3).map((d) => {
      const abbr = d.name.slice(0, 3);
      return d.name.length > 3 ? `${abbr}…` : abbr;
    });
    return `用药组合：${parts.join(" + ")}${distinctDrugs.length > 3 ? " + …" : ""}`;
  }, [distinctDrugs]);


  return (
    <>
      <div
        className="rounded-xl bg-card border p-3.5"
        style={{ borderColor: isCombo ? "#FFD2A8" : "#B8E0C2" }}
      >
        {/* 顶部：名称 + 卡片扫码入口 */}
        <div className="flex items-center gap-2">
          {isCombo ? (
            <span className="inline-flex -space-x-1 text-warning mt-0.5 shrink-0">
              <Pill className="h-4 w-4" />
              <Pill className="h-4 w-4" />
            </span>
          ) : (
            <Pill className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          )}
          <div className="flex-1 min-w-0 text-body font-semibold text-foreground truncate">
            {isCombo ? comboTitle : firstDrug.name}
          </div>
          {isCombo ? (
            <button
              onClick={onScanMore}
              className="h-9 w-9 rounded-lg inline-flex items-center justify-center shrink-0 active:opacity-80 bg-[#FFF1E6] text-[#E5751A]"
              aria-label="继续扫描"
            >
              <ScanLine className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => setConfirmOpen(true)}
              className="text-caption text-primary active:opacity-70 shrink-0"
            >
              组合用药
            </button>
          )}
        </div>


        {/* 第二行：规格/扫码单位/牛只数 + 已领总数 */}
        <div className="mt-2 flex items-center justify-between gap-2 text-caption">
          <div className="flex items-center min-w-0">
            {isCombo && group.comboScope ? (
            <div className="text-text-tertiary">
                治疗牛只 {group.comboScope === "single" ? 1 : group.comboCattleCount} 头
              </div>
            ) : !isCombo && firstDrug ? (
              <div className="text-text-tertiary truncate">
                规格 <span className="text-text-secondary">{firstDrug.spec}</span>
                <span className="mx-2 text-border">·</span>
                扫码单位 <span className="text-text-secondary">{firstDrug.scanUnit}</span>
              </div>
            ) : null}
          </div>
          <div className={`font-medium shrink-0 ${isCombo ? "text-[#E5751A]" : "text-primary"}`}>
            已领 {isCombo ? comboItemCount : totalQty} {isCombo ? "项" : firstDrug.countUnit}
          </div>
        </div>

        {/* 虚线分隔 */}
        <div className="my-3 border-t border-dashed border-border" />

        {/* 扫描明细 */}
        <div className="space-y-2.5">
          {entries.map((e, ei) => (
            <div key={`${e.code}-${ei}`} className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                {isCombo && (
                  <div className="text-caption text-foreground font-medium truncate">
                    {e.drug.name}
                  </div>
                )}
                <div className="text-caption text-text-secondary font-mono truncate">
                  {e.code}
                </div>
                <div className="text-caption mt-0.5">
                  <span className={isCombo ? "text-[#E5751A]" : "text-primary"}>{e.manufacturer}</span>
                  <span className="mx-2 text-border">·</span>
                  <span className="text-text-tertiary font-mono">{e.batch}</span>
                </div>
                {!e.drug.unitScannable && e.packSize && (
                  <div className="text-caption text-text-tertiary mt-0.5">
                    包内剩余 <span className="text-text-secondary">{e.packSize - e.qty}</span>
                    {" / "}
                    <span className="text-text-secondary">{e.packSize}</span>{" "}
                    {e.drug.countUnit}
                  </div>
                )}
              </div>

              {e.drug.unitScannable ? (
                <div className="text-caption text-text-secondary shrink-0">
                  ×{e.qty} {e.drug.countUnit}
                </div>
              ) : (
                <div className="inline-flex items-center border border-border rounded-md shrink-0 h-8">
                  <button
                    onClick={() => onUpdateQty(ei, e.qty - 1)}
                    disabled={e.qty <= 1}
                    className="h-8 w-8 inline-flex items-center justify-center text-text-secondary disabled:opacity-30 active:bg-surface-subtle"
                    aria-label="减少"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <div className="w-8 text-center text-body-sm tabular-nums">{e.qty}</div>
                  <button
                    onClick={() => onUpdateQty(ei, e.qty + 1)}
                    disabled={e.packSize ? e.qty >= e.packSize : false}
                    className="h-8 w-8 inline-flex items-center justify-center text-text-secondary disabled:opacity-30 active:bg-surface-subtle"
                    aria-label="增加"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              <button
                onClick={() => onRemove(ei)}
                className="h-8 w-6 inline-flex items-center justify-center text-text-tertiary active:text-foreground shrink-0"
                aria-label="移除"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {confirmOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4"
          onClick={() => setConfirmOpen(false)}
        >
          <div
            className="w-full max-w-[360px] rounded-2xl bg-card p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <span className="h-9 w-9 rounded-full bg-brand-subtle inline-flex items-center justify-center">
                <Pill className="h-4 w-4 text-primary" />
              </span>
            <h3 className="text-card-title text-foreground">组合用药确认</h3>
            </div>
            <p className="text-body-sm text-text-secondary leading-relaxed">
              组合内任意药品在用药核验时将整组录入，请选择本组药品的使用方式：
            </p>
            <div className="space-y-2">
              <label className="flex items-center gap-3 rounded-xl border border-border p-3 active:bg-surface-subtle cursor-pointer">
                <input
                  type="radio"
                  name={`combo-scope-${group.id}`}
                  className="h-4 w-4 accent-primary shrink-0"
                  checked={comboScope === "shared"}
                  onChange={() => {
                    setComboScope("shared");
                    setCattleCount("2");
                  }}
                />
                <div className="flex-1">
                  <div className="text-body-sm text-foreground font-medium">多头牛共用</div>
                  <div className="text-caption text-text-tertiary">该组合内药品，将共用于治疗多头牛</div>
                  {comboScope === "shared" && (
                    <div className="mt-3 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <span className="text-caption text-text-secondary shrink-0">牛只数量</span>
                      <div className="inline-flex items-center border border-border rounded-lg h-9 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setCattleCount((v) => Math.max(2, parseInt(v || "2", 10) - 1).toString())}
                          disabled={cattleCount === "2"}
                          className="h-9 w-9 inline-flex items-center justify-center text-text-secondary active:bg-surface-subtle disabled:opacity-30"
                          aria-label="减少"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-10 text-center text-body-sm font-medium tabular-nums text-foreground">
                          {cattleCount}
                        </span>
                        <button
                          type="button"
                          onClick={() => setCattleCount((v) => (parseInt(v || "2", 10) + 1).toString())}
                          className="h-9 w-9 inline-flex items-center justify-center text-text-secondary active:bg-surface-subtle"
                          aria-label="增加"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="text-caption text-text-secondary shrink-0">头</span>
                    </div>
                  )}
                </div>
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-border p-3 active:bg-surface-subtle cursor-pointer">
                <input
                  type="radio"
                  name={`combo-scope-${group.id}`}
                  className="h-4 w-4 accent-primary shrink-0"
                  checked={comboScope === "single"}
                  onChange={() => setComboScope("single")}
                />
                <div className="flex-1">
                  <div className="text-body-sm text-foreground font-medium">单头牛使用</div>
                  <div className="text-caption text-text-tertiary">该组合内药品，仅用于治疗单独一头牛</div>
                </div>
              </label>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="flex-1 h-10 rounded-lg border border-border bg-card text-body-sm text-text-secondary"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  if (comboScope === "shared") {
                    const n = parseInt(cattleCount, 10);
                    if (!n || n < 2) {
                      toast.error("请输入牛只数量（≥2）");
                      return;
                    }
                    onEnableCombo("shared", n);
                  } else {
                    onEnableCombo("single");
                  }
                  setConfirmOpen(false);
                }}
                className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-body-sm"
              >
                确认开启
              </button>
            </div>
          </div>
        </div>
      )}


    </>
  );
}

function AggregateDrawer({
  initialSelected = [],
  onClose,
  onConfirm,
}: {
  initialSelected?: string[];
  onClose: () => void;
  onConfirm: (ids: string[]) => void;
}) {
  const role = useRole();
  const homeTaskMap = useMemo(() => {
    const m = new Map<string, HomeTask>();
    homeTasks.forEach((t) => m.set(t.id, t));
    return m;
  }, []);

  // 全部今日可备药任务：基于 PICKUPS 中存在的工单 + 当前角色可视
  const allTasks: HomeTask[] = useMemo(() => {
    const roleType: Record<string, string[]> = {
      vet: ["疾病治疗", "产后护理"],
      manager: ["疾病治疗", "产后护理"],
      vet_assistant: ["疾病治疗", "产后护理"],
      immunizer: ["疫苗免疫"],
      hoof_trimmer: ["修蹄"],
    };
    const types = roleType[role] ?? ["疾病治疗", "产后护理", "疫苗免疫", "修蹄"];
    const out: HomeTask[] = [];
    PICKUPS.forEach((p) => {
      const t = homeTaskMap.get(p.source);
      if (!t) return;
      if (t.status !== "进行中") return;
      if (!types.includes(t.type)) return;
      out.push(t);
    });
    return out;
  }, [role, homeTaskMap]);

  const barnOf = (t: HomeTask): string => {
    const pk = PICKUPS.find((p) => p.source === t.id);
    if (pk) return pk.barn;
    if (!t.target.startsWith("#")) return t.target.split(" · ")[0];
    return "未分配";
  };

  const allBarns = useMemo(() => {
    const s = new Set<string>();
    allTasks.forEach((t) => s.add(barnOf(t)));
    return Array.from(s).sort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allTasks]);

  const [barnDropdownOpen, setBarnDropdownOpen] = useState(false);
  const [barnFilter, setBarnFilter] = useState<Set<string>>(new Set());
  const tasks = useMemo(
    () =>
      barnFilter.size === 0
        ? allTasks
        : allTasks.filter((t) => barnFilter.has(barnOf(t))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allTasks, barnFilter],
  );

  const [selected, setSelected] = useState<Set<string>>(() => new Set(initialSelected));
  // 选择的任务必须仍在当前牛舍范围内
  useEffect(() => {
    setSelected((s) => {
      const ids = new Set(tasks.map((t) => t.id));
      const n = new Set<string>();
      s.forEach((id) => ids.has(id) && n.add(id));
      return n;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barnFilter]);
  const allOn = tasks.length > 0 && tasks.every((t) => selected.has(t.id));
  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const toggleAll = () =>
    setSelected((s) => {
      const n = new Set(s);
      if (allOn) tasks.forEach((t) => n.delete(t.id));
      else tasks.forEach((t) => n.add(t.id));
      return n;
    });
  const toggleBarn = (b: string) =>
    setBarnFilter((s) => {
      const n = new Set(s);
      n.has(b) ? n.delete(b) : n.add(b);
      return n;
    });

  const barnDisplayText = useMemo(() => {
    if (barnFilter.size === 0) return "不限牛舍";
    const names = allBarns.filter((b) => barnFilter.has(b));
    if (barnFilter.size === 1) return names[0];
    return `已选 ${barnFilter.size} 个牛舍`;
  }, [barnFilter, allBarns]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-end"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[440px] mx-auto bg-card rounded-t-2xl h-[75vh] max-h-[75vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-12 px-4 flex items-center justify-between border-b border-border shrink-0">
          <div className="text-body font-medium text-foreground">
            选择任务
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 inline-flex items-center justify-center text-text-secondary"
            aria-label="关闭"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 牛舍筛选 */}
        <div className="px-4 pt-3 pb-3 border-b border-border shrink-0">
          <button
            type="button"
            onClick={() => setBarnDropdownOpen(true)}
            className="w-full h-10 px-3 rounded-lg bg-card border border-border flex items-center justify-between gap-2 text-left"
          >
            <span className="text-body-sm text-foreground truncate">
              {barnDisplayText}
            </span>
            <ChevronDown className="h-4 w-4 text-text-tertiary shrink-0" />
          </button>
        </div>

        {/* 全选 / 已选计数 */}
        <div className="px-4 h-11 flex items-center justify-between shrink-0 border-b border-border">
          <button
            onClick={toggleAll}
            disabled={tasks.length === 0}
            className="inline-flex items-center gap-2 text-body-sm text-foreground disabled:opacity-40"
          >
            <span
              className={`h-4 w-4 rounded border inline-flex items-center justify-center ${
                allOn ? "bg-primary border-primary" : "border-border bg-card"
              }`}
            >
              {allOn && <Check className="h-3 w-3 text-white" />}
            </span>
            全选
          </button>
          <span className="text-caption text-text-tertiary">
            已选 <span className="text-primary font-medium">{selected.size}</span> / {tasks.length}
          </span>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2.5 bg-surface-subtle/40">
          {tasks.length === 0 && (
            <div className="p-10 text-center text-caption text-text-tertiary">
              当前牛舍范围下暂无待执行任务
            </div>
          )}
          {tasks.map((t) => {
            const on = selected.has(t.id);
            const meta = typeMeta[t.type] ?? typeMeta["疾病治疗"];
            const Icon = meta.icon;
            const barn = barnOf(t);
            const chip =
              t.type === "疾病治疗"
                ? diseaseTaskMeta[t.id]?.task ?? null
                : "待执行";
            const cattleId = t.target.startsWith("#") ? t.target : null;
            const groupTarget = cattleId ? null : t.target;
            const actionLine = taskContentByChip(t.id, "待执行", t.conclusion);

            return (
              <button
                key={t.id}
                type="button"
                onClick={() => toggle(t.id)}
                className={`w-full text-left rounded-2xl border bg-card overflow-hidden active:bg-surface-subtle ${
                  on ? "border-primary ring-1 ring-primary/30" : "border-border"
                }`}
              >
                <div className="px-3.5 py-3">
                  {/* 顶部：类型 + 编号 + 状态 + 勾选 */}
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
                    <span
                      className={`ml-auto h-[18px] w-[18px] rounded inline-flex items-center justify-center shrink-0 border ${
                        on
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-border bg-card"
                      }`}
                      aria-hidden
                    >
                      {on && <Check className="h-3 w-3" strokeWidth={3} />}
                    </span>
                  </div>

                  {/* 主体 */}
                  <div className="mt-2.5">
                    <div className="flex items-baseline gap-2 min-w-0">
                      <span className="text-[17px] font-semibold text-foreground font-mono leading-tight truncate">
                        {cattleId ?? groupTarget}
                      </span>
                      <span className="text-body-sm text-text-tertiary shrink-0 truncate">
                        {barn}
                      </span>
                    </div>
                    <div className="mt-1.5 text-body-sm text-text-secondary truncate">
                      <span className="text-text-tertiary mr-1.5">具体内容</span>
                      {actionLine}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <div className="p-3 pb-[calc(env(safe-area-inset-bottom)+12px)] border-t border-border shrink-0">
          <button
            disabled={selected.size === 0}
            onClick={() => onConfirm(Array.from(selected))}
            className="w-full h-11 rounded-lg bg-primary text-white text-body-sm font-semibold disabled:opacity-40 active:opacity-90"
          >
            确认统计（{selected.size}）
          </button>
        </div>
      </div>

      {/* 牛舍多选下拉抽屉 */}
      {barnDropdownOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 flex items-end"
          onClick={() => setBarnDropdownOpen(false)}
        >
          <div
            className="w-full max-w-[440px] mx-auto bg-card rounded-t-2xl h-[75vh] max-h-[75vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-12 px-4 flex items-center justify-between border-b border-border shrink-0">
              <div className="text-body font-medium text-foreground">选择牛舍</div>
              <button
                onClick={() => setBarnDropdownOpen(false)}
                className="h-8 w-8 inline-flex items-center justify-center text-text-secondary"
                aria-label="关闭"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {/* 不限牛舍 */}
              <button
                type="button"
                onClick={() => setBarnFilter(new Set())}
                className="w-full text-left rounded-xl border border-border bg-card p-3 flex items-center justify-between gap-2 active:bg-surface-subtle"
              >
                <span className="text-body-sm text-foreground">不限牛舍</span>
                <span
                  className={`h-4 w-4 rounded border shrink-0 inline-flex items-center justify-center ${
                    barnFilter.size === 0
                      ? "bg-primary border-primary"
                      : "border-border bg-card"
                  }`}
                >
                  {barnFilter.size === 0 && <Check className="h-3 w-3 text-white" />}
                </span>
              </button>

              {/* 分隔线 */}
              <div className="py-1">
                <div className="text-caption text-text-tertiary">按牛舍筛选</div>
              </div>

              {allBarns.map((b) => {
                const on = barnFilter.has(b);
                const cnt = allTasks.filter((t) => barnOf(t) === b).length;
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => toggleBarn(b)}
                    className={`w-full text-left rounded-xl border p-3 bg-card transition-colors flex items-center justify-between gap-2 ${
                      on ? "border-primary" : "border-border active:bg-surface-subtle"
                    }`}
                  >
                    <span className="text-body-sm text-foreground">{b}</span>
                    <span className="inline-flex items-center gap-2">
                      <span className="text-caption text-text-tertiary">{cnt} 个任务</span>
                      <span
                        className={`h-4 w-4 rounded border shrink-0 inline-flex items-center justify-center ${
                          on ? "bg-primary border-primary" : "border-border bg-card"
                        }`}
                      >
                        {on && <Check className="h-3 w-3 text-white" />}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="p-3 pb-[calc(env(safe-area-inset-bottom)+12px)] border-t border-border shrink-0">
              <button
                type="button"
                onClick={() => setBarnDropdownOpen(false)}
                className="w-full h-11 rounded-lg bg-primary text-white text-body-sm font-semibold active:opacity-90"
              >
                确认（{barnFilter.size === 0 ? "不限牛舍" : `${barnFilter.size} 个牛舍`}）
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




