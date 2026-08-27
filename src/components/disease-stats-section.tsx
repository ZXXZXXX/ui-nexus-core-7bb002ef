import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { TimeTabs } from "@/components/dashboard/charts";
import { ChevronRight, ChevronLeft, Home, BarChart3, PieChart } from "lucide-react";
import { useDataLevel, type DataLevel } from "@/lib/dashboard-view";


type DiseaseCat = { name: string; color: string; diseases: { name: string; count: number }[] };
type Org = { id: string; name: string; herd: number; cases: number; cats?: DiseaseCat[]; children?: Org[] };

const C = {
  mastitis: "var(--brand)",
  hoof: "var(--effect-ai-cyan)",
  repro: "var(--effect-ai-purple)",
  resp: "var(--state-warning)",
  digest: "var(--state-danger)",
  other: "var(--text-tertiary)",
};

function cats(m: number[], h: number[], r: number[], re: number[], d: number[], o: number): DiseaseCat[] {
  return [
    { name: "乳房疾病", color: C.mastitis, diseases: [
      { name: "临床型乳房炎", count: m[0] }, { name: "隐性乳房炎", count: m[1] }, { name: "乳头损伤", count: m[2] },
    ] },
    { name: "肢蹄疾病", color: C.hoof, diseases: [
      { name: "蹄叶炎", count: h[0] }, { name: "腐蹄病", count: h[1] }, { name: "趾间皮炎", count: h[2] },
    ] },
    { name: "繁殖疾病", color: C.repro, diseases: [
      { name: "子宫内膜炎", count: r[0] }, { name: "胎衣不下", count: r[1] }, { name: "卵巢囊肿", count: r[2] },
    ] },
    { name: "呼吸道疾病", color: C.resp, diseases: [
      { name: "支气管肺炎", count: re[0] }, { name: "牛传染性鼻气管炎", count: re[1] },
    ] },
    { name: "消化系统疾病", color: C.digest, diseases: [
      { name: "瘤胃酸中毒", count: d[0] }, { name: "皱胃变位", count: d[1] }, { name: "腹泻", count: d[2] },
    ] },
    { name: "代谢及其他", color: C.other, diseases: [
      { name: "酮病", count: Math.round(o * 0.6) }, { name: "低血钙", count: o - Math.round(o * 0.6) },
    ] },
  ];
}

const ORG: Org = {
  id: "group", name: "集团整体", herd: 0, cases: 0,
  children: [
    {
      id: "r-northeast", name: "东北大区", herd: 0, cases: 0,
      children: [
        { id: "f1", name: "1 号牧场", herd: 1284, cases: 78, cats: cats([21, 9, 3], [12, 6, 4], [8, 5, 2], [3, 2], [1, 1, 1], 0) },
        { id: "f2", name: "2 号牧场", herd: 968, cases: 71, cats: cats([16, 7, 2], [9, 5, 3], [7, 4, 2], [6, 3], [3, 2, 1], 1) },
      ],
    },
    {
      id: "r-north", name: "华北大区", herd: 0, cases: 0,
      children: [
        { id: "f3", name: "3 号牧场", herd: 2150, cases: 86, cats: cats([18, 8, 3], [11, 7, 5], [9, 6, 3], [5, 3], [4, 2, 1], 1) },
        { id: "f5", name: "5 号牧场", herd: 1032, cases: 63, cats: cats([13, 6, 2], [10, 6, 3], [6, 4, 2], [4, 2], [3, 1, 1], 0) },
      ],
    },
    {
      id: "r-east", name: "华东大区", herd: 0, cases: 0,
      children: [
        { id: "f4", name: "4 号牧场", herd: 720, cases: 26, cats: cats([6, 3, 1], [4, 2, 1], [3, 2, 1], [1, 1], [1, 0, 0], 0) },
        { id: "f6", name: "6 号牧场", herd: 890, cases: 41, cats: cats([9, 4, 1], [6, 3, 2], [5, 3, 1], [2, 1], [2, 1, 1], 0) },
      ],
    },
  ],
};

