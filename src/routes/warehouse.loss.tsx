import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search, X, Plus } from "lucide-react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FARMS } from "@/lib/farm-store";
import { toast } from "sonner";

export const Route = createFileRoute("/warehouse/loss")({
  head: () => ({ meta: [{ title: "损耗管理 — 奇点智牧" }] }),
  component: LossPage,
});

type LossRow = {
  id: string;
  code: string; // 商品编码
  name: string; // 药品展示名称
  spec: string; // 规格型号
  qty: number; // 损耗数量
  unit: string;
  reason: string; // 损耗原因
  shared: boolean; // 是否均摊
  createdAt: string; // 登记时间
  operator: string; // 登记人员
  value: number; // 药品估值
};

// 物品/药品候选
const ITEMS = [
  { id: "01-00063", name: "乳房炎抗生素 5mg", spec: "100ml:5g/瓶", unit: "支", price: 62.5 },
  { id: "02-00214", name: "口蹄疫疫苗 A 型", spec: "50ml/瓶", unit: "支", price: 60.0 },
  { id: "03-00306", name: "驱虫剂 伊维菌素", spec: "100ml:1g/瓶", unit: "瓶", price: 38.75 },
  { id: "04-00412", name: "营养补充剂 复合维生素", spec: "10ml/支", unit: "罐", price: 90.0 },
  { id: "05-00521", name: "消毒液 戊二醛", spec: "5L/桶", unit: "L", price: 44.0 },
];

// 仓库候选（牧场 + 仓库）
const WAREHOUSES = FARMS.flatMap((f) => [
  { id: `${f.id}-main`, label: `${f.name} · 主仓库`, farmId: f.id },
  { id: `${f.id}-cold`, label: `${f.name} · 冷链库`, farmId: f.id },
]);

// 损耗原因标签
const REASON_TAGS = [
  "冷链断电",
  "过期失效",
  "运输破损",
  "盘点误差",
  "误开未用",
  "操作失误",
  "包装破损",
  "其他",
];

const initial: LossRow[] = [
  { id: "LS-1086", code: "02-00214", name: "口蹄疫疫苗 A 型", spec: "50ml/瓶", qty: 8, unit: "支", reason: "冷链断电", shared: true, createdAt: "2026-05-12 10:18", operator: "孙库管", value: 480.0 },
  { id: "LS-1085", code: "04-00412", name: "营养补充剂 复合维生素", spec: "10ml/支", qty: 2, unit: "罐", reason: "运输破损", shared: false, createdAt: "2026-05-11 15:30", operator: "王仓管", value: 180.0 },
  { id: "LS-1084", code: "05-00521", name: "消毒液 戊二醛", spec: "5L/桶", qty: 5, unit: "L", reason: "过期失效", shared: true, createdAt: "2026-05-10 09:00", operator: "孙库管", value: 220.0 },
  { id: "LS-1083", code: "01-00063", name: "乳房炎抗生素 5mg", spec: "100ml:5g/瓶", qty: 1, unit: "支", reason: "误开未用", shared: false, createdAt: "2026-05-09 14:42", operator: "李雨晴", value: 62.5 },
];

const money = (n: number) =>
  `¥ ${n.toLocaleString("zh-CN", { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`;

const columns: ListColumn<LossRow>[] = [
  { key: "code", label: "商品编码", required: true, render: (r) => <span className="font-mono text-body text-foreground">{r.code}</span> },
  { key: "name", label: "药品展示名称", required: true, render: (r) => <span className="text-body text-foreground truncate">{r.name}</span> },
  { key: "spec", label: "规格型号", render: (r) => <span className="text-body-sm text-text-secondary truncate">{r.spec}</span> },
  {
    key: "qty", label: "损耗数量", filter: "number", value: (r) => r.qty,
    render: (r) => <span className="text-body tabular-nums text-foreground">{r.qty} <span className="text-caption text-text-tertiary">{r.unit}</span></span>,
  },
  { key: "reason", label: "损耗原因", filter: "select", render: (r) => <span className="text-body-sm text-text-secondary truncate">{r.reason}</span> },
  {
    key: "shared", label: "是否均摊", filter: "select", value: (r) => (r.shared ? "是" : "否"),
    render: (r) => <span className={r.shared ? "tag tag-muted text-primary" : "tag tag-muted text-text-tertiary"}>{r.shared ? "是" : "否"}</span>,
  },
  { key: "createdAt", label: "登记时间", date: true, filter: "date", render: (r) => <span className="text-body-sm text-text-secondary tabular-nums">{r.createdAt}</span> },
  { key: "operator", label: "登记人员", filter: "select", render: (r) => <span className="text-body-sm text-text-secondary">{r.operator}</span> },
  {
    key: "value", label: "药品估值", filter: "number", value: (r) => r.value,
    render: (r) => <span className="text-body tabular-nums text-foreground">{money(r.value)}</span>,
  },
];

type Stage = "before" | "after";

