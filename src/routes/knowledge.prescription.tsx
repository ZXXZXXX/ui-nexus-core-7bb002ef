import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  FileText,
  Plus,
  Search,
  Filter,
  Pencil,
  Trash2,
  X,
  MoreHorizontal,
  Check,
  Pill,
  ClipboardList,
  Stethoscope,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { StatScopeCard, prescriptionStats } from "@/components/stat-scope-card";
import { PRESCRIPTION_SEED, RX_DRUG_CATALOG } from "@/lib/prescription-kb";

export const Route = createFileRoute("/knowledge/prescription")({
  head: () => ({ meta: [{ title: "处方管理 — 奇点智牧" }] }),
  component: PrescriptionPage,
});

// ---------- 数据模型 ----------

type RxKind = "disease" | "postpartum" | "drying" | "immune" | "deworm" | "hoof";
const RX_KIND_LABEL: Record<RxKind, string> = {
  disease: "疾病处方",
  postpartum: "产后护理",
  drying: "干奶处方",
  immune: "免疫处方",
  deworm: "驱虫处方",
  hoof: "修蹄处方",
};

/** 处方所属类型可维护选项（含“全部”） */
const RX_OWNER_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "disease", label: "疾病处方" },
  { value: "postpartum", label: "产后护理" },
  { value: "drying", label: "干奶处方" },
  { value: "immune", label: "免疫处方" },
  { value: "deworm", label: "驱虫处方" },
  { value: "hoof", label: "修蹄处方" },
];
const ownerTypeLabel = (k: string) =>
  RX_OWNER_TYPE_OPTIONS.find((o) => o.value === k)?.label ?? "—";

type TimeSlot = { morning: number; noon: number; evening: number };
const defaultSlot = (freq: number): TimeSlot => {
  if (freq <= 1) return { morning: 1, noon: 0, evening: 0 };
  if (freq === 2) return { morning: 1, noon: 0, evening: 1 };
  return { morning: 1, noon: 1, evening: 1 };
};

type Freq = { n: number; m: number }; // n 天 m 次

type Route1 = "肌肉注射" | "静脉注射" | "乳注" | "口服" | "局部用药" | "皮下注射" | "子宫灌注";
const ROUTE_OPTS: Route1[] = ["肌肉注射", "静脉注射", "皮下注射", "乳注", "子宫灌注", "口服", "局部用药"];

type VarKind = "weight" | "quarter" | "custom";
const VAR_LABEL: Record<VarKind, string> = {
  weight: "体重区间",
  quarter: "非盲乳数",
  custom: "自定义变量",
};

type DoseMap = { option: string; dose: string }[]; // 变量选项 → 剂量/次

type DrugRef = {
  name: string;
  spec: string;
  // 替代药品可单独设置与主选药品完全一致的字段（留空则沿用主选）
  route?: Route1;
  days?: number;
  freq?: Freq;
  slotOn?: boolean;
  slot?: TimeSlot;
  variable?: boolean;
  variableKind?: VarKind;
  dose?: string; // 固定剂量
  varDose?: DoseMap;
};

type DrugDetail = {
  id: string;
  drugs: DrugRef[]; // 可替代药品组
  drugType?: string; // 药品档案带出，只读
  routes: Route1[];
  days: number;
  freq: Freq;
  slotOn: boolean;
  slot: TimeSlot;
  variable: boolean;
  variableKind?: VarKind;
  fixedDose?: string; // 固定剂量
  varDose?: DoseMap;
};

type TaskType = "检查" | "理疗" | "护理" | "观察" | "外科处置" | "其他";
type RecordWay = "文本输入" | "数字输入" | "图片视频" | "评分" | "无需记录";

type TaskDetail = {
  id: string;
  name: string;
  type: TaskType;
  action: string;
  record: RecordWay;
  days: number;
  freq: Freq;
  slotOn: boolean;
  slot: TimeSlot;
};

type ReviewCfg = {
  on: boolean;
  days: number;
  freq: Freq;
  slotOn: boolean;
  slot: TimeSlot;
  desc: string;
  transferOn: boolean;
  deadline: "24h" | "48h";
};

type Rx = {
  id: string;
  code: string; // RX-000001
  kind: RxKind;
  category: string; // 疾病类型 / 事项类型
  subType: string; // 疾病子类型 / 事项名称
  intro?: string;
  name: string;
  desc?: string;
  duration: number; // 天
  summaryAuto: boolean;
  summary?: string;
  extra?: string;
  drugs: DrugDetail[];
  tasks: TaskDetail[];
  review: ReviewCfg;
  author: string;
  updated: string;
  diseaseCode?: string;
  enabled?: boolean;
};

// ---------- catalog ----------

const DRUG_CATALOG: DrugRef[] = RX_DRUG_CATALOG;

const drugKey = (d: DrugRef) => `${d.name}｜${d.spec}`;

function defaultReview(kind: RxKind): ReviewCfg {
  const isDisease = kind === "disease";
  const isDry = kind === "drying";
  const on = isDisease || isDry;
  return {
    on,
    days: isDry ? 3 : 1,
    freq: { n: 1, m: 1 },
    slotOn: false,
    slot: { morning: 1, noon: 0, evening: 0 },
    desc: isDry ? "干奶复查" : "治疗复查",
    transferOn: true,
    deadline: "24h",
  };
}

function newDrug(): DrugDetail {
  return {
    id: crypto.randomUUID(),
    drugs: [],
    routes: [],
    days: 3,
    freq: { n: 1, m: 1 },
    slotOn: false,
    slot: { morning: 1, noon: 0, evening: 0 },
    variable: false,
    fixedDose: "",
  };
}

function newTask(): TaskDetail {
  return {
    id: crypto.randomUUID(),
    name: "",
    type: "检查",
    action: "",
    record: "文本输入",
    days: 3,
    freq: { n: 1, m: 1 },
    slotOn: false,
    slot: { morning: 1, noon: 0, evening: 0 },
  };
}

// ---------- 种子 ----------

const seed: Rx[] = PRESCRIPTION_SEED as unknown as Rx[];


// ---------- 摘要拼接 ----------

function drugSummary(d: DrugDetail): string {
  if (!d.drugs.length) return "";
  const name = d.drugs[0].name;
  const dose = d.variable
    ? d.variableKind === "weight"
      ? "按体重计算"
      : d.variableKind === "quarter"
      ? "按非盲乳数计算"
      : "按自定义变量计算"
    : d.fixedDose || "";
  const route = d.routes.join("/") || "";
  const freq = `${d.freq.n}天${d.freq.m}次`;
  return [name, dose, route, freq, `连续${d.days}天`].filter(Boolean).join("，");
}

