import { useState } from "react";
import { Crosshair, ClipboardCheck } from "lucide-react";
import { SectionCard, MiniStat, BarList, PeriodTabs } from "./charts";

/* ---------------- 数据（牧场为最小口径，区域由牧场汇总） ---------------- */

type FarmRow = {
  farm: string;
  region: string;
  herd: number;
  death: number;
  cull: number;
  /** 产后 0-30 / 0-60 / 0-90 天淘汰率 % */
  pp30: number;
  pp60: number;
  pp90: number;
  sick: number; // 发病率 %
  cure: number; // 治愈率 %
  preterm: number; // 早产率 %
  days: number; // 平均诊疗天数
  drugFee: number; // 总药费（元）
  woDone: number; // 工单完工率 %
};

const FARMS: FarmRow[] = [
  { farm: "1 号牧场", region: "东北大区", herd: 4060, death: 18, cull: 27, pp30: 2.6, pp60: 4.1, pp90: 5.4, sick: 9.0, cure: 92.3, preterm: 3.1, days: 4.2, drugFee: 172_960, woDone: 96.4 },
  { farm: "2 号牧场", region: "东北大区", herd: 2252, death: 12, cull: 19, pp30: 3.2, pp60: 5.0, pp90: 6.6, sick: 10.4, cure: 89.1, preterm: 4.0, days: 4.9, drugFee: 108_400, woDone: 91.2 },
  { farm: "3 号牧场", region: "华北大区", herd: 3182, death: 21, cull: 30, pp30: 3.8, pp60: 5.6, pp90: 7.2, sick: 11.2, cure: 87.6, preterm: 4.6, days: 5.3, drugFee: 158_100, woDone: 88.5 },
  { farm: "4 号牧场", region: "华北大区", herd: 1980, death: 9, cull: 14, pp30: 2.1, pp60: 3.4, pp90: 4.5, sick: 8.2, cure: 93.5, preterm: 2.7, days: 3.8, drugFee: 79_200, woDone: 97.1 },
  { farm: "5 号牧场", region: "华东大区", herd: 1610, death: 11, cull: 16, pp30: 3.0, pp60: 4.5, pp90: 6.0, sick: 9.8, cure: 90.2, preterm: 3.5, days: 4.5, drugFee: 72_450, woDone: 93.0 },
  { farm: "6 号牧场", region: "华东大区", herd: 1290, death: 7, cull: 10, pp30: 2.4, pp60: 3.8, pp90: 5.1, sick: 8.6, cure: 91.4, preterm: 3.0, days: 4.0, drugFee: 54_180, woDone: 94.6 },
];

type Agg = {
  key: string;
  herd: number;
  death: number;
  cull: number;
  pp30: number;
  pp60: number;
  pp90: number;
  sick: number;
  cure: number;
  preterm: number;
  days: number;
  drugFee: number;
  woDone: number;
};

/** 按牛群规模加权汇总比率类指标 */
function aggregate(key: string, rows: FarmRow[]): Agg {
  const herd = rows.reduce((s, r) => s + r.herd, 0) || 1;
  const w = (pick: (r: FarmRow) => number) =>
    Number((rows.reduce((s, r) => s + pick(r) * r.herd, 0) / herd).toFixed(1));
  return {
    key,
    herd,
    death: rows.reduce((s, r) => s + r.death, 0),
    cull: rows.reduce((s, r) => s + r.cull, 0),
    pp30: w((r) => r.pp30),
    pp60: w((r) => r.pp60),
    pp90: w((r) => r.pp90),
    sick: w((r) => r.sick),
    cure: w((r) => r.cure),
    preterm: w((r) => r.preterm),
    days: w((r) => r.days),
    drugFee: rows.reduce((s, r) => s + r.drugFee, 0),
    woDone: w((r) => r.woDone),
  };
}

const yuan = (n: number) => `${(n / 10000).toFixed(1)} 万`;

/* ---------------- 组件 ---------------- */

