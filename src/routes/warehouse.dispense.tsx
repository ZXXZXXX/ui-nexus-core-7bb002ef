import { useState } from "react";
import { createPortal } from "react-dom";
import { createFileRoute } from "@tanstack/react-router";
import { ListPage, type ListColumn } from "@/components/list-page";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export const Route = createFileRoute("/warehouse/dispense")({
  head: () => ({
    meta: [
      { title: "取药记录 — 奇点智牧" },
      { name: "description", content: "查看牧场药品领取台账，含领取数量、领取人员与药品使用状态。" },
      { property: "og:title", content: "取药记录 — 奇点智牧" },
      { property: "og:description", content: "牧场药品领取与退回台账。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DispensePage,
});

type DrugStatus = "未使用" | "已使用" | "已退回";

type DispenseRow = {
  id: string;
  code: string; // 商品编码
  name: string; // 药品展示名称
  spec: string; // 规格型号
  qty: number; // 领取数量
  unit: string;
  takenAt: string; // 领取时间
  operator: string; // 领取人员
  status: DrugStatus; // 药品状态
  usedQty: number; // 已使用数量
  returnedQty: number; // 已退回数量
  users: string[]; // 使用人员
  cows: string[]; // 用药牛只耳号
  usage: { user: string; cows: string[] }[]; // 按人员维度：该人员用于哪些牛只
  remark: string; // 备注（仅已退回有值）
};

const initial: DispenseRow[] = [
  { id: "DP-3202", code: "01-00063", name: "乳房炎抗生素 5mg", spec: "100ml（含5g）/瓶", qty: 3, unit: "支", takenAt: "2026-05-12 10:36", operator: "李雨晴", status: "未使用", usedQty: 0, returnedQty: 0, users: ["李雨晴"], cows: ["1042"], usage: [{ user: "李雨晴", cows: ["1042"] }], remark: "" },
  { id: "DP-3201", code: "01-00063", name: "乳房炎抗生素 5mg", spec: "100ml（含5g）/瓶", qty: 2, unit: "支", takenAt: "2026-05-12 09:42", operator: "李雨晴", status: "已使用", usedQty: 2, returnedQty: 0, users: ["李雨晴", "王建国"], cows: ["2087", "2091", "3110", "3122"], usage: [{ user: "李雨晴", cows: ["2087", "2091"] }, { user: "王建国", cows: ["3110", "3122"] }], remark: "" },
  { id: "DP-3200", code: "02-00214", name: "口蹄疫疫苗 A 型", spec: "50ml/瓶", qty: 5, unit: "支", takenAt: "2026-05-12 08:15", operator: "陈晓东", status: "已使用", usedQty: 4, returnedQty: 1, users: ["陈晓东", "刘敏", "赵强"], cows: ["0431", "0432", "0455", "0478", "0509", "0611"], usage: [{ user: "陈晓东", cows: ["0431", "0432"] }, { user: "刘敏", cows: ["0455", "0478"] }, { user: "赵强", cows: ["0509", "0611"] }], remark: "" },
  { id: "DP-3199", code: "03-00306", name: "驱虫剂 伊维菌素", spec: "100ml（含1g）/瓶", qty: 10, unit: "瓶", takenAt: "2026-05-11 16:38", operator: "李雨晴", status: "已使用", usedQty: 7, returnedQty: 0, users: ["李雨晴"], cows: ["1201", "1202", "1233"], usage: [{ user: "李雨晴", cows: ["1201", "1202", "1233"] }], remark: "" },
  { id: "DP-3198", code: "05-00521", name: "消毒液 戊二醛", spec: "5L/桶", qty: 2, unit: "桶", takenAt: "2026-05-11 14:02", operator: "孙库管", status: "已退回", usedQty: 0, returnedQty: 2, users: ["孙库管"], cows: [], usage: [{ user: "孙库管", cows: [] }], remark: "3 号牛舍消毒改期，整桶未拆封退回一级库" },
  { id: "DP-3197", code: "04-00412", name: "营养补充剂 复合维生素", spec: "10ml/支", qty: 1, unit: "罐", takenAt: "2026-05-11 10:20", operator: "李雨晴", status: "已使用", usedQty: 1, returnedQty: 0, users: ["李雨晴", "周敏"], cows: ["3301", "3315"], usage: [{ user: "李雨晴", cows: ["3301"] }, { user: "周敏", cows: ["3315"] }], remark: "" },
  { id: "DP-3196", code: "01-00071", name: "头孢噻呋钠", spec: "100ml（含5g）/瓶", qty: 2, unit: "支", takenAt: "2026-05-11 09:05", operator: "王建国", status: "已退回", usedQty: 1, returnedQty: 1, users: ["王建国"], cows: ["2210"], usage: [{ user: "王建国", cows: ["2210"] }], remark: "工单 WO-2350 已终止，未开封退回" },
];

const USE_COLORS = { unused: "#D5D9D7", used: "#23A969", returned: "#F09A3E" };

/** 横向堆积条形图：未使用（灰） / 已使用（绿） / 已退回（橙） */
function UsageBar({ row }: { row: DispenseRow }) {
  const used = Math.min(row.usedQty, row.qty);
  const returned = Math.min(row.returnedQty, Math.max(row.qty - used, 0));
  const unused = Math.max(row.qty - used - returned, 0);
  const total = row.qty || 1;
  const seg = [
    { k: "已使用", v: used, c: USE_COLORS.used },
    { k: "已退回", v: returned, c: USE_COLORS.returned },
    { k: "未使用", v: unused, c: USE_COLORS.unused },
  ].filter((s) => s.v > 0);

  const [tip, setTip] = useState<{ x: number; y: number } | null>(null);

  return (
    <>
      <div
        className="w-[4.5em] py-1.5"
        onMouseEnter={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setTip({ x: r.left + r.width / 2, y: r.top });
        }}
        onMouseLeave={() => setTip(null)}
      >
        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-surface-subtle">
          <div className="absolute inset-0 flex h-full w-full">
            {seg.map((s, i) => (
              <span
                key={s.k}
                className="h-full"
                style={{
                  width: `${(s.v / total) * 100}%`,
                  backgroundColor: s.c,
                  borderTopLeftRadius: i === 0 ? 9999 : 0,
                  borderBottomLeftRadius: i === 0 ? 9999 : 0,
                  borderTopRightRadius: i === seg.length - 1 ? 9999 : 0,
                  borderBottomRightRadius: i === seg.length - 1 ? 9999 : 0,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {tip
        ? createPortal(
            <div
              className="pointer-events-none fixed z-[100] -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-foreground px-2.5 py-1.5 text-caption text-card shadow-lg"
              style={{ left: tip.x, top: tip.y - 6 }}
            >
              {seg.map((s) => (
                <span key={s.k} className="mr-2.5 inline-flex items-center gap-1 last:mr-0">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.c }} />
                  {s.k}
                  <span className="tabular-nums">
                    {s.v} {row.unit}
                  </span>
                </span>
              ))}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}




function ListCell({ items, mono }: { items: string[]; mono?: boolean }) {
  if (!items.length) return <span className="text-body-sm text-text-tertiary">—</span>;
  const shown = items.slice(0, 3);
  const rest = items.length - shown.length;
  return (
    <span className={`text-body-sm text-text-secondary truncate ${mono ? "font-mono" : ""}`}>
      {shown.join("、")}
      {rest > 0 ? <span className="text-text-tertiary">…等 {items.length} 项</span> : null}
    </span>
  );
}

const columns: ListColumn<DispenseRow>[] = [
  { key: "code", label: "商品编码", required: true, render: (r) => <span className="font-mono text-body text-foreground">{r.code}</span> },
  { key: "name", label: "药品展示名称", required: true, render: (r) => <span className="text-body text-foreground truncate">{r.name}</span> },
  { key: "spec", label: "规格型号", render: (r) => <span className="text-body-sm text-text-secondary truncate">{r.spec}</span> },
  {
    key: "qty", label: "领取数量", filter: "number", value: (r) => r.qty,
    render: (r) => <span className="text-body tabular-nums text-foreground">{r.qty}</span>,
  },
  { key: "unit", label: "基础单位", filter: "select", render: (r) => <span className="text-body-sm text-text-secondary">{r.unit}</span> },
  { key: "takenAt", label: "领取时间", date: true, filter: "date", render: (r) => <span className="text-body-sm text-text-secondary tabular-nums">{r.takenAt}</span> },
  { key: "operator", label: "领取人员", filter: "select", render: (r) => <span className="text-body-sm text-text-secondary">{r.operator}</span> },
  {
    key: "status", label: "使用状态", filter: "select",
    className: "w-[4.5em]",
    render: (r) => <UsageBar row={r} />,
  },

  {
    key: "users", label: "使用人员",
    render: (r) => <ListCell items={r.users} />,
  },
  {
    key: "cows", label: "用药牛只",
    render: (r) => <ListCell items={r.cows} mono />,
  },
  {
    key: "remark", label: "备注",
    render: (r) => (
      <span className="text-body-sm text-text-secondary truncate">
        {r.status === "已退回" ? r.remark || "—" : "—"}
      </span>
    ),
  },
];

function DispensePage() {
  const [data] = useState<DispenseRow[]>(initial);
  const [detail, setDetail] = useState<DispenseRow | null>(null);

  return (
    <>
    <ListPage<DispenseRow>
      title="取药记录"
      breadcrumb={["仓库管理", "取药记录"]}
      rows={data}
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
    <Sheet open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
      <SheetContent side="right" className="w-[460px] sm:max-w-[460px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-section">取药记录详情</SheetTitle>
        </SheetHeader>
        {detail ? (
          <div className="mt-4 space-y-5">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Field label="商品编码" value={detail.code} mono />
              <Field label="药品展示名称" value={detail.name} />
              <Field label="规格型号" value={detail.spec} />
              <Field label="领取数量" value={`${detail.qty} ${detail.unit}`} />
              <Field label="领取时间" value={detail.takenAt} />
              <Field label="领取人员" value={detail.operator} />
              <div className="col-span-2">
                <div className="text-caption text-text-tertiary mb-1.5">使用状态</div>
                <UsageBar row={detail} />
              </div>

            </div>
            <div>
              <div className="text-caption text-text-tertiary mb-2">
                使用明细（{detail.usage.length} 人 · {detail.cows.length} 头牛只）
              </div>
              <div className="space-y-2">
                {detail.usage.map((u) => (
                  <div key={u.user} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-body text-foreground">{u.user}</span>
                      <span className="text-caption text-text-tertiary tabular-nums">
                        {u.cows.length} 头
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {u.cows.length ? (
                        u.cows.map((c) => (
                          <span key={c} className="tag tag-muted font-mono">{c}</span>
                        ))
                      ) : (
                        <span className="text-body-sm text-text-tertiary">未用于牛只</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {detail.status === "已退回" && detail.remark ? (
              <Field label="备注" value={detail.remark} />
            ) : null}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
    </>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-caption text-text-tertiary mb-0.5">{label}</div>
      <div className={`text-body text-foreground ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}
