import { createFileRoute } from "@tanstack/react-router";
import { WorkOrderPage, makeOrders } from "@/components/work-order-page";

// 来源：晟安标准处方 · 干奶（乳注头孢喹肟 / 盐酸头孢噻呋，按非盲乳数给药）
const orders = makeOrders("GN", [
  {
    target: "#01-24-2208",
    event: "干奶 · 处方 1 牧全欣",
    desc: "进入干奶期，处方 1：硫酸头孢喹肟乳房注入剂（牧全欣）3 g/支，按非盲乳数一次量乳注。",
  },
  {
    target: "#01-24-2185",
    event: "干奶 · 处方 2 茹通",
    desc: "干奶申请，处方 2：硫酸头孢喹肟乳房注入剂（茹通）3 g/支，按非盲乳数一次量乳注。",
  },
  {
    target: "#01-24-2099",
    event: "干奶 · 处方 3 海喹宁",
    desc: "干奶输注，处方 3：硫酸头孢喹肟乳房注入剂（海喹宁）3 g/支，按非盲乳数乳注后转干奶舍。",
  },
  {
    target: "#01-24-2120",
    event: "干奶 · 处方 4 畜可健",
    desc: "干奶申请，处方 4：盐酸头孢噻呋乳房注入剂（畜可健）8 mL/支，按非盲乳数一次量乳注。",
  },
  {
    target: "#01-24-2233",
    event: "干奶 · 处方 5 赛福魁",
    desc: "干奶执行，处方 5：硫酸头孢喹肟乳房注入剂（赛福魁）3 g/支，按非盲乳数一次量乳注。",
  },
  {
    target: "#01-24-2150",
    event: "干奶舍转栏",
    desc: "干奶用药完成，安排转入干奶舍。",
  },
  {
    target: "#01-24-2102",
    event: "干奶失败复查",
    desc: "干奶后乳房肿胀，需复查非盲乳数并评估是否重新按处方 1 乳注。",
  },
  {
    target: "#01-24-2270",
    event: "提前干奶申请",
    desc: "产量过低申请提前干奶，按处方 4 盐酸头孢噻呋乳房注入剂执行。",
  },
]);

export const Route = createFileRoute("/production/drying")({
  head: () => ({ meta: [{ title: "干奶工单 — 奇点智牧" }] }),
  component: () => <WorkOrderPage title="干奶工单" orders={orders} createKind="drying" createPrefix="GN" />,
});
