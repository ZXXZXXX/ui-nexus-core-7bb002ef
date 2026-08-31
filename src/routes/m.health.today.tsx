import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  Check,
  Inbox,
  CheckCircle2,
  Package,
  X,
  Camera,
  Filter,
  ChevronRight,
  ChevronDown,
  UserRound,
  UserCheck,

} from "lucide-react";

import { toast } from "sonner";
import { MobileShell } from "@/components/mobile-shell";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


import { EmptyState } from "@/components/empty-state";
import { useRole, roleLabel, type Role } from "@/lib/mobile-role";
import { PICKUPS } from "@/lib/pickup-store";
import { getHandledAlerts, subscribeAlerts } from "@/lib/alert-store";
import { SHIFT_STAFF, assignTasks, useAssignees, offReasonLabel, currentUserName } from "@/lib/assignee-store";

import {
  homeTasks,
  diseaseTaskMeta,
  taskChipStyle,
  typeMeta,
  taskCardContent,
  BASIC_EVENT_TYPES,
  URGENCY_RANK,
  urgencyMeta,
  formatTimeAgo,
  type HomeTask,
  type TaskChip,
} from "@/routes/m.homepage";


export const Route = createFileRoute("/m/health/today")({
  validateSearch: (s: Record<string, unknown>): { capture?: string } => ({
    capture: typeof s.capture === "string" ? s.capture : undefined,
  }),
  head: () => ({ meta: [{ title: "今日工作任务 · 奇点智牧" }] }),
  component: TodayTasksPage,
});

/* ============================================================
 * 工作任务页 —— 业务版
 * 1. 按角色 + 状态分流：兽医/场长 = 待诊断 / 待执行 / 待复查
 *    执行类角色（助理、免疫员、修蹄工）= 待执行
 * 2. 牛舍筛选（多选 chip）—— 集中处理某几个牛舍的任务
 * 3. 顶部聚合工具栏：选中范围内的「需领药品清单」+「批量记录执行」
 * ============================================================ */

function inferBarn(t: HomeTask): string {
  if (!t.target.startsWith("#")) return t.target.split(" · ")[0];
  const tail = t.target.slice(-1);
  const n = Number.isFinite(Number(tail)) ? Number(tail) : 1;
  return `${(n % 4) + 1} 号牛舍`;
}

function pickupForWO(woId: string) {
  return PICKUPS.find((p) => p.source === woId);
}

type StatusTab = "待诊断" | "待执行" | "待复查";

const ALL_TABS: StatusTab[] = ["待诊断", "待执行", "待复查"];

function tabHandledByRole(role: Role, tab: StatusTab): boolean {
  if (role === "manager") return false; // 场长无工单处理权限
  if (role === "vet") return true;
  return tab === "待执行";
}

// 按角色获取候选任务全集（不区分状态 tab）
// 兽医：疾病治疗 待诊断/待复查 + 疾病治疗/产后护理 的待执行
// 场长：无（不参与工单处理）
// 助理：疾病治疗/产后护理 的待执行
// 免疫员：疫苗免疫；修蹄工：修蹄
const EXEC_TYPES_VET = ["疾病治疗", "产后护理"];
const EXTRA_TASKS = homeTasks.filter(
  (t) => t.kind === "基础事件" || t.kind === "异常排查",
);

function getRoleAllTasks(role: Role): HomeTask[] {
  if (role === "manager") return [];
  if (role === "vet") {
    return [
      ...homeTasks.filter(
        (t) =>
          (t.type === "疾病治疗" && t.status === "待诊断") ||
          (EXEC_TYPES_VET.includes(t.type) && t.status === "进行中"),
      ),
      ...EXTRA_TASKS,
    ];
  }
  if (role === "vet_assistant")
    return [
      ...homeTasks.filter(
        (t) =>
          EXEC_TYPES_VET.includes(t.type) &&
          t.status === "进行中" &&
          diseaseTaskMeta[t.id]?.task !== "待复查",
      ),
      ...EXTRA_TASKS,
    ];
  if (role === "immunizer")
    return homeTasks.filter((t) => t.type === "疫苗免疫" && t.status === "进行中");
  if (role === "hoof_trimmer")
    return homeTasks.filter((t) => t.type === "修蹄" && t.status === "进行中");
  return [];
}

function statusOf(t: HomeTask): StatusTab {
  if (t.kind === "基础事件" || t.kind === "异常排查") return "待执行";
  if (t.type === "疾病治疗") {

    const meta = diseaseTaskMeta[t.id]?.task;
    if (meta === "待诊断") return "待诊断";
    if (meta === "待复查") return "待复查";
    return "待执行";
  }
  return "待执行";
}

