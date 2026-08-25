import { useMemo, useState } from "react";
import { X, Search, Check, Sparkles } from "lucide-react";

export type DiseaseItem = {
  name: string;
  symptoms: string[];
  plan?: { rx: string; drugs: string[]; duration: string };
};

export function DiseasePicker({
  open,
  onClose,
  diseases,
  selectedName,
  matchedSymptoms,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  diseases: DiseaseItem[];
  selectedName?: string;
  matchedSymptoms: string[];
  onSelect: (d: DiseaseItem) => void;
}) {
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    const kw = q.trim().toLowerCase();
    const hit = (d: DiseaseItem) =>
      d.symptoms.filter((s) => matchedSymptoms.includes(s)).length;
    const base = diseases
      .filter((d) => hit(d) > 0)
      .sort((a, b) => hit(b) - hit(a));
    return kw
      ? base.filter(
          (d) =>
            d.name.toLowerCase().includes(kw) ||
            d.symptoms.some((s) => s.toLowerCase().includes(kw))
        )
      : base;
  }, [diseases, q, matchedSymptoms]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[440px] bg-card rounded-t-2xl h-[75vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 h-12 flex items-center justify-between border-b border-border shrink-0">
          <div className="text-body font-medium text-foreground inline-flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-primary" />
            选择疑似疾病
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 -mr-2 inline-flex items-center justify-center text-text-tertiary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4 pt-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜索疾病名称或症状"
              className="w-full h-10 pl-9 pr-3 rounded-lg bg-surface-subtle border border-border text-body-sm placeholder:text-text-tertiary"
            />
          </div>
          {matchedSymptoms.length > 0 && !q && (
            <div className="mt-2 text-caption text-text-tertiary">
              已按当前症状匹配度排序
            </div>
          )}
        </div>

        <div className="p-4 space-y-2 overflow-y-auto flex-1">
          {list.length === 0 ? (
            <div className="text-center py-12 text-body-sm text-text-tertiary">
              {matchedSymptoms.length === 0 ? "请先选择症状" : "无匹配疾病"}
            </div>
          ) : (
            list.map((d) => {
              const overlap = d.symptoms.filter((s) => matchedSymptoms.includes(s));
              const selected = d.name === selectedName;
              return (
                <button
                  key={d.name}
                  type="button"
                  onClick={() => {
                    onSelect(d);
                    onClose();
                  }}
                  className={`w-full text-left rounded-xl border p-3 bg-card transition-colors ${
                    selected
                      ? "border-primary"
                      : "border-border active:bg-surface-subtle"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-body-sm text-foreground font-medium">
                      {d.name}
                    </span>
                    {overlap.length > 0 && (
                      <span className="tag tag-brand">
                        匹配 {overlap.length} 项症状
                      </span>
                    )}
                    {selected && (
                      <span className="ml-auto inline-flex items-center gap-0.5 text-caption text-primary font-medium">
                        <Check className="h-3.5 w-3.5" />
                        已选
                      </span>
                    )}
                  </div>
                  <div className="text-caption text-text-tertiary mt-1 line-clamp-2">
                    典型症状：{d.symptoms.join("、")}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
