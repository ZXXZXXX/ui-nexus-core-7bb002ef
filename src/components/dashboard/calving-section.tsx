import { useState } from "react";
import { Baby, ChevronLeft } from "lucide-react";
import { SectionCard, ColumnChart, GaugeArc, BarList, PeriodTabs, TimeTabs } from "./charts";
import { scaleList, scaleValue, useDataLevel } from "@/lib/dashboard-view";

const aliveTotal = 170;
const deadTotal = 9;

const survival = [
  { name: "成活", value: aliveTotal, color: "var(--brand)" },
  { name: "死亡", value: deadTotal, color: "var(--state-danger)" },
];

const parityDist = [
  { name: "单胎", value: 148, color: "var(--brand)" },
  { name: "双胎及以上", value: 22, color: "var(--effect-ai-cyan)" },
];

const sexRatio = [
  { name: "母犊", value: 91, color: "var(--effect-ai-purple)" },
  { name: "公犊", value: 79, color: "var(--effect-ai-cyan)" },
];

const birthWeight = [
  { name: "< 30 kg", value: 12, color: "var(--state-warning)" },
  { name: "30 - 35 kg", value: 40, color: "var(--effect-ai-cyan)" },
  { name: "35 - 40 kg", value: 72, color: "var(--brand)" },
  { name: "40 - 45 kg", value: 31, color: "var(--effect-ai-purple)" },
  { name: "≥ 45 kg", value: 15, color: "var(--state-danger)" },
];

const difficulty = [
  { name: "顺产", value: 132, color: "var(--brand)" },
  { name: "轻度助产", value: 28, color: "var(--effect-ai-cyan)" },
  { name: "中度助产", value: 13, color: "var(--state-warning)" },
  { name: "难产/手术", value: 6, color: "var(--state-danger)" },
];

const TAB_PARITY = "胎型分布";
const TAB_SEX = "性别比例";
const TAB_WEIGHT = "体重分布";

const VIEW_CALF = "犊牛情况";
const VIEW_COW = "母牛情况";

const RANGE_ALL = "全部";
const RANGE_MONTH = "本月";
const RANGE_YEAR = "本年";
const RANGE_FACTOR: Record<string, number> = { [RANGE_ALL]: 34, [RANGE_MONTH]: 1, [RANGE_YEAR]: 11.6 };


export function CalvingSection() {
  const [view, setView] = useState(VIEW_CALF);
  const [drill, setDrill] = useState(false);
  const [tab, setTab] = useState(TAB_PARITY);
  const [range, setRange] = useState(RANGE_MONTH);
  const { factor: levelFactor } = useDataLevel();
  const factor = levelFactor * RANGE_FACTOR[range]!;
  const alive = scaleValue(aliveTotal, factor);
  const survivalData = scaleList(survival, factor);
  const difficultyData = scaleList(difficulty, factor);
  const total = alive + scaleValue(deadTotal, factor);
  const detail = scaleList(tab === TAB_PARITY ? parityDist : tab === TAB_SEX ? sexRatio : birthWeight, factor);

  return (
    <SectionCard
      id="topic-calving"
      title="产犊专题"
      desc={<TimeTabs value={range} onChange={setRange} options={[RANGE_ALL, RANGE_MONTH, RANGE_YEAR]} />}
      icon={<Baby className="h-4 w-4 text-primary" strokeWidth={1.75} />}
      extra={
        <div className="flex items-center gap-3 flex-wrap">
          {view === VIEW_CALF && drill ? (
            <PeriodTabs value={tab} onChange={setTab} options={[TAB_PARITY, TAB_SEX, TAB_WEIGHT]} />
          ) : (
            <PeriodTabs
              value={view}
              onChange={(v) => {
                setView(v);
                setDrill(false);
              }}
              options={[VIEW_CALF, VIEW_COW]}
            />
          )}
        </div>
      }
    >
      {view === VIEW_CALF ? (
        <div>
          {drill ? (
            <>
              <button
                type="button"
                onClick={() => setDrill(false)}
                className="mb-3 inline-flex items-center gap-1 text-body-sm text-text-secondary hover:text-primary transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                产犊成活与死亡分布
              </button>
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <p className="text-body-sm text-text-secondary">成活犊牛{tab}</p>
                <p className="text-caption text-text-tertiary">
                  成活总数{" "}
                  <span className="text-section-title tabular-nums text-foreground">
                    {alive.toLocaleString()}
                  </span>{" "}
                  头
                </p>
              </div>
              <ColumnChart data={detail} unit=" 头" />
            </>
          ) : (
            <>
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <p className="text-body-sm text-text-secondary">{`（${range}）产犊成活与死亡分布`}</p>
                <p className="text-caption text-text-tertiary">
                  产犊总数{" "}
                  <span className="text-section-title tabular-nums text-foreground">
                    {total.toLocaleString()}
                  </span>{" "}
                  头
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-6">
                <GaugeArc
                  value={(alive / Math.max(total, 1)) * 100}
                  label="犊牛成活率"
                />
                <div className="flex items-center gap-8">
                  <div className="space-y-3">
                    {survivalData.map((d) => (
                      <div key={d.name} className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-sm" style={{ background: d.color }} />
                        <span className="text-body text-text-secondary">{d.name}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3 text-right">
                    {survivalData.map((d) => (
                      <div key={`${d.name}-val`}>
                        <span className="text-section-title tabular-nums text-foreground">
                          {d.value.toLocaleString()}
                        </span>
                        <span className="text-caption text-text-tertiary"> 头</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDrill(true)}
                className="mt-4 text-body-sm text-primary hover:underline"
              >
                查看成活犊牛明细 →
              </button>
            </>
          )}
        </div>
      ) : (
        <div>
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <p className="text-body-sm text-text-secondary">{`（${range}）产犊难易度分布`}</p>
            <p className="text-caption text-text-tertiary">
              顺产率 <span className="text-section-title tabular-nums text-foreground">74.6%</span>
            </p>
          </div>
          <BarList data={difficultyData} unit=" 例" />
        </div>
      )}
    </SectionCard>
  );
}