function LossPage() {
  const [data, setData] = useState<LossRow[]>(initial);
  const [open, setOpen] = useState(false);

  // 表单状态
  const [itemId, setItemId] = useState<string>("");
  const [itemKw, setItemKw] = useState("");
  const [warehouseId, setWarehouseId] = useState<string>("");
  const [warehouseKw, setWarehouseKw] = useState("");
  const [qty, setQty] = useState<string>("");
  const [stage, setStage] = useState<Stage>("before");
  const [reasons, setReasons] = useState<string[]>([]);
  const [shared, setShared] = useState<boolean>(false);
  const [needRefill, setNeedRefill] = useState<boolean>(false);
  const [remark, setRemark] = useState("");

  const item = ITEMS.find((i) => i.id === itemId);
  const warehouse = WAREHOUSES.find((w) => w.id === warehouseId);

  const itemMatches = useMemo(() => {
    const kw = itemKw.trim().toLowerCase();
    if (!kw) return ITEMS;
    return ITEMS.filter(
      (i) => i.name.toLowerCase().includes(kw) || i.id.toLowerCase().includes(kw),
    );
  }, [itemKw]);

  const warehouseMatches = useMemo(() => {
    const kw = warehouseKw.trim().toLowerCase();
    if (!kw) return WAREHOUSES;
    return WAREHOUSES.filter((w) => w.label.toLowerCase().includes(kw));
  }, [warehouseKw]);

  const reset = () => {
    setItemId(""); setItemKw("");
    setWarehouseId(""); setWarehouseKw("");
    setQty(""); setStage("before");
    setReasons([]); setShared(false); setNeedRefill(false); setRemark("");
  };

  const submit = () => {
    if (!item) return toast.error("请选择物品/药品");
    if (!warehouse) return toast.error("请选择所属牧场/仓库");
    if (!qty || Number(qty) <= 0) return toast.error("请输入有效的损耗数量");

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const nextId = `LS-${1087 + (data.length - initial.length)}`;

    const newRecord: LossRow = {
      id: nextId,
      code: item.id,
      name: item.name,
      spec: item.spec,
      qty: Number(qty),
      unit: item.unit,
      reason: reasons.length ? reasons.join("/") : stage === "before" ? "出库前损耗" : "出库后损耗",
      shared,
      createdAt: stamp,
      operator: "超级管理员",
      value: Number(qty) * item.price,
    };

    setData((d) => [newRecord, ...d]);
    toast.success(`损耗已记录${remark ? "（含备注）" : ""}${needRefill ? " · 需补领" : ""}`);
    reset();
    setOpen(false);
  };

  const toggleReason = (r: string) => {
    setReasons((arr) => (arr.includes(r) ? arr.filter((x) => x !== r) : [...arr, r]));
  };

  return (
    <>
      <ListPage<LossRow>
        title="损耗管理"
        breadcrumb={["仓库管理", "损耗管理"]}
        rows={data}
        columns={columns}
        searchKeys={["name", "code"]}
        searchPlaceholder="按药品名称 / 商品编码搜索"
        primaryAction={{ label: "记录损耗", icon: <Plus className="h-3.5 w-3.5" />, onClick: () => setOpen(true) }}
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
            <SheetTitle className="text-card-title text-foreground text-left">记录损耗</SheetTitle>
            <SheetDescription className="text-caption text-text-tertiary text-left">
              登记物资损耗的详细信息，提交后将自动归档至损耗台账。
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* 物品/药品 */}
            <div className="space-y-2">
              <Label className="text-body-sm">
                物品 / 药品 <span className="text-[var(--state-danger)]">*</span>
              </Label>
              {item ? (
                <div className="flex items-center justify-between h-9 px-3 rounded-md border border-border bg-surface-subtle">
                  <span className="text-body-sm text-foreground">
                    {item.name} <span className="text-text-tertiary">· {item.id}</span>
                  </span>
                  <button onClick={() => { setItemId(""); setItemKw(""); }} className="text-text-tertiary hover:text-foreground">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary" />
                  <Input
                    value={itemKw}
                    onChange={(e) => setItemKw(e.target.value)}
                    placeholder="搜索物品名称 / 编号，或从下方列表选择"
                    className="h-9 pl-9 text-body-sm"
                  />
                  <div className="mt-1.5 max-h-40 overflow-y-auto rounded-md border border-border bg-card">
                    {itemMatches.length === 0 ? (
                      <div className="px-3 py-2 text-caption text-text-tertiary">无匹配项</div>
                    ) : (
                      itemMatches.map((i) => (
                        <button
                          key={i.id}
                          type="button"
                          onClick={() => { setItemId(i.id); setItemKw(""); }}
                          className="w-full flex items-center justify-between px-3 py-2 text-body-sm text-left hover:bg-surface-subtle"
                        >
                          <span>{i.name}</span>
                          <span className="text-caption text-text-tertiary">{i.id}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 牧场/仓库 */}
            <div className="space-y-2">
              <Label className="text-body-sm">
                所属牧场 / 仓库 <span className="text-[var(--state-danger)]">*</span>
              </Label>
              {warehouse ? (
                <div className="flex items-center justify-between h-9 px-3 rounded-md border border-border bg-surface-subtle">
                  <span className="text-body-sm text-foreground">{warehouse.label}</span>
                  <button onClick={() => { setWarehouseId(""); setWarehouseKw(""); }} className="text-text-tertiary hover:text-foreground">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary" />
                  <Input
                    value={warehouseKw}
                    onChange={(e) => setWarehouseKw(e.target.value)}
                    placeholder="搜索牧场或仓库，或从下方列表选择"
                    className="h-9 pl-9 text-body-sm"
                  />
                  <div className="mt-1.5 max-h-40 overflow-y-auto rounded-md border border-border bg-card">
                    {warehouseMatches.length === 0 ? (
                      <div className="px-3 py-2 text-caption text-text-tertiary">无匹配项</div>
                    ) : (
                      warehouseMatches.map((w) => (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => { setWarehouseId(w.id); setWarehouseKw(""); }}
                          className="w-full px-3 py-2 text-body-sm text-left hover:bg-surface-subtle"
                        >
                          {w.label}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 损耗数量 */}
            <div className="space-y-2">
              <Label className="text-body-sm">
                损耗数量 <span className="text-[var(--state-danger)]">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  placeholder="请输入数量"
                  className="h-9 text-body-sm flex-1"
                />
                <span className="text-body-sm text-text-tertiary w-8">{item?.unit || ""}</span>
              </div>
              {item && qty && Number(qty) > 0 && (
                <div className="text-caption text-text-tertiary">
                  预计估值：{money(Number(qty) * item.price)}
                </div>
              )}
            </div>

            {/* 损耗发生环节 */}
            <div className="space-y-2">
              <Label className="text-body-sm">
                损耗发生环节 <span className="text-[var(--state-danger)]">*</span>
              </Label>
              <RadioGroup
                value={stage}
                onValueChange={(v) => {
                  const next = v as Stage;
                  setStage(next);
                  if (next === "before") setNeedRefill(false);
                }}
                className="flex items-center gap-6"
              >
                <label className="flex items-center gap-2 cursor-pointer">
                  <RadioGroupItem value="before" id="stage-before" />
                  <span className="text-body-sm">出库前</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <RadioGroupItem value="after" id="stage-after" />
                  <span className="text-body-sm">出库后</span>
                </label>
              </RadioGroup>
            </div>

            {/* 损耗原因（多选） */}
            <div className="space-y-2">
              <Label className="text-body-sm">损耗原因（可多选）</Label>
              <div className="flex flex-wrap gap-2">
                {REASON_TAGS.map((r) => {
                  const active = reasons.includes(r);
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => toggleReason(r)}
                      className={`h-7 px-3 rounded-full text-body-sm transition-colors border ${
                        active
                          ? "bg-brand-subtle text-primary border-primary"
                          : "bg-card text-text-secondary border-border hover:border-primary/40"
                      }`}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 是否均摊 */}
            <div className="space-y-2">
              <Label className="text-body-sm">是否均摊</Label>
              <RadioGroup
                value={shared ? "yes" : "no"}
                onValueChange={(v) => setShared(v === "yes")}
                className="flex items-center gap-6"
              >
                <label className="flex items-center gap-2 cursor-pointer">
                  <RadioGroupItem value="yes" id="shared-yes" />
                  <span className="text-body-sm">均摊至牛群成本</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <RadioGroupItem value="no" id="shared-no" />
                  <span className="text-body-sm">不均摊</span>
                </label>
              </RadioGroup>
            </div>

            {/* 是否需要补领（仅出库后） */}
            {stage === "after" && (
              <div className="space-y-2">
                <Label className="text-body-sm">是否需要补领</Label>
                <RadioGroup
                  value={needRefill ? "yes" : "no"}
                  onValueChange={(v) => setNeedRefill(v === "yes")}
                  className="flex items-center gap-6"
                >
                  <label className="flex items-center gap-2 cursor-pointer">
                    <RadioGroupItem value="yes" id="refill-yes" />
                    <span className="text-body-sm">需要补领</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <RadioGroupItem value="no" id="refill-no" />
                    <span className="text-body-sm">无需补领</span>
                  </label>
                </RadioGroup>
              </div>
            )}

            {/* 备注 */}
            <div className="space-y-2">
              <Label className="text-body-sm">备注</Label>
              <Textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="可补充损耗发生场景、影响范围等说明（选填）"
                className="min-h-[88px] text-body-sm"
              />
            </div>
          </div>

          <SheetFooter className="px-6 py-3 border-t border-border bg-card">
            <div className="flex items-center justify-end gap-2 w-full">
              <Button variant="outline" size="sm" className="h-9" onClick={() => { setOpen(false); reset(); }}>
                取消
              </Button>
              <Button
                size="sm"
                className="h-9 bg-primary hover:bg-[var(--brand-hover)] text-primary-foreground"
                onClick={submit}
              >
                提交损耗记录
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