function rollupOrg(o: Org): { herd: number; cases: number } {
  if (!o.children?.length) return { herd: o.herd, cases: o.cases };
  return o.children.reduce(
    (a, c) => {
      const r = rollupOrg(c);
      return { herd: a.herd + r.herd, cases: a.cases + r.cases };
    },
    { herd: 0, cases: 0 }
  );
}

function rollupCats(o: Org): DiseaseCat[] {
  if (o.cats) return o.cats.map((c) => ({ ...c, diseases: c.diseases.map((d) => ({ ...d })) }));
  const merged: DiseaseCat[] = [];
  for (const child of o.children ?? []) {
    for (const c of rollupCats(child)) {
      const hit = merged.find((x) => x.name === c.name);
      if (!hit) merged.push(c);
      else
        for (const d of c.diseases) {
          const dh = hit.diseases.find((x) => x.name === d.name);
          if (dh) dh.count += d.count;
          else hit.diseases.push({ ...d });
        }
    }
  }
  return merged;
}

function incidence(o: Org) {
  const { herd, cases } = rollupOrg(o);
  return herd === 0 ? 0 : (cases / herd) * 100;
}

function polar(cx: number, cy: number, r: number, a: number) {
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

function DonutChart({ data, onPick }: { data: DiseaseCat[]; onPick: (c: DiseaseCat) => void }) {
  const totals = data.map((c) => c.diseases.reduce((s, d) => s + d.count, 0));
  const total = totals.reduce((s, x) => s + x, 0) || 1;
  const cx = 100, cy = 100, R = 82, r = 52;
  let acc = 0;
  return (
    <div className="flex items-center gap-6 flex-wrap">
      <svg width="200" height="200" viewBox="0 0 200 200" className="shrink-0">
        {data.map((c, i) => {
          const v = totals[i];
          const start = (acc / total) * Math.PI * 2 - Math.PI / 2;
          acc += v;
          const end = (acc / total) * Math.PI * 2 - Math.PI / 2;
          const large = end - start > Math.PI ? 1 : 0;
          const [x1, y1] = polar(cx, cy, R, start);
          const [x2, y2] = polar(cx, cy, R, end);
          const [x3, y3] = polar(cx, cy, r, end);
          const [x4, y4] = polar(cx, cy, r, start);
          return (
            <path
              key={c.name}
              d={`M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${r} ${r} 0 ${large} 0 ${x4} ${y4} Z`}
              fill={c.color}
              className="cursor-pointer transition-opacity hover:opacity-80"
              onClick={() => onPick(c)}
            />
          );
        })}
        <text x={cx} y={cy - 4} textAnchor="middle" className="fill-foreground" style={{ fontSize: 22, fontWeight: 600 }}>
          {total}
        </text>
        <text x={cx} y={cy + 16} textAnchor="middle" className="fill-[var(--text-tertiary)]" style={{ fontSize: 12 }}>
          发病例次
        </text>
      </svg>
      <div className="flex-1 min-w-[180px] space-y-2">
        {data.map((c, i) => (
          <button
            key={c.name}
            type="button"
            onClick={() => onPick(c)}
            className="w-full flex items-center gap-2 text-left rounded-lg px-2 py-1.5 hover:bg-surface-subtle transition-colors"
          >
            <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ background: c.color }} />
            <span className="text-body-sm text-foreground flex-1 truncate">{c.name}</span>
            <span className="text-body-sm tabular-nums text-text-secondary">{totals[i]}</span>
            <span className="text-caption tabular-nums text-text-tertiary w-12 text-right">
              {((totals[i] / total) * 100).toFixed(1)}%
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-text-tertiary" />
          </button>
        ))}
      </div>
    </div>
  );
}

