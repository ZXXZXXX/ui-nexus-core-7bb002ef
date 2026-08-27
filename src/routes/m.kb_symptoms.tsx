import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Activity, Search, TrendingUp, ChevronRight, X } from "lucide-react";
import { MobileShell } from "@/components/mobile-shell";
import { useFarm } from "@/lib/farm-store";
import { KB_SYMPTOMS, diseaseName, recent7d } from "@/lib/disease-kb";


export const Route = createFileRoute("/m/kb_symptoms")({
  head: () => ({ meta: [{ title: "症状库 · 奇点智牧" }] }),
  component: SymptomKBMobile,
});

type Symptom = {
  id: string;
  name: string;
  urgency: "高" | "中" | "低";
  desc: string;
  related: string[]; // 常见于
  recent7d: number; // 近 7 天出现头次
};

const SYMPTOMS: Symptom[] = KB_SYMPTOMS.map((s) => ({
  id: s.id,
  name: s.name,
  urgency: s.diseases.length >= 8 ? "高" : s.diseases.length >= 3 ? "中" : "低",
  desc: s.desc,
  related: s.diseases.map(diseaseName),
  recent7d: recent7d(s.id),
}));

function urgencyTone(u: string) {
  if (u === "高") return "bg-[var(--state-danger)]/12 text-[var(--state-danger)]";
  if (u === "中") return "bg-[var(--state-warning)]/20 text-[var(--state-alert)]";
  return "bg-[var(--state-info)]/12 text-[var(--state-info)]";
}

function SymptomKBMobile() {
  const farm = useFarm();
  const [kw, setKw] = useState("");
  const [active, setActive] = useState<Symptom | null>(null);

  const top = useMemo(() => [...SYMPTOMS].sort((a, b) => b.recent7d - a.recent7d).slice(0, 5), []);
  const list = useMemo(() => {
    const k = kw.trim();
    if (!k) return SYMPTOMS;
    return SYMPTOMS.filter(
      (s) =>
        s.name.includes(k) ||
        s.desc.includes(k) ||
        s.related.some((r) => r.includes(k))
    );
  }, [kw]);

  return (
    <MobileShell title="症状库" back hideTabBar>
      <div className="px-4 pt-3 pb-4 space-y-4">
        {/* 搜索 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" />
          <input
            value={kw}
            onChange={(e) => setKw(e.target.value)}
            placeholder="搜索症状 / 描述 / 关联疾病"
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-card border border-border text-body-sm placeholder:text-text-tertiary focus:outline-none focus:border-primary"
          />
        </div>

        {/* 近 7 天 TOP */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              <h3 className="text-card-title text-foreground">近 7 天高发症状</h3>
            </div>
            <span className="text-caption text-text-tertiary">{farm.name}</span>
          </div>
          <div className="rounded-2xl bg-card border border-border divide-y divide-border overflow-hidden">
            {top.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setActive(s)}
                className="w-full flex items-center gap-3 px-4 py-3 active:bg-surface-subtle text-left"
              >
                <span
                  className={`h-6 w-6 rounded-md inline-flex items-center justify-center text-[12px] font-semibold tabular-nums ${
                    i === 0
                      ? "bg-[var(--state-danger)]/12 text-[var(--state-danger)]"
                      : i === 1
                      ? "bg-[var(--state-warning)]/25 text-[var(--state-alert)]"
                      : i === 2
                      ? "bg-brand-subtle text-primary"
                      : "bg-surface-subtle text-text-secondary"
                  }`}
                >
                  {i + 1}
                </span>
                <span className="flex-1 text-body text-foreground truncate">{s.name}</span>
                <ChevronRight className="h-3.5 w-3.5 text-text-tertiary" />
              </button>

            ))}
          </div>
        </section>

        {/* 全部症状 */}
        <section>
          <h3 className="text-card-title text-foreground mb-2">全部症状 · {list.length}</h3>
          <div className="space-y-2">
            {list.map((s) => (
              <button
                key={s.id}
                onClick={() => setActive(s)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border active:bg-surface-subtle text-left"
              >
                <span className="h-9 w-9 rounded-lg bg-brand-subtle text-primary inline-flex items-center justify-center shrink-0">
                  <Activity className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-body text-foreground truncate">{s.name}</span>
                  </div>
                  <div className="text-caption text-text-tertiary mt-0.5 line-clamp-1">{s.desc}</div>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-text-tertiary shrink-0" />
              </button>
            ))}
            {list.length === 0 && (
              <div className="text-center text-caption text-text-tertiary py-8">未找到匹配的症状</div>
            )}
          </div>
        </section>
      </div>

      {active && <SymptomDetailSheet item={active} onClose={() => setActive(null)} />}
    </MobileShell>
  );
}

function SymptomDetailSheet({ item, onClose }: { item: Symptom; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center" onClick={onClose}>
      <div
        className="w-full max-w-[440px] bg-card rounded-t-2xl p-4 pb-[calc(env(safe-area-inset-bottom)+16px)] h-[75vh] max-h-[75vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="h-10 w-10 rounded-xl bg-brand-subtle text-primary inline-flex items-center justify-center shrink-0">
              <Activity className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <div className="text-card-title text-foreground truncate">{item.name}</div>
              <div className="text-caption text-text-tertiary font-mono">{item.id}</div>
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-md text-text-tertiary active:bg-surface-subtle inline-flex items-center justify-center">
            <X className="h-4 w-4" />
          </button>
        </div>

        <Section label="具体描述">

          <p className="text-body-sm text-text-secondary leading-relaxed">{item.desc}</p>
        </Section>

        <Section label="常见于">
          <div className="flex flex-wrap gap-1.5">
            {item.related.map((r) => (
              <span key={r} className="text-body-sm px-2 py-1 rounded-md bg-surface-subtle text-text-secondary">
                {r}
              </span>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <div className="text-caption text-text-tertiary mb-1.5">{label}</div>
      {children}
    </div>
  );
}
