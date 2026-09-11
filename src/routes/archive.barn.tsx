import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Home } from "lucide-react";
import { ListPage, type ListColumn } from "@/components/list-page";
import { toast } from "sonner";

export const Route = createFileRoute("/archive/barn")({
  head: () => ({ meta: [{ title: "牛舍信息 — 奇点智牧" }] }),
  component: BarnPage,
});

type Barn = { id: string; name: string; farm: string; type: string; stock: number; desc: string; updatedAt: string };

const initialBarns: Barn[] = [
  { id: "B-101", name: "1 号牛舍", farm: "1 号牧场", type: "泌乳牛舍", stock: 320, desc: "高产泌乳牛集中区，配置自动饲喂与卧床", updatedAt: "2026-08-20" },
  { id: "B-102", name: "2 号牛舍", farm: "1 号牧场", type: "泌乳牛舍", stock: 312, desc: "中产泌乳群，配套挤奶通道", updatedAt: "2026-08-18" },
  { id: "B-103", name: "3 号牛舍", farm: "1 号牧场", type: "干奶牛舍", stock: 298, desc: "干奶期及围产前期母牛", updatedAt: "2026-08-05" },
  { id: "B-104", name: "犊牛舍 A", farm: "1 号牧场", type: "犊牛舍", stock: 84, desc: "0-3 月龄犊牛单栏饲养", updatedAt: "2026-07-28" },
  { id: "B-105", name: "病牛区", farm: "1 号牧场", type: "病牛舍", stock: 6, desc: "新引进及疫病观察隔离", updatedAt: "2026-07-11" },
  { id: "B-201", name: "1 号牛舍", farm: "2 号牧场", type: "泌乳牛舍", stock: 256, desc: "标准泌乳群，散栏自由采食", updatedAt: "2026-08-16" },
];

/** 主题色板：新增牛舍类型时按名称稳定地“随机”取色 */
const TAG_PALETTE = [
  "tag tag-success",
  "tag tag-info",
  "tag tag-warning",
  "tag tag-danger",
  "tag tag-brand",
  "tag tag-pink",
  "tag tag-muted",
];

function typeTone(type: string) {
  let h = 0;
  for (let i = 0; i < type.length; i++) h = (h * 31 + type.charCodeAt(i)) >>> 0;
  return TAG_PALETTE[h % TAG_PALETTE.length];
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-caption text-text-tertiary">{label}</div>
      <div className="text-body-sm text-foreground">{children}</div>
    </div>
  );
}

