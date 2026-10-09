import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ScanLine, X, PackageX, Boxes } from "lucide-react";
import { MobileShell } from "@/components/mobile-shell";
import { EvidenceSection } from "@/components/evidence-section";
import { DrugItemPicker, type DrugItem } from "@/components/drug-item-picker";
import { L3_ITEMS } from "@/lib/level3-items";
import { toast } from "sonner";

// 物品/药品候选
// 每个药品有两种单位：
//   specUnit 规格单位（采购 / 库存单位，单价按此计）
//   doseUnit 用药单位（最小使用单位），perSpec = 1 规格单位含多少用药单位
// 候选来源：本牧场所有人三级库中「未使用」的药品（每件药品有唯一码）
const PRICE_BY_NAME: Record<string, number> = {};
const ITEMS = Object.values(
  L3_ITEMS.filter((i) => !i.used).reduce<Record<string, { i: (typeof L3_ITEMS)[number]; n: number; holders: Set<string> }>>((acc, i) => {
    const k = `${i.name}|${i.spec}`;
    (acc[k] ??= { i, n: 0, holders: new Set() }).n++;
    acc[k].holders.add(i.holder);
    return acc;
  }, {}),
).map(({ i, n, holders }) => {
  const m = i.spec.match(/([\d.]+)\s*(ml|g|L|kg)\s*\/\s*(\S+)$/i);
  const perSpec = m ? Number(m[1]) : 1;
  return {
    id: `${i.name}|${i.spec}`,
    code: i.code,
    name: i.name,
    specUnit: m ? m[3] : "件",
    doseUnit: m ? m[2] : "件",
    perSpec,
    price: PRICE_BY_NAME[i.name] ?? Math.max(5, Math.round(perSpec / 4)),
    holder: [...holders].join("、"),
    spec: i.spec,
    unused: n,
  };
});

type UnitMode = "dose" | "spec";

// 损耗发生环节 → 具体原因
const LOSS_STAGES = [
  { key: "storage", label: "储存保管", reasons: ["冷链断电", "过期失效", "包装破损", "其他"] },
  { key: "prepare", label: "取药配药", reasons: ["配药溢洒", "误开未用", "操作失误", "其他"] },
  { key: "dosing", label: "给药用药", reasons: ["正常疫苗损耗", "牛只终止用药", "其他"] },
  { key: "other", label: "其他", reasons: ["运输破损", "盘点误差", "其他"] },
] as const;

type LossStage = (typeof LOSS_STAGES)[number]["key"];

const RETURN_REASONS = [
  "工单变更 ",
  "用料剩余",
  "牛只死亡",
  "牛只转出",
  "领取错误",
  "其他 ",
];

type Line = { itemId: string; qty: string; unitMode: UnitMode };

/** 按填报单位折算成规格单位数量（用于金额估算） */
function toSpecQty(item: (typeof ITEMS)[number], qty: number, unitMode: UnitMode) {
  return unitMode === "spec" ? qty : qty / item.perSpec;
}

export type DrugReportMode = "loss" | "return";

