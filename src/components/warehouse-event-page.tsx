import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Plus,
  Search,
  Filter,
  Settings2,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Mic,
  Video,
  FileText,
  Check,
  X,
  type LucideIcon,
} from "lucide-react";

export type Tone = "warning" | "info" | "danger" | "success" | "brand";

export type StatusConfig<S extends string> = {
  key: S;
  label: string;
  icon: LucideIcon;
  tone: Tone;
};

export type EventAttachment = {
  type: "audio" | "video" | "text";
  name: string;
  meta?: string;
};

export type WarehouseEvent<S extends string = string> = {
  id: string;
  lines: { item: string; qty: string }[];
  desc: string;
  status: S;
  operator: string;
  operatedAt: string;
  from?: string;
  to?: string;
  attachments?: EventAttachment[];
};


type ColKey = "id" | "items" | "desc" | "status" | "operator" | "operatedAt" | "action";

type ColDef = {
  key: ColKey;
  label: string;
  width: number;
  locked?: boolean;
  isTime?: boolean;
};

const ALL_COLS: ColDef[] = [
  { key: "id", label: "事件编号", width: 140, locked: true },
  { key: "items", label: "物资名称·数量", width: 260, locked: true },
  { key: "desc", label: "具体描述", width: 280 },
  { key: "status", label: "当前状态", width: 110 },
  { key: "operator", label: "操作人", width: 100 },
  { key: "operatedAt", label: "操作时间", width: 160, isTime: true },
  { key: "action", label: "功能", width: 160, locked: true },
];


const toneStyles: Record<Tone, { bg: string; text: string; tag: string }> = {
  warning: { bg: "bg-[var(--state-warning)]/10", text: "text-[var(--state-warning)]", tag: "tag tag-warning" },
  info: { bg: "bg-brand-subtle", text: "text-primary", tag: "tag tag-brand" },
  danger: { bg: "bg-[var(--state-danger)]/10", text: "text-[var(--state-danger)]", tag: "tag tag-danger" },
  success: { bg: "bg-[var(--state-success)]/10", text: "text-[var(--state-success)]", tag: "tag tag-success" },
  brand: { bg: "bg-brand-subtle", text: "text-primary", tag: "tag tag-brand" },
};

type DateRange = "all" | "today" | "7d" | "30d";
const dateRanges: { key: DateRange; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "today", label: "今天" },
  { key: "7d", label: "最近 7 天" },
  { key: "30d", label: "最近 30 天" },
];

