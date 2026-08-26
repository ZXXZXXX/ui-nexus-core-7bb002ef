import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { ListPage, type ListColumn } from "@/components/list-page";


export const Route = createFileRoute("/warehouse/")({
  head: () => ({ meta: [{ title: "库存管理 — 奇点智牧" }] }),
  component: InventoryPage,
});

type Status = "物资正常" | "物资临期" | "余量紧张";
type Item = {
  sku: string; name: string; cat: string; spec: string; stock: number; min: number;
  unit: string; loc: string; expiry: string; status: Status; updatedAt: string;
};

const inventory: Item[] = [
  { sku: "01-00063", name: "乳房炎抗生素 5mg", cat: "抗生素", spec: "100ml:5g/瓶", stock: 86, min: 50, unit: "盒", loc: "C-12", expiry: "2026-11", status: "物资正常", updatedAt: "2026-08-20" },
  { sku: "02-00214", name: "口蹄疫疫苗 A 型", cat: "疫苗", spec: "50ml/瓶", stock: 12, min: 30, unit: "支", loc: "C-02", expiry: "2026-06", status: "余量紧张", updatedAt: "2026-08-19" },
  { sku: "03-00306", name: "伊维菌素注射液", cat: "驱虫药", spec: "100ml:1g/瓶", stock: 48, min: 20, unit: "瓶", loc: "C-05", expiry: "2026-07", status: "物资临期", updatedAt: "2026-08-14" },
  { sku: "04-00412", name: "复合维生素注射液", cat: "营养类", spec: "10ml/支", stock: 120, min: 60, unit: "支", loc: "C-08", expiry: "2027-02", status: "物资正常", updatedAt: "2026-08-02" },
  { sku: "05-00521", name: "戊二醛消毒液", cat: "消毒类", spec: "5L/桶", stock: 18, min: 30, unit: "L", loc: "C-16", expiry: "2026-12", status: "余量紧张", updatedAt: "2026-07-21" },
  { sku: "06-00633", name: "氟尼新葡甲胺注射液", cat: "解热镇痛", spec: "100ml:5g/瓶", stock: 64, min: 25, unit: "瓶", loc: "C-09", expiry: "2026-10", status: "物资正常", updatedAt: "2026-07-15" },
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
  { key: "spec", label: "规格型号", defaultHidden: true, render: (i) => <span className="text-body-sm text-text-secondary truncate">{i.spec}</span> },
  { key: "expiry", label: "效期", date: true, filter: "date", defaultHidden: true, render: (i) => <span className="text-body-sm text-text-secondary tabular-nums">{i.expiry}</span> },
  { key: "open", label: "期初库存", filter: "number", value: (i) => i.open, render: (i) => num(i.open, "text-text-secondary") },
  { key: "inQty", label: "期间存入", filter: "number", value: (i) => i.inQty, render: (i) => num(i.inQty, "text-[var(--state-success)]") },
  { key: "outQty", label: "期间发出", filter: "number", value: (i) => i.outQty, render: (i) => num(i.outQty, "text-text-secondary") },
  { key: "close", label: "期末结存", filter: "number", value: (i) => i.close, render: (i) => num(i.close, "font-medium") },
  {
    key: "stock", label: "当前库存量", filter: "number", value: (i) => i.stock,
    render: (item) => (
      <span className="text-body font-medium tabular-nums text-foreground">{item.stock}</span>
    ),
  },
  { key: "unit", label: "计量单位", filter: "select", render: (i) => <span className="text-body-sm text-text-secondary">{i.unit}</span> },
  { key: "cat", label: "药品分类", filter: "select", defaultHidden: true, render: (i) => <span className="text-body-sm text-text-secondary">{i.cat}</span> },
  { key: "loc", label: "库位", defaultHidden: true, render: (i) => <span className="font-mono text-body-sm text-text-tertiary">{i.loc}</span> },
  { key: "status", label: "状态", filter: "select", defaultHidden: true, render: (i) => <span className={statusTag(i.status)}>{i.status}</span> },
  {
    key: "updatedAt", label: "更新时间", date: true, filter: "date", defaultHidden: true,
    render: (i) => <span className="text-body-sm text-text-secondary tabular-nums">{i.updatedAt}</span>,
  },
];

function InventoryPage() {
  const [period, setPeriod] = useState({ from: "", to: "" });
  const rows = useMemo(() => buildRows(period.from, period.to), [period]);

  return (
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
  );

}
