import { useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Stethoscope, X } from "lucide-react";

export function parseCowId(cowId: string): { farm: string; yy: number; seq: number } {
  const cleaned = (cowId || "").replace(/^#/, "");
  const parts = cleaned.split("-");
  if (parts.length === 3) {
    return {
      farm: parts[0],
      yy: parseInt(parts[1], 10) || 24,
      seq: parseInt(parts[2], 10) || 0,
    };
  }
  const digits = (cowId || "").replace(/\D/g, "");
  return { farm: "08", yy: 24, seq: parseInt(digits || "0", 10) || 0 };
}

// mock：根据耳号推导牛只基础档案（近一年报病次数、品种、类别等）
export function cowProfileOf(cowId: string) {
  const { yy, seq } = parseCowId(cowId);
  const num = seq;
  const birthYear = 2000 + yy;
  const monthsOld = Math.max(1, (2026 - birthYear) * 12 + (num % 12));
  const ageLabel =
    monthsOld < 2
      ? `${30 * monthsOld} 日龄`
      : monthsOld < 24
        ? `${monthsOld} 月龄`
        : `${(monthsOld / 12).toFixed(1)} 岁`;
  const isCalf = monthsOld < 14;
  const parity = isCalf ? 0 : 1 + (num % 4);
  const lactation = isCalf ? 0 : 15 + (num % 300);
  const pregnancy = isCalf || num % 3 === 0 ? 0 : 20 + (num % 260);

  return {
    reportCount: num % 5,
    breed: num % 4 === 0 ? "西门塔尔" : "荷斯坦",
    category: isCalf ? "犊牛" : pregnancy > 0 ? "妊娠牛" : "泌乳牛",
    ageLabel,
    lactation,
    pregnancy,
    parity,
  };
}

export function CowProfileCard({
  cowId,
  barn,
  onRemove,
}: {
  cowId: string;
  barn: string;
  onRemove?: () => void;
}) {
  const navigate = useNavigate();
  const p = useMemo(() => cowProfileOf(cowId), [cowId]);
  const items = [
    { label: "品种", value: p.breed },
    { label: "类别", value: p.category },
    { label: "月龄", value: p.ageLabel },
    { label: "泌乳天数", value: p.lactation ? `${p.lactation} 天` : "—" },
    { label: "怀孕天数", value: p.pregnancy ? `${p.pregnancy} 天` : "—" },
    { label: "胎次", value: p.parity ? `${p.parity} 胎` : "—" },
  ];
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate({ to: "/m/animals-{$id}", params: { id: cowId } })}
      className="rounded-2xl overflow-hidden shadow-sm border border-[color-mix(in_oklab,var(--brand)_25%,transparent)] active:scale-[0.99] transition-transform cursor-pointer"
    >
      <div className="bg-primary text-primary-foreground pl-4 pr-2 py-3 flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <div className="font-mono text-section font-medium leading-tight truncate">
            {`#${String(cowId).replace(/^#/, "")}`}
          </div>
          <div className="text-caption opacity-85 truncate">{barn}</div>
        </div>
        <span className="shrink-0 inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-primary-foreground/15 text-caption">
          <Stethoscope className="h-3.5 w-3.5" />
          <span>近一年报病</span>
          <span className="tabular-nums font-medium">{p.reportCount}</span>
          <span>次</span>
        </span>
        {onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="h-9 w-9 shrink-0 inline-flex items-center justify-center rounded-full text-primary-foreground/80 active:bg-primary-foreground/15"
            aria-label="删除已选牛只"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="grid grid-cols-3 gap-y-3 p-4 bg-card">
        {items.map((it) => (
          <div key={it.label} className="min-w-0">
            <div className="text-caption text-text-tertiary">{it.label}</div>
            <div className="text-body font-medium text-foreground truncate tabular-nums">
              {it.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
