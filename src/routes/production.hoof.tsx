import { createFileRoute } from "@tanstack/react-router";
import { WorkOrderPage, makeOrders } from "@/components/work-order-page";

// 来源：晟安标准处方 · 肢蹄病类（腐蹄病 / 蹄疣蹄趾皮炎 / 蹄底溃疡 / 白线病）
const orders = makeOrders("XT", [
  {
    target: "#01-24-2150",
    event: "腐蹄病 · 局部红肿跛行",
    desc: "患蹄红肿、跛行，处方 1：10% 盐酸头孢噻呋 25 mL 3 天 1 次 + 5% 氟尼辛葡甲胺静注，连用 3 天，配合患蹄清洗消毒。",
  },
  {
    target: "#01-24-2188",
    event: "腐蹄病 · 备用方案",
    desc: "腐蹄病复发，按腐蹄病处方 2：青霉素钠肌注 + 0.9% 氯化钠静注，1 天 1 次连用 3 天。",
  },
  {
    target: "#01-24-2210",
    event: "蹄趾皮炎 · 护蹄膏包扎",
    desc: "蹄趾皮肤病灶，蹄皮炎处方 1：清洗清创后涂抹护蹄膏并包扎，每 3 天换药一次。",
  },
  {
    target: "#01-24-2298",
    event: "蹄疣 · 防腐生肌散",
    desc: "个体牛蹄疣样病变，按蹄皮炎处方 2 蹄部清洗消毒后局部涂抹防腐生肌散（祛呋宁）。",
  },
  {
    target: "3 号牛舍",
    event: "蹄浴 · 功能性蹄浴液",
    desc: "批量蹄浴，蹄皮炎处方 3：功能性蹄浴液按说明浓度喷蹄，连续 5-7 天。",
  },
  {
    target: "#01-24-2270",
    event: "蹄底溃疡 · 清创引流",
    desc: "蹄底角质腐烂，按蹄底溃疡处方：双氧水消毒 + 10% 浓碘酊，剔除腐烂角质深挖至真皮，健趾加垫蹄垫。",
  },
  {
    target: "#01-24-2102",
    event: "白线病 · 远轴侧蹄壁清创",
    desc: "白线部位病灶，按白线病处方：清创同蹄底溃疡，牺牲部分远轴侧蹄壁以保证引流，10% 浓碘酊消毒。",
  },
  {
    target: "1 号牛舍",
    event: "季度批次修蹄",
    desc: "32 头泌乳牛季度批次修蹄，异常个体按上述肢蹄病分型进入对应处方。",
  },
]);

export const Route = createFileRoute("/production/hoof")({
  head: () => ({ meta: [{ title: "修蹄工单 — 奇点智牧" }] }),
  component: () => <WorkOrderPage title="修蹄工单" orders={orders} createKind="hoof" createPrefix="XT" />,
});