export function ExecFocusSection({ level }: { level: "farm" | "region" | "group" }) {
  const isGroup = level === "group";
  const isFarm = level === "farm";
  const singleFarm = FARMS[0];

  if (isFarm) {
    const perHead = singleFarm.drugFee / singleFarm.herd;
    return (
      <SectionCard
        id="topic-exec"
        title="牧场关键指标"
        desc="外部视角 · 1 号牧场"
        icon={<Crosshair className="h-4 w-4 text-primary" strokeWidth={1.75} />}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MiniStat label="（本月）死亡数" value={String(singleFarm.death)} unit="头" tone="var(--state-danger)" />
          <MiniStat label="（本月）淘汰数" value={String(singleFarm.cull)} unit="头" tone="var(--state-warning)" />
          <MiniStat label="发病率" value={`${singleFarm.sick}`} unit="%" tone="var(--state-danger)" />
          <MiniStat label="治愈率" value={`${singleFarm.cure}`} unit="%" tone="var(--brand)" />
          <MiniStat label="早产率" value={`${singleFarm.preterm}`} unit="%" tone="var(--state-warning)" />
          <MiniStat label="平均诊疗天数" value={`${singleFarm.days}`} unit="天" tone="var(--effect-ai-cyan)" />
          <MiniStat label="（本月）总药费" value={yuan(singleFarm.drugFee)} unit="元" tone="var(--effect-ai-purple)" />
          <MiniStat label="单头牛药费" value={perHead.toFixed(1)} unit="元/头" tone="var(--effect-ai-purple)" />
        </div>

        <div className="mt-6">
          <p className="text-body-sm text-text-secondary mb-3">产后淘汰率</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[360px] text-body-sm">
              <thead>
                <tr className="text-caption text-text-tertiary">
                  <th className="text-left font-normal py-2">牧场</th>
                  <th className="text-right font-normal py-2">产后 0-30 天</th>
                  <th className="text-right font-normal py-2">产后 0-60 天</th>
                  <th className="text-right font-normal py-2">产后 0-90 天</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border">
                  <td className="py-2.5 text-foreground">{singleFarm.farm}</td>
                  <td className="py-2.5 text-right tabular-nums text-text-secondary">{singleFarm.pp30} %</td>
                  <td className="py-2.5 text-right tabular-nums text-text-secondary">{singleFarm.pp60} %</td>
                  <td className="py-2.5 text-right tabular-nums text-foreground">{singleFarm.pp90} %</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </SectionCard>
    );
  }

  const scopeRows = isGroup ? FARMS : FARMS.filter((f) => f.region === "东北大区");
  const dims = isGroup ? ["区域维度", "牧场维度"] : ["牧场维度"];
  const [dim, setDim] = useState(dims[0]);

  const byRegion = Array.from(new Set(scopeRows.map((r) => r.region))).map((rg) =>
    aggregate(rg, scopeRows.filter((r) => r.region === rg)),
  );
  const byFarm = scopeRows.map((r) => aggregate(r.farm, [r]));
  const rows = dim === "区域维度" ? byRegion : byFarm;
  const total = aggregate(isGroup ? "集团合计" : "东北大区合计", scopeRows);
  const perHead = total.drugFee / total.herd;

  return (
    <div className="space-y-6">
      {/* 关键指标 */}
      <SectionCard
        id="topic-exec"
        title={isGroup ? "集团关键指标" : "区域关键指标"}
        desc={dim}
        icon={<Crosshair className="h-4 w-4 text-primary" strokeWidth={1.75} />}
        extra={dims.length > 1 ? <PeriodTabs value={dim} onChange={setDim} options={dims} /> : undefined}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MiniStat label="（本月）死亡数" value={String(total.death)} unit="头" tone="var(--state-danger)" />
          <MiniStat label="（本月）淘汰数" value={String(total.cull)} unit="头" tone="var(--state-warning)" />
          <MiniStat label="发病率" value={`${total.sick}`} unit="%" tone="var(--state-danger)" />
          <MiniStat label="治愈率" value={`${total.cure}`} unit="%" tone="var(--brand)" />
          <MiniStat label="早产率" value={`${total.preterm}`} unit="%" tone="var(--state-warning)" />
          <MiniStat label="平均诊疗天数" value={`${total.days}`} unit="天" tone="var(--effect-ai-cyan)" />
          <MiniStat label="（本月）总药费" value={yuan(total.drugFee)} unit="元" tone="var(--effect-ai-purple)" />
          <MiniStat label="单头牛药费" value={perHead.toFixed(1)} unit="元/头" tone="var(--effect-ai-purple)" />
        </div>

        {/* 产后淘汰率 */}
        <div className="mt-6">
          <p className="text-body-sm text-text-secondary mb-3">产后淘汰率（按{dim === "区域维度" ? "区域" : "牧场"}）</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-body-sm">
              <thead>
                <tr className="text-caption text-text-tertiary">
                  <th className="text-left font-normal py-2">{dim === "区域维度" ? "区域" : "牧场"}</th>
                  <th className="text-right font-normal py-2">产后 0-30 天</th>
                  <th className="text-right font-normal py-2">产后 0-60 天</th>
                  <th className="text-right font-normal py-2">产后 0-90 天</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.key} className="border-t border-border">
                    <td className="py-2.5 text-foreground">{r.key}</td>
                    <td className="py-2.5 text-right tabular-nums text-text-secondary">{r.pp30} %</td>
                    <td className="py-2.5 text-right tabular-nums text-text-secondary">{r.pp60} %</td>
                    <td className="py-2.5 text-right tabular-nums text-foreground">{r.pp90} %</td>
                  </tr>
                ))}
                <tr className="border-t border-border bg-surface-subtle">
                  <td className="py-2.5 text-foreground font-medium">{total.key}</td>
                  <td className="py-2.5 text-right tabular-nums font-medium">{total.pp30} %</td>
                  <td className="py-2.5 text-right tabular-nums font-medium">{total.pp60} %</td>
                  <td className="py-2.5 text-right tabular-nums font-medium">{total.pp90} %</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 明细 */}
        <div className="mt-6">
          <p className="text-body-sm text-text-secondary mb-3">关键指标明细（{dim}）</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-body-sm">
              <thead>
                <tr className="text-caption text-text-tertiary">
                  <th className="text-left font-normal py-2">{dim === "区域维度" ? "区域" : "牧场"}</th>
                  <th className="text-right font-normal py-2">死亡数</th>
                  <th className="text-right font-normal py-2">淘汰数</th>
                  <th className="text-right font-normal py-2">发病率</th>
                  <th className="text-right font-normal py-2">治愈率</th>
                  <th className="text-right font-normal py-2">早产率</th>
                  <th className="text-right font-normal py-2">平均诊疗天数</th>
                  <th className="text-right font-normal py-2">总药费</th>
                  <th className="text-right font-normal py-2">单头牛药费</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.key} className="border-t border-border">
                    <td className="py-2.5 text-foreground">{r.key}</td>
                    <td className="py-2.5 text-right tabular-nums text-text-secondary">{r.death}</td>
                    <td className="py-2.5 text-right tabular-nums text-text-secondary">{r.cull}</td>
                    <td className="py-2.5 text-right tabular-nums text-text-secondary">{r.sick} %</td>
                    <td className="py-2.5 text-right tabular-nums text-text-secondary">{r.cure} %</td>
                    <td className="py-2.5 text-right tabular-nums text-text-secondary">{r.preterm} %</td>
                    <td className="py-2.5 text-right tabular-nums text-text-secondary">{r.days}</td>
                    <td className="py-2.5 text-right tabular-nums text-text-secondary">{yuan(r.drugFee)}</td>
                    <td className="py-2.5 text-right tabular-nums text-foreground">
                      {(r.drugFee / r.herd).toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </SectionCard>

      {/* 区域视角专属：各牧场工单完工率 */}
      {!isGroup && (
        <SectionCard
          title="区域内各牧场工单完工率"
          desc="本月"
          icon={<ClipboardCheck className="h-4 w-4 text-primary" strokeWidth={1.75} />}
        >
          <BarList
            data={[...scopeRows]
              .map((r) => ({ name: r.farm, value: r.woDone }))
              .sort((a, b) => b.value - a.value)}
            unit=" %"
            max={100}
          />
          <p className="mt-4 text-caption text-text-tertiary">
            区域平均完工率 {total.woDone} % · 统计口径：本月已完工工单 / 本月应完工工单
          </p>
        </SectionCard>
      )}
    </div>
  );
}
