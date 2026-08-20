import { createFileRoute } from "@tanstack/react-router";
import { WorkOrderPage, makeOrders } from "@/components/work-order-page";

const orders = makeOrders("YM", [
  { target: "犊牛舍 A", event: "口蹄疫加强免疫", desc: "犊牛舍 5 月口蹄疫加强免疫，覆盖 84 头犊牛。" },
  { target: "#01-24-2078", event: "免疫后体温异常", desc: "免疫后体温异常升高，需复查并评估处置方案。" },
  { target: "2 号牛舍", event: "布病强免疫", desc: "布病强免疫，全部完成。" },
  { target: "1 号牛舍", event: "牛流行热免疫", desc: "春季牛流行热免疫。" },
  { target: "3 号牛舍", event: "炭疽芽孢免疫", desc: "年度炭疽芽孢苗免疫。" },
  { target: "犊牛舍 B", event: "副伤寒免疫", desc: "副伤寒免疫批次。" },
  { target: "#01-24-2120", event: "免疫补针", desc: "漏针补免。" },
  { target: "全场", event: "结核检疫", desc: "全场年度结核检疫与排查。" },
]);

export const Route = createFileRoute("/production/vaccine")({
  head: () => ({ meta: [{ title: "疫苗免疫 — 奇点智牧" }] }),
  component: () => <WorkOrderPage title="疫苗免疫" orders={orders} />,
});
