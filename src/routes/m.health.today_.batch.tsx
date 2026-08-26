import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ChevronLeft,
  Camera,
  X,
  Search,
  Check,
  CheckCircle2,
  ChevronRight,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";
import { MobileShell } from "@/components/mobile-shell";
import { EmptyState } from "@/components/empty-state";
import { homeTasks, typeMeta, type HomeTask } from "@/routes/m.homepage";

export const Route = createFileRoute("/m/health/today_/batch")({
  validateSearch: (s: Record<string, unknown>): { ids?: string; done?: string } => ({
    ids: typeof s.ids === "string" ? s.ids : "",
    done: typeof s.done === "string" ? s.done : "",
  }),
  head: () => ({ meta: [{ title: "批量执行 · 奇点智牧" }] }),
  component: BatchExecutePage,
});

function inferBarn(t: HomeTask): string {
  if (!t.target.startsWith("#")) return t.target.split(" · ")[0];
  const tail = t.target.slice(-1);
  const n = Number.isFinite(Number(tail)) ? Number(tail) : 1;
  return `${(n % 4) + 1} 号牛舍`;
}

function earSortKey(t: HomeTask): string {
  return t.target.startsWith("#") ? t.target.slice(1) : "\uffff" + t.target;
}

function StatusBadge({ done }: { done: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 px-1.5 h-[20px] rounded text-caption leading-none ${
        done
          ? "bg-[color-mix(in_oklab,var(--state-success)_15%,transparent)] text-[var(--state-success)]"
          : "bg-surface-subtle text-text-tertiary"
      }`}
    >
      {done && <Check className="h-3 w-3" strokeWidth={3} />}
      {done ? "已完成" : "未完成"}
    </span>
  );
}

const SIMPLE_CONCLUSIONS: Record<string, string[]> = {
  "孕检": ["已孕", "空怀", "可疑"],
  "转群/转栏": ["已完成转群", "未转群"],
};

function SimpleForm({
  options,
  value,
  onChange,
  photos,
  onPhotos,
}: {
  options: string[];
  value: string | null;
  onChange: (v: string) => void;
  photos: number;
  onPhotos: (n: number) => void;
}) {
  return (
    <div className="px-3.5 pb-3.5 pt-0 space-y-3 border-t border-border/60">
      <div className="pt-3">
        <div className="text-caption text-text-tertiary mb-1.5">
          结论 <span className="text-[var(--state-error)]">*</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {options.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => onChange(o)}
              className={`h-8 px-3 rounded-full text-body-sm border transition-colors ${
                value === o
                  ? "border-primary bg-[color-mix(in_oklab,var(--primary)_10%,transparent)] text-primary"
                  : "border-border text-text-secondary"
              }`}
            >
              {o}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="text-caption text-text-tertiary mb-1.5">现场照片</div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: photos }).map((_, i) => (
            <div
              key={i}
              className="relative h-16 w-16 rounded-lg bg-surface-subtle border border-border overflow-hidden flex items-center justify-center"
            >
              <Camera className="h-4 w-4 text-text-tertiary" />
              <button
                type="button"
                onClick={() => onPhotos(photos - 1)}
                className="absolute top-0 right-0 h-4 w-4 rounded-bl-lg bg-black/50 text-white inline-flex items-center justify-center"
                aria-label="删除"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
          {photos < 3 && (
            <button
              type="button"
              onClick={() => onPhotos(photos + 1)}
              className="h-16 w-16 rounded-lg border border-dashed border-border text-text-tertiary inline-flex flex-col items-center justify-center gap-0.5"
            >
              <Camera className="h-4 w-4" />
              <span className="text-caption">拍照</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function BatchExecutePage() {
  const { ids, done } = useSearch({ from: "/m/health/today_/batch" });
  const navigate = useNavigate();

  const doneSet = useMemo(() => new Set((done ?? "").split(",").filter(Boolean)), [done]);

  const tasks = useMemo(() => {
    const idSet = new Set((ids ?? "").split(",").filter(Boolean));

    return homeTasks
      .filter((t) => idSet.has(t.id))
      .sort((a, b) => earSortKey(a).localeCompare(earSortKey(b)));
  }, [ids]);

  const [q, setQ] = useState("");
  // 孕检 / 转群转栏：仅需结论 + 照片，直接在本页内录入
  const [simple, setSimple] = useState<
    Record<string, { conclusion: string | null; photos: number }>
  >({});
  const simpleDone = (t: HomeTask) =>
    !!simple[t.id]?.conclusion && (simple[t.id]?.photos ?? 0) > 0;

  const visibleTasks = useMemo(() => {
    const kw = q.trim().toLowerCase();
    if (!kw) return tasks;
    return tasks.filter(
      (t) =>
        t.target.toLowerCase().includes(kw) ||
        t.id.toLowerCase().includes(kw),
    );
  }, [tasks, q]);

  const isSimple = (t: HomeTask) => !!SIMPLE_CONCLUSIONS[t.type];
  const taskDone = (t: HomeTask) =>
    isSimple(t) ? simpleDone(t) : doneSet.has(t.id);
  const doneCount = tasks.filter(taskDone).length;
  const allDone = tasks.length > 0 && doneCount === tasks.length;

  const goExecute = (id: string) => {
    if (doneSet.has(id)) return;
    navigate({
      to: "/m/health/$id/execute",
      params: { id },
      search: { return: "batch", batchIds: ids, batchDone: done },
    });
  };

  const submitAll = () => {
    if (!allDone) return;
    toast.success(`已提交 ${tasks.length} 项执行记录`);
    navigate({ to: "/m/health/today" });
  };

  return (
    <MobileShell hideTabBar>
      {/* 顶部栏 */}
      <header className="sticky top-0 z-30 bg-card/95 backdrop-blur border-b border-border px-3 h-12 flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate({ to: "/m/health/today" })}
          className="h-9 w-9 -ml-1 inline-flex items-center justify-center rounded-lg active:bg-surface-subtle"
          aria-label="返回"
        >
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-body font-medium text-foreground leading-tight truncate">
            批量执行
          </div>
          <div className="text-caption text-text-tertiary">
            共 {tasks.length} 项 · 已完成{" "}
            <span className="text-primary tabular-nums">{doneCount}</span>
          </div>
        </div>
      </header>

      {/* 搜索 */}
      <div className="sticky top-12 z-20 bg-card/95 backdrop-blur border-b border-border px-4 py-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索耳号快速定位"
            className="h-9 w-full pl-9 pr-3 rounded-lg bg-surface-subtle border border-border text-body-sm placeholder:text-text-tertiary focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* 列表 */}
      <div className="px-4 pt-3 pb-[120px] space-y-2.5">
        {visibleTasks.length === 0 ? (
          <div className="mt-6 rounded-2xl bg-card border border-border">
            <EmptyState icon={Inbox} size="sm" title="没有匹配的任务" />
          </div>
        ) : (
          visibleTasks.map((t) => {
            const meta = typeMeta[t.type] ?? typeMeta["疾病治疗"];
            const Icon = meta.icon;
            const simpleMode = isSimple(t);
            const isDone = taskDone(t);
            const barn = inferBarn(t);

            return (
              <article
                key={t.id}
                className={`rounded-2xl border bg-card overflow-hidden transition-colors ${
                  isDone
                    ? "border-[color-mix(in_oklab,var(--state-success)_40%,transparent)] bg-[color-mix(in_oklab,var(--state-success)_3%,transparent)]"
                    : "border-border"
                }`}
              >
                {/* Header（已完成不可点击） */}
                <button
                  type="button"
                  disabled={isDone && !simpleMode}
                  onClick={() => {
                    if (simpleMode) return;
                    goExecute(t.id);
                  }}
                  className="w-full text-left px-3.5 py-3 flex items-center gap-2 active:bg-surface-subtle disabled:pointer-events-none disabled:opacity-80"
                >
                  <span
                    className={`h-5 w-5 rounded-full ${meta.bg} ${meta.text} inline-flex items-center justify-center shrink-0`}
                  >
                    <Icon className="h-3 w-3" strokeWidth={2} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2 min-w-0">
                      <span className={`text-[15px] font-semibold font-mono truncate ${isDone ? "text-text-tertiary" : "text-foreground"}`}>
                        {t.target}
                      </span>
                      <span className="text-caption text-text-tertiary shrink-0 truncate">
                        {barn}
                      </span>
                    </div>
                    <div className="text-caption text-text-tertiary mt-0.5">
                      <span className="font-mono">{t.id}</span>
                      <span className="mx-1">·</span>
                      <span>{t.type}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <StatusBadge done={isDone} />
                    {!isDone && !simpleMode && (
                      <ChevronRight className="h-4 w-4 text-text-tertiary" />
                    )}
                  </div>
                </button>
                {simpleMode && (
                  <SimpleForm
                    options={SIMPLE_CONCLUSIONS[t.type]!}
                    value={simple[t.id]?.conclusion ?? null}
                    onChange={(v) =>
                      setSimple((prev) => ({
                        ...prev,
                        [t.id]: {
                          conclusion: v,
                          photos: prev[t.id]?.photos ?? 0,
                        },
                      }))
                    }
                    photos={simple[t.id]?.photos ?? 0}
                    onPhotos={(n) =>
                      setSimple((prev) => ({
                        ...prev,
                        [t.id]: {
                          conclusion: prev[t.id]?.conclusion ?? null,
                          photos: Math.max(0, n),
                        },
                      }))
                    }
                  />
                )}
              </article>
            );
          })
        )}
      </div>

      {/* 底部：一次性提交 */}
      <div className="fixed bottom-0 inset-x-0 z-30 bg-card/95 backdrop-blur border-t border-border px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+12px)] max-w-[440px] mx-auto">
        <div className="flex items-center justify-between mb-2">
          <div className="text-body-sm text-foreground">
            已完成{" "}
            <span className="text-primary font-semibold tabular-nums">
              {doneCount}
            </span>{" "}
            <span className="text-text-tertiary">/ {tasks.length}</span>
          </div>
          <div className="text-caption text-text-tertiary">
            {allDone ? "全部录入完毕，可完成" : "完成所有卡片后可用"}
          </div>
        </div>
        <button
          type="button"
          disabled={!allDone}
          onClick={submitAll}
          className="w-full h-11 rounded-full bg-primary text-primary-foreground text-body-sm font-medium inline-flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none active:scale-[.97] transition-transform"
        >
          <CheckCircle2 className="h-4 w-4" />
          完成 {tasks.length} 项
        </button>
      </div>
    </MobileShell>
  );
}
