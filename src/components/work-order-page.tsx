import { useEffect, useMemo, useRef, useState } from "react";
import { usePcRole, setPcRole, canExamine, pcRoleLabel, type PcRole } from "@/lib/pc-role";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";


import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  ClipboardList,
  PlayCircle,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Search,
  Filter,
  Check,
  X,
  Settings2,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Play,
  Video,
  FileText,
  Phone,
  MessageSquare,
  Camera,
  PackagePlus,
  Stethoscope,
  Pencil,
  ClipboardCheck,
  FileSearch,
  UserPlus,
  MoreHorizontal,
  XCircle,
  Repeat2,
  LogOut,
  Ban,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const WORK_TYPES = ["疾病治疗", "产后护理", "修蹄工单", "普修工单", "干奶工单", "疫苗免疫", "驱虫工单"];

export type ReviewConclusion = {
  confirmedType: string;
  confirmedTags: string[];
  diagnosis: string;
  conclusionNote: string;
};

type WorkStatus = "待诊断" | "执行中" | "已完成";

export type MaterialItem = {
  id: string;
  name: string;
  qty: string;
  unit: string;
  usage: string;
  duration: string;
  note: string;
};
export type ExecMode = "single" | "cycle";
export type Plan = {
  desc: string;
  needMaterials: boolean;
  materials: MaterialItem[];
  execStart: string;
  execTime: string;
  execMode: ExecMode;
  cycleRule: string;
  needReview: boolean;
  reviewDate: string;
  reviewNote: string;
  suspectedDisease: string;
  kbSource: string;
  kbAdjusted: boolean;
  maxWithdraw: string;
  maxWithdrawOverridden: boolean;
};
function newMaterial(): MaterialItem {
  return {
    id: `m${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
    name: "", qty: "", unit: "支", usage: "", duration: "", note: "",
  };
}

// 药品休药期规则（天）。键为药品名称，可子串匹配。
const DRUG_WITHDRAW_DAYS: Record<string, number> = {
  "头孢噻呋钠": 4,
  "氟尼辛葡甲胺": 7,
  "青霉素": 3,
  "土霉素": 14,
  "地塞米松": 5,
  "葡萄糖酸钙": 0,
  "口蹄疫疫苗": 21,
  "缩宫素": 0,
  "乳房炎抗生素": 7,
  "伊维菌素": 14,
};
function lookupWithdrawDays(name: string): number | null {
  const n = name.trim();
  if (!n) return null;
  for (const key of Object.keys(DRUG_WITHDRAW_DAYS)) {
    if (n.includes(key)) return DRUG_WITHDRAW_DAYS[key];
  }
  return null;
}
function computeMaxWithdraw(materials: MaterialItem[]): number | null {
  let max: number | null = null;
  for (const m of materials) {
    const d = lookupWithdrawDays(m.name);
    if (d !== null) max = max === null ? d : Math.max(max, d);
  }
  return max;
}
function hasWithdrawRule(materials: MaterialItem[]): boolean {
  return materials.some((m) => lookupWithdrawDays(m.name) !== null);
}


export type WorkOrderAttachment = {
  type: "audio" | "video" | "text";
  name: string;
  meta?: string;
};

export type WorkOrder = {
  id: string;
  target: string;
  who?: string;
  event?: string;
  proposer: string;
  status: WorkStatus;
  desc: string;
  createdAt: string;
  reviewer?: string;
  reviewedAt?: string;
  executor?: string;
  /** 执行人（可多人） */
  executors?: string[];
  executedAt?: string;
  attachments?: WorkOrderAttachment[];
};


type ColKey =
  | "id"
  | "category"
  | "status"
  | "objType"
  | "target"
  | "diagnosis"
  | "desc"
  | "timeInfo"
  | "staff"
  | "pickup"
  | "action";

type ColDef = {
  key: ColKey;
  label: string;
  width: number;
  locked?: boolean;
  isTime?: boolean;
};

const ALL_COLS: ColDef[] = [
  { key: "id", label: "工单编号", width: 120, locked: true },
  { key: "category", label: "诊疗属性", width: 110 },
  { key: "status", label: "工单状态", width: 100 },
  { key: "objType", label: "对象类型", width: 90 },
  { key: "target", label: "对象信息", width: 180 },
  { key: "diagnosis", label: "疾病结论", width: 140 },
  { key: "desc", label: "具体描述", width: 240 },
  { key: "timeInfo", label: "时间信息", width: 180 },
  { key: "staff", label: "人员信息", width: 180 },
  { key: "pickup", label: "领物信息", width: 110 },
  { key: "action", label: "操作名称", width: 120, locked: true },
];


type StatusKey = WorkStatus | "已终止";
const statusList: { key: StatusKey; label: string; icon: typeof ClipboardList; tone: string }[] = [
  { key: "待诊断", label: "待诊断", icon: ClipboardList, tone: "warning" },
  { key: "执行中", label: "执行中", icon: PlayCircle, tone: "info" },
  
  { key: "已完成", label: "已完成", icon: CheckCircle2, tone: "success" },
  { key: "已终止", label: "已终止", icon: Ban, tone: "muted" },
];

const toneStyles: Record<string, { bg: string; text: string; tag: string }> = {
  warning: { bg: "bg-[var(--state-warning)]/10", text: "text-[var(--state-warning)]", tag: "tag tag-warning" },
  pending: { bg: "bg-surface-subtle", text: "text-text-secondary", tag: "tag tag-muted" },
  info: { bg: "bg-[var(--state-info)]/10", text: "text-[var(--state-info)]", tag: "tag tag-info" },

  danger: { bg: "bg-[var(--state-danger)]/10", text: "text-[var(--state-danger)]", tag: "tag tag-danger" },
  success: { bg: "bg-[var(--state-success)]/10", text: "text-[var(--state-success)]", tag: "tag tag-success" },
  muted: { bg: "bg-surface-subtle", text: "text-text-tertiary", tag: "tag tag-muted" },
};

type DateRange = "all" | "today" | "7d" | "30d";

const dateRanges: { key: DateRange; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "today", label: "今天" },
  { key: "7d", label: "最近 7 天" },
  { key: "30d", label: "最近 30 天" },
];

// 解析 "YYYY-MM-DD HH:mm" / "YYYY-MM-DD" / 任何 Date.parse 可识别格式
function parseTime(s?: string): number {
  if (!s) return 0;
  const norm = s.replace(/\//g, "-").replace(" ", "T");
  const t = Date.parse(norm);
  return Number.isNaN(t) ? 0 : t;
}

function inRange(s: string, range: DateRange): boolean {
  if (range === "all") return true;
  const t = parseTime(s);
  if (!t) return false;
  const now = Date.now();
  const day = 86400000;
  if (range === "today") {
    const d = new Date();
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    return t >= start && t < start + day;
  }
  if (range === "7d") return now - t <= 7 * day;
  if (range === "30d") return now - t <= 30 * day;
  return true;
}

export function WorkOrderPage({
  title,
  orders,
}: {
  title: string;
  orders: WorkOrder[];
}) {
  const role = usePcRole();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [active, setActive] = useState<StatusKey>("待诊断");
  const [detail, setDetail] = useState<WorkOrder | null>(null);
  const [mode, setMode] = useState<"view" | "process">("view");
  const [confirm, setConfirm] = useState<"approve" | "reject" | null>(null);
  // ============ 执行方案（统一通用字段） ============
  const emptyPlan: Plan = {
    desc: "", needMaterials: false, materials: [],
    execStart: "", execTime: "", execMode: "single", cycleRule: "",
    needReview: false, reviewDate: "", reviewNote: "",
    suspectedDisease: "", kbSource: "", kbAdjusted: false,
    maxWithdraw: "", maxWithdrawOverridden: false,

  };
  const [plan, setPlan] = useState<Plan>(emptyPlan);
  const [draft, setDraft] = useState<Plan>(emptyPlan);
  const [editingPlan, setEditingPlan] = useState(false);
  const emptyReview: ReviewConclusion = { confirmedType: "", confirmedTags: [], diagnosis: "", conclusionNote: "" };
  const [review, setReview] = useState<ReviewConclusion>(emptyReview);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [addingTag, setAddingTag] = useState(false);
  const [newTagValue, setNewTagValue] = useState("");
  const newTagRef = useRef<HTMLInputElement>(null);
  
  const [rejectReason, setRejectReason] = useState("");
  const [assignExecutor, setAssignExecutor] = useState<string>("__none__");
  const [errors, setErrors] = useState<{ confirmedType?: boolean; execStart?: boolean; reviewDate?: boolean }>({});
  const confirmedTypeRef = useRef<HTMLButtonElement>(null);
  const execStartRef = useRef<HTMLInputElement>(null);
  const reviewDateRef = useRef<HTMLInputElement>(null);
  const [keyword, setKeyword] = useState("");
  const [range, setRange] = useState<DateRange>("all");
  const [dateField, setDateField] = useState<"createdAt" | "reviewedAt" | "executedAt">("createdAt");

  const [advOpen, setAdvOpen] = useState(false);
  const [advProposer, setAdvProposer] = useState<string>("all");
  const [advExecutor, setAdvExecutor] = useState<string>("all");
  const [sortKey, setSortKey] = useState<"proposedAt" | "reviewedAt" | "executedAt">("proposedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [visible, setVisible] = useState<Record<ColKey, boolean>>(() =>
    Object.fromEntries(ALL_COLS.map((c) => [c.key, true])) as Record<ColKey, boolean>,
  );
  // 折叠操作：终止 / 转派 / 释放
  type MoreActionType = "terminate" | "transfer" | "release";
  const [moreAction, setMoreAction] = useState<{ type: MoreActionType; order: WorkOrder } | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [newExecutor, setNewExecutor] = useState<string>("");
  const [confirmTerminate, setConfirmTerminate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WorkOrder | null>(null);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);

  const [overrides, setOverrides] = useState<Record<string, { status?: "已终止"; executor?: string | null }>>({});
  const effectiveStatus = (o: WorkOrder): WorkStatus | "已终止" =>
    overrides[o.id]?.status ?? o.status;
  const effectiveExecutor = (o: WorkOrder): string | undefined => {
    const ov = overrides[o.id];
    if (ov && "executor" in ov) return ov.executor ?? undefined;
    return o.executor ?? o.who;
  };
  /** 执行人列表（可多人） */
  const effectiveExecutors = (o: WorkOrder): string[] => {
    const ov = overrides[o.id];
    if (ov && "executor" in ov) return ov.executor ? [ov.executor] : [];
    if (o.executors?.length) return o.executors;
    const single = o.executor ?? o.who;
    return single ? [single] : [];
  };
  const openMoreAction = (type: MoreActionType, o: WorkOrder) => {
    setActionReason("");
    setNewExecutor("");
    setMoreAction({ type, order: o });
  };
  const closeMoreAction = () => {
    setMoreAction(null);
    setActionReason("");
    setNewExecutor("");
    setConfirmTerminate(false);
  };

  // 常用药品/材料候选（搜索匹配）
  const DRUG_PRESETS = [
    "头孢噻呋钠", "氟尼辛葡甲胺注射液", "青霉素 G 钠", "土霉素注射液",
    "地塞米松磷酸钠", "葡萄糖酸钙注射液", "口蹄疫疫苗 A 型", "蹄部消毒喷雾",
    "蹄部包扎绷带", "一次性注射器", "缩宫素", "鱼石脂软膏",
  ];

  // 小程序上报 + 知识库带出的默认方案
  const buildDefaultPlan = (o: WorkOrder): Plan => {
    const today = new Date();
    const startDate = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
    const hasDisease = title === "疾病治疗" || title === "产后护理";
    // 仅当工单含疑似病例 + 系统匹配方案时，才自动带出方案说明 / 物资 / 复查等内容
    const materials: MaterialItem[] = hasDisease
      ? [
          { id: "p1", name: "头孢噻呋钠", qty: "2", unit: "g", usage: "肌肉注射，每日 1 次", duration: "3 天", note: "" },
          { id: "p2", name: "氟尼辛葡甲胺注射液", qty: "100", unit: "ml", usage: "肌肉注射，每日 1 次", duration: "2 天", note: "" },
        ]
      : [];
    const auto = computeMaxWithdraw(materials);
    return {
      desc: "",
      needMaterials: hasDisease,
      materials,
      execStart: startDate,
      execTime: "",
      execMode: "single",
      cycleRule: "",
      needReview: hasDisease,
      reviewDate: "",
      reviewNote: "",
      suspectedDisease: hasDisease ? "细菌性感染（疑似）" : "",
      kbSource: hasDisease ? `${title} · 标准处置方案 v2.3` : "",
      kbAdjusted: false,
      maxWithdraw: auto !== null ? String(auto) : "",
      maxWithdrawOverridden: false,
    };
  };

  useEffect(() => {
    if (detail) {
      const p = buildDefaultPlan(detail);
      setPlan(p);
      setDraft({ ...p, materials: p.materials.length ? p.materials : [newMaterial()] });
      setEditingPlan(false);
      setAssignExecutor("__none__");
      setReview({
        confirmedType: title,
        confirmedTags: [],
        diagnosis: p.suspectedDisease || "",
        conclusionNote: "",
      });
      setAllTags((() => {
        switch (title) {
          case "疾病治疗": return ["体温升高", "采食下降", "反刍减少"];
          case "产后护理": return ["恶露异常", "采食下降", "站立困难"];
          case "修蹄工单": return ["右后蹄跛行", "趾间皮炎"];
          case "普修工单": return ["围栏松动", "饮水器漏水"];
          default: return [];
        }
      })());
      setAddingTag(false);
      setNewTagValue("");
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail?.id]);

  // 进入处理态时，确保执行方案处于可编辑状态
  useEffect(() => {
    if (mode === "process" && detail) {
      setDraft((d) => ({ ...d, materials: d.materials.length ? d.materials : [newMaterial()] }));
      setEditingPlan(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, detail?.id]);

  const planComplete =
    (!draft.needMaterials || draft.materials.some((m) => m.name.trim())) &&
    draft.execStart.trim().length > 0 &&
    (draft.execMode !== "cycle" || draft.cycleRule.trim().length > 0) &&
    (!draft.needReview || draft.reviewDate.trim().length > 0);

  const openReject = (o: WorkOrder) => {
    setDetail(o);
    setRejectReason("");
    setConfirm("reject");
  };
  const openVisit = (o: WorkOrder) => {
    setDetail(o);
    setAssignExecutor("__none__");
    setConfirm("approve");
  };

  const counts = Object.fromEntries(
    statusList.map((s) => [s.key, orders.filter((o) => effectiveStatus(o) === s.key).length]),
  ) as Record<StatusKey, number>;

  const proposers = useMemo(
    () => Array.from(new Set(orders.map((o) => o.proposer).filter(Boolean))),
    [orders],
  );
  const executors = useMemo(
    () =>
      Array.from(
        new Set(
          orders.flatMap((o) =>
            o.executors?.length ? o.executors : [o.executor ?? o.who ?? ""],
          ).filter(Boolean),
        ),
      ),
    [orders],
  );

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const list = orders
      .filter((o) => !deletedIds.includes(o.id))
      .filter((o) => {
        const v = dateField === "createdAt" ? o.createdAt : dateField === "reviewedAt" ? o.reviewedAt : o.executedAt;
        if (range !== "all" && !v) return false;
        return inRange(v ?? "", range);
      })
      .filter((o) =>
        kw
          ? [o.id, o.target, o.event, o.proposer]
              .filter(Boolean)
              .some((v) => String(v).toLowerCase().includes(kw))
          : true,
      )
      .filter((o) => (advProposer === "all" ? true : o.proposer === advProposer))
      .filter((o) =>
        advExecutor === "all" ? true : effectiveExecutors(o).includes(advExecutor),
      );

    const key = sortKey;
    return [...list].sort((a, b) => {
      const va =
        key === "proposedAt"
          ? parseTime(a.createdAt)
          : key === "reviewedAt"
            ? parseTime(a.reviewedAt)
            : parseTime(a.executedAt);
      const vb =
        key === "proposedAt"
          ? parseTime(b.createdAt)
          : key === "reviewedAt"
            ? parseTime(b.reviewedAt)
            : parseTime(b.executedAt);
      return sortDir === "asc" ? va - vb : vb - va;
    });
  }, [orders, active, range, dateField, keyword, advProposer, advExecutor, sortKey, sortDir, deletedIds]);

  const leftFrozenKeys: ColKey[] = ["id"];
  const rightFrozenKeys: ColKey[] = ["action"];
  const middleCols = ALL_COLS.filter(
    (c) =>
      visible[c.key] &&
      !leftFrozenKeys.includes(c.key) &&
      !rightFrozenKeys.includes(c.key),
  );
  const leftCols = ALL_COLS.filter((c) => leftFrozenKeys.includes(c.key));
  const rightCols = ALL_COLS.filter((c) => rightFrozenKeys.includes(c.key));
  const leftWidth = leftCols.reduce((s, c) => s + c.width, 0);
  const rightWidth = rightCols.reduce((s, c) => s + c.width, 0);
  const middleWidth = middleCols.reduce((s, c) => s + c.width, 0);
  const minW = leftWidth + middleWidth + rightWidth;
  const rightOffset = (key: ColKey) => {
    const idx = rightCols.findIndex((c) => c.key === key);
    return rightCols.slice(idx + 1).reduce((s, c) => s + c.width, 0);
  };
  const leftOffset = (key: ColKey) => {
    const idx = leftCols.findIndex((c) => c.key === key);
    return leftCols.slice(0, idx).reduce((s, c) => s + c.width, 0);
  };

  const toggleSort = (key: "proposedAt" | "reviewedAt" | "executedAt") => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sortIcon = (key: ColKey) => {
    if (!["proposedAt", "reviewedAt", "executedAt"].includes(key))
      return null;
    const k = key as "proposedAt" | "reviewedAt" | "executedAt";
    if (sortKey !== k) return <ArrowUpDown className="h-3 w-3 ml-1 inline text-text-tertiary" />;
    return sortDir === "asc" ? (
      <ArrowUp className="h-3 w-3 ml-1 inline text-primary" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1 inline text-primary" />
    );
  };

  const renderCell = (o: WorkOrder, key: ColKey) => {
    switch (key) {
      case "id":
        return <span className="font-mono text-body text-foreground">{o.id}</span>;
      case "target": {
        const parts = o.target.split(/[,，、;；\n]+/).map((s) => s.trim()).filter(Boolean);
        const first = parts[0] ?? "";
        const truncated = first.length > 16 ? first.slice(0, 16) + "…" : first;
        const extra = parts.length - 1;
        return (
          <span className="inline-flex items-center gap-1 max-w-full">
            <span className="text-body text-foreground truncate" title={parts.join("、")}>{truncated}</span>
            {extra > 0 && (
              <span className="tag tag-muted shrink-0" title={parts.slice(1).join("、")}>+{extra}</span>
            )}
          </span>
        );
      }
      case "status": {
        const st = effectiveStatus(o);
        if (st === "已终止") {
          return <span className="tag tag-danger">已终止</span>;
        }

        return (
          <span className={toneStyles[statusList.find((s) => s.key === st)!.tone].tag}>
            {st}
          </span>
        );
      }
      case "category": {
        const isReview = /复诊|复查/.test(`${o.desc ?? ""}${o.event ?? ""}`);
        return (
          <span className={isReview ? "tag tag-muted" : "tag tag-brand"}>
            {isReview ? "复诊" : "初诊"}
          </span>
        );
      }
      case "objType": {
        const isCow = o.target.trim().startsWith("#");
        return <span className="tag tag-muted">{isCow ? "牛只" : "牛舍/群体"}</span>;
      }
      case "diagnosis": {
        const diseaseName = o.event ? o.event.split(" · ")[0] : "";
        return (
          <span className="text-body-sm text-text-secondary truncate" title={diseaseName}>
            {diseaseName || "—"}
          </span>
        );
      }
      case "desc":
        return (
          <span className="text-body-sm text-text-secondary truncate" title={o.desc}>
            {o.desc || "—"}
          </span>
        );
      case "timeInfo":
        return (
          <span
            className="text-body-sm text-text-secondary tabular-nums truncate"
            title={`提出 ${o.createdAt}${o.reviewedAt ? ` · 诊断 ${o.reviewedAt}` : ""}${o.executedAt ? ` · 执行 ${o.executedAt}` : ""}`}
          >
            {o.executedAt ?? o.reviewedAt ?? o.createdAt}
          </span>
        );
      case "staff": {
        const list = effectiveExecutors(o);
        const text = list.length
          ? `${o.proposer} → ${list.join("、")}`
          : `${o.proposer} → 未指派`;
        return (
          <span className="text-body-sm text-text-secondary truncate" title={text}>
            {text}
          </span>
        );
      }
      case "pickup": {
        const need = title === "疾病治疗" || title === "产后护理";
        return (
          <span className={need ? "tag tag-info" : "tag tag-muted"}>
            {need ? "需要领物" : "无需领物"}
          </span>
        );
      }

      case "action": {
        return (
          <div className="inline-flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-body-sm font-normal text-text-secondary hover:bg-surface-subtle hover:text-foreground"
              onClick={() => { setMode("view"); setDetail(o); }}
            >
              查看
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-text-tertiary hover:bg-surface-subtle hover:text-foreground"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuItem
                  className="text-body-sm text-[var(--state-danger)] focus:text-[var(--state-danger)]"
                  onClick={() => setDeleteTarget(o)}
                >
                  删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          </div>
        );
      }

    }
  };

  return (
    <TooltipProvider delayDuration={200}>
      <AppHeader title={title} breadcrumb={["工单管理", title]} />
      <main className="flex-1 px-6 py-6 space-y-4">



        <Card className="border-border bg-card overflow-hidden">
          {/* 顶部工具栏 */}
          <div className="flex items-center justify-between p-6 pb-4 flex-wrap gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary" />
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="按工单号 / 耳号 / 描述搜索"
                className="h-9 w-64 pl-9 text-body-sm bg-card border-border"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* 快捷时间筛选 */}
              <div className="flex items-center gap-1 p-0.5 rounded-md border border-border bg-surface-subtle">
                <Select value={dateField} onValueChange={(v) => setDateField(v as typeof dateField)}>
                  <SelectTrigger className="h-7 w-[112px] border-0 bg-transparent shadow-none text-caption text-text-secondary px-2 focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">按提出时间</SelectItem>
                    <SelectItem value="reviewedAt">按诊断时间</SelectItem>
                    <SelectItem value="executedAt">按执行时间</SelectItem>
                  </SelectContent>
                </Select>
                {dateRanges.map((r) => (
                  <button
                    key={r.key}
                    onClick={() => setRange(r.key)}
                    className={`h-7 px-3 rounded text-body-sm transition-colors ${
                      range === r.key
                        ? "bg-card text-primary shadow-sm"
                        : "text-text-secondary hover:text-foreground"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 text-body-sm font-normal"
                onClick={() => setAdvOpen((v) => !v)}
              >
                <Settings2 className="h-3.5 w-3.5" /> 筛选与列设置
              </Button>

            </div>
          </div>

          {/* 筛选与列设置抽屉 */}
          <Sheet open={advOpen} onOpenChange={setAdvOpen}>
            <SheetContent side="right" className="w-[380px] sm:max-w-[380px] flex flex-col p-0">
              <SheetHeader className="px-5 py-4 border-b border-border">
                <SheetTitle className="text-section">筛选与列设置</SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                <div>
                  <div className="text-caption text-text-tertiary mb-2">显示列（筛选仅作用于展示中的列）</div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {ALL_COLS.map((c) => (
                      <label
                        key={c.key}
                        className={`flex items-center gap-2 text-body-sm ${
                          c.locked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                        }`}
                      >
                        <Checkbox
                          checked={visible[c.key]}
                          disabled={c.locked}
                          onCheckedChange={(v) => setVisible((m) => ({ ...m, [c.key]: !!v }))}
                        />
                        <span>{c.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 border-t border-border pt-4">
                  <div>
                    <div className="text-caption text-text-tertiary mb-1.5">提出人</div>
                    <Select value={advProposer} onValueChange={setAdvProposer}>
                      <SelectTrigger className="h-9 text-body-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部</SelectItem>
                        {proposers.map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <div className="text-caption text-text-tertiary mb-1.5">执行人</div>
                    <Select value={advExecutor} onValueChange={setAdvExecutor}>
                      <SelectTrigger className="h-9 text-body-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部</SelectItem>
                        {executors.map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <div className="text-caption text-text-tertiary mb-1.5">排序字段</div>
                    <Select value={sortKey} onValueChange={(v) => setSortKey(v as typeof sortKey)}>
                      <SelectTrigger className="h-9 text-body-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="proposedAt">提出时间</SelectItem>
                        <SelectItem value="reviewedAt">诊断时间</SelectItem>
                        <SelectItem value="executedAt">执行时间</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <div className="text-caption text-text-tertiary mb-1.5">排序方向</div>
                    <Select value={sortDir} onValueChange={(v) => setSortDir(v as "asc" | "desc")}>
                      <SelectTrigger className="h-9 text-body-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desc">倒序（新 → 旧）</SelectItem>
                        <SelectItem value="asc">正序（旧 → 新）</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <SheetFooter className="px-5 py-4 border-t border-border flex-row gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setAdvProposer("all");
                    setAdvExecutor("all");
                  }}
                >
                  重置
                </Button>
                <Button className="flex-1" onClick={() => setAdvOpen(false)}>完成</Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>



          {/* 表格（仅在该容器内部横向滚动，左/右两侧列冻结） */}
          <div className="overflow-x-auto border-t border-border">
            <div style={{ minWidth: minW }} className="relative">
              {/* 表头 */}
              <div className="flex h-12 items-center text-table-header text-text-secondary bg-surface-subtle border-b border-border">
                {/* 左冻结：工单编号、牛只耳号 */}
                {leftCols.map((c, i) => (
                  <div
                    key={c.key}
                    style={{ width: c.width, flexShrink: 0, left: leftOffset(c.key) }}
                    className={`sticky z-20 px-3 bg-surface-subtle ${i === 0 ? "pl-6" : ""} ${i === leftCols.length - 1 ? "border-r border-border" : ""}`}
                  >
                    <span>{c.label}</span>
                  </div>
                ))}
                {/* 中间可滚动 */}
                {middleCols.map((c) => (
                  <div
                    key={c.key}
                    style={{ width: c.width, flexShrink: 0 }}
                    className="px-3"
                  >
                    {c.isTime ? (
                      <button
                        onClick={() => toggleSort(c.key as "proposedAt" | "reviewedAt" | "executedAt")}
                        className="inline-flex items-center hover:text-foreground"
                      >
                        {c.label}
                        {sortIcon(c.key)}
                      </button>
                    ) : (
                      <span>{c.label}</span>
                    )}
                  </div>
                ))}
                {/* 右冻结：功能 */}
                {rightCols.map((c, i) => (
                  <div
                    key={c.key}
                    style={{ width: c.width, flexShrink: 0, right: rightOffset(c.key) }}
                    className={`sticky z-20 px-3 bg-surface-subtle ${i === 0 ? "border-l border-border" : ""} ${i === rightCols.length - 1 ? "pr-6" : ""}`}
                  >
                    <span>{c.label}</span>
                  </div>
                ))}
              </div>

              {!mounted ? (
                <div className="px-6 py-12 text-center text-body-sm text-text-tertiary">
                  加载中…
                </div>
              ) : filtered.length === 0 ? (
                <div className="px-6 py-12 text-center text-body-sm text-text-tertiary">
                  暂无符合条件的工单
                </div>
              ) : (
                filtered.map((o) => (
                  <div
                    key={o.id}
                    className="group/row flex h-12 items-center text-table-cell border-b border-border last:border-0"
                  >
                    {leftCols.map((c, i) => (
                      <div
                        key={c.key}
                        style={{ width: c.width, flexShrink: 0, left: leftOffset(c.key) }}
                        className={`sticky z-10 px-3 bg-card group-hover/row:bg-surface-subtle ${i === 0 ? "pl-6" : ""} ${i === leftCols.length - 1 ? "border-r border-border" : ""}`}
                      >
                        {renderCell(o, c.key)}
                      </div>
                    ))}
                    {middleCols.map((c) => (
                      <div
                        key={c.key}
                        style={{ width: c.width, flexShrink: 0 }}
                        className="px-3 truncate group-hover/row:bg-surface-subtle"
                      >
                        {renderCell(o, c.key)}
                      </div>
                    ))}
                    {rightCols.map((c, i) => (
                      <div
                        key={c.key}
                        style={{ width: c.width, flexShrink: 0, right: rightOffset(c.key) }}
                        className={`sticky z-10 px-3 bg-card group-hover/row:bg-surface-subtle ${i === 0 ? "border-l border-border" : ""} ${i === rightCols.length - 1 ? "pr-6" : ""}`}
                      >
                        {renderCell(o, c.key)}
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
          {/* 吸底统计 */}
          <div className="sticky bottom-0 z-30 flex h-10 items-center justify-end px-6 border-t border-border bg-card text-caption text-text-tertiary">
            共 {filtered.length} 条
          </div>
        </Card>
      </main>

      <Sheet open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col gap-0">
          <SheetHeader className="px-6 py-4 border-b border-border">
            <SheetTitle className="text-section-title text-left">工单详情</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-5">
          {detail && (() => {
            const isLoss = detail.id.startsWith("LS");
            // 按工单类型差异化展示字段
            const typeConfig: {
              tagLabel: string | null;
              tags: string[];
              showDisease: boolean;
              showNote: boolean;
            } = (() => {
              switch (title) {
                case "疾病治疗":
                  return { tagLabel: "症状标签", tags: ["体温升高", "采食下降", "反刍减少"], showDisease: true, showNote: false };
                case "产后护理":
                  return { tagLabel: "症状 / 护理异常标签", tags: ["恶露异常", "采食下降", "站立困难"], showDisease: true, showNote: false };
                case "修蹄工单":
                  return { tagLabel: "症状 / 问题标签", tags: ["右后蹄跛行", "趾间皮炎"], showDisease: false, showNote: false };
                case "普修工单":
                  return { tagLabel: "问题标签", tags: ["围栏松动", "饮水器漏水"], showDisease: false, showNote: false };
                case "干奶工单":
                case "疫苗免疫":
                case "驱虫工单":
                  return { tagLabel: null, tags: [], showDisease: false, showNote: true };
                default:
                  return { tagLabel: null, tags: [], showDisease: false, showNote: true };
              }
            })();
            const photos = 2;
            const videos = isLoss ? 1 : 0;
            const voiceSecs = isLoss ? 42 : 28;
            const proposerPhone = "138 0000 0001";
            return (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-body-sm text-foreground">{detail.id}</span>
                  <span className="tag tag-muted">{isLoss ? "损耗" : "健康"}</span>
                </div>
                <span className={toneStyles[statusList.find((s) => s.key === detail.status)!.tone].tag}>
                  {detail.status}
                </span>
              </div>

              {/* ============ 一、原始上报信息 ============ */}
              <section className="space-y-3">
                <SectionHeader icon={<FileSearch className="h-3.5 w-3.5" />} title="原始上报信息" hint="小程序上报内容，仅供查看" />

                {/* 字段网格 */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-md border border-border p-4 bg-surface-subtle">
                  <Field label="上报工单类型" value={title} />
                  <Field label="所属牧场" value="奇点示范牧场" />
                  <Field label={isLoss ? "关联牛舍" : "上报对象"} value={detail.target} />
                  <Field label="提出事件" value={detail.event ?? "—"} />
                  <FieldNode
                    label="提出人"
                    node={
                      <div className="flex items-center gap-2">
                        <span className="text-body-sm text-foreground">{detail.proposer}</span>
                        <a
                          href={`tel:${proposerPhone.replace(/\s/g, "")}`}
                          className="h-5 w-5 rounded-full bg-brand-subtle text-primary inline-flex items-center justify-center"
                        >
                          <Phone className="h-3 w-3" />
                        </a>
                        <button className="h-5 w-5 rounded-full bg-brand-subtle text-primary inline-flex items-center justify-center">
                          <MessageSquare className="h-3 w-3" />
                        </button>
                      </div>
                    }
                  />
                  <Field label="提出时间" value={detail.createdAt} />
                </div>

                {/* 上报标签 */}
                {!isLoss && typeConfig.tagLabel && typeConfig.tags.length > 0 && (
                  <div className="rounded-md border border-border p-4">
                    <div className="text-caption text-text-tertiary mb-2">上报{typeConfig.tagLabel}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {typeConfig.tags.map((sym) => (
                        <span key={sym} className="tag tag-muted">{sym}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 事项说明 —— 干奶 / 疫苗 / 驱虫 */}
                {!isLoss && typeConfig.showNote && (
                  <div className="rounded-md border border-border p-4">
                    <div className="text-caption text-text-tertiary mb-1.5">事项说明</div>
                    <p className="text-body-sm text-text-secondary leading-relaxed whitespace-pre-line">
                      {detail.desc || detail.event || "—"}
                    </p>
                  </div>
                )}

                {/* 损耗补申请 */}
                {isLoss && (
                  <div className="rounded-md border border-border p-4">
                    <div className="text-caption text-text-tertiary mb-2 inline-flex items-center gap-1.5">
                      <PackagePlus className="h-3.5 w-3.5 text-primary" /> 补申请物资
                    </div>
                    <div className="flex items-center justify-between text-body-sm text-foreground">
                      <span>口蹄疫疫苗 A 型</span>
                      <span className="font-mono text-text-secondary">× 8 支</span>
                    </div>
                  </div>
                )}

                {/* 图文/语音/视频素材 */}
                <div className="rounded-md border border-border p-4 space-y-3">
                  <div className="text-caption text-text-tertiary">图文 / 语音 / 视频素材</div>
                  {detail.desc && (
                    <div>
                      <div className="text-caption text-text-tertiary mb-1.5">具体描述</div>
                      <p className="text-body-sm text-foreground leading-relaxed whitespace-pre-wrap">{detail.desc}</p>
                    </div>
                  )}
                  {photos > 0 && (
                    <div>
                      <div className="text-caption text-text-tertiary mb-2 inline-flex items-center gap-1">
                        <Camera className="h-3 w-3" /> 照片 · {photos} 张
                      </div>
                      <div className="grid grid-cols-6 gap-2">
                        {Array.from({ length: photos }).map((_, i) => (
                          <div
                            key={i}
                            className="aspect-square rounded-md bg-gradient-to-br from-surface-subtle to-border border border-border"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {videos > 0 && (
                    <div>
                      <div className="text-caption text-text-tertiary mb-2 inline-flex items-center gap-1">
                        <Video className="h-3 w-3" /> 视频 · {videos} 段
                      </div>
                      <div className="grid grid-cols-6 gap-2">
                        {Array.from({ length: videos }).map((_, i) => (
                          <div
                            key={i}
                            className="aspect-square rounded-md bg-gradient-to-br from-surface-subtle to-border border border-border inline-flex items-center justify-center"
                          >
                            <PlayCircle className="h-5 w-5 text-text-tertiary" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {detail.attachments && detail.attachments.length > 0 && (
                    <div className="pt-2 border-t border-border space-y-1.5">
                      {detail.attachments.map((a, i) => {
                        const Icon = a.type === "audio" ? Play : a.type === "video" ? Video : FileText;
                        const tone =
                          a.type === "audio"
                            ? "text-[var(--state-warning)] bg-[var(--state-warning)]/10"
                            : a.type === "video"
                              ? "text-primary bg-brand-subtle"
                              : "text-text-secondary bg-surface-subtle";
                        return (
                          <button
                            key={i}
                            className="w-full flex items-center gap-2 px-3 h-9 rounded-md border border-border hover:bg-surface-subtle text-left"
                          >
                            <span className={`h-6 w-6 rounded-md inline-flex items-center justify-center ${tone}`}>
                              <Icon className="h-3.5 w-3.5" />
                            </span>
                            <span className="text-body-sm text-foreground flex-1 truncate">{a.name.replace(/\.[^.]+$/, "")}</span>
                            {a.meta && <span className="text-caption text-text-tertiary">{a.meta}</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 上报疑似疾病 + 系统初始匹配方案 —— 仅疾病治疗 / 产后护理 */}
                {!isLoss && typeConfig.showDisease && (
                  <div className="rounded-md border border-border p-4 grid grid-cols-2 gap-x-4 gap-y-3">
                    <Field label="上报疑似疾病（选填）" value={plan.suspectedDisease || "—"} />
                    <Field label="系统初始匹配方案" value={plan.kbSource || "—"} />
                  </div>
                )}

              </section>

              {/* ============ 二、诊断结论（处理态） ============ */}
              {!isLoss && canExamine(role) && detail.status === "待诊断" && mode === "process" && (
                <section className="space-y-3">
                  <SectionHeader icon={<ClipboardCheck className="h-3.5 w-3.5" />} title="诊断结论" hint="以专业视角，根据线索重新确认类型、标签与结论" tone="brand" />
                  <div className="rounded-md border border-primary/30 bg-brand-subtle/30 p-4 space-y-4">
                    {/* 确认工单类型 */}
                    <div>
                      <div className="text-caption text-text-tertiary mb-1.5">
                        确认工单类型 <span className="text-[var(--state-danger)]">*</span>
                      </div>
                      <Select
                        value={review.confirmedType || title}
                        onValueChange={(v) => {
                          setReview((r) => ({ ...r, confirmedType: v }));
                          if (v) setErrors((e) => ({ ...e, confirmedType: false }));
                        }}
                      >
                        <SelectTrigger
                          ref={confirmedTypeRef}
                          className={`h-9 text-body-sm bg-card ${errors.confirmedType ? "border-[var(--state-danger)] ring-1 ring-[var(--state-danger)]" : ""}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {WORK_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.confirmedType && (
                        <p className="text-caption text-[var(--state-danger)] mt-1">此为必填项</p>
                      )}
                      {review.confirmedType && review.confirmedType !== title && (
                        <p className="text-caption text-[var(--state-warning)] mt-1">已将工单类型由「{title}」调整为「{review.confirmedType}」</p>
                      )}
                    </div>

                    {/* 确认标签 */}
                    {typeConfig.tagLabel && (
                      <div>
                        <div className="text-caption text-text-tertiary mb-1.5">确认{typeConfig.tagLabel}</div>
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {allTags.map((t) => {
                            const on = review.confirmedTags.includes(t);
                            return (
                              <span
                                key={t}
                                className={`group/tag inline-flex items-center gap-0.5 tag ${on ? "tag-brand" : "tag-muted"} cursor-pointer`}
                                onClick={() =>
                                  setReview((r) => ({
                                    ...r,
                                    confirmedTags: on ? r.confirmedTags.filter((x) => x !== t) : [...r.confirmedTags, t],
                                  }))
                                }
                              >
                                {on && <Check className="h-3 w-3 mr-0.5 inline" />}
                                <span>{t}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAllTags((prev) => prev.filter((x) => x !== t));
                                    setReview((r) => ({ ...r, confirmedTags: r.confirmedTags.filter((x) => x !== t) }));
                                  }}
                                  className="ml-0.5 h-3.5 w-3.5 rounded-sm inline-flex items-center justify-center opacity-0 group-hover/tag:opacity-100 transition-opacity hover:bg-black/10"
                                  title="删除"
                                >
                                  <X className="h-2.5 w-2.5" />
                                </button>
                              </span>
                            );
                          })}
                          {addingTag ? (
                            <Input
                              ref={newTagRef}
                              value={newTagValue}
                              onChange={(e) => setNewTagValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  const trimmed = newTagValue.trim();
                                  if (trimmed && !allTags.includes(trimmed)) {
                                    setAllTags((prev) => [...prev, trimmed]);
                                    setReview((r) => ({ ...r, confirmedTags: [...r.confirmedTags, trimmed] }));
                                  }
                                  setNewTagValue("");
                                  setAddingTag(false);
                                } else if (e.key === "Escape") {
                                  setNewTagValue("");
                                  setAddingTag(false);
                                }
                              }}
                              onBlur={() => {
                                const trimmed = newTagValue.trim();
                                if (trimmed && !allTags.includes(trimmed)) {
                                  setAllTags((prev) => [...prev, trimmed]);
                                  setReview((r) => ({ ...r, confirmedTags: [...r.confirmedTags, trimmed] }));
                                }
                                setNewTagValue("");
                                setAddingTag(false);
                              }}
                              placeholder="输入标签…"
                              className="h-7 w-28 text-body-sm bg-card px-2 py-0"
                              autoFocus
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setAddingTag(true);
                                setNewTagValue("");
                                setTimeout(() => newTagRef.current?.focus(), 0);
                              }}
                              className="tag tag-muted inline-flex items-center gap-0.5 hover:border-primary/40"
                              title="添加标签"
                            >
                              <Plus className="h-3 w-3" /> 添加
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 诊断结论 / 疑似疾病结论 */}
                    {typeConfig.showDisease && (
                      <div>
                        <div className="text-caption text-text-tertiary mb-1.5">诊断结论 / 疑似疾病结论</div>
                        <Input
                          value={review.diagnosis}
                          onChange={(e) => setReview((r) => ({ ...r, diagnosis: e.target.value }))}
                          placeholder="如：细菌性子宫炎"
                          className="h-9 text-body-sm bg-card"
                        />
                      </div>
                    )}

                  </div>
                </section>
              )}

              {/* ============ 三、执行计划（处理态） ============ */}
              {!isLoss && canExamine(role) && detail.status === "待诊断" && mode === "process" && (
                <section className="space-y-3">
                  <SectionHeader
                    icon={<Stethoscope className="h-3.5 w-3.5" />}
                    title="执行计划"
                    hint={plan.kbSource ? "已根据系统初始匹配方案预填，其余请自行完善" : "请填写执行计划"}
                    tone="brand"
                  />
                  <div className="rounded-md border border-primary/30 bg-brand-subtle/30 p-4">
                    <PlanEditor
                      draft={draft}
                      setDraft={setDraft}
                      presets={DRUG_PRESETS}
                      newMaterial={newMaterial}
                      hideActions
                      errors={errors}
                      clearError={(k) => setErrors((e) => ({ ...e, [k]: false }))}
                      execStartRef={execStartRef}
                      reviewDateRef={reviewDateRef}
                    />
                  </div>
                </section>
              )}

              {/* ============ 四、指派执行人（处理态） ============ */}
              {!isLoss && canExamine(role) && detail.status === "待诊断" && mode === "process" && (
                <section className="space-y-3">
                  <SectionHeader icon={<UserPlus className="h-3.5 w-3.5" />} title="指派执行人" hint="选填" />
                  <div className="rounded-md border border-border bg-card p-4">
                    <div className="text-caption text-text-tertiary mb-1.5">
                      指派执行人 <span className="text-text-tertiary">（留空则进入未指派池）</span>
                    </div>
                    <input
                      list="executor-options"
                      value={assignExecutor === "__none__" ? "" : assignExecutor}
                      onChange={(e) => setAssignExecutor(e.target.value.trim() ? e.target.value : "__none__")}
                      placeholder="输入姓名搜索或点击下拉选择"
                      className="h-9 w-full rounded-md border border-input bg-card px-3 text-body-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                    <datalist id="executor-options">
                      {executorsPool.map((p) => (
                        <option key={p} value={p} />
                      ))}
                    </datalist>
                  </div>
                </section>
              )}




              {/* 查看态：仅展示固定的诊断 / 响应人元数据 */}
              {(detail.status !== "待诊断" || mode === "view") && (
                <section className="space-y-3">
                  <SectionHeader icon={<ClipboardList className="h-3.5 w-3.5" />} title="诊断与执行记录" />
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-md border border-border p-4 bg-surface-subtle">
                    <Field
                      label={`执行人${effectiveExecutors(detail).length > 1 ? `（${effectiveExecutors(detail).length} 人）` : ""}`}
                      value={effectiveExecutors(detail).join("、") || "—"}
                    />
                    <Field label="诊断人" value={detail.reviewer ?? "—"} />
                    <Field label="诊断时间" value={detail.reviewedAt ?? "—"} />
                    <Field label="执行时间" value={detail.executedAt ?? "—"} />
                  </div>
                </section>
              )}

            </div>
            );
          })()}
          </div>

          {detail && canExamine(role) && detail.status === "待诊断" && (
            <SheetFooter className="px-6 py-3 border-t border-border bg-card gap-2">
              {mode === "view" ? (
                <Button
                  className="gap-1.5 bg-primary hover:bg-[var(--brand-hover)] text-primary-foreground"
                  onClick={() => setMode("process")}
                >
                  <Pencil className="h-3.5 w-3.5" /> 处理
                </Button>
              ) : (
                <>
                  <Button variant="outline" className="gap-1.5" onClick={() => { setRejectReason(""); setConfirm("reject"); }}>
                    <X className="h-3.5 w-3.5" /> 驳回
                  </Button>
                  <Button
                    className="gap-1.5 bg-primary hover:bg-[var(--brand-hover)] text-primary-foreground"
                    onClick={() => {
                      const nextErrors: typeof errors = {};
                      if (!(review.confirmedType || "").trim()) nextErrors.confirmedType = true;
                      if (!draft.execStart.trim()) nextErrors.execStart = true;
                      if (draft.needReview && !draft.reviewDate.trim()) nextErrors.reviewDate = true;
                      setErrors(nextErrors);
                      if (Object.keys(nextErrors).length > 0) {
                        const target =
                          nextErrors.confirmedType ? confirmedTypeRef.current :
                          nextErrors.execStart ? execStartRef.current :
                          reviewDateRef.current;
                        target?.scrollIntoView({ behavior: "smooth", block: "center" });
                        try { target?.focus({ preventScroll: true }); } catch { /* noop */ }
                        toast.error("请填写所有必填项");
                        return;
                      }
                      setPlan({
                        ...draft,
                        materials: draft.needMaterials ? draft.materials.filter((m) => m.name.trim()) : [],
                        suspectedDisease: review.diagnosis || draft.suspectedDisease,
                      });
                      setConfirm("approve");
                    }}
                  >
                    <Check className="h-3.5 w-3.5" /> 确认提交
                  </Button>
                </>
              )}
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>

      {/* 驳回 —— 需填写理由 */}
      <Dialog
        open={confirm === "reject"}
        onOpenChange={(o) => !o && setConfirm(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-section-title">驳回该工单</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-body-sm text-text-secondary">
              {detail ? `工单 ${detail.id} · ${detail.target}` : ""}
            </div>
            <div>
              <div className="text-caption text-text-tertiary mb-1.5">
                驳回理由 <span className="text-[var(--state-danger)]">*</span>
              </div>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                placeholder="请说明驳回原因，如证据不足、对象错误、重复上报或无需处理等"
                className="text-body-sm resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirm(null)}>取消</Button>
            <Button
              disabled={!rejectReason.trim()}
              className="bg-[var(--state-danger)] hover:bg-[var(--state-danger)]/90 text-white disabled:opacity-50"
              onClick={() => {
                setConfirm(null);
                setDetail(null);
                setRejectReason("");
              }}
            >
              确认驳回
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 通过 —— 二次确认诊疗方案 + 可选指派执行人 */}
      <Dialog
        open={confirm === "approve"}
        onOpenChange={(o) => !o && setConfirm(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-section-title">确认执行方案无误</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-body-sm text-text-secondary">
              {detail ? `工单 ${detail.id} · ${detail.target}` : ""}
            </div>
            <div className="rounded-md bg-surface-subtle border border-border p-3 space-y-2 max-h-64 overflow-y-auto">
              <div>
                <div className="text-caption text-text-tertiary">方案说明 / 处理要求</div>
                <p className="text-body-sm text-foreground leading-relaxed whitespace-pre-wrap">{plan.desc || "—"}</p>
              </div>
              {plan.needMaterials && plan.materials.length > 0 && (
                <div>
                  <div className="text-caption text-text-tertiary">物资 / 药品</div>
                  <ul className="text-body-sm text-foreground space-y-0.5 mt-0.5">
                    {plan.materials.map((m) => (
                      <li key={m.id} className="tabular-nums">
                        · {m.name} · {m.qty}{m.unit} · {m.usage}{m.duration && ` · ${m.duration}`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <div className="text-caption text-text-tertiary">执行安排</div>
                <p className="text-body-sm text-foreground">
                  {plan.execStart}{plan.execTime && ` · ${plan.execTime}`} ·{" "}
                  {plan.execMode === "single" ? "单次" : `周期：${plan.cycleRule || "—"}`}
                </p>
              </div>
              {plan.needReview && (
                <div>
                  <div className="text-caption text-text-tertiary">复查 / 验收</div>
                  <p className="text-body-sm text-foreground">
                    {plan.reviewDate}{plan.reviewNote && ` · ${plan.reviewNote}`}
                  </p>
                </div>
              )}
            </div>
            <div className="rounded-md bg-surface-subtle border border-border p-3 space-y-1">
              <div className="text-caption text-text-tertiary">
                {assignExecutor === "__none__"
                  ? "未指定执行人，工单将进入未指派池，稍后再指派执行人。"
                  : `执行人：${assignExecutor}，提交后直接派发。`}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirm(null)}>取消</Button>
            <Button
              className="bg-primary hover:bg-[var(--brand-hover)] text-primary-foreground"
              onClick={() => {
                setConfirm(null);
                setDetail(null);
              }}
            >
              确认提交
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 更多操作：终止 / 转派 / 释放 */}
      <Dialog
        open={!!moreAction && !confirmTerminate}
        onOpenChange={(o) => { if (!o) closeMoreAction(); }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-section-title">
              {moreAction?.type === "terminate" && "终止工单"}
              {moreAction?.type === "transfer" && "转派执行人"}
              {moreAction?.type === "release" && "释放工单"}
            </DialogTitle>
          </DialogHeader>
          {moreAction && (
            <div className="space-y-4">
              <div className="rounded-md bg-surface-subtle px-3 py-2 text-body-sm text-text-secondary">
                <span className="font-mono text-foreground">{moreAction.order.id}</span>
                <span className="mx-2 text-text-tertiary">·</span>
                {moreAction.order.target}
                {moreAction.order.event && (
                  <>
                    <span className="mx-2 text-text-tertiary">·</span>
                    {moreAction.order.event}
                  </>
                )}
              </div>

              {moreAction.type === "transfer" && (
                <div className="space-y-1.5">
                  <Label className="text-body-sm">
                    新执行人 <span className="text-[var(--state-danger)]">*</span>
                  </Label>
                  <Select value={newExecutor} onValueChange={setNewExecutor}>
                    <SelectTrigger className="h-9 text-body-sm">
                      <SelectValue placeholder="请选择新执行人" />
                    </SelectTrigger>
                    <SelectContent>
                      {executorsPool
                        .filter((n) => n !== effectiveExecutor(moreAction.order))
                        .map((n) => (
                          <SelectItem key={n} value={n}>{n}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <p className="text-caption text-text-tertiary">
                    当前执行人：{effectiveExecutor(moreAction.order) ?? "—"}
                  </p>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-body-sm">
                  原因 <span className="text-[var(--state-danger)]">*</span>
                </Label>
                <Textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  rows={3}
                  placeholder={
                    moreAction.type === "terminate"
                      ? "请填写终止原因"
                      : moreAction.type === "transfer"
                        ? "请填写转派原因"
                        : "请填写释放原因"
                  }
                  className="text-body-sm"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={closeMoreAction}>取消</Button>
            <Button
              className={
                moreAction?.type === "terminate"
                  ? "bg-[var(--state-danger)] hover:bg-[var(--state-danger)]/90 text-white"
                  : "bg-primary hover:bg-[var(--brand-hover)] text-primary-foreground"
              }
              disabled={
                !moreAction ||
                !actionReason.trim() ||
                (moreAction.type === "transfer" && !newExecutor)
              }
              onClick={() => {
                if (!moreAction) return;
                if (moreAction.type === "terminate") {
                  setConfirmTerminate(true);
                  return;
                }
                if (moreAction.type === "transfer") {
                  setOverrides((m) => ({
                    ...m,
                    [moreAction.order.id]: { ...m[moreAction.order.id], executor: newExecutor },
                  }));
                  toast.success(`已转派至 ${newExecutor}`);
                } else {
                  setOverrides((m) => ({
                    ...m,
                    [moreAction.order.id]: { ...m[moreAction.order.id], executor: null },
                  }));
                  toast.success("已释放，回到未指派池");
                }
                closeMoreAction();
              }}
            >
              {moreAction?.type === "terminate" ? "提交" : "确认提交"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 终止二次确认 */}
      <Dialog open={confirmTerminate} onOpenChange={setConfirmTerminate}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-section-title">确认终止该工单？</DialogTitle>
          </DialogHeader>
          <div className="text-body-sm text-text-secondary space-y-2">
            <p>终止后该工单将停止执行，状态变更为「已终止」，不可恢复。</p>
            {moreAction && (
              <div className="rounded-md bg-surface-subtle px-3 py-2">
                <div className="text-caption text-text-tertiary mb-1">终止原因</div>
                <div className="text-foreground whitespace-pre-wrap">{actionReason}</div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmTerminate(false)}>再想想</Button>
            <Button
              className="bg-[var(--state-danger)] hover:bg-[var(--state-danger)]/90 text-white"
              onClick={() => {
                if (!moreAction) return;
                setOverrides((m) => ({
                  ...m,
                  [moreAction.order.id]: { ...m[moreAction.order.id], status: "已终止" },
                }));
                toast.success("工单已终止");
                closeMoreAction();
              }}
            >
              确认终止
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-section-title">确认删除该工单？</DialogTitle>
          </DialogHeader>
          <div className="text-body-sm text-text-secondary">
            删除后工单 {deleteTarget?.id} 将从列表中移除，不可恢复。
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>取消</Button>
            <Button
              className="bg-[var(--state-danger)] hover:bg-[var(--state-danger)]/90 text-white"
              onClick={() => {
                if (!deleteTarget) return;
                setDeletedIds((ids) => [...ids, deleteTarget.id]);
                toast.success("工单已删除");
                setDeleteTarget(null);
              }}
            >
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </TooltipProvider>
  );
}

function SectionHeader({
  icon, title, hint, tone = "default",
}: { icon: React.ReactNode; title: string; hint?: string; tone?: "default" | "brand" }) {
  const isBrand = tone === "brand";
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="inline-flex items-center gap-2">
        <span className={`h-6 w-6 rounded-md inline-flex items-center justify-center ${isBrand ? "bg-primary text-primary-foreground" : "bg-surface-subtle text-text-secondary"}`}>
          {icon}
        </span>
        <span className={`text-body font-medium ${isBrand ? "text-primary" : "text-foreground"}`}>{title}</span>
      </div>
      {hint && <span className="text-caption text-text-tertiary">{hint}</span>}
    </div>
  );
}

function PlanReadRow({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <div className="text-caption text-text-tertiary mb-1.5">{label}</div>
      <p className="text-body-sm text-foreground leading-relaxed whitespace-pre-wrap">{text || "—"}</p>
    </div>
  );
}

function PlanView({ plan }: { plan: Plan }) {
  return (
    <div className="space-y-3">
      <PlanReadRow label="方案说明 / 处理要求" text={plan.desc} />
      <div>
        <div className="text-caption text-text-tertiary mb-1.5">是否需要领取物资 / 药品</div>
        <div className="text-body-sm text-foreground">{plan.needMaterials ? "是" : "否"}</div>
      </div>
      {plan.needMaterials && (
        <div>
          <div className="text-caption text-text-tertiary mb-1.5">物资 / 药品清单</div>
          {plan.materials.length > 0 ? (
            <div className="rounded-md border border-border bg-card overflow-hidden">
              <div className="grid grid-cols-[1.5fr_0.6fr_0.5fr_1.2fr_0.7fr] px-3 h-8 items-center bg-surface-subtle text-caption text-text-tertiary">
                <span>名称</span><span>数量</span><span>单位</span><span>用法</span><span>使用时长</span>
              </div>
              {plan.materials.map((m) => (
                <div key={m.id} className="grid grid-cols-[1.5fr_0.6fr_0.5fr_1.2fr_0.7fr] px-3 py-2 items-center border-t border-border text-body-sm text-foreground">
                  <span className="truncate">{m.name}</span>
                  <span className="tabular-nums">{m.qty || "—"}</span>
                  <span>{m.unit || "—"}</span>
                  <span className="truncate">{m.usage || "—"}</span>
                  <span>{m.duration || "—"}</span>
                </div>
              ))}
              {hasWithdrawRule(plan.materials) && (
                <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-surface-subtle text-body-sm">
                  <span className="text-text-secondary">休药期时长</span>
                  <span className="text-foreground tabular-nums font-medium">{plan.maxWithdraw || "0"} 天</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-body-sm text-text-tertiary">未填写</p>
          )}
        </div>
      )}

      <div>
        <div className="text-caption text-text-tertiary mb-1.5">执行安排</div>
        <div className="text-body-sm text-foreground space-y-0.5">
          <div>开始执行：{plan.execStart || "—"}{plan.execTime && ` · ${plan.execTime}`}</div>
          
        </div>
      </div>
      <div>
        <div className="text-caption text-text-tertiary mb-1.5">复查 / 验收</div>
        {plan.needReview ? (
          <div className="text-body-sm text-foreground space-y-0.5">
            <div>日期：{plan.reviewDate || "—"}</div>
            {plan.reviewNote && <div>说明：{plan.reviewNote}</div>}
          </div>
        ) : (
          <div className="text-body-sm text-text-secondary">不需要</div>
        )}
      </div>
    </div>
  );
}

function PlanEditor({
  draft,
  setDraft,
  presets,
  onCancel,
  onSave,
  hideActions,
  errors,
  clearError,
  execStartRef,
  reviewDateRef,
}: {
  draft: Plan;
  setDraft: React.Dispatch<React.SetStateAction<Plan>>;
  presets: string[];
  newMaterial: () => MaterialItem;
  onCancel?: () => void;
  onSave?: () => void;
  hideActions?: boolean;
  errors?: { execStart?: boolean; reviewDate?: boolean };
  clearError?: (k: "execStart" | "reviewDate") => void;
  execStartRef?: React.Ref<HTMLInputElement>;
  reviewDateRef?: React.Ref<HTMLInputElement>;
}) {
  const update = <K extends keyof Plan>(k: K, v: Plan[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));
  const updateMat = (idx: number, patch: Partial<MaterialItem>) =>
    setDraft((d) => {
      const materials = d.materials.map((m, i) => (i === idx ? { ...m, ...patch } : m));
      if (d.maxWithdrawOverridden) return { ...d, materials };
      const auto = computeMaxWithdraw(materials);
      return { ...d, materials, maxWithdraw: auto !== null ? String(auto) : "" };
    });
  const removeMat = (idx: number) =>
    setDraft((d) => {
      const materials = d.materials.filter((_, i) => i !== idx);
      if (d.maxWithdrawOverridden) return { ...d, materials };
      const auto = computeMaxWithdraw(materials);
      return { ...d, materials, maxWithdraw: auto !== null ? String(auto) : "" };
    });
  const showWithdraw = draft.needMaterials && hasWithdrawRule(draft.materials);

  return (
    <div className="space-y-4">
      <div>
        <div className="text-caption text-text-tertiary mb-1.5">
          方案说明 / 处理要求 <span className="text-text-tertiary">（选填）</span>
        </div>
        <Textarea
          value={draft.desc}
          onChange={(e) => update("desc", e.target.value)}
          rows={3}
          placeholder="如需补充说明或特殊操作要求，可在此填写"
          className="text-body-sm bg-card resize-none"
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <div className="text-caption text-text-tertiary">是否需要领取物资 / 药品</div>
          <Switch
            checked={draft.needMaterials}
            onCheckedChange={(v) => update("needMaterials", !!v)}
          />
        </div>
        {draft.needMaterials && (
          <div className="space-y-2 mt-2">
            {draft.materials.map((m, idx) => (
              <div key={m.id} className="rounded-md border border-border bg-card p-2 space-y-1.5">
                <div className="grid grid-cols-[1.5fr_0.7fr_0.7fr_auto] gap-1.5 items-center">
                  <DrugCombo
                    value={m.name}
                    presets={presets}
                    onChange={(v) => updateMat(idx, { name: v })}
                  />
                  <Input
                    value={m.qty}
                    placeholder="数量"
                    onChange={(e) => updateMat(idx, { qty: e.target.value })}
                    className="h-9 text-body-sm bg-card"
                  />
                  <Input
                    value={m.unit}
                    placeholder="单位"
                    onChange={(e) => updateMat(idx, { unit: e.target.value })}
                    className="h-9 text-body-sm bg-card"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0 text-text-tertiary hover:text-[var(--state-danger)]"
                    onClick={() => removeMat(idx)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>

                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <Input
                    value={m.usage}
                    placeholder="用法 / 使用方式"
                    onChange={(e) => updateMat(idx, { usage: e.target.value })}
                    className="h-9 text-body-sm bg-card"
                  />
                  <Input
                    value={m.duration}
                    placeholder="使用时长（选填）"
                    onChange={(e) => updateMat(idx, { duration: e.target.value })}
                    className="h-9 text-body-sm bg-card"
                  />
                </div>
                <Input
                  value={m.note}
                  placeholder="备注（选填）"
                  onChange={(e) => updateMat(idx, { note: e.target.value })}
                  className="h-9 text-body-sm bg-card"
                />
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-full text-body-sm font-normal border-dashed"
              onClick={() =>
                setDraft((d) => ({ ...d, materials: [...d.materials, newMaterial()] }))
              }
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> 添加物资 / 药品
            </Button>
            {showWithdraw && (
              <div className="rounded-md border border-border bg-surface-subtle px-3 py-2 flex items-center justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-body-sm text-foreground">休药期时长</span>
                  <span className="text-caption text-text-tertiary">根据所选药品自动计算，可手动调整</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    min={0}
                    value={draft.maxWithdraw}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, maxWithdraw: e.target.value, maxWithdrawOverridden: true }))
                    }
                    className="h-8 w-20 text-body-sm bg-card tabular-nums text-right"
                  />
                  <span className="text-body-sm text-text-secondary">天</span>
                  {draft.maxWithdrawOverridden && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-caption font-normal text-primary"
                      onClick={() =>
                        setDraft((d) => {
                          const auto = computeMaxWithdraw(d.materials);
                          return { ...d, maxWithdraw: auto !== null ? String(auto) : "", maxWithdrawOverridden: false };
                        })
                      }
                    >
                      重置
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>


      <div className="rounded-md border border-border bg-card p-3 space-y-3">
        <div className="text-caption text-text-tertiary">执行安排</div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-caption text-text-tertiary mb-1">
              开始执行日期 <span className="text-[var(--state-danger)]">*</span>
            </div>
            <Input
              ref={execStartRef}
              type="date"
              value={draft.execStart}
              onChange={(e) => {
                update("execStart", e.target.value);
                if (e.target.value.trim()) clearError?.("execStart");
              }}
              className={`h-9 text-body-sm bg-card ${errors?.execStart ? "border-[var(--state-danger)] ring-1 ring-[var(--state-danger)]" : ""}`}
            />
            {errors?.execStart && (
              <p className="text-caption text-[var(--state-danger)] mt-1">此为必填项</p>
            )}
          </div>
          <div>
            <div className="text-caption text-text-tertiary mb-1">执行时间段（选填）</div>
            <Input
              value={draft.execTime}
              placeholder="如 08:00 - 10:00"
              onChange={(e) => update("execTime", e.target.value)}
              className="h-9 text-body-sm bg-card"
            />
          </div>
        </div>
      </div>

      <div className="rounded-md border border-border bg-card p-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-caption text-text-tertiary">是否需要复查 / 验收</div>
          <Switch
            checked={draft.needReview}
            onCheckedChange={(v) => update("needReview", !!v)}
          />
        </div>
        {draft.needReview && (
          <>
            <div>
              <div className="text-caption text-text-tertiary mb-1">
                复查 / 验收日期 <span className="text-[var(--state-danger)]">*</span>
              </div>
              <Input
                ref={reviewDateRef}
                type="date"
                value={draft.reviewDate}
                onChange={(e) => {
                  update("reviewDate", e.target.value);
                  if (e.target.value.trim()) clearError?.("reviewDate");
                }}
                className={`h-9 text-body-sm bg-card ${errors?.reviewDate ? "border-[var(--state-danger)] ring-1 ring-[var(--state-danger)]" : ""}`}
              />
              {errors?.reviewDate && (
                <p className="text-caption text-[var(--state-danger)] mt-1">此为必填项</p>
              )}
            </div>
            <div>
              <div className="text-caption text-text-tertiary mb-1">复查 / 验收说明（选填）</div>
              <Textarea
                value={draft.reviewNote}
                onChange={(e) => update("reviewNote", e.target.value)}
                rows={2}
                placeholder="如：复查指标、验收标准等"
                className="text-body-sm bg-card resize-none"
              />
            </div>
          </>
        )}
      </div>


      {!hideActions && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-body-sm font-normal"
            onClick={onCancel}
          >
            取消
          </Button>
          <Button
            size="sm"
            className="h-8 text-body-sm font-normal bg-primary hover:bg-[var(--brand-hover)] text-primary-foreground"
            onClick={onSave}
          >
            保存修改
          </Button>
        </div>
      )}
    </div>
  );
}

function DrugCombo({
  value,
  presets,
  onChange,
}: {
  value: string;
  presets: string[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const matches = value
    ? presets.filter((p) => p.toLowerCase().includes(value.toLowerCase()) && p !== value)
    : presets;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Input
          value={value}
          placeholder="搜索 / 选择药品 · 材料"
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="h-9 text-body-sm bg-card"
        />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="p-1 w-[var(--radix-popover-trigger-width)] max-h-56 overflow-y-auto"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {matches.length === 0 ? (
          <div className="px-2 py-1.5 text-caption text-text-tertiary">无匹配，可直接输入</div>
        ) : (
          matches.map((p) => (
            <button
              key={p}
              type="button"
              className="w-full text-left px-2 py-1.5 rounded text-body-sm hover:bg-surface-subtle"
              onClick={() => {
                onChange(p);
                setOpen(false);
              }}
            >
              {p}
            </button>
          ))
        )}
      </PopoverContent>
    </Popover>
  );
}

function FieldNode({ label, node }: { label: string; node: React.ReactNode }) {
  return (
    <div className="leading-tight">
      <div className="text-caption text-text-tertiary">{label}</div>
      <div className="mt-0.5">{node}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="leading-tight">
      <div className="text-caption text-text-tertiary">{label}</div>
      <div className="text-body-sm text-foreground mt-0.5">{value}</div>
    </div>
  );
}

// ============== 工单 mock 数据生成器 ==============
const proposersPool = ["陈晓东", "李雨晴", "周凯", "李娜", "张伟", "孙明", "王建国", "赵璐"];
const reviewersPool = ["王建国", "李雨晴", "孙明"];
const executorsPool = ["李雨晴", "周凯", "孙明", "王建国", "李娜"];

function pad(n: number) { return n < 10 ? `0${n}` : `${n}`; }
function fmt(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function pick<T>(arr: T[], i: number): T { return arr[i % arr.length]; }

/**
 * 生成 15 条 mock 工单：
 * - 状态按 [待诊断, 执行中, 已完成] 循环
 * - 提出时间从今天起向前递推（覆盖今天 / 7天 / 30天 / 更早）
 * - 工单编号 = 类型拼音首字母 + 月日 + 当日该类下序号（两位数字）
 */
export function makeOrders(
  prefix: string,
  events: { target: string; event: string; desc: string }[],
): WorkOrder[] {
  const statuses: WorkStatus[] = ["待诊断", "执行中", "已完成"];
  const now = new Date();
  // 提出时间间隔（小时）：覆盖今天 / 7天 / 30天 / 更早
  const offsetsH = [2, 6, 20, 30, 52, 76, 100, 140, 200, 280, 360, 480, 600, 720, 840];
  // 按"日期"统计当日该类工单的序号
  const dailySeq = new Map<string, number>();
  // 注意：按提出时间倒序生成时，需保证同一日内的序号按时间先后稳定
  // 先按时间升序计算 seq，再返回原顺序
  const items = offsetsH.map((h, i) => ({
    i,
    proposedAt: new Date(now.getTime() - h * 3600 * 1000),
  }));
  const seqMap = new Map<number, string>();
  [...items]
    .sort((a, b) => a.proposedAt.getTime() - b.proposedAt.getTime())
    .forEach(({ i, proposedAt }) => {
      const mmdd = `${pad(proposedAt.getMonth() + 1)}${pad(proposedAt.getDate())}`;
      const seq = (dailySeq.get(mmdd) ?? 0) + 1;
      dailySeq.set(mmdd, seq);
      seqMap.set(i, `${prefix}${mmdd}${pad(seq)}`);
    });

  return items.map(({ i, proposedAt }) => {
    const ev = pick(events, i);
    const status = statuses[i % statuses.length];
    const reviewedAt = new Date(proposedAt.getTime() + 60 * 60 * 1000);
    const executedAt = new Date(proposedAt.getTime() + 8 * 60 * 60 * 1000);
    const proposer = pick(proposersPool, i);
    const reviewer = pick(reviewersPool, i);
    // 执行人可能多人（1~7 人）
    const execCount = [1, 1, 2, 3, 5, 7, 4][i % 7];
    const execList = Array.from({ length: execCount }, (_, k) => pick(executorsPool, i + k));
    const executors = Array.from(new Set(execList));
    // 媒体附件：每条工单按索引轮换三种媒体组合，保证演示多样性
    const attachmentSets: WorkOrderAttachment[][] = [
      [
        { type: "audio", name: "现场情况语音.m4a", meta: "00:38" },
        { type: "video", name: "现场拍摄视频.mp4", meta: "01:12" },
      ],
      [
        { type: "audio", name: "口述说明.m4a", meta: "00:52" },
        { type: "text", name: "处理意见.docx" },
      ],
      [
        { type: "video", name: "病灶特写.mp4", meta: "00:46" },
        { type: "text", name: "诊疗建议.txt" },
      ],
    ];
    const order: WorkOrder = {
      id: seqMap.get(i)!,
      target: ev.target,
      event: ev.event,
      desc: ev.desc,
      proposer,
      status,
      createdAt: fmt(proposedAt),
      attachments: attachmentSets[i % attachmentSets.length],
    };

    if (status !== "待诊断") {
      order.reviewer = reviewer;
      order.reviewedAt = fmt(reviewedAt);
    }
    if (status === "执行中" || status === "已完成") {
      order.executor = executors[0];
      order.executors = executors;
      order.executedAt = fmt(executedAt);
    }
    return order;
  });
}
