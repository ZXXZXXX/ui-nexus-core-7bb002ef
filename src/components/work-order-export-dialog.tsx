import { useState } from "react";
import { Download, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type ExportDateField = "createdAt" | "reviewedAt" | "executedAt";

export type ExportOptions = {
  dateField: ExportDateField;
  from: string;
  to: string;
  keys: string[];
};

/** 工单导出：先选择时间范围与表头，再导出 CSV */
export function WorkOrderExportButton({
  columns,
  defaultKeys,
  defaultDateField = "createdAt",
  onExport,
}: {
  columns: { key: string; label: string }[];
  defaultKeys?: string[];
  defaultDateField?: ExportDateField;
  onExport: (opts: ExportOptions) => number;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [open, setOpen] = useState(false);
  const [dateField, setDateField] = useState<ExportDateField>(defaultDateField);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState(today);
  const [keys, setKeys] = useState<string[]>(defaultKeys ?? columns.map((c) => c.key));

  const toggle = (k: string) =>
    setKeys((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));

  const allChecked = keys.length === columns.length;

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        title="导出数据"
        aria-label="导出数据"
        className="h-9 w-9 shrink-0"
        onClick={() => setOpen(true)}
      >
        <Download className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-section">导出工单数据</DialogTitle>
            <DialogDescription className="text-body-sm text-text-secondary">
              选择导出的时间范围与需要包含的表头字段，导出为 CSV 文件。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-1">
            <div>
              <div className="text-body-sm text-foreground mb-2">时间范围</div>
              <div className="flex items-center gap-2 flex-wrap">
                <Select value={dateField} onValueChange={(v) => setDateField(v as ExportDateField)}>
                  <SelectTrigger className="h-9 w-[120px] text-body-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">按提出时间</SelectItem>
                    <SelectItem value="reviewedAt">按诊断时间</SelectItem>
                    <SelectItem value="executedAt">按执行时间</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-1.5 h-9 px-2.5 rounded-md border border-border bg-card">
                  <CalendarDays className="h-3.5 w-3.5 text-text-tertiary" />
                  <input
                    type="date"
                    value={from}
                    max={to || undefined}
                    onChange={(e) => setFrom(e.target.value)}
                    className="h-7 w-[118px] bg-transparent text-body-sm text-foreground outline-none tabular-nums"
                  />
                  <span className="text-text-tertiary text-caption">至</span>
                  <input
                    type="date"
                    value={to}
                    min={from || undefined}
                    onChange={(e) => setTo(e.target.value)}
                    className="h-7 w-[118px] bg-transparent text-body-sm text-foreground outline-none tabular-nums"
                  />
                </div>
              </div>
              <p className="mt-1.5 text-caption text-text-tertiary">
                {from ? `${from} 至 ${to || "今日"}` : `不限起始日期，至 ${to || "今日"}`}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-body-sm text-foreground">导出表头（{keys.length}）</div>
                <button
                  type="button"
                  className="text-caption text-primary hover:underline"
                  onClick={() => setKeys(allChecked ? [] : columns.map((c) => c.key))}
                >
                  {allChecked ? "全不选" : "全选"}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 max-h-[220px] overflow-y-auto pr-1">
                {columns.map((c) => (
                  <label
                    key={c.key}
                    className="flex items-center gap-2 h-8 px-2 rounded-md hover:bg-surface-subtle cursor-pointer"
                  >
                    <Checkbox checked={keys.includes(c.key)} onCheckedChange={() => toggle(c.key)} />
                    <span className="text-body-sm text-text-secondary truncate">{c.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="h-9 text-body-sm font-normal" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button
              disabled={!keys.length}
              className="h-9 text-body-sm font-normal bg-primary hover:bg-[var(--brand-hover)] text-primary-foreground"
              onClick={() => {
                const ordered = columns.filter((c) => keys.includes(c.key)).map((c) => c.key);
                onExport({ dateField, from, to, keys: ordered });
                setOpen(false);
              }}
            >
              导出 CSV
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
