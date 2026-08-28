import { createFileRoute } from "@tanstack/react-router";
import { WorkOrderPage, makeOrders } from "@/components/work-order-page";

// 来源：晟安标准处方 · 产后护理（产后检查 14 天 / 产后保健）
const orders = makeOrders("CH", [
  {
    target: "#01-24-2120",
    event: "产后检查 · 第 3/14 天",
    desc: "产后连续检查任务，直肠体温数字录入 + 牛只正前方 / 正后方照片采集，日 1 次连续 14 天。",
  },
  {
    target: "#01-24-2135",
    event: "产后保健 · 难产助产 4 分",
    desc: "助产评分 4 分，按处方 1 预防性用药：5% 盐酸头孢噻呋 4.4 mL/100 kg 肌注 + 氟尼辛葡甲胺静推，1 天 1 次连用 3 天。",
  },
  {
    target: "#01-24-2188",
    event: "产后保健 · 双胎预防",
    desc: "双胎分娩后预防生殖系统感染，采用处方 2：10% 盐酸头孢噻呋 20 mL 3 天 1 次 + 氟尼辛葡甲胺连用 3 天。",
  },
  {
    target: "#01-24-2208",
    event: "产后检查 · 体温异常",
    desc: "产后第 7 天直肠体温 39.6℃，需进一步体格检查确定病因，按对应产后子宫炎 / 肺炎 / 乳房炎方案跟进。",
  },
  {
    target: "#01-24-2233",
    event: "产后保健 · 死胎助产",
    desc: "死胎助产后预防性用药，处方 1 完整 3 天疗程执行中。",
  },
  {
    target: "#01-24-2270",
    event: "产后检查 · 第 10/14 天",
    desc: "产后 14 天检查任务持续进行，正前 / 正后方影像已按日采集。",
  },
  {
    target: "#01-24-2298",
    event: "产后保健 · 助产 3 分",
    desc: "助产评分 3 分，按处方 2 短疗程用药，同时安排每日体温监测。",
  },
  {
    target: "#01-24-2440",
    event: "产房消毒巡检",
    desc: "产房日常消毒巡检，确保助产后感染防控条件符合标准处方局部处理要求。",
  },
]);

export const Route = createFileRoute("/production/postpartum")({
  head: () => ({ meta: [{ title: "产后护理 — 奇点智牧" }] }),
  component: () => <WorkOrderPage title="产后护理" orders={orders} />,
});
