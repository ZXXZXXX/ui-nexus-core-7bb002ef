import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ScanLine, X, Plus, PackageX, ChevronRight } from "lucide-react";
import { MobileShell } from "@/components/mobile-shell";
import { EvidenceSection } from "@/components/evidence-section";
import { DrugItemPicker } from "@/components/drug-item-picker";
import { TagPicker } from "@/components/m/tag-picker";
import { toast } from "sonner";

// 物品/药品候选（含参考单价，用于自动估算金额）
const ITEMS = [
  { id: "DR-0108", name: "乳房炎抗生素 5mg", unit: "支", price: 18 },
  { id: "DR-0214", name: "口蹄疫疫苗 A 型", unit: "支", price: 60 },
  { id: "DR-0306", name: "驱虫剂 伊维菌素", unit: "瓶", price: 45 },
  { id: "DR-0412", name: "营养补充剂 复合维生素", unit: "罐", price: 88 },
  { id: "DR-0521", name: "消毒液 戊二醛", unit: "L", price: 44 },
  { id: "DR-0633", name: "葡萄糖注射液", unit: "瓶", price: 12 },
  { id: "DR-0712", name: "碳酸氢钠", unit: "袋", price: 9 },
];

// 损耗发生环节 → 具体原因
const LOSS_STAGES = [
  { key: "dosing", label: "给药用药", reasons: ["正常疫苗损耗", "牛只终止用药", "其他原因"] },
  { key: "storage", label: "储存保管", reasons: ["冷链断电", "过期失效", "包装破损", "其他原因"] },
  { key: "prepare", label: "配药取药", reasons: ["配药溢洒", "误开未用", "操作失误", "其他原因"] },
  { key: "other", label: "其他", reasons: ["运输破损", "盘点误差", "其他原因"] },
] as const;

type LossStage = (typeof LOSS_STAGES)[number]["key"];

const RETURN_REASONS = [
  "工单取消",
  "用料剩余",
  "诊断变更",
  "牛只死亡",
  "牛只转出",
  "领取错误",
  "包装未拆",
];

type Line = { itemId: string; qty: string };

export type DrugReportMode = "loss" | "return";

