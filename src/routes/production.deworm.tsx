import { createFileRoute } from "@tanstack/react-router";
import { WorkOrderPage, makeOrders } from "@/components/work-order-page";

const orders = makeOrders("QC", [
  { target: "1 号牛舍", event: "季度体内驱虫", desc: "季度体内驱虫，需调拨广谱驱虫药 15 盒。" },
  { target: "3 号牛舍", event: "体外驱虫喷淋", desc: "体外驱虫喷淋作业中。" },
  { target: "2 号牛舍", event: "驱虫批次", desc: "驱虫批次完成，已记录用药明细。" },
  { target: "犊牛舍 A", event: "犊牛驱虫", desc: "犊牛月度驱虫批次。" },
  { target: "犊牛舍 B", event: "球虫病预防", desc: "犊牛舍球虫病预防驱虫。" },
  { target: "干奶舍", event: "干奶牛驱虫", desc: "干奶舍批次驱虫。" },
  { target: "全场", event: "夏季体外驱虫", desc: "全场夏季蝇蜱体外驱虫。" },
  { target: "#01-24-2188", event: "个体补充驱虫", desc: "漏批次驱虫，单独补打。" },
]);

export const Route = createFileRoute("/production/deworm")({
  head: () => ({ meta: [{ title: "驱虫工单 — 奇点智牧" }] }),
  component: () => <WorkOrderPage title="驱虫工单" orders={orders} />,
});
