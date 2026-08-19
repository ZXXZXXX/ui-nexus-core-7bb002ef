import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Beef, ChevronRight, Check, X, SlidersHorizontal, Home } from "lucide-react";
import { MobileShell } from "@/components/mobile-shell";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export const Route = createFileRoute("/m/search")({
  head: () => ({ meta: [{ title: "牛只档案 · 奇点智牧" }] }),
  component: SearchPage,
});

type CowStatus = "健康" | "观察中" | "治疗中" | "异常" | "死淘";
type Cow = { id: string; barnIdx: number; penIdx: number; status: CowStatus };

const statusTone: Record<CowStatus, string> = {
  健康: "tag tag-success",
  观察中: "tag tag-warning",
  治疗中: "tag tag-info",
  异常: "tag tag-danger",
  死淘: "tag tag-muted",
};

const STATUSES: CowStatus[] = ["健康", "健康", "健康", "健康", "健康", "观察中", "治疗中", "异常", "死淘"];
const BARN_COUNT = 8;
const PEN_PER_BARN = 4;
const COWS_PER_PEN = 100;

const BARNS = Array.from({ length: BARN_COUNT }, (_, i) => ({
  idx: i + 1,
  id: `B${String(i + 1).padStart(3, "0")}`,
  name: `${i + 1} 号牛舍`,
}));

function cowIdFor(barnIdx: number, penIdx: number, i: number) {
  const seq = (barnIdx - 1) * PEN_PER_BARN * COWS_PER_PEN + (penIdx - 1) * COWS_PER_PEN + i + 1;
  return `01-24-${String(2000 + seq).padStart(4, "0")}`;
}

function statusFor(barnIdx: number, penIdx: number, i: number): CowStatus {
  return STATUSES[(barnIdx * 13 + penIdx * 7 + i) % STATUSES.length];
}

// 生成牛只列表（限制条数避免性能问题）
function listCows(barnFilter: Set<number> | "all", kw: string, onlyAbnormal: boolean, max = 60): Cow[] {
  const out: Cow[] = [];
  const barns = barnFilter === "all" ? BARNS.map((b) => b.idx) : Array.from(barnFilter);
  for (const b of barns) {
    for (let p = 1; p <= PEN_PER_BARN; p++) {
      for (let i = 0; i < COWS_PER_PEN; i++) {
        const id = cowIdFor(b, p, i);
        if (kw && !id.includes(kw)) continue;
        const status = statusFor(b, p, i);
        if (onlyAbnormal && status !== "异常") continue;
        out.push({ id, barnIdx: b, penIdx: p, status });
        if (out.length >= max) return out;
      }
    }
  }
  return out;
}

function SearchPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [barnOpen, setBarnOpen] = useState(false);
  // "all" 表示全部牛舍
  const [selected, setSelected] = useState<Set<number> | "all">("all");
  // 抽屉内的临时选择
  const [draft, setDraft] = useState<Set<number> | "all">("all");
  const [barnQuery, setBarnQuery] = useState("");
  const [onlyAbnormal, setOnlyAbnormal] = useState(false);

  const results = useMemo(() => listCows(selected, q.trim(), onlyAbnormal), [q, selected, onlyAbnormal]);

  const selectedCount = selected === "all" ? 0 : selected.size;

  function openBarnSheet() {
    setDraft(selected === "all" ? "all" : new Set(selected));
    setBarnQuery("");
    setBarnOpen(true);
  }

  function toggleBarn(idx: number) {
    setDraft((prev) => {
      // 选择具体牛舍时，取消 "全部"
      const next = prev === "all" ? new Set<number>() : new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next.size === 0 ? "all" : next;
    });
  }

  function pickAll() {
    setDraft("all");
  }

  function applyDraft() {
    setSelected(draft === "all" ? "all" : new Set(draft));
    setBarnOpen(false);
  }

  const filteredBarns = useMemo(() => {
    const kw = barnQuery.trim();
    if (!kw) return BARNS;
    return BARNS.filter((b) => b.name.includes(kw) || b.id.includes(kw));
  }, [barnQuery]);

  const searchBar = (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="输入牛只耳号粗略匹配，如 2381"
          className="w-full h-11 pl-9 pr-9 rounded-xl bg-card border border-transparent text-body text-foreground placeholder:text-text-tertiary focus:outline-none"
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 inline-flex items-center justify-center rounded-full text-text-tertiary active:bg-surface-subtle"
            aria-label="清除"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={openBarnSheet}
        aria-label="筛选牛舍"
        className="relative h-11 w-11 shrink-0 rounded-xl bg-transparent text-primary-foreground inline-flex items-center justify-center active:opacity-80"
      >
        <SlidersHorizontal className="h-5 w-5" />
        {selectedCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-white inline-flex items-center justify-center">
            <Check className="h-2.5 w-2.5 text-primary" strokeWidth={3} />
          </span>
        )}
      </button>
    </div>
  );

  return (
    <MobileShell title="牛只档案" back hideTabBar headerTone="brand" headerExtra={searchBar}>
      <div className="px-4 pt-3 pb-8 space-y-3">



        {/* 结果 */}
        <div className="flex items-center justify-between px-1 pt-1">
          <div className="text-caption text-text-tertiary">
            共 {results.length} 头
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={onlyAbnormal}
            onClick={() => setOnlyAbnormal((v) => !v)}
            className="inline-flex items-center gap-2 active:opacity-80"
          >
            <span className={`text-caption ${onlyAbnormal ? "text-primary font-medium" : "text-text-secondary"}`}>
              仅查看异常
            </span>
            <span
              className={`relative h-[18px] w-8 rounded-full transition-colors ${
                onlyAbnormal ? "bg-primary" : "bg-border"
              }`}
            >
              <span
                className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white shadow transition-all ${
                  onlyAbnormal ? "left-[14px]" : "left-0.5"
                }`}
              />
            </span>
          </button>
        </div>

        {results.length === 0 ? (
          <div className="rounded-xl bg-card border border-dashed border-border py-10 text-center text-body-sm text-text-tertiary">
            未找到匹配的牛只
          </div>
        ) : (
          (() => {
            const groups = results.reduce<Record<number, Cow[]>>((acc, c) => {
              (acc[c.barnIdx] ||= []).push(c);
              return acc;
            }, {});
            const barnIdxs = Object.keys(groups)
              .map((k) => Number(k))
              .sort((a, b) => a - b);
            return (
              <div className="space-y-4">
                {barnIdxs.map((idx) => {
                  const items = groups[idx];
                  return (
                    <section key={idx}>
                      <div className="sticky top-0 z-[1] -mx-4 px-4 py-2 bg-[var(--bg-page)]/90 backdrop-blur flex items-center gap-2">
                        <span className="h-6 w-6 rounded-md bg-brand-subtle text-primary inline-flex items-center justify-center">
                          <Home className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-body-sm font-medium text-foreground">{idx} 号牛舍</span>
                        <span className="text-caption text-text-tertiary">共 {items.length} 头</span>
                      </div>
                      <div className="space-y-2 mt-1">
                        {items.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => navigate({ to: "/m/animals-{$id}", params: { id: c.id } })}
                            className="w-full flex items-center gap-3 h-14 px-3 rounded-xl bg-card border border-border active:bg-surface-subtle"
                          >
                            <span className="h-8 w-8 rounded-lg bg-brand-subtle text-primary inline-flex items-center justify-center">
                              <Beef className="h-4 w-4" />
                            </span>
                            <div className="flex-1 min-w-0 text-left">
                              <div className="text-body font-mono text-foreground">#{c.id}</div>
                              <div className="text-caption text-text-tertiary">
                                {c.barnIdx} 号牛舍
                              </div>
                            </div>
                            <span className={statusTone[c.status]}>{c.status}</span>
                            <ChevronRight className="h-4 w-4 text-text-tertiary" />
                          </button>
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            );
          })()
        )}
      </div>

      {/* 选择牛舍抽屉 */}
      <Sheet open={barnOpen} onOpenChange={setBarnOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl p-0 max-h-[80vh] flex flex-col">
          <SheetHeader className="px-4 pt-4 pb-2">
            <SheetTitle className="text-section">选择牛舍</SheetTitle>
          </SheetHeader>

          <div className="px-4 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
              <input
                value={barnQuery}
                onChange={(e) => setBarnQuery(e.target.value)}
                placeholder="搜索牛舍名称或编号"
                className="w-full h-10 pl-9 pr-9 rounded-lg bg-surface-subtle border border-border text-body-sm placeholder:text-text-tertiary focus:outline-none focus:border-primary"
              />
              {barnQuery && (
                <button
                  type="button"
                  onClick={() => setBarnQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 inline-flex items-center justify-center rounded-full text-text-tertiary active:bg-surface-subtle"
                  aria-label="清除"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-auto px-4 pb-2 space-y-2">
            {!barnQuery && (
              <>
                <BarnOption
                  label="全部牛舍"
                  checked={draft === "all"}
                  onClick={pickAll}
                  emphasis
                />
                <div className="h-px bg-border my-1" />
              </>
            )}
            {filteredBarns.length === 0 ? (
              <div className="text-center py-10 text-body-sm text-text-tertiary">无匹配牛舍</div>
            ) : (
              filteredBarns.map((b) => {
                const checked = draft !== "all" && draft.has(b.idx);
                return (
                  <BarnOption
                    key={b.id}
                    label={b.name}
                    sub={b.id}
                    checked={checked}
                    onClick={() => toggleBarn(b.idx)}
                  />
                );
              })
            )}
          </div>


          <div className="p-4 border-t border-border flex gap-2">
            <button
              type="button"
              onClick={() => setDraft("all")}
              className="h-11 px-4 rounded-xl border border-border text-body text-text-secondary active:bg-surface-subtle"
            >
              重置
            </button>
            <button
              type="button"
              onClick={applyDraft}
              className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground text-body font-medium active:opacity-90"
            >
              确定
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </MobileShell>
  );
}

function BarnOption({
  label,
  sub,
  checked,
  onClick,
  emphasis,
}: {
  label: string;
  sub?: string;
  checked: boolean;
  onClick: () => void;
  emphasis?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full h-12 px-3 rounded-xl border flex items-center gap-3 active:bg-surface-subtle ${
        checked ? "border-primary bg-brand-subtle" : "border-border bg-card"
      }`}
    >
      <div className="flex-1 min-w-0 text-left">
        <div className={`text-body ${emphasis ? "font-medium" : ""} ${checked ? "text-primary" : "text-foreground"}`}>
          {label}
        </div>
        {sub && <div className="text-caption text-text-tertiary mt-0.5">编号 {sub}</div>}
      </div>
      <span
        className={`h-5 w-5 rounded-full border inline-flex items-center justify-center ${
          checked ? "bg-primary border-primary text-primary-foreground" : "border-border"
        }`}
      >
        {checked && <Check className="h-3 w-3" />}
      </span>
    </button>
  );
}
