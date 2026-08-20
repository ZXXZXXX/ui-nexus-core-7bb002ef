import { useId } from "react";

export type StatVisualVariant = "bars" | "ring" | "spark" | "clock" | "truck";

export function StatVisual({ variant, tone }: { variant: StatVisualVariant; tone: string }) {
  if (variant === "bars") {
    return (
      <div className="absolute right-3 bottom-3 flex items-end gap-1.5" style={{ color: tone }}>
        <span className="block w-[5px] rounded-full bg-current" style={{ height: 10, opacity: 0.5 }} />
        <span className="block w-[5px] rounded-full bg-current" style={{ height: 16, opacity: 0.55 }} />
        <span className="block w-[5px] rounded-full bg-current" style={{ height: 22, opacity: 0.6 }} />
        <span className="block w-[5px] rounded-full bg-current" style={{ height: 28, opacity: 0.7 }} />
      </div>
    );
  }
  if (variant === "ring") {
    const r = 16;
    const c = 2 * Math.PI * r;
    return (
      <svg className="absolute right-2.5 bottom-2.5" width="42" height="42" viewBox="0 0 42 42">
        <circle cx="21" cy="21" r={r} fill="none" stroke={tone} strokeOpacity="0.2" strokeWidth="3" />
        <circle
          cx="21"
          cy="21"
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${c * 0.75} ${c}`}
          transform="rotate(-90 21 21)"
        />
        <path
          d="M15 21.5 L19 25.5 L27 17"
          fill="none"
          stroke={tone}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (variant === "spark") {
    const line = "M4 30 C 12 30, 16 18, 24 18 S 36 32, 44 28 S 58 6, 78 6";
    const area = `${line} L 78 40 L 4 40 Z`;
    const gid = `spark-grad-${useId()}`;
    return (
      <svg className="absolute right-2 bottom-2" width="82" height="42" viewBox="0 0 82 42" fill="none">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={tone} stopOpacity="0.22" />
            <stop offset="100%" stopColor={tone} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${gid})`} />
        <path d={line} stroke={tone} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    );
  }
  if (variant === "truck") {
    return (
      <svg className="absolute right-2 bottom-2" width="60" height="42" viewBox="0 0 60 42" fill="none">
        <rect x="4" y="10" width="30" height="20" rx="2" stroke={tone} strokeWidth="2.2" fill={tone} fillOpacity="0.12" />
        <path d="M34 16 L46 16 L54 24 L54 30 L34 30 Z" stroke={tone} strokeWidth="2.2" strokeLinejoin="round" fill={tone} fillOpacity="0.12" />
        <path d="M37 18 L45 18 L50.5 23.5 L37 23.5 Z" fill={tone} fillOpacity="0.28" />
        <circle cx="14" cy="32" r="3.4" fill="#fff" stroke={tone} strokeWidth="2.2" />
        <circle cx="44" cy="32" r="3.4" fill="#fff" stroke={tone} strokeWidth="2.2" />
      </svg>
    );
  }
  // clock
  const cx = 22, cy = 22, r = 15;
  const dots = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle), i };
  });
  return (
    <svg className="absolute right-2.5 bottom-2.5" width="44" height="44" viewBox="0 0 44 44" fill="none">
      {dots.map((d) =>
        (d.i >= 6 && d.i <= 11) || d.i === 0 ? (
          <circle key={d.i} cx={d.x} cy={d.y} r="1.2" fill={tone} fillOpacity="0.35" />
        ) : null
      )}
      <path d="M22 7 A15 15 0 0 1 32.6 32.6" stroke={tone} strokeWidth="2.6" strokeLinecap="round" fill="none" />
      <path d="M22 22 L29 27" stroke={tone} strokeWidth="2.6" strokeLinecap="round" fill="none" />
      <path d="M22 22 L22 12" stroke={tone} strokeWidth="2.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}
