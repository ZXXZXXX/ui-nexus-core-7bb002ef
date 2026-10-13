import type React from "react";
import { useState } from "react";
import { Barcode } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { groupDigits, type CodeNode } from "@/lib/inventory";

/* ------------------------------ 分层条码 ------------------------------ */

/** 条码分层展示：外包装码为分组标题，其内层条码直接列出；未成整包的散件只有一层 */
export function CodeTree({ nodes }: { nodes: CodeNode[] }) {
  if (!nodes.length) return <div className="py-6 text-center text-body-sm text-text-tertiary">暂无条码</div>;
  return (
    <div className="space-y-3">
      {nodes.map((n) =>
        n.children.length ? (
          <div key={n.code} className="rounded-md border border-border p-3">
            <div className="flex items-center gap-2">
              <span className="shrink-0 rounded bg-primary/10 px-1.5 text-caption text-primary">外包装</span>
              <span className="font-mono text-body font-medium tabular-nums text-foreground">{groupDigits(n.code)}</span>
              <span className="ml-auto shrink-0 text-caption text-text-tertiary">内含 {n.children.length}</span>
            </div>
            <ul className="mt-2 space-y-1 border-t border-border pt-2">
              {n.children.map((c) => (
                <li key={c} className="font-mono text-body-sm tabular-nums text-text-secondary">{groupDigits(c)}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div key={n.code} className="flex items-center gap-2 px-3 py-0.5">
            <span className="shrink-0 rounded bg-muted px-1.5 text-caption text-text-tertiary">散件</span>
            <span className="font-mono text-body-sm tabular-nums text-text-secondary">{groupDigits(n.code)}</span>
          </div>
        ),
      )}
    </div>
  );
}

/** 数量数字即条码入口：点击后在弹窗中查看该数量对应的药品条码 */
export function FlowCodes({ nodes, title, children }: { nodes: CodeNode[]; title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} title="查看药品条码" className="group flex shrink-0 items-center gap-1.5 rounded-md px-2 py-0.5 -mr-2 transition-colors hover:bg-muted">
        <Barcode className="h-4 w-4 text-text-tertiary group-hover:text-primary" />
        <span className="text-body font-medium tabular-nums text-foreground underline decoration-dotted decoration-text-tertiary underline-offset-4 group-hover:text-primary group-hover:decoration-primary">{children}</span>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>药品条码</DialogTitle>
            <DialogDescription>{title}</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto pr-1"><CodeTree nodes={nodes} /></div>
        </DialogContent>
      </Dialog>
    </>
  );
}