function BarnPage() {
  const [barns, setBarns] = useState<Barn[]>(initialBarns);
  const [current, setCurrent] = useState<Barn | null>(null);
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [editing, setEditing] = useState<Barn | null>(null);
  const [customType, setCustomType] = useState(false);

  const knownTypes = useMemo(
    () => Array.from(new Set(barns.map((b) => b.type))),
    [barns],
  );

  const openView = (b: Barn) => {
    setCurrent(b);
    setEditing({ ...b });
    setMode("view");
    setCustomType(false);
  };
  const openEdit = (b: Barn) => {
    setCurrent(b);
    setEditing({ ...b });
    setMode("edit");
    setCustomType(false);
  };
  const closeSheet = () => {
    setCurrent(null);
    setEditing(null);
    setMode("view");
    setCustomType(false);
  };

  const save = () => {
    if (!editing) return;
    const name = editing.name.trim();
    const type = editing.type.trim();
    if (!name) {
      toast.error("请填写牛舍名称");
      return;
    }
    if (!type) {
      toast.error("请填写牛舍类型");
      return;
    }
    const next = { ...editing, name, type, desc: editing.desc.trim() };
    setBarns((prev) => prev.map((b) => (b.id === next.id ? next : b)));
    setCurrent(next);
    setEditing({ ...next });
    setMode("view");
    toast.success("牛舍信息已更新");
  };

  const columns: ListColumn<Barn>[] = [
    { key: "id", label: "编号", required: true, render: (b) => <span className="font-mono text-body text-foreground">{b.id}</span> },
    {
      key: "name", label: "牛舍名称", required: true,
      render: (b) => (
        <span className="flex items-center gap-2 text-body text-foreground truncate">
          <Home className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="truncate">{b.name}</span>
        </span>
      ),
    },
    { key: "farm", label: "所属牧场", filter: "select", render: (b) => <span className="text-body-sm text-text-secondary">{b.farm}</span> },
    { key: "desc", label: "牛舍描述", render: (b) => <span className="text-body-sm text-text-secondary" title={b.desc}>{b.desc}</span> },
    { key: "type", label: "类型", filter: "select", render: (b) => <span className={typeTone(b.type)}>{b.type}</span> },
    {
      key: "stock", label: "存栏只数", filter: "number", value: (b) => b.stock,
      render: (b) => <span className="tabular-nums text-body text-foreground">{b.stock}</span>,
    },
    {
      key: "updatedAt", label: "更新时间", filter: "none", defaultHidden: true,
      render: (b) => <span className="text-body-sm text-text-secondary tabular-nums">{b.updatedAt}</span>,
    },
  ];

  return (
    <>
      <ListPage<Barn>
        title="牛舍信息"
        breadcrumb={["基础档案", "牛舍信息"]}
        rows={barns}
        columns={columns}
        searchKeys={["name", "id"]}
        searchPlaceholder="搜索牛舍名称 / 编号"
        
        getRowKey={(b) => b.id}
        rowActions={(b) => (
          <>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-body-sm font-normal text-text-secondary hover:bg-surface-subtle hover:text-foreground" onClick={() => openView(b)}>查看</Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-body-sm font-normal text-primary hover:bg-brand-subtle hover:text-primary"
              onClick={() => openEdit(b)}
            >
              编辑
            </Button>
          </>
        )}
      />

      {/* 详情抽屉：查看 / 编辑同一个抽屉内切换 */}
      <Sheet open={!!current} onOpenChange={(o) => !o && closeSheet()}>
        <SheetContent side="right" className="w-full sm:w-1/2 sm:max-w-none flex flex-col gap-0 p-0 overflow-hidden">
          <SheetHeader className="px-6 pt-6 pb-3 border-b border-border bg-white">
            <div className="flex items-center justify-between gap-3">
              <SheetTitle className="text-section-title flex items-baseline gap-2 min-w-0">
                <span className="truncate">{(mode === "edit" ? editing?.name : current?.name) || "牛舍详情"}</span>
                {current && <span className="text-body-sm font-normal text-text-tertiary font-mono shrink-0">{current.id}</span>}
              </SheetTitle>
              {mode === "view" && current && (
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 mr-8"
                  onClick={() => {
                    setEditing({ ...current });
                    setMode("edit");
                  }}
                >
                  编辑
                </Button>
              )}
            </div>
          </SheetHeader>

          {mode === "view" && current && (
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <Field label="牛舍编号"><span className="font-mono">{current.id}</span></Field>
                <Field label="牛舍名称">{current.name}</Field>
                <Field label="所属牧场">{current.farm}</Field>
                <Field label="牛舍类型"><span className={typeTone(current.type)}>{current.type}</span></Field>
                <Field label="存栏只数"><span className="tabular-nums">{current.stock}</span></Field>
                <div className="col-span-2">
                  <Field label="牛舍描述">{current.desc || <span className="text-text-tertiary">暂无描述</span>}</Field>
                </div>
              </div>
            </div>
          )}

          {mode === "edit" && editing && (
            <>
              <div className="flex-1 overflow-y-auto px-6 py-5">
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <Field label="牛舍编号"><span className="font-mono">{editing.id}</span></Field>
                  <div className="space-y-1.5">
                    <Label className="text-caption text-text-tertiary">牛舍名称</Label>
                    <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="h-9 bg-card border-border text-body-sm" />
                  </div>
                  <Field label="所属牧场">{editing.farm}</Field>
                  <div className="space-y-1.5">
                    <Label className="text-caption text-text-tertiary">牛舍类型</Label>
                    {customType ? (
                      <Input
                        autoFocus
                        value={editing.type}
                        onChange={(e) => setEditing({ ...editing, type: e.target.value })}
                        placeholder="输入新的牛舍类型"
                        className="h-9 bg-card border-border text-body-sm"
                      />
                    ) : (
                      <Select
                        value={editing.type}
                        onValueChange={(v) => {
                          if (v === "__new__") {
                            setCustomType(true);
                            setEditing({ ...editing, type: "" });
                          } else {
                            setEditing({ ...editing, type: v });
                          }
                        }}
                      >
                        <SelectTrigger className="h-9 bg-card border-border text-body-sm"><SelectValue placeholder="选择牛舍类型" /></SelectTrigger>
                        <SelectContent>
                          {knownTypes.map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                          <SelectItem value="__new__">+ 新增类型</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <Field label="存栏只数"><span className="tabular-nums">{editing.stock}</span></Field>
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-caption text-text-tertiary">牛舍描述</Label>
                    <Textarea
                      value={editing.desc}
                      onChange={(e) => setEditing({ ...editing, desc: e.target.value })}
                      placeholder="牛舍用途、设施等说明"
                      className="min-h-20 bg-card border-border text-body-sm"
                    />
                  </div>
                </div>
              </div>
              <SheetFooter className="p-6 border-t border-border bg-white flex-row justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (current) {
                      setEditing({ ...current });
                      setMode("view");
                    }
                  }}
                >
                  取消
                </Button>
                <Button className="bg-primary hover:bg-[var(--brand-hover)] text-primary-foreground" onClick={save}>保存</Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
