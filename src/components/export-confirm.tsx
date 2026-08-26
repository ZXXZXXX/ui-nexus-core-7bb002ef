import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/** 列表页下载按钮：点击后二次确认再导出 CSV */
export function ExportConfirmButton({
  onConfirm,
  count,
  title = "下载当前列表数据",
}: {
  onConfirm: () => void;
  count?: number;
  title?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        title="导出当前筛选结果"
        aria-label="导出当前筛选结果"
        className="h-9 w-9 shrink-0"
        onClick={() => setOpen(true)}
      >
        <Download className="h-4 w-4" />
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="sm:max-w-[420px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-section">{title}</AlertDialogTitle>
            <AlertDialogDescription className="text-body-sm text-text-secondary">
              将按当前筛选条件与显示列导出
              {typeof count === "number" ? ` ${count} 条` : ""}数据为 CSV 文件，是否继续？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-9 text-body-sm font-normal">取消</AlertDialogCancel>
            <AlertDialogAction
              className="h-9 text-body-sm font-normal bg-primary hover:bg-[var(--brand-hover)] text-primary-foreground"
              onClick={() => onConfirm()}
            >
              下载 CSV
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
