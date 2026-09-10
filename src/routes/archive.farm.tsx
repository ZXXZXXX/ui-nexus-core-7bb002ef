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
  address: string; withdrawalFactor: 1 | 2; owner: string;
};

const initialFarms: Farm[] = [
  { id: "F001", name: "1 号牧场", region: "内蒙古·呼伦贝尔市", slot: "C-01", type: "普通牧场", manager: "张磊", stock: 1240, barns: 12, status: "运营中", erpBook: "集团总账套（001）", address: "内蒙古自治区呼伦贝尔市海拉尔区牧原路 18 号", withdrawalFactor: 2, owner: "赵永强" },
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

  const openEdit = (f: Farm) => setEditing({ ...f });

  const save = () => {
    if (!editing) return;
    if (!editing.name.trim()) {
      toast.error("请填写牛场名称");
      return;
    }
    const next = { ...editing, name: editing.name.trim(), erpBook: editing.erpBook.trim() };
    setFarms((prev) => prev.map((f) => (f.id === next.id ? next : f)));
    setEditing(null);
    toast.success("牛场信息已更新");
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

      {/* 查看抽屉 */}
      <Sheet open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <SheetContent side="right" className="w-full sm:w-1/2 sm:max-w-none flex flex-col gap-0 p-0 overflow-hidden">
          <SheetHeader className="px-6 pt-6 pb-3 border-b border-border bg-white">
            <div className="flex items-center justify-between gap-3">
              <SheetTitle className="text-section-title flex items-baseline gap-2 min-w-0">
                <span className="truncate">{detail?.name ?? "牛场详情"}</span>
                {detail && <span className="text-body-sm font-normal text-text-tertiary font-mono shrink-0">{detail.id}</span>}
              </SheetTitle>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 mr-8"
                onClick={() => {
                  if (detail) {
                    openEdit(detail);
                    setDetail(null);
                  }
                }}
              >
                编辑
              </Button>
            </div>
          </SheetHeader>
          {detail && (
            <div className="flex-1 overflow-y-auto px-6 py-5">
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
                <Field label="休药期倍数">{detail.withdrawalFactor} 倍</Field>
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

      {/* 编辑抽屉 */}
      <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent side="right" className="w-full sm:w-1/2 sm:max-w-none flex flex-col gap-0 p-0 overflow-hidden">
          <SheetHeader className="px-6 pt-6 pb-3 border-b border-border bg-white">
            <SheetTitle className="text-section-title flex items-baseline gap-2 min-w-0">
              <span className="truncate">{editing?.name || "编辑牛场"}</span>
              {editing && <span className="text-body-sm font-normal text-text-tertiary font-mono shrink-0">{editing.id}</span>}
            </SheetTitle>
          </SheetHeader>
          {editing && (
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <Field label="牛场编码"><span className="font-mono">{editing.id}</span></Field>
                <div className="space-y-1.5">
                  <Label className="text-caption text-text-tertiary">牛场名称</Label>
                  <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="h-9 bg-card border-border text-body-sm" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-caption text-text-tertiary">牛场地点</Label>
                  <Input value={editing.address} onChange={(e) => setEditing({ ...editing, address: e.target.value })} className="h-9 bg-card border-border text-body-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-caption text-text-tertiary">关联 ERP 帐套</Label>
                  <Input value={editing.erpBook} onChange={(e) => setEditing({ ...editing, erpBook: e.target.value })} placeholder="如：集团总账套（001）" className="h-9 bg-card border-border text-body-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-caption text-text-tertiary">牛场类型</Label>
                  <Select value={editing.type} onValueChange={(v) => setEditing({ ...editing, type: v })}>
                    <SelectTrigger className="h-9 bg-card border-border text-body-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="普通牧场">普通牧场</SelectItem>
                      <SelectItem value="有机牧场">有机牧场</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-caption text-text-tertiary">休药期倍数</Label>
                  <Select value={String(editing.withdrawalFactor)} onValueChange={(v) => setEditing({ ...editing, withdrawalFactor: v === "2" ? 2 : 1 })}>
                    <SelectTrigger className="h-9 bg-card border-border text-body-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 倍</SelectItem>
                      <SelectItem value="2">2 倍</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-caption text-text-tertiary">牛场状态</Label>
                  <Select value={editing.status} onValueChange={(v) => setEditing({ ...editing, status: v })}>
                    <SelectTrigger className="h-9 bg-card border-border text-body-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="运营中">运营中</SelectItem>
                      <SelectItem value="已冻结">已冻结</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Field label="存栏总数"><span className="tabular-nums">{editing.stock}</span></Field>
                <Field label="牛舍数量"><span className="tabular-nums">{editing.barns}</span></Field>
                <div className="space-y-1.5">
                  <Label className="text-caption text-text-tertiary">负责人</Label>
                  <Input value={editing.manager} onChange={(e) => setEditing({ ...editing, manager: e.target.value })} className="h-9 bg-card border-border text-body-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-caption text-text-tertiary">牛场负责人</Label>
                  <Input value={editing.owner} onChange={(e) => setEditing({ ...editing, owner: e.target.value })} className="h-9 bg-card border-border text-body-sm" />
                </div>
              </div>
            </div>
          )}
          <SheetFooter className="p-6 border-t border-border bg-white flex-row justify-end gap-2">
            <Button variant="outline" onClick={() => setEditing(null)}>取消</Button>
            <Button className="bg-primary hover:bg-[var(--brand-hover)] text-primary-foreground" onClick={save}>保存</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
