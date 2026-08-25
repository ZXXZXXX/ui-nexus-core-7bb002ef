import { useState } from "react";

type Scope = "month" | "all";

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export type ScopeMetric = {
  label: string;
  /** 数值文案，按维度取值 */
  value: Record<Scope, string>;
};

/** 轻量统计行：两个字段 +「本月 / 全部」切换 */
export function StatScopeCard({ metrics }: { metrics: ScopeMetric[] }) {
  const [scope, setScope] = useState<Scope>("month");
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-body-small">
      <div className="inline-flex items-center rounded-md border border-border bg-surface-subtle p-0.5 text-caption">
        {(["month", "all"] as Scope[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setScope(k)}
            className={`h-6 px-2.5 rounded-[5px] transition-colors ${
              scope === k
                ? "bg-card text-primary font-medium shadow-sm"
                : "text-text-tertiary hover:text-foreground"
            }`}
          >
            {k === "month" ? "本月" : "全部"}
          </button>
        ))}
      </div>
      {metrics.map((m) => (
        <div key={m.label} className="flex items-center gap-1.5">
          <span className="text-text-tertiary">{m.label}</span>
          <span className="tabular-nums font-medium text-foreground">{m.value[scope]}</span>
        </div>
      ))}
    </div>
  );
}

/** 疾病：报病头次 / 各类型牛只发病率 / 治愈率 / 淘汰率（演示数据，按编码稳定生成） */
export function diseaseStats(seed: string): ScopeMetric[] {
  const h = hash(seed);
  const month = 3 + (h % 28);
  const all = month * (4 + (h % 7));
  const herd = 1200 + (h % 800);
  const rate = (n: number, k: number) => `${(((n * k) / herd) * 100).toFixed(2)}%`;
  const cureMonth = 78 + (h % 20);
  const cureAll = 75 + ((h >> 3) % 22);
  const cullMonth = 1 + (h % 6);
  const cullAll = 2 + ((h >> 5) % 7);
  return [
    { label: "报病头次", value: { month: `${month} 头次`, all: `${all} 头次` } },
    { label: "泌乳牛发病率", value: { month: rate(month, 0.6), all: rate(all, 0.6) } },
    { label: "干奶牛发病率", value: { month: rate(month, 0.2), all: rate(all, 0.2) } },
    { label: "青年牛发病率", value: { month: rate(month, 0.14), all: rate(all, 0.14) } },
    { label: "犊牛发病率", value: { month: rate(month, 0.06), all: rate(all, 0.06) } },
    { label: "治愈率", value: { month: `${cureMonth}%`, all: `${cureAll}%` } },
    { label: "淘汰率", value: { month: `${cullMonth}%`, all: `${cullAll}%` } },
  ];
}

/** 症状：上报次数（演示数据，按编码稳定生成） */
export function symptomStats(seed: string): ScopeMetric[] {
  const h = hash(seed);
  const month = 4 + (h % 46);
  const all = month * (3 + (h % 8));
  return [{ label: "上报次数", value: { month: `${month} 次`, all: `${all} 次` } }];
}

/** 处方：药费统计 / 使用次数 / 平均疗程天数 / 治愈率 / 淘汰率（演示数据） */
export function prescriptionStats(seed: string): ScopeMetric[] {
  const h = hash(seed);
  const month = 5 + (h % 40);
  const all = month * (3 + (h % 6));
  const unit = 18 + (h % 120) + ((h >> 7) % 100) / 100;
  const money = (n: number) => `¥${(n * unit).toFixed(2)}`;
  const days = 3 + (h % 5);
  const cureMonth = 78 + (h % 20);
  const cureAll = 75 + ((h >> 3) % 22);
  const cullMonth = 1 + (h % 6);
  const cullAll = 2 + ((h >> 5) % 7);
  return [
    { label: "药费统计", value: { month: money(month), all: money(all) } },
    { label: "使用次数", value: { month: `${month} 次`, all: `${all} 次` } },
    { label: "平均疗程", value: { month: `${days} 天`, all: `${days + ((h >> 2) % 2)} 天` } },
    { label: "治愈率", value: { month: `${cureMonth}%`, all: `${cureAll}%` } },
    { label: "淘汰率", value: { month: `${cullMonth}%`, all: `${cullAll}%` } },
  ];
}
