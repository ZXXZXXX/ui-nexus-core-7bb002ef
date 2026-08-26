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
  MoreHorizontal,
  CalendarDays,
  Users,
  ClipboardList,
  FileText,
  Beef,
  ChevronLeft,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { METRIC_SECTIONS, SECTION_BY_KEY } from "@/lib/health-metrics";

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
const PERF_TYPES = ["治疗", "接生", "工单"];
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
const DRUG_TYPES = ["抗生素", "消炎药", "止痛药", "体液补充剂", "驱虫药", "激素类", "其他"];
const DRUGS_OF_TYPE: Record<string, string[]> = {
  抗生素: ["精制盐酸头孢噻呋注射液"],
  消炎药: ["氟尼新葡甲胺注射液"],
  止痛药: [],
  体液补充剂: ["复方氯化钠注射液", "20% 葡萄糖注射液"],
  驱虫药: ["伊维菌素注射液"],
  激素类: [],
  其他: ["产后灌注"],
};
const CALVING_TYPES = ["顺产", "轻度助产", "难产", "剖腹产"];
const CALF_OUTCOMES = [
  { value: "all", label: "全部犊牛结局" },
  { value: "存活", label: "存活" },
  { value: "死胎", label: "死胎" },
  { value: "不留养", label: "不留养" },
];

/** 牛只维度字典 */
const CATTLE_TYPES = ["犊牛", "育成牛", "青年牛", "泌乳牛", "干奶牛"];
const PARITY_OPTIONS = ["0 胎", "1 胎", "2 胎", "3 胎", "4 胎", "5 胎及以上"];
const REPORT_COUNT_OPTIONS = [
  { value: "all", label: "不限报病次数" },
  { value: "0", label: "0 次" },
  { value: "1-2", label: "1 ~ 2 次" },
  { value: "3-5", label: "3 ~ 5 次" },
  { value: "5+", label: "5 次以上" },
];
const COW_STATUSES = ["健康", "观察中", "治疗中", "死淘"];
const CALF_SEX_OPTIONS = [
  { value: "all", label: "全部性别" },
  { value: "母", label: "母" },
  { value: "公", label: "公" },
];
const CALF_WEIGHT_OPTIONS = [
  { value: "all", label: "不限出生体重" },
  { value: "<35", label: "35kg 以下" },
  { value: "35-45", label: "35 ~ 45kg" },
  { value: ">45", label: "45kg 以上" },
];
const CALF_KEEP_OPTIONS = [
  { value: "all", label: "全部留养情况" },
  { value: "留养", label: "留养" },
  { value: "不留养", label: "不留养" },
];
const EXIT_TYPE_OPTIONS = [
  { value: "all", label: "全部离场类型" },
  { value: "死亡", label: "死亡" },
  { value: "淘汰", label: "淘汰" },
  { value: "转场", label: "转场" },
];

/** 疾病维度字典：类别 → 病种 → 子类型 */
const DISEASES_OF_CAT: Record<string, string[]> = {
  乳房疾病: ["临床型乳房炎", "隐性乳房炎"],
  肢蹄疾病: ["蹄叶炎", "腐蹄病"],
  繁殖疾病: ["子宫内膜炎", "胎衣不下"],
  呼吸道疾病: ["支气管肺炎"],
  消化系统疾病: ["瘤胃酸中毒"],
  代谢及其他: ["酮病"],
};
const SUBTYPES_OF: Record<string, string[]> = {
  临床型乳房炎: ["轻度", "中度", "重度"],
  隐性乳房炎: ["体细胞升高", "反复发作"],
  蹄叶炎: ["急性", "慢性"],
  腐蹄病: ["蹄间腐烂", "蹄底溃疡"],
  子宫内膜炎: ["急性", "慢性"],
  胎衣不下: ["产后正常", "产后高危"],
  支气管肺炎: ["犊牛型", "成母牛型"],
  瘤胃酸中毒: ["急性", "亚急性"],
  酮病: ["I 型", "II 型", "亚临床"],
};


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
  // 人员绩效
  perfTypes: string[];
  treatDiseaseCat: string;
  treatDiseases: string[];
  treatSubs: string[];
  treatDaysMin: string;
  treatDaysMax: string;
  perfRxUsageMin: string;
  perfRxUsageMax: string;
  perfRxCureMin: string;
  perfRxCureMax: string;
  specialDrugMin: string;
  specialDrugMax: string;
  survivalMin: string;
  survivalMax: string;
  woDoneMin: string;
  woDoneMax: string;
  woOverdueMin: string;
  woOverdueMax: string;
  // 疾病维度
  diseases: string[];
  diseaseCat: string;
  diseaseSubs: string[];
  // 疾病指标区间（min/max，空表示不限）
  caseCountMin: string;
  caseCountMax: string;
  cureRateMin: string;
  cureRateMax: string;
  cullRateMin: string;
  cullRateMax: string;
  rxUsageMin: string;
  rxUsageMax: string;
  rxCureMin: string;
  rxCureMax: string;
  rxDaysMin: string;
  rxDaysMax: string;
  rxCostMin: string;
  rxCostMax: string;
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
  drugTypes: string[];
  drugRoute: string;
  drugUsageMin: string;
  drugUsageMax: string;
  // 牛只维度
  cattleTypes: string[];
  parities: string[];
  reportCount: string;
  cowStatuses: string[];
  calfSex: string;
  calfWeight: string;
  calfKeep: string;
  exitType: string;
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
  perfTypes: [],
  treatDiseaseCat: "all",
  treatDiseases: [],
  treatSubs: [],
  treatDaysMin: "",
  treatDaysMax: "",
  perfRxUsageMin: "",
  perfRxUsageMax: "",
  perfRxCureMin: "",
  perfRxCureMax: "",
  specialDrugMin: "",
  specialDrugMax: "",
  survivalMin: "",
  survivalMax: "",
  woDoneMin: "",
  woDoneMax: "",
  woOverdueMin: "",
  woOverdueMax: "",
  diseases: [],
  diseaseCat: "all",
  diseaseSubs: [],
  caseCountMin: "",
  caseCountMax: "",
  cureRateMin: "",
  cureRateMax: "",
  cullRateMin: "",
  cullRateMax: "",
  rxUsageMin: "",
  rxUsageMax: "",
  rxCureMin: "",
  rxCureMax: "",
  rxDaysMin: "",
  rxDaysMax: "",
  rxCostMin: "",
  rxCostMax: "",
  prescriptions: [],
  woTypes: [],
  status: "all",
  calvingTypes: [],
  calfOutcome: "all",
  drugs: [],
  drugTypes: [],
  drugRoute: "all",
  drugUsageMin: "",
  drugUsageMax: "",
  cattleTypes: [],
  parities: [],
  reportCount: "all",
  cowStatuses: [],
  calfSex: "all",
  calfWeight: "all",
  calfKeep: "all",
  exitType: "all",
  keyword: "",
  onlyAbnormal: false,
};

