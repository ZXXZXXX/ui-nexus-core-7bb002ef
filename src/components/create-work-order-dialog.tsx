import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Beef, Home, Layers, Check } from "lucide-react";
import { toast } from "sonner";
import { PRESCRIPTION_SEED, type RxSeed } from "@/lib/prescription-kb";

export type CreateRxKind = "immune" | "drying" | "hoof" | "deworm";

const BARN_COUNT = 8;
const PEN_PER_BARN = 4;
const COWS_PER_PEN = 100;

export const CWO_BARNS = Array.from({ length: BARN_COUNT }, (_, i) => ({
  idx: i + 1,
  name: `${i + 1} 号牛舍`,
}));

function cowIdFor(barnIdx: number, penIdx: number, i: number) {
  const seq = (barnIdx - 1) * PEN_PER_BARN * COWS_PER_PEN + (penIdx - 1) * COWS_PER_PEN + i + 1;
  return `01-24-${String(2000 + seq).padStart(4, "0")}`;
}

const ALL_COW_IDS: string[] = (() => {
  const out: string[] = [];
  for (let b = 1; b <= BARN_COUNT; b++)
    for (let p = 1; p <= PEN_PER_BARN; p++)
      for (let i = 0; i < COWS_PER_PEN; i++) out.push(cowIdFor(b, p, i));
  return out;
})();

function barnOf(id: string): number {
  const seq = Number(id.split("-")[2]) - 2000;
  return Math.floor((seq - 1) / (PEN_PER_BARN * COWS_PER_PEN)) + 1;
}

type Mode = "cow" | "barn" | "input" | "farm";

const MODES: { key: Mode; label: string; icon: typeof Beef }[] = [
  { key: "cow", label: "批量选择牛只", icon: Beef },
  { key: "barn", label: "按牛舍选择", icon: Home },
  { key: "input", label: "批量输入耳号", icon: Layers },
  { key: "farm", label: "全牧场牛只", icon: Check },
];

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function addDays(base: Date, n: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}
const TODAY_STR = () => ymd(new Date());
const MAX_STR = () => ymd(addDays(new Date(), 7));

