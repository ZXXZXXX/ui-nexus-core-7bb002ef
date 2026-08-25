import { useState, type ReactNode } from "react";
import { Card } from "@/components/ui/card";

export const PALETTE = [
  "var(--brand)",
  "var(--effect-ai-cyan)",
  "var(--state-warning)",
  "var(--effect-ai-purple)",
  "var(--state-danger)",
  "color-mix(in oklab, var(--brand) 30%, var(--bg-surface-subtle))",
];

export type Slice = { name: string; value: number; color?: string };

export function SectionCard({
  title,
  icon,
  extra,
  children,
  id,
  desc,
}: {
  title: string;
  icon?: ReactNode;
  extra?: ReactNode;
  children: ReactNode;
  id?: string;
  desc?: ReactNode;
}) {
  return (
    <Card id={id} className="border-border bg-card scroll-mt-24 flex flex-col">
      <div className="p-6 pb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {icon}
          <h3 className="truncate text-card-title text-foreground">{title}</h3>
          {desc && typeof desc === "string" && desc.trim() ? <span className="tag tag-muted shrink-0">{desc}</span> : desc}
        </div>
        {extra}
      </div>
      <div className="px-6 pb-6 flex-1">{children}</div>
    </Card>
  );
}

function Tooltip({ x, y, children }: { x: number; y: number; children: ReactNode }) {
  return (
    <div
      className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full rounded-lg border border-border bg-card px-2.5 py-1.5 shadow-card whitespace-nowrap"
      style={{ left: x, top: y - 8 }}
    >
      {children}
    </div>
  );
}

export function Donut({
  data,
  size = 168,
  centerLabel,
  centerValue,
  centerUnit,
  unit = "",
  onSliceClick,
}: {
  data: Slice[];
  size?: number;
  centerLabel?: string;
  centerValue?: string;
  centerUnit?: string;
  unit?: string;
  onSliceClick?: (slice: Slice, index: number) => void;
}) {
  const [hover, setHover] = useState<{ i: number; x: number; y: number } | null>(null);
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = size / 2 - 8;
  const inner = r * 0.62;
  const c = size / 2;
  let acc = 0;
  const arcs = data.map((seg, i) => {
    const start = (acc / total) * Math.PI * 2 - Math.PI / 2;
    acc += seg.value;
    const end = (acc / total) * Math.PI * 2 - Math.PI / 2;
    const large = end - start > Math.PI ? 1 : 0;
    const p = (rad: number, radius: number) => [c + radius * Math.cos(rad), c + radius * Math.sin(rad)];
    const [x1, y1] = p(start, r);
    const [x2, y2] = p(end, r);
    const [xi2, yi2] = p(end, inner);
    const [xi1, yi1] = p(start, inner);
    return {
      d: `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${inner} ${inner} 0 ${large} 0 ${xi1} ${yi1} Z`,
      color: seg.color ?? PALETTE[i % PALETTE.length],
    };
  });
  const hovered = hover ? data[hover.i] : null;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {arcs.map((a, i) => (
          <path
            key={i}
            d={a.d}
            fill={a.color}
            stroke="var(--bg-surface)"
            strokeWidth="1.5"
            onClick={onSliceClick ? () => onSliceClick(data[i]!, i) : undefined}
            onMouseMove={(e) => {
              const box = e.currentTarget.ownerSVGElement!.getBoundingClientRect();
              setHover({ i, x: e.clientX - box.left, y: e.clientY - box.top });
            }}
            onMouseLeave={() => setHover(null)}
            className={`transition-opacity hover:opacity-80 ${onSliceClick ? "cursor-pointer" : ""}`}
          />
        ))}
      </svg>
      {(centerValue || centerLabel) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {centerLabel && <span className="text-caption text-text-tertiary">{centerLabel}</span>}
          {centerValue && (
            <span className="text-section-title tabular-nums text-foreground">{centerValue}</span>
          )}
          {centerUnit && <span className="text-caption text-text-tertiary">{centerUnit}</span>}
        </div>
      )}
      {hover && hovered && (
        <Tooltip x={hover.x} y={hover.y}>
          <div className="text-caption text-foreground">{hovered.name}</div>
          <div className="text-caption text-text-secondary tabular-nums">
            {hovered.value.toLocaleString()}
            {unit} · {((hovered.value / total) * 100).toFixed(1)}%
          </div>
        </Tooltip>
      )}
    </div>
  );
}

