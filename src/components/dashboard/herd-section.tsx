import { useState } from "react";
import { Beef } from "lucide-react";
import { SectionCard, StackedBar, PeriodTabs } from "./charts";
import { scaleList, useDataLevel } from "@/lib/dashboard-view";

const typeDist = [
  { name: "泌乳牛", value: 2180 },
  { name: "干奶牛", value: 386 },
  { name: "围产牛", value: 142 },
  { name: "青年牛", value: 640 },
  { name: "犊牛", value: 498 },
  { name: "后备牛", value: 214 },
];

const healthDist = [
  { name: "健康", value: 3720, color: "var(--brand)" },
  { name: "治疗中", value: 186, color: "var(--state-warning)" },
  { name: "观察中（休药/过抗期）", value: 108, color: "var(--effect-ai-cyan)" },
  { name: "异常", value: 46, color: "var(--state-danger)" },
];

const TAB_TYPE = "类型分布";
const TAB_HEALTH = "健康分布";

export function HerdSection() {
  const [tab, setTab] = useState(TAB_TYPE);
  const { factor } = useDataLevel();
  const types = scaleList(typeDist, factor);
  const health = scaleList(healthDist, factor);
  const total = types.reduce((s, d) => s + d.value, 0);
  const healthTotal = health.reduce((s, d) => s + d.value, 0);
  return (
    <SectionCard
      id="topic-herd"
      title="牛群专题"
      desc={<PeriodTabs value={tab} onChange={setTab} options={[TAB_TYPE, TAB_HEALTH]} />}
      icon={<Beef className="h-4 w-4 text-primary" strokeWidth={1.75} />}
      extra={<span className="tag tag-muted">至昨日</span>}
    >
      <div className="flex h-full flex-col">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <p className="text-body-sm text-text-secondary">
            {tab === TAB_TYPE ? "（至昨日）类型分布" : "（至昨日）健康分布"}
          </p>
          <p className="text-caption text-text-tertiary">
            {tab === TAB_TYPE ? "存栏总数" : "在群总数"}{" "}
            <span className="text-section-title tabular-nums text-foreground">
              {(tab === TAB_TYPE ? total : healthTotal).toLocaleString()}
            </span>{" "}
            头
          </p>
        </div>
        <div className="flex flex-1 flex-col justify-center">
          <StackedBar data={tab === TAB_TYPE ? types : health} unit=" 头" />
        </div>
      </div>
    </SectionCard>
  );
}


