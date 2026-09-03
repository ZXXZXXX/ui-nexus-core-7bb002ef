import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Search, X } from "lucide-react";
import { ListPage, type ListColumn } from "@/components/list-page";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/warehouse/transfer")({
  head: () => ({
    meta: [
      { title: "调拨记录 — 奇点智牧" },
      { name: "description", content: "查看牧场药品调拨入库记录，含商品编码、规格型号、调拨数量与登记人员。" },
      { property: "og:title", content: "调拨记录 — 奇点智牧" },
      { property: "og:description", content: "牧场药品调拨入库台账。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TransferPage,
});

type TransferRow = {
  id: string;
  code: string; // 商品编码
  name: string; // 药品展示名称
  spec: string; // 规格型号
  qty: number; // 调拨数量
  unit: string;
  inboundAt: string; // 入库时间
  operator: string; // 登记人员
  remark: string; // 备注信息
  requestedAt: string; // 提出调拨时间
  requester: string; // 提出人
  actualInboundAt: string; // 实际入库时间
};

const ITEMS = [
  { id: "01-00063", name: "乳房炎抗生素 5mg", spec: "100ml（含5g）/瓶", unit: "支" },
  { id: "02-00214", name: "口蹄疫疫苗 A 型", spec: "50ml/瓶", unit: "支" },
  { id: "03-00306", name: "驱虫剂 伊维菌素", spec: "100ml（含1g）/瓶", unit: "瓶" },
  { id: "04-00412", name: "营养补充剂 复合维生素", spec: "10ml/支", unit: "罐" },
  { id: "05-00521", name: "消毒液 戊二醛", spec: "5L/桶", unit: "桶" },
];

const initial: TransferRow[] = [
  { id: "TR-2026-0142", code: "01-00063", name: "乳房炎抗生素 5mg", spec: "100ml（含5g）/瓶", qty: 20, unit: "支", inboundAt: "2026-05-19 10:24", operator: "王建国", remark: "昨日用量超预期，1 号库紧急补货至 2 号库", requestedAt: "2026-05-19 08:52", requester: "李兽医", actualInboundAt: "2026-05-19 10:31" },
  { id: "TR-2026-0141", code: "02-00214", name: "口蹄疫疫苗 A 型", spec: "50ml/瓶", qty: 60, unit: "支", inboundAt: "2026-05-19 09:08", operator: "王建国", remark: "5 月加强免疫备货", requestedAt: "2026-05-18 17:20", requester: "李兽医", actualInboundAt: "2026-05-19 09:15" },
  { id: "TR-2026-0140", code: "03-00306", name: "驱虫剂 伊维菌素", spec: "100ml（含1g）/瓶", qty: 15, unit: "瓶", inboundAt: "2026-05-18 16:42", operator: "孙库管", remark: "季度体内驱虫批次", requestedAt: "2026-05-18 14:05", requester: "周主管", actualInboundAt: "2026-05-18 16:50" },
  { id: "TR-2026-0139", code: "05-00521", name: "消毒液 戊二醛", spec: "5L/桶", qty: 8, unit: "桶", inboundAt: "2026-05-18 11:30", operator: "孙库管", remark: "", requestedAt: "2026-05-18 09:40", requester: "周主管", actualInboundAt: "2026-05-18 11:44" },
];

const columns: ListColumn<TransferRow>[] = [
  { key: "code", label: "商品编码", required: true, render: (r) => <span className="font-mono text-body text-foreground">{r.code}</span> },
  { key: "name", label: "药品展示名称", required: true, render: (r) => <span className="text-body text-foreground truncate">{r.name}</span> },
  { key: "spec", label: "规格型号", render: (r) => <span className="text-body-sm text-text-secondary truncate">{r.spec}</span> },
  {
    key: "qty", label: "调拨数量", filter: "number", value: (r) => r.qty,
    render: (r) => <span className="text-body tabular-nums text-foreground">{r.qty}</span>,
  },
  { key: "unit", label: "基础单位", filter: "select", render: (r) => <span className="text-body-sm text-text-secondary">{r.unit}</span> },
  { key: "inboundAt", label: "入库时间", date: true, filter: "date", render: (r) => <span className="text-body-sm text-text-secondary tabular-nums">{r.inboundAt}</span> },
  { key: "operator", label: "登记人员", filter: "select", render: (r) => <span className="text-body-sm text-text-secondary">{r.operator}</span> },
  {
    key: "remark", label: "备注信息",
    render: (r) => (
      <span className="text-body-sm text-text-secondary truncate">{r.remark || "—"}</span>
    ),
  },
];

type DraftLine = { code: string; name: string; spec: string; unit: string; qty: number };

function TransferPage() {
  const [data, setData] = useState<TransferRow[]>(initial);
  const [open, setOpen] = useState(false);

  const [itemId, setItemId] = useState("");
  const [itemKw, setItemKw] = useState("");
  const [qty, setQty] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [from, setFrom] = useState("1 号库（一级）");
  const [to, setTo] = useState("2 号库（二级）");
  const [inboundAt, setInboundAt] = useState(() => stamp());
  const [remark, setRemark] = useState("");

  const item = ITEMS.find((i) => i.id === itemId);

  const itemMatches = useMemo(() => {
    const kw = itemKw.trim().toLowerCase();
    if (!kw) return ITEMS;
    return ITEMS.filter((i) => i.name.toLowerCase().includes(kw) || i.id.toLowerCase().includes(kw));
  }, [itemKw]);

  const reset = () => {
    setItemId(""); setItemKw(""); setQty(""); setLines([]);
    setInboundAt(stamp()); setRemark("");
  };

  const addLine = () => {
    if (!item) return toast.error("请选择药品");
    if (!qty || Number(qty) <= 0) return toast.error("请输入有效的调拨数量");
    setLines((ls) => {
      const idx = ls.findIndex((l) => l.code === item.id);
      if (idx >= 0) {
        const next = [...ls];
        next[idx] = { ...next[idx], qty: next[idx].qty + Number(qty) };
        return next;
      }
      return [...ls, { code: item.id, name: item.name, spec: item.spec, unit: item.unit, qty: Number(qty) }];
    });
    setItemId(""); setItemKw(""); setQty("");
  };

  const submit = () => {
    if (lines.length === 0) return toast.error("请先添加至少一种药品");
    const base = 143 + (data.length - initial.length);
    const rows: TransferRow[] = lines.map((l, i) => ({
      id: `TR-2026-${String(base + i).padStart(4, "0")}`,
      code: l.code,
      name: l.name,
      spec: l.spec,
      qty: l.qty,
      unit: l.unit,
      inboundAt,
      operator: "超级管理员",
      remark: remark || `${from} → ${to}`,
      requestedAt: stamp(),
      requester: "超级管理员",
      actualInboundAt: inboundAt,
    }));
    setData((d) => [...rows.reverse(), ...d]);
    toast.success(`已登记 ${rows.length} 条调拨记录`);
    reset();
    setOpen(false);
  };


  return (
    <>
      <ListPage<TransferRow>
        title="调拨记录"
        breadcrumb={["仓库管理", "调拨记录"]}
        rows={data}
        columns={columns}
        searchKeys={["name", "code"]}
        searchPlaceholder="按药品名称 / 商品编码搜索"
        primaryAction={{ label: "新建调拨", icon: <Plus className="h-3.5 w-3.5" />, onClick: () => setOpen(true) }}
        getRowKey={(r) => r.id}
        rowActions={() => (
          <Button variant="ghost" size="sm" className="h-7 px-2 text-body-sm font-normal text-text-secondary hover:bg-surface-subtle hover:text-foreground">
            查看
          </Button>
        )}
      />

      <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
        <SheetContent side="right" className="w-full sm:w-1/2 sm:max-w-none p-0 flex flex-col gap-0">
          <SheetHeader className="px-6 py-4 border-b border-border">
            <SheetTitle className="text-card-title text-foreground text-left">新建调拨</SheetTitle>
            <SheetDescription className="text-caption text-text-tertiary text-left">
              登记药品调拨入库信息，提交后归档至调拨台账。
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            <div className="space-y-2">
              <Label className="text-body-sm">
                药品 <span className="text-[var(--state-danger)]">*</span>
              </Label>
              {item ? (
                <div className="flex items-center justify-between h-9 px-3 rounded-md border border-border bg-surface-subtle">
                  <span className="text-body-sm text-foreground">
                    {item.name} <span className="text-text-tertiary">· {item.id} · {item.spec}</span>
                  </span>
                  <button onClick={() => { setItemId(""); setItemKw(""); }} className="text-text-tertiary hover:text-foreground">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary" />
                    <Input
                      value={itemKw}
                      onChange={(e) => setItemKw(e.target.value)}
                      placeholder="搜索药品名称 / 商品编码"
                      className="h-9 pl-9 text-body-sm"
                    />
                  </div>
                  <div className="mt-1.5 max-h-40 overflow-y-auto rounded-md border border-border bg-card">
                    {itemMatches.length === 0 ? (
                      <div className="px-3 py-2 text-caption text-text-tertiary">无匹配项</div>
                    ) : (
                      itemMatches.map((i) => (
                        <button
                          key={i.id}
                          onClick={() => { setItemId(i.id); setItemKw(""); }}
                          className="w-full px-3 py-2 text-left text-body-sm text-foreground hover:bg-surface-subtle"
                        >
                          {i.name}
                          <span className="text-text-tertiary"> · {i.id} · {i.spec}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-body-sm">来源库</Label>
                <Select value={from} onValueChange={setFrom}>
                  <SelectTrigger className="h-9 bg-card"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1 号库（一级）">1 号库（一级）</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-body-sm">目标库</Label>
                <Select value={to} onValueChange={setTo}>
                  <SelectTrigger className="h-9 bg-card"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2 号库（二级）">2 号库（二级）</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-body-sm">
                  调拨数量 <span className="text-[var(--state-danger)]">*</span>
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={qty}
                    onChange={(e) => setQty(e.target.value.replace(/[^\d.]/g, ""))}
                    onKeyDown={(e) => { if (e.key === "Enter") addLine(); }}
                    inputMode="decimal"
                    placeholder="请输入数量"
                    className="h-9 text-body-sm"
                  />
                  <span className="text-body-sm text-text-tertiary w-8">{item?.unit ?? "—"}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-body-sm">入库时间</Label>
                <Input
                  value={inboundAt}
                  onChange={(e) => setInboundAt(e.target.value)}
                  placeholder="YYYY-MM-DD HH:mm"
                  className="h-9 text-body-sm tabular-nums"
                />
              </div>
            </div>

            <Button variant="outline" className="w-full h-9 text-body-sm" onClick={addLine}>
              <Plus className="h-3.5 w-3.5 mr-1" /> 添加至调拨清单
            </Button>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-body-sm">调拨清单</Label>
                <span className="text-caption text-text-tertiary">共 {lines.length} 种药品</span>
              </div>
              {lines.length === 0 ? (
                <div className="rounded-md border border-dashed border-border px-3 py-6 text-center text-caption text-text-tertiary">
                  暂未添加药品，可连续添加多种药品，提交后自动拆分为多条记录
                </div>
              ) : (
                <div className="rounded-md border border-border divide-y divide-border">
                  {lines.map((l) => (
                    <div key={l.code} className="flex items-center justify-between px-3 py-2">
                      <div className="min-w-0">
                        <div className="text-body-sm text-foreground truncate">{l.name}</div>
                        <div className="text-caption text-text-tertiary truncate">{l.code} · {l.spec}</div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-body-sm tabular-nums text-foreground">{l.qty} {l.unit}</span>
                        <button
                          onClick={() => setLines((ls) => ls.filter((x) => x.code !== l.code))}
                          className="text-text-tertiary hover:text-foreground"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>


            <div className="space-y-2">
              <Label className="text-body-sm">备注信息</Label>
              <Textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="可填写调拨原因、注意事项等"
                className="min-h-[72px] text-body-sm"
              />
            </div>
          </div>

          <SheetFooter className="px-6 py-4 border-t border-border flex-row justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>取消</Button>
            <Button className="bg-primary hover:bg-[var(--brand-hover)] text-primary-foreground" onClick={submit}>
              提交
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}

function stamp() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