export function DrugReportForm({ mode: initialMode }: { mode?: DrugReportMode }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<DrugReportMode>(initialMode ?? "loss");
  const isReturn = mode === "return";
  const word = isReturn ? "退料" : "损耗";

  const [lines, setLines] = useState<Line[]>([{ itemId: "", qty: "" }]);
  const [reasons, setReasons] = useState<string[]>([]);
  const [stage, setStage] = useState<LossStage | null>(null);
  const stageReasons: string[] = [
    ...(LOSS_STAGES.find((s) => s.key === stage)?.reasons ?? []),
  ];
  const [desc, setDesc] = useState("");
  const [photos, setPhotos] = useState<number[]>([]);
  const [videos, setVideos] = useState<number[]>([]);
  const [voiceSecs, setVoiceSecs] = useState<number | null>(null);
  const [recording, setRecording] = useState(false);
  const [pickerIdx, setPickerIdx] = useState<number | null>(null);

  const estimatedTotal = useMemo(() => {
    return lines.reduce((sum, l) => {
      const item = ITEMS.find((i) => i.id === l.itemId);
      const qty = Number(l.qty);
      if (!item || !qty || Number.isNaN(qty)) return sum;
      return sum + item.price * qty;
    }, 0);
  }, [lines]);

  const setLine = (idx: number, patch: Partial<Line>) =>
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  const addLine = () => setLines((prev) => [...prev, { itemId: "", qty: "" }]);
  const removeLine = (idx: number) =>
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));

  const canSubmit =
    lines.every((l) => l.itemId && l.qty.trim()) &&
    (isReturn || !!stage) &&
    reasons.length > 0 &&
    photos.length + videos.length > 0;

  const submit = () => {
    if (!canSubmit) {
      toast.error("请完善必填项");
      return;
    }
    toast.success(`${word}上报已提交`);
    setTimeout(() => navigate({ to: "/m/homepage" }), 600);
  };

  return (
    <MobileShell title="药品上报" back hideTabBar>
      <div className="px-4 pt-3 pb-28 space-y-5">
        {/* 上报类型切换 */}
        <div className="bg-card rounded-2xl border border-border p-1 grid grid-cols-2 gap-1">
          {([
            { key: "loss", label: "损耗上报" },
            { key: "return", label: "退料上报" },
          ] as { key: DrugReportMode; label: string }[]).map((opt) => {
            const active = mode === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => {
                  if (mode === opt.key) return;
                  setMode(opt.key);
                  setReasons([]);
                }}
                className={`h-10 rounded-xl text-body-sm font-medium transition-colors ${
                  active
                    ? "bg-brand-subtle text-primary"
                    : "text-text-secondary"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>


        <Section title={`${word}物品`} required hint="可一次性登记多项">
          <div className="space-y-2">
            {lines.map((l, idx) => {
              const item = ITEMS.find((i) => i.id === l.itemId);
              const qty = Number(l.qty);
              const lineAmount =
                item && qty && !Number.isNaN(qty) ? item.price * qty : 0;
              const canDelete = lines.length > 1;
              return (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPickerIdx(idx)}
                      className={`flex-1 h-11 px-3 rounded-lg border bg-card flex items-center gap-2 text-left ${
                        item ? "border-border" : "border-dashed border-border"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        {item ? (
                          <>
                            <div className="text-body text-foreground truncate leading-tight">
                              {item.name}
                            </div>
                            <div className="text-caption text-text-tertiary font-mono leading-tight">
                              {item.id} · ¥ {item.price}/{item.unit}
                            </div>
                          </>
                        ) : (
                          <span className="text-body text-text-tertiary">
                            选择{word}物品 / 药品
                          </span>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-text-tertiary shrink-0" />
                    </button>
                    <button
                      onClick={() => {
                        setPickerIdx(idx);
                        toast("已唤起扫码（演示）");
                      }}
                      className="h-11 w-11 inline-flex items-center justify-center rounded-lg bg-brand-subtle text-primary shrink-0"
                      aria-label="扫码录入"
                    >
                      <ScanLine className="h-4 w-4" />
                    </button>
                    {canDelete && (
                      <button
                        onClick={() => removeLine(idx)}
                        className="h-9 w-9 inline-flex items-center justify-center rounded-full text-text-tertiary active:bg-surface-subtle shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      value={l.qty}
                      onChange={(e) => setLine(idx, { qty: e.target.value })}
                      inputMode="decimal"
                      placeholder={`${word}数量`}
                      className="flex-1 h-11 px-3 rounded-lg text-body"
                    />
                    <span
                      className={`text-body-sm w-10 text-center ${item ? "text-text-secondary" : "text-text-tertiary"}`}
                    >
                      {item?.unit ?? "单位"}
                    </span>
                    {!isReturn && (
                      <span
                        className={`text-body-sm w-20 text-right tabular-nums ${lineAmount > 0 ? "text-text-secondary" : "text-text-tertiary"}`}
                      >
                        {lineAmount > 0 ? `¥ ${lineAmount.toFixed(4)}` : "待估算"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            <button
              onClick={addLine}
              className="w-full h-11 rounded-xl border border-dashed border-border bg-card text-body-sm text-text-secondary inline-flex items-center justify-center gap-1 active:bg-surface-subtle"
            >
              <Plus className="h-4 w-4" />
              追加{word}物品
            </button>

            {!isReturn && (
              <div
                className="flex items-center justify-between rounded-xl px-3 py-2.5 mt-1"
                style={{
                  background:
                    "color-mix(in oklab, var(--primary) 6%, transparent)",
                }}
              >
                <span className="text-body-sm text-text-secondary">{word}总金额（仅供参考）</span>
                <span className="text-card-title text-primary tabular-nums">
                  ¥ {estimatedTotal.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </Section>

        {!isReturn && (
          <Section title="发生环节" required hint="单选；决定可选的具体原因">
            <div className="flex items-start pt-1">
              {LOSS_STAGES.map((s, i) => {
                const active = stage === s.key;
                return (
                  <div key={s.key} className="flex-1 flex flex-col items-center min-w-0">
                    <div className="relative w-full flex items-center justify-center h-6">
                      {i > 0 && (
                        <span className="absolute left-0 right-1/2 top-1/2 -translate-y-1/2 mr-3 h-px bg-border" />
                      )}
                      {i < LOSS_STAGES.length - 1 && (
                        <span className="absolute left-1/2 right-0 top-1/2 -translate-y-1/2 ml-3 h-px bg-border" />
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (stage === s.key) return;
                          setStage(s.key);
                          setReasons([]);
                        }}
                        aria-label={s.label}
                        className={`relative z-10 h-5 w-5 rounded-full border-2 transition-colors flex items-center justify-center ${
                          active ? "border-primary bg-primary" : "border-border bg-card"
                        }`}
                      >
                        {active && <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (stage === s.key) return;
                        setStage(s.key);
                        setReasons([]);
                      }}
                      className={`mt-2 text-body-sm text-center leading-tight px-1 truncate max-w-full ${
                        active ? "text-primary font-medium" : "text-text-secondary"
                      }`}
                    >
                      {s.label}
                    </button>
                  </div>
                );
              })}
            </div>
          </Section>

        )}

        <Section title={`${word}原因`} required hint="单选；输入关键词搜索，未命中可直接新建">
          {!isReturn && !stage ? (
            <div className="text-body-sm text-text-tertiary">请先选择发生环节</div>
          ) : (
            <TagPicker
              selected={reasons}
              onChange={setReasons}
              presets={isReturn ? RETURN_REASONS : stageReasons}
              singleSelect
            />
          )}
        </Section>

        <EvidenceSection
          desc={desc}
          setDesc={setDesc}
          photos={photos}
          setPhotos={setPhotos}
          videos={videos}
          setVideos={setVideos}
          voiceSecs={voiceSecs}
          setVoiceSecs={setVoiceSecs}
          recording={recording}
          onVoiceToggle={() => {
            if (recording) {
              setRecording(false);
              setVoiceSecs(8);
            } else {
              setRecording(true);
              setTimeout(() => {
                setRecording(false);
                setVoiceSecs(8);
              }, 1200);
            }
          }}
          descRequired={false}
          mediaRequired
          descPlaceholder={`可补充${word}经过、影响范围等说明（选填）`}
        />
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] bg-card border-t border-border px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+12px)] z-40">
        <button
          onClick={submit}
          className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-body font-medium inline-flex items-center justify-center gap-2"
        >
          <PackageX className="h-4 w-4" />
          提交{word}上报
        </button>
      </div>

      <DrugItemPicker
        open={pickerIdx !== null}
        onClose={() => setPickerIdx(null)}
        items={ITEMS}
        selectedId={
          pickerIdx !== null ? lines[pickerIdx]?.itemId || undefined : undefined
        }
        onSelect={(it) => {
          if (pickerIdx !== null) setLine(pickerIdx, { itemId: it.id });
        }}
      />
    </MobileShell>
  );
}

function Section({
  title,
  required,
  hint,
  children,
}: {
  title: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-card rounded-2xl border border-border p-4">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-card-title text-foreground">
          {title}
          {required && <span className="text-[var(--state-danger)] ml-0.5">*</span>}
        </h3>
        {hint && <span className="text-caption text-text-tertiary">{hint}</span>}
      </div>
      {children}
    </section>
  );
}
