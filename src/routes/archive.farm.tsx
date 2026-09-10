import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Building2, MoreHorizontal, Trash2 } from "lucide-react";
import { ListPage, type ListColumn } from "@/components/list-page";
import { toast } from "sonner";

export const Route = createFileRoute("/archive/farm")({
  head: () => ({ meta: [{ title: "牛场信息 — 奇点智牧" }] }),
  component: FarmPage,
});

type Farm = {
  id: string; name: string; region: string; slot: string; type: string; manager: string;
  stock: number; barns: number; status: string; erpBook: string;
  address: string; withdrawalFactor: number; owner: string;
};

const initialFarms: Farm[] = [
  { id: "F001", name: "1 号牧场", region: "内蒙古·呼伦贝尔市", slot: "C-01", type: "普通牧场", manager: "张磊", stock: 1240, barns: 12, status: "运营中", erpBook: "集团总账套（001）", address: "内蒙古自治区呼伦贝尔市海拉尔区牧原路 18 号", withdrawalFactor: 1.5, owner: "赵永强" },
  { id: "F002", name: "2 号牧场", region: "内蒙古·锡林郭勒市", slot: "C-02", type: "有机牧场", manager: "李建国", stock: 856, barns: 8, status: "运营中", erpBook: "华北区帐套（002）", address: "内蒙古自治区锡林郭勒盟锡林浩特市草原大道 66 号", withdrawalFactor: 2, owner: "孙立" },
  { id: "F003", name: "3 号牧场", region: "黑龙江·齐齐哈尔市", slot: "C-03", type: "普通牧场", manager: "王志强", stock: 390, barns: 5, status: "已冻结", erpBook: "", address: "黑龙江省齐齐哈尔市富拉尔基区兴牧街 5 号", withdrawalFactor: 1, owner: "周敏" },
];

const columns: ListColumn<Farm>[] = [
  { key: "id", label: "牛场编号", required: true, render: (f) => <span className="font-mono text-body text-foreground">{f.id}</span> },
  {
    key: "name", label: "牛场名称", required: true,
    render: (f) => (
      <span className="flex items-center gap-2 text-body text-foreground truncate">
        <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
        <span className="truncate">{f.name}</span>
      </span>
    ),
  },
  { key: "region", label: "所在地区", filter: "select", render: (f) => <span className="text-body-sm text-text-secondary">{f.region}</span> },
  { key: "slot", label: "仓位号", filter: "select", render: (f) => <span className="font-mono text-body-sm text-text-secondary">{f.slot}</span> },
  {
    key: "type", label: "牛场类型", filter: "select",
    render: (f) => <span className={`tag ${f.type === "有机牧场" ? "tag-info" : "tag-warning"}`}>{f.type}</span>,
  },
  {
    key: "erpBook", label: "ERP 帐套", filter: "select",
    value: (f) => f.erpBook || "未绑定",
    render: (f) => (
      <span className="text-body-sm text-text-secondary truncate">{f.erpBook || <span className="text-text-tertiary">未绑定</span>}</span>
    ),
  },
  {
    key: "barns", label: "牛舍数量", filter: "none",
    value: (f) => f.barns,
    render: (f) => <span className="text-body-sm text-text-secondary tabular-nums">{f.barns}</span>,
  },
  {
    key: "stock", label: "存栏总数", filter: "none",
    value: (f) => f.stock,
    render: (f) => <span className="text-body-sm text-text-secondary tabular-nums">{f.stock}</span>,
  },
  { key: "manager", label: "负责人", filter: "select", render: (f) => <span className="text-body-sm text-text-secondary">{f.manager}</span> },
  {
    key: "status", label: "状态", filter: "select",
    render: (f) => <span className={`tag ${f.status === "运营中" ? "tag-success" : "tag-muted"}`}>{f.status}</span>,
  },
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-caption text-text-tertiary">{label}</div>
      <div className="text-body-sm text-foreground">{children}</div>
    </div>
  );
}

function FarmPage() {
  const [farms, setFarms] = useState<Farm[]>(initialFarms);
  const [editing, setEditing] = useState<Farm | null>(null);
  const [detail, setDetail] = useState<Farm | null>(null);
  const [book, setBook] = useState("");

  const openEdit = (f: Farm) => {
    setEditing(f);
    setBook(f.erpBook);
  };

  const save = () => {
    if (!editing) return;
    setFarms((prev) => prev.map((f) => (f.id === editing.id ? { ...f, erpBook: book.trim() } : f)));
    setEditing(null);
    toast.success("ERP 帐套已更新");
  };

  return (
    <>
      <ListPage<Farm>
        title="牛场信息"
        breadcrumb={["基础档案", "牛场信息"]}
        rows={farms}
        columns={columns}
        searchKeys={["name", "id"]}
        searchPlaceholder="搜索牛场名称 / 编号"
        getRowKey={(f) => f.id}
        rowActions={(f) => (
          <>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-body-sm font-normal text-text-secondary hover:bg-surface-subtle hover:text-foreground" onClick={() => setDetail(f)}>查看</Button>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-body-sm font-normal text-primary hover:bg-brand-subtle hover:text-primary" onClick={() => openEdit(f)}>编辑</Button>
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-card-title text-foreground">编辑牛场</DialogTitle>
            <DialogDescription className="text-caption text-text-tertiary">
              {editing?.name} · {editing?.id}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label className="text-caption text-text-tertiary">ERP 帐套</Label>
            <Input
              value={book}
              onChange={(e) => setBook(e.target.value)}
              placeholder="如：集团总账套（001）"
              className="h-9 bg-card border-border text-body-sm"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>取消</Button>
            <Button onClick={save} className="bg-primary hover:bg-[var(--brand-hover)] text-primary-foreground">保存</Button>
          </DialogFooter>
        </DialogContent>

      </Dialog>

      <Sheet open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <SheetContent className="w-[480px] sm:max-w-[480px] overflow-y-auto p-0">
          <SheetHeader className="px-6 py-4 border-b border-border">
            <SheetTitle className="text-card-title text-foreground">{detail?.name}</SheetTitle>
            <SheetDescription className="text-caption text-text-tertiary">牛场详情</SheetDescription>
          </SheetHeader>
          {detail && (
            <div className="px-6 py-5 space-y-5">
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <Field label="牛场编码"><span className="font-mono">{detail.id}</span></Field>
                <Field label="牛场名称">{detail.name}</Field>
                <div className="col-span-2">
                  <Field label="牛场地点">{detail.address}</Field>
                </div>
                <Field label="关联 ERP 帐套">
                  {detail.erpBook || <span className="text-text-tertiary">未绑定</span>}
                </Field>
                <Field label="牛场类型">
                  <span className={`tag ${detail.type === "有机牧场" ? "tag-info" : "tag-warning"}`}>{detail.type}</span>
                </Field>
                <Field label="休药期倍数"><span className="tabular-nums">{detail.withdrawalFactor}×</span></Field>
                <Field label="存栏总数"><span className="tabular-nums">{detail.stock}</span></Field>
                <Field label="牛舍数量"><span className="tabular-nums">{detail.barns}</span></Field>
                <Field label="负责人">{detail.manager}</Field>
                <Field label="牛场状态">
                  <span className={`tag ${detail.status === "运营中" ? "tag-success" : "tag-muted"}`}>{detail.status}</span>
                </Field>
                <Field label="牛场负责人">{detail.owner}</Field>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
