import { X, Check, ScanLine, Pill } from "lucide-react";
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
  holder?: string;
  spec?: string;
  batch?: string;
  code?: string;
  /** 剩余可选的未使用数；为 0 时不可选 */
  remaining?: number;
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
  const list = items;

  if (!open) return null;

  const handleScan = () => {
    // 演示：随机选中一个候选项以模拟扫码识别成功
    const pool = items.filter((i) => (i.remaining ?? 1) > 0);
    const pick = pool[Math.floor(Math.random() * pool.length)];
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
            从三级库选择
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
          <div className="flex-1 text-caption text-text-tertiary">
            本牧场所有人三级库内未使用的药品 · 共 {items.length} 件
          </div>
          <button
            type="button"
            onClick={handleScan}
            className="h-9 px-3 inline-flex items-center gap-1 rounded-lg bg-brand-subtle text-primary text-body-sm shrink-0"
          >
            <ScanLine className="h-4 w-4" /> 扫码录入
          </button>
        </div>

        <div className="p-4 space-y-2 overflow-y-auto flex-1">
          {list.length === 0 ? (
            <div className="text-center py-12 text-body-sm text-text-tertiary">
              三级库暂无未使用药品
            </div>
          ) : (
            list.map((i) => {
              const selected = i.id === selectedId;
              const disabled = !selected && (i.remaining ?? 1) <= 0;
              return (
                <button
                  key={i.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    onSelect(i);
                    onClose();
                  }}
                  className={`w-full text-left rounded-xl border p-3 bg-card transition-colors ${
                    disabled
                      ? "border-border opacity-50 cursor-not-allowed"
                      : selected
                      ? "border-primary"
                      : "border-border active:bg-surface-subtle"
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-caption text-text-tertiary mb-1.5">
                    <span className="font-mono">{i.code ?? i.id}</span>
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
                  {(i.holder || i.spec) && (
                    <div className="mt-1 text-caption text-text-tertiary">
                      {i.spec}{i.holder ? ` · 领用人 ${i.holder}` : ""}
                      {i.remaining !== undefined && (
                        <span className={i.remaining > 0 ? "text-primary" : "text-destructive"}>
                          {" · "}未使用 {Math.max(0, i.remaining)} 件
                        </span>
                      )}
                    </div>
                  )}
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
