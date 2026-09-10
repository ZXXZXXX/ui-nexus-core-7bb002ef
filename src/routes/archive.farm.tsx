import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Building2 } from "lucide-react";
import { ListPage, type ListColumn } from "@/components/list-page";
import { toast } from "sonner";
import { ERP_BOOKS } from "@/data/erp-books";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { REGIONS, citiesOf, districtsOf } from "@/data/regions";

export const Route = createFileRoute("/archive/farm")({
  head: () => ({ meta: [{ title: "牛场信息 — 奇点智牧" }] }),
  component: FarmPage,
});

type Farm = {
  id: string; name: string; slot: string; type: string; manager: string;
  stock: number; barns: number; status: string; erpBook: string;
  province: string; city: string; district: string; address: string;
  withdrawalFactor: 1 | 2;
};

const regionOf = (f: Farm) => `${f.province}${f.city}${f.district}`;
const fullAddress = (f: Farm) => `${regionOf(f)}${f.address}`;

const initialFarms: Farm[] = [
  { id: "F001", name: "1 号牧场", slot: "C-01", type: "普通牧场", manager: "张磊", stock: 1240, barns: 12, status: "运营中", erpBook: "内蒙古晟安畜牧服务有限公司", province: "内蒙古自治区", city: "呼伦贝尔市", district: "海拉尔区", address: "牧原路 18 号", withdrawalFactor: 2 },
  { id: "F002", name: "2 号牧场", slot: "C-02", type: "有机牧场", manager: "李建国", stock: 856, barns: 8, status: "运营中", erpBook: "连云港晟安畜牧服务有限公司", province: "内蒙古自治区", city: "锡林郭勒盟", district: "锡林浩特市", address: "草原大道 66 号", withdrawalFactor: 2 },
  { id: "F003", name: "3 号牧场", slot: "C-03", type: "普通牧场", manager: "王志强", stock: 390, barns: 5, status: "已冻结", erpBook: "", province: "黑龙江省", city: "齐齐哈尔市", district: "富拉尔基区", address: "兴牧街 5 号", withdrawalFactor: 1 },
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
  { key: "region", label: "所在地区", filter: "select", value: (f) => `${f.province}·${f.city}`, render: (f) => <span className="text-body-sm text-text-secondary">{f.province}·{f.city}</span> },
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
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

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
              <div className="mb-5 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-surface-subtle px-4 py-3">
                  <div className="text-caption text-text-tertiary">存栏总数</div>
                  <div className="text-page-title tabular-nums text-foreground">{detail.stock}</div>
                </div>
                <div className="rounded-lg bg-surface-subtle px-4 py-3">
                  <div className="text-caption text-text-tertiary">牛舍数量</div>
                  <div className="text-page-title tabular-nums text-foreground">{detail.barns}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <Field label="牛场名称">{detail.name}</Field>
                <Field label="所在地区">{detail.province} / {detail.city} / {detail.district}</Field>
                <div className="col-span-2">
                  <Field label="详细地址">{fullAddress(detail)}</Field>
                </div>
                <Field label="关联 ERP 帐套">
                  {detail.erpBook || <span className="text-text-tertiary">未绑定</span>}
                </Field>
                <Field label="牛场类型">
                  <span className={`tag ${detail.type === "有机牧场" ? "tag-info" : "tag-warning"}`}>{detail.type}</span>
                </Field>
                <Field label="休药期倍数">{detail.withdrawalFactor} 倍</Field>
                <Field label="负责人">{detail.manager}</Field>
                <Field label="牛场状态">
                  <span className={`tag ${detail.status === "运营中" ? "tag-success" : "tag-muted"}`}>{detail.status}</span>
                </Field>
                
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* 编辑抽屉 */}
      <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent side="right" className="w-full sm:w-1/2 sm:max-w-none flex flex-col gap-0 p-0 overflow-hidden">
          <SheetHeader className="px-6 pt-6 pb-3 border-b border-border bg-white">
            <div className="flex items-center justify-between gap-3">
              <SheetTitle className="text-section-title flex items-baseline gap-2 min-w-0">
                <span className="truncate">{editing?.name || "编辑牛场"}</span>
                {editing && <span className="text-body-sm font-normal text-text-tertiary font-mono shrink-0">{editing.id}</span>}
              </SheetTitle>
              {editing && (
                <div className="flex items-center gap-2 shrink-0 mr-8">
                  <span className="text-body-sm text-text-secondary">{editing.status === "运营中" ? "运营中" : "已冻结"}</span>
                  <Switch
                    checked={editing.status === "运营中"}
                    onCheckedChange={(v) => setPendingStatus(v ? "运营中" : "已冻结")}
                  />
                </div>
              )}
            </div>
          </SheetHeader>
          {editing && (
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="mb-5 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-surface-subtle px-4 py-3">
                  <div className="text-caption text-text-tertiary">存栏总数</div>
                  <div className="text-page-title tabular-nums text-foreground">{editing.stock}</div>
                </div>
                <div className="rounded-lg bg-surface-subtle px-4 py-3">
                  <div className="text-caption text-text-tertiary">牛舍数量</div>
                  <div className="text-page-title tabular-nums text-foreground">{editing.barns}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-caption text-text-tertiary">牛场名称</Label>
                  <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="h-9 bg-card border-border text-body-sm" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-caption text-text-tertiary">所在地区</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <Select
                      value={editing.province}
                      onValueChange={(v) => setEditing({ ...editing, province: v, city: "", district: "" })}
                    >
                      <SelectTrigger className="h-9 bg-card border-border text-body-sm"><SelectValue placeholder="省 / 自治区" /></SelectTrigger>
                      <SelectContent>
                        {REGIONS.map((p) => <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select
                      value={editing.city || undefined}
                      onValueChange={(v) => setEditing({ ...editing, city: v, district: "" })}
                      disabled={!editing.province}
                    >
                      <SelectTrigger className="h-9 bg-card border-border text-body-sm"><SelectValue placeholder="市" /></SelectTrigger>
                      <SelectContent>
                        {citiesOf(editing.province).map((c) => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select
                      value={editing.district || undefined}
                      onValueChange={(v) => setEditing({ ...editing, district: v })}
                      disabled={!editing.city}
                    >
                      <SelectTrigger className="h-9 bg-card border-border text-body-sm"><SelectValue placeholder="区 / 县" /></SelectTrigger>
                      <SelectContent>
                        {districtsOf(editing.province, editing.city).map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-caption text-text-tertiary">详细地址</Label>
                  <Input value={editing.address} onChange={(e) => setEditing({ ...editing, address: e.target.value })} placeholder="街道、门牌号等详细信息" className="h-9 bg-card border-border text-body-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-caption text-text-tertiary">关联 ERP 帐套</Label>
                  <Select
                    value={editing.erpBook || "__none__"}
                    onValueChange={(v) => setEditing({ ...editing, erpBook: v === "__none__" ? "" : v })}
                  >
                    <SelectTrigger className="h-9 bg-card border-border text-body-sm"><SelectValue placeholder="选择帐套" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">未绑定</SelectItem>
                      {ERP_BOOKS.map((b) => (
                        <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <Label className="text-caption text-text-tertiary">负责人</Label>
                  <Input value={editing.manager} onChange={(e) => setEditing({ ...editing, manager: e.target.value })} className="h-9 bg-card border-border text-body-sm" />
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

      <AlertDialog open={!!pendingStatus} onOpenChange={(o) => !o && setPendingStatus(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pendingStatus === "运营中" ? "确认启用该牛场？" : "确认停用该牛场？"}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingStatus === "运营中"
                ? "启用后该牛场将恢复运营，相关业务功能重新开放。"
                : "停用后该牛场将被冻结，相关业务将无法继续操作。"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (editing && pendingStatus) setEditing({ ...editing, status: pendingStatus });
                setPendingStatus(null);
              }}
            >
              确认
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
