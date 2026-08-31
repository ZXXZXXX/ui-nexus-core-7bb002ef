import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { MobileShell } from "@/components/mobile-shell";
import { ArrowRight, ArrowRightLeft, LogOut, MapPin, Search } from "lucide-react";
import { toast } from "sonner";
import { TransferBarnControl } from "@/components/m/transfer-barn-control";
import { ConfirmTransferDialog } from "@/components/m/confirm-transfer-dialog";
import { MediaGrid } from "@/components/m/media-grid";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Check } from "lucide-react";


export const Route = createFileRoute("/m/events/$type/$id")({
  validateSearch: (s: Record<string, unknown>): { item?: string; batch?: string } => ({
    item: typeof s.item === "string" ? s.item : undefined,
    batch: typeof s.batch === "string" ? s.batch : undefined,
  }),
  head: () => ({ meta: [{ title: "事件记录 · 奇点智牧" }] }),
  component: EventPage,
});

function EventPage() {
  const { type, id } = useParams({ from: "/m/events/$type/$id" });
  const { item, batch } = Route.useSearch();
  const navigate = useNavigate();
  const batchIds = (batch ?? "").split(",").filter(Boolean);
  const batchCount = batchIds.length > 1 ? batchIds.length : 0;
  const done = () =>
    batchCount
      ? navigate({ to: "/m/health/today" })
      : navigate({ to: "/m/animals-{$id}", params: { id } });
  if (type === "calving") return <CalvingForm id={id} onDone={done} />;
  if (type === "exam") return <ExamForm id={id} item={item} onDone={done} batchCount={batchCount} />;
  if (type === "transfer") return <TransferForm id={id} onDone={done} batchCount={batchCount} />;
  return <LeaveForm id={id} onDone={done} />;
}

/** 批量执行时的顶部提示：共计 N 个任务 · N 头牛只 */
function BatchBanner({ count }: { count: number }) {
  return (
    <div className="px-4 pt-3">
      <div className="text-caption text-text-tertiary inline-flex items-center gap-1.5">
        <span>批量执行</span>
        <span className="text-text-secondary">
          共计 <span className="text-primary tabular-nums font-medium">{count}</span> 个任务
        </span>
        <span className="text-text-tertiary">·</span>
        <span className="text-text-secondary">
          <span className="text-primary tabular-nums font-medium">{count}</span> 头牛只
        </span>
      </div>
    </div>
  );
}



const TRANSFER_REASONS = [
  "泌乳阶段调整",
  "干奶转入",
  "产前转入产房",
  "产后转出",
  "并群优化",
  "隔离治疗",
  "康复转出",
  "淘汰待售",
  "栏舍维修",
  "饲养密度调整",
];

