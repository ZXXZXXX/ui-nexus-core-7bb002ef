import { useMemo, useState } from "react";
import { BarChart3, Layers, Download, ChevronLeft, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { SectionCard, PeriodTabs, LineTrend } from "./charts";
import { WorkOrderSection } from "./workorder-section";
import { HerdSection } from "./herd-section";

/* ---------------- 数据：牧场为最小口径 ---------------- */

export type GroupFarm = {
  farm: string;
  base: string;
  region: string;
  herd: number;
  death: number;
  cull: number;
  /** 产后 0-30 / 0-60 / 0-90 天淘汰率 % */
  pp30: number;
  pp60: number;
  pp90: number;
  /** 产后各区间淘汰头数 */
  pp30n: number;
  pp60n: number;
  pp90n: number;
  sick: number;
  cure: number;
  perHead: number; // 单头牛药费 元
  drugFee: number; // 药费总支出 元
  budgetDelta: number; // 预算偏差 %（负=节约）
  treatmentDays: number; // 平均诊疗天数
  calving: number; // 产犊数（用于计算早产率）
  preterm: number; // 早产数
  organic?: boolean; // 是否为有机牧场
};

export const GROUP_FARMS: GroupFarm[] = [
  { farm: "1号牧场", base: "齐齐哈尔基地", region: "东北大区", organic: true, herd: 5200, death: 8, cull: 24, pp30: 1.8, pp60: 2.9, pp90: 3.6, pp30n: 18, pp60n: 29, pp90n: 36, sick: 6.2, cure: 95.1, perHead: 29.4, drugFee: 153_000, budgetDelta: -12, treatmentDays: 3.4, calving: 198, preterm: 7 },
  { farm: "2号牧场", base: "大庆基地", region: "东北大区", organic: false, herd: 4800, death: 11, cull: 27, pp30: 2.4, pp60: 3.6, pp90: 4.5, pp30n: 22, pp60n: 33, pp90n: 41, sick: 7.5, cure: 93.0, perHead: 34.1, drugFee: 164_000, budgetDelta: -5, treatmentDays: 3.8, calving: 182, preterm: 9 },
  { farm: "3号牧场", base: "绥化基地", region: "东北大区", organic: false, herd: 4500, death: 13, cull: 33, pp30: 2.9, pp60: 4.2, pp90: 5.3, pp30n: 25, pp60n: 36, pp90n: 46, sick: 8.8, cure: 92.4, perHead: 39.5, drugFee: 178_000, budgetDelta: 0, treatmentDays: 4.2, calving: 170, preterm: 11 },
  { farm: "1号牧场", base: "武威基地", region: "西北大区", organic: true, herd: 4100, death: 16, cull: 40, pp30: 3.5, pp60: 4.7, pp90: 6.4, pp30n: 28, pp60n: 41, pp90n: 51, sick: 9.8, cure: 91.2, perHead: 48.0, drugFee: 197_000, budgetDelta: 8, treatmentDays: 4.6, calving: 156, preterm: 14 },
  { farm: "2号牧场", base: "金昌基地", region: "西北大区", organic: false, herd: 3600, death: 14, cull: 35, pp30: 3.1, pp60: 4.7, pp90: 5.9, pp30n: 23, pp60n: 35, pp90n: 44, sick: 9.1, cure: 91.9, perHead: 44.2, drugFee: 159_000, budgetDelta: 3, treatmentDays: 4.4, calving: 138, preterm: 12 },
  { farm: "2号牧场", base: "张家口基地", region: "华北大区", organic: false, herd: 3900, death: 24, cull: 48, pp30: 5.4, pp60: 7.2, pp90: 8.6, pp30n: 42, pp60n: 56, pp90n: 67, sick: 12.4, cure: 87.5, perHead: 54.2, drugFee: 211_000, budgetDelta: 28, treatmentDays: 5.2, calving: 148, preterm: 16 },
  { farm: "1号牧场", base: "保定基地", region: "华北大区", organic: true, herd: 3400, death: 15, cull: 36, pp30: 3.8, pp60: 5.4, pp90: 6.7, pp30n: 26, pp60n: 37, pp90n: 46, sick: 10.2, cure: 90.4, perHead: 46.8, drugFee: 159_000, budgetDelta: 11, treatmentDays: 4.8, calving: 130, preterm: 10 },
];

export const farmCountSummary = {
  total: GROUP_FARMS.length,
  organic: GROUP_FARMS.filter((f) => f.organic).length,
  get ordinary() {
    return this.total - this.organic;
  },
};

/** 区域高管默认所辖区域 */
export const CURRENT_REGION = "东北大区";

/** 牧场级外部视角默认牧场 */
export const CURRENT_FARM = { farm: "1号牧场", region: "东北大区" };

/** 近 12 个月月份标签（自然月倒推） */
const MONTH_LABELS = ["6月", "7月", "8月", "9月", "10月", "11月", "12月", "1月", "2月", "3月", "4月", "5月"];
/** 月度波动因子（确定性，无随机） */
const MONTH_FACTORS = [0.86, 0.92, 1.05, 0.97, 0.9, 0.99, 1.14, 1.2, 1.02, 0.94, 1.0, 1.08];

/** 单牧场按月拆分的指标行 */
export function farmMonthlyRows(farmName: string, region: string): Row[] {
  const f = GROUP_FARMS.find((x) => x.farm === farmName && x.region === region) ?? GROUP_FARMS[0];
  return MONTH_LABELS.map((m, i) => {
    const k = MONTH_FACTORS[i];
    const r = (v: number, d = 1) => Number((v * k).toFixed(d));
    return {
      key: m,
      sub: `${f.region} · ${f.farm}`,
      herd: Math.round(f.herd * (0.98 + i * 0.002)),
      death: Math.round(f.death * k),
      cull: Math.round(f.cull * k),
      pp30: r(f.pp30),
      pp60: r(f.pp60),
      pp90: r(f.pp90),
      pp30n: Math.round(f.pp30n * k),
      pp60n: Math.round(f.pp60n * k),
      pp90n: Math.round(f.pp90n * k),
      sick: r(f.sick),
      cure: Number(Math.min(99, f.cure / k ** 0.2).toFixed(1)),
      perHead: r(f.perHead),
      drugFee: Math.round(f.drugFee * k),
      budgetDelta: r(f.budgetDelta),
      treatmentDays: r(f.treatmentDays),
      pretermRate: Number(((f.preterm * k) / (f.calving || 1) * 100).toFixed(1)),
    };
  });
}

/** 按区域（或集团）统计牧场数量分布 */
export function farmCountFor(region?: string | null) {
  const list = region ? GROUP_FARMS.filter((f) => f.region === region) : GROUP_FARMS;
  const organic = list.filter((f) => f.organic).length;
  return { total: list.length, organic, ordinary: list.length - organic };
}

type Row = {
  key: string;
  sub: string;
  herd: number;
  death: number;
  cull: number;
  pp30: number;
  pp60: number;
  pp90: number;
  pp30n: number;
  pp60n: number;
  pp90n: number;
  sick: number;
  cure: number;
  perHead: number;
  drugFee: number;
  budgetDelta: number;
  treatmentDays: number;
  pretermRate: number;
};

function agg(key: string, sub: string, rows: GroupFarm[]): Row {
  const herd = rows.reduce((s, r) => s + r.herd, 0) || 1;
  const w = (p: (r: GroupFarm) => number) =>
    Number((rows.reduce((s, r) => s + p(r) * r.herd, 0) / herd).toFixed(1));
  const sum = (p: (r: GroupFarm) => number) => rows.reduce((s, r) => s + p(r), 0);
  return {
    key,
    sub,
    herd,
    death: sum((r) => r.death),
    cull: sum((r) => r.cull),
    pp30: w((r) => r.pp30),
    pp60: w((r) => r.pp60),
    pp90: w((r) => r.pp90),
    pp30n: sum((r) => r.pp30n),
    pp60n: sum((r) => r.pp60n),
    pp90n: sum((r) => r.pp90n),
    sick: w((r) => r.sick),
    cure: w((r) => r.cure),
    perHead: Number((sum((r) => r.drugFee) / herd).toFixed(1)),
    drugFee: sum((r) => r.drugFee),
    budgetDelta: w((r) => r.budgetDelta),
    treatmentDays: w((r) => r.treatmentDays),
    pretermRate: Number(((sum((r) => r.preterm) / (sum((r) => r.calving) || 1)) * 100).toFixed(1)),
  };
}

const REGIONS = Array.from(new Set(GROUP_FARMS.map((f) => f.region)));
const regionRows = REGIONS.map((rg) =>
  agg(rg, `${GROUP_FARMS.filter((f) => f.region === rg).length} 个牧场`, GROUP_FARMS.filter((f) => f.region === rg)),
);
const farmRows = GROUP_FARMS.map((f) => agg(`${f.region} · ${f.farm}`, f.base, [f]));

const wan = (n: number) => `${(n / 10000).toFixed(1)} 万`;

/* ---------------- 二、产后淘汰率排名（竖直排布：区域/牧场竖向列表 + 横向条形） ---------------- */

const BUCKETS = [
  { key: "pp30", n: "pp30n", label: "0-30 天", color: "var(--brand)" },
  { key: "pp60", n: "pp60n", label: "0-60 天", color: "var(--effect-ai-cyan)" },
  { key: "pp90", n: "pp90n", label: "0-90 天", color: "var(--state-warning)" },
] as const;

function StackedBars({
  rows,
  onPick,
}: {
  rows: Row[];
  onPick?: (r: Row) => void;
}) {
  const [hover, setHover] = useState<{
    key: string;
    clientX: number;
    clientY: number;
    pp30: number;
    pp60: number;
    pp90: number;
    pp30n: number;
    pp60n: number;
    pp90n: number;
  } | null>(null);
  const max = Math.max(...rows.map((r) => r.pp90n), 1);
  return (
    <div className="table w-full">
      {rows.map((r) => {
        const layers = [
          { label: "0-90 天", color: BUCKETS[2].color, rate: r.pp90, cnt: r.pp90n },
          { label: "0-60 天", color: BUCKETS[1].color, rate: r.pp60, cnt: r.pp60n },
          { label: "0-30 天", color: BUCKETS[0].color, rate: r.pp30, cnt: r.pp30n },
        ];
        return (
          <div
            key={r.key}
            role={onPick ? "button" : undefined}
            tabIndex={onPick ? 0 : undefined}
            onClick={() => onPick?.(r)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onPick?.(r);
              }
            }}
            className={`table-row transition-colors ${onPick ? "cursor-pointer hover:bg-surface-subtle" : "cursor-default"}`}
          >
            <div className="table-cell whitespace-nowrap py-2.5 pr-3 align-middle">
              <div className="text-body-sm text-foreground truncate">{r.key}</div>
              <div className="text-caption text-text-tertiary truncate">{r.sub}</div>
            </div>
            <div className="table-cell w-full align-middle py-2.5">
              <div
                className="relative h-4 w-full rounded-md overflow-hidden"
                onMouseMove={(e) => {
                  setHover({
                    key: r.key,
                    clientX: e.clientX,
                    clientY: e.clientY,
                    pp30: r.pp30,
                    pp60: r.pp60,
                    pp90: r.pp90,
                    pp30n: r.pp30n,
                    pp60n: r.pp60n,
                    pp90n: r.pp90n,
                  });
                }}
                onMouseLeave={() => setHover(null)}
              >
                {layers.map((s) => (
                  <div
                    key={s.label}
                    className="absolute top-0 left-0 h-full rounded-md"
                    style={{ width: `${(s.cnt / max) * 100}%`, background: s.color }}
                  />
                ))}
              </div>
            </div>
            <div className="table-cell whitespace-nowrap pl-3 py-2.5 align-middle text-right">
              <span className="text-body-sm tabular-nums text-foreground">{r.pp90n} 头</span>
            </div>
          </div>
        );
      })}
      {hover && (
        <div
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full rounded-lg border border-border bg-card px-3 py-2 shadow-card whitespace-nowrap"
          style={{ left: hover.clientX, top: hover.clientY - 12 }}
        >
          <div className="text-caption text-foreground mb-1">{hover.key}</div>
          <div className="space-y-0.5">
            {[
              { label: "0-30 天", color: BUCKETS[0].color, cnt: hover.pp30n, rate: hover.pp30 },
              { label: "0-60 天", color: BUCKETS[1].color, cnt: hover.pp60n, rate: hover.pp60 },
              { label: "0-90 天", color: BUCKETS[2].color, cnt: hover.pp90n, rate: hover.pp90 },
            ].map((b) => (
              <div key={b.label} className="flex items-center gap-2 text-caption text-text-secondary">
                <span className="h-2 w-2 rounded-sm" style={{ background: b.color }} />
                <span className="tabular-nums">{b.label} {b.cnt} 头 ({b.rate}%)</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


function PostpartumRankSection({ scopeRegion, scopeFarm }: { scopeRegion?: string | null; scopeFarm?: { farm: string; region: string } | null }) {
  const [drill, setDrill] = useState<string | null>(null);
  const region = scopeRegion ?? drill;
  const setRegion = scopeRegion ? () => {} : setDrill;
  const rows = useMemo(() => {
    if (scopeFarm) return farmMonthlyRows(scopeFarm.farm, scopeFarm.region);
    const list = region
      ? GROUP_FARMS.filter((f) => f.region === region).map((f) => agg(f.farm, f.base, [f]))
      : [...regionRows];
    return list.sort((a, b) => b.pp90n - a.pp90n);
  }, [region, scopeFarm]);

  return (
    <SectionCard
      id="topic-pp-rank"
      title={scopeFarm ? "产后淘汰率统计" : "产后淘汰率排名"}
      desc={
        region && !scopeRegion && !scopeFarm ? (
          <button
            type="button"
            onClick={() => setRegion(null)}
            className="inline-flex items-center gap-1 text-caption text-primary hover:underline"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            返回区域
          </button>
        ) : undefined
      }
      icon={<BarChart3 className="h-4 w-4 text-primary" strokeWidth={1.75} />}
      extra={
        <span className="text-caption text-text-secondary">
          {scopeFarm ? `${scopeFarm.farm} · 近 12 个月` : region ? `${region} · 牧场排名` : "区域排名"}
        </span>
      }
    >
      <p className="text-body-sm text-text-secondary mb-4">
        {scopeFarm
          ? "本牧场近 12 个月产后淘汰率对比"
          : region
            ? "该区域下各牧场产后淘汰率对比"
            : "点击某区域可下钻查看该区域下所有牧场排名"}
      </p>
      {scopeFarm ? (
        <LineTrend
          labels={rows.map((r) => r.key)}
          series={[
            { name: "0-30 天", color: BUCKETS[0]!.color, points: rows.map((r) => r.pp30) },
            { name: "0-60 天", color: BUCKETS[1]!.color, points: rows.map((r) => r.pp60) },
            { name: "0-90 天", color: BUCKETS[2]!.color, points: rows.map((r) => r.pp90) },
          ]}
          height={240}
          unit="%"
        />
      ) : (
        <StackedBars rows={rows} onPick={region ? undefined : (r) => setRegion(r.key)} />
      )}
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-5">
        {BUCKETS.map((b) => (
          <span key={b.key} className="inline-flex items-center gap-1.5 text-caption text-text-secondary">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: b.color }} />
            {b.label}
          </span>
        ))}
      </div>
    </SectionCard>
  );
}

/* ---------------- 三、药费趋势（柱形 + 折线组合） ---------------- */

const ALL_MONTHS = ["6月", "7月", "8月", "9月", "10月", "11月", "12月", "1月", "2月", "3月", "4月", "5月"];
const ALL_TOTAL_FEE = [96.4, 101.2, 108.6, 99.3, 94.8, 102.5, 118.7, 124.3, 106.1, 98.7, 105.4, 112.8]; // 万元
const ALL_PER_HEAD = [31.2, 32.5, 34.8, 31.9, 30.4, 32.8, 37.6, 39.2, 34.1, 31.6, 33.7, 36.1]; // 元/头

function DrugComboChart({ months, totalFee, perHead }: { months: string[]; totalFee: number[]; perHead: number[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 900;
  const H = 260;
  const padL = 56;
  const padR = 56;
  const padT = 16;
  const padB = 32;
  const iw = W - padL - padR;
  const ih = H - padT - padB;
  const maxBar = Math.max(...totalFee) * 1.15;
  const maxLine = Math.max(...perHead) * 1.25;
  const minLine = Math.min(...perHead) * 0.7;
  const step = iw / months.length;
  const bw = Math.min(30, step * 0.5);
  const cx = (i: number) => padL + step * i + step / 2;
  const ly = (v: number) => padT + ih - ((v - minLine) / (maxLine - minLine)) * ih;
  const path = perHead.map((v, i) => `${i === 0 ? "M" : "L"} ${cx(i)} ${ly(v)}`).join(" ");

  return (
    <div className="w-full overflow-x-auto">
      <div className="relative min-w-[720px]">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
          {[0, 0.25, 0.5, 0.75, 1].map((t) => (
            <line
              key={t}
              x1={padL}
              x2={W - padR}
              y1={padT + ih * t}
              y2={padT + ih * t}
              stroke="var(--border)"
              strokeWidth="1"
            />
          ))}
          {months.map((m, i) => {
            const h = (totalFee[i] / maxBar) * ih;
            const active = hover === i;
            return (
              <g key={m}>
                <rect
                  x={cx(i) - bw / 2}
                  y={padT + ih - h}
                  width={bw}
                  height={h}
                  rx={4}
                  fill="var(--brand)"
                  opacity={hover === null || active ? 0.9 : 0.35}
                />
                <rect
                  x={padL + step * i}
                  y={padT}
                  width={step}
                  height={ih}
                  fill="transparent"
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                />
                <text x={cx(i)} y={H - 10} textAnchor="middle" className="text-caption" fill="var(--text-tertiary)" fontSize="11">
                  {m}
                </text>
              </g>
            );
          })}
          <path d={path} fill="none" stroke="var(--effect-ai-purple)" strokeWidth="2.5" strokeLinejoin="round" />
          {perHead.map((v, i) => (
            <circle key={i} cx={cx(i)} cy={ly(v)} r={hover === i ? 5 : 3.5} fill="var(--effect-ai-purple)" />
          ))}
          <text x={padL - 8} y={padT + 4} textAnchor="end" fontSize="11" fill="var(--text-tertiary)">
            万元
          </text>
          <text x={W - padR + 8} y={padT + 4} fontSize="11" fill="var(--text-tertiary)">
            元/头
          </text>
        </svg>
        {hover !== null && (
          <div
            className={`pointer-events-none absolute z-10 whitespace-nowrap rounded-lg border border-border bg-card px-3 py-2 shadow-card ${
              hover >= months.length - 2
                ? "-translate-x-full"
                : hover <= 1
                  ? "translate-x-0"
                  : "-translate-x-1/2"
            }`}
            style={{
              left: `${((cx(hover) / W) * 100).toFixed(2)}%`,
              top: Math.min(ly(perHead[hover]) + 12, H - 88),
            }}
          >
            <div className="text-caption text-text-tertiary">{months[hover]}</div>
            <div className="text-body-sm text-foreground tabular-nums">总药费 {totalFee[hover]} 万元</div>
            <div className="text-body-sm tabular-nums" style={{ color: "var(--effect-ai-purple)" }}>
              单头药费 {perHead[hover]} 元/头
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DrugTrendSection({ scopeRegion }: { scopeRegion?: string | null }) {
  const [period, setPeriod] = useState("近 6 个月");
  // 区域视角：总药费按该区域药费占比折算，单头药费按区域实际水平折算
  const { feeRatio, headRatio } = useMemo(() => {
    if (!scopeRegion) return { feeRatio: 1, headRatio: 1 };
    const all = agg("集团", "", GROUP_FARMS);
    const rg = agg(scopeRegion, "", GROUP_FARMS.filter((f) => f.region === scopeRegion));
    return { feeRatio: rg.drugFee / all.drugFee, headRatio: rg.perHead / all.perHead };
  }, [scopeRegion]);
  const months = useMemo(() => (period === "近 6 个月" ? ALL_MONTHS.slice(-6) : ALL_MONTHS), [period]);
  const totalFee = useMemo(
    () => (period === "近 6 个月" ? ALL_TOTAL_FEE.slice(-6) : ALL_TOTAL_FEE).map((v) => Number((v * feeRatio).toFixed(1))),
    [period, feeRatio],
  );
  const perHead = useMemo(
    () => (period === "近 6 个月" ? ALL_PER_HEAD.slice(-6) : ALL_PER_HEAD).map((v) => Number((v * headRatio).toFixed(1))),
    [period, headRatio],
  );

  return (
    <SectionCard
      id="topic-drug-trend"
      title="药费支出趋势"
      desc={scopeRegion ? `${scopeRegion} · ${period}` : period}
      icon={<BarChart3 className="h-4 w-4 text-primary" strokeWidth={1.75} />}
      extra={
        <PeriodTabs
          value={period}
          onChange={setPeriod}
          options={["近 6 个月", "近 1 年"]}
        />
      }
    >
      <DrugComboChart months={months} totalFee={totalFee} perHead={perHead} />
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-5">
        <span className="inline-flex items-center gap-1.5 text-caption text-text-secondary">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "var(--brand)" }} />
          总药费支出
        </span>
        <span className="inline-flex items-center gap-1.5 text-caption text-text-secondary">
          <span className="h-0.5 w-4 rounded-full" style={{ background: "var(--effect-ai-purple)" }} />
          单头药费
        </span>
      </div>
    </SectionCard>
  );
}

/* ---------------- 四、全景指标对标排行 ---------------- */

type SortKey =
  | "name"
  | "death"
  | "cull"
  | "sick"
  | "cure"
  | "treatmentDays"
  | "drugFee"
  | "perHead"
  | "pp30"
  | "pp60"
  | "pp90"
  | "pretermRate";

type SortDir = "asc" | "desc";

const COLUMNS: { key: SortKey; label: string; align: "left" | "right" }[] = [
  { key: "name", label: "区域名称", align: "left" },
  { key: "death", label: "死亡数", align: "right" },
  { key: "cull", label: "淘汰数", align: "right" },
  { key: "sick", label: "发病率", align: "right" },
  { key: "cure", label: "治愈率", align: "right" },
  { key: "treatmentDays", label: "平均诊疗天数", align: "right" },
  { key: "drugFee", label: "总药费", align: "right" },
  { key: "perHead", label: "头均药费", align: "right" },
  { key: "pp30", label: "产后0～30天淘汰率", align: "right" },
  { key: "pp60", label: "0～60天淘汰率", align: "right" },
  { key: "pp90", label: "0～90天淘汰率", align: "right" },
  { key: "pretermRate", label: "早产率", align: "right" },
];

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="h-3 w-3 text-text-tertiary opacity-60" />;
  return dir === "asc" ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />;
}

function PanoramaSection({ scopeRegion, scopeFarm }: { scopeRegion?: string | null; scopeFarm?: { farm: string; region: string } | null }) {
  const [viewMode, setViewMode] = useState<"region" | "farm">("region");
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: "pp30", dir: "asc" });

  const baseRows = useMemo(() => {
    if (scopeFarm) return farmMonthlyRows(scopeFarm.farm, scopeFarm.region);
    if (scopeRegion) return GROUP_FARMS.filter((f) => f.region === scopeRegion).map((f) => agg(f.farm, f.base, [f]));
    if (viewMode === "farm") return [...farmRows];
    return [...regionRows];
  }, [scopeRegion, scopeFarm, viewMode]);

  const rows = useMemo(() => {
    const list = [...baseRows];
    if (scopeFarm) {
      // 牧场外部视角：固定按最近月份排序，禁止列排序
      const recentOrder = [...MONTH_LABELS].reverse();
      return list.sort((a, b) => recentOrder.indexOf(a.key) - recentOrder.indexOf(b.key));
    }
    const { key, dir } = sort;
    const mult = dir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      if (key === "name") {
        return mult * a.key.localeCompare(b.key, "zh-CN");
      }
      const av = a[key] as number;
      const bv = b[key] as number;
      return mult * (av - bv);
    });
    return list;
  }, [baseRows, sort, scopeFarm]);

  const onSort = (key: SortKey) => {
    if (scopeFarm) return;
    setSort((prev) => ({ key, dir: prev.key === key && prev.dir === "desc" ? "asc" : "desc" }));
  };

  // 牧场级外部视角：隐藏药费相关列
  const cols = scopeFarm ? COLUMNS.filter((c) => c.key !== "drugFee" && c.key !== "perHead") : COLUMNS;

  const fmt = (r: (typeof rows)[number], key: SortKey) => {
    switch (key) {
      case "name":
        return r.key;
      case "sick":
      case "cure":
      case "pp30":
      case "pp60":
      case "pp90":
      case "pretermRate":
        return `${r[key]}%`;
      default:
        return r[key];
    }
  };

  const exportCsv = () => {
    // 仅导出当前视图（当前层级 + 当前排序）的数据
    const nameLabel = scopeFarm ? "月份" : scopeRegion || viewMode === "farm" ? "牧场名称" : "区域名称";
    const head = ["序号", ...cols.map((c) => (c.key === "name" ? nameLabel : c.label))];
    const body = rows.map((r, i) => [i + 1, ...cols.map((c) => fmt(r, c.key))]);
    const csv =
      "\uFEFF" + [head, ...body].map((line) => line.map((c) => `"${c}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    const rankLabel = scopeFarm
      ? `统计_${scopeFarm.farm}`
      : scopeRegion
        ? `排行_${scopeRegion}`
        : viewMode === "farm"
          ? "按牧场排行"
          : "按区域排行";
    a.download = `${scopeFarm ? "关键指标统计" : "关键指标排行"}_${rankLabel}_${rows.length}条.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`已导出当前视图 ${rows.length} 条数据`);
  };


  return (
    <SectionCard
      id="topic-panorama"
      title={scopeFarm ? "关键指标统计" : "关键指标排行"}
      desc={
        scopeFarm
          ? `${scopeFarm.farm} · 近 12 个月`
          : scopeRegion
            ? `${scopeRegion} · 牧场排名`
            : viewMode === "farm"
              ? "全部牧场排名"
              : "区域排名"
      }
      icon={<Layers className="h-4 w-4 text-primary" strokeWidth={1.75} />}
      extra={
        <div className="flex items-center gap-3">
          {!scopeRegion && !scopeFarm && (
            <div className="inline-flex items-center rounded-full border border-border bg-surface-subtle p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("region")}
                className={`h-6 px-3 rounded-full text-caption transition-colors ${
                  viewMode === "region" ? "bg-card text-foreground shadow-sm" : "text-text-tertiary hover:text-foreground"
                }`}
              >
                按区域排行
              </button>
              <button
                type="button"
                onClick={() => setViewMode("farm")}
                className={`h-6 px-3 rounded-full text-caption transition-colors ${
                  viewMode === "farm" ? "bg-card text-foreground shadow-sm" : "text-text-tertiary hover:text-foreground"
                }`}
              >
                按牧场排行
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full border border-border bg-card text-caption text-text-secondary hover:text-foreground"
          >
            <Download className="h-3.5 w-3.5" />
            导出报表
          </button>
        </div>
      }
    >
      <p className="text-body-sm text-text-secondary mb-4">
        {scopeFarm
          ? "本牧场近 12 个月各项关键指标统计"
          : scopeRegion
            ? "该区域下各牧场按死淘、药费、产后淘汰率横向对比"
            : viewMode === "farm"
              ? "集团下所有牧场按死淘、药费、产后淘汰率横向对比"
              : "集团下各区域按死淘、药费、产后淘汰率横向对比"}
      </p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1300px] text-body-sm">
          <thead>
            <tr className="text-caption text-text-tertiary">
              <th className="text-left font-normal py-2 w-12">序号</th>
              {cols.map((c) => (
                <th
                  key={c.key}
                  className={`font-normal py-2 ${c.align === "left" ? "text-left" : "text-right"} ${c.key === "name" || scopeFarm ? "" : "cursor-pointer hover:text-foreground"}`}
                  onClick={c.key === "name" || scopeFarm ? undefined : () => onSort(c.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {c.key === "name" ? (scopeFarm ? "月份" : scopeRegion || viewMode === "farm" ? "牧场名称" : "区域名称") : c.label}
                    {c.key !== "name" && !scopeFarm && <SortIcon active={sort.key === c.key} dir={sort.dir} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.key} className="border-t border-border">
                <td className="py-3">
                  <span
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full text-caption tabular-nums"
                    style={
                      i < 3
                        ? {
                            background: "color-mix(in oklab, var(--state-warning) 16%, transparent)",
                            color: "#A35A00",
                          }
                        : { background: "var(--bg-surface-subtle)", color: "var(--text-tertiary)" }
                    }
                  >
                    {i + 1}
                  </span>
                </td>
                <td className="py-3">
                  <div className="text-foreground">{r.key}</div>
                  <div className="text-caption text-text-tertiary">{r.sub}</div>
                </td>
                <td className="py-3 text-right tabular-nums text-foreground">{r.death} 头</td>
                <td className="py-3 text-right tabular-nums text-foreground">{r.cull} 头</td>
                <td className="py-3 text-right tabular-nums text-foreground">{r.sick}%</td>
                <td className="py-3 text-right tabular-nums text-foreground">{r.cure}%</td>
                <td className="py-3 text-right tabular-nums text-foreground">{r.treatmentDays} 天</td>
                {!scopeFarm && (
                  <>
                    <td className="py-3 text-right tabular-nums text-foreground">￥{wan(r.drugFee)}</td>
                    <td className="py-3 text-right tabular-nums text-foreground">￥{r.perHead} /头</td>
                  </>
                )}
                <td className="py-3 text-right tabular-nums text-foreground">{r.pp30}%</td>
                <td className="py-3 text-right tabular-nums text-foreground">{r.pp60}%</td>
                <td className="py-3 text-right tabular-nums text-foreground">{r.pp90}%</td>
                <td className="py-3 text-right tabular-nums text-foreground">{r.pretermRate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

/* ---------------- 集团视角总装 ---------------- */

export function GroupExecSection({
  scopeRegion,
  scopeFarm,
  part = "all",
}: {
  scopeRegion?: string | null;
  scopeFarm?: { farm: string; region: string } | null;
  part?: "all" | "charts" | "rank";
} = {}) {
  const showCharts = part === "all" || part === "charts";
  const showRank = part === "all" || part === "rank";
  return (
    <div className="space-y-6">
      {showCharts && (scopeFarm ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch [&>*]:h-full">
          <HerdSection />
          <PostpartumRankSection scopeFarm={scopeFarm} />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">
          <PostpartumRankSection scopeRegion={scopeRegion} />
          <DrugTrendSection scopeRegion={scopeRegion} />
        </div>
      ))}
      {showCharts && scopeRegion && !scopeFarm ? (
        <WorkOrderSection farms={GROUP_FARMS.filter((f) => f.region === scopeRegion).map((f) => f.farm)} />
      ) : null}
      {showRank && <PanoramaSection scopeRegion={scopeRegion} scopeFarm={scopeFarm} />}
    </div>
  );
}



/** 集团视角指标卡数据 */
export const groupMetrics = (() => {
  const t = agg("集团合计", "", GROUP_FARMS);
  return {
    herd: t.herd,
    calving: 1186,
    preterm: 47,
    deathCull: t.death + t.cull,
    death: t.death,
    cull: t.cull,
    sick: 812,
    cured: 742,
    days: 4.4,
    drugFee: t.drugFee,
  };
})();


/** 区域高管视角指标卡数据（区域内合计） */
export function regionMetrics(region: string) {
  const list = GROUP_FARMS.filter((f) => f.region === region);
  const t = agg(region, "", list);
  const calving = list.reduce((s, f) => s + f.calving, 0);
  const preterm = list.reduce((s, f) => s + f.preterm, 0);
  return {
    farms: list.length,
    herd: t.herd,
    pretermRate: Number(((preterm / (calving || 1)) * 100).toFixed(1)),
    deathCull: t.death + t.cull,
    sick: t.sick,
    cure: t.cure,
    drugFee: t.drugFee,
    perHead: t.perHead,
    days: t.treatmentDays,
  };
}


/** 牧场级外部视角指标卡数据（本牧场合计） */
export function farmMetrics(farmName: string, region: string) {
  const f = GROUP_FARMS.find((x) => x.farm === farmName && x.region === region) ?? GROUP_FARMS[0];
  return {
    herd: f.herd,
    calving: f.calving,
    pretermRate: Number(((f.preterm / (f.calving || 1)) * 100).toFixed(1)),
    deathCull: f.death + f.cull,
    sick: f.sick,
    cure: f.cure,
    drugFee: f.drugFee,
    perHead: f.perHead,
    days: f.treatmentDays,
  };
}
