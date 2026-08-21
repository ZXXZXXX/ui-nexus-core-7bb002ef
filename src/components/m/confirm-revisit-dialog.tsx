import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type Props = {
  open: boolean;
  orderId: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

/**
 * M 端复诊上报二次确认弹窗。
 * 选择“复诊”后调用，确认后自动完结当前工单并跳转新上报。
 */
export function ConfirmRevisitDialog({
  open,
  orderId,
  onOpenChange,
  onConfirm,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-32px)] max-w-[360px] rounded-2xl border border-border bg-card p-5 gap-0 shadow-xl [&>button]:hidden">
        <DialogHeader className="text-left space-y-2">
          <DialogTitle className="text-card-title text-foreground font-medium">
            前往复诊上报
          </DialogTitle>
          <DialogDescription className="text-body-sm text-text-secondary leading-relaxed">
            确认后，本工单{" "}
            <span className="font-mono text-foreground">{orderId}</span>{" "}
            将自动完结，并在新的复诊上报中自动关联本工单的所有信息字段。
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-5 flex flex-row gap-2 sm:justify-end">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex-1 h-10 rounded-lg border border-border bg-card text-body-sm text-text-secondary"
          >
            取消
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-body-sm"
          >
            确认并前往
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
