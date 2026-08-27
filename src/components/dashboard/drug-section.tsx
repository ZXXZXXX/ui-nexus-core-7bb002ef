import { useState } from "react";
import { Pill } from "lucide-react";
import { SectionCard, BarList, LineTrend, MiniStat, PeriodTabs } from "./charts";
import { useDataLevel } from "@/lib/dashboard-view";

const BY_MONTH = "按月统计";
const BY_YEAR = "按年统计";
const PERIODS = [BY_MONTH, BY_YEAR];

const trendData: Record<string, { labels: string[]; points: number[] }> = {
  [BY_YEAR]: {
    labels: ["2021年", "2022年", "2023年", "2024年", "2025年", "2026年"],
    points: [178.4, 186.2, 194.7, 203.1, 208.6, 214.3],
  },
  [BY_MONTH]: {
    labels: ["6月", "7月", "8月", "9月", "10月", "11月", "12月", "1月", "2月", "3月", "4月", "5月"],
    points: [16.2, 17.4, 18.1, 15.8, 14.9, 16.6, 19.2, 20.4, 17.3, 16.1, 17.4, 18.6],
  },
};

// 各月存栏（头），用于计算头均用药费用
const herdByMonth: Record<string, number> = {
  "6月": 4180,
  "7月": 4210,
  "8月": 4260,
  "9月": 4230,
  "10月": 4190,
  "11月": 4220,
  "12月": 4310,
  "1月": 4350,
  "2月": 4330,
  "3月": 4290,
  "4月": 4340,
  "5月": 4368,
};

// 各类药品费用占比（按月份微调）
const COMP_WEIGHTS: { name: string; base: number }[] = [
  { name: "抗生素", base: 0.42 },
  { name: "激素类", base: 0.16 },
  { name: "消炎镇痛", base: 0.13 },
  { name: "促生殖", base: 0.11 },
  { name: "其他", base: 0.18 },
];

function compositionFor(label: string, total: number) {
  const seed = label.charCodeAt(0) + label.length;
  const raw = COMP_WEIGHTS.map((c, i) => ({
    name: c.name,
    w: Math.max(0.04, c.base + (((seed * (i + 3)) % 7) - 3) * 0.01),
  }));
  const sw = raw.reduce((s, r) => s + r.w, 0);
  return raw.map((r) => ({ name: r.name, value: Number(((r.w / sw) * total).toFixed(2)) }));
}

export function DrugSection() {
  const [period, setPeriod] = useState(BY_MONTH);
  const [active, setActive] = useState(trendData[BY_MONTH]!.labels.length - 1);
  const { factor } = useDataLevel();
  const raw = trendData[period];
  const t = { labels: raw.labels, points: raw.points.map((p) => Number((p * factor).toFixed(1))) };
  const idx = Math.min(active, t.labels.length - 1);
  const label = t.labels[idx];
  const total = t.points[idx];
  const herd = Math.round((herdByMonth[label] ?? (period === BY_YEAR ? 51600 : 4300)) * factor);
  const perHead = (total * 10000) / herd;
  const comp = compositionFor(label, total);

  return (
    <SectionCard
      id="topic-drug"
      title="药品费用专题"
      desc={"\n"}
      icon={<Pill className="h-4 w-4 text-primary" strokeWidth={1.75} />}
      extra={
        <PeriodTabs
          value={period}
          onChange={(v) => {
            setPeriod(v);
            setActive(trendData[v].labels.length - 1);
          }}
          options={PERIODS}
        />
      }
    >
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">
        <div className="flex flex-col">
          <p className="text-body text-text-secondary mb-3">
            {period === BY_YEAR ? "各年度" : "各月份"}用药总费用趋势
            <span className="text-text-tertiary text-body-sm">{period === BY_YEAR ? "（点击年份查看明细）" : "（点击月份查看明细）"}</span>
          </p>
          <div className="flex-1 flex flex-col justify-center">
            <LineTrend
              labels={t.labels}
              series={[{ name: "用药总费用", color: "var(--brand)", points: t.points }]}
              unit="万元"
              height={260}
              activeIndex={idx}
              onPointClick={(i) => setActive(i)}
            />
          </div>
        </div>

        <div className="rounded-xl border border-primary/25 bg-brand-subtle/30 p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="h-6 w-1 rounded-full bg-primary" />
            <p className="text-section-title text-foreground">{label}用药明细</p>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <MiniStat label={period === BY_YEAR ? "当年用药总费用" : "当月用药总费用"} value={total.toFixed(1)} unit="万元" tone="var(--brand)" />
            <MiniStat label={period === BY_YEAR ? "当年头均用药费用" : "当月头均用药费用"} value={perHead.toFixed(1)} unit="元/头" />
          </div>
          <p className="text-body text-text-secondary mb-3">各类药品费用占比</p>
          <BarList data={comp} unit=" 万元" />
        </div>
      </div>

    </SectionCard>
  );
}
