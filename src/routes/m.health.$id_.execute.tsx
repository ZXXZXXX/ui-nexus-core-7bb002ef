import { createFileRoute, useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { MobileShell } from "@/components/mobile-shell";
import { useRole } from "@/lib/mobile-role";
import { ActiveDayExecute } from "./m.health.$id";

export const Route = createFileRoute("/m/health/$id_/execute")({
  head: () => ({ meta: [{ title: "执行记录 · 奇点智牧" }] }),
  validateSearch: (s: Record<string, unknown>): { return?: string; batchIds?: string; batchDone?: string; merge?: string } => ({
    return: typeof s.return === "string" ? s.return : undefined,
    merge: typeof s.merge === "string" ? s.merge : "",
    batchIds: typeof s.batchIds === "string" ? s.batchIds : "",
    batchDone: typeof s.batchDone === "string" ? s.batchDone : "",
  }),
  component: ExecuteRecordPage,
});

function ExecuteRecordPage() {
  const { id } = useParams({ from: "/m/health/$id_/execute" });
  const search = useSearch({ from: "/m/health/$id_/execute" });
  const role = useRole();
  const navigate = useNavigate();

  const isLoss = id.startsWith("LS");
  const isHoof = !isLoss && (role === "hoof_trimmer" || id.startsWith("HF"));

  const singleEarMap: Record<string, string> = {
    "WO-2298": "#01-24-2298",
    "HF-0702": "#01-24-2150",
    "HF-0688": "#01-24-2270",
  };
  const singleEar = singleEarMap[id];
  const isSingle = true;
  const earTag = singleEar ?? (isHoof ? "#01-24-2150" : "#01-24-2381");
  const execTags: string[] = [earTag];

  // 合并批量执行：merge = 任务 id 列表
  const mergeIds = (search.merge ?? "").split(",").filter(Boolean);
  const isMerge = mergeIds.length > 1;

  const pickupCode = isLoss ? null : `PK-${id.replace(/^WO-?/i, "")}`;

  const [ready, setReady] = useState(false);
  const handleReady = useCallback((r: boolean) => setReady(r), []);

  const handleSubmit = () => {
    if (!ready) return;
    toast.success(isMerge ? `已提交 ${mergeIds.length} 项执行记录` : "提交成功");

    if (isMerge) {
      navigate({ to: "/m/health/today", search: {} });
      return;
    }

    if (search.return === "batch") {
      const doneList = (search.batchDone ?? "").split(",").filter(Boolean);
      if (!doneList.includes(id)) doneList.push(id);
      navigate({
        to: "/m/health/today/batch",
        search: { ids: search.batchIds ?? "", done: doneList.join(",") },
      });
      return;
    }

    navigate({ to: "/m/health/$id", params: { id }, search: { tab: "execute" } });
  };

  const backConfig =
    search.return === "batch"
      ? {
          to: "/m/health/today/batch" as const,
          search: { ids: search.batchIds ?? "", done: search.batchDone ?? "" },
        }
      : true;

  return (
    <MobileShell title="执行记录" back={backConfig} hideTabBar>
      <div className="pb-28">
        <div className="px-4 pt-3 pb-2">
          {isMerge ? (
            <div className="text-caption text-text-tertiary inline-flex items-center gap-1.5">
              <span>批量执行</span>
              <span className="text-text-secondary">
                共计 <span className="text-primary tabular-nums font-medium">{mergeIds.length}</span> 个任务
              </span>
              <span className="text-text-tertiary">·</span>
              <span className="text-text-secondary">
                <span className="text-primary tabular-nums font-medium">{mergeIds.length}</span> 头牛只
              </span>
            </div>
          ) : (
            <div className="text-caption text-text-tertiary inline-flex items-center gap-1.5">
              <span>工单</span>
              <span className="font-mono text-text-secondary">{id}</span>
              <span className="text-text-tertiary">·</span>
              <span className="font-mono text-text-secondary">{earTag}</span>
            </div>
          )}
        </div>
        <div className="px-4 space-y-3">
          <ActiveDayExecute pickupCode={pickupCode} tags={execTags} workOrderId={id} onReadyChange={handleReady} batchCount={isMerge ? mergeIds.length : 1} />
        </div>
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] bg-card border-t border-border p-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
        <button
          disabled={!ready}
          onClick={handleSubmit}
          className="w-full h-11 rounded-lg bg-primary text-primary-foreground text-body inline-flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="h-4 w-4" /> 提交记录
        </button>
      </div>
    </MobileShell>
  );
}
