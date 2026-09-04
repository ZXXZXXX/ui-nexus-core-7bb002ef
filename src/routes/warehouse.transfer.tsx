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
      { name: "description", content: "以调拨单为维度查看牧场药品调拨记录，含调拨类型、药品数目、流转仓库与登记人员。" },
      { property: "og:title", content: "调拨记录 — 奇点智牧" },
      { property: "og:description", content: "牧场药品调拨台账。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TransferPage,
});

type TransferItem = {
  code: string; // 商品编码
  name: string; // 药品展示名称
  spec: string; // 规格型号
  qty: number; // 调拨数量
  unit: string; // 基础单位
};

type TransferRow = {
  id: string; // 调拨记录编码
  type: "出库" | "入库"; // 调拨类型
  items: TransferItem[]; // 药品明细
  fromStore: string; // 调出仓库
  toStore: string; // 调入仓库
  requestedAt: string; // 登记出库时间
  requester: string; // 出库登记人
  inboundAt: string; // 登记入库时间
  inboundBy: string; // 入库登记人
  remark: string; // 备注信息
};

const initial: TransferRow[] = [
  {
    id: "TR-2026-0142",
    type: "入库",
    items: [
      { code: "01-00063", name: "乳房炎抗生素 5mg", spec: "100ml（含5g）/瓶", qty: 20, unit: "支" },
      { code: "04-00412", name: "营养补充剂 复合维生素", spec: "10ml/支", qty: 6, unit: "罐" },
    ],
    fromStore: "1 号库",
    toStore: "2 号库",
    requestedAt: "2026-05-19 08:52",
    requester: "李兽医",
    inboundAt: "2026-05-19 10:24",
    inboundBy: "王建国",
    remark: "昨日用量超预期，1 号库紧急补货至 2 号库",
  },
  {
    id: "TR-2026-0141",
    type: "出库",
    items: [
      { code: "02-00214", name: "口蹄疫疫苗 A 型", spec: "50ml/瓶", qty: 60, unit: "支" },
    ],
    fromStore: "中心库",
    toStore: "1 号库",
    requestedAt: "2026-05-18 17:20",
    requester: "李兽医",
    inboundAt: "2026-05-19 09:08",
    inboundBy: "王建国",
    remark: "5 月加强免疫备货",
  },
  {
    id: "TR-2026-0140",
    type: "入库",
    items: [
      { code: "03-00306", name: "驱虫剂 伊维菌素", spec: "100ml（含1g）/瓶", qty: 15, unit: "瓶" },
      { code: "05-00521", name: "消毒液 戊二醛", spec: "5L/桶", qty: 4, unit: "桶" },
      { code: "01-00063", name: "乳房炎抗生素 5mg", spec: "100ml（含5g）/瓶", qty: 10, unit: "支" },
    ],
    fromStore: "中心库",
    toStore: "3 号库",
    requestedAt: "2026-05-18 14:05",
    requester: "周主管",
    inboundAt: "2026-05-18 16:42",
    inboundBy: "孙库管",
    remark: "季度体内驱虫批次",
  },
  {
    id: "TR-2026-0139",
    type: "出库",
    items: [
      { code: "05-00521", name: "消毒液 戊二醛", spec: "5L/桶", qty: 8, unit: "桶" },
    ],
    fromStore: "2 号库",
    toStore: "中心库",
    requestedAt: "2026-05-18 09:40",
    requester: "周主管",
    inboundAt: "2026-05-18 11:30",
    inboundBy: "孙库管",
    remark: "",
  },
];

const columns: ListColumn<TransferRow>[] = [
  { key: "id", label: "调拨记录编码", required: true, render: (r) => <span className="font-mono text-body text-foreground">{r.id}</span> },
  {
    key: "type", label: "调拨类型", filter: "select",
    render: (r) => (
      <span className={`tag ${r.type === "入库" ? "tag-brand" : "tag-warning"}`}>{r.type}</span>
    ),
  },
  {
    key: "itemCount", label: "药品数目", filter: "number", value: (r) => r.items.length,
    render: (r) => <span className="text-body tabular-nums text-foreground">{r.items.length}</span>,
  },
  {
    key: "flow", label: "调拨流向", value: (r) => `${r.fromStore} → ${r.toStore}`,
    render: (r) => <span className="text-body-sm text-text-secondary">{r.fromStore} → {r.toStore}</span>,
  },
  { key: "requestedAt", label: "登记出库时间", date: true, filter: "date", render: (r) => <span className="text-body-sm text-text-secondary tabular-nums">{r.requestedAt}</span> },
  { key: "requester", label: "出库登记人", filter: "select", render: (r) => <span className="text-body-sm text-text-secondary">{r.requester}</span> },
  { key: "inboundAt", label: "登记入库时间", date: true, filter: "date", render: (r) => <span className="text-body-sm text-text-secondary tabular-nums">{r.inboundAt}</span> },
  { key: "inboundBy", label: "入库登记人", filter: "select", render: (r) => <span className="text-body-sm text-text-secondary">{r.inboundBy}</span> },
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
        searchKeys={["id", "requester"]}
        searchPlaceholder="按调拨记录编码 / 出库登记人搜索"
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
        <span className={`h-2 w-2 rounded-full ${highlight ? "bg-primary" : "bg-border"}`} />
        <span className="text-caption text-text-tertiary">{stage}</span>
        {highlight && <span className="text-caption text-primary">本仓库</span>}
      </div>
      <div className={`rounded-lg border px-3 py-2.5 ${highlight ? "border-primary bg-primary/5" : "border-border bg-background/40"}`}>
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
                调拨详情
                <span className="ml-2 text-body-sm font-normal text-text-tertiary">{row.id}</span>
              </SheetTitle>
              <SheetDescription className="text-caption text-text-tertiary">
                查看该次调拨的药品明细与流转信息。
              </SheetDescription>
            </SheetHeader>

            <div className="mt-5 space-y-5">
              <Section title="基础信息">
                <Field label="调拨记录编码" value={<span className="font-mono">{row.id}</span>} />
                <div className="border-t border-border/60" />
                <Field label="调拨类型" value={<span className={`tag ${row.type === "入库" ? "tag-brand" : "tag-warning"}`}>{row.type}</span>} />
                <div className="border-t border-border/60" />
                <Field label="药品数目" value={<span className="tabular-nums">{row.items.length}</span>} />
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

              <section>
                <div className="mb-2 flex items-center gap-2">
                  <span className="h-3 w-[3px] rounded-full bg-primary" />
                  <span className="text-body-sm font-medium text-foreground">药品明细 · {row.items.length} 种</span>
                </div>
                <div className="rounded-lg border border-border bg-card divide-y divide-border">
                  {row.items.map((it) => (
                    <div key={it.code} className="px-4 py-3 space-y-1">
                      <div className="flex items-center justify-between gap-4">
                        <span className="truncate text-body-sm font-medium text-foreground">{it.name}</span>
                        <span className="shrink-0 text-body-sm tabular-nums text-foreground">{it.qty} {it.unit}</span>
                      </div>
                      <div className="text-caption text-text-tertiary">
                        <span className="font-mono">{it.code}</span> · {it.spec}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

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