function taskSummary(t: TaskDetail): string {
  return [t.name, t.action, `${t.freq.n}天${t.freq.m}次`, `连续${t.days}天`].filter(Boolean).join("，");
}

function buildSummary(r: Rx): string {
  const parts = [
    ...r.drugs.map(drugSummary),
    ...r.tasks.map(taskSummary),
    r.review.on ? `复查${r.review.days}天` : "",
  ].filter(Boolean);
  return parts.join("；");
}

// ---------- 主页面 ----------

function PrescriptionPage() {
  const [list, setList] = useState<Rx[]>(seed);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Rx | null>(null);
  const [viewing, setViewing] = useState<Rx | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string[] | null>(null);
  const [kindFilter, setKindFilter] = useState<RxKind | "all">("all");

  const shown = useMemo(
    () => (kindFilter === "all" ? list : list.filter((r) => r.kind === kindFilter)),
    [list, kindFilter],
  );

  const allChecked = shown.length > 0 && selected.size === shown.length;
  const someChecked = selected.size > 0 && !allChecked;

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const toggleAll = () => setSelected(allChecked ? new Set() : new Set(shown.map((r) => r.id)));

  const confirmDelete = () => {
    if (!pendingDelete) return;
    setList((prev) => prev.filter((r) => !pendingDelete.includes(r.id)));
    setSelected((prev) => {
      const next = new Set(prev);
      pendingDelete.forEach((id) => next.delete(id));
      return next;
    });
    toast.success(`已删除 ${pendingDelete.length} 条处方`);
    setPendingDelete(null);
  };

  const saveEdit = () => {
    if (!editing) return;
    if (editing.drugs.length + editing.tasks.length === 0) {
      toast.error("用药明细与非用药明细至少需要 1 条");
      return;
    }
    if (!editing.name.trim()) {
      toast.error("请填写处方名称");
      return;
    }
    setList((prev) => {
      const exists = prev.some((r) => r.id === editing.id);
      return exists ? prev.map((r) => (r.id === editing.id ? editing : r)) : [editing, ...prev];
    });
    toast.success("已保存");
    setEditing(null);
  };

  const startCreate = () => {
    const maxCode = list.reduce((m, r) => {
      const n = Number(r.code.replace("RX-", ""));
      return Number.isFinite(n) ? Math.max(m, n) : m;
    }, 0);
    const code = `RX-${String(maxCode + 1).padStart(6, "0")}`;
    const kind: RxKind = "disease";
    setEditing({
      id: crypto.randomUUID(),
      code,
      kind,
      category: "",
      subType: "",
      name: "",
      duration: 5,
      summaryAuto: true,
      drugs: [newDrug()],
      tasks: [],
      review: defaultReview(kind),
      author: "当前用户",
      updated: new Date().toISOString().slice(0, 10),
    });
  };

  const batchEdit = () => {
    if (selected.size === 1) {
      const one = list.find((r) => r.id === Array.from(selected)[0]);
      if (one) setEditing(structuredClone(one));
    } else {
      toast.info("批量编辑仅支持单条");
    }
  };

  const headerCheckRef = useMemo(
    () => (el: HTMLButtonElement | null) => {
      if (el) (el as unknown as { dataset: DOMStringMap }).dataset.indeterminate = someChecked ? "true" : "false";
    },
    [someChecked],
  );

  return (
    <>
      <AppHeader title="处方管理" breadcrumb={["诊疗管理", "处方管理"]} />
      <main className="flex-1 px-6 py-6 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary" />
              <Input placeholder="搜索处方 / 编码 / 疾病" className="h-9 w-72 pl-9 text-body-sm" />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1.5 text-body-sm font-normal">
                  <Filter className="h-3.5 w-3.5" />
                  {kindFilter === "all" ? "处方类型" : RX_KIND_LABEL[kindFilter]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-36">
                <DropdownMenuItem onClick={() => setKindFilter("all")} className="justify-between">
                  全部类型
                  {kindFilter === "all" && <Check className="h-3.5 w-3.5 text-primary" />}
                </DropdownMenuItem>
                {(Object.keys(RX_KIND_LABEL) as RxKind[]).map((k) => (
                  <DropdownMenuItem key={k} onClick={() => setKindFilter(k)} className="justify-between">
                    {RX_KIND_LABEL[k]}
                    {kindFilter === k && <Check className="h-3.5 w-3.5 text-primary" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Button
            size="sm"
            className="h-9 gap-1.5 text-body-sm font-normal bg-primary hover:bg-[var(--brand-hover)] text-primary-foreground"
            onClick={startCreate}
          >
            <Plus className="h-3.5 w-3.5" /> 新建处方
          </Button>
        </div>

        {selected.size > 0 && (
          <div className="flex items-center justify-between gap-3 px-4 h-11 rounded-md border border-primary/30 bg-brand-subtle">
            <span className="text-body-sm text-foreground">已选 {selected.size} 项</span>
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-body-sm font-normal" onClick={batchEdit}>
                <Pencil className="h-3.5 w-3.5" /> 批量编辑
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-body-sm font-normal text-[var(--state-danger)] hover:text-[var(--state-danger)] hover:bg-[color-mix(in_oklab,var(--state-danger)_8%,transparent)]"
                onClick={() => setPendingDelete(Array.from(selected))}
              >
                <Trash2 className="h-3.5 w-3.5" /> 批量删除
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1 text-body-sm font-normal text-text-tertiary"
                onClick={() => setSelected(new Set())}
              >
                <X className="h-3.5 w-3.5" /> 取消
              </Button>
            </div>
          </div>
        )}

        <Card className="border-border bg-card overflow-hidden">
          <div className="flex items-center gap-4 px-6 h-12 text-table-header text-text-secondary border-b border-border bg-surface-subtle">
            <Checkbox ref={headerCheckRef} checked={allChecked} onCheckedChange={toggleAll} aria-label="全选" />
            <div className="grid grid-cols-[110px_1fr_1fr_2fr_80px] gap-4 flex-1 min-w-0">
              <div>处方编码</div>
              <div>处方名称</div>
              <div>处方所属类型</div>
              <div>用药摘要</div>
              <div>疗程</div>
            </div>
            <div className="w-[160px] text-right shrink-0">功能</div>
          </div>
          {shown.map((r) => {
            const checked = selected.has(r.id);
            const drugText =
              r.drugs.map((d) => d.drugs[0]?.name).filter(Boolean).join("、") || "—";
            return (
              <div
                key={r.id}
                className={`flex items-center gap-4 px-6 h-12 text-table-cell border-b border-border last:border-0 ${
                  checked ? "bg-brand-subtle/60" : "hover:bg-surface-subtle"
                }`}
              >
                <Checkbox checked={checked} onCheckedChange={() => toggleOne(r.id)} aria-label={`选择 ${r.name}`} />
                <div className="grid grid-cols-[110px_1fr_1fr_2fr_80px] gap-4 flex-1 min-w-0">
                  <div className="font-mono text-body text-foreground truncate">{r.code}</div>
                  <div className="flex items-center gap-1.5 text-body text-foreground truncate">
                    <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="truncate">{r.name}</span>
                  </div>
                  <div className="truncate flex items-center">
                    <span className="tag tag-brand shrink-0">{ownerTypeLabel(r.kind)}</span>
                  </div>
                  <div className="text-body-sm text-text-secondary truncate">{drugText}</div>
                  <div className="text-body-sm text-text-secondary truncate">{r.duration} 天</div>
                </div>
                <div className="w-[160px] shrink-0 flex justify-end items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-body-sm font-normal text-text-secondary hover:bg-surface-subtle hover:text-foreground"
                    onClick={() => setViewing(r)}
                  >
                    查看
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-body-sm font-normal text-primary hover:bg-brand-subtle hover:text-primary"
                    onClick={() => setEditing(structuredClone(r))}
                  >
                    编辑
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-text-secondary hover:bg-surface-subtle hover:text-foreground"
                        aria-label="更多操作"
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-32">
                      <DropdownMenuItem
                        className="text-[var(--state-danger)] focus:text-[var(--state-danger)]"
                        onClick={() => setPendingDelete([r.id])}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" /> 删除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </Card>
      </main>

      {/* 编辑抽屉 */}
      <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent side="right" className="w-full sm:w-1/2 sm:max-w-none bg-white flex flex-col gap-0 p-0 overflow-hidden">
          <SheetHeader className="px-6 pt-6 pb-2">
            <SheetTitle className="text-section-title">
              {list.some((r) => r.id === editing?.id) ? "编辑处方" : "新建处方"}
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-2">
            {editing && <PrescriptionForm value={editing} onChange={setEditing} />}
          </div>
          <SheetFooter className="p-6 border-t border-border bg-white flex-row justify-end gap-2">
            <Button variant="outline" onClick={() => setEditing(null)}>
              取消
            </Button>
            <Button
              className="bg-primary hover:bg-[var(--brand-hover)] text-primary-foreground"
              onClick={saveEdit}
            >
              保存
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* 详情抽屉 */}
      <Sheet open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <SheetContent side="right" className="w-full sm:w-1/2 sm:max-w-none overflow-y-auto bg-white">
          <SheetHeader>
            <SheetTitle className="text-section-title">处方详情</SheetTitle>
          </SheetHeader>
          {viewing && <PrescriptionView r={viewing} />}
          <SheetFooter className="mt-6 flex-row justify-end gap-2">
            <Button variant="outline" onClick={() => setViewing(null)}>
              关闭
            </Button>
            <Button
              className="bg-primary hover:bg-[var(--brand-hover)] text-primary-foreground"
              onClick={() => {
                if (viewing) {
                  setEditing(structuredClone(viewing));
                  setViewing(null);
                }
              }}
            >
              编辑
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              将删除 {pendingDelete?.length ?? 0} 条处方，删除后不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-[var(--state-danger)] hover:bg-[var(--state-danger)]/90 text-white"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ---------- 编辑表单 ----------

function SectionCard({
  title,
  icon,
  action,
  children,
  bare,
}: {
  title: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  bare?: boolean;
}) {
  if (bare) {
    return (
      <section>
        <div className="flex items-center justify-between h-9 mb-3">
          <div className="flex items-center gap-1.5 text-card-title text-foreground">
            {icon}
            {title}
          </div>
          {action}
        </div>
        <div className="space-y-3">{children}</div>
      </section>
    );
  }
  return (
    <section className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between px-4 h-11 border-b border-border">
        <div className="flex items-center gap-1.5 text-card-title text-foreground">
          {icon}
          {title}
        </div>
        {action}
      </div>
      <div className="p-4 space-y-3">{children}</div>
    </section>
  );
}

function Field({
  label,
  required,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-body-sm text-text-secondary">
        {label}
        {required && <span className="text-[var(--state-danger)] ml-0.5">*</span>}
      </Label>
      {children}
      {hint && <div className="text-caption text-text-tertiary">{hint}</div>}
    </div>
  );
}

function sanitizePositive(v: string) {
  const s = v.replace(/\D/g, "").replace(/^0+/, "");
  return s;
}

function PrescriptionForm({ value, onChange }: { value: Rx; onChange: (v: Rx) => void }) {
  const patch = (p: Partial<Rx>) => onChange({ ...value, ...p });

  const computedDuration = useMemo(() => {
    const dMax = value.drugs.reduce((m, d) => Math.max(m, Number(d.days) || 0), 0);
    const tMax = value.tasks.reduce((m, t) => Math.max(m, Number(t.days) || 0), 0);
    return Math.max(dMax, tMax);
  }, [value.drugs, value.tasks]);

  useEffect(() => {
    if (computedDuration !== value.duration) {
      onChange({ ...value, duration: computedDuration });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computedDuration]);

  const addDrug = () => patch({ drugs: [...value.drugs, newDrug()] });
  const updateDrug = (id: string, p: Partial<DrugDetail>) =>
    patch({ drugs: value.drugs.map((d) => (d.id === id ? { ...d, ...p } : d)) });
  const removeDrug = (id: string) => patch({ drugs: value.drugs.filter((d) => d.id !== id) });

  const addTask = () => patch({ tasks: [...value.tasks, newTask()] });
  const updateTask = (id: string, p: Partial<TaskDetail>) =>
    patch({ tasks: value.tasks.map((t) => (t.id === id ? { ...t, ...p } : t)) });
  const removeTask = (id: string) => patch({ tasks: value.tasks.filter((t) => t.id !== id) });

  return (
    <Tabs defaultValue="basic" className="mt-4">
      <TabsList className="grid w-full grid-cols-4 h-9">
        <TabsTrigger value="basic" className="text-body-sm">基础信息</TabsTrigger>
        <TabsTrigger value="drugs" className="text-body-sm">
          用药 <span className="ml-1 text-text-tertiary">{value.drugs.length}</span>
        </TabsTrigger>
        <TabsTrigger value="tasks" className="text-body-sm">
          非用药 <span className="ml-1 text-text-tertiary">{value.tasks.length}</span>
        </TabsTrigger>
        <TabsTrigger value="review" className="text-body-sm">复查</TabsTrigger>
      </TabsList>

      <TabsContent value="basic" className="mt-4 space-y-4">
        {/* 归属信息由所属疾病/事项上下文带出，此处不再编辑 */}


        {/* 基础 */}
        <SectionCard title="基础信息" icon={<FileText className="h-4 w-4 text-primary" />}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="处方编码">
              <Input value={value.code} readOnly className="h-9 text-body-sm font-mono bg-surface-subtle" />
            </Field>
            <Field label="处方名称" required>
              <Input
                value={value.name}
                onChange={(e) => patch({ name: e.target.value })}
                className="h-9 text-body-sm"
                placeholder="如 乳房炎标准处方 A"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="处方描述">
              <Input
                value={value.desc ?? ""}
                onChange={(e) => patch({ desc: e.target.value })}
                className="h-9 text-body-sm"
                placeholder="适用场景简述，用于列表选择"
              />
            </Field>
            <Field label="处方疗程">
              <div className="relative">
                <Input
                  value={String(value.duration || 0)}
                  readOnly
                  tabIndex={-1}
                  className="h-9 pr-8 text-body-sm bg-surface-subtle/60 cursor-not-allowed"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-caption text-text-tertiary pointer-events-none">
                  天
                </span>
              </div>
              <div className="mt-1 text-caption text-text-tertiary">
                根据用药与非用药最大天数自动计算
              </div>
            </Field>
          </div>
          <div className="flex items-center justify-between rounded-md bg-surface-subtle/60 px-3 py-2">
            <div>
              <div className="text-body-sm text-foreground">处方摘要</div>
              <div className="text-caption text-text-tertiary">开启后按用药 → 非用药 → 复查顺序自动拼接</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-caption text-text-tertiary">系统自动拼接</span>
              <Switch checked={value.summaryAuto} onCheckedChange={(v) => patch({ summaryAuto: v })} />
            </div>
          </div>
          {value.summaryAuto ? (
            <div className="rounded-md border border-dashed border-border p-3 text-body-sm text-text-secondary leading-relaxed">
              {buildSummary(value) || <span className="text-text-tertiary">暂无明细，摘要将在保存后展示</span>}
            </div>
          ) : (
            <Textarea
              value={value.summary ?? ""}
              onChange={(e) => patch({ summary: e.target.value })}
              className="text-body-sm min-h-16"
              placeholder="手动填写方案摘要"
            />
          )}
          <Field label="补充说明">
            <Textarea
              value={value.extra ?? ""}
              onChange={(e) => patch({ extra: e.target.value })}
              className="text-body-sm min-h-16"
              placeholder="局部处理、注意事项、护理说明"
            />
          </Field>
        </SectionCard>
      </TabsContent>

      <TabsContent value="drugs" className="mt-4 space-y-4">
        <SectionCard
          bare
          title={`用药明细 · ${value.drugs.length}`}
          icon={<Pill className="h-4 w-4 text-primary" />}
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 gap-1 text-body-sm font-normal"
              onClick={addDrug}
            >
              <Plus className="h-3.5 w-3.5" /> 添加
            </Button>
          }
        >
          {value.drugs.length === 0 && (
            <div className="rounded-md border border-dashed border-border p-4 text-center text-body-sm text-text-tertiary">
              暂无用药明细
            </div>
          )}
          {value.drugs.map((d, i) => (
            <DrugDetailRow
              key={d.id}
              index={i}
              value={d}
              onChange={(p) => updateDrug(d.id, p)}
              onRemove={() => removeDrug(d.id)}
            />
          ))}
        </SectionCard>
      </TabsContent>

      <TabsContent value="tasks" className="mt-4 space-y-4">
        <SectionCard
          bare
          title={`非用药明细 · ${value.tasks.length}`}
          icon={<ClipboardList className="h-4 w-4 text-primary" />}
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 gap-1 text-body-sm font-normal"
              onClick={addTask}
            >
              <Plus className="h-3.5 w-3.5" /> 添加
            </Button>
          }
        >
          {value.tasks.length === 0 && (
            <div className="rounded-md border border-dashed border-border p-4 text-center text-body-sm text-text-tertiary">
              非用药：无
            </div>
          )}
          {value.tasks.map((t, i) => (
            <TaskDetailRow
              key={t.id}
              index={i}
              value={t}
              onChange={(p) => updateTask(t.id, p)}
              onRemove={() => removeTask(t.id)}
            />
          ))}
        </SectionCard>
      </TabsContent>

      <TabsContent value="review" className="mt-4 space-y-4">
        <SectionCard bare title="复查配置" icon={<RefreshCw className="h-4 w-4 text-primary" />}>
          <ReviewEditor value={value.review} onChange={(review) => patch({ review })} />
        </SectionCard>
      </TabsContent>
    </Tabs>
  );
}

// ---------- 用药明细行 ----------

function DrugDetailRow({
  index,
  value,
  onChange,
  onRemove,
}: {
  index: number;
  value: DrugDetail;
  onChange: (p: Partial<DrugDetail>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* 卡片头 */}
      <div className="flex items-center justify-between px-4 h-11 border-b border-border bg-surface-subtle/50">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-caption font-semibold tabular-nums">
            {index + 1}
          </span>
          <span className="text-card-title text-foreground">
            用药明细 {String(index + 1).padStart(2, "0")}
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-text-tertiary hover:text-[var(--state-danger)]"
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4 space-y-4">
        {/* 药品 */}
        <Field
          label="药品名称（若有可替代药品，可多选）"
          required
          hint="兽医执行时，可按实际库存从以上药品中选择合适的药品"
        >
          <MultiDrugPicker value={value.drugs} onChange={(drugs) => onChange({ drugs })} />
        </Field>

        {/* 给药与疗程 */}
        <div className="flex flex-wrap gap-x-4 gap-y-3">
          <div className="w-56">
            <Field label="推荐给药方式" required>
              <Select
                value={value.routes[0] ?? ""}
                onValueChange={(v) => onChange({ routes: [v as Route1] })}
              >
                <SelectTrigger className="h-9 text-body">
                  <SelectValue placeholder="选择推荐给药方式" />
                </SelectTrigger>
                <SelectContent>
                  {ROUTE_OPTS.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="w-28">
            <Field label="用药天数" required>
              <NumberInput value={value.days} onChange={(days) => onChange({ days })} suffix="天" />
            </Field>
          </div>
          <div className="w-48">
            <Field label="用药频次" required>
              <FrequencyInput
                value={value.freq}
                onChange={(freq) => {
                  const slot = value.slotOn ? value.slot : defaultSlot(freq.m);
                  onChange({ freq, slot });
                }}
              />
            </Field>
          </div>
        </div>

        <SlotSection
          on={value.slotOn}
          slot={value.slot}
          freqM={value.freq.m}
          onToggle={(on) => onChange({ slotOn: on, slot: on ? value.slot : defaultSlot(value.freq.m) })}
          onSlotChange={(slot) => onChange({ slot })}
        />

        {/* 剂量 */}
        <div className="pt-3 border-t border-border/70 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-body font-medium text-foreground">按变量计算剂量</span>
            <div className="flex items-center gap-2">
              {value.variable && (
                <>
                  <span className="text-caption text-text-tertiary">计算变量</span>
                  <Select
                    value={value.variableKind ?? ""}
                    onValueChange={(v) =>
                      onChange({
                        variableKind: v as VarKind,
                        varDose: value.varDose ?? [{ option: "", dose: "" }],
                      })
                    }
                  >
                    <SelectTrigger className="h-8 w-28 text-body-sm font-medium text-primary">
                      <SelectValue placeholder="请选择" />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(VAR_LABEL) as VarKind[]).map((k) => (
                        <SelectItem key={k} value={k}>
                          {VAR_LABEL[k]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
              <Switch checked={value.variable} onCheckedChange={(v) => onChange({ variable: v })} />
            </div>
          </div>

          {value.variable ? (
            <>
              <VariableDoseTable
                varKind={value.variableKind}
                drugSpec={value.drugs[0]?.spec}
                value={value.varDose ?? []}
                onChange={(varDose) => onChange({ varDose })}
              />
              <div className="text-caption text-text-tertiary">每个变量区间对应一次剂量</div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-body-sm text-text-secondary shrink-0">
                具体剂量<span className="text-[var(--state-danger)] ml-0.5">*</span>
              </span>
              <DoseInput
                spec={value.drugs[0]?.spec}
                value={value.fixedDose}
                onChange={(fixedDose) => onChange({ fixedDose })}
              />
              <span className="text-caption text-text-tertiary">单位由药品规格自动带出</span>
            </div>
          )}

        </div>

        {/* 替代药品用法与剂量 */}
        {value.drugs.length > 1 && (
          <div className="pt-3 border-t border-border/70 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-body font-medium text-foreground">替代药品用法与剂量</span>
              <span className="text-caption text-text-tertiary">默认沿用主选药品，可按需单独调整</span>
            </div>
            {value.drugs.slice(1).map((d, i) => (
              <AltDrugEditor
                key={drugKey(d)}
                base={value}
                drug={d}
                onChange={(p) => {
                  const next = value.drugs.slice();
                  next[i + 1] = { ...d, ...p };
                  onChange({ drugs: next });
                }}
              />
            ))}
          </div>
        )}

      </div>

    </div>
  );
}

// ---------- 替代药品用法与剂量（字段与主选药品一致） ----------

function AltDrugEditor({
  base,
  drug,
  onChange,
}: {
  base: DrugDetail;
  drug: DrugRef;
  onChange: (p: Partial<DrugRef>) => void;
}) {
  const route = drug.route ?? base.routes[0] ?? "";
  const days = drug.days ?? base.days;
  const freq = drug.freq ?? base.freq;
  const variable = drug.variable ?? base.variable;
  const variableKind = drug.variableKind ?? base.variableKind;
  const slotOn = drug.slotOn ?? base.slotOn;
  const slot = drug.slot ?? base.slot;

  return (
    <div className="rounded-lg bg-surface-subtle/50 p-3 space-y-3">
      <div className="flex items-baseline gap-2">
        <span className="text-body-sm font-medium text-foreground">{drug.name}</span>
        <span className="text-caption text-text-tertiary">{drug.spec}</span>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-3">
        <div className="w-56">
          <Field label="推荐给药方式" required>
            <Select value={route} onValueChange={(v) => onChange({ route: v as Route1 })}>
              <SelectTrigger className="h-9 text-body">
                <SelectValue placeholder="选择推荐给药方式" />
              </SelectTrigger>
              <SelectContent>
                {ROUTE_OPTS.map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="w-28">
          <Field label="用药天数" required>
            <NumberInput value={days} onChange={(v) => onChange({ days: v })} suffix="天" />
          </Field>
        </div>
        <div className="w-48">
          <Field label="用药频次" required>
            <FrequencyInput
              value={freq}
              onChange={(f) => onChange({ freq: f, slot: slotOn ? slot : defaultSlot(f.m) })}
            />
          </Field>
        </div>
      </div>

      <SlotSection
        on={slotOn}
        slot={slot}
        freqM={freq.m}
        onToggle={(on) => onChange({ slotOn: on, slot: on ? slot : defaultSlot(freq.m) })}
        onSlotChange={(s) => onChange({ slot: s })}
      />

      <div className="pt-3 border-t border-border/70 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-body font-medium text-foreground">按变量计算剂量</span>
          <div className="flex items-center gap-2">
            {variable && (
              <>
                <span className="text-caption text-text-tertiary">计算变量</span>
                <Select
                  value={variableKind ?? ""}
                  onValueChange={(v) =>
                    onChange({
                      variableKind: v as VarKind,
                      varDose: drug.varDose ?? [{ option: "", dose: "" }],
                    })
                  }
                >
                  <SelectTrigger className="h-8 w-28 text-body-sm font-medium text-primary">
                    <SelectValue placeholder="请选择" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(VAR_LABEL) as VarKind[]).map((k) => (
                      <SelectItem key={k} value={k}>
                        {VAR_LABEL[k]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
            <Switch checked={variable} onCheckedChange={(v) => onChange({ variable: v })} />
          </div>
        </div>

        {variable ? (
          <VariableDoseTable
            varKind={variableKind}
            drugSpec={drug.spec}
            value={drug.varDose ?? []}
            onChange={(varDose) => onChange({ varDose })}
          />
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-body-sm text-text-secondary shrink-0">
              具体剂量<span className="text-[var(--state-danger)] ml-0.5">*</span>
            </span>
            <DoseInput
              spec={drug.spec}
              value={drug.dose}
              onChange={(dose) => onChange({ dose })}
            />
          </div>
        )}

      </div>
    </div>
  );
}


// ---------- 非用药明细行 ----------

function TaskDetailRow({
  index,
  value,
  onChange,
  onRemove,
}: {
  index: number;
  value: TaskDetail;
  onChange: (p: Partial<TaskDetail>) => void;
  onRemove: () => void;
}) {
  const TASK_TYPES: TaskType[] = ["检查", "理疗", "护理", "观察", "外科处置", "其他"];
  const RECORDS: RecordWay[] = ["文本输入", "数字输入", "图片视频", "评分", "无需记录"];
  return (
    <div className="rounded-md border border-border bg-surface-subtle/50 p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-body-sm text-text-secondary">
          <ClipboardList className="h-3.5 w-3.5 text-primary" />
          任务 {index + 1}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-text-tertiary hover:text-[var(--state-danger)]"
          onClick={onRemove}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Field label="任务名称" required>
          <Input
            value={value.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="h-9 text-body-sm"
            placeholder="如 直肠体温测量"
          />
        </Field>
        <Field label="任务类型" required>
          <Select value={value.type} onValueChange={(v) => onChange({ type: v as TaskType })}>
            <SelectTrigger className="h-9 text-body-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TASK_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field label="具体操作" required hint="30 字以内">
        <Input
          value={value.action}
          maxLength={30}
          onChange={(e) => onChange({ action: e.target.value })}
          className="h-9 text-body-sm"
          placeholder="描述执行人现场需要完成的动作"
        />
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field label="记录方式" required>
          <Select value={value.record} onValueChange={(v) => onChange({ record: v as RecordWay })}>
            <SelectTrigger className="h-9 text-body-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RECORDS.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="执行天数" required>
          <NumberInput value={value.days} onChange={(days) => onChange({ days })} suffix="天" />
        </Field>
      </div>

      <Field label="执行频次" required>
        <FrequencyInput
          value={value.freq}
          onChange={(freq) => {
            const slot = value.slotOn ? value.slot : defaultSlot(freq.m);
            onChange({ freq, slot });
          }}
        />
      </Field>

      <SlotSection
        on={value.slotOn}
        slot={value.slot}
        freqM={value.freq.m}
        onToggle={(on) => onChange({ slotOn: on, slot: on ? value.slot : defaultSlot(value.freq.m) })}
        onSlotChange={(slot) => onChange({ slot })}
      />
    </div>
  );
}

// ---------- 复查编辑 ----------

function ReviewEditor({ value, onChange }: { value: ReviewCfg; onChange: (v: ReviewCfg) => void }) {
  const patch = (p: Partial<ReviewCfg>) => onChange({ ...value, ...p });
  return (
    <>
      <div className="flex items-center justify-between rounded-md bg-surface-subtle/60 px-3 py-2">
        <div className="text-body-sm text-foreground">是否开启复查</div>
        <Switch checked={value.on} onCheckedChange={(v) => patch({ on: v })} />
      </div>
      {value.on && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Field label="复查天数" required hint="1-9 天">
              <NumberInput
                value={value.days}
                onChange={(days) => patch({ days: Math.min(9, Math.max(1, days || 1)) })}
                suffix="天"
              />
            </Field>
            <Field label="复查频次" required>
              <FrequencyInput
                value={value.freq}
                onChange={(freq) => {
                  const slot = value.slotOn ? value.slot : defaultSlot(freq.m);
                  patch({ freq, slot });
                }}
              />
            </Field>
          </div>
          <SlotSection
            on={value.slotOn}
            slot={value.slot}
            freqM={value.freq.m}
            onToggle={(on) => patch({ slotOn: on, slot: on ? value.slot : defaultSlot(value.freq.m) })}
            onSlotChange={(slot) => patch({ slot })}
          />
          <Field label="复查任务描述" required hint="15 字以内">
            <Input
              value={value.desc}
              maxLength={15}
              onChange={(e) => patch({ desc: e.target.value })}
              className="h-9 text-body-sm"
            />
          </Field>
          <Field label="任务时限" required>
            <Select value={value.deadline} onValueChange={(v) => patch({ deadline: v as "24h" | "48h" })}>
              <SelectTrigger className="h-9 text-body-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">24 小时</SelectItem>
                <SelectItem value="48h">48 小时</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </>
      )}
      <div className="flex items-center justify-between rounded-md bg-surface-subtle/60 px-3 py-2">
        <div>
          <div className="text-body-sm text-foreground">转栏信息填写</div>
          <div className="text-caption text-text-tertiary">开启后执行人提交复查结论时需填写是否转栏</div>
        </div>
        <Switch checked={value.transferOn} onCheckedChange={(v) => patch({ transferOn: v })} />
      </div>
    </>
  );
}

// ---------- 通用小组件 ----------

function NumberInput({
  value,
  onChange,
  suffix,
}: {
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <div className="relative">
      <Input
        value={String(value || "")}
        inputMode="numeric"
        onChange={(e) => {
          const s = sanitizePositive(e.target.value);
          onChange(s ? Number(s) : 0);
        }}
        className={cn("h-9 text-body", suffix && "pr-8")}
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-caption text-text-tertiary pointer-events-none">
          {suffix}
        </span>
      )}
    </div>
  );
}

function FrequencyInput({ value, onChange }: { value: Freq; onChange: (v: Freq) => void }) {
  return (
    <div className="flex items-center gap-1 h-9 rounded-md border border-input bg-white px-2 text-body">
      <span className="text-text-tertiary">每</span>
      <Input
        value={String(value.n || "")}
        inputMode="numeric"
        onChange={(e) => {
          const s = sanitizePositive(e.target.value);
          onChange({ ...value, n: s ? Number(s) : 1 });
        }}
        className="h-7 w-12 text-center border-0 shadow-none focus-visible:ring-0 p-0"
      />
      <span className="text-text-tertiary">天</span>
      <Input
        value={String(value.m || "")}
        inputMode="numeric"
        onChange={(e) => {
          const s = sanitizePositive(e.target.value);
          onChange({ ...value, m: s ? Number(s) : 1 });
        }}
        className="h-7 w-12 text-center border-0 shadow-none focus-visible:ring-0 p-0"
      />
      <span className="text-text-tertiary">次</span>
    </div>
  );
}

function SlotSection({
  on,
  slot,
  freqM,
  onToggle,
  onSlotChange,
}: {
  on: boolean;
  slot: TimeSlot;
  freqM: number;
  onToggle: (v: boolean) => void;
  onSlotChange: (s: TimeSlot) => void;
}) {
  const shown = on ? slot : defaultSlot(freqM);
  return (
    <div className="pt-3 border-t border-border/70 space-y-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-body font-medium text-foreground">区分时间段</div>
          <div className="text-caption text-text-tertiary">开启后可分别设置早 / 中 / 下午的次数</div>
        </div>
        <Switch checked={on} onCheckedChange={onToggle} />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        {(["morning", "noon", "evening"] as const).map((k) => (
          <div key={k} className={cn("flex items-center gap-2", !on && "opacity-50")}>
            <span className="text-body-sm text-text-secondary">
              {k === "morning" ? "早上" : k === "noon" ? "中午" : "下午"}
            </span>
            <Input
              value={String(shown[k] ?? 0)}
              inputMode="numeric"
              readOnly={!on}
              onChange={(e) => {
                const n = Number(e.target.value.replace(/\D/g, "") || 0);
                onSlotChange({ ...slot, [k]: n });
              }}
              className={cn("h-8 w-12 text-center text-body", !on && "cursor-not-allowed bg-surface-subtle")}
            />
            <span className="text-body-sm text-text-tertiary">次</span>
          </div>
        ))}
      </div>
    </div>
  );

}



function MultiDrugPicker({
  value,
  onChange,
}: {
  value: DrugRef[];
  onChange: (v: DrugRef[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const isSelected = (d: DrugRef) => value.some((v) => drugKey(v) === drugKey(d));
  const toggle = (d: DrugRef) => {
    if (isSelected(d)) onChange(value.filter((v) => drugKey(v) !== drugKey(d)));
    else onChange([...value, d]);
  };
  const remove = (d: DrugRef) => onChange(value.filter((v) => drugKey(v) !== drugKey(d)));
  const add = (d: DrugRef) => {
    if (!isSelected(d)) onChange([...value, d]);
    setOpen(false);
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      {value.map((d, i) => (
        <span
          key={drugKey(d)}
          className="group inline-flex items-center gap-1.5 h-8 pl-2 pr-1.5 rounded-md border border-border bg-card text-body-sm"
        >
          <span
            className={cn(
              "inline-flex h-4 items-center rounded px-1 text-caption",
              i === 0 ? "bg-brand-subtle text-primary" : "bg-surface-subtle text-text-tertiary",
            )}
          >
            {i === 0 ? "主选" : "替代"}
          </span>
          <span className="text-foreground">{d.name}</span>
          <span className="text-text-tertiary">{d.spec}</span>
          <button
            type="button"
            onClick={() => remove(d)}
            className="ml-0.5 inline-flex h-5 w-5 items-center justify-center rounded text-text-tertiary hover:bg-surface-subtle hover:text-[var(--state-danger)]"
            aria-label={`移除 ${d.name}`}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </span>
      ))}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1 border-dashed text-body-sm font-normal text-text-secondary"
          >
            <Plus className="h-3.5 w-3.5" />
            {value.length === 0 ? "选择药品" : "添加替代药品"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-1 overflow-hidden" align="start">
          <Command className="overflow-visible">
            <div className="p-1">
              <CommandInput
                placeholder="输入药品名称搜索…"
                className="h-9 text-body-sm"
              />
            </div>
            <CommandList className="max-h-64">

              <CommandEmpty>
                <div className="px-2 py-3 text-body-sm text-text-tertiary">无匹配药品</div>
              </CommandEmpty>
              <CommandGroup>
                {DRUG_CATALOG.map((d) => {
                  const k = drugKey(d);
                  const sel = isSelected(d);
                  return (
                    <CommandItem key={k} value={k} onSelect={() => (sel ? remove(d) : add(d))}>
                      <Check className={cn("mr-2 h-3.5 w-3.5 text-primary", sel ? "opacity-100" : "opacity-0")} />
                      <span className="truncate">
                        {d.name} <span className="text-text-tertiary">{d.spec}</span>
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}


// ---------- 剂量单位（由药品规格自动生成，用户只填数量） ----------

function specUnits(spec?: string): string[] {
  const out: string[] = [];
  if (spec) {
    const pack = spec.match(/\/\s*([^/\s]+)\s*$/)?.[1];
    if (pack) out.push(pack);
    const ms = spec.match(/\d+(?:\.\d+)?\s*(ml|mL|L|g|mg|IU|万IU|片|粒|头份)/g) ?? [];
    for (const m of ms) {
      const u = m.replace(/[\d.\s]/g, "");
      if (!out.includes(u)) out.push(u);
    }
  }
  return out.length ? out : ["ml"];
}

function parseDose(v?: string) {
  const m = (v ?? "").trim().match(/^(\d+(?:\.\d+)?)\s*(.*?)(?:\/次)?$/);
  return { qty: m?.[1] ?? "", unit: (m?.[2] ?? "").trim() };
}

function DoseInput({
  spec,
  value,
  onChange,
  perTime = true,
  className,
}: {
  spec?: string;
  value?: string;
  onChange: (v: string) => void;
  perTime?: boolean;
  className?: string;
}) {
  const units = specUnits(spec);
  const parsed = parseDose(value);
  const unit = parsed.unit && units.includes(parsed.unit) ? parsed.unit : units[0];
  const emit = (qty: string, u: string) =>
    onChange(qty ? `${qty}${u}${perTime ? "/次" : ""}` : "");

  return (
    <div className={cn("flex items-center", className)}>
      <Input
        value={parsed.qty}
        inputMode="decimal"
        onChange={(e) => emit(e.target.value.replace(/[^\d.]/g, ""), unit)}
        className="h-9 w-20 text-body rounded-r-none"
        placeholder="数量"
      />
      {units.length > 1 ? (
        <Select value={unit} onValueChange={(u) => emit(parsed.qty, u)}>
          <SelectTrigger className="h-9 w-[76px] rounded-l-none border-l-0 text-body-sm bg-surface-subtle/60 text-text-secondary">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {units.map((u) => (
              <SelectItem key={u} value={u}>
                {u}
                {perTime ? "/次" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <span className="h-9 inline-flex items-center px-3 rounded-r-md border border-l-0 border-input bg-surface-subtle/60 text-body-sm text-text-secondary whitespace-nowrap">
          {unit}
          {perTime ? "/次" : ""}
        </span>
      )}
    </div>
  );
}

function VariableDoseTable({
  varKind,
  drugSpec,
  value,
  onChange,
}: {
  varKind?: VarKind;
  drugSpec?: string;
  value: DoseMap;
  onChange: (v: DoseMap) => void;
}) {

  const update = (i: number, p: Partial<{ option: string; dose: string }>) =>
    onChange(value.map((row, idx) => (idx === i ? { ...row, ...p } : row)));
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const add = () => onChange([...value, { option: "", dose: "" }]);

  const placeholder =
    varKind === "quarter" ? "如 1-2 个" : "选项";

  const parseWeight = (s: string) => {
    const m = String(s || "").match(/(\d+(?:\.\d+)?)?\s*-\s*(\d+(?:\.\d+)?)?/);
    return { min: m?.[1] ?? "", max: m?.[2] ?? "" };
  };
  const buildWeight = (min: string, max: string) =>
    min || max ? `${min}-${max}kg` : "";

  return (
    <div className="flex flex-wrap gap-2">
      {value.map((row, i) => (
        <div
          key={i}
          className="group flex items-center gap-2"
        >

          {varKind === "weight" ? (
            (() => {
              const { min, max } = parseWeight(row.option);
              return (
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={min}
                    onChange={(e) => update(i, { option: buildWeight(e.target.value, max) })}
                    placeholder="最小"
                    className="h-9 w-20 text-body-sm"
                  />
                  <span className="text-body-sm text-text-tertiary">-</span>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={max}
                    onChange={(e) => update(i, { option: buildWeight(min, e.target.value) })}
                    placeholder="最大"
                    className="h-9 w-20 text-body-sm"
                  />
                  <span className="h-9 inline-flex items-center px-2 rounded-md bg-[var(--fill-tertiary,transparent)] text-body-sm text-text-tertiary border border-border">
                    kg
                  </span>
                </div>
              );
            })()
          ) : (
            <Input
              value={row.option}
              onChange={(e) => update(i, { option: e.target.value })}
              placeholder={placeholder}
              className="h-9 w-28 text-body-sm"
            />
          )}

          <span className="text-body-sm text-text-tertiary">→</span>
          <DoseInput
            spec={drugSpec}
            value={row.dose}
            onChange={(dose) => update(i, { dose })}
            perTime={false}
          />


          <button
            type="button"
            onClick={() => remove(i)}
            className="text-text-tertiary opacity-0 group-hover:opacity-100 hover:text-[var(--state-danger)] transition-opacity"
            aria-label="删除该区间"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="inline-flex items-center gap-1 h-9 px-2 text-body-sm text-primary hover:underline"
      >

        <Plus className="h-3.5 w-3.5" /> 添加区间
      </button>
    </div>
  );

}

// ---------- 详情视图 ----------

function PrescriptionView({ r }: { r: Rx }) {
  const summary = r.summaryAuto ? buildSummary(r) : r.summary ?? "";
  return (
    <div className="mt-4 space-y-3 text-body-sm">
      <div className="rounded-lg border border-border p-4 bg-surface-subtle/50">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="tag tag-brand">{ownerTypeLabel(r.kind)}</span>
          <span className="text-section-title text-foreground">{r.name}</span>
          <span className="text-caption text-text-tertiary">
            应用于 {r.category || "—"} · {r.subType || "—"}（编号{r.code}）
          </span>
        </div>
        {r.desc && <div className="mt-1 text-body-sm text-text-secondary">{r.desc}</div>}
        <div className="mt-2">
          <StatScopeCard metrics={prescriptionStats(r.code)} />
        </div>
      </div>

      <ViewGroup label="处方描述">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5">
          <ViewRow label="处方所属类型" value={ownerTypeLabel(r.kind)} />
          <ViewRow label="处方疗程" value={`${r.duration} 天`} />
          <ViewRow label="补充说明" value={r.extra || "—"} />
          <div className="md:col-span-2">
            <ViewRow label="处方摘要" value={summary || "—"} />
          </div>
        </div>
      </ViewGroup>

      <ViewGroup label="处方详情">
        {r.drugs.length === 0 && r.tasks.length === 0 && (
          <div className="text-text-tertiary">—</div>
        )}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
          {r.drugs.map((d) => (
            <div key={d.id} className="rounded-md border border-border bg-surface-subtle p-3">
              <div className="flex items-start gap-1.5 text-body text-foreground">
                <Pill className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                <span className="font-medium">
                  {d.drugs.map((x) => `${x.name} ～${x.spec}`).join("；") || "—"}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                {d.drugType && <KV k="药品类型" v={d.drugType} />}
                <KV k="给药方式" v={d.routes.join("、") || "—"} />
                <KV k="用药天数" v={`${d.days} 天`} />
                <KV k="用药频次" v={`${d.freq.n}天${d.freq.m}次`} />
                <KV k="区分时段" v={d.slotOn ? "是" : "否"} />
                {d.slotOn && (
                  <KV
                    k="每日时段"
                    v={`早 ${d.slot.morning} / 中 ${d.slot.noon} / 晚 ${d.slot.evening}`}
                  />
                )}
                <KV k="变量计算" v={d.variable ? (d.variableKind ? VAR_LABEL[d.variableKind] : "是") : "否"} />
                <div className="col-span-2">
                  <KV
                    k="具体剂量"
                    v={
                      d.variable
                        ? d.varDose && d.varDose.length
                          ? d.varDose.map((v) => `${v.option} → ${v.dose}/次`).join("；")
                          : "—"
                        : d.fixedDose || "—"
                    }
                  />
                </div>
              </div>
            </div>
          ))}
          {r.tasks.length === 0
            ? r.drugs.length > 0 && (
                <div className="rounded-md border border-border bg-surface-subtle p-3 text-body-sm text-text-secondary">
                  非用药：无
                </div>
              )
            : r.tasks.map((t) => (
                <div key={t.id} className="rounded-md border border-border bg-surface-subtle p-3">
                  <div className="flex items-start gap-1.5 text-body text-foreground">
                    <ClipboardList className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                    <span className="font-medium">{t.name || "—"}</span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                    <KV k="任务类型" v={t.type} />
                    <KV k="记录方式" v={t.record} />
                    <KV k="执行天数" v={`${t.days} 天`} />
                    <KV k="执行频次" v={`${t.freq.n}天${t.freq.m}次`} />
                    <KV k="区分时段" v={t.slotOn ? "是" : "否"} />
                    {t.slotOn && (
                      <KV
                        k="每日时段"
                        v={`早 ${t.slot.morning} / 中 ${t.slot.noon} / 晚 ${t.slot.evening}`}
                      />
                    )}
                    <div className="col-span-2">
                      <KV k="具体操作" v={t.action || "—"} />
                    </div>
                  </div>
                </div>
              ))}
        </div>
      </ViewGroup>

      <ViewGroup label="复查配置">
        {!r.review.on ? (
          <div className="text-text-secondary">未开启复查</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1.5">
            <KV k="复查天数" v={`${r.review.days} 天`} />
            <KV k="复查频次" v={`${r.review.freq.n}天${r.review.freq.m}次`} />
            <KV k="区分时段" v={r.review.slotOn ? "是" : "否"} />
            <KV
              k="每日时段"
              v={`早 ${r.review.slot.morning} / 中 ${r.review.slot.noon} / 晚 ${r.review.slot.evening}`}
            />
            <KV k="转栏填写" v={r.review.transferOn ? "是" : "否"} />
            <KV k="任务时限" v={r.review.deadline === "24h" ? "24 小时" : "48 小时"} />
            <div className="col-span-2 md:col-span-3">
              <KV k="任务描述" v={r.review.desc || "—"} />
            </div>
          </div>
        )}
      </ViewGroup>

      <div className="flex items-center gap-4 text-caption text-text-tertiary pt-2 border-t border-border">
        <span>创建人 {r.author}</span>
        <span>更新 {r.updated}</span>
      </div>
    </div>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-start gap-2 min-w-0">
      <span className="text-text-tertiary shrink-0">{k}</span>
      <span className="text-foreground break-words min-w-0">{v || "—"}</span>
    </div>
  );
}

function ViewGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border p-4 space-y-2">
      <div className="text-body-sm font-medium text-foreground">{label}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function ViewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-20 shrink-0 text-body-sm text-text-tertiary">{label}</div>
      <div className="flex-1 text-body-sm text-foreground break-words">{value || "—"}</div>
    </div>
  );

}
