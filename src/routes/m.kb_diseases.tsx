import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Stethoscope, Search, TrendingUp, ChevronRight, X, FileText } from "lucide-react";
import { MobileShell } from "@/components/mobile-shell";
import { useFarm } from "@/lib/farm-store";
import { PRESCRIPTION_SEED } from "@/lib/prescription-kb";
import { KB_DISEASES, symptomName, severityOf, recent7d } from "@/lib/disease-kb";


export const Route = createFileRoute("/m/kb_diseases")({
  head: () => ({ meta: [{ title: "疾病库 · 奇点智牧" }] }),
  component: DiseaseKBMobile,
});

type Prescription = {
  name: string;
  /** 首选 / 备选 / 应急 */
  tier: "首选" | "备选" | "应急";
  /** 适用场景：病情阶段、严重程度、特殊群体等 */
  scenario: string;
  /** 疗程概述 */
  course: string;
  /** 用药组成 */
  drugs: { name: string; usage: string }[];
  /** 注意事项（可选） */
  notes?: string;
};

type Disease = {
  id: string;
  name: string;
  cat: string;
  severity: "高" | "中" | "低";
  desc: string;
  groups: string[];
  symptoms: string[];
  prescriptions: Prescription[];
  recent7d: number; // 近7天发病头数
};

const DISEASES: Disease[] = KB_DISEASES.map((d) => ({
  id: d.id,
  name: d.name,
  cat: d.catName,
  severity: severityOf(d),
  desc: `${d.type} · 常见症状 ${d.symptoms.length} 项，详见下方症状列表。`,
  groups: d.groups,
  symptoms: d.symptoms.map(symptomName),
  prescriptions: (d.rx ?? []).flatMap((code, idx) => {
    const r = PRESCRIPTION_SEED.find((x) => x.code === code);
    if (!r) return [];
    return [{
      name: r.name,
      tier: (idx === 0 ? "首选" : "备选") as Prescription["tier"],
      scenario: r.intro || r.desc || `${r.category}${r.subType ? " · " + r.subType : ""}`,
      course: `${r.category}${r.subType ? " · " + r.subType : ""} · 疗程 ${r.duration} 天`,
      drugs: r.drugs.map((g) => ({
        name: g.drugs.map((x) => x.name).join(" / "),
        usage: [g.fixedDose, g.routes.join("、"), `${g.freq.m}天${g.freq.n}次`, `连用${g.days}天`]
          .filter(Boolean)
          .join("，"),
      })),
      notes: r.review?.on ? `复查：${r.review.desc || `连续 ${r.review.days} 天`}` : undefined,
    }];
  }),
  recent7d: recent7d(d.id),
}));

function severityTone(s: string) {
  if (s === "高") return "bg-[var(--state-danger)]/12 text-[var(--state-danger)]";
  if (s === "中") return "bg-[var(--state-warning)]/20 text-[var(--state-alert)]";
  return "bg-surface-subtle text-text-secondary";
}

