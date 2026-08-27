import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Syringe, Clock, CalendarDays } from "lucide-react";
import { PeriodTabs } from "@/components/dashboard/charts";
import { scaleValue, useDataLevel } from "@/lib/dashboard-view";

type VaccinePlan = {
  id: string;
  name: string;
  planned: number;
  done: number;
  days: number; // 耗时天数
  start: string; // 启动日期 MM-DD
};

const PLANS: Record<string, VaccinePlan[]> = {
  "全部": [
    { id: "fmd", name: "口蹄疫疫苗", planned: 6154, done: 6042, days: 26, start: "03-05" },
    { id: "brd", name: "牛呼吸道多联疫苗", planned: 4820, done: 4531, days: 21, start: "04-12" },
    { id: "ibr", name: "传染性鼻气管炎疫苗", planned: 3980, done: 3612, days: 18, start: "05-08" },
    { id: "bvd", name: "牛病毒性腹泻疫苗", planned: 3760, done: 3208, days: 24, start: "06-20" },
    { id: "cd", name: "梭菌病多联疫苗", planned: 2540, done: 2489, days: 12, start: "07-15" },
    { id: "mast", name: "乳房炎疫苗", planned: 2180, done: 1742, days: 15, start: "08-02" },
    { id: "anth", name: "炭疽芽孢疫苗", planned: 5860, done: 5721, days: 19, start: "09-10" },
    { id: "lep", name: "钩端螺旋体疫苗", planned: 3420, done: 2986, days: 16, start: "10-06" },
    { id: "rota", name: "轮状病毒疫苗", planned: 2960, done: 2703, days: 14, start: "11-02" },
    { id: "past", name: "巴氏杆菌疫苗", planned: 4130, done: 3742, days: 20, start: "12-08" },
    { id: "bruc", name: "布鲁氏菌疫苗", planned: 5240, done: 5108, days: 22, start: "01-16" },
  ],
  "近半年": [
    { id: "fmd", name: "口蹄疫疫苗", planned: 3120, done: 3044, days: 14, start: "09-06" },
    { id: "brd", name: "牛呼吸道多联疫苗", planned: 2410, done: 2263, days: 11, start: "09-24" },
    { id: "ibr", name: "传染性鼻气管炎疫苗", planned: 1985, done: 1786, days: 9, start: "10-11" },
    { id: "bvd", name: "牛病毒性腹泻疫苗", planned: 1880, done: 1552, days: 13, start: "10-28" },
    { id: "cd", name: "梭菌病多联疫苗", planned: 1260, done: 1238, days: 7, start: "11-14" },
    { id: "mast", name: "乳房炎疫苗", planned: 1090, done: 826, days: 8, start: "12-01" },
  ],
  "近3个月": [
    { id: "fmd", name: "口蹄疫疫苗", planned: 1580, done: 1561, days: 8, start: "01-08" },
    { id: "brd", name: "牛呼吸道多联疫苗", planned: 1205, done: 1104, days: 6, start: "01-22" },
    { id: "ibr", name: "传染性鼻气管炎疫苗", planned: 990, done: 862, days: 5, start: "02-05" },
    { id: "bvd", name: "牛病毒性腹泻疫苗", planned: 940, done: 731, days: 7, start: "02-19" },
    { id: "cd", name: "梭菌病多联疫苗", planned: 630, done: 628, days: 4, start: "03-04" },
    { id: "mast", name: "乳房炎疫苗", planned: 545, done: 402, days: 5, start: "03-18" },
  ],
};

function toneOf(pct: number) {
  if (pct >= 95) return "var(--state-success)";
  if (pct >= 85) return "var(--state-warning)";
  return "var(--state-danger)";
}

export function ImmunizationRateCard() {
  const [period, setPeriod] = useState("近3个月");
  const { factor } = useDataLevel();
  const plans = (PLANS[period] ?? []).map((p) => ({
    ...p,
    planned: scaleValue(p.planned, factor),
    done: scaleValue(p.done, factor),
  }));


  return (
    <Card className="border-border bg-card rounded-2xl shadow-card p-6 flex flex-col">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "color-mix(in oklab, var(--brand) 14%, transparent)", color: "var(--brand)" }}
          >
            <Syringe className="h-4 w-4" strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-card-title text-foreground">疫苗免疫专题</h3>
            <p className="text-caption text-text-tertiary mt-0.5">{period === "全部" ? "历史全部" : period}各项疫苗计划完成情况</p>
          </div>
        </div>
        <PeriodTabs value={period} onChange={setPeriod} options={["近3个月", "近半年", "全部"]} />
      </div>

      {/* 各项疫苗计划 · 横向柱状图 */}
      <div className="mt-4 flex-1 min-h-0 max-h-[360px] overflow-y-auto pr-1">
        <div className="flex flex-col gap-5 min-h-full justify-center">
        {plans.map((p) => {
          const r = p.planned === 0 ? 0 : (p.done / p.planned) * 100;
          const t = toneOf(r);
          return (
            <div key={p.id} className="flex items-center gap-3">
              <span className="text-body-sm text-foreground w-24 shrink-0 truncate cursor-default" title={p.name}>
                {p.name.length > 5 ? `${p.name.slice(0, 5)}…` : p.name}
              </span>
              <span
                className="relative flex-1 h-7 rounded-md bg-surface-subtle overflow-hidden cursor-default"
                title={`${p.name}｜已接种 ${p.done.toLocaleString()} / 计划 ${p.planned.toLocaleString()} 头`}
              >
                <span
                  className="absolute inset-y-0 left-0 rounded-md transition-all"
                  style={{ width: `${Math.max(r, 2)}%`, background: t }}
                />
              </span>
              <span className="shrink-0 flex items-center gap-3">
                <span className="w-16 text-caption text-text-tertiary tabular-nums inline-flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                  {p.start}
                </span>
                <span className="w-14 text-caption text-text-tertiary tabular-nums inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  {p.days} 天
                </span>
                <span className="text-body-sm font-medium tabular-nums w-14 text-right" style={{ color: t }}>
                  {r.toFixed(1)}%
                </span>
              </span>
            </div>
          );
        })}
        </div>
      </div>


    </Card>
  );
}