// ============ Templates ============
type TplCategory = "cattle" | "disease" | "drug" | "staff";
type DimensionKey = "farm" | "cattle" | "disease" | "prescription" | "order" | "calving" | "drug" | "staff";

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

const DIMENSION_LABEL: Record<DimensionKey, string> = {
  farm: "牧场",
  cattle: "牛只",
  disease: "疾病",
  prescription: "处方",
  order: "工单",
  calving: "产犊",
  drug: "药品",
  staff: "人员",
};

const DIMENSION_TONE: Record<DimensionKey, string> = {
  farm: "var(--effect-ai-purple)",
  cattle: "var(--brand)",
  disease: "var(--state-danger)",
  prescription: "var(--effect-ai-purple)",
  order: "var(--state-warning)",
  calving: "var(--effect-ai-purple)",
  drug: "var(--state-success)",
  staff: "var(--effect-ai-cyan)",
};

const CATEGORY_DIMENSIONS: Record<TplCategory, DimensionKey[]> = {
  cattle: ["farm", "cattle"],
  disease: ["farm", "disease"],
  drug: ["farm", "drug"],
  staff: ["farm", "staff"],
};

const SECTION_CATEGORY: Record<string, TplCategory> = {
  culling: "cattle",
  calving: "cattle",
  udder: "disease",
  disease: "disease",
  postpartum: "disease",
  immune: "cattle",
};

