import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Home, MoreHorizontal, Trash2 } from "lucide-react";
import { ListPage, type ListColumn } from "@/components/list-page";

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
  { id: "B-105", name: "隔离区", farm: "1 号牧场", type: "隔离舍", stock: 6, desc: "新引进及疫病观察隔离", updatedAt: "2026-07-11" },
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

function BarnPage() {
  const [barns, setBarns] = useState<Barn[]>(initialBarns);
  const [editing, setEditing] = useState<Barn | null>(null);
  const [draftType, setDraftType] = useState("");

  const knownTypes = useMemo(
    () => Array.from(new Set(barns.map((b) => b.type))),
    [barns],
  );

  const openEdit = (b: Barn) => {
    setEditing(b);
    setDraftType(b.type);
  };

  const save = () => {
    const t = draftType.trim();
    if (!editing || !t) return;
    setBarns((prev) => prev.map((b) => (b.id === editing.id ? { ...b, type: t } : b)));
    setEditing(null);
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
      key: "updatedAt", label: "更新时间", date: true, filter: "date", defaultHidden: true,
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
        primaryAction={{ label: "新建牛舍" }}
        getRowKey={(b) => b.id}
        rowActions={(b) => (
          <>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-body-sm font-normal text-text-secondary hover:bg-surface-subtle hover:text-foreground">查看</Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-body-sm font-normal text-primary hover:bg-brand-subtle hover:text-primary"
              onClick={() => openEdit(b)}
            >
              编辑
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-text-secondary hover:bg-surface-subtle hover:text-foreground" aria-label="更多">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-28">
                <DropdownMenuItem className="text-[var(--state-danger)] focus:text-[var(--state-danger)]">
                  <Trash2 className="h-3.5 w-3.5 mr-2" /> 删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      />

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-[420px] bg-card">
          <DialogHeader>
            <DialogTitle className="text-section-title">编辑牛舍 · {editing?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="barn-type" className="text-body-sm text-text-secondary">牛舍类型</Label>
            <Input
              id="barn-type"
              list="barn-type-options"
              value={draftType}
              onChange={(e) => setDraftType(e.target.value)}
              placeholder="选择已有类型或输入新类型"
            />
            <datalist id="barn-type-options">
              {knownTypes.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
            {draftType.trim() && (
              <div className="pt-1 flex items-center gap-2">
                <span className="text-caption text-text-tertiary">标签预览</span>
                <span className={typeTone(draftType.trim())}>{draftType.trim()}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>取消</Button>
            <Button onClick={save} disabled={!draftType.trim()}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