export function Legend({ data }: { data: Slice[]; unit?: string }) {
  return (
    <div className="w-full flex flex-wrap justify-center gap-x-4 gap-y-1.5">
      {data.map((s, i) => (
        <span key={s.name} className="inline-flex items-center gap-1.5">
          <span
            className="h-2 w-2 rounded-sm shrink-0"
            style={{ background: s.color ?? PALETTE[i % PALETTE.length] }}
          />
          <span className="text-caption text-foreground">{s.name}</span>
        </span>
      ))}
    </div>
  );
}

export function StackedBar({
  data,
  unit = "",
  height = 28,
}: {
  data: Slice[];
  unit?: string;
  height?: number;
}) {
  const [hover, setHover] = useState<{ i: number; x: number; y: number } | null>(null);
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const hovered = hover ? data[hover.i] : null;
  return (
    <div className="w-full">
      <div className="relative">
        <div
          className="w-full flex overflow-hidden rounded-lg border border-border"
          style={{ height }}
        >
          {data.map((d, i) => {
            const pct = (d.value / total) * 100;
            return (
              <div
                key={d.name}
                className="h-full flex items-center justify-center overflow-hidden transition-opacity hover:opacity-85"
                style={{
                  width: `${pct}%`,
                  background: d.color ?? PALETTE[i % PALETTE.length],
                }}
                onMouseMove={(e) => {
                  const box = e.currentTarget.parentElement!.getBoundingClientRect();
                  setHover({ i, x: e.clientX - box.left, y: e.clientY - box.top });
                }}
                onMouseLeave={() => setHover(null)}
              />
            );
          })}
        </div>
        {hover && hovered && (
          <Tooltip x={hover.x} y={hover.y}>
            <div className="text-caption text-foreground">{hovered.name}</div>
            <div className="text-caption text-text-secondary tabular-nums">
              {hovered.value.toLocaleString()}
              {unit} · {((hovered.value / total) * 100).toFixed(1)}%
            </div>
          </Tooltip>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {data.map((d, i) => (
          <span key={d.name} className="inline-flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-sm shrink-0"
              style={{ background: d.color ?? PALETTE[i % PALETTE.length] }}
            />
            <span className="text-caption text-foreground">{d.name}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function BarList({
  data,
  unit = "",
  max,
}: {
  data: Slice[];
  unit?: string;
  max?: number;
}) {
  const top = max ?? Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-2.5">
      {data.map((d, i) => (
        <div key={d.name} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-body-sm text-foreground truncate">{d.name}</span>
              <span className="text-body-sm text-text-secondary tabular-nums shrink-0">
                {d.value.toLocaleString()}
                {unit}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 rounded-full bg-surface-subtle overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(d.value / top) * 100}%`,
                  background: d.color ?? PALETTE[i % PALETTE.length],
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export type Series = { name: string; color: string; points: number[]; dashed?: boolean };

export function LineTrend({
  labels,
  series,
  height = 180,
  unit = "",
  activeIndex,
  onPointClick,
  formatValue,
}: {
  labels: string[];
  series: Series[];
  height?: number;
  unit?: string;
  activeIndex?: number;
  onPointClick?: (index: number) => void;
  formatValue?: (value: number, series: Series, index: number) => string;
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const w = 640;
  const h = height;
  const padL = 42;
  const padR = 28;
  const padB = 30;
  const padT = 10;
  const maxV = Math.max(...series.flatMap((s) => s.points), 1);
  const nice = maxV <= 5 ? Math.max(Math.ceil(maxV * 1.2 * 10) / 10, 0.5) : Math.ceil(maxV / 5) * 5;
  const x = (i: number) => padL + (i * (w - padL - padR)) / Math.max(labels.length - 1, 1);
  const y = (v: number) => padT + (1 - v / nice) * (h - padT - padB);
  const fmt = (v: number, s: Series, i: number) =>
    formatValue ? formatValue(v, s, i) : `${Number.isInteger(v) ? v : v.toFixed(1)}${unit}`;
  return (
    <div className="w-full relative" onMouseLeave={() => setHoverIndex(null)}>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }}>
        <defs>
          <linearGradient id="trend-active-col" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.02" />
            <stop offset="100%" stopColor="var(--brand)" stopOpacity="0.16" />
          </linearGradient>
        </defs>
        {activeIndex != null && activeIndex >= 0 && (() => {
          const step = (w - padL - padR) / Math.max(labels.length - 1, 1);
          // keep every highlight column the same width: use the narrowest one (edge points)
          const cw = labels.reduce(
            (m, _l, i) => Math.min(m, step, (w - x(i)) * 2, x(i) * 2),
            step,
          );
          return (
            <rect
              x={x(activeIndex) - cw / 2}
              y={padT}
              width={cw}
              height={h - padT}
              fill="url(#trend-active-col)"
            />
          );
        })()}



        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <g key={t}>
            <line
              x1={padL}
              x2={w - padR}
              y1={padT + t * (h - padT - padB)}
              y2={padT + t * (h - padT - padB)}
              stroke="var(--border)"
              strokeDasharray="3 4"
            />
            <text
              x={4}
              y={padT + t * (h - padT - padB) + 5}
              className="tabular-nums"
              fill="var(--text-tertiary)"
              fontSize="13"
            >
              {nice <= 5 ? (nice * (1 - t)).toFixed(1) : Math.round(nice * (1 - t))}
            </text>
          </g>
        ))}
        {series.map((s) => (
          <g key={s.name}>
            <polyline
              fill="none"
              stroke={s.color}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeDasharray={s.dashed ? "6 5" : undefined}
              points={s.points.map((p, i) => `${x(i)},${y(p)}`).join(" ")}
            />
            {s.points.map((p, i) => (
              <circle
                key={i}
                cx={x(i)}
                cy={y(p)}
                r={activeIndex === i ? 5 : 3}
                fill={activeIndex === i ? s.color : "var(--bg-surface)"}
                stroke={s.color}
                strokeWidth="2"
              />
            ))}
          </g>
        ))}
        {labels.map((l, i) => (
          <g
            key={`hit-${l}-${i}`}
            onClick={onPointClick ? () => onPointClick(i) : undefined}
            onMouseEnter={() => setHoverIndex(i)}
            className={onPointClick ? "cursor-pointer" : undefined}
          >
            {(activeIndex === i || hoverIndex === i) && (
              <line
                x1={x(i)}
                x2={x(i)}
                y1={padT}
                y2={h - padB}
                stroke="var(--brand)"
                strokeDasharray="3 4"
                opacity="0.5"
              />
            )}
            <rect
              x={x(i) - (w - padL - padR) / Math.max(labels.length - 1, 1) / 2}
              y={padT}
              width={(w - padL - padR) / Math.max(labels.length - 1, 1)}
              height={h - padT - padB}
              fill="transparent"
            />
          </g>
        ))}
        {labels.map((l, i) => (
          <text
            key={l}
            x={x(i)}
            y={h - 8}
            textAnchor="middle"
            fill={activeIndex === i ? "var(--brand)" : "var(--text-tertiary)"}
            fontSize={activeIndex === i ? 14 : 13}
            fontWeight={activeIndex === i ? 600 : 400}
          >
            {l}
          </text>
        ))}

      </svg>
      {hoverIndex != null && (
        <div
          className="pointer-events-none absolute z-20 -translate-y-1/2 rounded-lg border border-border bg-popover px-3 py-2 shadow-lg"
          style={{
            left: `calc(${(x(hoverIndex) / w) * 100}% ${hoverIndex > labels.length / 2 ? "- 8px" : "+ 8px"})`,
            transform: `translate(${hoverIndex > labels.length / 2 ? "-100%" : "0"}, -50%)`,
            top: "50%",
          }}
        >
          <div className="text-caption text-text-tertiary mb-1">{labels[hoverIndex]}</div>
          <div className="space-y-1">
            {series.map((s) => (
              <div key={s.name} className="flex items-center gap-2 whitespace-nowrap">
                <span
                  className="h-1.5 w-4 rounded-full shrink-0"
                  style={
                    s.dashed
                      ? { backgroundImage: `repeating-linear-gradient(90deg, ${s.color} 0 5px, transparent 5px 9px)` }
                      : { background: s.color }
                  }
                />
                <span className="text-body-sm text-text-secondary">{s.name}</span>
                <span className="text-body-sm text-foreground tabular-nums ml-auto">
                  {fmt(s.points[hoverIndex] ?? 0, s, hoverIndex)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-4">
        {series.map((s) => (
          <span key={s.name} className="inline-flex items-center gap-1.5 text-body-sm text-text-secondary">
            <span
              className="h-1.5 w-4 rounded-full"
              style={s.dashed ? { backgroundImage: `repeating-linear-gradient(90deg, ${s.color} 0 5px, transparent 5px 9px)` } : { background: s.color }}
            />
            {s.name}
            {unit && <span className="text-text-tertiary">（{unit}）</span>}
          </span>
        ))}
      </div>
    </div>
  );
}

export function MiniStat({
  label,
  value,
  unit,
  tone,
}: {
  label: string;
  value: string;
  unit?: string;
  tone?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-subtle px-4 py-3">
      <div className="text-caption text-text-tertiary truncate">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span
          className="text-section-title tabular-nums font-medium"
          style={{ color: tone ?? "var(--text-primary)" }}
        >
          {value}
        </span>
        {unit && <span className="text-caption text-text-tertiary">{unit}</span>}
      </div>
    </div>
  );
}

export function PeriodTabs({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="inline-flex items-center rounded-full border border-border bg-surface-subtle p-0.5 shrink-0">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={`h-7 px-3 rounded-full text-caption transition-colors ${
            value === o ? "bg-card text-primary shadow-card" : "text-text-secondary"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

export function ColumnChart({
  data,
  unit = "",
  height = 168,
}: {
  data: Slice[];
  unit?: string;
  height?: number;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="w-full">
      <div className="flex items-end gap-3" style={{ height }}>
        {data.map((d, i) => (
          <div key={d.name} className="flex-1 min-w-0 flex flex-col items-center justify-end gap-2">
            <span className="text-body-sm tabular-nums text-foreground">
              {d.value.toLocaleString()}
              {unit}
            </span>
            <div
              className="w-full max-w-[56px] rounded-t-md transition-all"
              style={{
                height: `${Math.max((d.value / max) * (height - 44), 4)}px`,
                background: d.color ?? PALETTE[i % PALETTE.length],
              }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-3 border-t border-border pt-2">
        {data.map((d) => (
          <span key={d.name} className="flex-1 min-w-0 text-center text-caption text-text-secondary truncate">
            {d.name}
          </span>
        ))}
      </div>
    </div>
  );
}

export function GaugeArc({
  value,
  label,
  sub,
  size = 180,
  color = "var(--brand)",
}: {
  value: number; // 0-100
  label: string;
  sub?: string;
  size?: number;
  color?: string;
}) {
  const r = size / 2 - 12;
  const c = size / 2;
  const start = Math.PI * 0.85;
  const end = Math.PI * 2.15;
  const p = (rad: number) => `${c + r * Math.cos(rad)} ${c + r * Math.sin(rad)}`;
  const at = start + ((end - start) * Math.min(Math.max(value, 0), 100)) / 100;
  const arc = (a: number, b: number) =>
    `M ${p(a)} A ${r} ${r} 0 ${b - a > Math.PI ? 1 : 0} 1 ${p(b)}`;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size * 0.78 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0">
        <path d={arc(start, end)} fill="none" stroke="var(--bg-surface-subtle)" strokeWidth="14" strokeLinecap="round" />
        <path d={arc(start, at)} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round" />
      </svg>
      <div className="absolute inset-x-0 top-[34%] flex flex-col items-center">
        <span className="text-page-title tabular-nums text-foreground">{value.toFixed(1)}%</span>
        <span className="text-caption text-text-tertiary mt-0.5">{label}</span>
        {sub && <span className="text-caption text-text-tertiary">{sub}</span>}
      </div>
    </div>
  );
}
