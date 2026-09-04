import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ListPage, type ListColumn } from "@/components/list-page";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/warehouse/transfer")({
  head: () => ({
    meta: [
      { title: "调拨记录 — 奇点智牧" },
      { name: "description", content: "查看牧场药品调拨入库记录，含商品编码、规格型号、调拨数量与登记人员。" },
      { property: "og:title", content: "调拨记录 — 奇点智牧" },
      { property: "og:description", content: "牧场药品调拨入库台账。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TransferPage,
});

type TransferRow = {
  id: string;
  code: string; // 商品编码
  name: string; // 药品展示名称
  spec: string; // 规格型号
  type: "出库" | "入库"; // 调拨类型
  qty: number; // 调拨数量
  unit: string;
  inboundAt: string; // 登记入库时间
  operator: string; // 登记人员
  remark: string; // 备注信息
  fromStore: string; // 调出仓库
  toStore: string; // 调入仓库
  requestedAt: string; // 登记出库时间
  requester: string; // 出库登记人
  inboundBy: string; // 入库登记人
};

const initial: TransferRow[] = [
  { id: "TR-2026-0142", code: "01-00063", name: "乳房炎抗生素 5mg", spec: "100ml（含5g）/瓶", type: "入库", qty: 20, unit: "支", inboundAt: "2026-05-19 10:24", operator: "王建国", remark: "昨日用量超预期，1 号库紧急补货至 2 号库", fromStore: "1 号库", toStore: "2 号库", requestedAt: "2026-05-19 08:52", requester: "李兽医", inboundBy: "王建国" },
  { id: "TR-2026-0141", code: "02-00214", name: "口蹄疫疫苗 A 型", spec: "50ml/瓶", type: "出库", qty: 60, unit: "支", inboundAt: "2026-05-19 09:08", operator: "王建国", remark: "5 月加强免疫备货", fromStore: "中心库", toStore: "1 号库", requestedAt: "2026-05-18 17:20", requester: "李兽医", inboundBy: "王建国" },
  { id: "TR-2026-0140", code: "03-00306", name: "驱虫剂 伊维菌素", spec: "100ml（含1g）/瓶", type: "入库", qty: 15, unit: "瓶", inboundAt: "2026-05-18 16:42", operator: "孙库管", remark: "季度体内驱虫批次", fromStore: "中心库", toStore: "3 号库", requestedAt: "2026-05-18 14:05", requester: "周主管", inboundBy: "孙库管" },
  { id: "TR-2026-0139", code: "05-00521", name: "消毒液 戊二醛", spec: "5L/桶", type: "出库", qty: 8, unit: "桶", inboundAt: "2026-05-18 11:30", operator: "孙库管", remark: "", fromStore: "2 号库", toStore: "中心库", requestedAt: "2026-05-18 09:40", requester: "周主管", inboundBy: "孙库管" },
];

const columns: ListColumn<TransferRow>[] = [
  { key: "code", label: "商品编码", required: true, render: (r) => <span className="font-mono text-body text-foreground">{r.code}</span> },
  { key: "name", label: "药品展示名称", required: true, render: (r) => <span className="text-body text-foreground truncate">{r.name}</span> },
  { key: "spec", label: "规格型号", render: (r) => <span className="text-body-sm text-text-secondary truncate">{r.spec}</span> },
  {
    key: "type", label: "调拨类型", filter: "select",
    render: (r) => (
      <span className={`tag ${r.type === "入库" ? "tag-brand" : "tag-warning"}`}>{r.type}</span>
    ),
  },
  {
    key: "qty", label: "调拨数量", filter: "number", value: (r) => r.qty,
    render: (r) => <span className="text-body tabular-nums text-foreground">{r.qty}</span>,
  },
  { key: "unit", label: "基础单位", filter: "select", render: (r) => <span className="text-body-sm text-text-secondary">{r.unit}</span> },
  { key: "inboundAt", label: "登记入库时间", date: true, filter: "date", render: (r) => <span className="text-body-sm text-text-secondary tabular-nums">{r.inboundAt}</span> },
  { key: "operator", label: "登记人员", filter: "select", render: (r) => <span className="text-body-sm text-text-secondary">{r.operator}</span> },
  {
    key: "remark", label: "备注信息",
    render: (r) => (
      <span className="text-body-sm text-text-secondary truncate">{r.remark || "—"}</span>
    ),
  },
];

function TransferPage() {
  const [detail, setDetail] = useState<TransferRow | null>(null);

  return (
    <>
      <ListPage<TransferRow>
        title="调拨记录"
        breadcrumb={["仓库管理", "调拨记录"]}
        rows={initial}
        columns={columns}
        searchKeys={["name", "code"]}
        searchPlaceholder="按药品名称 / 商品编码搜索"
        getRowKey={(r) => r.id}
        rowActions={(r) => (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-body-sm font-normal text-text-secondary hover:bg-surface-subtle hover:text-foreground"
            onClick={() => setDetail(r)}
          >
            查看
          </Button>
        )}
      />

      <DetailDrawer row={detail} onClose={() => setDetail(null)} />
    </>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <div className="shrink-0 text-body-sm text-text-tertiary">{label}</div>
      <div className="min-w-0 text-right text-body-sm text-foreground">{value || "—"}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <span className="h-3 w-[3px] rounded-full bg-primary" />
        <span className="text-body-sm font-medium text-foreground">{title}</span>
      </div>
      <div className="rounded-lg border border-border bg-card px-4 py-1">{children}</div>
    </section>
  );
}

function FlowNode({
  stage,
  store,
  time,
  person,
  highlight,
}: {
  stage: string;
  store: string;
  time: string;
  person: string;
  highlight?: boolean;
}) {
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-2 flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${highlight ? "bg-primary" : "bg-border"}`}
        />
        <span className="text-caption text-text-tertiary">{stage}</span>
        {highlight && <span className="text-caption text-primary">本仓库</span>}
      </div>
      <div className="rounded-lg border border-border bg-background/40 px-3 py-2.5">
        <div className={`truncate text-body-sm font-medium ${highlight ? "text-primary" : "text-foreground"}`}>
          {store}
        </div>
        <div className="mt-1 text-caption tabular-nums text-text-secondary">{time || "—"}</div>
        <div className="mt-0.5 text-caption text-text-tertiary">登记人 {person || "—"}</div>
      </div>
    </div>
  );
}

function DetailDrawer({ row, onClose }: { row: TransferRow | null; onClose: () => void }) {
  return (
    <Sheet open={!!row} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:w-[520px] sm:max-w-none overflow-y-auto bg-card">
        {row && (
          <>
            <SheetHeader className="text-left px-0 pb-4 border-b border-border">
              <SheetTitle className="text-section text-foreground">
                {row.name}
                <span className="ml-2 text-body-sm font-normal text-text-tertiary">{row.code}</span>
              </SheetTitle>
              <SheetDescription className="text-caption text-text-tertiary">
                调拨单号 {row.id} · 调拨数量 {row.qty} {row.unit}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-5 space-y-5">
              <Section title="基础信息">
                <Field label="商品编码" value={<span className="font-mono">{row.code}</span>} />
                <div className="border-t border-border/60" />
                <Field label="药品展示名称" value={row.name} />
                <div className="border-t border-border/60" />
                <Field label="规格型号" value={row.spec} />
                <div className="border-t border-border/60" />
                <Field label="调拨类型" value={<span className={`tag ${row.type === "入库" ? "tag-brand" : "tag-warning"}`}>{row.type}</span>} />
                <div className="border-t border-border/60" />
                <Field label="调拨数量" value={<span className="tabular-nums">{row.qty}</span>} />
                <div className="border-t border-border/60" />
                <Field label="基础单位" value={row.unit} />
                <div className="border-t border-border/60" />
                <Field label="登记人员" value={row.operator} />
              </Section>

              <Section title="流转信息">
                <div className="flex items-stretch gap-3 py-4">
                  <FlowNode
                    stage="出库"
                    store={row.fromStore}
                    time={row.requestedAt}
                    person={row.requester}
                    highlight={row.type === "出库"}
                  />
                  <div className="flex shrink-0 items-center pt-6">
                    <span className="h-[1px] w-4 bg-border" />
                    <span className="text-text-tertiary">→</span>
                    <span className="h-[1px] w-4 bg-border" />
                  </div>
                  <FlowNode
                    stage="入库"
                    store={row.toStore}
                    time={row.inboundAt}
                    person={row.inboundBy}
                    highlight={row.type === "入库"}
                  />
                </div>
              </Section>


              <Section title="备注信息">
                <div className="py-2.5 text-body-sm leading-relaxed text-text-secondary">
                  {row.remark || "—"}
                </div>
              </Section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
