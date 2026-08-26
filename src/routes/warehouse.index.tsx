import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, Download, Check } from "lucide-react";
import { ListPage, type ListColumn } from "@/components/list-page";
import { exportCsv } from "@/lib/export-csv";

export const Route = createFileRoute("/warehouse/")({
  head: () => ({ meta: [{ title: "库存管理 — 奇点智牧" }] }),
  component: InventoryPage,
});

type Status = "物资正常" | "物资临期" | "余量紧张";
type Item = {
  sku: string; name: string; cat: string; spec: string; stock: number; min: number;
  unit: string; loc: string; expiry: string; status: Status; updatedAt: string;
  supplier: string; maker: string; approvalNo: string; batchNo: string; prodDate: string; shelfLife: string;
};

const inventory: Item[] = [
  { sku: "01-00063", name: "乳房炎抗生素 5mg", cat: "抗生素", spec: "100ml:5g/瓶", stock: 86, min: 50, unit: "盒", loc: "C-12", expiry: "2026-11", status: "物资正常", updatedAt: "2026-08-20", supplier: "华牧兽药供应链", maker: "齐鲁动物保健品有限公司", approvalNo: "兽药字(2024)010321", batchNo: "B24A0631", prodDate: "2024-11-08", shelfLife: "24 个月" },
  { sku: "02-00214", name: "口蹄疫疫苗 A 型", cat: "疫苗", spec: "50ml/瓶", stock: 12, min: 30, unit: "支", loc: "C-02", expiry: "2026-06", status: "余量紧张", updatedAt: "2026-08-19", supplier: "中牧生物", maker: "中牧实业股份有限公司", approvalNo: "兽药生字(2023)190024", batchNo: "V23F0912", prodDate: "2024-06-14", shelfLife: "24 个月" },
  { sku: "03-00306", name: "伊维菌素注射液", cat: "驱虫药", spec: "100ml:1g/瓶", stock: 48, min: 20, unit: "瓶", loc: "C-05", expiry: "2026-07", status: "物资临期", updatedAt: "2026-08-14", supplier: "华牧兽药供应链", maker: "河北远征药业有限公司", approvalNo: "兽药字(2022)070118", batchNo: "Y22C0455", prodDate: "2024-07-01", shelfLife: "24 个月" },
  { sku: "04-00412", name: "复合维生素注射液", cat: "营养类", spec: "10ml/支", stock: 120, min: 60, unit: "支", loc: "C-08", expiry: "2027-02", status: "物资正常", updatedAt: "2026-08-02", supplier: "瑞普生物", maker: "天津瑞普生物技术股份有限公司", approvalNo: "兽药字(2023)120507", batchNo: "N23K0088", prodDate: "2025-02-20", shelfLife: "24 个月" },
  { sku: "05-00521", name: "戊二醛消毒液", cat: "消毒类", spec: "5L/桶", stock: 18, min: 30, unit: "L", loc: "C-16", expiry: "2026-12", status: "余量紧张", updatedAt: "2026-07-21", supplier: "洁牧环境", maker: "山东洁牧生物科技有限公司", approvalNo: "兽药字(2024)150233", batchNo: "X24D0210", prodDate: "2024-12-05", shelfLife: "24 个月" },
  { sku: "06-00633", name: "氟尼新葡甲胺注射液", cat: "解热镇痛", spec: "100ml:5g/瓶", stock: 64, min: 25, unit: "瓶", loc: "C-09", expiry: "2026-10", status: "物资正常", updatedAt: "2026-07-15", supplier: "华牧兽药供应链", maker: "齐鲁动物保健品有限公司", approvalNo: "兽药字(2024)010902", batchNo: "F24B0177", prodDate: "2024-10-16", shelfLife: "24 个月" },
];