function CategoryBars({ cat }: { cat: DiseaseCat }) {
  const list = [...cat.diseases].sort((a, b) => b.count - a.count);
  const max = Math.max(...list.map((d) => d.count), 1);
  return (
    <div className="flex items-end justify-around gap-4 h-[220px] pt-4">
      {list.map((d) => (
        <div key={d.name} className="flex-1 h-full flex flex-col items-center justify-end gap-2">
          <span className="text-body-sm tabular-nums text-foreground font-medium">{d.count}</span>
          <div
            className="w-full max-w-[56px] rounded-t-lg transition-all"
            style={{ height: `${(d.count / max) * 100}%`, background: cat.color, minHeight: 4 }}
          />
          <span className="text-caption text-text-tertiary text-center leading-tight">{d.name}</span>
        </div>
      ))}
    </div>
  );
}

const DIS_ALL = "全部";
const DIS_MONTH = "本月";
const DIS_YEAR = "本年";
const DIS_RANGE_FACTOR: Record<string, number> = { [DIS_ALL]: 30, [DIS_MONTH]: 1, [DIS_YEAR]: 11.4 };

function rootForLevel(level: DataLevel): Org {
  if (level === "group") return ORG;
  if (level === "region") return ORG.children![0]; // 东北大区
  // 牧场级：隐藏具体牧场名，用中性根节点包裹当前牧场
  const farm = ORG.children![0].children![0]; // 1 号牧场
  return { id: "farm-scope", name: "当前牧场", herd: 0, cases: 0, children: [farm] };
}

