import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Filter,
  Save,
  Download,
  ArrowLeft,
  Search,
  Star,
  Stethoscope,
  Syringe,
  Pill,
  Baby,
  Droplet,
  Bug,
  Scissors,
  BarChart3,
  X,
  Check,
  Plus,
  Building2,

  CalendarDays,
  Users,
  ClipboardList,
  FileText,
} from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

export const Route = createFileRoute("/stats")({
  head: () => ({
    meta: [
      { title: "统计分析 — 奇点智牧" },
      { name: "description", content: "按时间、人员、疾病、处方、工单、产犊、药品等维度筛选统计牧场数据并导出报表。" },
      { property: "og:title", content: "统计分析 — 奇点智牧" },
      { property: "og:description", content: "多维度筛选牧场生产与兽医数据，一键导出报表。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StatsPage,
});

// ============ Types & helpers ============
type WorkOrderType =
  | "disease"
  | "vaccine"
  | "postpartum"
  | "hoof"
  | "drying"
  | "deworm"
  | "general";

const WO_TYPE_LABEL: Record<WorkOrderType, string> = {
  disease: "疾病治疗",
  vaccine: "疫苗免疫",
  postpartum: "产后护理",
  hoof: "修蹄",
  drying: "干奶",
  deworm: "驱虫",
  general: "普修",
};

const WO_TYPE_ICON: Record<WorkOrderType, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  disease: Stethoscope,
  vaccine: Syringe,
  postpartum: Baby,
  hoof: Scissors,
  drying: Droplet,
  deworm: Bug,
  general: Pill,
};

const STATUS_OPTIONS = [
  { value: "all", label: "全部状态" },
  { value: "pending", label: "待诊断" },
  { value: "executing", label: "待执行" },
  { value: "done", label: "已完成" },
  { value: "aborted", label: "已终止" },
];


const REGION_OF: Record<string, string> = {
  内蒙古大牧场: "华北大区",
  河北示范牧场: "华北大区",
  山东华牧: "华东大区",
};
const REGION_OPTIONS = [
  { value: "all", label: "全部区域" },
  { value: "华北大区", label: "华北大区" },
  { value: "华东大区", label: "华东大区" },
];
const FARM_NAMES = ["内蒙古大牧场", "河北示范牧场", "山东华牧"];
const BARN_NAMES = ["泌乳一舍", "泌乳二舍", "干奶舍", "犊牛舍"];

const DATE_PRESETS = [
  { value: "today", label: "今日" },
  { value: "7d", label: "近 7 天" },
  { value: "30d", label: "近 30 天" },
  { value: "90d", label: "近 90 天" },
  { value: "month", label: "本月" },
  { value: "custom", label: "自定义" },
];

/** 维度取值字典 */
const OPERATORS = ["王强", "李峰", "陈明", "赵霞", "周乐言"];
const ROLE_OPTIONS = [
  { value: "all", label: "全部角色" },
  { value: "vet", label: "兽医" },
  { value: "vet_assistant", label: "兽医助理" },
  { value: "immunizer", label: "免疫员" },
  { value: "hoof_trimmer", label: "修蹄员" },
];
const DISEASES = ["临床型乳房炎", "隐性乳房炎", "蹄叶炎", "腐蹄病", "子宫内膜炎", "胎衣不下", "支气管肺炎", "瘤胃酸中毒", "酮病"];
const DISEASE_CATS = [
  { value: "all", label: "全部病种类别" },
  { value: "乳房疾病", label: "乳房疾病" },
  { value: "肢蹄疾病", label: "肢蹄疾病" },
  { value: "繁殖疾病", label: "繁殖疾病" },
  { value: "呼吸道疾病", label: "呼吸道疾病" },
  { value: "消化系统疾病", label: "消化系统疾病" },
  { value: "代谢及其他", label: "代谢及其他" },
];
const PRESCRIPTIONS = ["乳房炎常规方案", "蹄病消炎方案", "产后正常", "产后高危", "干奶封闭方案", "呼吸道方案"];
const DRUGS = ["精制盐酸头孢噻呋注射液", "氟尼新葡甲胺注射液", "复方氯化钠注射液", "20% 葡萄糖注射液", "产后灌注", "伊维菌素注射液"];
const DRUG_ROUTES = [
  { value: "all", label: "全部给药方式" },
  { value: "肌内注射", label: "肌内注射" },
  { value: "静脉注射", label: "静脉注射" },
  { value: "灌注", label: "灌注" },
  { value: "口服", label: "口服" },
];
const CALVING_TYPES = ["顺产", "轻度助产", "难产", "剖腹产"];
const CALF_OUTCOMES = [
  { value: "all", label: "全部犊牛结局" },
  { value: "存活", label: "存活" },
  { value: "死胎", label: "死胎" },
  { value: "不留养", label: "不留养" },
];

type Filters = {
  // 时间维度
  dateRange: string;
  dateStart: string;
  dateEnd: string;
  // 牧场维度
  region: string;
  farms: string[];
  barns: string[];
  // 操作人员维度
  operators: string[];
  role: string;
  // 疾病维度
  diseases: string[];
  diseaseCat: string;
  // 处方维度
  prescriptions: string[];
  // 工单维度
  woTypes: WorkOrderType[];
  status: string;
  // 产犊维度
  calvingTypes: string[];
  calfOutcome: string;
  // 药品维度
  drugs: string[];
  drugRoute: string;
  // 其它
  keyword: string;
  onlyAbnormal: boolean;
};

const DEFAULT_FILTERS: Filters = {
  dateRange: "30d",
  dateStart: "",
  dateEnd: "",
  region: "all",
  farms: [],
  barns: [],
  operators: [],
  role: "all",
  diseases: [],
  diseaseCat: "all",
  prescriptions: [],
  woTypes: [],
  status: "all",
  calvingTypes: [],
  calfOutcome: "all",
  drugs: [],
  drugRoute: "all",
  keyword: "",
  onlyAbnormal: false,
};

// ============ Templates ============
type TplCategory = "cattle" | "disease" | "drug" | "staff";

const TPL_CATEGORY_LABEL: Record<TplCategory, string> = {
  cattle: "牛只",
  disease: "疾病",
  drug: "用药",
  staff: "人员",
};

const TPL_CATEGORY_TONE: Record<TplCategory, string> = {
  cattle: "var(--brand)",
  disease: "var(--effect-ai-purple)",
  drug: "var(--state-success)",
  staff: "var(--effect-ai-cyan)",
};

const CATEGORY_CARDS: {
  key: TplCategory;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}[] = [
  {
    key: "cattle",
    title: "牛只分析",
    desc: "按牧场、牛舍、工单类型与产犊情况，分析牛只的发病、处置与产犊表现。",
    icon: Baby,
  },
  {
    key: "disease",
    title: "疾病分析",
    desc: "按病种类别与具体病种，统计发病分布、治疗工单与处方使用情况。",
    icon: Stethoscope,
  },
  {
    key: "drug",
    title: "用药分析",
    desc: "按药品、给药方式与处方方案，统计用药频次与药品消耗结构。",
    icon: Pill,
  },
  {
    key: "staff",
    title: "人员分析",
    desc: "按角色与操作人员，统计工作量、工单完成情况与执行效率。",
    icon: Users,
  },
];


function inferCategory(f: Filters): TplCategory {
  if (f.role !== "all" || f.operators.length) return "staff";
  if (f.drugs.length || f.drugRoute !== "all" || f.prescriptions.length) return "drug";
  if (f.diseases.length || f.diseaseCat !== "all" || f.woTypes.includes("disease")) return "disease";
  return "cattle";
}

type Template = {
  id: string;
  name: string;
  desc: string;
  category: TplCategory;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  tone: string;
  filters: Filters;
  favorite?: boolean;
  usage?: number;
  creator: string;
  createdAt: string;
};


const DEFAULT_TEMPLATES: Template[] = [
  {
    id: "t-disease-30d",
    category: "disease",
    name: "近 30 天疾病治疗",
    desc: "全部牧场 · 疾病治疗工单汇总",
    icon: Stethoscope,
    tone: "var(--brand)",
    filters: { ...DEFAULT_FILTERS, dateRange: "30d", woTypes: ["disease"] },
    favorite: true,
    usage: 128,
    creator: "张兽医",
    createdAt: "2026-05-12 09:20",
  },
  {
    id: "t-mastitis",
    category: "disease",
    name: "乳房炎病种分析",
    desc: "近 30 天 · 乳房疾病类别",
    icon: Stethoscope,
    tone: "var(--effect-ai-purple)",
    filters: { ...DEFAULT_FILTERS, dateRange: "30d", diseaseCat: "乳房疾病" },
    usage: 74,
    creator: "李技术员",
    createdAt: "2026-06-03 14:05",
  },
  {
    id: "t-vaccine-month",
    category: "cattle",
    name: "本月疫苗执行",
    desc: "本月已完成的疫苗免疫工单",
    icon: Syringe,
    tone: "var(--effect-ai-cyan)",
    filters: { ...DEFAULT_FILTERS, dateRange: "month", woTypes: ["vaccine"], status: "done" },
    favorite: true,
    usage: 96,
    creator: "王场长",
    createdAt: "2026-04-21 10:38",
  },
  {
    id: "t-postpartum-highrisk",
    category: "drug",
    name: "产后高危跟进",
    desc: "近 7 天 · 产后高危处方",
    icon: Baby,
    tone: "var(--effect-ai-purple)",
    filters: { ...DEFAULT_FILTERS, dateRange: "7d", woTypes: ["postpartum"], prescriptions: ["产后高危"] },
    usage: 62,
    creator: "张兽医",
    createdAt: "2026-06-18 16:12",
  },
  {
    id: "t-calving-dystocia",
    category: "cattle",
    name: "难产产犊统计",
    desc: "近 90 天 · 难产 / 剖腹产",
    icon: Baby,
    tone: "var(--state-warning)",
    filters: { ...DEFAULT_FILTERS, dateRange: "90d", calvingTypes: ["难产", "剖腹产"] },
    usage: 28,
    creator: "刘繁育员",
    createdAt: "2026-03-09 08:47",
  },
  {
    id: "t-drug-cef",
    category: "drug",
    name: "头孢类用药统计",
    desc: "近 30 天 · 肌内注射头孢噻呋",
    icon: Pill,
    tone: "var(--state-success)",
    filters: {
      ...DEFAULT_FILTERS,
      dateRange: "30d",
      drugs: ["精制盐酸头孢噻呋注射液"],
      drugRoute: "肌内注射",
    },
    usage: 53,
    creator: "陈药师",
    createdAt: "2026-05-27 11:30",
  },
  {
    id: "t-operator",
    category: "staff",
    name: "人员工作量统计",
    desc: "近 30 天 · 按操作人员查看",
    icon: Users,
    tone: "var(--brand)",
    filters: { ...DEFAULT_FILTERS, dateRange: "30d", role: "vet" },
    usage: 45,
    creator: "王场长",
    createdAt: "2026-07-02 15:55",
  },
  {
    id: "t-pending-7d",
    category: "cattle",
    name: "近 7 天未处理",
    desc: "所有类型 · 待诊断",
    icon: BarChart3,
    tone: "var(--destructive)",
    filters: { ...DEFAULT_FILTERS, dateRange: "7d", status: "pending" },
    usage: 88,
    creator: "李技术员",
    createdAt: "2026-07-15 09:05",
  },
];

// ============ Mock result data ============
type Row = {
  id: string;
  earTag: string;
  farm: string;
  barn: string;
  type: WorkOrderType;
  status: string;
  reporter: string;
  operator: string;
  role: string;
  disease: string;
  diseaseCat: string;
  prescription: string;
  drug: string;
  drugRoute: string;
  calvingType: string;
  calfOutcome: string;
  createdAt: string;
  detail: string;
};

const DISEASE_CAT_OF: Record<string, string> = {
  临床型乳房炎: "乳房疾病",
  隐性乳房炎: "乳房疾病",
  蹄叶炎: "肢蹄疾病",
  腐蹄病: "肢蹄疾病",
  子宫内膜炎: "繁殖疾病",
  胎衣不下: "繁殖疾病",
  支气管肺炎: "呼吸道疾病",
  瘤胃酸中毒: "消化系统疾病",
  酮病: "代谢及其他",
};

const ROW_ROLES = ["vet", "vet_assistant", "immunizer", "hoof_trimmer"];
const ROW_ROUTES = ["肌内注射", "静脉注射", "灌注", "口服"];

const ROWS: Row[] = Array.from({ length: 36 }).map((_, i) => {
  const types: WorkOrderType[] = ["disease", "vaccine", "postpartum", "hoof", "drying", "deworm", "general"];
  const type = types[i % types.length];
  const statusList = ["pending", "executing", "done", "done", "done", "aborted"];
  const disease = DISEASES[i % DISEASES.length];
  const isCalving = type === "postpartum";
  return {
    id: `WO-2026-${String(1000 + i)}`,
    earTag: `C${String(20241000 + i * 17)}`,
    farm: ["内蒙古大牧场", "河北示范牧场", "山东华牧"][i % 3],
    barn: `${["泌乳一", "泌乳二", "干奶", "犊牛"][i % 4]}舍`,
    type,
    status: statusList[i % statusList.length],
    reporter: ["王强", "李峰", "陈明", "赵霞"][i % 4],
    operator: OPERATORS[i % OPERATORS.length],
    role: ROW_ROLES[i % ROW_ROLES.length],
    disease: type === "disease" || i % 3 === 0 ? disease : "—",
    diseaseCat: type === "disease" || i % 3 === 0 ? DISEASE_CAT_OF[disease] : "—",
    prescription: PRESCRIPTIONS[i % PRESCRIPTIONS.length],
    drug: DRUGS[i % DRUGS.length],
    drugRoute: ROW_ROUTES[i % ROW_ROUTES.length],
    calvingType: isCalving ? CALVING_TYPES[i % CALVING_TYPES.length] : "—",
    calfOutcome: isCalving ? ["存活", "存活", "死胎", "不留养"][i % 4] : "—",
    createdAt: `2026-07-${String(24 - (i % 24)).padStart(2, "0")}`,
    detail: {
      disease: "乳房炎 · 左前乳区红肿",
      vaccine: "口蹄疫疫苗 · 常规接种",
      postpartum: "产后 3 天例行检查",
      hoof: "蹄叶炎 · 二级修整",
      drying: "干奶封闭 · 4支/次",
      deworm: "伊维菌素驱虫",
      general: "普通例检",
    }[type],
  };
});

const STATUS_TAG: Record<string, { label: string; bg: string; color: string }> = {
  pending: { label: "待诊断", bg: "#FFF7ED", color: "#C2410C" },
  executing: { label: "待执行", bg: "#EFF6FF", color: "#1D4ED8" },
  done: { label: "已完成", bg: "#EFFBF1", color: "#00A14F" },
  aborted: { label: "已终止", bg: "#F1F5F9", color: "#475569" },
};

// ============ Page ============
function StatsPage() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [templates, setTemplates] = useState<Template[]>(DEFAULT_TEMPLATES);
  const [view, setView] = useState<"templates" | "result">("templates");
  const [resultFilters, setResultFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [resultTitle, setResultTitle] = useState("筛选结果");
  const [resultBack] = useState<"templates">("templates");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveDesc, setSaveDesc] = useState("");
  const [saveSource, setSaveSource] = useState<Filters>(DEFAULT_FILTERS);
  const [catOpen, setCatOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [builderCat, setBuilderCat] = useState<TplCategory>("cattle");

  const set = <K extends keyof Filters>(k: K, v: Filters[K]) =>
    setFilters((f) => ({ ...f, [k]: v }));

  const toggleIn = <K extends keyof Filters>(k: K, v: string) =>
    setFilters((f) => {
      const list = f[k] as unknown as string[];
      return {
        ...f,
        [k]: list.includes(v) ? list.filter((x) => x !== v) : [...list, v],
      };
    });

  const runFilter = (f: Filters, title = "筛选结果") => {
    setResultFilters(f);
    setResultTitle(title);
    setView("result");
  };

  /** 新建：先弹类别选择；编辑：直接进抽屉 */
  const openBuilder = (t?: Template) => {
    if (t) {
      setFilters({ ...t.filters });
      setEditingId(t.id);
      setBuilderCat(t.category);
      setDrawerOpen(true);
      return;
    }
    setCatOpen(true);
  };

  const pickCategory = (c: TplCategory) => {
    setFilters(DEFAULT_FILTERS);
    setEditingId(null);
    setBuilderCat(c);
    setCatOpen(false);
    setDrawerOpen(true);
  };


  const openSave = (source: Filters) => {
    setSaveSource(source);
    setSaveName("");
    setSaveDesc("");
    setSaveOpen(true);
  };

  const saveEdits = () => {
    if (!editingId) return;
    setTemplates((prev) =>
      prev.map((t) => (t.id === editingId ? { ...t, filters: { ...filters }, desc: describeFilters(filters) } : t)),
    );
    toast.success("模板已更新");
    setView("templates");
    setEditingId(null);
  };

  const handleSaveTemplate = () => {
    if (!saveName.trim()) {
      toast.error("请输入模板名称");
      return;
    }
    setTemplates((prev) => [
      {
        id: `t-${Date.now()}`,
        name: saveName.trim(),
        category: builderCat ?? inferCategory(saveSource),
        desc: saveDesc.trim() || describeFilters(saveSource),
        icon: BarChart3,
        tone: "var(--brand)",
        filters: { ...saveSource },
        usage: 0,
        creator: "当前用户",
        createdAt: new Date().toLocaleString("zh-CN", { hour12: false }).replace(/\//g, "-"),
      },
      ...prev,
    ]);
    toast.success("模板已保存");
    setSaveOpen(false);
    setSaveName("");
    setSaveDesc("");
  };

  const removeTemplate = (id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    toast.success("模板已删除");
  };

  const toggleFav = (id: string) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, favorite: !t.favorite } : t)),
    );
  };

  const filteredRows = useMemo(() => filterRows(ROWS, resultFilters), [resultFilters]);
  const activeCount = countActive(filters);
  const visibleTemplates = useMemo(() => {
    const k = query.trim().toLowerCase();
    const list = k
      ? templates.filter(
          (t) =>
            t.name.toLowerCase().includes(k) ||
            t.desc.toLowerCase().includes(k) ||
            describeFilters(t.filters).toLowerCase().includes(k),
        )
      : templates;
    return [...list].sort((a, b) => Number(!!b.favorite) - Number(!!a.favorite));
  }, [templates, query]);

  const editingTemplate = templates.find((t) => t.id === editingId) ?? null;

  const saveDialog = (
    <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle>保存为筛选模板</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-body-sm">模板名称</Label>
            <Input
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="如：近 30 天疾病治疗"
              className="mt-1.5 h-9 bg-white"
            />
          </div>
          <div>
            <Label className="text-body-sm">描述（可选）</Label>
            <Input
              value={saveDesc}
              onChange={(e) => setSaveDesc(e.target.value)}
              placeholder="简要说明模板用途"
              className="mt-1.5 h-9 bg-white"
            />
          </div>
          <div className="p-3 rounded-lg bg-surface-subtle border border-border">
            <div className="text-caption text-text-tertiary mb-1">筛选条件</div>
            <div className="text-body-sm text-foreground">{describeFilters(saveSource)}</div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setSaveOpen(false)}>取消</Button>
          <Button className="bg-primary hover:bg-[var(--brand-hover)]" onClick={handleSaveTemplate}>
            保存模板
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const catDialog = (
    <Dialog open={catOpen} onOpenChange={setCatOpen}>
      <DialogContent className="bg-white sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>选择分析类别</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CATEGORY_CARDS.map((c) => {
            const Icon = c.icon;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => pickCategory(c.key)}
                className="text-left p-4 rounded-xl border border-border bg-white hover:border-primary hover:bg-brand-subtle/40 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className="h-7 w-7 rounded-md inline-flex items-center justify-center shrink-0"
                    style={{
                      background: `color-mix(in oklab, ${TPL_CATEGORY_TONE[c.key]} 14%, transparent)`,
                      color: TPL_CATEGORY_TONE[c.key],
                    }}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  <span className="text-body font-medium text-foreground">{c.title}</span>
                </div>
                <div className="text-caption text-text-tertiary leading-5">{c.desc}</div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );

  const cat = builderCat ?? "cattle";
  const showDim = (d: "farm" | "staff" | "disease" | "prescription" | "order" | "calving" | "drug") => {
    if (d === "farm") return true;
    if (cat === "cattle") return d === "order" || d === "calving";
    if (cat === "disease") return d === "disease" || d === "order" || d === "prescription";
    if (cat === "drug") return d === "drug" || d === "prescription";
    return d === "staff" || d === "order";
  };

  const builderDrawer = (
    <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
      <SheetContent side="right" className="bg-white w-full sm:max-w-[760px] p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b border-border">
          <SheetTitle>
            {editingTemplate ? `编辑模板：${editingTemplate.name}` : `新建筛选 · ${TPL_CATEGORY_LABEL[cat]}分析`}
          </SheetTitle>
          <div className="text-caption text-text-tertiary mt-0.5">
            {CATEGORY_CARDS.find((c) => c.key === cat)?.desc}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <div className="flex items-center justify-end">
            {activeCount > 0 && (
              <button
                onClick={() => setFilters(DEFAULT_FILTERS)}
                className="text-caption text-text-tertiary hover:text-foreground inline-flex items-center gap-1"
              >
                <X className="h-3 w-3" /> 清空条件（{activeCount}）
              </button>
            )}
          </div>

          {/* 时间维度 */}
          <Dimension icon={CalendarDays} title="时间维度" tone="var(--brand)">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldBlock label="时间范围">
                <Select value={filters.dateRange} onValueChange={(v) => set("dateRange", v)}>
                  <SelectTrigger className="h-9 bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DATE_PRESETS.map((d) => (
                      <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldBlock>
              {filters.dateRange === "custom" && (
                <>
                  <FieldBlock label="开始日期">
                    <Input type="date" value={filters.dateStart} onChange={(e) => set("dateStart", e.target.value)} className="h-9 bg-white" />
                  </FieldBlock>
                  <FieldBlock label="结束日期">
                    <Input type="date" value={filters.dateEnd} onChange={(e) => set("dateEnd", e.target.value)} className="h-9 bg-white" />
                  </FieldBlock>
                </>
              )}
              <FieldBlock label="关键词（耳号 / 编号）">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" />
                  <Input
                    value={filters.keyword}
                    onChange={(e) => set("keyword", e.target.value)}
                    placeholder="输入关键词"
                    className="h-9 pl-8 bg-white"
                  />
                </div>
              </FieldBlock>
            </div>
          </Dimension>

          {/* 牧场维度 */}
          {showDim("farm") && (
            <Dimension icon={Building2} title="牧场维度" tone="var(--effect-ai-purple)">
              <div className="space-y-4">
                <FieldBlock label="区域">
                  <Select value={filters.region} onValueChange={(v) => set("region", v)}>
                    <SelectTrigger className="h-9 bg-white max-w-[240px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {REGION_OPTIONS.map((d) => (
                        <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldBlock>
                <ChipGroup
                  label="牧场（可多选）"
                  options={
                    filters.region === "all"
                      ? FARM_NAMES
                      : FARM_NAMES.filter((n) => REGION_OF[n] === filters.region)
                  }
                  selected={filters.farms}
                  onToggle={(v) => toggleIn("farms", v)}
                />
                <ChipGroup
                  label="牛舍（可多选）"
                  options={BARN_NAMES}
                  selected={filters.barns}
                  onToggle={(v) => toggleIn("barns", v)}
                />
              </div>
            </Dimension>
          )}

          {/* 操作人员维度 */}
          {showDim("staff") && (
            <Dimension icon={Users} title="操作人员维度" tone="var(--effect-ai-cyan)">
              <div className="space-y-4">
                <FieldBlock label="角色">
                  <Select value={filters.role} onValueChange={(v) => set("role", v)}>
                    <SelectTrigger className="h-9 bg-white max-w-[240px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((d) => (
                        <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldBlock>
                <ChipGroup
                  label="操作人员（可多选）"
                  options={OPERATORS}
                  selected={filters.operators}
                  onToggle={(v) => toggleIn("operators", v)}
                />
              </div>
            </Dimension>
          )}

          {/* 疾病维度 */}
          {showDim("disease") && (
            <Dimension icon={Stethoscope} title="疾病维度" tone="var(--state-danger)">
              <div className="space-y-4">
                <FieldBlock label="病种类别">
                  <Select value={filters.diseaseCat} onValueChange={(v) => set("diseaseCat", v)}>
                    <SelectTrigger className="h-9 bg-white max-w-[240px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DISEASE_CATS.map((d) => (
                        <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldBlock>
                <ChipGroup
                  label="具体病种（可多选）"
                  options={DISEASES}
                  selected={filters.diseases}
                  onToggle={(v) => toggleIn("diseases", v)}
                />
              </div>
            </Dimension>
          )}

          {/* 处方维度 */}
          {showDim("prescription") && (
            <Dimension icon={FileText} title="处方维度" tone="var(--effect-ai-purple)">
              <ChipGroup
                label="处方方案（可多选）"
                options={PRESCRIPTIONS}
                selected={filters.prescriptions}
                onToggle={(v) => toggleIn("prescriptions", v)}
              />
            </Dimension>
          )}

          {/* 工单维度 */}
          {showDim("order") && (
            <Dimension icon={ClipboardList} title="工单维度" tone="var(--state-warning)">
              <div className="space-y-4">
                <FieldBlock label="工单状态">
                  <Select value={filters.status} onValueChange={(v) => set("status", v)}>
                    <SelectTrigger className="h-9 bg-white max-w-[240px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((d) => (
                        <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldBlock>
                <div>
                  <div className="text-body-sm text-text-secondary mb-2">工单类型（可多选）</div>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(WO_TYPE_LABEL) as WorkOrderType[]).map((t) => {
                      const active = filters.woTypes.includes(t);
                      const Icon = WO_TYPE_ICON[t];
                      return (
                        <button
                          key={t}
                          onClick={() => toggleIn("woTypes", t)}
                          className={`inline-flex items-center gap-1.5 px-3 h-8 rounded-full text-body-sm border transition-colors ${
                            active
                              ? "border-primary bg-brand-subtle text-primary"
                              : "border-border bg-white text-text-secondary hover:border-primary/40 hover:text-foreground"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                          {WO_TYPE_LABEL[t]}
                          {active && <Check className="h-3 w-3" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Dimension>
          )}

          {/* 产犊维度 */}
          {showDim("calving") && (
            <Dimension icon={Baby} title="产犊维度" tone="var(--effect-ai-purple)">
              <div className="space-y-4">
                <FieldBlock label="犊牛结局">
                  <Select value={filters.calfOutcome} onValueChange={(v) => set("calfOutcome", v)}>
                    <SelectTrigger className="h-9 bg-white max-w-[240px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CALF_OUTCOMES.map((d) => (
                        <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldBlock>
                <ChipGroup
                  label="产犊方式（可多选）"
                  options={CALVING_TYPES}
                  selected={filters.calvingTypes}
                  onToggle={(v) => toggleIn("calvingTypes", v)}
                />
              </div>
            </Dimension>
          )}

          {/* 药品维度 */}
          {showDim("drug") && (
            <Dimension icon={Pill} title="药品维度" tone="var(--state-success)">
              <div className="space-y-4">
                <FieldBlock label="给药方式">
                  <Select value={filters.drugRoute} onValueChange={(v) => set("drugRoute", v)}>
                    <SelectTrigger className="h-9 bg-white max-w-[240px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DRUG_ROUTES.map((d) => (
                        <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldBlock>
                <ChipGroup
                  label="药品（可多选）"
                  options={DRUGS}
                  selected={filters.drugs}
                  onToggle={(v) => toggleIn("drugs", v)}
                />
              </div>
            </Dimension>
          )}
        </div>

        <div className="border-t border-border px-6 py-4 flex items-center gap-3 bg-white">
          <Button
            className="h-10 px-5 bg-primary hover:bg-[var(--brand-hover)]"
            onClick={() => {
              setDrawerOpen(false);
              runFilter(filters, editingTemplate ? editingTemplate.name : `${TPL_CATEGORY_LABEL[cat]}分析结果`);
            }}
          >
            <Filter className="h-4 w-4 mr-1.5" />
            查看筛选结果
          </Button>
          {editingId ? (
            <Button variant="outline" className="h-10 px-5" onClick={() => { saveEdits(); setDrawerOpen(false); }}>
              <Save className="h-4 w-4 mr-1.5" />
              保存模板修改
            </Button>
          ) : (
            <Button variant="outline" className="h-10 px-5" onClick={() => openSave(filters)}>
              <Save className="h-4 w-4 mr-1.5" />
              保存为模板
            </Button>
          )}
          <Button variant="ghost" className="h-10 px-5 ml-auto" onClick={() => setDrawerOpen(false)}>
            取消
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );


  if (view === "templates") {
    return (
      <>
        <AppHeader title="统计分析" breadcrumb={["首页", "统计分析"]} />
        <main className="flex-1 px-6 py-6 space-y-5 bg-white">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="text-card-title font-medium text-foreground">我的报表模板</div>
              <div className="text-caption text-text-tertiary mt-0.5">
                共 {templates.length} 个模板 · 支持时间、操作人员、疾病、处方、工单、产犊、药品多维度筛选
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="搜索模板名称 / 筛选条件"
                  className="h-9 w-[260px] pl-8 bg-white"
                />
              </div>
              <Button className="h-9 bg-primary hover:bg-[var(--brand-hover)]" onClick={() => openBuilder()}>
                <Plus className="h-4 w-4 mr-1" />
                新建筛选
              </Button>
            </div>
          </div>

          <Card className="border-border bg-white overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-subtle/60">
                  <TableHead>模板名称</TableHead>
                  <TableHead>分析类别</TableHead>
                  <TableHead className="text-right">筛选条件数量</TableHead>
                  <TableHead className="text-right">使用次数</TableHead>
                  <TableHead>创建人</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleTemplates.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          type="button"
                          onClick={() => toggleFav(t.id)}
                          aria-label="收藏"
                          className="shrink-0"
                        >
                          <Star
                            className={`h-3.5 w-3.5 ${
                              t.favorite
                                ? "fill-[var(--state-warning)] text-[var(--state-warning)]"
                                : "text-text-tertiary"
                            }`}
                          />
                        </button>
                        <div className="min-w-0">
                          <div className="text-body-sm font-medium text-foreground truncate">{t.name}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-md text-caption whitespace-nowrap"
                        style={{
                          background: `color-mix(in oklab, ${TPL_CATEGORY_TONE[t.category]} 12%, transparent)`,
                          color: TPL_CATEGORY_TONE[t.category],
                        }}
                      >
                        {TPL_CATEGORY_LABEL[t.category]}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-body-sm">
                      {countActive(t.filters)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-body-sm">{t.usage ?? 0}</TableCell>
                    <TableCell className="text-body-sm text-text-secondary whitespace-nowrap">{t.creator}</TableCell>
                    <TableCell className="text-body-sm text-text-secondary whitespace-nowrap">{t.createdAt}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 text-primary"
                        onClick={() => runFilter(t.filters, t.name)}
                      >
                        查看结果
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => openBuilder(t)}>
                        <Pencil className="h-3.5 w-3.5 mr-1" />
                        编辑
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 text-text-tertiary"
                        onClick={() => removeTemplate(t.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        删除
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {visibleTemplates.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-14 text-center text-body-sm text-text-tertiary">
                      没有匹配的模板
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>

        </main>
        {saveDialog}
        {catDialog}
        {builderDrawer}
      </>
    );
  }




  if (view === "result") {
    return (
      <>
        <AppHeader title="统计分析" breadcrumb={["首页", "统计分析", resultTitle]} />
        <main className="flex-1 px-6 py-6 space-y-4 bg-white">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <Button variant="outline" size="sm" onClick={() => setView(resultBack)} className="h-9 shrink-0">
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                {resultBack === "templates" ? "返回模板" : "返回筛选"}
              </Button>
              <div className="min-w-0">
                <div className="text-card-title font-medium text-foreground truncate">{resultTitle}</div>
                <div className="text-caption text-text-tertiary mt-0.5">
                  共 <span className="tabular-nums text-foreground font-medium">{filteredRows.length}</span> 条 · {describeFilters(resultFilters)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => {
                  setFilters(resultFilters);
                  setEditingId(null);
                  setBuilderCat(inferCategory(resultFilters));
                  setDrawerOpen(true);
                }}
              >
                <Filter className="h-3.5 w-3.5 mr-1" />
                调整筛选
              </Button>
              <Button variant="outline" size="sm" className="h-9" onClick={() => openSave(resultFilters)}>
                <Save className="h-3.5 w-3.5 mr-1" />
                保存为模板
              </Button>
              <Button
                size="sm"
                className="h-9 bg-primary hover:bg-[var(--brand-hover)]"
                onClick={() => {
                  downloadCsv(filteredRows, `${resultTitle}.csv`);
                  toast.success("已开始下载 CSV");
                }}
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                导出数据
              </Button>
            </div>

          </div>

          <Card className="border-border bg-white overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-subtle/60">
                  <TableHead>工单编号</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>牛只耳号</TableHead>
                  <TableHead>牧场 · 牛舍</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作人员</TableHead>
                  <TableHead>疾病</TableHead>
                  <TableHead>处方</TableHead>
                  <TableHead>药品 · 给药</TableHead>
                  <TableHead>产犊</TableHead>
                  <TableHead>创建时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((r) => {
                  const Icon = WO_TYPE_ICON[r.type];
                  const s = STATUS_TAG[r.status];
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-body-sm">{r.id}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 text-body-sm whitespace-nowrap">
                          <Icon className="h-3.5 w-3.5 text-text-tertiary" strokeWidth={1.75} />
                          {WO_TYPE_LABEL[r.type]}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-body-sm">{r.earTag}</TableCell>
                      <TableCell className="text-body-sm text-text-secondary whitespace-nowrap">{r.farm} · {r.barn}</TableCell>
                      <TableCell>
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-md text-caption whitespace-nowrap"
                          style={{ background: s.bg, color: s.color }}
                        >
                          {s.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-body-sm whitespace-nowrap">
                        {r.operator}
                        <span className="text-caption text-text-tertiary ml-1">
                          {ROLE_OPTIONS.find((x) => x.value === r.role)?.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-body-sm text-text-secondary whitespace-nowrap">{r.disease}</TableCell>
                      <TableCell className="text-body-sm text-text-secondary whitespace-nowrap">{r.prescription}</TableCell>
                      <TableCell className="text-body-sm text-text-secondary whitespace-nowrap">{r.drug} · {r.drugRoute}</TableCell>
                      <TableCell className="text-body-sm text-text-secondary whitespace-nowrap">
                        {r.calvingType === "—" ? "—" : `${r.calvingType} · ${r.calfOutcome}`}
                      </TableCell>
                      <TableCell className="text-body-sm text-text-secondary tabular-nums whitespace-nowrap">{r.createdAt}</TableCell>
                    </TableRow>
                  );
                })}
                {filteredRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-10 text-text-tertiary">
                      当前筛选条件下暂无数据
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </main>
        {saveDialog}
        {catDialog}
        {builderDrawer}
      </>
    );
  }

  return null;
}



// ============ small components ============
function FieldBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-body-sm text-text-secondary mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}

function Dimension({
  icon: Icon,
  title,
  tone,
  children,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  tone: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <span
          className="h-6 w-6 rounded-md inline-flex items-center justify-center shrink-0"
          style={{ background: `color-mix(in oklab, ${tone} 14%, transparent)`, color: tone }}
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
        </span>
        <span className="text-body font-medium text-foreground">{title}</span>
        <span className="flex-1 h-px bg-border" />
      </div>
      {children}
    </section>
  );
}

function ChipGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div>
      <div className="text-body-sm text-text-secondary mb-2">{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const active = selected.includes(o);
          return (
            <button
              key={o}
              onClick={() => onToggle(o)}
              className={`inline-flex items-center gap-1.5 px-3 h-8 rounded-full text-body-sm border transition-colors ${
                active
                  ? "border-primary bg-brand-subtle text-primary"
                  : "border-border bg-white text-text-secondary hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {o}
              {active && <Check className="h-3 w-3" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============ util ============
function countActive(f: Filters): number {
  let n = 0;
  if (f.region !== "all") n++;
  if (f.role !== "all") n++;
  if (f.diseaseCat !== "all") n++;
  if (f.status !== "all") n++;
  if (f.calfOutcome !== "all") n++;
  if (f.drugRoute !== "all") n++;
  if (f.keyword) n++;
  if (f.onlyAbnormal) n++;
  n += f.farms.length + f.barns.length + f.operators.length + f.diseases.length + f.prescriptions.length + f.woTypes.length + f.calvingTypes.length + f.drugs.length;
  return n;
}

function describeFilters(f: Filters): string {
  const parts: string[] = [];
  if (f.dateRange === "custom" && (f.dateStart || f.dateEnd)) {
    parts.push(`${f.dateStart || "不限"} ~ ${f.dateEnd || "不限"}`);
  } else {
    parts.push(DATE_PRESETS.find((d) => d.value === f.dateRange)?.label || "");
  }
  if (f.region !== "all") parts.push(f.region);
  parts.push(f.farms.length ? `牧场 ${f.farms.join("、")}` : "全部牧场");
  if (f.barns.length) parts.push(`牛舍 ${f.barns.join("、")}`);
  if (f.role !== "all") parts.push(ROLE_OPTIONS.find((d) => d.value === f.role)?.label || "");
  if (f.operators.length) parts.push(`人员 ${f.operators.join("、")}`);
  if (f.diseaseCat !== "all") parts.push(f.diseaseCat);
  if (f.diseases.length) parts.push(`病种 ${f.diseases.join("、")}`);
  if (f.prescriptions.length) parts.push(`处方 ${f.prescriptions.join("、")}`);
  parts.push(f.woTypes.length ? f.woTypes.map((t) => WO_TYPE_LABEL[t]).join("、") : "全部工单类型");
  if (f.status !== "all") parts.push(STATUS_OPTIONS.find((s) => s.value === f.status)?.label || "");
  if (f.calvingTypes.length) parts.push(`产犊 ${f.calvingTypes.join("、")}`);
  if (f.calfOutcome !== "all") parts.push(`犊牛${f.calfOutcome}`);
  if (f.drugs.length) parts.push(`药品 ${f.drugs.join("、")}`);
  if (f.drugRoute !== "all") parts.push(f.drugRoute);
  if (f.keyword) parts.push(`关键词「${f.keyword}」`);
  return parts.filter(Boolean).join(" · ");
}

function filterRows(rows: Row[], f: Filters): Row[] {
  return rows.filter((r) => {
    if (f.woTypes.length && !f.woTypes.includes(r.type)) return false;
    if (f.status !== "all" && r.status !== f.status) return false;
    if (f.region !== "all" && REGION_OF[r.farm] !== f.region) return false;
    if (f.farms.length && !f.farms.includes(r.farm)) return false;
    if (f.barns.length && !f.barns.includes(r.barn)) return false;
    if (f.role !== "all" && r.role !== f.role) return false;
    if (f.operators.length && !f.operators.includes(r.operator)) return false;
    if (f.diseaseCat !== "all" && r.diseaseCat !== f.diseaseCat) return false;
    if (f.diseases.length && !f.diseases.includes(r.disease)) return false;
    if (f.prescriptions.length && !f.prescriptions.includes(r.prescription)) return false;
    if (f.calvingTypes.length && !f.calvingTypes.includes(r.calvingType)) return false;
    if (f.calfOutcome !== "all" && r.calfOutcome !== f.calfOutcome) return false;
    if (f.drugs.length && !f.drugs.includes(r.drug)) return false;
    if (f.drugRoute !== "all" && r.drugRoute !== f.drugRoute) return false;
    if (f.dateRange === "custom") {
      if (f.dateStart && r.createdAt < f.dateStart) return false;
      if (f.dateEnd && r.createdAt > f.dateEnd) return false;
    }
    if (f.keyword) {
      const k = f.keyword.toLowerCase();
      if (!r.id.toLowerCase().includes(k) && !r.earTag.toLowerCase().includes(k)) return false;
    }
    return true;
  });
}

function downloadCsv(rows: Row[], filename: string) {
  const header = ["工单编号", "类型", "耳号", "牧场", "牛舍", "状态", "操作人员", "疾病", "病种类别", "处方", "药品", "给药方式", "产犊方式", "犊牛结局", "创建时间", "说明"];
  const body = rows.map((r) => [
    r.id,
    WO_TYPE_LABEL[r.type],
    r.earTag,
    r.farm,
    r.barn,
    STATUS_TAG[r.status]?.label || r.status,
    r.operator,
    r.disease,
    r.diseaseCat,
    r.prescription,
    r.drug,
    r.drugRoute,
    r.calvingType,
    r.calfOutcome,
    r.createdAt,
    r.detail.replace(/"/g, '""'),
  ]);
  const csv = [header, ...body]
    .map((row) => row.map((c) => `"${c}"`).join(","))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
