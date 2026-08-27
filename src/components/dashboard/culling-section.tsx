import { useState } from "react";
import { Activity } from "lucide-react";
import { SectionCard, ColumnChart, BarList, PeriodTabs } from "./charts";
import { scaleList, useDataLevel } from "@/lib/dashboard-view";

const groupDist = [
  { name: "成母牛", value: 26, color: "var(--brand)" },
  { name: "青年牛", value: 11, color: "var(--effect-ai-cyan)" },
  { name: "犊牛", value: 8, color: "var(--effect-ai-purple)" },
];

const deathReasons = [
  { name: "消化系统疾病", value: 7 },
  { name: "呼吸道疾病", value: 5 },
  { name: "产科疾病", value: 4 },
  { name: "外伤/意外", value: 3 },
  { name: "其他", value: 2 },
];

const cullReasons = [
  { name: "产量低", value: 8 },
  { name: "繁殖障碍", value: 6 },
  { name: "肢蹄病", value: 5 },
  { name: "乳房炎", value: 3 },
  { name: "其他", value: 2 },
];

export function CullingSection() {
  const [view, setView] = useState("死亡原因");
  const { factor } = useDataLevel();
  const dist = scaleList(groupDist, factor);
  const reasons = scaleList(view === "死亡原因" ? deathReasons : cullReasons, factor);
  const total = dist.reduce((s, d) => s + d.value, 0);
  const isDeath = view === "死亡原因";
  return (
    <SectionCard
      id="topic-culling"
      title="死淘专题"
      desc={<PeriodTabs value={view} onChange={setView} options={["死亡原因", "淘汰原因"]} />}
      icon={<Activity className="h-4 w-4 text-primary" strokeWidth={1.75} />}
      extra={<span className="tag tag-muted">本月</span>}
    >
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div>
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <p className="text-body-sm text-text-secondary">（本月）实际死淘分布</p>
            <p className="text-caption text-text-tertiary">
              死淘合计{" "}
              <span className="text-section-title tabular-nums text-foreground">
                {total.toLocaleString()}
              </span>{" "}
              头
            </p>
          </div>
          <ColumnChart data={dist} unit=" 头" />
        </div>
        <div>
          <p className="text-body-sm text-text-secondary mb-3">
            （本月）{isDeath ? "死亡原因占比" : "淘汰原因占比"}
          </p>
          <BarList data={reasons} unit=" 头" />
        </div>
      </div>
    </SectionCard>
  );
}

