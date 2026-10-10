import { useEffect, useMemo, useState } from "react";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Download, Check, ChevronRight, ChevronDown } from "lucide-react";
import { ListPage, type ListColumn } from "@/components/list-page";
import { exportXlsx, type SheetData } from "@/lib/export-xlsx";
import {
  buildDaily,
  buildFlows,
  buildRows,
  buildSkuRows,
  DEFAULT_INVENTORY_SORT,
  inventory,
  isBatchUsedUp,
  LEDGER_OPTIONAL,
  partitionBatches,
  type Flow,
  type Item,
  type SkuRow,
} from "@/lib/inventory";

export const Route = createFileRoute("/warehouse/")({
  head: () => ({ meta: [
    { title: "库存管理 — 奇点智牧" },
    { name: "description", content: "查看药品库存、批次余量及出入库时间轴明细。" },
    { property: "og:title", content: "库存管理 — 奇点智牧" },
    { property: "og:description", content: "按商品编码查看库存，追溯各批次出入库记录。" },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: InventoryPage,
});

const skuColumns: ListColumn<SkuRow>[] = [
  {
    key: "sku", label: "商品编码", required: true, sortable: true,
    render: (i) => <span className="font-mono text-body text-foreground">{i.sku}</span>,
  },
  {
    key: "name", label: "药品名称", required: true, sortable: true, width: "170px", grow: true,
    render: (i) => <span className="text-body text-foreground truncate">{i.name}</span>,
  },
  { key: "spec", label: "规格型号", width: "150px", grow: true, render: (i) => <span className="text-body-sm text-text-secondary truncate">{i.spec}</span> },
  {
    key: "lastInDate", label: "最近入库时间", filter: "date", sortable: true, width: "148px", grow: true,
    render: (i) => <span className="text-body-sm text-text-secondary tabular-nums">{i.lastInDate || "—"}</span>,
  },
  {
    key: "lastInQty", label: "最近入库数量", filter: "number", value: (i) => i.lastInQty ?? 0, sortable: true, width: "120px", grow: true,
    render: (i) =>
      i.lastInQty === null ? (
        <span className="text-body-sm tabular-nums text-text-disabled">—</span>
      ) : (
        <span className="text-body-sm tabular-nums text-text-tertiary">+{i.lastInQty}</span>
      ),
  },
  {
    key: "lastOutDate", label: "最近出库时间", filter: "date", sortable: true, width: "148px", grow: true,
    render: (i) => <span className="text-body-sm text-text-secondary tabular-nums">{i.lastOutDate || "—"}</span>,
  },
  {
    key: "lastOutQty", label: "最近出库数量", filter: "number", value: (i) => i.lastOutQty ?? 0, sortable: true, width: "120px", grow: true,
    render: (i) =>
      i.lastOutQty === null ? (
        <span className="text-body-sm tabular-nums text-text-disabled">—</span>
      ) : (
        <span className="text-body-sm tabular-nums text-text-tertiary">-{i.lastOutQty}</span>
      ),
  },
  {
    key: "stock", label: "当前库存", filter: "number", value: (i) => i.stock, sortable: true, width: "96px", grow: true,
    render: (i) => (
      <span className={`text-table-strong tabular-nums ${i.stock === 0 ? "text-text-tertiary" : "text-foreground"}`}>
        {i.stock}
      </span>
    ),

  },


];

/* ------------------------------ 导出弹窗 ------------------------------ */

function ExportDialog({
  open,
  onOpenChange,
  exportCurrent,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  exportCurrent: () => void;
}) {
  const [mode, setMode] = useState<"current" | "ledger">("current");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [skus, setSkus] = useState<string[]>(inventory.map((i) => i.sku));
  const [extra, setExtra] = useState<string[]>([]);

  const toggle = (list: string[], set: (v: string[]) => void, k: string) =>
    set(list.includes(k) ? list.filter((x) => x !== k) : [...list, k]);

  const doExport = () => {
    if (mode === "current") {
      exportCurrent();
    } else {
      const rangeText = `${from || "不限"} 至 ${to || "今日"}`;
      const extras = LEDGER_OPTIONAL.filter((f) => extra.includes(f.key));
      const heads = [
        "时间范围", "日期", "商品编码", "药品展示名称", "计量单位",
        "期初库存", "期间存入", "期间发出", "期末结存",
        ...extras.map((f) => f.label),
      ];
      const rows = buildRows(from, to).filter((r) => skus.includes(r.sku));
      const summary: SheetData = {
        name: "汇总",
        heads,
        body: rows.map((r) => {
          const days = buildDaily(r, from, to);
          const first = days[0];
          const last = days[days.length - 1];
          return [
            rangeText, "汇总", r.sku, r.name, r.unit,
            first ? first.open : 0,
            days.reduce((s, d) => s + d.inQty, 0),
            days.reduce((s, d) => s + d.outQty, 0),
            last ? last.close : 0,
            ...extras.map((f) => String(r[f.key as keyof Item])),
          ];
        }),
      };
      const sheets: SheetData[] = [
        summary,
        ...rows.map((r) => ({
          name: r.name,
          heads,
          body: buildDaily(r, from, to).map((d) => [
            rangeText, d.date, r.sku, r.name, r.unit,
            d.open, d.inQty, d.outQty, d.close,
            ...extras.map((f) => String(r[f.key as keyof Item])),
          ]),
        })),
      ];
      exportXlsx("库存台账", sheets);
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
            选择导出内容类型，含「汇总」表（各药品期间合计）与每个药品的逐日出入库结存表
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[62vh] overflow-auto px-5 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {([
              { k: "current", t: "下载当前列表数据", d: "按当前筛选与显示列导出" },
              { k: "ledger", t: "下载台账", d: "每个药品单独 sheet，逐日结存" },
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

/* ------------------------------ 批次详情抽屉 ------------------------------ */

function BatchSection({
  batch,
  unit,
  list,
  open,
  onToggle,
}: {
  batch: Item;
  unit: string;
  list: Flow[];
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <section className="border-b border-border py-5 last:border-b-0">
      <Button
        variant="ghost"
        type="button"
        aria-expanded={open}
        aria-label={`批次 ${batch.batchNo}`}
        onClick={onToggle}
        className="h-auto w-full justify-between gap-3 rounded-md px-2 py-2 text-left hover:bg-transparent!"
      >
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <ChevronRight className={`text-text-tertiary transition-transform motion-reduce:transition-none ${open ? "rotate-90" : ""}`} />
          <span className="text-body-sm font-normal text-text-secondary">批次</span>
          <span className="font-mono text-card-title font-medium text-foreground">{batch.batchNo}</span>
          {isBatchUsedUp(batch) && <span className="rounded bg-muted px-1.5 text-caption font-normal text-text-tertiary">已用完</span>}
        </div>
        <div className="flex shrink-0 items-baseline gap-2">
          <span className="text-caption font-normal text-text-tertiary">余量</span>
          <span className="text-card-title tabular-nums text-foreground">{batch.stock}</span>
          <span className="text-body-sm font-normal text-text-secondary">{unit}</span>
        </div>
      </Button>
      <dl className="mt-3 grid grid-cols-3 gap-3 pl-8 pr-2">
        {[["效期", batch.expiry], ["生产日期", batch.prodDate], ["采购时间", batch.purchaseDate || "—"]].map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="text-caption text-text-tertiary">{label}</dt>
            <dd className="mt-1 text-body-sm tabular-nums text-text-secondary">{value}</dd>
          </div>
        ))}
      </dl>

      {open ? (
        list.length === 0 ? (
          <div className="py-8 text-center text-body-sm text-text-tertiary">暂无出入库记录</div>
        ) : (
          <ol className="ml-3 mt-6 pr-2">
            {list.map((r, idx) => {
              const isIn = r.dir === "in";
              return (
                <li key={idx} className="relative pb-6 pl-5 last:pb-1">
                  {idx < list.length - 1 && <span className="absolute bottom-0 left-0 top-3 w-px bg-border" />}
                  <span className={`absolute -left-1 top-2 h-2 w-2 rounded-full ring-4 ring-background ${isIn ? "bg-primary" : "bg-destructive"}`} />
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className={`text-body-sm font-medium ${isIn ? "text-primary" : "text-destructive"}`}>{isIn ? "入库" : "出库"}</span>
                      <span className="text-body font-medium text-foreground">{r.via.trim()}</span>
                    </div>
                    <span className={`shrink-0 text-card-title font-medium tabular-nums ${isIn ? "text-primary" : "text-destructive"}`}>
                      {isIn ? "+" : "−"}{r.qty}<span className="ml-1 text-body-sm font-normal">{unit}</span>
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 text-caption text-text-tertiary">
                    <time className="tabular-nums">{r.date}</time>
                    <span>操作人：{r.operator}</span>
                  </div>
                  {r.note && <p className="mt-2 border-l-2 border-border pl-2.5 text-body-sm leading-relaxed text-text-secondary">{r.note}</p>}
                </li>
              );
            })}
          </ol>
        )
      ) : (
        <div className="mt-4 pl-8 text-caption text-text-tertiary">{list.length} 条出入库记录</div>
      )}
    </section>
  );
}

function DetailDrawer({ row, onClose }: { row: SkuRow | null; onClose: () => void }) {
  const flows = row ? buildFlows(row.sku) : [];
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});
  const [showUsed, setShowUsed] = useState(false);
  const sku = row?.sku ?? "";
  useEffect(() => {
    setOpenMap({});
    setShowUsed(false);
  }, [sku]);

  const { active, used } = row
    ? partitionBatches(row.batches)
    : { active: [] as Item[], used: [] as Item[] };


  const renderBatch = (b: Item) => {
    const open = openMap[b.batchNo] ?? !isBatchUsedUp(b);
    return (
      <BatchSection
        key={b.batchNo}
        batch={b}
        unit={row?.unit ?? ""}
        list={flows.filter((f) => f.batch === b.batchNo)}
        open={open}
        onToggle={() => setOpenMap((m) => ({ ...m, [b.batchNo]: !open }))}
      />
    );
  };

  return (
    <Sheet open={!!row} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-[600px]">
        {row && (
          <>
            <SheetHeader className="shrink-0 border-b border-border px-6 pb-5 pt-6 text-left">
              <SheetDescription className="pr-8 font-mono text-caption text-text-tertiary">
                {row.sku}
              </SheetDescription>
              <SheetTitle className="pr-8 text-section font-medium">{row.name}</SheetTitle>
              <div className="flex items-end justify-between gap-4 pt-3">
                <div className="space-y-1">
                  <div className="text-body-sm text-text-secondary">{row.spec}</div>
                  <div className="text-caption text-text-tertiary">
                    共 {row.batches.length} 个批次
                    {used.length > 0 ? ` · ${used.length} 个已用完` : ""}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-caption text-text-tertiary">当前库存</div>
                  <div className="mt-1 flex items-baseline justify-end gap-1.5">
                    <span className={`text-page-title tabular-nums ${row.stock === 0 ? "text-text-disabled" : "text-primary"}`}>{row.stock}</span>
                    <span className="text-body-sm text-text-secondary">{row.unit}</span>
                  </div>
                </div>
              </div>
            </SheetHeader>

            <div className="min-h-0 flex-1 overflow-y-auto px-6">
              {active.map(renderBatch)}

              {used.length > 0 && (
                <section className={active.length > 0 ? "mt-1 border-t border-dashed border-border" : ""}>
                  <button
                    type="button"
                    aria-expanded={showUsed}
                    onClick={() => setShowUsed((v) => !v)}
                    className="flex w-full items-center justify-center gap-2 py-3 text-caption text-text-tertiary"
                  >
                    <span>已用完批次 · 共 {used.length} 个</span>
                    <span className="inline-flex items-center gap-0.5 text-body-sm text-primary">
                      {showUsed ? "收起" : "查看全部"}
                      <ChevronDown className={`size-3.5 transition-transform motion-reduce:transition-none ${showUsed ? "rotate-180" : ""}`} />
                    </span>
                  </button>

                  {showUsed && used.map(renderBatch)}
                </section>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function InventoryPage() {
  const [exportOpen, setExportOpen] = useState(false);
  const [detail, setDetail] = useState<SkuRow | null>(null);
  const rows = useMemo(() => buildSkuRows(), []);

  return (
    <>
      <ListPage<SkuRow>
        title="库存管理"
        breadcrumb={["仓库管理", "库存管理"]}
        rows={rows}
        columns={skuColumns}
        defaultSort={DEFAULT_INVENTORY_SORT}
        searchKeys={["name", "sku"]}
        searchPlaceholder="按商品编码 / 药品名称搜索"
        getRowKey={(i) => i.sku}
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
            />
          </>
        )}
        onRowClick={(row) => setDetail(row)}
        rowActions={(row) => (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-body-sm font-normal text-text-secondary hover:bg-surface-subtle hover:text-foreground"
            onClick={() => setDetail(row)}
          >
            查看
          </Button>
        )}
        actionsWidth={80}
      />
      <DetailDrawer row={detail} onClose={() => setDetail(null)} />
    </>
  );
}
