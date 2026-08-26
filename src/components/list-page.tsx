import { useMemo, useState, type ReactNode } from "react";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, SlidersHorizontal, Plus, X, Download, CalendarDays } from "lucide-react";
import { exportCsv } from "@/lib/export-csv";

/* ---------------------------------- types --------------------------------- */

export type ListColumn<T> = {
  /** unique key */
  key: string;
  /** table header label */
  label: string;
  /** cell renderer; falls back to value() */
  render?: (row: T) => ReactNode;
  /** raw value used for search / filter / date parsing */
  value?: (row: T) => string | number | null | undefined;
  /** advanced-filter control type. default: text */
  filter?: "text" | "select" | "number" | "date" | "none";
  /** options for select filter; auto-derived from data when omitted */
  options?: string[];
  /** hidden by default in column settings */
  defaultHidden?: boolean;
  /** cannot be hidden */
  required?: boolean;
  /** this column holds a time value usable by the quick date range */
  date?: boolean;
  className?: string;
};

export type QuickRange = "all" | "today" | "7d" | "30d";

export type ListPageProps<T> = {
  title: string;
  breadcrumb?: string[];
  rows: T[];
  columns: ListColumn<T>[];
  /** up to 2 column keys used for fuzzy search */
  searchKeys?: string[];
  searchPlaceholder?: string;
  primaryAction?: { label: string; onClick?: () => void; icon?: ReactNode };
  secondaryActions?: ReactNode;
  rowActions?: (row: T) => ReactNode;
  actionsWidth?: number;
  getRowKey: (row: T, index: number) => string;
  onRowClick?: (row: T) => void;
  emptyText?: string;
  /** 用日期范围选择器替代快捷时间段 */
  dateRangeMode?: boolean;
  /** 日期范围变化回调（yyyy-mm-dd，空串表示不限） */
  onDateRangeChange?: (r: { from: string; to: string }) => void;
  /** 自定义导出入口：传入默认导出函数，返回替代按钮 */
  renderExport?: (exportCurrent: () => void) => ReactNode;
  /** extra content rendered above the toolbar */
  children?: ReactNode;
};


/* --------------------------------- helpers -------------------------------- */

const RANGES: { key: QuickRange; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "today", label: "今日" },
  { key: "7d", label: "最近 7 天" },
  { key: "30d", label: "最近 30 天" },
];

function raw<T>(col: ListColumn<T>, row: T): string {
  const v = col.value ? col.value(row) : (row as Record<string, unknown>)[col.key];
  return v === null || v === undefined ? "" : String(v);
}

