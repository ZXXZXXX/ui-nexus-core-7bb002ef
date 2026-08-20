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
  sku: string; name: string; cat: string; stock: number; min: number;
  unit: string; loc: string; expiry: string; status: Status; updatedAt: string;
};

const inventory: Item[] = [
  { sku: "MD-0108", name: "乳房炎抗生素 5mg", cat: "抗生素", stock: 86, min: 50, unit: "盒", loc: "C-12", expiry: "2026-11", status: "物资正常", updatedAt: "2026-08-20" },
  { sku: "MD-0214", name: "口蹄疫疫苗 A 型", cat: "疫苗", stock: 12, min: 30, unit: "支", loc: "C-02", expiry: "2026-06", status: "余量紧张", updatedAt: "2026-08-19" },
  { sku: "MD-0306", name: "伊维菌素注射液", cat: "驱虫药", stock: 48, min: 20, unit: "瓶", loc: "C-05", expiry: "2026-07", status: "物资临期", updatedAt: "2026-08-14" },
  { sku: "MD-0412", name: "复合维生素注射液", cat: "营养类", stock: 120, min: 60, unit: "支", loc: "C-08", expiry: "2027-02", status: "物资正常", updatedAt: "2026-08-02" },
  { sku: "MD-0521", name: "戊二醛消毒液", cat: "消毒类", stock: 18, min: 30, unit: "L", loc: "C-16", expiry: "2026-12", status: "余量紧张", updatedAt: "2026-07-21" },
  { sku: "MD-0633", name: "氟尼新葡甲胺注射液", cat: "解热镇痛", stock: 64, min: 25, unit: "瓶", loc: "C-09", expiry: "2026-10", status: "物资正常", updatedAt: "2026-07-15" },
];

function statusTag(s: Status) {
  if (s === "物资正常") return "tag tag-success";
  if (s === "物资临期") return "tag tag-warning";
  return "tag tag-danger";
}

const columns: ListColumn<Item>[] = [
  {
    key: "name", label: "药品", required: true,
    render: (item) => (
      <div className="leading-tight min-w-0">
        <div className="text-body text-foreground truncate">{item.name}</div>
        <div className="text-caption text-text-tertiary font-mono truncate">{item.sku} · {item.cat}</div>
      </div>
    ),
  },
  { key: "sku", label: "SKU", defaultHidden: true, render: (i) => <span className="font-mono text-body-sm text-text-secondary">{i.sku}</span> },
  { key: "cat", label: "药品分类", filter: "select", defaultHidden: true, render: (i) => <span className="text-body-sm text-text-secondary">{i.cat}</span> },
  {
    key: "stock", label: "库存", filter: "number", value: (i) => i.stock,
    render: (item) => (
      <div className="flex items-baseline gap-1">
        <span className={`text-body font-medium tabular-nums ${item.stock < item.min ? "text-[var(--state-danger)]" : "text-foreground"}`}>{item.stock}</span>
        <span className="text-caption text-text-tertiary truncate">/ {item.min} {item.unit}</span>
      </div>
    ),
  },
  { key: "loc", label: "库位", render: (i) => <span className="font-mono text-body-sm text-text-tertiary">{i.loc}</span> },
  { key: "expiry", label: "效期", date: true, filter: "date", render: (i) => <span className="text-body-sm text-text-secondary tabular-nums">{i.expiry}</span> },
  { key: "status", label: "状态", filter: "select", render: (i) => <span className={statusTag(i.status)}>{i.status}</span> },
  {
    key: "updatedAt", label: "更新时间", date: true, filter: "date", defaultHidden: true,
    render: (i) => <span className="text-body-sm text-text-secondary tabular-nums">{i.updatedAt}</span>,
  },
];

function InventoryPage() {
  return (
    <ListPage<Item>
      title="库存管理"
      breadcrumb={["仓库管理", "库存管理"]}
      rows={inventory}
      columns={columns}
      searchKeys={["name", "sku"]}
      searchPlaceholder="按 SKU / 药品名称搜索"
      primaryAction={{ label: "新增类别" }}
      getRowKey={(i) => i.sku}
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