function ReasonPicker({
  open,
  onOpenChange,
  value,
  onChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  value: string;
  onChange: (v: string) => void;
}) {
  const [q, setQ] = useState("");
  const kw = q.trim();
  const list = kw ? TRANSFER_REASONS.filter((t) => t.includes(kw)) : TRANSFER_REASONS;
  const canCreate = !!kw && !TRANSFER_REASONS.some((t) => t === kw);

  return (
    <Sheet open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setQ(""); }}>
      <SheetContent side="bottom" className="rounded-t-2xl p-0 max-h-[75vh] flex flex-col">
        <SheetHeader className="px-4 pt-4 pb-2 text-left">
          <SheetTitle className="text-section-title">选择转栏原因</SheetTitle>
        </SheetHeader>
        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="输入关键词搜索，未命中可直接新建"
              className="w-full h-10 pl-9 pr-3 rounded-lg bg-card border border-border text-body-sm placeholder:text-text-tertiary focus:outline-none focus:border-primary"
            />
          </div>
        </div>
        <div className="px-4 pb-6 flex-1 min-h-0 overflow-y-auto">
          {list.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { onChange(t); onOpenChange(false); setQ(""); }}
              className={`w-full h-12 px-1 flex items-center justify-between text-body border-b border-border/60 last:border-b-0 ${
                value === t ? "text-primary" : "text-foreground"
              }`}
            >
              <span className="truncate">{t}</span>
              {value === t && <Check className="h-4 w-4 text-primary shrink-0" />}
            </button>
          ))}
          {list.length === 0 && !canCreate && (
            <div className="py-6 text-center text-caption text-text-tertiary">无匹配结果</div>
          )}
          {canCreate && (
            <button
              type="button"
              onClick={() => { onChange(kw); onOpenChange(false); setQ(""); }}
              className="mt-3 inline-flex items-center h-10 px-3 rounded-lg border border-dashed border-primary/60 bg-brand-subtle text-primary text-body-sm"
            >
              新建「{kw}」
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function TransferForm({ id, onDone, batchCount = 0 }: { id: string; onDone: () => void; batchCount?: number }) {
  const currentBarn = "3 号牛舍";
  const [to, setTo] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [reasons, setReasons] = useState<string[]>([]);
  const [reasonOpen, setReasonOpen] = useState(false);
  const [media, setMedia] = useState<number[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const submit = () => {
    if (!to) return toast.error("请选择转入栏舍");
    if (reasons.length === 0) return toast.error("请选择或输入转栏原因");
    setConfirmOpen(true);
  };
  const confirm = () => {
    setConfirmOpen(false);
    toast.success(`已转至 ${to}`);
    onDone();
  };

  return (
    <MobileShell title={`#${id} · 转栏/转群`} back hideTabBar>
      <div className="pb-24">
        <div className="px-4 pt-4">
          <div className="rounded-2xl bg-gradient-to-br from-primary to-[#00823F] p-4 text-primary-foreground flex items-center gap-3">
            <span className="h-11 w-11 rounded-xl bg-white/20 inline-flex items-center justify-center">
              <ArrowRightLeft className="h-5 w-5" />
            </span>
            <div>
              <div className="text-card-title">转栏 / 转群</div>
              <div className="text-caption opacity-85">牛只 #{id}</div>
            </div>
          </div>
        </div>
        <div className="px-4 mt-4 space-y-4">
          <div className="flex items-stretch gap-2">
            <div className="flex-1 min-w-0 rounded-xl border border-primary/40 bg-brand-subtle px-3 py-2.5">
              <div className="flex items-center gap-1 text-caption text-primary mb-1">
                <MapPin className="h-3 w-3" />
                当前位置
              </div>
              <div className="text-body-sm text-foreground font-medium truncate">{currentBarn}</div>
            </div>
            <div className={`shrink-0 flex items-center justify-center w-7 ${to ? "text-primary" : "text-text-tertiary"}`}>
              <ArrowRight className="h-4 w-4" />
            </div>
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className={`flex-1 min-w-0 rounded-xl bg-card px-3 py-2.5 text-left transition-colors ${
                to ? "border border-primary" : "border border-dashed border-border active:border-primary/60"
              }`}
            >
              <div className={`flex items-center justify-between gap-1 text-caption mb-1 ${to ? "text-primary" : "text-text-tertiary"}`}>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  转入位置
                </span>
                <span className="text-caption text-text-tertiary">{to ? "更换" : "选择"}</span>
              </div>
              <div className={`text-body-sm truncate ${to ? "text-foreground font-medium" : "text-text-tertiary"}`}>
                {to || "点击选择牛舍"}
              </div>
            </button>
          </div>
          <TransferBarnControl
            enabled
            onEnabledChange={() => {}}
            value={to}
            onValueChange={setTo}
            exclude={[currentBarn]}
            label="转入栏舍"
            hideToggle
            triggerless
            open={pickerOpen}
            onOpenChange={setPickerOpen}
          />
          <Field label="转栏原因" required>
            <button
              type="button"
              onClick={() => setReasonOpen(true)}
              className={`w-full h-11 px-3 inline-flex items-center rounded-lg bg-card border text-body-sm ${
                reasons[0] ? "border-primary text-foreground" : "border-border text-text-tertiary"
              }`}
            >
              <Search className="h-4 w-4 mr-2 text-text-tertiary" />
              <span className="flex-1 text-left truncate">{reasons[0] || "搜索或选择转栏原因"}</span>
            </button>
          </Field>
          <ReasonPicker
            open={reasonOpen}
            onOpenChange={setReasonOpen}
            value={reasons[0] ?? ""}
            onChange={(v) => setReasons(v ? [v] : [])}
          />
          <Field label="拍照记录">
            <MediaGrid items={media} setItems={setMedia} max={6} hideVideo caption="照片（选填）" />
          </Field>


        </div>
      </div>
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] bg-card border-t border-border p-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
        <button
          type="button"
          onClick={submit}
          className="w-full h-12 rounded-2xl bg-primary text-primary-foreground text-body font-semibold inline-flex items-center justify-center gap-1.5"
        >
          <ArrowRightLeft className="h-4 w-4" /> 提交转栏
        </button>
      </div>
      <ConfirmTransferDialog
        open={confirmOpen}
        earTag={`#${id}`}
        barn={to}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={confirm}
      />
    </MobileShell>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-body-sm text-foreground mb-1.5">
        {label}
        {required && <span className="text-[var(--state-danger)] ml-0.5">*</span>}
      </div>
      {children}
    </div>
  );
}

const inputCls = "w-full h-11 px-3 rounded-lg border border-border bg-card text-body-sm text-foreground outline-none focus:border-primary";

type Calf = {
  id: string;
  earTag: string;
  birthDate: string;
  breed: string;
  sex: "母" | "公" | "";
  rfid: string;
  status: "正常" | "死胎" | "";
  weight: string;
  keep: "留养" | "不留养" | "";
  targetBarn: string;
  reason: string;
  media: number[];
  // 初乳饲喂记录
  feedCode: string;
  feedAmount: string;
  feedTemp: string;
  feedMedia: number[];
  feedTech: string;
};


const CALF_BARNS = [
  "犊牛岛 A 区",
  "犊牛岛 B 区",
  "犊牛岛 C 区",
  "1 号犊牛舍",
  "2 号犊牛舍",
  "3 号犊牛舍",
  "断奶过渡舍",
];

const TECHNICIANS = ["张伟", "李强", "王芳", "刘洋", "陈晓东", "赵敏"];



const BREEDS = [
  "荷斯坦",
  "西门塔尔",
  "娟姗牛",
  "安格斯",
  "利木赞",
  "夏洛莱",
  "海福特",
  "和牛",
  "婆罗门",
  "秦川牛",
  "鲁西黄牛",
  "南阳牛",
];

function newCalf(index: number): Calf {
  const yy = String(new Date().getFullYear()).slice(2);
  const mm = String(new Date().getMonth() + 1).padStart(2, "0");
  const seq = String(9000 + index + 1).padStart(4, "0");
  return {
    id: `${Date.now()}-${index}`,
    earTag: `${yy}-${mm}-${seq}`,
    birthDate: new Date().toISOString().slice(0, 10),
    breed: "",
    sex: "",
    rfid: "",
    status: "",
    weight: "",
    keep: "",
    targetBarn: "",
    reason: "",
    media: [],
    feedCode: "",
    feedAmount: "",
    feedTemp: "",
    feedMedia: [],
    feedTech: "",
  };

}

function CalvingForm({ id, onDone }: { id: string; onDone: () => void }) {
  // 系统自动填入（模拟）
  const pregnancyDays = 278;
  const semenBreed = "荷斯坦 · 冻精 A-2201";
  const [calvingTime, setCalvingTime] = useState("");
  useEffect(() => {
    setCalvingTime(new Date().toISOString().slice(0, 16).replace("T", " "));
  }, []);
  const parity = 3;

  const [difficulty, setDifficulty] = useState<number | null>(null);
  const [injury, setInjury] = useState<number | null>(null);
  const [calves, setCalves] = useState<Calf[]>([newCalf(0)]);
  const [breedPickerIdx, setBreedPickerIdx] = useState<number | null>(null);
  const [barnPickerIdx, setBarnPickerIdx] = useState<number | null>(null);
  const [techPickerIdx, setTechPickerIdx] = useState<number | null>(null);
  const [colAmount, setColAmount] = useState("");
  const [colBrix, setColBrix] = useState(""); // 白利度
  const [colUse, setColUse] = useState("");
  const [colBag, setColBag] = useState("");
  // 白利度自动判定初乳质量（直接派生，随输入即时更新）
  const brixNum = parseFloat(colBrix);
  const colQuality = Number.isNaN(brixNum)
    ? ""
    : brixNum >= 22 && brixNum <= 28
      ? "好"
      : brixNum >= 19 && brixNum < 22
        ? "一般"
        : "坏";
  // 初乳编码：大牛耳号 + 年份后两位和月份
  const colCode = `${id}-${String(new Date().getFullYear()).slice(2)}${String(new Date().getMonth() + 1).padStart(2, "0")}`;

  const updateCalf = (idx: number, patch: Partial<Calf>) =>
    setCalves((list) => list.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
  const removeCalf = (idx: number) =>
    setCalves((list) => (list.length <= 1 ? list : list.filter((_, i) => i !== idx)));

  const submit = () => {
    if (difficulty == null) return toast.error("请选择产犊难易度评分");
    if (injury == null) return toast.error("请选择产道损伤等级");
    if (!colUse) return toast.error("请选择初乳用途");
    if (!colBag) return toast.error("请填写袋号");
    if (!colAmount) return toast.error("请填写初乳量");
    if (!colBrix) return toast.error("请填写白利度");


    for (let i = 0; i < calves.length; i++) {
      const c = calves[i];
      if (!c.status) return toast.error(`请选择第 ${i + 1} 头犊牛的分娩状态`);
      if (c.status === "死胎") {
        if (c.media.length === 0) return toast.error(`第 ${i + 1} 头犊牛（死胎）需上传照片或视频`);
        if (!c.reason.trim()) return toast.error(`请填写第 ${i + 1} 头犊牛（死胎）原因`);
        continue;
      }
      if (!c.breed) return toast.error(`请选择第 ${i + 1} 头犊牛的品种`);
      if (!c.sex) return toast.error(`请选择第 ${i + 1} 头犊牛的性别`);
      if (!c.weight) return toast.error(`请填写第 ${i + 1} 头犊牛的体重`);
      if (!c.keep) return toast.error(`请选择第 ${i + 1} 头犊牛是否留养`);
      if (c.keep === "留养" && !c.targetBarn) {
        return toast.error(`请为第 ${i + 1} 头犊牛选择转入牛舍`);
      }
      if (c.keep === "不留养") {
        if (c.media.length === 0) return toast.error(`第 ${i + 1} 头犊牛不留养需上传照片或视频`);
        if (!c.reason.trim()) return toast.error(`请填写第 ${i + 1} 头犊牛不留养原因`);
      }
      if (!c.earTag.trim()) return toast.error(`请填写第 ${i + 1} 头犊牛的耳号`);
      if (c.sex === "母" && !c.rfid.trim()) return toast.error(`请填写第 ${i + 1} 头犊牛的电子耳标编号`);
      if (!c.feedCode.trim()) return toast.error(`请填写第 ${i + 1} 头犊牛的初乳编码`);
      if (!c.feedAmount) return toast.error(`请填写第 ${i + 1} 头犊牛的初乳饲喂量`);
      if (!c.feedTemp) return toast.error(`请填写第 ${i + 1} 头犊牛的初乳温度`);
      if (!c.feedTech.trim()) return toast.error(`请填写第 ${i + 1} 头犊牛的技术员`);
    }

    toast.success("产犊记录已保存");
    onDone();
  };

  return (
    <MobileShell title={`#${id} · 产犊记录`} back hideTabBar>
      <div className="pb-24 px-4 pt-3 space-y-3">
        {/* ============ 母牛产犊记录 ============ */}
        <section className="rounded-2xl bg-card border border-border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-card-title text-foreground">母牛产犊记录</h3>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-3 rounded-xl bg-muted/40 p-3">
            <AutoField label="怀孕时间" value={`${pregnancyDays} 天`} />
            <AutoField label="胎次" value={`第 ${parity} 胎`} />
            <AutoField label="冻精品种" value={semenBreed} />
            <AutoField label="产犊时间" value={calvingTime} />
          </div>

          <Field label="产犊难易度评分" required>
            <ScoreRow max={4} value={difficulty} onChange={setDifficulty} />
            <div className="text-caption text-text-tertiary mt-1">
              {difficulty == null
                ? "0 分：无助产　4 分：极难产"
                : ["0 - 顺产", "1 - 轻度助产", "2 - 助产", "3 - 难产", "4 - 剖腹产"][difficulty]}
            </div>
          </Field>
          <Field label="产道损伤等级" required>
            <ScoreRow min={1} max={3} value={injury} onChange={setInjury} />
            <div className="text-caption text-text-tertiary mt-1">
              {injury == null
                ? "1 分：轻度　3 分：重度"
                : ["", "1 - 外阴背连合处或外阴/阴道外侧壁小于 2cm 的撕裂伤", "2 - 外阴背连合处或外阴/阴道外侧壁大于 2cm 的撕裂伤，或两者兼有", "3 - 重度拉伤，阴道深层组织、子宫颈撕裂"][injury]}
            </div>
          </Field>

        </section>

        {/* ============ 初乳采集（独立板块） ============ */}
        <section className="rounded-2xl bg-card border border-border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-card-title text-foreground">初乳采集</h3>
          </div>

          <Field label="用途" required>
            <div className="grid grid-cols-3 gap-2">
              {(["饲喂", "储存", "废弃"] as const).map((k) => (
                <ChoiceBtn key={k} label={k} active={colUse === k} onClick={() => setColUse(k)} />
              ))}
            </div>
          </Field>

          <Field label="初乳编码">
            <input value={colCode} readOnly className={`${inputCls} bg-muted/40 text-text-secondary`} />
            <div className="text-caption text-text-tertiary mt-1">系统自动生成</div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="初乳量 (L)" required>
              <input
                type="number"
                inputMode="decimal"
                value={colAmount}
                onChange={(e) => setColAmount(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="袋号" required>
              <input
                type="number"
                inputMode="numeric"
                value={colBag}
                onChange={(e) => setColBag(e.target.value)}
                className={inputCls}
                placeholder="采集袋数"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="白利度 (%)" required>
              <input
                type="number"
                inputMode="decimal"
                value={colBrix}
                onChange={(e) => setColBrix(e.target.value)}
                className={inputCls}
                placeholder="输入白利度"
              />
            </Field>
            <Field label="初乳质量" required>
              <div className="grid grid-cols-3 gap-2">
                {(["好", "一般", "坏"] as const).map((q) => (
                  <ChoiceBtn key={q} label={q} active={colQuality === q} onClick={() => {}} disabled />
                ))}
              </div>
            </Field>
          </div>
        </section>



        {/* ============ 犊牛登记 ============ */}
        {calves.map((c, idx) => (
          <section key={c.id} className="rounded-2xl bg-card border border-border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-card-title text-foreground">犊牛登记 · {idx + 1}</h3>
              {calves.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeCalf(idx)}
                  className="text-caption text-[var(--state-danger)]"
                >
                  移除
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-3 rounded-xl bg-muted/40 p-3">
              <div>
                <div className="text-caption text-text-tertiary mb-1.5">
                  牛只耳号<span className="text-[var(--state-danger)] ml-0.5">*</span>
                </div>
                <input
                  value={c.earTag}
                  onChange={(e) => updateCalf(idx, { earTag: e.target.value })}
                  className={`${inputCls} font-mono`}
                  placeholder="请输入耳号"
                />
                <div className="text-caption text-text-tertiary mt-1">系统自动生成，耳标丢失/损坏可手动修改</div>
              </div>
              <div>
                <div className="text-caption text-text-tertiary mb-1.5">出生日期</div>
                <div className="h-11 flex items-center text-body-sm text-foreground font-mono">{c.birthDate}</div>
              </div>
            </div>


            <Field label="分娩状态" required>
              <div className="grid grid-cols-2 gap-2">
                {(["正常", "死胎"] as const).map((k) => {
                  const active = c.status === k;
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => updateCalf(idx, { status: k })}
                      className={`w-full h-11 px-2 inline-flex items-center gap-2 text-body-sm text-left ${
                        active ? "text-foreground" : "text-text-secondary"
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full border inline-flex items-center justify-center shrink-0 ${
                          active ? "border-primary" : "border-border"
                        }`}
                      >
                        {active && <span className="w-2 h-2 rounded-full bg-primary" />}
                      </span>
                      <span className={active ? "font-medium" : ""}>{k}</span>
                    </button>
                  );
                })}
              </div>
            </Field>

            {c.status === "正常" && (
              <>
                <Field label="品种" required>
                  <button
                    type="button"
                    onClick={() => setBreedPickerIdx(idx)}
                    className="w-full h-11 px-3 rounded-lg border border-border bg-card flex items-center justify-between text-left"
                  >
                    <span className={c.breed ? "text-body-sm text-foreground" : "text-body-sm text-text-tertiary"}>
                      {c.breed || "请选择"}
                    </span>
                    <span className="text-text-tertiary">›</span>
                  </button>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="性别" required>
                    <div className="grid grid-cols-2 gap-2">
                      {(["母", "公"] as const).map((k) => {
                        const active = c.sex === k;
                        return (
                          <button
                            key={k}
                            type="button"
                            onClick={() => updateCalf(idx, { sex: k })}
                            className={`w-full h-11 px-2 inline-flex items-center gap-2 text-body-sm text-left ${
                              active ? "text-foreground" : "text-text-secondary"
                            }`}
                          >
                            <span
                              className={`w-4 h-4 rounded-full border inline-flex items-center justify-center shrink-0 ${
                                active ? "border-primary" : "border-border"
                              }`}
                            >
                              {active && <span className="w-2 h-2 rounded-full bg-primary" />}
                            </span>
                            <span className={active ? "font-medium" : ""}>{k}</span>
                          </button>
                        );
                      })}
                    </div>
                  </Field>
                  <Field label="犊牛体重 (kg)" required>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={c.weight}
                      onChange={(e) => updateCalf(idx, { weight: e.target.value })}
                      className={inputCls}
                    />
                  </Field>
                </div>

                {c.sex === "母" && (
                  <Field label="电子耳标编号" required>
                    <input
                      value={c.rfid}
                      onChange={(e) => updateCalf(idx, { rfid: e.target.value })}
                      className={`${inputCls} font-mono`}
                      placeholder="请输入或扫描电子耳标编号"
                    />
                  </Field>
                )}



                {/* ---- 初乳饲喂记录 ---- */}
                <div className="pt-1 space-y-4">
                  
                  <Field label="初乳编码" required>
                    <input
                      value={c.feedCode}
                      onChange={(e) => updateCalf(idx, { feedCode: e.target.value })}
                      className={inputCls}
                      placeholder={`如：${colCode}`}
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="初乳饲喂量 (L)" required>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={c.feedAmount}
                        onChange={(e) => updateCalf(idx, { feedAmount: e.target.value })}
                        className={inputCls}
                        placeholder="建议 ≥ 4L"
                      />
                    </Field>
                    <Field label="初乳温度 (℃)" required>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={c.feedTemp}
                        onChange={(e) => updateCalf(idx, { feedTemp: e.target.value })}
                        className={inputCls}
                        placeholder="建议 38~40℃"
                      />
                    </Field>
                  </div>
                  <Field label="饲喂照片">
                    <MediaGrid
                      items={c.feedMedia}
                      setItems={(u) =>
                        updateCalf(idx, { feedMedia: typeof u === "function" ? (u as any)(c.feedMedia) : u })
                      }
                      max={6}
                    />
                  </Field>

                  <Field label="技术员" required>
                    <button
                      type="button"
                      onClick={() => setTechPickerIdx(idx)}
                      className="w-full h-11 px-3 rounded-lg border border-border bg-card flex items-center justify-between text-left"
                    >
                      <span className={c.feedTech ? "text-body-sm text-foreground" : "text-body-sm text-text-tertiary"}>
                        {c.feedTech || "请选择技术员"}
                      </span>
                      <span className="text-text-tertiary">›</span>
                    </button>
                  </Field>
                </div>

                <Field label="是否留养" required>
                  <div className="grid grid-cols-2 gap-2">
                    {(["留养", "不留养"] as const).map((k) => {
                      const active = c.keep === k;
                      return (
                        <button
                          key={k}
                          type="button"
                          onClick={() => updateCalf(idx, { keep: k })}
                          className={`w-full h-11 px-2 inline-flex items-center gap-2 text-body-sm text-left ${
                            active ? "text-foreground" : "text-text-secondary"
                          }`}
                        >
                          <span
                            className={`w-4 h-4 rounded-full border inline-flex items-center justify-center shrink-0 ${
                              active ? "border-primary" : "border-border"
                            }`}
                          >
                            {active && <span className="w-2 h-2 rounded-full bg-primary" />}
                          </span>
                          <span className={active ? "font-medium" : ""}>{k}</span>
                        </button>
                      );
                    })}
                  </div>
                </Field>
                {c.keep === "留养" && (
                  <Field label="转入牛舍" required>
                    <button
                      type="button"
                      onClick={() => setBarnPickerIdx(idx)}
                      className="w-full h-11 px-3 rounded-lg border border-border bg-card flex items-center justify-between text-left"
                    >
                      <span className={c.targetBarn ? "text-body-sm text-foreground" : "text-body-sm text-text-tertiary"}>
                        {c.targetBarn || "请选择"}
                      </span>
                      <span className="text-text-tertiary">›</span>
                    </button>
                  </Field>
                )}

              </>
            )}


            {(c.status === "死胎" || (c.status === "正常" && c.keep === "不留养")) && (
              <div className="space-y-3">
                <Field label="现场照片 / 视频" required>
                  <MediaGrid items={c.media} setItems={(u) => updateCalf(idx, { media: typeof u === "function" ? (u as any)(c.media) : u })} max={6} />
                </Field>
                <Field label={c.status === "死胎" ? "死胎原因" : "不留养原因"} required>
                  <textarea
                    value={c.reason}
                    onChange={(e) => updateCalf(idx, { reason: e.target.value })}
                    rows={3}
                    className="w-full p-3 rounded-lg border border-border bg-card text-body-sm text-foreground outline-none focus:border-primary resize-none"
                    placeholder={c.status === "死胎" ? "如：脐带绕颈、难产窒息、畸形等" : "如：畸形、体弱、经济价值低等"}
                  />
                </Field>
              </div>
            )}
          </section>
        ))}

        <button
          type="button"
          onClick={() => setCalves((l) => [...l, newCalf(l.length)])}
          className="w-full h-11 rounded-xl border border-dashed border-border text-body-sm text-text-secondary bg-card"
        >
          + 添加一头犊牛
        </button>
      </div>
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] bg-card border-t border-border p-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
        <button
          type="button"
          onClick={submit}
          className="w-full h-12 rounded-2xl bg-primary text-primary-foreground text-body font-semibold"
        >
          保存产犊记录
        </button>
      </div>

      <Sheet open={breedPickerIdx !== null} onOpenChange={(o) => !o && setBreedPickerIdx(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl p-0 max-h-[70vh] flex flex-col">
          <SheetHeader className="px-4 pt-4 pb-2">
            <SheetTitle className="text-section">选择品种</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-2 py-2">
            {BREEDS.map((k) => {
              const current = breedPickerIdx !== null ? calves[breedPickerIdx]?.breed : "";
              const on = current === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    if (breedPickerIdx !== null) updateCalf(breedPickerIdx, { breed: k });
                    setBreedPickerIdx(null);
                  }}
                  className="w-full flex items-center justify-between px-3 py-3 rounded-lg hover:bg-muted/40 text-left"
                >
                  <span className="text-body text-foreground">{k}</span>
                  {on && <Check className="w-4 h-4 text-primary" strokeWidth={3} />}
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={barnPickerIdx !== null} onOpenChange={(o) => !o && setBarnPickerIdx(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl p-0 max-h-[70vh] flex flex-col">
          <SheetHeader className="px-4 pt-4 pb-2">
            <SheetTitle className="text-section">选择转入牛舍</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-2 py-2">
            {CALF_BARNS.map((k) => {
              const current = barnPickerIdx !== null ? calves[barnPickerIdx]?.targetBarn : "";
              const on = current === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    if (barnPickerIdx !== null) updateCalf(barnPickerIdx, { targetBarn: k });
                    setBarnPickerIdx(null);
                  }}
                  className="w-full flex items-center justify-between px-3 py-3 rounded-lg hover:bg-muted/40 text-left"
                >
                  <span className="text-body text-foreground">{k}</span>
                  {on && <Check className="w-4 h-4 text-primary" strokeWidth={3} />}
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={techPickerIdx !== null} onOpenChange={(o) => !o && setTechPickerIdx(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl p-0 max-h-[70vh] flex flex-col">
          <SheetHeader className="px-4 pt-4 pb-2">
            <SheetTitle className="text-section">选择技术员</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-2 py-2">
            {TECHNICIANS.map((k) => {
              const current = techPickerIdx !== null ? calves[techPickerIdx]?.feedTech : "";
              const on = current === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    if (techPickerIdx !== null) updateCalf(techPickerIdx, { feedTech: k });
                    setTechPickerIdx(null);
                  }}
                  className="w-full flex items-center justify-between px-3 py-3 rounded-lg hover:bg-muted/40 text-left"
                >
                  <span className="text-body text-foreground">{k}</span>
                  {on && <Check className="w-4 h-4 text-primary" strokeWidth={3} />}
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </MobileShell>
  );
}

function AutoField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-caption text-text-tertiary mb-0.5">{label}</div>
      <div className={`text-body-sm text-foreground ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}

function ChoiceBtn({
  label,
  active,
  onClick,
  disabled,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`h-10 rounded-lg text-body-sm ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-card border border-border text-text-secondary disabled:opacity-60 disabled:cursor-not-allowed"
      }`}
    >
      {label}
    </button>
  );
}

function ScoreRow({
  min = 0,
  max,
  value,
  onChange,
}: {
  min?: number;
  max: number;
  value: number | null;
  onChange: (n: number) => void;
}) {
  const items: number[] = [];
  for (let i = min; i <= max; i++) items.push(i);
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`w-10 h-10 shrink-0 rounded-full text-body-sm inline-flex items-center justify-center ${
            value === n ? "bg-primary text-primary-foreground font-bold" : "bg-card border border-border text-text-secondary"
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}



function LeaveForm({ id, onDone }: { id: string; onDone: () => void }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState<"淘汰" | "死亡" | "出售" | "转场">("淘汰");
  const [detail, setDetail] = useState("");
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");
  const [media, setMedia] = useState<number[]>([]);

  const submit = () => {
    if (!date) return toast.error("请选择离场日期");
    if (!detail) return toast.error("请填写离场原因/详情");
    if (media.length === 0) return toast.error("请上传或拍摄现场照片 / 视频");
    toast.success("离场记录已保存");
    onDone();
  };


  const reasons = ["淘汰", "死亡", "出售", "转场"] as const;

  return (
    <MobileShell title={`#${id} · 离场记录`} back hideTabBar>
      <div className="pb-24">
        <div className="px-4 mt-4 space-y-4">

          <Field label="离场日期" required>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
          </Field>
          <Field label="离场类型" required>
            <div className="grid grid-cols-4 gap-2">
              {reasons.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setReason(k)}
                  className={`h-10 rounded-lg text-body-sm ${
                    reason === k
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border text-text-secondary"
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
          </Field>
          <Field label={reason === "死亡" ? "死亡原因" : reason === "出售" ? "买方 / 去向" : "详情"} required>
            <input
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              className={inputCls}
              placeholder={
                reason === "死亡"
                  ? "如：乳房炎并发症"
                  : reason === "出售"
                  ? "如：XX 屠宰场"
                  : reason === "转场"
                  ? "目标牧场"
                  : "淘汰原因"
              }
            />
          </Field>
          {(reason === "出售" || reason === "淘汰") && (
            <Field label="金额 (元)">
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className={inputCls} />
            </Field>
          )}
          <div>
            <MediaGrid
              items={media}
              setItems={setMedia}
              max={9}
              required
              caption="现场照片 / 视频"
              helper="离场事件需上传或拍摄现场材料，用于业务回溯追责"
            />
          </div>
          <Field label="备注">

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full p-3 rounded-lg border border-border bg-card text-body-sm text-foreground outline-none focus:border-primary resize-none"
              placeholder="补充说明"
            />
          </Field>
        </div>
      </div>
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] bg-card border-t border-border p-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
        <button
          type="button"
          onClick={submit}
          className="w-full h-12 rounded-2xl bg-primary text-primary-foreground text-body font-semibold"
        >
          保存离场记录
        </button>
      </div>
    </MobileShell>
  );
}

type ExamKey = "temp" | "discharge" | "ketosis" | "urineph" | "pregnancy";
const EXAM_ITEMS: { key: ExamKey; label: string; unit?: string; hint?: string }[] = [
  { key: "temp", label: "体温检查", unit: "℃", hint: "正常 38.0 ~ 39.3" },
  { key: "discharge", label: "子宫分泌物检查", hint: "1 分（清亮）~ 5 分（脓性恶臭）" },
  { key: "ketosis", label: "酮病检查", unit: "mmol/L", hint: "血酮 ≥ 1.2 提示亚临床酮病" },
  { key: "urineph", label: "尿液 PH 值检查", hint: "正常 7.8 ~ 8.4" },
  { key: "pregnancy", label: "孕检" },
];

function ExamForm({
  id,
  item,
  onDone,
}: {
  id: string;
  item?: string;
  onDone: () => void;
}) {
  const preset = EXAM_ITEMS.find(
    (it) => item && (it.label === item || item.includes(it.label.slice(0, 2))),
  )?.key;
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [active, setActive] = useState<Record<ExamKey, boolean>>({
    temp: preset ? preset === "temp" : true,
    discharge: preset === "discharge",
    ketosis: preset === "ketosis",
    urineph: preset === "urineph",
    pregnancy: preset === "pregnancy",
  });

  const [pickerOpen, setPickerOpen] = useState(false);
  const [temp, setTemp] = useState("");
  const [discharge, setDischarge] = useState<number | null>(null);
  const [ketosis, setKetosis] = useState("");
  const [urineph, setUrineph] = useState("");
  const [pregnancy, setPregnancy] = useState<"有" | "无" | null>(null);
  const [note, setNote] = useState("");
  const [media, setMedia] = useState<number[]>([]);


  const toggle = (k: ExamKey) => setActive((s) => ({ ...s, [k]: !s[k] }));
  const chosenKeys = (Object.keys(active) as ExamKey[]).filter((k) => active[k]);
  const chosenLabels = chosenKeys.map((k) => EXAM_ITEMS.find((it) => it.key === k)!.label);

  const submit = () => {
    if (!date) return toast.error("请选择检查日期");
    if (chosenKeys.length === 0) return toast.error("请至少选择一项检查项目");
    if (active.temp && !temp) return toast.error("请输入体温");
    if (active.discharge && discharge == null) return toast.error("请选择子宫分泌物评分");
    if (active.ketosis && !ketosis) return toast.error("请输入酮病检查数值");
    if (active.urineph && !urineph) return toast.error("请输入尿液 PH 值");
    if (active.pregnancy && !pregnancy) return toast.error("请选择孕检结果");
    toast.success("基础检查已保存");
    onDone();
  };

  return (
    <MobileShell title={`#${id} · 基础检查`} back hideTabBar>
      <div className="pb-24">
        <div className="px-4 mt-4 space-y-4">
          <Field label="检查日期" required>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
          </Field>
          <Field label="检查项目" required>
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="w-full h-11 px-3 rounded-lg border border-border bg-card flex items-center justify-between text-left"
            >
              {chosenLabels.length === 0 ? (
                <span className="text-body-sm text-text-tertiary">请选择检查项目</span>
              ) : (
                <span className="text-body-sm text-foreground truncate pr-2">
                  {chosenLabels.join("、")}
                </span>
              )}
              <span className="text-caption text-text-tertiary shrink-0">
                {chosenLabels.length > 0 ? `已选 ${chosenLabels.length} 项` : "选择"} ›
              </span>
            </button>
          </Field>


          {active.temp && (
            <Field label="体温 (℃)" required>
              <input type="number" step="0.1" value={temp} onChange={(e) => setTemp(e.target.value)} className={inputCls} />
              <div className="text-caption text-text-tertiary mt-1">正常 38.0 ~ 39.3 ℃</div>
            </Field>
          )}
          {active.discharge && (
            <Field label="子宫分泌物评分" required>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setDischarge(n)}
                    className={`w-10 h-10 shrink-0 rounded-full text-body-sm inline-flex items-center justify-center ${
                      discharge === n
                        ? "bg-primary text-primary-foreground font-bold"
                        : "bg-card border border-border text-text-secondary"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div className="text-caption text-text-tertiary mt-1">1 分：清亮透明　5 分：脓性恶臭</div>
            </Field>
          )}
          {active.ketosis && (
            <Field label="酮病检查 (mmol/L)" required>
              <input type="number" step="0.1" value={ketosis} onChange={(e) => setKetosis(e.target.value)} className={inputCls} />
              <div className="text-caption text-text-tertiary mt-1">血酮 ≥ 1.2 提示亚临床酮病</div>
            </Field>
          )}
          {active.urineph && (
            <Field label="尿液 PH 值" required>
              <input type="number" step="0.1" value={urineph} onChange={(e) => setUrineph(e.target.value)} className={inputCls} />
              <div className="text-caption text-text-tertiary mt-1">正常 7.8 ~ 8.4</div>
            </Field>
          )}
          {active.pregnancy && (
            <Field label="孕检结果" required>
              <div className="grid grid-cols-2 gap-2">
                {(["有", "无"] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setPregnancy(k)}
                    className={`h-11 rounded-lg text-body-sm ${
                      pregnancy === k
                        ? "bg-primary text-primary-foreground"
                        : "bg-card border border-border text-text-secondary"
                    }`}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </Field>
          )}


          <Field label="现场影像">
            <MediaGrid items={media} setItems={setMedia} />
            <div className="text-caption text-text-tertiary mt-1">可拍摄或上传照片 / 视频</div>
          </Field>


          <Field label="备注">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full p-3 rounded-lg border border-border bg-card text-body-sm text-foreground outline-none focus:border-primary resize-none"
              placeholder="补充说明"
            />
          </Field>

        </div>
      </div>
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] bg-card border-t border-border p-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
        <button
          type="button"
          onClick={submit}
          className="w-full h-12 rounded-2xl bg-primary text-primary-foreground text-body font-semibold"
        >
          保存基础检查
        </button>
      </div>

      <Sheet open={pickerOpen} onOpenChange={setPickerOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl p-0 max-h-[80vh] flex flex-col">
          <SheetHeader className="px-4 pt-4 pb-2">
            <SheetTitle className="text-section">选择检查项目</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-2 py-2">
            {EXAM_ITEMS.map((it) => {
              const on = active[it.key];
              return (
                <button
                  key={it.key}
                  type="button"
                  onClick={() => toggle(it.key)}
                  className="w-full flex items-center justify-between px-3 py-3 rounded-lg hover:bg-muted/40 text-left"
                >
                  <div className="flex flex-col">
                    <span className="text-body text-foreground">{it.label}</span>
                    {it.hint && <span className="text-caption text-text-tertiary mt-0.5">{it.hint}</span>}
                  </div>
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      on ? "bg-primary text-primary-foreground" : "border border-border"
                    }`}
                  >
                    {on && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="p-3 border-t border-border">
            <button
              type="button"
              onClick={() => setPickerOpen(false)}
              className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-body font-semibold"
            >
              确定{chosenKeys.length > 0 ? `（${chosenKeys.length}）` : ""}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </MobileShell>

  );
}
