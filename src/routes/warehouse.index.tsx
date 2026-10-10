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
import { Download, Check, ChevronRight } from "lucide-react";
import { ListPage, type ListColumn } from "@/components/list-page";
import { exportXlsx, type SheetData } from "@/lib/export-xlsx";
import {
  buildDaily,
  buildFlows,
  buildRows,
  buildSkuRows,
  DEFAULT_INVENTORY_SORT,
  inventory,
  isBatchCollapsedByDefault,
  LEDGER_OPTIONAL,
  type Item,
  type SkuRow,
} from "@/lib/inventory";

export const Route = createFileRoute("/warehouse/")({
  head: () => ({ meta: [{ title: "库存管理 — 奇点智牧" }] }),
  component: InventoryPage,
});

const skuColumns: ListColumn<SkuRow>[] = [
  {
    key: "sku", label: "商品编码", required: true, sortable: true,
    render: (i) => <span className="font-mono text-body text-foreground">{i.sku}</span>,
  },
  {
    key: "name", label: "药品名称", required: true, sortable: true,
    render: (i) => <span className="text-body text-foreground truncate">{i.name}</span>,
  },
  { key: "spec", label: "规格型号", render: (i) => <span className="text-body-sm text-text-secondary truncate">{i.spec}</span> },
  {
    key: "stock", label: "当前库存", filter: "number", align: "right", value: (i) => i.stock, sortable: true,
    render: (i) => <span className="text-body font-medium tabular-nums text-foreground">{i.stock} {i.unit}</span>,
  },
  {
    key: "lastInDate", label: "最近入库时间", filter: "date", sortable: true,
    render: (i) => <span className="text-body-sm text-text-secondary tabular-nums">{i.lastInDate || "—"}</span>,
  },
  {
    key: "lastInQty", label: "最近入库数量", filter: "number", align: "right", value: (i) => i.lastInQty ?? 0, sortable: true,
    render: (i) => <span className="text-body-sm tabular-nums text-primary">{i.lastInQty === null ? "—" : `+${i.lastInQty} ${i.unit}`}</span>,
  },
  {
    key: "lastOutDate", label: "最近出库时间", filter: "date", sortable: true,
    render: (i) => <span className="text-body-sm text-text-secondary tabular-nums">{i.lastOutDate || "—"}</span>,
  },
  {
    key: "lastOutQty", label: "最近出库数量", filter: "number", align: "right", value: (i) => i.lastOutQty ?? 0, sortable: true,
    render: (i) => <span className="text-body-sm tabular-nums text-[var(--state-danger)]">{i.lastOutQty === null ? "—" : `-${i.lastOutQty} ${i.unit}`}</span>,
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

function DetailDrawer({ row, onClose }: { row: SkuRow | null; onClose: () => void }) {
  const flows = row ? buildFlows(row.sku) : [];
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});
  const sku = row?.sku ?? "";
  useEffect(() => setOpenMap({}), [sku]);

  const collapsedCount = row
    ? row.batches.filter((b) => isBatchCollapsedByDefault(b)).length
    : 0;

  return (
    <Sheet open={!!row} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-[560px] sm:max-w-[560px] overflow-auto">
        {row && (
          <>
            <SheetHeader className="text-left">
              <SheetTitle className="text-section">
                {row.name}
                <span className="ml-2 font-mono text-caption font-normal text-text-tertiary">{row.sku}</span>
              </SheetTitle>
              <SheetDescription className="text-caption text-text-tertiary">
                {row.spec} · 当前库存 {row.stock} {row.unit} · 共 {row.batches.length} 个批次
                {collapsedCount > 0 ? ` · ${collapsedCount} 个批次已用完（默认折叠）` : ""}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-5 space-y-4">
              {row.batches.map((b) => {
                const list = flows.filter((f) => f.batch === b.batchNo);
                const open = openMap[b.batchNo] ?? !isBatchCollapsedByDefault(b);
                return (
                  <section key={b.batchNo} className="rounded-lg border border-border">
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setOpenMap((m) => ({ ...m, [b.batchNo]: !open }))}
                      className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-brand-subtle ${
                        open ? "border-b border-border bg-surface-subtle" : ""
                      }`}
                    >
                      <div className="flex min-w-0 items-start gap-2">
                        <ChevronRight
                          className={`mt-1 h-4 w-4 shrink-0 text-text-tertiary transition-transform ${
                            open ? "rotate-90" : ""
                          }`}
                        />
                        <div className="min-w-0">
                          <div className="text-card-title text-foreground">
                            批次 <span className="font-mono">{b.batchNo}</span>
                          </div>
                          <div className="mt-0.5 text-caption text-text-tertiary tabular-nums">
                            效期 {b.expiry} · 生产日期 {b.prodDate} · 采购 {b.purchaseDate || "—"}
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-caption text-text-tertiary">当前余量</div>
                        <div className="text-body font-medium tabular-nums text-foreground">{b.stock} {row.unit}</div>
                      </div>
                    </button>

                    {open ? (
                      list.length === 0 ? (
                        <div className="py-6 text-center text-body-sm text-text-tertiary">暂无出入库记录</div>
                      ) : (
                        <ol className="relative px-4 py-3">
                          {list.map((r, idx) => {
                            const isIn = r.dir === "in";
                            const last = idx === list.length - 1;
                            return (
                              <li key={idx} className="relative flex gap-3 pb-4 last:pb-0">
                                <div className="relative flex w-3 shrink-0 justify-center">
                                  <span
                                    className={`mt-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-background ${isIn ? "bg-primary" : "bg-[var(--state-danger)]"}`}
                                  />
                                  {!last && <span className="absolute top-4 bottom-[-16px] w-px bg-border" />}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-caption text-text-tertiary tabular-nums">{r.date}</div>
                                  <div className="mt-0.5 flex items-center justify-between gap-3">
                                    <div className="flex min-w-0 items-center gap-2">
                                      <span className={isIn ? "tag tag-success" : "tag tag-danger"}>
                                        {isIn ? "入库" : "出库"}
                                      </span>
                                      <span className="truncate text-body-sm font-medium text-foreground">{r.via.trim()}</span>
                                    </div>
                                    <span className={`shrink-0 text-body font-medium tabular-nums ${isIn ? "text-primary" : "text-[var(--state-danger)]"}`}>
                                      {isIn ? "+" : "-"}{r.qty} {row.unit}
                                    </span>
                                  </div>
                                  <div className="mt-0.5 text-caption text-text-tertiary">
                                    操作人：{r.operator}
                                    {r.note ? ` · ${r.note}` : ""}
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                        </ol>
                      )
                    ) : (
                      <div className="px-4 py-2.5 text-caption text-text-tertiary">
                        该批次当前余量 0，已默认折叠 · 共 {list.length} 条出入库记录，点击上方展开查看
                      </div>
                    )}
                  </section>
                );
              })}
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