type TaskKind = "工单任务" | "基础事件" | "异常排查";
const ALL_KINDS: TaskKind[] = ["工单任务", "基础事件", "异常排查"];

function AssigneeBadge({ name }: { name: string }) {
  const initial = name.slice(0, 1);
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary px-1.5 h-[22px]">
      <span className="h-4 w-4 rounded-full bg-primary-foreground text-primary inline-flex items-center justify-center text-[10px] font-medium">
        {initial}
      </span>
      <span className="text-caption text-primary-foreground">{name}</span>
    </span>
  );
}

function TodayTasksPage() {
  const role = useRole();
  const navigate = useNavigate();
  // 已在牛只档案中反馈过的异常排查任务，当天不再展示
  const [handledAlerts, setHandledAlerts] = useState<Set<string>>(new Set());
  useEffect(() => {
    const sync = () => setHandledAlerts(getHandledAlerts());
    sync();
    return subscribeAlerts(sync);
  }, []);
  const allTasks = useMemo(() => getRoleAllTasks(role), [role]);

  const [activeTab, setActiveTab] = useState<StatusTab>("待执行");
  const [kindFilter, setKindFilter] = useState<TaskKind>("工单任务");
  const [selectedBarns, setSelectedBarns] = useState<Set<string>>(new Set());
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [barnQuery, setBarnQuery] = useState("");


  const [mineOnly, setMineOnly] = useState(false);

  const [selectMode, setSelectMode] = useState(false);
  const [typeConflict, setTypeConflict] = useState<{ current: string; next: string } | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [done, setDone] = useState<"batch" | null>(null);
  const [assignSheetOpen, setAssignSheetOpen] = useState(false);
  const [staffQuery, setStaffQuery] = useState("");
  const [pendingAssignee, setPendingAssignee] = useState<
    (typeof SHIFT_STAFF)[number] | null
  >(null);
  const assignees = useAssignees();
  // 批量选择时所有角色均可指定责任人
  const canAssign = true;

  const commitAssign = (s: (typeof SHIFT_STAFF)[number]) => {
    const ids = Array.from(selected);
    assignTasks(ids, s.name);
    setPendingAssignee(null);
    setAssignSheetOpen(false);
    exitSelect();
    if (s.onShift) {
      toast.success(`已将 ${ids.length} 项任务指派给 ${s.name}`);
    } else {
      toast.warning(
        `${s.name} 本场次${offReasonLabel[s.offReason ?? "absent"]}，已指派 ${ids.length} 项任务`,
      );
    }
  };


  
  const { capture } = Route.useSearch();

  // 领药完成后回到此页：直接跳转到批量执行页
  useEffect(() => {
    if (!capture) return;
    navigate({
      to: "/m/health/today/batch",
      search: { ids: capture },
      replace: true,
    });
  }, [capture, navigate]);

  const kindOf = (t: HomeTask): TaskKind =>
    t.kind === "基础事件" || t.kind === "异常排查" ? t.kind : "工单任务";

  // 顶层：三大类别
  const kindOptions = useMemo(
    () =>
      ALL_KINDS.map((k) => ({
        key: k,
        count: allTasks.filter((t) => kindOf(t) === k).length,
      })),
    [allTasks],
  );

  const kindTasks = useMemo(
    () => allTasks.filter((t) => kindOf(t) === kindFilter),
    [allTasks, kindFilter],
  );

  // 状态 tab 仅对「工单任务」有意义
  const showStatusTabs = kindFilter === "工单任务";
  const tabs = ALL_TABS;

  const tabTasks = useMemo(
    () =>
      showStatusTabs
        ? kindTasks.filter((t) => statusOf(t) === activeTab)
        : kindTasks,
    [kindTasks, activeTab, showStatusTabs],
  );


  const allBarns = useMemo(() => {
    const s = new Set<string>();
    kindTasks.forEach((t) => s.add(inferBarn(t)));
    return Array.from(s);
  }, [kindTasks]);

  const allTypes = useMemo(() => {
    const s = new Set<string>();
    tabTasks.forEach((t) => s.add(t.type));
    return Array.from(s);
  }, [tabTasks]);

  // 基础事件：枚举牛只档案中的基础检查项目 + 转群/转栏
  const filterTypes = useMemo(
    () => (kindFilter === "基础事件" ? BASIC_EVENT_TYPES : allTypes),
    [kindFilter, allTypes],
  );



  const me = currentUserName(role);
  const mineCount = useMemo(
    () => kindTasks.filter((t) => assignees[t.id] === me).length,
    [kindTasks, assignees, me],
  );

  const tasks = useMemo(() => {
    let list =
      selectedBarns.size === 0
        ? tabTasks
        : tabTasks.filter((t) => selectedBarns.has(inferBarn(t)));
    if (mineOnly) list = list.filter((t) => assignees[t.id] === me);
    if (selectedTypes.size > 0)
      list = list.filter((t) => selectedTypes.has(t.type));
    // 异常排查：先按紧急等级（高 > 中 > 低），同级按出现时间由早到晚
    if (kindFilter === "异常排查") {
      list = [...list].sort(
        (a, b) =>
          URGENCY_RANK[a.urgency ?? "低"] - URGENCY_RANK[b.urgency ?? "低"] ||
          b.minutesAgo - a.minutesAgo,
      );
    }
    return list;
  }, [tabTasks, selectedBarns, mineOnly, assignees, me, selectedTypes, kindFilter]);







  const toggleBarn = (b: string) =>
    setSelectedBarns((prev) => {
      const next = new Set(prev);
      if (next.has(b)) next.delete(b);
      else next.add(b);
      return next;
    });

  const toggleType = (type: string) =>
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });

  // 基础事件下仅「孕检」「转群/转栏」可批量选择，且两类互斥
  const isBasicEvent = kindFilter === "基础事件";
  const selectableTask = (_t: HomeTask) => true;
  const selectedEventType = useMemo(() => {
    if (!isBasicEvent) return null;
    const first = tabTasks.find((t) => selected.has(t.id));
    return first?.type ?? null;
  }, [isBasicEvent, tabTasks, selected]);

  const toggle = (id: string) => {
    const task = tabTasks.find((t) => t.id === id);
    if (task && !selectableTask(task)) return;
    if (
      task &&
      isBasicEvent &&
      !selected.has(id) &&
      selectedEventType &&
      selectedEventType !== task.type
    ) {
      setTypeConflict({ current: selectedEventType, next: task.type });
      return;
    }
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };


  const selectableTasks = useMemo(
    () =>
      tasks.filter(
        (t) =>
          selectableTask(t) &&
          (!isBasicEvent || !selectedEventType || t.type === selectedEventType),
      ),
    [tasks, isBasicEvent, selectedEventType],
  );
  const allSelected =
    selectableTasks.length > 0 && selected.size === selectableTasks.length;
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(selectableTasks.map((t) => t.id)));
  };

  const exitSelect = () => {
    setSelectMode(false);
    setSelected(new Set());
  };

  const enterSelect = () => {
    setSelectMode(true);
    setSelected(new Set()); // 默认不选,由用户主动勾选范围
  };

  const count = selected.size;
  const filterCount =
    (activeTab !== "待执行" ? 1 : 0) + selectedTypes.size + selectedBarns.size;

  const filterSummary = useMemo(() => {
    if (filterCount === 0) return "筛选";
    const parts: string[] = [];
    if (activeTab !== "待执行") parts.push(activeTab);
    if (selectedTypes.size > 0) parts.push(`${selectedTypes.size} 类`);
    if (selectedBarns.size > 0) parts.push(`${selectedBarns.size} 舍`);
    return parts.join(" · ");
  }, [activeTab, selectedTypes, selectedBarns, filterCount]);


  return (
    <MobileShell hideTabBar>
      {/* 顶部栏 */}
      <header className="sticky top-0 z-30 bg-card/95 backdrop-blur border-b border-border px-3 h-12 flex items-center gap-2">
        <button
          type="button"
          onClick={() =>
            selectMode ? exitSelect() : navigate({ to: "/m/homepage" })
          }
          className="h-9 w-9 -ml-1 inline-flex items-center justify-center rounded-lg active:bg-surface-subtle"
          aria-label={selectMode ? "退出多选" : "返回"}
        >
          {selectMode ? (
            <X className="h-5 w-5 text-foreground" />
          ) : (
            <ChevronLeft className="h-5 w-5 text-foreground" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-body font-medium text-foreground leading-tight truncate">
            {selectMode ? `已选 ${count} 项` : "今日任务"}
          </div>
        </div>

        {selectMode && tasks.length > 0 && (
          <button
            type="button"
            onClick={toggleAll}
            className="h-8 px-3 rounded-full text-body-sm text-primary active:bg-brand-subtle"
          >
            {allSelected ? "取消全选" : "全选"}
          </button>
        )}
        {!selectMode && tasks.length > 0 && (
          <button
            type="button"
            onClick={enterSelect}
            className="h-8 px-3 rounded-full text-body-sm text-primary active:bg-brand-subtle"
          >
            批量选择

          </button>
        )}
      </header>



      {/* 顶层：三大任务类别 */}
      <div className="sticky top-12 z-20 bg-card/95 backdrop-blur border-b border-border px-2">
        <div className="flex">
          {kindOptions.map((o) => {
            const active = kindFilter === o.key;
            return (
              <button
                key={o.key}
                type="button"
                onClick={() => {
                  setKindFilter(o.key);
                  setActiveTab("待执行");
                  setSelectedBarns(new Set());
                  setSelectedTypes(new Set());
                  exitSelect();
                }}

                className={`relative flex-1 h-11 inline-flex items-center justify-center gap-1 text-body-sm ${
                  active ? "text-primary font-medium" : "text-text-secondary"
                }`}
              >
                <span>{o.key}</span>
                <span
                  className={`text-caption tabular-nums ${
                    active ? "text-primary" : "text-text-tertiary"
                  }`}
                >
                  {o.count}
                </span>
                {active && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-10 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 筛选条 */}
      <div className="px-4 pt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setBarnQuery("");
            setFilterSheetOpen(true);
          }}

          className={`h-9 px-3 inline-flex items-center gap-1.5 rounded-full border text-body-sm shrink-0 ${
            filterCount > 0
              ? "border-primary bg-brand-subtle text-primary"
              : "border-border bg-card text-text-secondary"
          }`}
        >
          <Filter className="h-4 w-4 shrink-0" />
          <span className="truncate max-w-[12rem]">{filterSummary}</span>
          {filterCount > 0 && (
            <span className="text-caption tabular-nums text-primary/70">
              {filterCount}
            </span>
          )}
          <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
        </button>

        {/* 与我有关 */}
        <button
          type="button"
          onClick={() => setMineOnly((v) => !v)}
          title="与我有关"
          className={`shrink-0 h-9 px-2.5 inline-flex items-center gap-1 rounded-full border text-body-sm ${
            mineOnly
              ? "border-primary bg-brand-subtle text-primary"
              : "border-border bg-card text-text-secondary"
          }`}
        >
          <UserCheck className="h-4 w-4 shrink-0" />
          <span className="text-caption tabular-nums opacity-70">{mineCount}</span>
        </button>
      </div>

      {/* 筛选条件抽屉 */}
      <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
        <SheetContent
          side="bottom"
          hideClose
          className="rounded-t-2xl p-0 max-h-[85vh] flex flex-col"
        >
          <SheetHeader className="px-5 pt-5 pb-3 flex flex-row items-center justify-between space-y-0">
            <SheetTitle className="text-section font-medium">筛选条件</SheetTitle>
            <button
              type="button"
              onClick={() => {
                setActiveTab("待执行");
                setSelectedBarns(new Set());
                setSelectedTypes(new Set());
                setMineOnly(false);
              }}
              className="text-body text-primary active:opacity-70"
            >
              重置
            </button>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-6">
            {/* 工单类型 / 事件类型 */}
            {(showStatusTabs || kindFilter === "基础事件") && (
              <section>
                <h4 className="text-body font-medium text-foreground mb-3">
                  {kindFilter === "基础事件" ? "事件类型" : "工单类型"}
                </h4>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTypes(new Set())}
                    className={`w-full h-12 px-4 flex items-center gap-3 rounded-xl border transition-colors ${
                      selectedTypes.size === 0
                        ? "border-primary bg-brand-subtle"
                        : "border-border bg-card"
                    }`}
                  >
                    <span className="flex-1 text-left text-body text-foreground">
                      全部类型
                    </span>
                    <span
                      className={`h-5 w-5 rounded-full flex items-center justify-center border ${
                        selectedTypes.size === 0
                          ? "bg-primary border-primary"
                          : "border-border bg-card"
                      }`}
                    >
                      {selectedTypes.size === 0 && (
                        <Check
                          className="h-3 w-3 text-primary-foreground"
                          strokeWidth={3}
                        />
                      )}
                    </span>
                  </button>
                  {filterTypes.map((type) => {
                    const meta = typeMeta[type] ?? typeMeta["疾病治疗"];
                    const Icon = meta.icon;
                    const sel = selectedTypes.has(type);
                    const cnt = tabTasks.filter((t) => t.type === type).length;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => toggleType(type)}
                        className={`w-full h-12 px-4 flex items-center gap-3 rounded-xl border transition-colors ${
                          sel ? "border-primary bg-brand-subtle" : "border-border bg-card"
                        }`}
                      >
                        <Icon className={`h-4 w-4 shrink-0 ${meta.text}`} />
                        <span className="flex-1 text-left text-body text-foreground">
                          {type}
                        </span>
                        <span className="text-body-sm tabular-nums text-text-tertiary">
                          {cnt}
                        </span>
                        <span
                          className={`h-5 w-5 rounded-full flex items-center justify-center border ${
                            sel ? "bg-primary border-primary" : "border-border bg-card"
                          }`}
                        >
                          {sel && (
                            <Check
                              className="h-3 w-3 text-primary-foreground"
                              strokeWidth={3}
                            />
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {/* 任务状态 */}
            {showStatusTabs && (
              <section>
                <h4 className="text-body font-medium text-foreground mb-3">任务状态</h4>
                <div className="flex flex-wrap gap-3">
                  {tabs.map((tb) => {
                    const sel = activeTab === tb;
                    const tabCount = kindTasks.filter(
                      (t) => statusOf(t) === tb,
                    ).length;
                    return (
                      <button
                        key={tb}
                        type="button"
                        onClick={() => {
                          setActiveTab(tb);
                          setSelectedTypes(new Set());
                        }}
                        className={`h-10 px-4 rounded-full border text-body inline-flex items-center gap-1.5 transition-colors ${
                          sel
                            ? "border-primary bg-brand-subtle text-primary"
                            : "border-border bg-card text-text-secondary"
                        }`}
                      >
                        <span>{tb}</span>
                        <span className="text-body-sm tabular-nums text-text-tertiary">
                          {tabCount}
                        </span>
                        {sel && (
                          <Check className="h-3.5 w-3.5 text-primary ml-0.5" strokeWidth={3} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {/* 牛舍 */}
            <section>
              <h4 className="text-body font-medium text-foreground mb-3">牛舍</h4>
              <input
                value={barnQuery}
                onChange={(e) => setBarnQuery(e.target.value)}
                placeholder="搜索牛舍"
                className="w-full h-11 px-4 rounded-xl bg-surface-subtle text-body text-foreground placeholder:text-text-tertiary outline-none mb-3"
              />
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setSelectedBarns(new Set())}
                  className={`w-full h-12 px-4 flex items-center gap-3 rounded-xl border transition-colors ${
                    selectedBarns.size === 0
                      ? "border-primary bg-brand-subtle"
                      : "border-border bg-card"
                  }`}
                >
                  <span className="flex-1 text-left text-body text-foreground">
                    全部牛舍
                  </span>
                  <span
                    className={`h-5 w-5 rounded-full flex items-center justify-center border ${
                      selectedBarns.size === 0
                        ? "bg-primary border-primary"
                        : "border-border bg-card"
                    }`}
                  >
                    {selectedBarns.size === 0 && (
                      <Check
                        className="h-3 w-3 text-primary-foreground"
                        strokeWidth={3}
                      />
                    )}
                  </span>
                </button>
                {allBarns
                  .filter((b) => b.includes(barnQuery.trim()))
                  .map((b) => {
                    const sel = selectedBarns.has(b);
                    const cnt = kindTasks.filter((t) => inferBarn(t) === b).length;
                    return (
                      <button
                        key={b}
                        type="button"
                        onClick={() => toggleBarn(b)}
                        className={`w-full h-12 px-4 flex items-center gap-3 rounded-xl border transition-colors ${
                          sel ? "border-primary bg-brand-subtle" : "border-border bg-card"
                        }`}
                      >
                        <span className="flex-1 text-left text-body text-foreground">
                          {b}
                        </span>
                        <span className="text-body-sm tabular-nums text-text-tertiary">
                          {cnt} 个任务
                        </span>
                        <span
                          className={`h-5 w-5 rounded-full flex items-center justify-center border ${
                            sel ? "bg-primary border-primary" : "border-border bg-card"
                          }`}
                        >
                          {sel && (
                            <Check
                              className="h-3 w-3 text-primary-foreground"
                              strokeWidth={3}
                            />
                          )}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </section>
          </div>

          <div className="px-5 py-4 border-t border-border">
            <button
              type="button"
              onClick={() => setFilterSheetOpen(false)}
              className="w-full h-12 rounded-full bg-primary text-primary-foreground text-body font-medium active:opacity-90"
            >
              确定
            </button>
          </div>
        </SheetContent>
      </Sheet>





      {/* 列表 */}
      <div className={`px-4 pt-3 ${selectMode ? "pb-[120px]" : "pb-6"} space-y-2.5`}>
        {tasks.length === 0 ? (
          <div className="mt-6 rounded-2xl bg-card border border-border">
            <EmptyState
              icon={Inbox}
              size="sm"
              title={
                role === "admin"
                  ? "管理员无待办任务"
                  : !tabHandledByRole(role, activeTab)
                    ? `${activeTab}由兽医/场长处理`
                    : selectedBarns.size > 0
                      ? "所选牛舍暂无该状态任务"
                      : "今日暂无该状态任务"
              }
              desc={role === "admin" ? "可在工单列表中查看全场工单" : undefined}
            />
          </div>
        ) : (
          tasks.map((t) => {
            const isExam = t.kind === "基础事件";
            const isAlert = t.kind === "异常排查";
            const meta = typeMeta[t.type] ?? typeMeta["疾病治疗"];
            const Icon = meta.icon;
            const checked = selected.has(t.id);
            const chip: TaskChip | null = isAlert
              ? t.cattleId && handledAlerts.has(t.cattleId)
                ? "已完成"
                : "待执行"
              : isExam
                ? "待执行"
                : t.type === "疾病治疗"
                  ? diseaseTaskMeta[t.id]?.task ?? null
                  : "待执行";
            const barn = inferBarn(t);
            const alertHandled = isAlert && t.cattleId && handledAlerts.has(t.cattleId);
            const actionText = isAlert
              ? alertHandled
                ? "查看记录"
                : "查看详情"
              : isExam
                ? "记录"
                : activeTab === "待执行"
                  ? "执行"
                  : activeTab === "待复查"
                    ? "复查"
                    : "诊断";

            const linkTo = "/m/health/$id/execute" as const;


            const cattleId = t.target.startsWith("#") ? t.target : null;
            const groupTarget = cattleId ? null : t.target;
            const pk = activeTab === "待执行" && !isExam && !isAlert ? pickupForWO(t.id) : null;

            const tabChip: TaskChip =
              activeTab === "待诊断" ? "待诊断" : activeTab === "待复查" ? "待复查" : "待执行";
            const actionLine = taskCardContent(t, tabChip);
            const timeAgo = `${((tasks.indexOf(t) + 1) * 2) % 59 || 2}分钟前`;

            const inner = (
              <div className="px-3.5 py-3">
                {/* 顶部:类型 + 编号 + 状态 + 时间 */}
                <div className="flex items-center gap-1.5">
                  <span
                    className={`h-5 w-5 rounded-full ${meta.bg} ${meta.text} inline-flex items-center justify-center shrink-0`}
                  >
                    <Icon className="h-3 w-3" strokeWidth={2} />
                  </span>
                  <span className="text-body-sm text-text-secondary">{t.type}</span>
                  {!isExam && !isAlert && (
                    <span className="text-caption text-text-tertiary font-mono">{t.id}</span>
                  )}

                  {chip && (
                    <span
                      className={`inline-flex items-center px-1.5 h-[18px] rounded-full text-caption leading-none ${taskChipStyle[chip]}`}
                    >
                      {chip}
                    </span>
                  )}
                  <div className="ml-auto flex items-center gap-1.5">
                    <span className="text-caption text-text-tertiary">{timeAgo}</span>
                    {selectMode && (
                      <span
                        className={`h-[18px] w-[18px] rounded inline-flex items-center justify-center shrink-0 border ${
                          checked
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-border bg-card"
                        }`}
                        aria-hidden
                      >
                        {checked && <Check className="h-3 w-3" strokeWidth={3} />}
                      </span>
                    )}
                  </div>
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
                  <div className="mt-1 text-body-sm truncate">
                    <span className="text-text-tertiary mr-1.5">责任人</span>
                    {assignees[t.id] ? (
                      <AssigneeBadge name={assignees[t.id]} />
                    ) : (
                      <span className="text-text-disabled">未指定</span>
                    )}
                  </div>
                </div>


                {/* 底部:领物 + 操作 */}
                <div className="mt-3 flex items-center justify-between">
                  {isExam || isAlert ? (
                    <span className="inline-flex items-center gap-1 text-caption text-text-tertiary">
                      <Package className="h-3.5 w-3.5" />
                      无需领物
                    </span>
                  ) : activeTab === "待诊断" ? (

                    <span className="inline-flex items-center gap-1 text-caption text-text-tertiary">
                      <Package className="h-3.5 w-3.5" />
                      -
                    </span>
                  ) : activeTab === "待复查" ? (
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

                  {!selectMode && (
                    <span className="inline-flex items-center gap-0.5 text-body-sm text-primary">
                      {actionText}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>
              </div>
            );

            const cls = `block rounded-2xl border bg-card overflow-hidden active:bg-surface-subtle ${
              checked
                ? "border-primary ring-1 ring-primary/30"
                : "border-border"
            }`;

            return selectMode ? (
              <button
                key={t.id}
                type="button"
                disabled={!selectableTask(t)}
                onClick={() => toggle(t.id)}
                className={
                  cls +
                  " w-full text-left" +
                  (selectableTask(t)
                    ? ""
                    : " opacity-45 grayscale pointer-events-none")
                }
              >
                {inner}
              </button>
            ) : isAlert ? (
              <Link
                key={t.id}
                to="/m/animals-{$id}"
                params={{ id: t.cattleId ?? t.target.replace("#", "") }}
                className={cls}
              >
                {inner}
              </Link>
            ) : isExam ? (
              <Link
                key={t.id}
                to="/m/events/$type/$id"
                params={{
                  type: t.type === "转群/转栏" ? "transfer" : "exam",
                  id: t.target.replace("#", ""),
                }}
                search={{ item: t.type }}
                className={cls}
              >
                {inner}
              </Link>
            ) : activeTab === "待诊断" ? (
              <Link
                key={t.id}
                to="/m/health/$id"
                params={{ id: t.id }}
                search={{ tab: "review" as const }}
                className={cls}
              >
                {inner}
              </Link>
            ) : (

              <Link
                key={t.id}
                to={linkTo}
                params={{ id: t.id }}
                className={cls}
              >
                {inner}
              </Link>
            );


          })
        )}
      </div>

      {/* 底部操作栏(多选态):按流程单一 CTA — 先取药,再拍照记录 */}
      {selectMode && tasks.length > 0 && (() => {
        const selectedTasks = tasks.filter((t) => selected.has(t.id));
        const allIds = selectedTasks.map((t) => t.id).join(",");
        const canExecuteBatch = role !== "manager";
        // 批量执行条件：同类免疫/驱虫工单且具体内容一致，或同一基础事件
        const first = selectedTasks[0];
        const batchExecOk = (() => {
          if (!first) return false;
          if (isBasicEvent)
            return selectedTasks.every((t) => t.type === first.type);
          if (first.type !== "疫苗免疫" && first.type !== "驱虫") return false;
          if (!selectedTasks.every((t) => t.type === first.type)) return false;
          const txt = taskCardContent(first, "待执行");
          return selectedTasks.every(
            (t) => taskCardContent(t, "待执行") === txt,
          );
        })();
        const subText =
          count === 0
            ? isBasicEvent
              ? "勾选同一类基础事件任务"
              : "勾选要一次处理的任务"
            : batchExecOk
              ? isBasicEvent
                ? `批量${first?.type ?? ""}`
                : `批量${first?.type ?? ""} · 内容一致`
              : isBasicEvent
                ? "需为同一基础事件任务"
                : "需为同类免疫/驱虫工单且内容一致";
        return (
          <div className="fixed bottom-0 inset-x-0 z-30 bg-card/95 backdrop-blur border-t border-border px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+12px)] max-w-[440px] mx-auto">
            <div className="flex items-center justify-between mb-2">
              <div className="text-body-sm text-foreground">
                已选{" "}
                <span className="text-primary font-semibold tabular-nums">
                  {count}
                </span>{" "}
                <span className="text-text-tertiary">/ {tasks.length}</span>
              </div>
              <div className="text-caption text-text-tertiary truncate ml-2">
                {subText}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {canAssign && (
                <button
                  type="button"
                  disabled={count === 0}
                  onClick={() => {
                    setStaffQuery("");
                    setAssignSheetOpen(true);
                  }}
                  className={`h-11 rounded-full border border-primary text-primary text-body-sm font-medium inline-flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none active:scale-[.97] transition-transform ${
                    canExecuteBatch ? "flex-1" : "w-full"
                  }`}
                >
                  <UserRound className="h-4 w-4" />
                  指定责任人
                </button>
              )}
              {canExecuteBatch && (
                <button
                  type="button"
                  disabled={count === 0 || !batchExecOk}
                  onClick={() => {
                    if (isBasicEvent) {
                      navigate({
                        to: "/m/events/$type/$id",
                        params: {
                          type: first!.type === "转群/转栏" ? "transfer" : "exam",
                          id: first!.target.replace("#", ""),
                        },
                        search: { item: first!.type, batch: allIds },
                      });
                      return;
                    }
                    navigate({
                      to: "/m/health/$id/execute",
                      params: { id: first!.id },
                      search: { merge: allIds },
                    });
                  }}
                  className="flex-1 h-11 rounded-full bg-primary text-primary-foreground text-body-sm font-medium inline-flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none active:scale-[.97] transition-transform"
                >
                  <Camera className="h-4 w-4" />
                  开始执行
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        );
      })()}

      {/* 指定责任人抽屉 */}
      <Sheet open={assignSheetOpen} onOpenChange={setAssignSheetOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl p-0 max-h-[80vh] flex flex-col"
        >
          <SheetHeader className="px-4 pt-4 pb-2">
            <SheetTitle className="text-section">指定责任人</SheetTitle>
          </SheetHeader>
          <div className="px-4 py-2">
            <input
              value={staffQuery}
              onChange={(e) => setStaffQuery(e.target.value)}
              placeholder="搜索姓名或岗位"
              className="w-full h-10 px-3 rounded-xl bg-surface-subtle text-body-sm outline-none"
            />
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-2">
            {(() => {
              const kw = staffQuery.trim();
              const list = SHIFT_STAFF.filter(
                (s) => !kw || s.name.includes(kw) || roleLabel[s.role].includes(kw),
              );
              const onShift = list.filter((s) => s.onShift);
              const off = list.filter((s) => !s.onShift);

              const renderItem = (s: (typeof SHIFT_STAFF)[number]) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    const existing = Array.from(selected).filter(
                      (id) => assignees[id] && assignees[id] !== s.name,
                    );
                    if (existing.length > 0) {
                      setPendingAssignee(s);
                      return;
                    }
                    commitAssign(s);
                  }}
                  className={
                    "w-full min-h-12 px-4 py-3 flex items-center gap-3 rounded-xl border active:bg-surface-subtle " +
                    (s.onShift
                      ? "border-border bg-card"
                      : "border-border bg-card opacity-50")
                  }
                >
                  <span
                    className={
                      "h-8 w-8 rounded-full inline-flex items-center justify-center text-caption shrink-0 " +
                      (s.onShift
                        ? "bg-brand-subtle text-primary"
                        : "bg-muted text-text-tertiary")
                    }
                  >
                    {s.name.slice(0, 1)}
                  </span>
                  <span className="flex-1 text-left flex items-center gap-2 min-w-0">
                    <span
                      className={
                        "text-body truncate " +
                        (s.onShift ? "text-foreground" : "text-text-tertiary")
                      }
                    >
                      {s.name}
                    </span>
                    {!s.onShift && (
                      <span className="shrink-0 text-caption text-text-tertiary">
                        {offReasonLabel[s.offReason ?? "absent"]}
                      </span>
                    )}
                  </span>
                  <span className="text-body-sm text-text-tertiary">
                    {roleLabel[s.role]}
                  </span>
                  <ChevronRight className="h-4 w-4 text-text-tertiary" />
                </button>
              );

              return <>{[...onShift, ...off].map(renderItem)}</>;
            })()}
          </div>

        </SheetContent>
      </Sheet>

      {/* 覆盖已有责任人确认 */}
      <AlertDialog
        open={!!pendingAssignee}
        onOpenChange={(o: boolean) => !o && setPendingAssignee(null)}
      >
        <AlertDialogContent className="max-w-[320px] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-section">更新责任人</AlertDialogTitle>
            <AlertDialogDescription className="text-body-sm">
              当前有{" "}
              {
                Array.from(selected).filter(
                  (id) => assignees[id] && assignees[id] !== pendingAssignee?.name,
                ).length
              }{" "}
              项任务已有指定责任人，是否更新责任人为 {pendingAssignee?.name}？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pendingAssignee && commitAssign(pendingAssignee)}
            >
              确认更新
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>





      {/* 完成弹窗 */}
      {done && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center"
          onClick={() => setDone(null)}
        >
          <div
            className="w-full max-w-[440px] bg-card rounded-t-2xl sm:rounded-2xl p-5 pb-[calc(env(safe-area-inset-bottom)+20px)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <span className="h-12 w-12 rounded-full bg-brand-subtle text-primary inline-flex items-center justify-center mb-3">
                <CheckCircle2 className="h-6 w-6" />
              </span>
              <div className="text-card-title text-foreground">
                已为 {count} 项任务上传执行照片
              </div>
              <div className="text-caption text-text-tertiary mt-1">
                结果已同步至对应工单
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setDone(null);
                  exitSelect();
                }}
                className="h-10 rounded-lg border border-border text-body-sm text-text-secondary active:bg-surface-subtle"
              >
                继续浏览
              </button>
              <Link
                to="/m/homepage"
                className="h-10 rounded-lg bg-primary text-primary-foreground text-body-sm font-medium inline-flex items-center justify-center"
              >
                返回首页
              </Link>
            </div>
          </div>
        </div>
      )}
      {/* 基础事件类型互斥提示 */}
      {typeConflict && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-6"
          onClick={() => setTypeConflict(null)}
        >
          <div
            className="w-full max-w-[320px] rounded-2xl bg-card p-5 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-card-title text-foreground">不可混选</h3>
            <p className="text-body-sm text-text-secondary leading-relaxed">
              当前已选择「{typeConflict.current}」任务，无法同时选择「
              {typeConflict.next}」。请分别批量处理。
            </p>
            <button
              type="button"
              onClick={() => setTypeConflict(null)}
              className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-body-sm"
            >
              我知道了
            </button>
          </div>
        </div>
      )}

    </MobileShell>
  );
}
