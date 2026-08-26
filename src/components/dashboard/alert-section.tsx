import { AlertTriangle, PackageMinus, Beef, Timer } from "lucide-react";
import { SectionCard } from "./charts";

type Item = { title: string; desc: string; tag: string; tone: string };

const groups: { key: string; icon: typeof AlertTriangle; items: Item[] }[] = [
  {
    key: "库存预警",
    icon: PackageMinus,
    items: [
      { title: "疫苗 A", desc: "余量 12 支，低于安全库存 40 支", tag: "紧急", tone: "var(--state-danger)" },
      { title: "头孢噻呋注射液", desc: "余量 6 瓶，预计 2 天内耗尽", tag: "紧急", tone: "var(--state-danger)" },
      { title: "消毒液", desc: "余量 3 桶，低于安全库存", tag: "预警", tone: "var(--state-warning)" },
      { title: "采血管", desc: "库存临期（30 天内）500 支", tag: "临期", tone: "var(--state-warning)" },
    ],
  },
  {
    key: "牛只预警",
    icon: Beef,
    items: [
      { title: "#01-24-2381", desc: "诊疗期已达 18 天，超出平均 2.4 倍", tag: "诊疗期长", tone: "var(--state-danger)" },
      { title: "#01-24-2105", desc: "近一年报病 6 次，建议评估淘汰", tag: "发病次数多", tone: "var(--state-warning)" },
      { title: "#01-23-1876", desc: "累计诊疗费用 1,860 元，居全场首位", tag: "费用高", tone: "var(--effect-ai-purple)" },
    ],
  },
  {
    key: "工单预警",
    icon: Timer,
    items: [
      { title: "WO-2381 疾病诊疗", desc: "距离逾期还有 3 小时，责任人：李兽医", tag: "即将逾期", tone: "var(--state-warning)" },
      { title: "UD-1042 派工单", desc: "距离逾期还有 6 小时，责任人：未指定", tag: "派工单", tone: "var(--effect-ai-cyan)" },
    ],
  },
];

export const alertCounts = groups.map((g) => ({ key: g.key, count: g.items.length }));

export function AlertSection({ bare = false }: { bare?: boolean }) {
  const total = groups.reduce((s, g) => s + g.items.length, 0);

  const grid = (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {groups.map((g) => (
          <div key={g.key} className="rounded-xl border border-border overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-surface-subtle">
              <g.icon className="h-4 w-4 text-text-secondary" strokeWidth={1.75} />
              <span className="text-body-sm text-foreground">{g.key}</span>
              <span className="ml-auto text-caption text-text-tertiary tabular-nums">{g.items.length} 条</span>
            </div>
            <div className="divide-y divide-border">
              {g.items.map((it) => (
                <div key={it.title + it.desc} className="px-4 py-3">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                    <span className="truncate text-body-sm text-foreground">{it.title}</span>
                    <span
                      className="shrink-0 inline-flex items-center h-[20px] px-1.5 rounded-md text-caption"
                      style={{ background: `color-mix(in oklab, ${it.tone} 14%, transparent)`, color: it.tone }}
                    >
                      {it.tag}
                    </span>
                  </div>
                  <p className="mt-1 text-caption text-text-tertiary">{it.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
  );

  if (bare) return grid;

  return (
    <SectionCard
      id="topic-alert"
      title="预警告警专题"
      desc={`${total} 条待关注`}
      icon={<AlertTriangle className="h-4 w-4 text-primary" strokeWidth={1.75} />}
    >
      {grid}
    </SectionCard>
  );
}