export function CreateWorkOrderDialog({
  open,
  onOpenChange,
  title,
  kind,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  kind: CreateRxKind;
  onCreate: (payload: {
    targets: string[];
    targetLabel: string;
    rx: RxSeed;
    varSelections?: { drug: string; option: string; dose: string }[];
    startDate?: string;
  }) => void;
}) {
  const [mode, setMode] = useState<Mode>("cow");
  const [cowQuery, setCowQuery] = useState("");
  const [cowBarn, setCowBarn] = useState<number | "all">("all");
  const [pickedCows, setPickedCows] = useState<string[]>([]);
  const [pickedBarns, setPickedBarns] = useState<number[]>([]);
  const [rawInput, setRawInput] = useState("");
  const [rxQuery, setRxQuery] = useState("");
  const [rxId, setRxId] = useState("");
  const [varPick, setVarPick] = useState<Record<string, string>>({});
  const [startDate, setStartDate] = useState<string>(TODAY_STR);

  const rxList = useMemo(() => {
    const kw = rxQuery.trim();
    return PRESCRIPTION_SEED.filter((r) => r.kind === kind).filter(
      (r) => !kw || r.name.includes(kw) || r.code.includes(kw) || (r.subType ?? "").includes(kw),
    );
  }, [kind, rxQuery]);

  const cowList = useMemo(() => {
    const kw = cowQuery.trim().replace(/^#/, "");
    const out: string[] = [];
    for (const id of ALL_COW_IDS) {
      if (cowBarn !== "all" && barnOf(id) !== cowBarn) continue;
      if (kw && !id.includes(kw)) continue;
      out.push(id);
      if (out.length >= 80) break;
    }
    return out;
  }, [cowQuery, cowBarn]);

  const parsedInput = useMemo(() => {
    const tokens = rawInput
      .split(/[,，\s;；\n]+/)
      .map((s) => s.trim().replace(/^#/, ""))
      .filter(Boolean);
    const uniq = Array.from(new Set(tokens));
    const valid = uniq.filter((t) => /^\d{2}-\d{2}-\d{4}$/.test(t));
    const invalid = uniq.filter((t) => !valid.includes(t));
    return { valid, invalid };
  }, [rawInput]);

  const selection = useMemo<{ targets: string[]; label: string; count: number }>(() => {
    if (mode === "farm")
      return { targets: ["全牧场"], label: "全牧场（1 号牧场全部牛只）", count: ALL_COW_IDS.length };
    if (mode === "barn") {
      const names = pickedBarns.sort((a, b) => a - b).map((b) => `${b} 号牛舍`);
      return {
        targets: names,
        label: names.join("、"),
        count: pickedBarns.length * PEN_PER_BARN * COWS_PER_PEN,
      };
    }
    if (mode === "input")
      return {
        targets: parsedInput.valid.map((v) => `#${v}`),
        label: parsedInput.valid.map((v) => `#${v}`).join("、"),
        count: parsedInput.valid.length,
      };
    return {
      targets: pickedCows.map((v) => `#${v}`),
      label: pickedCows.map((v) => `#${v}`).join("、"),
      count: pickedCows.length,
    };
  }, [mode, pickedBarns, pickedCows, parsedInput]);

  const rx = rxList.find((r) => r.id === rxId) ?? PRESCRIPTION_SEED.find((r) => r.id === rxId);

  const varDrugs = useMemo(
    () => (rx?.drugs ?? []).filter((d) => d.variable && (d.varDose?.length ?? 0) > 0),
    [rx],
  );
  const varDone = varDrugs.every((d) => !!varPick[d.id]);
  const dateValid = !!startDate && startDate >= TODAY_STR() && startDate <= MAX_STR();
  const canSubmit = selection.count > 0 && !!rx && varDone && dateValid;

  const reset = () => {
    setMode("cow");
    setCowQuery("");
    setCowBarn("all");
    setPickedCows([]);
    setPickedBarns([]);
    setRawInput("");
    setRxQuery("");
    setRxId("");
    setVarPick({});
    setStartDate(TODAY_STR());
  };

  const submit = () => {
    if (!canSubmit || !rx) return;
    const varSelections = varDrugs.map((d) => ({
      drug: d.drugs.map((x) => x.name).join("+"),
      option: varPick[d.id],
      dose: d.varDose?.find((v) => v.option === varPick[d.id])?.dose ?? "",
    }));
    onCreate({ targets: selection.targets, targetLabel: selection.label, rx, varSelections, startDate });
    toast.success(`已创建${title}，执行对象 ${selection.count} 头`);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-[880px] p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-border">
          <DialogTitle className="text-section">新建{title}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 divide-x divide-border max-h-[62vh]">
          {/* 执行对象 */}
          <div className="p-5 space-y-3 overflow-y-auto">
            <div className="text-body-sm font-medium">1. 选择执行对象</div>
            <div className="grid grid-cols-4 gap-2">
              {MODES.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setMode(m.key)}
                  className={`h-9 rounded-md border text-caption transition-colors ${
                    mode === m.key
                      ? "border-primary text-primary bg-[var(--sidebar-active,rgba(0,161,79,0.08))]"
                      : "border-border text-text-secondary hover:text-foreground"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {mode === "cow" && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                    <Input
                      value={cowQuery}
                      onChange={(e) => setCowQuery(e.target.value)}
                      placeholder="搜索耳号"
                      className="h-9 pl-8 text-body-sm"
                    />
                  </div>
                  <select
                    value={String(cowBarn)}
                    onChange={(e) => setCowBarn(e.target.value === "all" ? "all" : Number(e.target.value))}
                    className="h-9 rounded-md border border-border bg-card px-2 text-body-sm"
                  >
                    <option value="all">全部牛舍</option>
                    {CWO_BARNS.map((b) => (
                      <option key={b.idx} value={b.idx}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center justify-between text-caption text-text-tertiary">
                  <span>当前展示 {cowList.length} 头（最多 80）</span>
                  <button
                    className="text-primary"
                    onClick={() =>
                      setPickedCows((prev) =>
                        cowList.every((c) => prev.includes(c))
                          ? prev.filter((c) => !cowList.includes(c))
                          : Array.from(new Set([...prev, ...cowList])),
                      )
                    }
                  >
                    {cowList.every((c) => pickedCows.includes(c)) && cowList.length > 0 ? "取消全选" : "全选当前"}
                  </button>
                </div>
                <div className="border border-border rounded-md max-h-[280px] overflow-y-auto divide-y divide-border">
                  {cowList.map((id) => (
                    <label key={id} className="flex items-center gap-2 px-3 h-10 cursor-pointer hover:bg-surface-subtle">
                      <Checkbox
                        checked={pickedCows.includes(id)}
                        onCheckedChange={(v) =>
                          setPickedCows((prev) => (v ? [...prev, id] : prev.filter((x) => x !== id)))
                        }
                      />
                      <span className="font-mono text-body-sm">#{id}</span>
                      <span className="ml-auto text-caption text-text-tertiary">{barnOf(id)} 号牛舍</span>
                    </label>
                  ))}
                  {cowList.length === 0 && (
                    <div className="px-3 py-6 text-center text-caption text-text-tertiary">无匹配牛只</div>
                  )}
                </div>
              </div>
            )}

            {mode === "barn" && (
              <div className="grid grid-cols-2 gap-2">
                {CWO_BARNS.map((b) => (
                  <label
                    key={b.idx}
                    className="flex items-center gap-2 border border-border rounded-md px-3 h-11 cursor-pointer hover:bg-surface-subtle"
                  >
                    <Checkbox
                      checked={pickedBarns.includes(b.idx)}
                      onCheckedChange={(v) =>
                        setPickedBarns((prev) => (v ? [...prev, b.idx] : prev.filter((x) => x !== b.idx)))
                      }
                    />
                    <span className="text-body-sm">{b.name}</span>
                    <span className="ml-auto text-caption text-text-tertiary">
                      {PEN_PER_BARN * COWS_PER_PEN} 头
                    </span>
                  </label>
                ))}
              </div>
            )}

            {mode === "input" && (
              <div className="space-y-2">
                <Textarea
                  value={rawInput}
                  onChange={(e) => setRawInput(e.target.value)}
                  rows={8}
                  placeholder="以逗号分隔输入耳号，例如：01-24-2381,01-24-2382,01-24-2410"
                  className="text-body-sm font-mono"
                />
                <div className="text-caption text-text-tertiary">
                  已识别 {parsedInput.valid.length} 个有效耳号
                  {parsedInput.invalid.length > 0 && (
                    <span className="text-[var(--state-danger)]">
                      ，{parsedInput.invalid.length} 个格式错误：{parsedInput.invalid.slice(0, 5).join("、")}
                    </span>
                  )}
                </div>
              </div>
            )}

            {mode === "farm" && (
              <div className="border border-border rounded-md p-4 text-body-sm text-text-secondary">
                执行对象为当前牧场全部在场牛只，共 {ALL_COW_IDS.length} 头（{BARN_COUNT} 个牛舍）。
              </div>
            )}

            <div className="text-caption text-text-secondary">
              已选执行对象：<span className="text-primary">{selection.count}</span> 头
            </div>
          </div>

          {/* 处方 */}
          <div className="p-5 space-y-3 overflow-y-auto">
            <div className="text-body-sm font-medium">2. 选择执行处方</div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
              <Input
                value={rxQuery}
                onChange={(e) => setRxQuery(e.target.value)}
                placeholder="搜索处方名称 / 编号"
                className="h-9 pl-8 text-body-sm"
              />
            </div>
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {rxList.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    setRxId(r.id);
                    setVarPick({});
                  }}
                  className={`w-full text-left border rounded-md p-3 transition-colors ${
                    rxId === r.id ? "border-primary bg-[rgba(0,161,79,0.05)]" : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-body-sm font-medium">{r.name}</span>
                    <span className="font-mono text-caption text-text-tertiary">{r.code}</span>
                    <span className="ml-auto text-caption text-text-tertiary">疗程 {r.duration} 天</span>
                  </div>
                  {r.summary && (
                    <div className="mt-1 text-caption text-text-secondary line-clamp-2">{r.summary}</div>
                  )}
                </button>
              ))}
              {rxList.length === 0 && (
                <div className="py-8 text-center text-caption text-text-tertiary">无可用处方</div>
              )}
            </div>

            {varDrugs.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="text-body-sm font-medium">
                  3. 选择变量范围
                  <span className="ml-2 text-caption text-text-tertiary">（该处方含变量给药，需选择后方可提交）</span>
                </div>
                {varDrugs.map((d) => (
                  <div key={d.id} className="border border-border rounded-md p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-body-sm">{d.drugs.map((x) => x.name).join(" + ")}</span>
                      <span className="ml-auto text-caption text-text-tertiary">
                        {d.variableKind === "weight" ? "按体重" : d.variableKind === "quarter" ? "按乳区" : "按变量"}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {(d.varDose ?? []).map((v) => (
                        <button
                          key={v.option}
                          onClick={() => setVarPick((p) => ({ ...p, [d.id]: v.option }))}
                          className={`h-9 px-2 rounded-md border text-caption transition-colors ${
                            varPick[d.id] === v.option
                              ? "border-primary text-primary bg-[rgba(0,161,79,0.05)]"
                              : "border-border text-text-secondary hover:border-primary/50"
                          }`}
                        >
                          {v.option} · {v.dose}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {!varDone && (
                  <div className="text-caption text-[var(--state-danger)]">请为每个变量药品选择对应范围</div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-3 border-t border-border flex items-center gap-3 flex-wrap">
          <span className="text-body-sm font-medium">开始执行日期</span>
          <input
            type="date"
            value={startDate}
            min={TODAY_STR()}
            max={MAX_STR()}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-9 rounded-md border border-border bg-card px-2 text-body-sm"
          />
          <div className="flex items-center gap-1.5">
            {[0, 1, 2, 3, 7].map((n) => {
              const v = ymd(addDays(new Date(), n));
              return (
                <button
                  key={n}
                  onClick={() => setStartDate(v)}
                  className={`h-8 px-2.5 rounded-md border text-caption transition-colors ${
                    startDate === v
                      ? "border-primary text-primary bg-[rgba(0,161,79,0.05)]"
                      : "border-border text-text-secondary hover:border-primary/50"
                  }`}
                >
                  {n === 0 ? "今日" : n === 1 ? "明日" : `${n} 天后`}
                </button>
              );
            })}
          </div>
          <span className="text-caption text-text-tertiary">最晚可选 7 天后（{MAX_STR()}）</span>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button disabled={!canSubmit} onClick={submit}>
            创建工单
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