/** 出入库流水（用于计算期初 / 期间 / 期末） */
type Move = { sku: string; date: string; in: number; out: number };
const moves: Move[] = [
  { sku: "01-00063", date: "2026-08-02", in: 40, out: 12 },
  { sku: "01-00063", date: "2026-08-20", in: 20, out: 18 },
  { sku: "02-00214", date: "2026-07-28", in: 30, out: 26 },
  { sku: "02-00214", date: "2026-08-19", in: 0, out: 14 },
  { sku: "03-00306", date: "2026-08-05", in: 24, out: 9 },
  { sku: "03-00306", date: "2026-08-14", in: 12, out: 15 },
  { sku: "04-00412", date: "2026-08-02", in: 60, out: 22 },
  { sku: "05-00521", date: "2026-07-21", in: 10, out: 26 },
  { sku: "06-00633", date: "2026-07-15", in: 36, out: 20 },
  { sku: "06-00633", date: "2026-08-11", in: 18, out: 10 },
];

type Row = Item & { open: number; inQty: number; outQty: number; close: number };

function buildRows(from: string, to: string): Row[] {
  const s = from ? Date.parse(from) : null;
  const e = to ? Date.parse(to) + 86399999 : null;
  return inventory.map((i) => {
    let inQty = 0;
    let outQty = 0;
    for (const m of moves) {
      if (m.sku !== i.sku) continue;
      const t = Date.parse(m.date);
      if (s !== null && t < s) continue;
      if (e !== null && t > e) continue;
      inQty += m.in;
      outQty += m.out;
    }
    const close = i.stock;
    return { ...i, inQty, outQty, close, open: close - inQty + outQty };
  });
}

function statusTag(s: Status) {
  if (s === "物资正常") return "tag tag-success";
  if (s === "物资临期") return "tag tag-warning";
  return "tag tag-danger";
}

const num = (n: number, cls = "text-foreground") => (
  <span className={`text-body tabular-nums ${cls}`}>{n}</span>
);

const columns: ListColumn<Row>[] = [
  {
    key: "sku", label: "商品编码", required: true,
    render: (i) => <span className="font-mono text-body text-foreground">{i.sku}</span>,
  },
  {
    key: "name", label: "药品展示名称", required: true,
    render: (i) => <span className="text-body text-foreground truncate">{i.name}</span>,
  },
  { key: "spec", label: "规格型号", render: (i) => <span className="text-body-sm text-text-secondary truncate">{i.spec}</span> },
  { key: "unit", label: "计量单位", filter: "select", render: (i) => <span className="text-body-sm text-text-secondary">{i.unit}</span> },
  { key: "expiry", label: "效期", date: true, filter: "date", render: (i) => <span className="text-body-sm text-text-secondary tabular-nums">{i.expiry}</span> },
  {
    key: "stock", label: "当前库存量", filter: "number", value: (i) => i.stock,
    render: (item) => (
      <span className="text-body font-medium tabular-nums text-foreground">{item.stock}</span>
    ),
  },
  { key: "open", label: "期初库存", filter: "number", defaultHidden: true, value: (i) => i.open, render: (i) => num(i.open) },
  { key: "inQty", label: "期间存入", filter: "number", defaultHidden: true, value: (i) => i.inQty, render: (i) => num(i.inQty) },
  { key: "outQty", label: "期间发出", filter: "number", defaultHidden: true, value: (i) => i.outQty, render: (i) => num(i.outQty) },
  { key: "close", label: "期末结存", filter: "number", defaultHidden: true, value: (i) => i.close, render: (i) => num(i.close) },
  { key: "cat", label: "药品分类", filter: "select", defaultHidden: true, render: (i) => <span className="text-body-sm text-text-secondary">{i.cat}</span> },
  { key: "loc", label: "库位", defaultHidden: true, render: (i) => <span className="font-mono text-body-sm text-text-tertiary">{i.loc}</span> },
  { key: "status", label: "状态", filter: "select", defaultHidden: true, render: (i) => <span className={statusTag(i.status)}>{i.status}</span> },
  { key: "supplier", label: "供应商", filter: "select", defaultHidden: true, render: (i) => <span className="text-body-sm text-text-secondary truncate">{i.supplier}</span> },
  { key: "maker", label: "生产厂家", filter: "select", defaultHidden: true, render: (i) => <span className="text-body-sm text-text-secondary truncate">{i.maker}</span> },
  { key: "approvalNo", label: "批准文号", defaultHidden: true, render: (i) => <span className="text-body-sm text-text-secondary truncate">{i.approvalNo}</span> },
  { key: "batchNo", label: "生产批号", defaultHidden: true, render: (i) => <span className="font-mono text-body-sm text-text-secondary">{i.batchNo}</span> },
  { key: "prodDate", label: "生产日期", date: true, filter: "date", defaultHidden: true, render: (i) => <span className="text-body-sm text-text-secondary tabular-nums">{i.prodDate}</span> },
  { key: "shelfLife", label: "保质期", defaultHidden: true, render: (i) => <span className="text-body-sm text-text-secondary">{i.shelfLife}</span> },
  {
    key: "updatedAt", label: "更新时间", date: true, filter: "date", defaultHidden: true,
    render: (i) => <span className="text-body-sm text-text-secondary tabular-nums">{i.updatedAt}</span>,
  },
];

