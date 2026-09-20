import { useMemo, useState } from "react";
import { X, Search, Check, ScanLine, Pill } from "lucide-react";
import { toast } from "sonner";

export type DrugItem = {
  id: string;
  name: string;
  /** 规格单位（采购/库存单位，如 瓶、盒） */
  specUnit: string;
  /** 用药单位（最小使用单位，如 ml、支） */
  doseUnit: string;
  /** 1 规格单位 = 多少用药单位 */
  perSpec: number;
  /** 单价：元 / 规格单位 */
  price: number;
};

export function DrugItemPicker({
  open,
  onClose,
  items,
  selectedId,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  items: DrugItem[];
  selectedId?: string;
  onSelect: (item: DrugItem) => void;
}) {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const kw = q.trim().toLowerCase();
    if (!kw) return items;
    return items.filter(
      (i) =>
        i.id.toLowerCase().includes(kw) ||
        i.name.toLowerCase().includes(kw),
    );
  }, [items, q]);

  if (!open) return null;

  const handleScan = () => {
    // 演示：随机选中一个候选项以模拟扫码识别成功
    const pick = items[Math.floor(Math.random() * items.length)];
    if (pick) {
      toast.success(`扫码识别：${pick.name}`);
      onSelect(pick);
      onClose();
    } else {
      toast("已唤起扫码（演示）");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[440px] bg-card rounded-t-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 h-12 flex items-center justify-between border-b border-border shrink-0">
          <div className="text-body font-medium text-foreground">
            选择损耗物品
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 -mr-2 inline-flex items-center justify-center text-text-tertiary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4 pt-3 shrink-0 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜索物品编号 / 名称"
              className="w-full h-10 pl-9 pr-3 rounded-lg bg-surface-subtle border border-border text-body-sm placeholder:text-text-tertiary"
            />
          </div>
          <button
            type="button"
            onClick={handleScan}
            className="h-10 w-10 inline-flex items-center justify-center rounded-lg bg-brand-subtle text-primary shrink-0"
            aria-label="扫码录入"
          >
            <ScanLine className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 space-y-2 overflow-y-auto flex-1">
          {list.length === 0 ? (
            <div className="text-center py-12 text-body-sm text-text-tertiary">
              无匹配物品
            </div>
          ) : (
            list.map((i) => {
              const selected = i.id === selectedId;
              return (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => {
                    onSelect(i);
                    onClose();
                  }}
                  className={`w-full text-left rounded-xl border p-3 bg-card transition-colors ${
                    selected
                      ? "border-primary"
                      : "border-border active:bg-surface-subtle"
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-caption text-text-tertiary mb-1.5">
                    <span className="font-mono">{i.id}</span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <Pill className="h-3 w-3" />
                      1{i.specUnit} = {i.perSpec}
                      {i.doseUnit}
                    </span>
                    <span className="ml-auto tabular-nums text-text-secondary">
                      ¥ {i.price}/{i.specUnit}
                    </span>
                  </div>
                  <div className="text-body-sm text-foreground font-medium truncate">
                    {i.name}
                  </div>
                  {selected && (
                    <div className="mt-1.5 inline-flex items-center gap-0.5 text-caption text-primary font-medium">
                      <Check className="h-3.5 w-3.5" />
                      已选
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