export function DrugReportForm({ mode: initialMode }: { mode?: DrugReportMode }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<DrugReportMode>(initialMode ?? "loss");
  const isReturn = mode === "return";
  const word = isReturn ? "退料" : "损耗";

  const [lines, setLines] = useState<Line[]>([]);
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
  const [pickerOpen, setPickerOpen] = useState(false);

  const estimatedTotal = useMemo(() => {
    return lines.reduce((sum, l) => {
      const item = ITEMS.find((i) => i.id === l.itemId);
      const qty = Number(l.qty);
      if (!item || !qty || Number.isNaN(qty)) return sum;
      return sum + item.price * toSpecQty(item, qty, l.unitMode);
    }, 0);
  }, [lines]);

  /** 某药品剩余未使用数 = 三级库未使用数 − 已添加行数 */
  const remainingFor = (id: string) =>
    (ITEMS.find((i) => i.id === id)?.unused ?? 0) -
    lines.filter((l) => l.itemId === id).length;
  const setLine = (idx: number, patch: Partial<Line>) =>
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  const addItem = (item: DrugItem) =>
    setLines((prev) => [...prev, { itemId: item.id, qty: "", unitMode: "dose" }]);
  const removeLine = (idx: number) =>
    setLines((prev) => prev.filter((_, i) => i !== idx));

  /** 扫码录入（演示）：从仍有未使用数的药品中识别一件并添加 */
  const scanAdd = () => {
    const avail = ITEMS.filter((it) => remainingFor(it.id) > 0);
    const pick = avail[Math.floor(Math.random() * avail.length)];
    if (!pick) {
      toast.error("三级库内暂无可选的未使用药品");
      return;
    }
    addItem(pick);
    toast.success(`扫码识别：${pick.name}`);
  };

  const descRequired = reasons.some((r) => r.includes("其他"));

  const canSubmit =
    lines.length > 0 &&
    lines.every((l) => l.itemId && l.qty.trim()) &&
    (isReturn || !!stage) &&
    reasons.length > 0 &&
    (!descRequired || desc.trim().length > 0) &&
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


        <Section title={`${word}物品`} required hint="扫码或从三级库添加，可登记多项">
          <div className="space-y-3">
            {/* 统一录入入口：扫码录入 / 从三级库选择 */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={scanAdd}
                className="h-11 rounded-xl bg-brand-subtle text-primary text-body-sm font-medium inline-flex items-center justify-center gap-1.5 active:opacity-80"
              >
                <ScanLine className="h-4 w-4" />
                扫码录入
              </button>
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="h-11 rounded-xl border border-border bg-card text-foreground text-body-sm inline-flex items-center justify-center gap-1.5 active:bg-surface-subtle"
              >
                <Boxes className="h-4 w-4" />
                从三级库选择
              </button>
            </div>

            {/* 已录入药品：仅展示名称与规格信息 */}
            {lines.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border px-3 py-8 text-center text-body-sm text-text-tertiary">
                尚未添加{word}药品，请扫码或从三级库选择
              </div>
            ) : (
              <div className="space-y-2.5">
                {lines.map((l, idx) => {
                  const item = ITEMS.find((i) => i.id === l.itemId);
                  if (!item) return null;
                  const qty = Number(l.qty);
                  const lineAmount =
                    qty && !Number.isNaN(qty)
                      ? item.price * toSpecQty(item, qty, l.unitMode)
                      : 0;
                  const curUnit =
                    l.unitMode === "spec" ? item.specUnit : item.doseUnit;
                  return (
                    <div
                      key={idx}
                      className="rounded-xl border border-border bg-card p-3 space-y-2.5"
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-body text-foreground leading-tight">
                            {item.name}
                          </div>
                          <div className="mt-1 text-caption text-text-tertiary">
                            {item.spec} · 1{item.specUnit}=
                            {item.perSpec}
                            {item.doseUnit} · ¥ {item.price}/{item.specUnit}
                          </div>
                          <div className="text-caption text-text-tertiary font-mono">
                            {item.code}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeLine(idx)}
                          className="h-7 w-7 -mt-1 -mr-1 inline-flex items-center justify-center rounded-full text-text-tertiary active:bg-surface-subtle shrink-0"
                          aria-label={`移除${item.name}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          value={l.qty}
                          onChange={(e) => setLine(idx, { qty: e.target.value })}
                          inputMode="decimal"
                          placeholder={`${word}数量`}
                          className="flex-1 h-11 px-3 rounded-lg text-body"
                        />
                        <div className="flex items-center rounded-lg border border-border overflow-hidden shrink-0">
                          {([
                            { key: "dose" as UnitMode, unit: item.doseUnit },
                            { key: "spec" as UnitMode, unit: item.specUnit },
                          ]).map((o) => {
                            const active = l.unitMode === o.key;
                            return (
                              <button
                                key={o.key}
                                type="button"
                                onClick={() => setLine(idx, { unitMode: o.key })}
                                className={`h-9 min-w-11 px-2 text-body-sm ${
                                  active
                                    ? "bg-brand-subtle text-primary font-medium"
                                    : "bg-card text-text-tertiary"
                                }`}
                              >
                                {o.unit}
                              </button>
                            );
                          })}
                        </div>
                        {!isReturn && (
                          <span
                            className={`text-body-sm w-20 text-right tabular-nums ${lineAmount > 0 ? "text-text-secondary" : "text-text-tertiary"}`}
                          >
                            {lineAmount > 0 ? `¥ ${lineAmount.toFixed(4)}` : "待估算"}
                          </span>
                        )}
                      </div>
                      <div className="text-caption text-text-tertiary">
                        当前按{l.unitMode === "spec" ? "规格单位" : "用药单位"}（
                        {curUnit}）填报
                        {qty && !Number.isNaN(qty)
                          ? l.unitMode === "spec"
                            ? ` · 折合 ${(qty * item.perSpec).toLocaleString("zh-CN")} ${item.doseUnit}`
                            : ` · 折合 ${(qty / item.perSpec).toFixed(2)} ${item.specUnit}`
                          : ""}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!isReturn && lines.length > 0 && (
              <div
                className="flex items-center justify-between rounded-xl px-3 py-2.5"
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

        <Section title={`${word}原因`} required hint="单选">
          {!isReturn && !stage ? (
            <div className="text-body-sm text-text-tertiary">请先选择发生环节</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(isReturn ? RETURN_REASONS : stageReasons).map((t) => {
                const active = reasons[0] === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setReasons(active ? [] : [t])}
                    className={`inline-flex items-center h-9 px-4 rounded-full text-body-sm border transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-foreground border-border active:border-primary"
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
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
          descRequired={descRequired}
          mediaRequired
          descPlaceholder={
            descRequired
              ? `请说明具体${word}原因（必填）`
              : `可补充${word}经过、影响范围等说明（选填）`
          }
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
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        items={ITEMS.map((it) => ({ ...it, remaining: remainingFor(it.id) }))}
        onSelect={(it) => addItem(it)}
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