/* --------------------------- 台账导出可选字段配置 --------------------------- */

const LEDGER_OPTIONAL: { key: keyof Item; label: string }[] = [
  { key: "supplier", label: "供应商" },
  { key: "maker", label: "生产厂家" },
  { key: "approvalNo", label: "批准文号" },
  { key: "batchNo", label: "生产批号" },
  { key: "prodDate", label: "生产日期" },
  { key: "shelfLife", label: "保质期" },
];

function ExportDialog({
  open,
  onOpenChange,
  exportCurrent,
  period,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  exportCurrent: () => void;
  period: { from: string; to: string };
}) {
  const [mode, setMode] = useState<"current" | "ledger">("current");
  const [from, setFrom] = useState(period.from);
  const [to, setTo] = useState(period.to);
  const [skus, setSkus] = useState<string[]>(inventory.map((i) => i.sku));
  const [extra, setExtra] = useState<string[]>([]);

  const toggle = (list: string[], set: (v: string[]) => void, k: string) =>
    set(list.includes(k) ? list.filter((x) => x !== k) : [...list, k]);

  const doExport = () => {
    if (mode === "current") {
      exportCurrent();
    } else {
      const rangeText = `${from || "不限"} 至 ${to || "今日"}`;
      const heads = [
        "时间范围", "商品编码", "药品展示名称", "计量单位",
        "期初库存", "期间存入", "期间发出", "期末结存",
        ...LEDGER_OPTIONAL.filter((f) => extra.includes(f.key)).map((f) => f.label),
      ];
      const body = buildRows(from, to)
        .filter((r) => skus.includes(r.sku))
        .map((r) => [
          rangeText, r.sku, r.name, r.unit, r.open, r.inQty, r.outQty, r.close,
          ...LEDGER_OPTIONAL.filter((f) => extra.includes(f.key)).map((f) => String(r[f.key])),
        ]);
      exportCsv("库存台账", heads, body);
    }
    onOpenChange(false);
  };

  const allSku = skus.length === inventory.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] p-0 gap-0">
        <DialogHeader className="px-5 py-4 border-b border-border">
          <DialogTitle className="text-section">导出数据</DialogTitle>
          <DialogDescription className="text-caption text-text-tertiary">
            选择导出内容类型，台账可自定义时间范围、药品范围与展示字段
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[62vh] overflow-auto px-5 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {([
              { k: "current", t: "下载当前列表数据", d: "按当前筛选与显示列导出" },
              { k: "ledger", t: "下载台账", d: "按时间范围导出出入库结存" },
            ] as const).map((o) => (
              <button
                key={o.k}
                onClick={() => setMode(o.k)}
                className={`relative rounded-md border p-3 text-left transition-colors ${
                  mode === o.k
                    ? "border-primary bg-brand-subtle"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <div className="text-body-sm font-medium text-foreground">{o.t}</div>
                <div className="mt-0.5 text-caption text-text-tertiary">{o.d}</div>
                {mode === o.k && (
                  <Check className="absolute right-2 top-2 h-3.5 w-3.5 text-primary" />
                )}
              </button>
            ))}
          </div>

          {mode === "ledger" && (
            <>
              <div className="space-y-2">
                <div className="text-body-sm font-medium text-foreground">时间范围</div>
                <div className="flex items-center gap-2">
                  <Input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className="h-9 text-body-sm" aria-label="开始日期" />
                  <span className="h-px w-3 shrink-0 bg-border" />
                  <Input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className="h-9 text-body-sm" aria-label="结束日期" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-body-sm font-medium text-foreground">
                    药品范围
                    <span className="ml-1 text-caption text-text-tertiary">已选 {skus.length}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-caption font-normal text-text-secondary"
                    onClick={() => setSkus(allSku ? [] : inventory.map((i) => i.sku))}
                  >
                    {allSku ? "全不选" : "全选"}
                  </Button>
                </div>
                <div className="max-h-40 overflow-auto rounded-md border border-border divide-y divide-border">
                  {inventory.map((i) => (
                    <label key={i.sku} className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-surface-subtle">
                      <Checkbox checked={skus.includes(i.sku)} onCheckedChange={() => toggle(skus, setSkus, i.sku)} />
                      <span className="text-body-sm text-foreground truncate">{i.name}</span>
                      <span className="ml-auto font-mono text-caption text-text-tertiary">{i.sku}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-body-sm font-medium text-foreground">
                  可选字段
                  <span className="ml-1 text-caption text-text-tertiary">
                    默认包含时间范围、商品编码、药品展示名称、计量单位、期初库存、期间存入、期间发出、期末结存
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {LEDGER_OPTIONAL.map((f) => (
                    <label key={f.key} className="flex items-center gap-2 rounded-md border border-border px-2.5 py-2 cursor-pointer hover:bg-surface-subtle">
                      <Checkbox checked={extra.includes(f.key)} onCheckedChange={() => toggle(extra, setExtra, f.key)} />
                      <span className="text-body-sm text-foreground">{f.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="px-5 py-4 border-t border-border flex-row gap-2 sm:justify-end">
          <Button variant="outline" className="h-9 text-body-sm font-normal" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            className="h-9 text-body-sm font-normal bg-primary hover:bg-[var(--brand-hover)] text-primary-foreground"
            disabled={mode === "ledger" && skus.length === 0}
            onClick={doExport}
          >
            导出
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InventoryPage() {
  const [period, setPeriod] = useState({ from: "", to: "" });
  const [exportOpen, setExportOpen] = useState(false);
  const rows = useMemo(() => buildRows(period.from, period.to), [period]);

  return (
    <>
      <ListPage<Row>
        title="库存管理"
        breadcrumb={["仓库管理", "库存管理"]}
        rows={rows}
        columns={columns}
        searchKeys={["name", "sku"]}
        searchPlaceholder="按 SKU / 药品名称搜索"
        primaryAction={{ label: "新增类别" }}
        getRowKey={(i) => i.sku}
        dateRangeMode
        onDateRangeChange={setPeriod}
        renderExport={(exportCurrent) => (
          <>
            <Button
              variant="outline"
              size="icon"
              title="导出数据"
              aria-label="导出数据"
              className="h-9 w-9 shrink-0"
              onClick={() => setExportOpen(true)}
            >
              <Download className="h-4 w-4" />
            </Button>
            <ExportDialog
              open={exportOpen}
              onOpenChange={setExportOpen}
              exportCurrent={exportCurrent}
              period={period}
            />
          </>
        )}
        rowActions={() => (
          <>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-body-sm font-normal text-text-secondary hover:bg-surface-subtle hover:text-foreground">查看</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="inline-flex h-7 w-7 items-center justify-center rounded-md text-text-tertiary hover:text-foreground hover:bg-surface-subtle transition-colors">
                  <MoreHorizontal className="h-4 w-4" strokeWidth={1.75} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem><Pencil className="h-3.5 w-3.5 mr-2" /> 编辑信息</DropdownMenuItem>
                <DropdownMenuItem className="text-[var(--state-danger)] focus:text-[var(--state-danger)]">
                  <Trash2 className="h-3.5 w-3.5 mr-2" /> 删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      />
    </>
  );
}
