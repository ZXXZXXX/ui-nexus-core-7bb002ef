import { createFileRoute } from "@tanstack/react-router";
import { WorkOrderPage, makeOrders } from "@/components/work-order-page";

// 来源：晟安标准处方 · 子宫炎类（产道创伤 / 子宫炎 / 子宫内膜炎）
const orders = makeOrders("JB", [
  {
    target: "#01-24-2381",
    event: "产道创伤 · 阴道黏膜层撕裂",
    desc: "助产后阴道黏膜层撕裂，需外科处理并按标准处方（5% 盐酸头孢噻呋 + 氟尼辛葡甲胺）连用 3-5 天，配合外阴冲洗与碘甘油局部涂抹。",
  },
  {
    target: "#01-24-2298",
    event: "产后子宫炎 · 体温 39.8℃",
    desc: "产后 6 天体温 39.8℃，分泌物恶臭，判定为产后子宫炎，按处方 1（青霉素钠 + 氟尼辛葡甲胺）1 天 2 次连用 3 天。",
  },
  {
    target: "#01-24-2270",
    event: "产后子宫炎 · 脓性分泌物",
    desc: "产后 8 天体温正常但分泌物含 >50% 脓，判定为产后子宫炎，建议处方 2：5% 盐酸头孢噻呋 4.4 mL/100 kg 肌注 + 氟尼辛葡甲胺静推，连用 3 天。",
  },
  {
    target: "#01-24-2250",
    event: "产后子宫炎 · 产后 5 天以上",
    desc: "产后 12 天分泌物异常，选用处方 3：10% 盐酸头孢噻呋 20 mL/次 3 天 1 次 + 氟尼辛葡甲胺，辅助利福昔明子宫灌注 100 mL/次。",
  },
  {
    target: "#01-24-2233",
    event: "子宫内膜炎 · 直肠检查异常",
    desc: "产后 24 天直肠检查确认子宫异常，先行直肠按压排脓，按处方 1（青霉素钠 + 氟尼辛葡甲胺）连用 3 天。",
  },
  {
    target: "#01-24-2188",
    event: "子宫内膜炎 · 利福昔明灌注",
    desc: "产后 26 天中度子宫内膜炎，按处方 2 利福昔明子宫注入剂 100 mL/次，2 天 1 次连用 2-3 次。",
  },
  {
    target: "#01-24-2156",
    event: "产道撕裂缝合复诊",
    desc: "产道损伤 >5 cm，已采用 PGA 可吸收线缝合，5 天后拆线，同步碘甘油日 2 次连用 5 天。",
  },
  {
    target: "#01-24-2102",
    event: "产后子宫炎复诊",
    desc: "产后子宫炎处方 2 用药第 3 天，需评估体温及分泌物是否复常。",
  },
]);

export const Route = createFileRoute("/production/disease")({
  head: () => ({ meta: [{ title: "疾病治疗 — 奇点智牧" }] }),
  component: () => <WorkOrderPage title="疾病治疗" orders={orders} />,
});