const SECTION_FILTER_PRESET: Record<string, Partial<Filters>> = {
  culling: { cowStatuses: ["死淘"] },
  calving: {},
  udder: { diseaseCat: "乳房疾病" },
  disease: { woTypes: ["disease"] },
  postpartum: { woTypes: ["postpartum"] },
  immune: { woTypes: ["vaccine"] },
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
  frozen?: boolean;
  usage?: number;
  creator: string;
  createdAt: string;
  section?: string;
  dimensions?: DimensionKey[];
  formula?: string;
  metricNo?: number;
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

const METRIC_TEMPLATES: Template[] = METRIC_SECTIONS.flatMap((sec) =>
  sec.metrics.map((m) => ({
    id: `m-${m.no}`,
    category: SECTION_CATEGORY[sec.key] ?? "cattle",
    name: m.name,
    desc: m.formula,
    formula: m.formula,
    metricNo: m.no,
    section: sec.key,
    dimensions: ["farm"],
    icon: BarChart3,
    tone: sec.tone,
    filters: { ...DEFAULT_FILTERS, dateRange: "30d", ...(SECTION_FILTER_PRESET[sec.key] ?? {}) },
    usage: 20 + ((m.no * 37) % 180),
    creator: "系统预置",
    createdAt: "2026-07-01 09:00",
  })),
);

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

type MetricResultRow = {
  id: string;
  farm: string;
  numeratorLabel: string;
  numerator: number;
  denominatorLabel: string;
  denominator: number;
  value: string;
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


// ============ 结果列：仅展示所选维度下的可筛选字段 ============
type ResultCol = { key: string; label: string; num?: boolean; value: (r: Row) => string };

function seedNum(seed: string, min: number, max: number) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return min + (h % (max - min + 1));
}
const pickOf = <T,>(seed: string, list: T[]): T => list[seedNum(seed, 0, list.length - 1)];

function metricRateRange(name: string): [number, number] {
  if (name.includes("抗体阳性率") || name.includes("完工率")) return [88, 98];
  if (name.includes("成活率") || name.includes("治愈率")) return [78, 96];
  if (name.includes("母犊率") || name.includes("留养率")) return [42, 58];
  if (name.includes("死亡率")) return [0.3, 1.5];
  if (name.includes("淘汰率")) return [1.2, 3.8];
  if (name.includes("发病率")) return [2.5, 10.5];
  if (name.includes("早产率") || name.includes("双胎率")) return [2, 7];
  if (name.includes("占比")) return [8, 36];
  return [3, 18];
}

function metricOperandLabels(formula: string): [string, string] {
  if (formula === "源表未提供") return ["统计值", "统计基数"];
  const normalized = formula.replace(/\*100%/g, "").replace(/\*100/g, "");
  const [left, ...rightParts] = normalized.split("/");
  return [left?.trim() || "统计值", rightParts.join("/").trim() || "统计基数"];
}

function metricRows(template: Template, filters: Filters): MetricResultRow[] {
  const farms = filters.farms.length ? filters.farms : FARM_NAMES;
  const [numeratorLabel, denominatorLabel] = metricOperandLabels(template.formula ?? template.desc);
  const name = template.name;
  const isAverage = name.includes("平均") && !name.includes("率");
  const isCount = name.includes("头数") && !name.includes("率") && !name.includes("占比");
  const isRate = !isAverage && !isCount;

  return farms.map((farm) => {
    const seed = `${template.id}-${farm}`;
    if (isAverage) {
      const numerator = seedNum(seed + "sum", 8200, 12800);
      const denominator = seedNum(seed + "count", 30, 46);
      return {
        id: `${template.id}-${farm}`,
        farm,
        numeratorLabel,
        numerator,
        denominatorLabel,
        denominator,
        value: `${(numerator / denominator).toFixed(1)} 天`,
      };
    }
    if (isCount) {
      const numerator = seedNum(seed + "count", 12, 68);
      return {
        id: `${template.id}-${farm}`,
        farm,
        numeratorLabel,
        numerator,
        denominatorLabel: "统计周期",
        denominator: 1,
        value: `${numerator} 头`,
      };
    }

    const [minRate, maxRate] = metricRateRange(name);
    const denominator = seedNum(seed + "base", 1250, 2380);
    const rateTenths = seedNum(seed + "rate", Math.round(minRate * 10), Math.round(maxRate * 10));
    const numerator = Math.max(1, Math.round((denominator * rateTenths) / 1000));
    return {
      id: `${template.id}-${farm}`,
      farm,
      numeratorLabel,
      numerator,
      denominatorLabel,
      denominator,
      value: isRate ? `${((numerator / denominator) * 100).toFixed(2)}%` : String(numerator),
    };
  });
}

function resultColumns(cat: TplCategory, f: Filters): ResultCol[] {
  const cols: ResultCol[] = [];
  if (cat === "cattle") {
    const isCalf = (r: Row) => r.barn.startsWith("犊牛");
    cols.push(
      { key: "earTag", label: "牛只耳号", value: (r) => r.earTag },
      { key: "cattleType", label: "牛只类型", value: (r) => (isCalf(r) ? "犊牛" : pickOf(r.id + "ct", ["育成牛", "青年牛", "泌乳牛", "干奶牛"])) },
      { key: "parity", label: "牛只胎次", num: true, value: (r) => (isCalf(r) ? "—" : `${seedNum(r.id + "p", 1, 5)} 胎`) },
      { key: "reportCount", label: "报病次数", num: true, value: (r) => String(seedNum(r.id + "rc", 0, 6)) },
      { key: "cowStatus", label: "当前状态", value: (r) => pickOf(r.id + "cs", COW_STATUSES) },
    );
    if (f.cattleTypes.includes("犊牛")) {
      cols.push(
        { key: "calfSex", label: "性别", value: (r) => pickOf(r.id + "sex", ["母", "公"]) },
        { key: "birthWeight", label: "出生体重", num: true, value: (r) => `${seedNum(r.id + "bw", 32, 48)} kg` },
        { key: "calfKeep", label: "留养情况", value: (r) => pickOf(r.id + "kp", ["留养", "不留养"]) },
      );
    }
    if (f.cowStatuses.includes("死淘") || f.exitType !== "all") {
      cols.push({ key: "exitType", label: "离场类型", value: (r) => pickOf(r.id + "ex", ["死亡", "淘汰", "转场"]) });
    }
    cols.push({ key: "createdAt", label: "统计时间", value: (r) => r.createdAt });
    return cols;
  }
  if (cat === "disease") {
    return [
      { key: "diseaseCat", label: "疾病类型", value: (r) => (r.diseaseCat === "—" ? pickOf(r.id + "dc", Object.keys(DISEASES_OF_CAT)) : r.diseaseCat) },
      { key: "disease", label: "疾病名称", value: (r) => (r.disease === "—" ? pickOf(r.id + "dn", DISEASES) : r.disease) },
      { key: "sub", label: "疾病子类型", value: (r) => { const d = r.disease === "—" ? pickOf(r.id + "dn", DISEASES) : r.disease; return pickOf(r.id + "sb", SUBTYPES_OF[d] ?? ["常规"]); } },
      { key: "caseCount", label: "发病头数", num: true, value: (r) => String(seedNum(r.id + "cc", 3, 68)) },
      { key: "cureRate", label: "治愈率", num: true, value: (r) => `${seedNum(r.id + "cr", 62, 98)}%` },
      { key: "cullRate", label: "死淘率", num: true, value: (r) => `${seedNum(r.id + "kr", 0, 12)}%` },
      { key: "rx", label: "处方", value: (r) => r.prescription },
      { key: "rxUsage", label: "处方使用率", num: true, value: (r) => `${seedNum(r.id + "ru", 15, 90)}%` },
      { key: "rxCure", label: "处方治愈率", num: true, value: (r) => `${seedNum(r.id + "rk", 55, 97)}%` },
      { key: "rxDays", label: "平均诊疗天数", num: true, value: (r) => `${seedNum(r.id + "rd", 2, 9)} 天` },
      { key: "rxCost", label: "处方药费", num: true, value: (r) => `¥${seedNum(r.id + "rf", 40, 460)}` },
    ];
  }
  if (cat === "drug") {
    return [
      { key: "drug", label: "药品名称", value: (r) => r.drug },
      { key: "drugType", label: "药品类型", value: (r) => pickOf(r.id + "dt", DRUG_TYPES) },
      { key: "usage", label: "使用量", num: true, value: (r) => `${seedNum(r.id + "us", 5, 320)} 支` },
    ];
  }
  // staff
  const perf = f.perfTypes.length ? f.perfTypes : PERF_TYPES;
  cols.push(
    { key: "farm", label: "牧场", value: (r) => r.farm },
    { key: "operator", label: "姓名", value: (r) => r.operator },
    { key: "role", label: "角色", value: () => "兽医" },
    { key: "perf", label: "绩效类型", value: () => perf.join(" / ") },
  );
  if (perf.includes("治疗")) {
    cols.push(
      { key: "tCat", label: "治疗疾病类型", value: (r) => (r.diseaseCat === "—" ? pickOf(r.id + "dc", Object.keys(DISEASES_OF_CAT)) : r.diseaseCat) },
      { key: "tDisease", label: "治疗疾病名称", value: (r) => (r.disease === "—" ? pickOf(r.id + "dn", DISEASES) : r.disease) },
      { key: "tSub", label: "治疗疾病子类型", value: (r) => { const d = r.disease === "—" ? pickOf(r.id + "dn", DISEASES) : r.disease; return pickOf(r.id + "sb", SUBTYPES_OF[d] ?? ["常规"]); } },
      { key: "tDays", label: "平均疗程", num: true, value: (r) => `${seedNum(r.id + "td", 2, 10)} 天` },
      { key: "tRxUsage", label: "处方使用率", num: true, value: (r) => `${seedNum(r.id + "pu", 10, 92)}%` },
      { key: "tRxCure", label: "处方治愈率", num: true, value: (r) => `${seedNum(r.id + "pc", 55, 98)}%` },
      { key: "tSpecial", label: "特殊药品使用次数", num: true, value: (r) => String(seedNum(r.id + "sp", 0, 14)) },
    );
  }
  if (perf.includes("接生")) {
    cols.push({ key: "survival", label: "存活率", num: true, value: (r) => `${seedNum(r.id + "sv", 78, 100)}%` });
  }
  if (perf.includes("工单")) {
    cols.push(
      { key: "woType", label: "工单类型", value: (r) => WO_TYPE_LABEL[r.type] },
      { key: "woDone", label: "完成次数", num: true, value: (r) => String(seedNum(r.id + "wd", 2, 60)) },
      { key: "woOver", label: "逾期次数", num: true, value: (r) => String(seedNum(r.id + "wo", 0, 9)) },
    );
  }
  return cols;
}


// ============ Page ============
function StatsPage() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [templates, setTemplates] = useState<Template[]>([...METRIC_TEMPLATES, ...DEFAULT_TEMPLATES]);
  const [view, setView] = useState<"sections" | "templates" | "result">("sections");
  const [activeSection, setActiveSection] = useState<string>("custom");
  const [resultFilters, setResultFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [resultTitle, setResultTitle] = useState("筛选结果");
  const [resultCat, setResultCat] = useState<TplCategory>("cattle");
  const [resultMetric, setResultMetric] = useState<Template | null>(null);
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

  const runFilter = (f: Filters, title = "筛选结果", cat?: TplCategory, metric?: Template) => {
    setResultFilters(f);
    setResultCat(cat ?? inferCategory(f));
    setResultTitle(title);
    setResultMetric(metric?.metricNo ? metric : null);
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
    setFilters(c === "staff" ? { ...DEFAULT_FILTERS, role: "vet" } : DEFAULT_FILTERS);
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
        section: activeSection,
        name: saveName.trim(),
        category: builderCat ?? inferCategory(saveSource),
        dimensions: CATEGORY_DIMENSIONS[builderCat ?? inferCategory(saveSource)],
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

  const toggleFreeze = (id: string) => {
    const nextFrozen = !(templates.find((t) => t.id === id)?.frozen);
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, frozen: nextFrozen } : t)),
    );
    toast.success(nextFrozen ? "模板已冻结" : "模板已解冻");
  };

  const toggleFav = (id: string) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, favorite: !t.favorite } : t)),
    );
  };

  const filteredRows = useMemo(() => filterRows(ROWS, resultFilters), [resultFilters]);
  const resultCols = useMemo(() => resultColumns(resultCat, resultFilters), [resultCat, resultFilters]);
  const aggregatedMetricRows = useMemo(
    () => (resultMetric ? metricRows(resultMetric, resultFilters) : []),
    [resultMetric, resultFilters],
  );
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
    return [...list]
      .filter((t) => (t.section ?? "custom") === activeSection)
      .sort((a, b) => Number(!!b.favorite) - Number(!!a.favorite));
  }, [templates, query, activeSection]);

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
  const builderDims = editingTemplate?.dimensions ?? CATEGORY_DIMENSIONS[cat];
  const showDim = (d: DimensionKey) => builderDims.includes(d);

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
            </div>
          </Dimension>

          {/* 牧场维度 */}
          {showDim("farm") && (
            <Dimension icon={Building2} title="牧场维度" tone="var(--effect-ai-purple)">
              <div className="space-y-4">
                {cat !== "staff" && (
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
                )}
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
                {cat !== "staff" && (
                  <ChipGroup
                    label="牛舍（可多选）"
                    options={BARN_NAMES}
                    selected={filters.barns}
                    onToggle={(v) => toggleIn("barns", v)}
                  />
                )}
              </div>
            </Dimension>
          )}

          {/* 牛只维度 */}
          {showDim("cattle") && (
            <Dimension icon={Beef} title="牛只维度" tone="var(--brand)">
              <div className="space-y-4">
                <ChipGroup
                  label="牛只类型（可多选）"
                  options={CATTLE_TYPES}
                  selected={filters.cattleTypes}
                  onToggle={(v) => {
                    if (v === "犊牛" && !filters.cattleTypes.includes("犊牛")) {
                      setFilters((p) => ({ ...p, cattleTypes: ["犊牛"], parities: [] }));
                      return;
                    }
                    toggleIn("cattleTypes", v);
                  }}
                  disabledOptions={
                    filters.parities.length > 0
                      ? ["犊牛"]
                      : filters.cattleTypes.includes("犊牛")
                        ? CATTLE_TYPES.filter((t) => t !== "犊牛")
                        : []
                  }
                  hint={
                    filters.cattleTypes.includes("犊牛")
                      ? "犊牛与成母牛群体口径不同，不可同时选择，且无胎次维度"
                      : filters.parities.length > 0
                        ? "已选择胎次条件，犊牛不适用"
                        : undefined
                  }
                />


                {filters.cattleTypes.includes("犊牛") && (
                  <div className="pl-3 border-l-2 border-primary/30 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FieldBlock label="性别">
                        <Select value={filters.calfSex} onValueChange={(v) => set("calfSex", v)}>
                          <SelectTrigger className="h-9 bg-white"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {CALF_SEX_OPTIONS.map((d) => (
                              <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FieldBlock>
                      <FieldBlock label="出生体重">
                        <Select value={filters.calfWeight} onValueChange={(v) => set("calfWeight", v)}>
                          <SelectTrigger className="h-9 bg-white"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {CALF_WEIGHT_OPTIONS.map((d) => (
                              <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FieldBlock>
                      <FieldBlock label="留养情况">
                        <Select value={filters.calfKeep} onValueChange={(v) => set("calfKeep", v)}>
                          <SelectTrigger className="h-9 bg-white"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {CALF_KEEP_OPTIONS.map((d) => (
                              <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FieldBlock>
                    </div>
                  </div>
                )}

                {!filters.cattleTypes.includes("犊牛") && (
                  <ChipGroup
                    label="牛只胎次（可多选）"
                    options={PARITY_OPTIONS}
                    selected={filters.parities}
                    onToggle={(v) => toggleIn("parities", v)}
                  />
                )}

                <FieldBlock label="报病次数">
                  <Select value={filters.reportCount} onValueChange={(v) => set("reportCount", v)}>
                    <SelectTrigger className="h-9 bg-white max-w-[240px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {REPORT_COUNT_OPTIONS.map((d) => (
                        <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldBlock>

                <ChipGroup
                  label="当前状态（可多选）"
                  options={COW_STATUSES}
                  selected={filters.cowStatuses}
                  onToggle={(v) => toggleIn("cowStatuses", v)}
                />

                {filters.cowStatuses.includes("死淘") && (
                  <div className="pl-3 border-l-2 border-primary/30">
                    <FieldBlock label="离场类型">
                      <Select value={filters.exitType} onValueChange={(v) => set("exitType", v)}>
                        <SelectTrigger className="h-9 bg-white max-w-[240px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {EXIT_TYPE_OPTIONS.map((d) => (
                            <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FieldBlock>
                  </div>
                )}
              </div>
            </Dimension>
          )}



          {/* 操作人员维度 */}
          {showDim("staff") && (
            <Dimension icon={Users} title="人员维度" tone="var(--effect-ai-cyan)">
              <div className="space-y-4">
                <FieldBlock label="角色（当前仅支持兽医）">
                  <Select value="vet" onValueChange={(v) => set("role", v)}>
                    <SelectTrigger className="h-9 bg-white max-w-[240px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vet">兽医</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldBlock>
                <ChipGroup
                  label="绩效类型（可多选）"
                  options={PERF_TYPES}
                  selected={filters.perfTypes}
                  onToggle={(v) => toggleIn("perfTypes", v)}
                />

                {filters.perfTypes.includes("治疗") && (
                  <div className="pl-3 border-l-2 border-primary/30 space-y-4">
                    <div className="text-body-sm text-text-secondary">治疗绩效</div>
                    <FieldBlock label="治疗疾病类型">
                      <Select value={filters.treatDiseaseCat} onValueChange={(v) => set("treatDiseaseCat", v)}>
                        <SelectTrigger className="h-9 bg-white max-w-[240px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {DISEASE_CATS.map((d) => (
                            <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FieldBlock>
                    <ChipGroup
                      label="治疗疾病名称（可多选）"
                      options={
                        filters.treatDiseaseCat === "all"
                          ? DISEASES
                          : DISEASES_OF_CAT[filters.treatDiseaseCat] || []
                      }
                      selected={filters.treatDiseases}
                      onToggle={(v) => toggleIn("treatDiseases", v)}
                    />
                    {filters.treatDiseases.length > 0 && (() => {
                      const subs = Array.from(new Set(filters.treatDiseases.flatMap((d) => SUBTYPES_OF[d] || [])));
                      if (subs.length === 0) return null;
                      return (
                        <div className="pl-3 border-l-2 border-primary/30">
                          <ChipGroup
                            label="治疗疾病子类型（可多选）"
                            options={subs}
                            selected={filters.treatSubs}
                            onToggle={(v) => toggleIn("treatSubs", v)}
                          />
                        </div>
                      );
                    })()}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <RangeField
                        label="治疗疾病平均疗程"
                        unit="天"
                        min={filters.treatDaysMin}
                        max={filters.treatDaysMax}
                        onMin={(v) => set("treatDaysMin", v)}
                        onMax={(v) => set("treatDaysMax", v)}
                      />
                      <RangeField
                        label="该疾病各处方使用率"
                        unit="%"
                        min={filters.perfRxUsageMin}
                        max={filters.perfRxUsageMax}
                        onMin={(v) => set("perfRxUsageMin", v)}
                        onMax={(v) => set("perfRxUsageMax", v)}
                      />
                      <RangeField
                        label="该疾病各处方治愈率"
                        unit="%"
                        min={filters.perfRxCureMin}
                        max={filters.perfRxCureMax}
                        onMin={(v) => set("perfRxCureMin", v)}
                        onMax={(v) => set("perfRxCureMax", v)}
                      />
                      <RangeField
                        label="该疾病特殊药品使用次数"
                        unit="次"
                        min={filters.specialDrugMin}
                        max={filters.specialDrugMax}
                        onMin={(v) => set("specialDrugMin", v)}
                        onMax={(v) => set("specialDrugMax", v)}
                      />
                    </div>
                    <div className="text-caption text-text-tertiary">
                      处方治愈率＝该兽医使用该处方治愈次数 ÷ 使用该处方次数
                    </div>
                  </div>
                )}

                {filters.perfTypes.includes("接生") && (
                  <div className="pl-3 border-l-2 border-primary/30 space-y-4">
                    <div className="text-body-sm text-text-secondary">接生绩效</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <RangeField
                        label="存活率"
                        unit="%"
                        min={filters.survivalMin}
                        max={filters.survivalMax}
                        onMin={(v) => set("survivalMin", v)}
                        onMax={(v) => set("survivalMax", v)}
                      />
                    </div>
                  </div>
                )}

                {filters.perfTypes.includes("工单") && (
                  <div className="pl-3 border-l-2 border-primary/30 space-y-4">
                    <div className="text-body-sm text-text-secondary">工单绩效</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <RangeField
                        label="各类型工单完成次数"
                        unit="次"
                        min={filters.woDoneMin}
                        max={filters.woDoneMax}
                        onMin={(v) => set("woDoneMin", v)}
                        onMax={(v) => set("woDoneMax", v)}
                      />
                      <RangeField
                        label="各类型逾期次数"
                        unit="次"
                        min={filters.woOverdueMin}
                        max={filters.woOverdueMax}
                        onMin={(v) => set("woOverdueMin", v)}
                        onMax={(v) => set("woOverdueMax", v)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </Dimension>
          )}

          {/* 疾病维度 */}
          {showDim("disease") && (
            <Dimension icon={Stethoscope} title="疾病维度" tone="var(--state-danger)">
              <div className="space-y-4">
                <FieldBlock label="疾病类型">
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
                  label="疾病名称（可多选）"
                  options={
                    filters.diseaseCat === "all"
                      ? DISEASES
                      : DISEASES_OF_CAT[filters.diseaseCat] || []
                  }
                  selected={filters.diseases}
                  onToggle={(v) => toggleIn("diseases", v)}
                />

                {filters.diseases.length > 0 && (() => {
                  const subs = Array.from(
                    new Set(filters.diseases.flatMap((d) => SUBTYPES_OF[d] || [])),
                  );
                  if (subs.length === 0) return null;
                  return (
                    <div className="pl-3 border-l-2 border-primary/30">
                      <ChipGroup
                        label="疾病子类型（可多选）"
                        options={subs}
                        selected={filters.diseaseSubs}
                        onToggle={(v) => toggleIn("diseaseSubs", v)}
                      />
                    </div>
                  );
                })()}

                <div className="pt-1 space-y-3">
                  <div className="text-body-sm text-text-secondary">指标区间（留空表示不限）</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <RangeField
                      label="发病头数"
                      unit="头"
                      min={filters.caseCountMin}
                      max={filters.caseCountMax}
                      onMin={(v) => set("caseCountMin", v)}
                      onMax={(v) => set("caseCountMax", v)}
                    />
                    <RangeField
                      label="治愈率"
                      unit="%"
                      min={filters.cureRateMin}
                      max={filters.cureRateMax}
                      onMin={(v) => set("cureRateMin", v)}
                      onMax={(v) => set("cureRateMax", v)}
                    />
                    <RangeField
                      label="死淘率"
                      unit="%"
                      min={filters.cullRateMin}
                      max={filters.cullRateMax}
                      onMin={(v) => set("cullRateMin", v)}
                      onMax={(v) => set("cullRateMax", v)}
                    />
                    <RangeField
                      label="各处方使用率"
                      unit="%"
                      min={filters.rxUsageMin}
                      max={filters.rxUsageMax}
                      onMin={(v) => set("rxUsageMin", v)}
                      onMax={(v) => set("rxUsageMax", v)}
                    />
                    <RangeField
                      label="各处方治愈率"
                      unit="%"
                      min={filters.rxCureMin}
                      max={filters.rxCureMax}
                      onMin={(v) => set("rxCureMin", v)}
                      onMax={(v) => set("rxCureMax", v)}
                    />
                    <RangeField
                      label="各处方平均诊疗天数"
                      unit="天"
                      min={filters.rxDaysMin}
                      max={filters.rxDaysMax}
                      onMin={(v) => set("rxDaysMin", v)}
                      onMax={(v) => set("rxDaysMax", v)}
                    />
                    <RangeField
                      label="各处方药费"
                      unit="元"
                      min={filters.rxCostMin}
                      max={filters.rxCostMax}
                      onMin={(v) => set("rxCostMin", v)}
                      onMax={(v) => set("rxCostMax", v)}
                    />
                  </div>
                </div>
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
                  label="药品类型（可多选）"
                  options={DRUG_TYPES}
                  selected={filters.drugTypes}
                  onToggle={(v) => toggleIn("drugTypes", v)}
                />
                {filters.drugTypes.length > 0 && (() => {
                  const list = Array.from(
                    new Set(filters.drugTypes.flatMap((t) => DRUGS_OF_TYPE[t] || [])),
                  );
                  if (list.length === 0) return null;
                  return (
                    <div className="pl-3 border-l-2 border-primary/30">
                      <ChipGroup
                        label="药品（可多选）"
                        options={list}
                        selected={filters.drugs}
                        onToggle={(v) => toggleIn("drugs", v)}
                      />
                    </div>
                  );
                })()}
                <div className="pt-1">
                  <RangeField
                    label="使用量"
                    unit="次"
                    min={filters.drugUsageMin}
                    max={filters.drugUsageMax}
                    onMin={(v) => set("drugUsageMin", v)}
                    onMax={(v) => set("drugUsageMax", v)}
                  />
                </div>
              </div>
            </Dimension>
          )}
        </div>

        <div className="border-t border-border px-6 py-4 flex items-center gap-3 bg-white">
          <Button
            className="h-10 px-5 bg-primary hover:bg-[var(--brand-hover)]"
            onClick={() => {
              setDrawerOpen(false);
              runFilter(filters, editingTemplate ? editingTemplate.name : `${TPL_CATEGORY_LABEL[cat]}分析结果`, cat);
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


  if (view === "sections") {
    const sectionCards = [
      ...METRIC_SECTIONS.map((sec) => ({
        key: sec.key,
        title: sec.title,
        desc: sec.desc,
        icon: sec.icon,
        tone: sec.tone,
        count: templates.filter((t) => t.section === sec.key).length,
      })),
      {
        key: "custom",
        title: "自定义分析",
        desc: "自建的多维筛选模板，支持时间、牧场、疾病、处方、工单、人员组合分析。",
        icon: BarChart3,
        tone: "var(--brand)",
        count: templates.filter((t) => (t.section ?? "custom") === "custom").length,
      },
    ];
    return (
      <>
        <AppHeader title="统计分析" breadcrumb={["首页", "统计分析"]} />
        <main className="flex-1 px-6 py-6 space-y-5 bg-white">
          <div>
            <div className="text-card-title font-medium text-foreground">指标板块</div>
            <div className="text-caption text-text-tertiary mt-0.5">
              共 {sectionCards.length} 个板块 · {templates.length} 个指标模板，选择板块查看其下全部指标
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sectionCards.map((sec) => {
              const Icon = sec.icon;
              const preview = templates
                .filter((t) => (t.section ?? "custom") === sec.key)
                .slice(0, 3);
              return (
                <Card
                  key={sec.key}
                  onClick={() => {
                    setActiveSection(sec.key);
                    setQuery("");
                    setView("templates");
                  }}
                  className="p-5 border-border bg-white cursor-pointer transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `color-mix(in oklab, ${sec.tone} 12%, transparent)`, color: sec.tone }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-body font-medium text-foreground truncate">{sec.title}</div>
                        <span className="text-caption text-text-tertiary whitespace-nowrap">{sec.count} 项指标</span>
                      </div>
                      <div className="text-caption text-text-tertiary mt-1 line-clamp-2">{sec.desc}</div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {preview.map((t) => (
                      <span
                        key={t.id}
                        className="px-2 py-0.5 rounded-md bg-surface-subtle text-caption text-text-secondary"
                      >
                        {t.name}
                      </span>
                    ))}
                    {sec.count > preview.length && (
                      <span className="px-2 py-0.5 text-caption text-text-tertiary">
                        +{sec.count - preview.length}
                      </span>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </main>
        {saveDialog}
        {catDialog}
        {builderDrawer}
      </>
    );
  }

  const sectionTitle =
    activeSection === "custom" ? "自定义分析" : (SECTION_BY_KEY[activeSection]?.title ?? "统计分析");

  if (view === "templates") {
    return (
      <>
        <AppHeader title="统计分析" breadcrumb={["首页", "统计分析", sectionTitle]} />
        <main className="flex-1 px-6 py-6 space-y-5 bg-white">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <Button
                variant="outline"
                size="sm"
                className="h-9 shrink-0"
                onClick={() => setView("sections")}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                返回
              </Button>
              <div className="min-w-0">
                <div className="text-card-title font-medium text-foreground">{sectionTitle}</div>
                <div className="text-caption text-text-tertiary mt-0.5">
                  共 {visibleTemplates.length} 个指标模板 · 支持时间、牧场、牛只、疾病、处方等多维度筛选
                </div>
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
              {activeSection === "custom" && (
                <Button className="h-9 bg-primary hover:bg-[var(--brand-hover)]" onClick={() => openBuilder()}>
                  <Plus className="h-4 w-4 mr-1" />
                  新建筛选
                </Button>
              )}
            </div>
          </div>

          <Card className="border-border bg-white overflow-hidden">
            <Table className="[&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-20 [&_thead_th]:bg-[var(--bg-surface-subtle)]" containerClassName="max-h-[calc(100dvh-280px)]">
              <TableHeader>
                <TableRow className="bg-surface-subtle/60">
                  <TableHead className="sticky left-0 z-30 min-w-[220px] bg-[var(--bg-surface-subtle)] shadow-[1px_0_0_0_var(--border)]">模板名称</TableHead>
                  <TableHead className="min-w-[280px]">计算方式</TableHead>
                  <TableHead>维度</TableHead>
                  <TableHead className="text-right">条件数量</TableHead>
                  <TableHead className="text-right">使用次数</TableHead>
                  <TableHead>创建人</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="text-right sticky right-0 z-30 bg-[var(--bg-surface-subtle)] shadow-[-1px_0_0_0_var(--border)]">操作</TableHead>

                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleTemplates.map((t) => (
                  <TableRow key={t.id} className="group">
                    <TableCell className="sticky left-0 z-10 bg-[var(--bg-surface-subtle)] shadow-[1px_0_0_0_var(--border)]">
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
                    <TableCell className="text-body-sm text-text-secondary max-w-[420px]">
                      {t.formula ?? describeFilters(t.filters)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5 min-w-[180px]">
                        {(t.dimensions ?? CATEGORY_DIMENSIONS[t.category]).map((dim) => (
                          <span
                            key={dim}
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-caption whitespace-nowrap"
                            style={{
                              background: `color-mix(in oklab, ${DIMENSION_TONE[dim]} 12%, transparent)`,
                              color: DIMENSION_TONE[dim],
                            }}
                          >
                            {DIMENSION_LABEL[dim]}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-body-sm">
                      {countActive(t.filters)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-body-sm">{t.usage ?? 0}</TableCell>
                    <TableCell className="text-body-sm text-text-secondary whitespace-nowrap">{t.creator}</TableCell>
                    <TableCell className="text-body-sm text-text-secondary whitespace-nowrap">{t.createdAt}</TableCell>
                    <TableCell className="text-right whitespace-nowrap sticky right-0 z-10 bg-[var(--bg-surface-subtle)] shadow-[-1px_0_0_0_var(--border)]">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 text-primary hover:bg-transparent hover:font-semibold"
                        onClick={() => runFilter(t.filters, t.name, t.category, t)}
                      >
                        查看结果
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 px-2 hover:bg-transparent hover:font-semibold hover:text-text-primary" onClick={() => openBuilder(t)}>
                        编辑
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-text-tertiary hover:bg-transparent hover:text-text-primary">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => toggleFreeze(t.id)}
                            className="text-body-sm"
                          >
                            {t.frozen ? "解冻模板" : "冻结模板"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {visibleTemplates.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-14 text-center text-body-sm text-text-tertiary">
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
                  共 <span className="tabular-nums text-foreground font-medium">{resultMetric ? aggregatedMetricRows.length : filteredRows.length}</span> 条 · {describeFilters(resultFilters)}
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
                  if (resultMetric) {
                    downloadMetricCsv(aggregatedMetricRows, `${resultTitle}.csv`);
                  } else {
                    downloadCsv(filteredRows, resultCols, `${resultTitle}.csv`);
                  }
                  toast.success("已开始下载 CSV");
                }}
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                导出数据
              </Button>
            </div>

          </div>

          <Card className="border-border bg-white overflow-hidden">
            <Table className="[&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-20 [&_thead_th]:bg-[var(--bg-surface-subtle)]" containerClassName="max-h-[calc(100dvh-280px)]">
              <TableHeader>
                <TableRow className="bg-surface-subtle/60">
                  {resultMetric ? (
                    <>
                      <TableHead className="sticky left-0 z-30 bg-[var(--bg-surface-subtle)] shadow-[1px_0_0_0_var(--border)]">牧场</TableHead>
                      <TableHead className="min-w-[240px]">分子</TableHead>
                      <TableHead className="min-w-[240px]">分母</TableHead>
                      <TableHead className="text-right">{resultMetric.name}</TableHead>
                    </>
                  ) : resultCols.map((c, i) => (
                    <TableHead key={c.key} className={`${c.num ? "text-right" : ""} ${i === 0 ? "sticky left-0 z-30 bg-[var(--bg-surface-subtle)] shadow-[1px_0_0_0_var(--border)]" : ""}`}>
                      {c.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {resultMetric ? aggregatedMetricRows.map((r) => (
                  <TableRow key={r.id} className="group">
                    <TableCell className="text-body-sm font-medium text-foreground whitespace-nowrap sticky left-0 z-10 bg-[var(--bg-surface-subtle)] shadow-[1px_0_0_0_var(--border)]">{r.farm}</TableCell>
                    <TableCell className="text-body-sm text-text-secondary">
                      <span className="tabular-nums text-foreground">{r.numerator.toLocaleString()}</span>
                      <span className="ml-2 text-caption text-text-tertiary">{r.numeratorLabel}</span>
                    </TableCell>
                    <TableCell className="text-body-sm text-text-secondary">
                      <span className="tabular-nums text-foreground">{r.denominator.toLocaleString()}</span>
                      <span className="ml-2 text-caption text-text-tertiary">{r.denominatorLabel}</span>
                    </TableCell>
                    <TableCell className="text-right text-body-sm font-medium tabular-nums text-foreground">{r.value}</TableCell>
                  </TableRow>
                )) : filteredRows.map((r) => (
                    <TableRow key={r.id} className="group">
                      {resultCols.map((c, i) => (
                        <TableCell
                          key={c.key}
                          className={`text-body-sm whitespace-nowrap ${
                            c.num ? "text-right tabular-nums text-foreground" : "text-text-secondary"
                          } ${i === 0 ? "sticky left-0 z-10 bg-[var(--bg-surface-subtle)] shadow-[1px_0_0_0_var(--border)]" : ""}`}
                        >
                          {c.value(r)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                {(resultMetric ? aggregatedMetricRows.length === 0 : filteredRows.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={resultMetric ? 4 : resultCols.length} className="text-center py-10 text-text-tertiary">
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
/** 预置区间选项：value 形如 "min|max"，空串表示不限 */
const RANGE_PRESETS: Record<string, { value: string; label: string }[]> = {
  "%": [
    { value: "|", label: "不限" },
    { value: "|60", label: "低于 60%" },
    { value: "60|80", label: "60% ~ 80%" },
    { value: "80|90", label: "80% ~ 90%" },
    { value: "90|", label: "90% 以上" },
  ],
  天: [
    { value: "|", label: "不限" },
    { value: "|3", label: "3 天以内" },
    { value: "3|7", label: "3 ~ 7 天" },
    { value: "7|14", label: "7 ~ 14 天" },
    { value: "14|", label: "14 天以上" },
  ],
  次: [
    { value: "|", label: "不限" },
    { value: "|5", label: "5 次以内" },
    { value: "5|10", label: "5 ~ 10 次" },
    { value: "10|20", label: "10 ~ 20 次" },
    { value: "20|", label: "20 次以上" },
  ],
  头: [
    { value: "|", label: "不限" },
    { value: "|10", label: "10 头以内" },
    { value: "10|50", label: "10 ~ 50 头" },
    { value: "50|100", label: "50 ~ 100 头" },
    { value: "100|", label: "100 头以上" },
  ],
  元: [
    { value: "|", label: "不限" },
    { value: "|100", label: "100 元以内" },
    { value: "100|300", label: "100 ~ 300 元" },
    { value: "300|600", label: "300 ~ 600 元" },
    { value: "600|", label: "600 元以上" },
  ],
};

function RangeField({
  label,
  unit,
  min,
  max,
  onMin,
  onMax,
}: {
  label: string;
  unit: string;
  min: string;
  max: string;
  onMin: (v: string) => void;
  onMax: (v: string) => void;
}) {
  const presets = RANGE_PRESETS[unit] ?? RANGE_PRESETS["次"];
  const current = `${min}|${max}`;
  const value = presets.some((p) => p.value === current) ? current : "|";
  return (
    <div>
      <Label className="text-body-sm text-text-secondary mb-1.5 block">{label}</Label>
      <Select
        value={value}
        onValueChange={(v) => {
          const [lo, hi] = v.split("|");
          onMin(lo);
          onMax(hi);
        }}
      >
        <SelectTrigger className="h-9 bg-white"><SelectValue /></SelectTrigger>
        <SelectContent>
          {presets.map((p) => (
            <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}


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
  disabledOptions = [],
  hint,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
  disabledOptions?: string[];
  hint?: string;
}) {
  return (
    <div>
      <div className="text-body-sm text-text-secondary mb-2">{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const active = selected.includes(o);
          const disabled = !active && disabledOptions.includes(o);
          return (
            <button
              key={o}
              disabled={disabled}
              onClick={() => !disabled && onToggle(o)}
              className={`inline-flex items-center gap-1.5 px-3 h-8 rounded-full text-body-sm border transition-colors ${
                active
                  ? "border-primary bg-brand-subtle text-primary"
                  : disabled
                    ? "border-border bg-surface-muted text-text-tertiary cursor-not-allowed opacity-60"
                    : "border-border bg-white text-text-secondary hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {o}
              {active && <Check className="h-3 w-3" />}
            </button>
          );
        })}
      </div>
      {hint && <div className="text-caption text-text-tertiary mt-2">{hint}</div>}
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
  if (f.reportCount !== "all") n++;
  if (f.calfSex !== "all") n++;
  if (f.calfWeight !== "all") n++;
  if (f.calfKeep !== "all") n++;
  if (f.exitType !== "all") n++;
  if (f.keyword) n++;
  if (f.onlyAbnormal) n++;
  n += f.farms.length + f.barns.length + f.operators.length + f.diseases.length + f.diseaseSubs.length + f.prescriptions.length + f.woTypes.length + f.calvingTypes.length + f.drugs.length + f.drugTypes.length + f.cattleTypes.length + f.parities.length + f.cowStatuses.length + f.perfTypes.length + f.treatDiseases.length + f.treatSubs.length;
  if (f.treatDiseaseCat !== "all") n++;
  const ranges: [string, string][] = [
    [f.caseCountMin, f.caseCountMax],
    [f.cureRateMin, f.cureRateMax],
    [f.cullRateMin, f.cullRateMax],
    [f.rxUsageMin, f.rxUsageMax],
    [f.rxCureMin, f.rxCureMax],
    [f.rxDaysMin, f.rxDaysMax],
    [f.rxCostMin, f.rxCostMax],
    [f.drugUsageMin, f.drugUsageMax],
    [f.treatDaysMin, f.treatDaysMax],
    [f.perfRxUsageMin, f.perfRxUsageMax],
    [f.perfRxCureMin, f.perfRxCureMax],
    [f.specialDrugMin, f.specialDrugMax],
    [f.survivalMin, f.survivalMax],
    [f.woDoneMin, f.woDoneMax],
    [f.woOverdueMin, f.woOverdueMax],
  ];
  n += ranges.filter(([a, b]) => a !== "" || b !== "").length;
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
  if (f.perfTypes.length) parts.push(`绩效 ${f.perfTypes.join("、")}`);
  if (f.treatDiseaseCat !== "all") parts.push(`治疗病种类别 ${f.treatDiseaseCat}`);
  if (f.treatDiseases.length) parts.push(`治疗病种 ${f.treatDiseases.join("、")}`);
  if (f.treatSubs.length) parts.push(`治疗子类型 ${f.treatSubs.join("、")}`);
  if (f.diseaseCat !== "all") parts.push(f.diseaseCat);
  if (f.diseases.length) parts.push(`病种 ${f.diseases.join("、")}`);
  if (f.diseaseSubs.length) parts.push(`子类型 ${f.diseaseSubs.join("、")}`);
  {
    const rangeLabels: [string, string, string, string][] = [
      ["发病头数", f.caseCountMin, f.caseCountMax, "头"],
      ["治愈率", f.cureRateMin, f.cureRateMax, "%"],
      ["死淘率", f.cullRateMin, f.cullRateMax, "%"],
      ["处方使用率", f.rxUsageMin, f.rxUsageMax, "%"],
      ["处方治愈率", f.rxCureMin, f.rxCureMax, "%"],
      ["平均诊疗天数", f.rxDaysMin, f.rxDaysMax, "天"],
      ["处方药费", f.rxCostMin, f.rxCostMax, "元"],
      ["使用量", f.drugUsageMin, f.drugUsageMax, "次"],
      ["平均疗程", f.treatDaysMin, f.treatDaysMax, "天"],
      ["处方使用率(人)", f.perfRxUsageMin, f.perfRxUsageMax, "%"],
      ["处方治愈率(人)", f.perfRxCureMin, f.perfRxCureMax, "%"],
      ["特殊药品使用", f.specialDrugMin, f.specialDrugMax, "次"],
      ["存活率", f.survivalMin, f.survivalMax, "%"],
      ["工单完成", f.woDoneMin, f.woDoneMax, "次"],
      ["工单逾期", f.woOverdueMin, f.woOverdueMax, "次"],
    ];
    rangeLabels.forEach(([label, a, b, u]) => {
      if (a !== "" || b !== "") parts.push(`${label} ${a || "不限"}~${b || "不限"}${u}`);
    });
  }
  if (f.prescriptions.length) parts.push(`处方 ${f.prescriptions.join("、")}`);
  parts.push(f.woTypes.length ? f.woTypes.map((t) => WO_TYPE_LABEL[t]).join("、") : "全部工单类型");
  if (f.status !== "all") parts.push(STATUS_OPTIONS.find((s) => s.value === f.status)?.label || "");
  if (f.calvingTypes.length) parts.push(`产犊 ${f.calvingTypes.join("、")}`);
  if (f.calfOutcome !== "all") parts.push(`犊牛${f.calfOutcome}`);
  if (f.drugTypes.length) parts.push(`药品类型 ${f.drugTypes.join("、")}`);
  if (f.drugs.length) parts.push(`药品 ${f.drugs.join("、")}`);
  if (f.drugRoute !== "all") parts.push(f.drugRoute);
  if (f.cattleTypes.length) parts.push(`牛只类型 ${f.cattleTypes.join("、")}`);
  if (f.calfSex !== "all") parts.push(`性别${f.calfSex}`);
  if (f.calfWeight !== "all") parts.push(`出生体重 ${f.calfWeight}`);
  if (f.calfKeep !== "all") parts.push(f.calfKeep);
  if (f.parities.length) parts.push(`胎次 ${f.parities.join("、")}`);
  if (f.reportCount !== "all") parts.push(`报病 ${REPORT_COUNT_OPTIONS.find((d) => d.value === f.reportCount)?.label}`);
  if (f.cowStatuses.length) parts.push(`状态 ${f.cowStatuses.join("、")}`);
  if (f.exitType !== "all") parts.push(`离场 ${f.exitType}`);
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

function downloadCsv(rows: Row[], cols: ResultCol[], filename: string) {
  const header = cols.map((c) => c.label);
  const body = rows.map((r) => cols.map((c) => c.value(r).replace(/"/g, '""')));
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

function downloadMetricCsv(rows: MetricResultRow[], filename: string) {
  const csvRows = [
    ["牧场", "分子名称", "分子", "分母名称", "分母", "指标值"],
    ...rows.map((row) => [
      row.farm,
      row.numeratorLabel,
      String(row.numerator),
      row.denominatorLabel,
      String(row.denominator),
      row.value,
    ]),
  ];
  const csv = csvRows
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
