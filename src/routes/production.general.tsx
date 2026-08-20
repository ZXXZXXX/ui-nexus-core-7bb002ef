import { createFileRoute } from "@tanstack/react-router";
import { WorkOrderPage, makeOrders } from "@/components/work-order-page";

const orders = makeOrders("PX", [
  { target: "#01-24-2324", event: "采食量持续下降", desc: "采食量持续下降，需复检并调整饲喂方案。" },
  { target: "#01-24-2261", event: "体况评估异常", desc: "体况评分偏低，跟踪补饲方案 3 天。" },
  { target: "#01-24-2150", event: "普查复核", desc: "普查理由不充分，已驳回，建议合并到批次普查工作。" },
  { target: "4 号牛舍", event: "月度体检", desc: "月度体检完成，2 头标记为复查对象。" },
  { target: "#01-24-2208", event: "BCS 评分复核", desc: "体况评分复核。" },
  { target: "1 号牛舍", event: "环境清洁巡检", desc: "环境清洁与饮水检查。" },
  { target: "#01-24-2298", event: "运动评分跟踪", desc: "运动评分跟踪。" },
  { target: "#01-24-2099", event: "异常采食回访", desc: "采食异常 24h 回访。" },
]);

export const Route = createFileRoute("/production/general")({
  head: () => ({ meta: [{ title: "普修工单 — 奇点智牧" }] }),
  component: () => <WorkOrderPage title="普修工单" orders={orders} />,
});
