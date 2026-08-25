import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { StatScopeCard, symptomStats } from "@/components/stat-scope-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Activity, Plus, Search, Pencil, Trash2, X, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { KB_SYMPTOMS, diseaseName } from "@/lib/disease-kb";

export const Route = createFileRoute("/knowledge/symptom")({
  head: () => ({ meta: [{ title: "症状知识库 — 奇点智牧" }] }),
  component: SymptomKBPage,
});

type Symptom = { id: string; name: string; related: string[]; urgency: string };

const seed: Symptom[] = KB_SYMPTOMS.map((s) => ({
  id: s.id,
  name: s.name,
  related: s.diseases.map(diseaseName),
  urgency: s.diseases.length >= 8 ? "高" : s.diseases.length >= 3 ? "中" : "低",
}));

function SymptomKBPage() {
  const [list, setList] = useState<Symptom[]>(seed);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Symptom | null>(null);
  const [viewing, setViewing] = useState<Symptom | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string[] | null>(null);

  const allChecked = list.length > 0 && selected.size === list.length;
  const someChecked = selected.size > 0 && !allChecked;

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const toggleAll = () => setSelected(allChecked ? new Set() : new Set(list.map((s) => s.id)));

  const confirmDelete = () => {
    if (!pendingDelete) return;
    setList((prev) => prev.filter((s) => !pendingDelete.includes(s.id)));
    setSelected((prev) => {
      const next = new Set(prev);
      pendingDelete.forEach((id) => next.delete(id));
      return next;
    });
    toast.success(`已删除 ${pendingDelete.length} 条症状`);
    setPendingDelete(null);
  };

  const saveEdit = () => {
    if (!editing) return;
    setList((prev) => prev.map((s) => (s.id === editing.id ? editing : s)));
    toast.success("已保存");
    setEditing(null);
  };

  const batchEdit = () => {
    if (selected.size === 1) {
      const one = list.find((s) => s.id === Array.from(selected)[0]);
      if (one) setEditing({ ...one });
    } else {
      toast.info("批量编辑仅支持单条，多条请逐条编辑或使用批量删除");
    }
  };

  const headerCheckRef = useMemo(
    () => (el: HTMLButtonElement | null) => {
      if (el) (el as unknown as { dataset: DOMStringMap }).dataset.indeterminate = someChecked ? "true" : "false";
    },
    [someChecked],
  );

  return (
    <>
      <AppHeader title="症状知识库" breadcrumb={["诊疗知识库", "症状知识库"]} />
      <main className="flex-1 px-6 py-6 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary" />
            <Input placeholder="搜索症状关键词" className="h-9 w-72 pl-9 text-body-sm" />
          </div>
          <Button size="sm" className="h-9 gap-1.5 text-body-sm font-normal bg-primary hover:bg-[var(--brand-hover)] text-primary-foreground">
            <Plus className="h-3.5 w-3.5" /> 新建症状
          </Button>
        </div>

        {selected.size > 0 && (
          <div className="flex items-center justify-between gap-3 px-4 h-11 rounded-md border border-primary/30 bg-brand-subtle">
            <span className="text-body-sm text-foreground">已选 {selected.size} 项</span>
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-body-sm font-normal" onClick={batchEdit}>
                <Pencil className="h-3.5 w-3.5" /> 批量编辑
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-body-sm font-normal text-[var(--state-danger)] hover:text-[var(--state-danger)] hover:bg-[color-mix(in_oklab,var(--state-danger)_8%,transparent)]"
                onClick={() => setPendingDelete(Array.from(selected))}
              >
                <Trash2 className="h-3.5 w-3.5" /> 批量删除
              </Button>
              <Button variant="ghost" size="sm" className="h-8 gap-1 text-body-sm font-normal text-text-tertiary" onClick={() => setSelected(new Set())}>
                <X className="h-3.5 w-3.5" /> 取消
              </Button>
            </div>
          </div>
        )}

        <Card className="border-border bg-card overflow-hidden">
          <div className="flex items-center gap-4 px-6 h-12 text-table-header text-text-secondary border-b border-border bg-surface-subtle">
            <Checkbox ref={headerCheckRef} checked={allChecked} onCheckedChange={toggleAll} aria-label="全选" />
            <div className="grid grid-cols-[100px_minmax(160px,1fr)_90px_minmax(260px,2.2fr)] gap-4 flex-1 min-w-0">
              <div>编号</div>
              <div>症状名称</div>
              <div>紧急程度</div>
              <div>关联疾病</div>
            </div>
            <div className="w-[160px] text-right shrink-0">功能</div>
          </div>
          {list.map((s) => {
            const checked = selected.has(s.id);
            return (
              <div
                key={s.id}
                className={`flex items-center gap-4 px-6 h-12 text-table-cell border-b border-border last:border-0 ${checked ? "bg-brand-subtle/60" : "hover:bg-surface-subtle"}`}
              >
                <Checkbox checked={checked} onCheckedChange={() => toggleOne(s.id)} aria-label={`选择 ${s.name}`} />
                <div className="grid grid-cols-[100px_minmax(160px,1fr)_90px_minmax(260px,2.2fr)] gap-4 flex-1 min-w-0 items-center">
                  <div className="font-mono text-body text-foreground truncate">{s.id}</div>
                  <div className="flex items-center gap-1.5 text-body text-foreground truncate">
                    <Activity className="h-3.5 w-3.5 text-primary shrink-0" strokeWidth={1.75} />
                    <span className="truncate">{s.name}</span>
                  </div>
                  <div className="truncate">
                    <span className={`tag ${s.urgency === "高" ? "tag-danger" : s.urgency === "中" ? "tag-warning" : "tag-info"}`}>{s.urgency}</span>
                  </div>
                  <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                    {s.related.slice(0, 2).map((r) => (
                      <span key={r} className="tag tag-muted whitespace-nowrap">{r}</span>
                    ))}
                    {s.related.length > 2 && (
                      <span className="tag tag-muted whitespace-nowrap">+{s.related.length - 2}</span>
                    )}
                  </div>
                </div>
                <div className="w-[160px] shrink-0 flex justify-end items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-body-sm font-normal text-text-secondary hover:bg-surface-subtle hover:text-foreground"
                    onClick={() => setViewing(s)}
                  >
                    查看
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-body-sm font-normal text-primary hover:bg-brand-subtle hover:text-primary"
                    onClick={() => setEditing({ ...s })}
                  >
                    编辑
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-text-secondary hover:bg-surface-subtle hover:text-foreground"
                        aria-label="更多操作"
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-32">
                      <DropdownMenuItem
                        className="text-[var(--state-danger)] focus:text-[var(--state-danger)]"
                        onClick={() => setPendingDelete([s.id])}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" /> 删除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </Card>
      </main>

      <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent side="right" className="w-full sm:w-1/2 sm:max-w-none overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-section-title">编辑症状</SheetTitle>
          </SheetHeader>
          {editing && (
            <div className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-body-sm text-text-secondary">症状名称</Label>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-body-sm text-text-secondary">紧急程度</Label>
                <Input value={editing.urgency} onChange={(e) => setEditing({ ...editing, urgency: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-body-sm text-text-secondary">关联疾病（顿号分隔）</Label>
                <Input
                  value={editing.related.join("、")}
                  onChange={(e) => setEditing({ ...editing, related: e.target.value.split(/[、,，]/).map((t) => t.trim()).filter(Boolean) })}
                />
              </div>
            </div>
          )}
          <SheetFooter className="mt-6 flex-row justify-end gap-2">
            <Button variant="outline" onClick={() => setEditing(null)}>取消</Button>
            <Button className="bg-primary hover:bg-[var(--brand-hover)] text-primary-foreground" onClick={saveEdit}>保存</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <SheetContent side="right" className="w-full sm:w-1/2 sm:max-w-none overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-section-title">症状详情</SheetTitle>
          </SheetHeader>
          {viewing && (
            <div className="mt-4 space-y-3">
              <StatScopeCard metrics={symptomStats(viewing.id)} />
              <ViewRow label="编号" value={viewing.id} mono />
              <ViewRow label="名称" value={viewing.name} />
              <ViewRow label="紧急程度" value={viewing.urgency} />
              <ViewRow label="关联疾病" value={viewing.related.join("、")} />
            </div>
          )}
          <SheetFooter className="mt-6 flex-row justify-end gap-2">
            <Button variant="outline" onClick={() => setViewing(null)}>关闭</Button>
            <Button className="bg-primary hover:bg-[var(--brand-hover)] text-primary-foreground" onClick={() => { if (viewing) { setEditing({ ...viewing }); setViewing(null); } }}>编辑</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              将删除 {pendingDelete?.length ?? 0} 条症状，删除后不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-[var(--state-danger)] hover:bg-[var(--state-danger)]/90 text-white"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ViewRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-20 shrink-0 text-body-sm text-text-secondary">{label}</div>
      <div className={`flex-1 text-body text-foreground ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}