function parseTime(s?: string): number {
  if (!s) return 0;
  const norm = s.replace(/\//g, "-").replace(" ", "T");
  const t = Date.parse(norm);
  return Number.isNaN(t) ? 0 : t;
}

function inRange(s: string, range: DateRange): boolean {
  if (range === "all") return true;
  const t = parseTime(s);
  if (!t) return false;
  const now = Date.now();
  const day = 86400000;
  if (range === "today") {
    const d = new Date();
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    return t >= start && t < start + day;
  }
  if (range === "7d") return now - t <= 7 * day;
  if (range === "30d") return now - t <= 30 * day;
  return true;
}

export function WarehouseEventPage<S extends string>({
  title,
  breadcrumb,
  statuses,
  events,
  searchPlaceholder = "按编号 / 物资 / 描述搜索",
  createLabel,
  onCreate,
  hideTabs,
  renderDetailActions,
  reviewStatus,
  onReview,
  detailNote,
}: {
  title: string;
  breadcrumb: string[];
  statuses: StatusConfig<S>[];
  events: WarehouseEvent<S>[];
  searchPlaceholder?: string;
  createLabel?: string;
  onCreate?: () => void;
  hideTabs?: boolean;
  renderDetailActions?: (detail: WarehouseEvent<S>, close: () => void) => ReactNode;
  reviewStatus?: S;
  onReview?: (e: WarehouseEvent<S>, action: "approve" | "reject") => void;
  detailNote?: string;
}) {

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [active, setActive] = useState<S>(statuses[0].key);
  const [detail, setDetail] = useState<WarehouseEvent<S> | null>(null);
  const [keyword, setKeyword] = useState("");
  const [range, setRange] = useState<DateRange>("all");
  const [advOpen, setAdvOpen] = useState(false);
  const [advOperator, setAdvOperator] = useState<string>("all");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [visible, setVisible] = useState<Record<ColKey, boolean>>(() =>
    Object.fromEntries(ALL_COLS.map((c) => [c.key, true])) as Record<ColKey, boolean>,
  );

  const counts = Object.fromEntries(
    statuses.map((s) => [s.key, events.filter((o) => o.status === s.key).length]),
  ) as Record<S, number>;

  const operators = useMemo(
    () => Array.from(new Set(events.map((o) => o.operator).filter(Boolean))),
    [events],
  );

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const list = events
      .filter((o) => (hideTabs ? true : o.status === active))
      .filter((o) => inRange(o.operatedAt, range))
      .filter((o) =>
        kw
          ? [o.id, o.desc, o.operator, ...o.lines.map((l) => l.item)]
              .some((v) => String(v).toLowerCase().includes(kw))
          : true,
      )
      .filter((o) => (advOperator === "all" ? true : o.operator === advOperator));
    return [...list].sort((a, b) => {
      const va = parseTime(a.operatedAt);
      const vb = parseTime(b.operatedAt);
      return sortDir === "asc" ? va - vb : vb - va;
    });
  }, [events, active, range, keyword, advOperator, sortDir, hideTabs]);

  const leftFrozenKeys: ColKey[] = ["id"];
  const rightFrozenKeys: ColKey[] = ["action"];
  const middleCols = ALL_COLS.filter(
    (c) => visible[c.key] && !leftFrozenKeys.includes(c.key) && !rightFrozenKeys.includes(c.key),
  );
  const leftCols = ALL_COLS.filter((c) => leftFrozenKeys.includes(c.key));
  const rightCols = ALL_COLS.filter((c) => rightFrozenKeys.includes(c.key));
  const leftWidth = leftCols.reduce((s, c) => s + c.width, 0);
  const rightWidth = rightCols.reduce((s, c) => s + c.width, 0);
  const middleWidth = middleCols.reduce((s, c) => s + c.width, 0);
  const minW = leftWidth + middleWidth + rightWidth;
  const rightOffset = (key: ColKey) => {
    const idx = rightCols.findIndex((c) => c.key === key);
    return rightCols.slice(idx + 1).reduce((s, c) => s + c.width, 0);
  };
  const leftOffset = (key: ColKey) => {
    const idx = leftCols.findIndex((c) => c.key === key);
    return leftCols.slice(0, idx).reduce((s, c) => s + c.width, 0);
  };

  const toggleSort = () => setSortDir((d) => (d === "asc" ? "desc" : "asc"));

  const sortIcon = (key: ColKey) => {
    if (key !== "operatedAt") return null;
    return sortDir === "asc" ? (
      <ArrowUp className="h-3 w-3 ml-1 inline text-primary" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1 inline text-primary" />
    );
  };

  const renderCell = (o: WarehouseEvent<S>, key: ColKey) => {
    switch (key) {
      case "id":
        return <span className="font-mono text-body-sm text-foreground">{o.id}</span>;
      case "items":
        return (
          <div className="leading-tight space-y-0.5 py-1">
            {o.lines.slice(0, 2).map((l, i) => (
              <div key={i} className="flex items-baseline gap-2 text-body-sm">
                <span className="text-foreground truncate">{l.item}</span>
                <span className="text-caption text-text-tertiary tabular-nums shrink-0">{l.qty}</span>
              </div>
            ))}
            {o.lines.length > 2 && (
              <div className="text-caption text-text-tertiary">等 {o.lines.length} 项</div>
            )}
          </div>
        );
      case "desc": {
        const text = o.desc;
        const truncated = text.length > 15 ? text.slice(0, 15) + "…" : text;
        if (text.length > 15) {
          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-body-sm text-text-secondary truncate block cursor-default">
                  {truncated}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-sm">{text}</TooltipContent>
            </Tooltip>
          );
        }
        return <span className="text-body-sm text-text-secondary truncate block">{text}</span>;
      }
      case "status": {
        const s = statuses.find((x) => x.key === o.status);
        return s ? <span className={toneStyles[s.tone].tag}>{s.label}</span> : null;
      }
      case "operator":
        return <span className="text-body-sm text-text-secondary">{o.operator}</span>;
      case "operatedAt":
        return <span className="text-body-sm text-text-secondary tabular-nums">{o.operatedAt}</span>;
      case "action": {
        const canReview = reviewStatus !== undefined && o.status === reviewStatus && onReview;
        return (
          <div className="inline-flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-body-sm font-normal text-text-secondary hover:bg-surface-subtle hover:text-foreground"
              onClick={() => setDetail(o)}
            >
              查看
            </Button>
            {canReview && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-body-sm font-normal text-primary hover:bg-brand-subtle hover:text-primary"
                  onClick={() => onReview!(o, "approve")}
                >
                  通过
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-body-sm font-normal text-[var(--state-danger)] hover:bg-[var(--state-danger)]/10 hover:text-[var(--state-danger)]"
                  onClick={() => onReview!(o, "reject")}
                >
                  驳回
                </Button>
              </>
            )}
          </div>
        );
      }

    }
  };

  const activeStatus = statuses.find((s) => s.key === active)!;
  const detailStatus = detail ? statuses.find((s) => s.key === detail.status) : null;

  return (
    <TooltipProvider delayDuration={200}>
      <AppHeader title={title} breadcrumb={breadcrumb} />
      <main className="flex-1 px-6 py-6 space-y-4">
        {createLabel && onCreate && (
          <div className="flex items-center justify-end gap-3 flex-wrap">
            <Button
              size="sm"
              className="h-9 gap-1.5 text-body-sm font-normal bg-primary hover:bg-[var(--brand-hover)] text-primary-foreground"
              onClick={onCreate}
            >
              <Plus className="h-3.5 w-3.5" /> {createLabel}
            </Button>
          </div>
        )}

        {!hideTabs && (
        <div className="flex items-center gap-1 flex-wrap border-b border-border">
          {statuses.map((s) => {
            const isActive = active === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setActive(s.key)}
                className={`h-9 px-3 -mb-px border-b-2 text-body-sm transition-colors ${
                  isActive
                    ? "border-primary text-primary font-medium"
                    : "border-transparent text-text-secondary hover:text-foreground"
                }`}
              >
                {s.label}
                <span className="ml-1.5 tabular-nums text-caption text-text-tertiary">
                  {counts[s.key]}
                </span>
              </button>
            );
          })}
        </div>
        )}

        <Card className="border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between p-6 pb-4 flex-wrap gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary" />
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-9 w-64 pl-9 text-body-sm bg-card border-border"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 p-0.5 rounded-md border border-border bg-surface-subtle">
                <span className="px-2 text-caption text-text-tertiary">按操作时间</span>
                {dateRanges.map((r) => (
                  <button
                    key={r.key}
                    onClick={() => setRange(r.key)}
                    className={`h-7 px-3 rounded text-body-sm transition-colors ${
                      range === r.key
                        ? "bg-card text-primary shadow-sm"
                        : "text-text-secondary hover:text-foreground"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 text-body-sm font-normal"
                onClick={() => setAdvOpen((v) => !v)}
              >
                <Settings2 className="h-3.5 w-3.5" /> 筛选与列设置
              </Button>
            </div>
          </div>

          {advOpen && (
            <div className="px-6 pb-4 space-y-4">
              <div>
                <div className="text-caption text-text-tertiary mb-2">显示列（筛选仅作用于展示中的列）</div>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {ALL_COLS.map((c) => (
                    <label
                      key={c.key}
                      className={`flex items-center gap-2 text-body-sm ${
                        c.locked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                      }`}
                    >
                      <Checkbox
                        checked={visible[c.key]}
                        disabled={c.locked}
                        onCheckedChange={(v) => setVisible((m) => ({ ...m, [c.key]: !!v }))}
                      />
                      <span>{c.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 border-t border-border pt-4">
                <div>
                  <div className="text-caption text-text-tertiary mb-1.5">操作人</div>
                  <Select value={advOperator} onValueChange={setAdvOperator}>
                    <SelectTrigger className="h-9 text-body-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部</SelectItem>
                      {operators.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <div className="text-caption text-text-tertiary mb-1.5">排序方向</div>
                  <Select value={sortDir} onValueChange={(v) => setSortDir(v as "asc" | "desc")}>
                    <SelectTrigger className="h-9 text-body-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">操作时间倒序（新 → 旧）</SelectItem>
                      <SelectItem value="asc">操作时间正序（旧 → 新）</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}


          <div className="overflow-x-auto border-t border-border">
            <div style={{ minWidth: minW }} className="relative">
              <div className="flex h-12 items-center text-table-header text-text-secondary bg-surface-subtle border-b border-border">
                {leftCols.map((c, i) => (
                  <div
                    key={c.key}
                    style={{ width: c.width, flexShrink: 0, left: leftOffset(c.key) }}
                    className={`sticky z-20 px-3 bg-surface-subtle ${i === 0 ? "pl-6" : ""} ${i === leftCols.length - 1 ? "border-r border-border" : ""}`}
                  >
                    <span>{c.label}</span>
                  </div>
                ))}
                {middleCols.map((c) => (
                  <div key={c.key} style={{ width: c.width, flexShrink: 0 }} className="px-3">
                    {c.isTime ? (
                      <button onClick={toggleSort} className="inline-flex items-center hover:text-foreground">
                        {c.label}
                        {sortIcon(c.key) ?? <ArrowUpDown className="h-3 w-3 ml-1 inline text-text-tertiary" />}
                      </button>
                    ) : (
                      <span>{c.label}</span>
                    )}
                  </div>
                ))}
                {rightCols.map((c, i) => (
                  <div
                    key={c.key}
                    style={{ width: c.width, flexShrink: 0, right: rightOffset(c.key) }}
                    className={`sticky z-20 px-3 bg-surface-subtle ${i === 0 ? "border-l border-border" : ""} ${i === rightCols.length - 1 ? "pr-6" : ""}`}
                  >
                    <span>{c.label}</span>
                  </div>
                ))}
              </div>

              {!mounted ? (
                <div className="px-6 py-12 text-center text-body-sm text-text-tertiary">加载中…</div>
              ) : filtered.length === 0 ? (
                <div className="px-6 py-12 text-center text-body-sm text-text-tertiary">
                  暂无符合条件的{activeStatus.label}记录
                </div>
              ) : (
                filtered.map((o) => (
                  <div
                    key={o.id}
                    className="group/row flex h-12 items-center text-table-cell border-b border-border last:border-0"
                  >
                    {leftCols.map((c, i) => (
                      <div
                        key={c.key}
                        style={{ width: c.width, flexShrink: 0, left: leftOffset(c.key) }}
                        className={`sticky z-10 px-3 bg-card group-hover/row:bg-surface-subtle ${i === 0 ? "pl-6" : ""} ${i === leftCols.length - 1 ? "border-r border-border" : ""}`}
                      >
                        {renderCell(o, c.key)}
                      </div>
                    ))}
                    {middleCols.map((c) => (
                      <div
                        key={c.key}
                        style={{ width: c.width, flexShrink: 0 }}
                        className="px-3 truncate group-hover/row:bg-surface-subtle"
                      >
                        {renderCell(o, c.key)}
                      </div>
                    ))}
                    {rightCols.map((c, i) => (
                      <div
                        key={c.key}
                        style={{ width: c.width, flexShrink: 0, right: rightOffset(c.key) }}
                        className={`sticky z-10 px-3 bg-card group-hover/row:bg-surface-subtle ${i === 0 ? "border-l border-border" : ""} ${i === rightCols.length - 1 ? "pr-6" : ""}`}
                      >
                        {renderCell(o, c.key)}
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="sticky bottom-0 z-30 flex h-10 items-center justify-end px-6 border-t border-border bg-card text-caption text-text-tertiary">
            共 {filtered.length} 条
          </div>
        </Card>
      </main>

      <Sheet open={!!detail} onOpenChange={(o: boolean) => !o && setDetail(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-section-title">{title}详情</SheetTitle>
          </SheetHeader>
          {detail && detailStatus && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-body-sm text-foreground">{detail.id}</span>
                <span className={toneStyles[detailStatus.tone].tag}>{detailStatus.label}</span>
              </div>

              <div className="rounded-md border border-border bg-surface-subtle">
                <div className="grid grid-cols-2 gap-3 px-4 h-9 items-center text-table-header text-text-secondary border-b border-border">
                  <div>物资</div>
                  <div className="text-right">数量</div>
                </div>
                {detail.lines.map((l, i) => (
                  <div key={i} className="grid grid-cols-2 gap-3 px-4 h-10 items-center text-body-sm border-b border-border last:border-0">
                    <div className="text-foreground">{l.item}</div>
                    <div className="text-right text-text-secondary tabular-nums">{l.qty}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-md border border-border p-4">
                <Field label="操作人" value={detail.operator} />
                <Field label="操作时间" value={detail.operatedAt} />
                <Field label="当前状态" value={detailStatus.label} />
                {detail.from && <Field label="出库仓库" value={detail.from} />}
                {detail.to && <Field label="入库仓库" value={detail.to} />}
              </div>

              {detail.desc && (
                <div className="rounded-md border border-border p-4">
                  <div className="text-caption text-text-tertiary mb-1.5">具体描述</div>
                  <p className="text-body-sm text-text-secondary leading-relaxed">{detail.desc}</p>
                </div>
              )}

              {detail.attachments && detail.attachments.length > 0 && (
                <div className="rounded-md border border-border p-4">
                  <div className="text-caption text-text-tertiary mb-2">媒体附件</div>
                  <div className="space-y-1.5">
                    {detail.attachments.map((a, i) => {
                      const Icon = a.type === "audio" ? Mic : a.type === "video" ? Video : FileText;
                      const tone =
                        a.type === "audio"
                          ? "text-[var(--state-warning)] bg-[var(--state-warning)]/10"
                          : a.type === "video"
                            ? "text-primary bg-brand-subtle"
                            : "text-text-secondary bg-surface-subtle";
                      return (
                        <button
                          key={i}
                          className="w-full flex items-center gap-2 px-3 h-9 rounded-md border border-border hover:bg-surface-subtle text-left"
                        >
                          <span className={`h-6 w-6 rounded-md inline-flex items-center justify-center ${tone}`}>
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <span className="text-body-sm text-foreground flex-1 truncate">{a.name}</span>
                          {a.meta && <span className="text-caption text-text-tertiary">{a.meta}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {detailNote && (
                <div className="rounded-md border border-dashed border-border bg-surface-subtle px-4 py-2 text-caption text-text-tertiary">
                  {detailNote}
                </div>
              )}
            </div>
          )}
          <SheetFooter className="gap-2">
            {detail && renderDetailActions ? (
              renderDetailActions(detail, () => setDetail(null))
            ) : detail && reviewStatus !== undefined && detail.status === reviewStatus && onReview ? (
              <>
                <Button
                  variant="outline"
                  className="gap-1.5 text-[var(--state-danger)] hover:text-[var(--state-danger)] hover:bg-[var(--state-danger)]/10"
                  onClick={() => { onReview!(detail, "reject"); setDetail(null); }}
                >
                  <X className="h-3.5 w-3.5" /> 驳回
                </Button>
                <Button
                  className="gap-1.5 bg-primary hover:bg-[var(--brand-hover)] text-primary-foreground"
                  onClick={() => { onReview!(detail, "approve"); setDetail(null); }}
                >
                  <Check className="h-3.5 w-3.5" /> 通过
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setDetail(null)}>关闭</Button>
            )}
          </SheetFooter>

        </SheetContent>
      </Sheet>
    </TooltipProvider>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="leading-tight">
      <div className="text-caption text-text-tertiary">{label}</div>
      <div className="text-body-sm text-foreground mt-0.5">{value}</div>
    </div>
  );
}