function DiseaseKBMobile() {
  const farm = useFarm();
  const [kw, setKw] = useState("");
  const [active, setActive] = useState<Disease | null>(null);

  const top = useMemo(() => [...DISEASES].sort((a, b) => b.recent7d - a.recent7d).slice(0, 5), []);
  const list = useMemo(() => {
    const k = kw.trim();
    if (!k) return DISEASES;
    return DISEASES.filter(
      (d) => d.name.includes(k) || d.cat.includes(k) || d.symptoms.some((s) => s.includes(k)),
    );
  }, [kw]);

  return (
    <MobileShell title="疾病库" back hideTabBar>
      <div className="px-4 pt-3 pb-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" />
          <input
            value={kw}
            onChange={(e) => setKw(e.target.value)}
            placeholder="搜索疾病 / 症状 / 分类"
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-card border border-border text-body-sm placeholder:text-text-tertiary focus:outline-none focus:border-primary"
          />
        </div>

        <section>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              <h3 className="text-card-title text-foreground">近 7 天高发疾病</h3>
            </div>
            <span className="text-caption text-text-tertiary">{farm.name}</span>
          </div>
          <div className="rounded-2xl bg-card border border-border divide-y divide-border overflow-hidden">
            {top.map((d, i) => (
              <button
                key={d.id}
                onClick={() => setActive(d)}
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
                <span className="flex-1 text-body text-foreground truncate">{d.name}</span>
                <span className="text-caption text-text-tertiary tabular-nums">{d.recent7d} 头</span>
                <ChevronRight className="h-3.5 w-3.5 text-text-tertiary" />
              </button>


            ))}
          </div>
        </section>

        <section>
          <h3 className="text-card-title text-foreground mb-2">全部疾病 · {list.length}</h3>
          <div className="space-y-2">
            {list.map((d) => (
              <button
                key={d.id}
                onClick={() => setActive(d)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border active:bg-surface-subtle text-left"
              >
                <span className="h-9 w-9 rounded-lg bg-brand-subtle text-primary inline-flex items-center justify-center shrink-0">
                  <Stethoscope className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-body text-foreground truncate">{d.name}</span>
                  </div>
                  <div className="text-caption text-text-tertiary mt-0.5 line-clamp-1">{d.cat} · {d.desc}</div>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-text-tertiary shrink-0" />
              </button>
            ))}
            {list.length === 0 && (
              <div className="text-center text-caption text-text-tertiary py-8">未找到匹配的疾病</div>
            )}
          </div>
        </section>
      </div>

      {active && <DiseaseDetailSheet item={active} onClose={() => setActive(null)} />}
    </MobileShell>
  );
}

function DiseaseDetailSheet({ item, onClose }: { item: Disease; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center" onClick={onClose}>
      <div
        className="w-full max-w-[440px] bg-card rounded-t-2xl p-4 pb-[calc(env(safe-area-inset-bottom)+16px)] h-[75vh] max-h-[75vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="h-10 w-10 rounded-xl bg-brand-subtle text-primary inline-flex items-center justify-center shrink-0">
              <Stethoscope className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <div className="text-card-title text-foreground truncate">{item.name}</div>
              <div className="text-caption text-text-tertiary">
                <span className="font-mono">{item.id}</span> · {item.cat}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-md text-text-tertiary active:bg-surface-subtle inline-flex items-center justify-center">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-3 text-caption text-text-tertiary">近 7 天 {item.recent7d} 头</div>

        <Section label="易感牛群">


          <div className="flex flex-wrap gap-1.5">
            {(item.groups.length ? item.groups : ["未标注"]).map((g) => (
              <span key={g} className="text-body-sm px-2 py-1 rounded-md bg-surface-subtle text-text-secondary">
                {g}
              </span>
            ))}
          </div>
        </Section>

        <Section label="典型表现">
          <p className="text-body-sm text-text-secondary leading-relaxed">{item.desc}</p>
        </Section>

        <Section label="常见症状">
          <div className="flex flex-wrap gap-1.5">
            {item.symptoms.map((s) => (
              <span key={s} className="text-body-sm px-2 py-1 rounded-md bg-surface-subtle text-text-secondary">
                {s}
              </span>
            ))}
          </div>
        </Section>

        {item.prescriptions.length > 0 && (
        <Section label={`适用处方 · ${item.prescriptions.length} 个`}>
          <div className="space-y-2.5">
            {[...item.prescriptions].reverse().map((p, idx) => {
              const seq = String.fromCharCode(65 + (item.prescriptions.length - 1 - idx));
              const rxId = `RX-${item.id.split("-")[1]}${seq}`;
              const drugSummary = p.drugs.map((d) => d.name).join("、");
              return (
                <div key={p.name} className="rounded-xl border border-border p-3 bg-card">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <FileText className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-body text-foreground font-medium truncate">
                      <span className="font-mono mr-1">{rxId}</span>
                      {p.name}
                    </span>
                  </div>
                  <div className="text-body-sm text-text-secondary leading-relaxed">
                    用药：{drugSummary}
                  </div>
                  <div className="text-body-sm text-text-secondary mt-0.5">
                    疗程：{p.course}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
        )}

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


