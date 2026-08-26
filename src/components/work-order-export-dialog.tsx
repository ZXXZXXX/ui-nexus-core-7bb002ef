import { useState } from "react";
import { Download } from "lucide-react";
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

export type ExportOptions = {
  keys: string[];
};

/** 工单导出：基于当前页面筛选结果，选择需要显隐的表头字段后导出 CSV */
export function WorkOrderExportButton({
  columns,
  defaultKeys,
  count,
  onExport,
}: {
  columns: { key: string; label: string }[];
  defaultKeys?: string[];
  count: number;
  onExport: (opts: ExportOptions) => number;
}) {
  const [open, setOpen] = useState(false);
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
            <DialogTitle className="text-section">导出当前列表数据</DialogTitle>
            <DialogDescription className="text-body-sm text-text-secondary">
              基于当前筛选结果，共 {count} 条。选择需要导出的表头字段，导出为 CSV 文件。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-1">
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
                onExport({ keys: ordered });
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
