import { useState } from "react";
import { Settings2, Check, RotateCcw, ChevronUp, ChevronDown, GripVertical } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import {
  scopeOptions,
  topicMeta,
  setScope,
  setTopicVisible,
  moveTopic,
  resetScopeConfig,
  useDashboardView,
  type ReportScope,
  type TopicKey,
} from "@/lib/dashboard-view";

export function ViewSettingsSheet() {
  const { scope, config, order } = useDashboardView();
  const [open, setOpen] = useState(false);
  const [editScope, setEditScope] = useState<ReportScope>(scope);

  const current = config[editScope];
  const visibleCount = topicMeta.filter((t) => current[t.key]).length;
  const orderedTopics = (order[editScope] ?? topicMeta.map((t) => t.key))
    .map((k: TopicKey) => topicMeta.find((t) => t.key === k)!)
    .filter(Boolean);


  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setEditScope(scope);
      }}
    >
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="看板视角设置"
          title="看板视角设置"
          className="h-9 w-9 shrink-0 inline-flex items-center justify-center rounded-lg border border-border bg-card text-text-secondary transition-colors hover:text-primary hover:border-primary/40"
        >
          <Settings2 className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </SheetTrigger>
      <SheetContent className="w-[380px] sm:max-w-[380px] flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <SheetTitle className="text-section-title">看板视角设置</SheetTitle>
          <SheetDescription className="text-caption">
            选择当前视角，并配置该视角下各类专题的显隐
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-body-sm font-medium text-foreground">
                专题显隐与排序
                <span className="ml-1.5 text-caption text-text-tertiary">
                  已开启 {visibleCount}/{topicMeta.length}
                </span>
              </p>
              <button
                type="button"
                onClick={() => resetScopeConfig(editScope)}
                className="inline-flex items-center gap-1 text-caption text-text-secondary hover:text-primary"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                恢复默认
              </button>
            </div>
            <div className="rounded-xl border border-border bg-card divide-y divide-border">
              {orderedTopics.map((t, i) => (
                <div key={t.key} className="flex items-center justify-between gap-2 px-3.5 py-2.5">
                  <span className="flex min-w-0 items-center gap-2">
                    <GripVertical className="h-3.5 w-3.5 shrink-0 text-text-tertiary" />
                    <span className="truncate text-body-sm text-foreground">{t.label}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      aria-label="上移"
                      disabled={i === 0}
                      onClick={() => moveTopic(editScope, t.key, -1)}
                      className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-border text-text-secondary transition-colors hover:text-primary hover:border-primary/40 disabled:opacity-35 disabled:hover:text-text-secondary disabled:hover:border-border"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="下移"
                      disabled={i === orderedTopics.length - 1}
                      onClick={() => moveTopic(editScope, t.key, 1)}
                      className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-border text-text-secondary transition-colors hover:text-primary hover:border-primary/40 disabled:opacity-35 disabled:hover:text-text-secondary disabled:hover:border-border"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                    <Switch
                      className="ml-1"
                      checked={current[t.key]}
                      onCheckedChange={(v) => setTopicVisible(editScope, t.key, v)}
                    />
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-caption text-text-tertiary">
              显隐与排序仅作用于「{scopeOptions.find((s) => s.key === editScope)?.label}」视角。
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
