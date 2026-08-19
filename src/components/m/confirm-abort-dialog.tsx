import { AlertTriangle } from "lucide-react";

type Props = {
  open: boolean;
  orderId?: string;
  reason?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

/**
 * M 端工单终止二次确认弹窗。
 * 最终提交终止前调用，提醒操作员终止后不可恢复。
 */
export function ConfirmAbortDialog({
  open,
  orderId,
  reason,
  onCancel,
  onConfirm,
}: Props) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-[360px] rounded-2xl bg-card p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <span className="h-9 w-9 rounded-full bg-[color-mix(in_oklab,var(--state-danger)_14%,transparent)] inline-flex items-center justify-center">
            <AlertTriangle className="h-4 w-4 text-[var(--state-danger)]" />
          </span>
          <h3 className="text-card-title text-foreground">确认终止工单</h3>
        </div>
        <p className="text-body-sm text-text-secondary leading-relaxed">
          工单终止后将无法恢复，请确认是否继续。
          {orderId && (
            <>
              <br />
              <span className="font-mono text-foreground">{orderId}</span>
            </>
          )}
          {reason && (
            <>
              <br />
              终止原因：
              <span className="text-foreground font-medium">{reason}</span>
            </>
          )}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 h-10 rounded-lg border border-border bg-card text-body-sm text-text-secondary"
          >
            取消
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 h-10 rounded-lg bg-[var(--state-danger)] text-white text-body-sm"
          >
            确认终止
          </button>
        </div>
      </div>
    </div>
  );
}
