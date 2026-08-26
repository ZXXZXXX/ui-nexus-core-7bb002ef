import { useState } from "react";
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
  users: string[]; // 使用人员
  cows: string[]; // 用药牛只耳号
  remark: string; // 备注（仅已退回有值）
};

const initial: DispenseRow[] = [
  { id: "DP-3202", code: "01-00063", name: "乳房炎抗生素 5mg", spec: "100ml:5g/瓶", qty: 3, unit: "支", takenAt: "2026-05-12 10:36", operator: "李雨晴", status: "未使用", users: ["李雨晴"], cows: ["1042"], remark: "" },
  { id: "DP-3201", code: "01-00063", name: "乳房炎抗生素 5mg", spec: "100ml:5g/瓶", qty: 2, unit: "支", takenAt: "2026-05-12 09:42", operator: "李雨晴", status: "已使用", users: ["李雨晴", "王建国"], cows: ["2087", "2091", "3110", "3122"], remark: "" },
  { id: "DP-3200", code: "02-00214", name: "口蹄疫疫苗 A 型", spec: "50ml/瓶", qty: 5, unit: "支", takenAt: "2026-05-12 08:15", operator: "陈晓东", status: "已使用", users: ["陈晓东", "刘敏", "赵强"], cows: ["0431", "0432", "0455", "0478", "0509", "0611"], remark: "" },
  { id: "DP-3199", code: "03-00306", name: "驱虫剂 伊维菌素", spec: "100ml:1g/瓶", qty: 10, unit: "瓶", takenAt: "2026-05-11 16:38", operator: "李雨晴", status: "已使用", users: ["李雨晴"], cows: ["1201", "1202", "1233"], remark: "" },
  { id: "DP-3198", code: "05-00521", name: "消毒液 戊二醛", spec: "5L/桶", qty: 2, unit: "桶", takenAt: "2026-05-11 14:02", operator: "孙库管", status: "已退回", users: ["孙库管"], cows: [], remark: "3 号牛舍消毒改期，整桶未拆封退回一级库" },
  { id: "DP-3197", code: "04-00412", name: "营养补充剂 复合维生素", spec: "10ml/支", qty: 1, unit: "罐", takenAt: "2026-05-11 10:20", operator: "李雨晴", status: "已使用", users: ["李雨晴", "周敏"], cows: ["3301", "3315"], remark: "" },
  { id: "DP-3196", code: "01-00071", name: "头孢噻呋钠", spec: "100ml:5g/瓶", qty: 2, unit: "支", takenAt: "2026-05-11 09:05", operator: "王建国", status: "已退回", users: ["王建国"], cows: ["2210"], remark: "工单 WO-2350 已终止，未开封退回" },
];

const statusTone: Record<DrugStatus, string> = {
  未使用: "tag tag-warning",
  已使用: "tag tag-success",
  已退回: "tag tag-muted",
};

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
  { key: "unit", label: "基础单位", filter: "select", render: (r) => <span className="text-body-sm text-text-secondary">{r.unit}</span> },
  {
    key: "qty", label: "领取数量", filter: "number", value: (r) => r.qty,
    render: (r) => <span className="text-body tabular-nums text-foreground">{r.qty}</span>,
  },
  { key: "takenAt", label: "领取时间", date: true, filter: "date", render: (r) => <span className="text-body-sm text-text-secondary tabular-nums">{r.takenAt}</span> },
  { key: "operator", label: "领取人员", filter: "select", render: (r) => <span className="text-body-sm text-text-secondary">{r.operator}</span> },
  {
    key: "status", label: "药品状态", filter: "select",
    render: (r) => <span className={statusTone[r.status]}>{r.status}</span>,
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
              <Field label="药品状态" value={detail.status} />
            </div>
            <div>
              <div className="text-caption text-text-tertiary mb-1.5">使用人员（{detail.users.length}）</div>
              <div className="flex flex-wrap gap-1.5">
                {detail.users.map((u) => (
                  <span key={u} className="tag tag-muted">{u}</span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-caption text-text-tertiary mb-1.5">用药牛只（{detail.cows.length}）</div>
              <div className="flex flex-wrap gap-1.5">
                {detail.cows.map((c) => (
                  <span key={c} className="tag tag-muted font-mono">{c}</span>
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
