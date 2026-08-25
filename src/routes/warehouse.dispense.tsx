import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ListPage, type ListColumn } from "@/components/list-page";
import { Button } from "@/components/ui/button";

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
  remark: string; // 备注（仅已退回有值）
};

const initial: DispenseRow[] = [
  { id: "DP-3202", code: "01-00063", name: "乳房炎抗生素 5mg", spec: "100ml:5g/瓶", qty: 3, unit: "支", takenAt: "2026-05-12 10:36", operator: "李雨晴", status: "未使用", remark: "" },
  { id: "DP-3201", code: "01-00063", name: "乳房炎抗生素 5mg", spec: "100ml:5g/瓶", qty: 2, unit: "支", takenAt: "2026-05-12 09:42", operator: "李雨晴", status: "已使用", remark: "" },
  { id: "DP-3200", code: "02-00214", name: "口蹄疫疫苗 A 型", spec: "50ml/瓶", qty: 5, unit: "支", takenAt: "2026-05-12 08:15", operator: "陈晓东", status: "已使用", remark: "" },
  { id: "DP-3199", code: "03-00306", name: "驱虫剂 伊维菌素", spec: "100ml:1g/瓶", qty: 10, unit: "瓶", takenAt: "2026-05-11 16:38", operator: "李雨晴", status: "已使用", remark: "" },
  { id: "DP-3198", code: "05-00521", name: "消毒液 戊二醛", spec: "5L/桶", qty: 2, unit: "桶", takenAt: "2026-05-11 14:02", operator: "孙库管", status: "已退回", remark: "3 号牛舍消毒改期，整桶未拆封退回一级库" },
  { id: "DP-3197", code: "04-00412", name: "营养补充剂 复合维生素", spec: "10ml/支", qty: 1, unit: "罐", takenAt: "2026-05-11 10:20", operator: "李雨晴", status: "已使用", remark: "" },
  { id: "DP-3196", code: "01-00071", name: "头孢噻呋钠", spec: "100ml:5g/瓶", qty: 2, unit: "支", takenAt: "2026-05-11 09:05", operator: "王建国", status: "已退回", remark: "工单 WO-2350 已终止，未开封退回" },
];

const statusTone: Record<DrugStatus, string> = {
  未使用: "tag tag-warning",
  已使用: "tag tag-success",
  已退回: "tag tag-muted",
};

const columns: ListColumn<DispenseRow>[] = [
  { key: "code", label: "商品编码", required: true, render: (r) => <span className="font-mono text-body text-foreground">{r.code}</span> },
  { key: "name", label: "药品展示名称", required: true, render: (r) => <span className="text-body text-foreground truncate">{r.name}</span> },
  { key: "spec", label: "规格型号", render: (r) => <span className="text-body-sm text-text-secondary truncate">{r.spec}</span> },
  {
    key: "qty", label: "领取数量", filter: "number", value: (r) => r.qty,
    render: (r) => (
      <span className="text-body tabular-nums text-foreground">
        {r.qty} <span className="text-caption text-text-tertiary">{r.unit}</span>
      </span>
    ),
  },
  { key: "takenAt", label: "领取时间", date: true, filter: "date", render: (r) => <span className="text-body-sm text-text-secondary tabular-nums">{r.takenAt}</span> },
  { key: "operator", label: "领取人员", filter: "select", render: (r) => <span className="text-body-sm text-text-secondary">{r.operator}</span> },
  {
    key: "status", label: "药品状态", filter: "select",
    render: (r) => <span className={statusTone[r.status]}>{r.status}</span>,
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

  return (
    <ListPage<DispenseRow>
      title="取药记录"
      breadcrumb={["仓库管理", "取药记录"]}
      rows={data}
      columns={columns}
      searchKeys={["name", "code"]}
      searchPlaceholder="按药品名称 / 商品编码搜索"
      getRowKey={(r) => r.id}
      rowActions={() => (
        <Button variant="ghost" size="sm" className="h-7 px-2 text-body-sm font-normal text-text-secondary hover:bg-surface-subtle hover:text-foreground">
          查看
        </Button>
      )}
    />
  );
}