function parseDate(s: string): number | null {
  if (!s) return null;
  const norm = s.replace(/年|月/g, "-").replace(/日/g, "").replace(/\//g, "-").trim();
  const t = Date.parse(norm.length === 7 ? `${norm}-01` : norm);
  return Number.isNaN(t) ? null : t;
}

function rangeStart(range: QuickRange): number | null {
  if (range === "all") return null;
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (range === "today") return start.getTime();
  const days = range === "7d" ? 6 : 29;
  return start.getTime() - days * 86400000;
}

/* -------------------------------- component ------------------------------- */

export function ListPage<T>({
  title,
  breadcrumb,
  rows,
  columns,
  searchKeys,
  searchPlaceholder,
  primaryAction,
  secondaryActions,
  rowActions,
  actionsWidth = 140,
  getRowKey,
  onRowClick,
  emptyText = "暂无数据",
  dateRangeMode = false,
  onDateRangeChange,
  renderExport,
  children,

}: ListPageProps<T>) {
  const searchCols = useMemo(
    () =>
      (searchKeys ?? [])
        .slice(0, 2)
        .map((k) => columns.find((c) => c.key === k))
        .filter(Boolean) as ListColumn<T>[],
    [searchKeys, columns],
  );
  const dateCols = useMemo(() => columns.filter((c) => c.date), [columns]);

  const [q, setQ] = useState("");
  const [dateKey, setDateKey] = useState(dateCols[0]?.key ?? "");
  const [range, setRange] = useState<QuickRange>("all");
  const todayStr = useMemo(() => {
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }, []);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState(dateRangeMode ? todayStr : "");

  const [filters, setFilters] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [visible, setVisible] = useState<string[]>(
    columns.filter((c) => !c.defaultHidden).map((c) => c.key),
  );
  const [draftVisible, setDraftVisible] = useState<string[]>(visible);


  const shown = columns.filter((c) => visible.includes(c.key));
  const activeFilterCount = Object.values(filters).filter((v) => v && v !== "__all").length;

  const data = useMemo(() => {
    const kw = q.trim().toLowerCase();
    const start = dateRangeMode ? (from ? parseDate(from) : null) : rangeStart(range);
    const end = dateRangeMode && to ? parseDate(to) : null;
    const dateCol = columns.find((c) => c.key === dateKey);

    return rows.filter((row) => {
      if (kw && searchCols.length) {
        const hit = searchCols.some((c) => raw(c, row).toLowerCase().includes(kw));
        if (!hit) return false;
      }
      if ((start !== null || end !== null) && dateCol) {
        const t = parseDate(raw(dateCol, row));
        if (t === null) return false;
        if (start !== null && t < start) return false;
        if (end !== null && t > end + 86399999) return false;
      }
      for (const [key, val] of Object.entries(filters)) {
        if (!val || val === "__all") continue;
        const col = columns.find((c) => c.key === key);
        if (!col) continue;
        const cell = raw(col, row).toLowerCase();
        if (col.filter === "select") {
          if (cell !== val.toLowerCase()) return false;
        } else if (!cell.includes(val.toLowerCase())) return false;
      }
      return true;
    });
  }, [rows, q, range, dateKey, filters, columns, searchCols, dateRangeMode, from, to]);


  const optionsFor = (col: ListColumn<T>) =>
    col.options ?? Array.from(new Set(rows.map((r) => raw(col, r)).filter(Boolean)));

  const gridStyle = {
    gridTemplateColumns: `repeat(${Math.max(shown.length, 1)}, minmax(0, 1fr))`,
  };

  return (
    <>
      <AppHeader title={title} breadcrumb={breadcrumb} />
      <main className="flex-1 px-6 py-6 space-y-4">
        {children}

        {/* toolbar */}
        <div className="flex items-center gap-2 flex-wrap xl:flex-nowrap">
          {searchCols.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={
                  searchPlaceholder ?? `搜索${searchCols.map((c) => c.label).join(" / ")}`
                }
                className="h-9 w-60 pl-9 text-body-sm bg-card border-border"
              />
              {q && (
                <button
                  onClick={() => setQ("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-foreground"
                  aria-label="清空搜索"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}

          {dateCols.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Select value={dateKey} onValueChange={setDateKey}>
                <SelectTrigger className="h-9 w-[116px] shrink-0 text-body-sm bg-card border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dateCols.map((c) => (
                    <SelectItem key={c.key} value={c.key} className="text-body-sm">
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {dateRangeMode ? (
                <div className="group inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-card pl-2.5 pr-2 transition-colors hover:border-primary/40 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0 text-text-tertiary transition-colors group-focus-within:text-primary" />
                  <div className="relative">
                    <input
                      type="date"
                      value={from}
                      max={to || undefined}
                      onChange={(e) => {
                        setFrom(e.target.value);
                        onDateRangeChange?.({ from: e.target.value, to });
                      }}
                      aria-label="开始日期"
                      className="h-7 w-[110px] cursor-pointer rounded bg-transparent px-1 text-body-sm tabular-nums text-foreground outline-none transition-colors hover:bg-surface-subtle [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute"
                    />
                    {!from && (
                      <span className="pointer-events-none absolute inset-0 flex items-center rounded bg-card px-1 text-body-sm text-text-tertiary">
                        不限
                      </span>
                    )}
                  </div>
                  <span className="h-px w-2 shrink-0 bg-border" />
                  <div className="relative flex items-center gap-1">
                    <input
                      type="date"
                      value={to}
                      min={from || undefined}
                      onChange={(e) => {
                        setTo(e.target.value);
                        onDateRangeChange?.({ from, to: e.target.value });
                      }}
                      aria-label="结束日期"
                      className="h-7 w-[110px] cursor-pointer rounded bg-transparent px-1 text-body-sm tabular-nums text-foreground outline-none transition-colors hover:bg-surface-subtle [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute"
                    />
                    {to === todayStr && (
                      <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-caption text-primary">
                        今日
                      </span>
                    )}
                  </div>
                  {(from || to !== todayStr) && (
                    <button
                      onClick={() => {
                        setFrom("");
                        setTo(todayStr);
                        onDateRangeChange?.({ from: "", to: todayStr });
                      }}
                      aria-label="重置时间范围"
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-text-tertiary transition-colors hover:bg-surface-subtle hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

              ) : (
                <div className="inline-flex h-9 items-center rounded-md border border-border bg-card p-0.5">
                  {RANGES.map((r) => (
                    <button
                      key={r.key}
                      onClick={() => setRange(r.key)}
                      className={`h-8 px-2 rounded text-body-sm transition-colors ${
                        range === r.key
                          ? "bg-brand-subtle text-primary font-medium"
                          : "text-text-secondary hover:text-foreground"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              )}

            </div>
          )}

          {renderExport ? (
            renderExport(exportCurrent)
          ) : (
            <Button
              variant="outline"
              size="icon"
              title="导出当前筛选结果"
              aria-label="导出当前筛选结果"
              className="h-9 w-9 shrink-0"
              onClick={exportCurrent}
            >
              <Download className="h-4 w-4" />
            </Button>
          )}

          <Button
            variant="outline"
            size="icon"
            title="筛选与列设置"
            aria-label="筛选与列设置"
            className="relative h-9 w-9 shrink-0"
            onClick={() => {
              setDraft(filters);
              setDraftVisible(visible);
              setFilterOpen(true);
            }}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] leading-4 text-center tabular-nums">
                {activeFilterCount}
              </span>
            )}
          </Button>



          <div className="ml-auto flex items-center gap-2 shrink-0">
            {secondaryActions}
            {primaryAction && (
              <Button
                size="sm"
                onClick={primaryAction.onClick}
                className="h-9 gap-1.5 text-body-sm font-normal bg-primary hover:bg-[var(--brand-hover)] text-primary-foreground"
              >
                {primaryAction.icon ?? <Plus className="h-3.5 w-3.5" />}
                {primaryAction.label}
              </Button>
            )}
          </div>
        </div>

        {activeFilterCount > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {Object.entries(filters)
              .filter(([, v]) => v && v !== "__all")
              .map(([k, v]) => {
                const col = columns.find((c) => c.key === k);
                return (
                  <span
                    key={k}
                    className="inline-flex items-center gap-1 rounded-md bg-surface-subtle border border-border px-2 py-1 text-caption text-text-secondary"
                  >
                    {col?.label}：{v}
                    <button
                      onClick={() => setFilters((p) => ({ ...p, [k]: "" }))}
                      aria-label="移除筛选"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                );
              })}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-caption font-normal text-text-tertiary"
              onClick={() => setFilters({})}
            >
              清空
            </Button>
          </div>
        )}

        {/* table */}
        <Card className="border-border bg-card overflow-hidden">
          <div className="flex items-center gap-4 px-6 h-12 text-table-header text-text-secondary border-b border-border bg-surface-subtle">
            <div className="grid gap-4 flex-1 min-w-0" style={gridStyle}>
              {shown.map((c) => (
                <div key={c.key} className="truncate">
                  {c.label}
                </div>
              ))}
            </div>
            {rowActions && (
              <div className="text-right shrink-0" style={{ width: actionsWidth }}>
                操作
              </div>
            )}
          </div>

          {data.length === 0 && (
            <div className="px-6 py-12 text-center text-body-sm text-text-tertiary">{emptyText}</div>
          )}

          {data.map((row, i) => (
            <div
              key={getRowKey(row, i)}
              onClick={() => onRowClick?.(row)}
              className={`flex items-center gap-4 px-6 min-h-12 text-table-cell border-b border-border last:border-0 hover:bg-surface-subtle transition-colors ${
                onRowClick ? "cursor-pointer" : ""
              }`}
            >
              <div className="grid gap-4 flex-1 min-w-0" style={gridStyle}>
                {shown.map((c) => (
                  <div key={c.key} className={`min-w-0 truncate ${c.className ?? ""}`}>
                    {c.render ? c.render(row) : <span className="text-body text-foreground">{raw(c, row)}</span>}
                  </div>
                ))}
              </div>
              {rowActions && (
                <div
                  className="shrink-0 flex items-center justify-end gap-0.5"
                  style={{ width: actionsWidth }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {rowActions(row)}
                </div>
              )}
            </div>
          ))}
        </Card>

        <div className="text-caption text-text-tertiary">
          共 {data.length} 条{data.length !== rows.length && ` / 全部 ${rows.length} 条`}
        </div>
      </main>

      {/* filter + column settings */}
      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent side="right" className="w-[380px] sm:max-w-[380px] flex flex-col p-0">
          <SheetHeader className="px-5 py-4 border-b border-border">
            <SheetTitle className="text-section">筛选与列设置</SheetTitle>
            <p className="text-caption text-text-tertiary">
              勾选需要展示的列，并对展示中的列设置筛选条件
            </p>
          </SheetHeader>
          <div className="flex-1 overflow-auto px-5 py-4 space-y-3">
            {columns.map((c) => {
              const type = c.filter ?? "text";
              const on = draftVisible.includes(c.key);
              return (
                <div
                  key={c.key}
                  className={`rounded-md border border-border p-3 space-y-2 ${on ? "" : "bg-surface-subtle"}`}
                >
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={on}
                      disabled={c.required}
                      onCheckedChange={(v) =>
                        setDraftVisible((prev) =>
                          v
                            ? columns
                                .filter((x) => prev.includes(x.key) || x.key === c.key)
                                .map((x) => x.key)
                            : prev.filter((k) => k !== c.key),
                        )
                      }
                    />
                    <span className="text-body-sm text-foreground">{c.label}</span>
                  </label>
                  {on && type !== "none" && (
                    type === "select" ? (
                      <Select
                        value={draft[c.key] || "__all"}
                        onValueChange={(v) => setDraft((p) => ({ ...p, [c.key]: v }))}
                      >
                        <SelectTrigger className="h-9 text-body-sm">
                          <SelectValue placeholder="全部" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all" className="text-body-sm">
                            全部
                          </SelectItem>
                          {optionsFor(c).map((o) => (
                            <SelectItem key={o} value={o} className="text-body-sm">
                              {o}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={draft[c.key] ?? ""}
                        onChange={(e) => setDraft((p) => ({ ...p, [c.key]: e.target.value }))}
                        placeholder={type === "date" ? "如 2026-05" : `包含…`}
                        className="h-9 text-body-sm"
                      />
                    )
                  )}
                </div>
              );
            })}
          </div>
          <SheetFooter className="px-5 py-4 border-t border-border flex-row gap-2">
            <Button
              variant="outline"
              className="flex-1 h-9 text-body-sm font-normal"
              onClick={() => {
                setDraft({});
                setDraftVisible(columns.filter((c) => !c.defaultHidden).map((c) => c.key));
              }}
            >
              重置
            </Button>
            <Button
              className="flex-1 h-9 text-body-sm font-normal bg-primary hover:bg-[var(--brand-hover)] text-primary-foreground"
              onClick={() => {
                const next: Record<string, string> = {};
                for (const [k, v] of Object.entries(draft)) {
                  if (draftVisible.includes(k)) next[k] = v;
                }
                setFilters(next);
                setVisible(draftVisible);
                setFilterOpen(false);
              }}
            >
              应用
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

    </>
  );
}