export function DiseaseStatsSection() {
  const { level } = useDataLevel();
  const root = useMemo(() => rootForLevel(level), [level]);
  const [path, setPath] = useState<Org[]>([root]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cat, setCat] = useState<string | null>(null);
  const [range, setRange] = useState(DIS_MONTH);
  const rangeF = DIS_RANGE_FACTOR[range] ?? 1;

  useEffect(() => {
    setPath([root]);
    setSelectedId(null);
    setCat(null);
  }, [root]);

  const scope = path[path.length - 1] ?? root;
  const children = scope.children ?? [];
  const ranked = useMemo(
    () => [...children].sort((a, b) => incidence(b) - incidence(a)),
    [children]
  );
  const selected = ranked.find((o) => o.id === selectedId) ?? null;
  const focus = selected ?? scope;
  const focusCats = useMemo(
    () =>
      rollupCats(focus).map((c) => ({
        ...c,
        diseases: c.diseases.map((d) => ({ ...d, count: Math.round(d.count * rangeF) })),
      })),
    [focus, rangeF],
  );
  const activeCat = focusCats.find((c) => c.name === cat) ?? null;
  const maxRate = Math.max(...ranked.map((o) => incidence(o) * rangeF), 0.01);
  const childrenAreRegions = children.some((c) => c.children?.length);


  const goto = (i: number) => {
    setPath(path.slice(0, i + 1));
    setSelectedId(null);
    setCat(null);
  };

  const pick = (o: Org) => {
    if (o.children?.length) {
      setPath([...path, o]);
      setSelectedId(null);
    } else {
      setSelectedId(selectedId === o.id ? null : o.id);
    }
    setCat(null);
  };

  return (
    <Card className="border-border bg-card rounded-2xl shadow-card p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "color-mix(in oklab, var(--state-danger) 14%, transparent)", color: "var(--state-danger)" }}
          >
            <BarChart3 className="h-4 w-4" strokeWidth={2} />
          </div>
          <h3 className="text-card-title text-foreground">疾病统计</h3>
          <TimeTabs value={range} onChange={setRange} options={[DIS_ALL, DIS_MONTH, DIS_YEAR]} />
        </div>
        {level !== "farm" && (
          <div className="flex items-center gap-1 text-body-sm flex-wrap">
            {path.map((n, i) => {
              const last = i === path.length - 1;
              return (
                <span key={n.id} className="inline-flex items-center gap-1">
                  {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-text-tertiary" />}
                  {last ? (
                    <span className="text-foreground font-medium inline-flex items-center gap-1">
                      {i === 0 && <Home className="h-3.5 w-3.5" />}
                      {n.name}
                    </span>
                  ) : (
                    <button type="button" onClick={() => goto(i)} className="text-text-tertiary hover:text-primary inline-flex items-center gap-1">
                      {i === 0 && <Home className="h-3.5 w-3.5" />}
                      {n.name}
                    </button>
                  )}
                </span>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-5 @container grid grid-cols-1 @2xl:grid-cols-2 gap-6">
        {/* 左：组织发病率排名（多于一个组织时才展示） */}
        {ranked.length > 1 && (
          <div>
            <div className="flex items-center justify-between">
              <p className="text-body-sm text-text-secondary">
                {childrenAreRegions ? "各区域发病率排名" : "各牧场发病率排名"}
              </p>
              <span className="text-caption text-text-tertiary">由高到低</span>
            </div>
            <div className="mt-4 space-y-3">
              {ranked.map((o, i) => {
                const rate = incidence(o) * rangeF;
                const raw_ = rollupOrg(o);
                const sums = { ...raw_, cases: Math.round(raw_.cases * rangeF) };
                const isSel = selectedId === o.id;
                const drillable = !!o.children?.length;
                const color = i === 0 ? "var(--state-danger)" : i === 1 ? "var(--state-warning)" : "var(--brand)";
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => pick(o)}
                    className="group w-full text-left flex items-center gap-3"
                    title={`${sums.cases}/${sums.herd.toLocaleString()}`}
                  >
                    <span className="text-caption tabular-nums text-text-tertiary w-4 shrink-0">{i + 1}</span>
                    <span
                      className={`text-body truncate w-24 shrink-0 ${isSel ? "text-primary font-medium" : "text-foreground"}`}
                    >
                      {o.name}
                    </span>
                    <span className="relative flex-1 h-7 rounded-md bg-surface-subtle overflow-hidden">
                      <span
                        className="absolute inset-y-0 left-0 rounded-md transition-all group-hover:opacity-85"
                        style={{
                          width: `${Math.max((rate / maxRate) * 100, 2)}%`,
                          background: color,
                          opacity: isSel ? 1 : 0.9,
                        }}
                      />
                    </span>
                    <span className="shrink-0 flex items-center gap-2">
                      <span className="text-caption text-text-tertiary tabular-nums">
                        {sums.cases}/{sums.herd.toLocaleString()}
                      </span>
                      <span className="text-body-sm font-medium tabular-nums text-foreground w-14 text-right">
                        {rate.toFixed(2)}%
                      </span>
                      {drillable && <ChevronRight className="h-4 w-4 text-text-tertiary" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 右：疾病构成 */}
        <div className={`${ranked.length > 1 ? "lg:border-l lg:border-border lg:pl-6" : ""}`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <PieChart className="h-4 w-4 text-text-tertiary shrink-0" strokeWidth={1.75} />
              <p className="text-body-sm text-text-secondary truncate">
                {level !== "farm" && `${focus.name} · `}{activeCat ? `${activeCat.name}明细` : "疾病类别分布"}
              </p>
            </div>
            {activeCat && (
              <button type="button" onClick={() => setCat(null)} className="text-body-sm text-text-tertiary hover:text-primary inline-flex items-center gap-1 shrink-0">
                <ChevronLeft className="h-3.5 w-3.5" />
                返回类别
              </button>
            )}
          </div>
          <div className="mt-4">
            {activeCat ? <CategoryBars cat={activeCat} /> : <DonutChart data={focusCats} onPick={(c) => setCat(c.name)} />}
          </div>
          <p className="mt-4 text-caption text-text-tertiary">
            {selected ? "当前展示所选牧场的疾病构成" : "当前展示该范围整体疾病构成"}
          </p>
        </div>
      </div>
    </Card>
  );
}
