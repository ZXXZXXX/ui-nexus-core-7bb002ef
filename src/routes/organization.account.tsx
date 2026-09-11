import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Pencil,
  Power,
  Unlink,
  RotateCcw,
  Check,
  ChevronDown,
  X,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/organization/account")({
  head: () => ({ meta: [{ title: "账号管理 — 奇点智牧" }] }),
  component: AccountPage,
});

type Status = "启用" | "禁用";
type UserType = "内部" | "外部";
type Source = "人事系统" | "兽医系统";
type FarmRole = { farm: string; roles: string[] };
type Account = {
  id: string;
  employeeNo: string; // 人事系统工号
  name: string;
  initial: string;
  phone: string;
  userType: UserType;
  source: Source; // 人事系统同步 = 内部；兽医系统创建 = 外部
  farmRoles: FarmRole[]; // 每个关联牧场对应一个角色
  wecomId: string | null;
  wechatId: string | null;
  status: Status;
  createdAt: string;
};

// 脱敏：保留前 4 后 3，中间以 **** 替代；过短时仅保留首尾各 1
const maskId = (id: string) => {
  if (id.length <= 7) {
    if (id.length <= 2) return id;
    return `${id[0]}****${id[id.length - 1]}`;
  }
  return `${id.slice(0, 4)}****${id.slice(-3)}`;
};

// 手机号脱敏：中间四位隐藏
const maskPhone = (p: string) => (p.length >= 7 ? `${p.slice(0, 3)}****${p.slice(-4)}` : p);

// 文本省略
const ellipsize = (s: string, n: number) => (s.length > n ? `${s.slice(0, n)}…` : s);


// 模拟较多牧场场景，验证搜索能力
const FARM_OPTIONS = [
  "1 号牧场", "2 号牧场", "3 号牧场", "4 号牧场", "5 号牧场",
  "金辉牧场", "云岭牧场", "锦绣牧场", "丰泽牧场", "祥和牧场",
  "天禾牧场", "牧原一场", "牧原二场", "蒙原牧场", "晨光牧场",
  "向阳牧场", "草原之星", "北疆牧场", "南山牧场", "万象牧场",
];


const INTERNAL_ROLES = ["场长", "兽医", "兽医助理", "技术员", "仓管员"];
const EXTERNAL_ROLES = ["修蹄工", "普修工", "干奶工", "驱虫工"];
const DEFAULT_ROLES = [...INTERNAL_ROLES, ...EXTERNAL_ROLES];

// 角色权限预览（用于账号详情中聚合展示，最终以「角色权限」配置为准）
type RolePermPreview = { pc: string[]; mini: string[] };
const ROLE_PERMISSIONS: Record<string, RolePermPreview> = {
  场长: {
    pc: ["首页", "基础档案", "工单管理", "药品管理", "诊疗管理", "统计分析"],
    mini: ["首页", "现场上报", "备药", "任务处理", "工单管理", "知识查询", "牛只档案", "消息中心", "个人中心"],
  },
  兽医: {
    pc: ["首页", "基础档案", "工单管理", "药品管理", "诊疗管理"],
    mini: ["首页", "现场上报", "备药", "任务处理", "工单管理", "知识查询", "牛只档案", "消息中心", "个人中心"],
  },
  兽医助理: {
    pc: [],
    mini: ["首页", "现场上报", "备药", "任务处理", "知识查询", "牛只档案", "消息中心", "个人中心"],
  },
  技术员: {
    pc: ["首页", "基础档案"],
    mini: ["首页", "现场上报", "任务处理", "牛只档案", "消息中心", "个人中心"],
  },
  仓管员: {
    pc: ["首页", "基础档案", "药品管理"],
    mini: ["首页", "现场上报", "备药", "消息中心", "个人中心"],
  },
  修蹄工: {
    pc: [],
    mini: ["首页", "任务处理", "消息中心", "个人中心"],
  },
  普修工: {
    pc: [],
    mini: ["首页", "任务处理", "消息中心", "个人中心"],
  },
  干奶工: {
    pc: [],
    mini: ["首页", "任务处理", "消息中心", "个人中心"],
  },
  驱虫工: {
    pc: [],
    mini: ["首页", "任务处理", "消息中心", "个人中心"],
  },
  超级管理员: {
    pc: ["首页", "基础档案", "工单管理", "药品管理", "诊疗管理", "组织管理", "统计分析", "反馈管理"],
    mini: ["首页", "现场上报", "备药", "任务处理", "工单管理", "知识查询", "牛只档案", "消息中心", "个人中心"],
  },
};

function unionPermsForRoles(rs: string[]): RolePermPreview {
  const pc = new Set<string>();
  const mini = new Set<string>();
  rs.forEach((r) => {
    const p = ROLE_PERMISSIONS[r];
    if (!p) return;
    p.pc.forEach((x) => pc.add(x));
    p.mini.forEach((x) => mini.add(x));
  });
  return { pc: [...pc], mini: [...mini] };
}

const initialAccounts: Account[] = [
  { id: "U001", employeeNo: "HR100231", name: "张磊", initial: "ZL", phone: "13856216201", userType: "内部", source: "人事系统", farmRoles: [{ farm: "1 号牧场", roles: ["场长"] }], wecomId: "wm_zhanglei_8821", wechatId: "wx_zhanglei_6688", status: "启用", createdAt: "2024-03-08" },
  { id: "U002", employeeNo: "HR100288", name: "李雨晴", initial: "LY", phone: "13930183018", userType: "内部", source: "人事系统", farmRoles: [{ farm: "1 号牧场", roles: ["兽医", "技术员"] }, { farm: "2 号牧场", roles: ["技术员"] }], wecomId: "wm_liyuqing_3210", wechatId: "wx_liyuqing_4521", status: "启用", createdAt: "2024-06-21" },
  { id: "U003", employeeNo: "HR100312", name: "陈晓东", initial: "CX", phone: "13785208520", userType: "内部", source: "人事系统", farmRoles: [{ farm: "1 号牧场", roles: ["技术员"] }], wecomId: null, wechatId: "wx_chenxd_7702", status: "启用", createdAt: "2025-09-12" },
  { id: "U004", employeeNo: "HR100455", name: "王仓管", initial: "WC", phone: "13643024302", userType: "内部", source: "人事系统", farmRoles: [{ farm: "1 号牧场", roles: ["仓管员"] }, { farm: "2 号牧场", roles: ["仓管员"] }, { farm: "3 号牧场", roles: ["技术员", "仓管员"] }], wecomId: "wm_wangck_5601", wechatId: null, status: "启用", createdAt: "2026-02-04" },
  { id: "U005", employeeNo: "HR100479", name: "孙库管", initial: "SK", phone: "13590129012", userType: "内部", source: "人事系统", farmRoles: [{ farm: "2 号牧场", roles: ["仓管员"] }], wecomId: null, wechatId: null, status: "禁用", createdAt: "2026-04-30" },
  { id: "U006", employeeNo: "—", name: "赵修蹄", initial: "ZX", phone: "13477887788", userType: "外部", source: "兽医系统", farmRoles: [{ farm: "1 号牧场", roles: ["修蹄工"] }, { farm: "3 号牧场", roles: ["修蹄工", "普修工"] }, { farm: "金辉牧场", roles: ["普修工"] }], wecomId: "wm_zhaoxt_9912", wechatId: "wx_zhaoxt_3344", status: "启用", createdAt: "2025-11-18" },
  { id: "U007", employeeNo: "—", name: "刘技师", initial: "LJ", phone: "13355665566", userType: "外部", source: "兽医系统", farmRoles: [{ farm: "2 号牧场", roles: ["干奶工"] }], wecomId: null, wechatId: "wx_liujs_1209", status: "启用", createdAt: "2026-05-09" },

];

// 辅助：从 farmRoles 派生
const farmsOf = (a: Pick<Account, "farmRoles">) => a.farmRoles.map((x) => x.farm);
const rolesOf = (a: Pick<Account, "farmRoles">) =>
  Array.from(new Set(a.farmRoles.flatMap((x) => x.roles)));

type AccountColumn = {
  key: string;
  label: string;
  width: string;
  filter?: "text" | "select" | "none";
  options?: string[];
  defaultHidden?: boolean;
  required?: boolean;
};

const ACCOUNT_COLUMNS: AccountColumn[] = [
  { key: "id", label: "账号编号", width: "0.9fr", required: true },
  { key: "name", label: "用户", width: "1.2fr", required: true },
  { key: "employeeNo", label: "工号", width: "1fr" },
  { key: "source", label: "来源", width: "0.9fr", filter: "select", options: ["人事系统", "兽医系统"] },
  { key: "userType", label: "人员类型", width: "0.8fr", filter: "select", options: ["内部", "外部"] },
  { key: "phone", label: "手机号", width: "1.1fr" },
  { key: "role", label: "角色", width: "1.3fr", filter: "select" },
  { key: "farms", label: "关联牧场", width: "1.8fr", filter: "select", options: FARM_OPTIONS },
  { key: "wecomId", label: "企微 ID", width: "140px" },
  { key: "status", label: "状态", width: "0.7fr", filter: "select", options: ["启用", "禁用"] },
  { key: "createdAt", label: "创建时间", width: "1fr", defaultHidden: true },
];

const cellValue = (a: Account, key: string): string => {
  switch (key) {
    case "id": return a.id;
    case "name": return a.name;
    case "employeeNo": return a.employeeNo;
    case "source": return a.source;
    case "userType": return a.userType;
    case "phone": return a.phone;
    case "role": return rolesOf(a).join("、");
    case "farms": return farmsOf(a).join("、");
    case "wecomId": return a.wecomId ?? "";
    case "status": return a.status;
    case "createdAt": return a.createdAt;
    default: return "";
  }
};

function AccountPage() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [internalRoles, setInternalRoles] = useState<string[]>(INTERNAL_ROLES);
  const [externalRoles, setExternalRoles] = useState<string[]>(EXTERNAL_ROLES);
  const roles = useMemo(() => [...internalRoles, ...externalRoles], [internalRoles, externalRoles]);
  const addRoleFor = (type: UserType, r: string) => {
    if (type === "内部") {
      setInternalRoles((rs) => (rs.includes(r) ? rs : [...rs, r]));
    } else {
      setExternalRoles((rs) => (rs.includes(r) ? rs : [...rs, r]));
    }
  };
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [drawerMode, setDrawerMode] = useState<"detail" | "edit">("detail");
  const [creating, setCreating] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchOpen, setBatchOpen] = useState(false);
  const drawerAccount = useMemo(
    () => (drawerId ? accounts.find((a) => a.id === drawerId) ?? null : null),
    [drawerId, accounts],
  );
  const openDetail = (a: Account) => {
    setDrawerId(a.id);
    setDrawerMode("detail");
  };
  const openEdit = (a: Account) => {
    setDrawerId(a.id);
    setDrawerMode("edit");
  };
  const closeDrawer = () => setDrawerId(null);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const clearSelection = () => setSelectedIds(new Set());

  const applyBatch = (
    targetFarmRoles: FarmRole[],
    mode: "replace" | "merge",
  ) => {
    const ids = selectedIds;
    setAccounts((list) =>
      list.map((a) => {
        if (!ids.has(a.id)) return a;
        if (mode === "replace") {
          return { ...a, farmRoles: targetFarmRoles };
        }
        // merge：按牧场合并角色（并集）
        const map = new Map<string, Set<string>>();
        a.farmRoles.forEach((fr) => map.set(fr.farm, new Set(fr.roles)));
        targetFarmRoles.forEach((fr) => {
          const cur = map.get(fr.farm) ?? new Set<string>();
          fr.roles.forEach((r) => cur.add(r));
          map.set(fr.farm, cur);
        });
        const merged: FarmRole[] = Array.from(map.entries()).map(([farm, rs]) => ({
          farm,
          roles: Array.from(rs),
        }));
        return { ...a, farmRoles: merged };
      }),
    );
    toast.success(
      `已${mode === "replace" ? "覆盖" : "合并"}更新 ${ids.size} 个账号的牧场与角色`,
    );
    clearSelection();
    setBatchOpen(false);
  };

  // 筛选状态（与通用列表一致：搜索 + 筛选/列设置抽屉）
  const [keyword, setKeyword] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [visible, setVisible] = useState<string[]>(
    ACCOUNT_COLUMNS.filter((c) => !c.defaultHidden).map((c) => c.key),
  );
  const [draftVisible, setDraftVisible] = useState<string[]>(visible);
  const [filterOpen, setFilterOpen] = useState(false);

  const activeFilterCount = Object.values(filters).filter((v) => v && v !== "__all").length;
  const shownCols = ACCOUNT_COLUMNS.filter((c) => visible.includes(c.key));
  const isShown = (key: string) => visible.includes(key);
  const optionsFor = (key: string, opts?: string[]) =>
    opts ??
    Array.from(
      new Set(
        accounts.flatMap((a) =>
          key === "role" ? rolesOf(a) : key === "farms" ? farmsOf(a) : [cellValue(a, key)],
        ),
      ),
    ).filter(Boolean);


  const toggleStatus = (id: string) => {
    setAccounts((list) =>
      list.map((a) =>
        a.id === id ? { ...a, status: a.status === "启用" ? "禁用" : "启用" } : a,
      ),
    );
  };

  const saveEdit = (updated: Account) => {
    setAccounts((list) => list.map((a) => (a.id === updated.id ? updated : a)));
    closeDrawer();
  };

  const handleCreate = (
    acc: Omit<Account, "id" | "initial">,
    newRoleCreated: string | null,
  ) => {
    const id = `U${String(accounts.length + 1).padStart(3, "0")}`;
    const initial = acc.name.slice(0, 2).toUpperCase();
    setAccounts((list) => [...list, { ...acc, id, initial }]);
    if (newRoleCreated) {
      addRoleFor(acc.userType, newRoleCreated);
      toast.success(`已创建账号「${acc.name}」`, {
        description: `新角色「${newRoleCreated}」暂无权限，请尽快前往角色权限完成配置。`,
        action: {
          label: "去配置",
          onClick: () => navigate({ to: "/organization/role" }),
        },
        duration: 8000,
      });
    } else {
      toast.success(`已创建账号「${acc.name}」`);
    }
    setCreating(false);
  };

  const userTypeTagClass = (t: UserType) =>
    t === "内部" ? "tag-brand" : "tag-warning";

  // 过滤 + 排序：启用优先；同状态内按创建时间倒序（越新越靠前）
  const filteredAccounts = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return accounts
      .filter((a) => {
        for (const [key, val] of Object.entries(filters)) {
          if (!val || val === "__all") continue;
          if (key === "role") {
            if (!rolesOf(a).includes(val)) return false;
          } else if (key === "farms") {
            if (!farmsOf(a).includes(val)) return false;
          } else if (!cellValue(a, key).toLowerCase().includes(val.toLowerCase())) {
            return false;
          }
        }
        if (kw) {
          const hay = `${a.name} ${a.phone} ${a.wecomId ?? ""}`.toLowerCase();
          if (!hay.includes(kw)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === "启用" ? -1 : 1;
        return b.createdAt.localeCompare(a.createdAt);
      });
  }, [accounts, keyword, filters]);

  // 列宽：勾选 + 展示中的列 + 管理
  const cols = `40px ${shownCols.map((c) => c.width).join(" ")} 0.5fr`;

  const renderCell = (a: Account, key: string) => {
    switch (key) {
      case "id":
        return <span className="block text-body-sm text-text-secondary font-mono truncate">{a.id}</span>;
      case "name":
        return <span className="block text-body text-foreground truncate">{a.name}</span>;
      case "employeeNo":
        return <span className="block text-body-sm text-text-secondary font-mono truncate">{a.employeeNo}</span>;
      case "source":
        return <span className="block text-body-sm text-text-secondary truncate">{a.source}</span>;
      case "userType":
        return <span className={`tag ${userTypeTagClass(a.userType)}`}>{a.userType}</span>;
      case "phone":
        return <span className="text-body-sm text-text-secondary tabular-nums">{maskPhone(a.phone)}</span>;
      case "role": {
        const rs = rolesOf(a);
        if (rs.length === 0) return <span className="tag tag-muted">未分配</span>;
        return (
          <div className="flex items-center gap-1 min-w-0 overflow-hidden">
            <span className="tag tag-brand whitespace-nowrap" title={rs[0]}>{ellipsize(rs[0], 3)}</span>
            {rs.length > 1 && (
              <span className="tag tag-brand whitespace-nowrap" title={rs.slice(1).join("、")}>
                +{rs.length - 1}
              </span>
            )}
          </div>
        );
      }
      case "farms": {
        const fs = farmsOf(a);
        if (fs.length === 0) return <span className="tag tag-muted">未关联</span>;
        return (
          <div className="flex items-center gap-1 min-w-0 overflow-hidden">
            <span className="tag tag-muted whitespace-nowrap" title={fs[0]}>{ellipsize(fs[0], 4)}</span>
            {fs.length > 1 && (
              <span
                className="tag tag-muted whitespace-nowrap"
                title={a.farmRoles.slice(1).map((x) => `${x.farm}（${x.roles.join("、") || "未分配"}）`).join("\n")}
              >
                +{fs.length - 1}
              </span>
            )}
          </div>
        );
      }
      case "wecomId":
        return a.wecomId ? (
          <span className="block truncate text-body-sm text-text-secondary font-mono tabular-nums" title="已脱敏显示">
            {maskId(a.wecomId)}
          </span>
        ) : (
          <span className="tag tag-muted">未绑定</span>
        );
      case "status":
        return <span className={`tag ${a.status === "启用" ? "tag-success" : "tag-muted"}`}>{a.status}</span>;
      case "createdAt":
        return <span className="text-body-sm text-text-secondary tabular-nums">{a.createdAt}</span>;
      default:
        return null;
    }
  };

  const visibleIds = filteredAccounts.map((a) => a.id);
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const someSelected = visibleIds.some((id) => selectedIds.has(id));
  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) visibleIds.forEach((id) => next.delete(id));
      else visibleIds.forEach((id) => next.add(id));
      return next;
    });
  };


  return (
    <>
      <AppHeader title="账号管理" breadcrumb={["组织管理", "账号管理"]} />
      <main className="flex-1 px-6 py-6 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary" />
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索姓名 / 手机号 / 企微 ID"
                className="h-9 w-72 pl-9 text-body-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              title="筛选与列设置"
              aria-label="筛选与列设置"
              className="relative h-9 w-9 shrink-0"
              onClick={() => {
                setDraft(filters);
                setDraftVisible(visible);
                setFilterOpen(true);
              }}
            >
              <SlidersHorizontal className="h-4 w-4" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] leading-4 text-center tabular-nums">
                  {activeFilterCount}
                </span>
              )}
            </Button>
            <Button
              size="sm"
              onClick={() => setCreating(true)}
              className="h-9 gap-1.5 text-body-sm font-normal bg-primary hover:bg-[var(--brand-hover)] text-primary-foreground"
            >
              <Plus className="h-3.5 w-3.5" /> 新建账号
            </Button>
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-md border border-primary/30 bg-brand-subtle">
            <div className="text-body-sm text-foreground">
              已选 <span className="font-medium text-primary">{selectedIds.size}</span> 个账号
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => setBatchOpen(true)}
                className="h-8 text-body-sm font-normal bg-primary hover:bg-[var(--brand-hover)] text-primary-foreground"
              >
                批量关联牧场 / 分配角色
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={clearSelection}
                className="h-8 text-body-sm font-normal text-text-secondary"
              >
                取消选择
              </Button>
            </div>
          </div>
        )}

        <Card className="border-border bg-card overflow-hidden">
          <div className="grid gap-3 px-6 h-12 items-center text-table-header text-text-secondary border-b border-border bg-surface-subtle"
            style={{ gridTemplateColumns: cols }}>
            <div className="flex items-center">
              <Checkbox
                checked={allSelected ? true : someSelected ? "indeterminate" : false}
                onCheckedChange={toggleSelectAll}
                aria-label="全选"
              />
            </div>
            {shownCols.map((c) => (
              <div key={c.key}>{c.label}</div>
            ))}
            <div className="text-right">管理</div>
          </div>
          {filteredAccounts.map((a) => (
            <div key={a.id} className={`grid gap-3 px-6 h-12 items-center text-table-cell border-b border-border last:border-0 hover:bg-surface-subtle ${selectedIds.has(a.id) ? "bg-brand-subtle/40" : ""}`}
              style={{ gridTemplateColumns: cols }}>
              <div className="flex items-center">
                <Checkbox
                  checked={selectedIds.has(a.id)}
                  onCheckedChange={() => toggleSelect(a.id)}
                  aria-label={`选择 ${a.name}`}
                />
              </div>
              {shownCols.map((c) => (
                <div key={c.key} className="min-w-0 overflow-hidden">
                  {renderCell(a, c.key)}
                </div>
              ))}
              <div className="flex justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-text-secondary hover:text-foreground">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-32">
                    <DropdownMenuItem onClick={() => openDetail(a)} className="gap-2 text-body-sm">
                      <Eye className="h-3.5 w-3.5" /> 查看
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openEdit(a)} className="gap-2 text-body-sm">
                      <Pencil className="h-3.5 w-3.5" /> 编辑
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => toggleStatus(a.id)}
                      className={`gap-2 text-body-sm ${a.status === "启用" ? "text-destructive focus:text-destructive" : ""}`}
                    >
                      <Power className="h-3.5 w-3.5" /> {a.status === "启用" ? "停用" : "启用"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
          {filteredAccounts.length === 0 && (
            <div className="px-6 py-12 text-center text-body-sm text-text-tertiary">
              暂无符合条件的账号
            </div>
          )}
        </Card>

        <p className="text-caption text-text-tertiary">
          说明：账号关联一个牧场时，仅能查看和操作该牧场的数据；关联多个牧场时，可在关联牧场之间切换并按权限查看数据。
        </p>
      </main>

      {/* 筛选与列设置 */}
      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent side="right" className="w-[380px] sm:max-w-[380px] flex flex-col p-0">
          <SheetHeader className="px-5 py-4 border-b border-border">
            <SheetTitle className="text-section">筛选与列设置</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            <div>
              <div className="text-caption text-text-tertiary mb-2">显示列（筛选仅作用于展示中的列）</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {ACCOUNT_COLUMNS.map((c) => (
                  <label
                    key={c.key}
                    className={`flex items-center gap-2 text-body-sm ${
                      c.required ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                    }`}
                  >
                    <Checkbox
                      checked={draftVisible.includes(c.key)}
                      disabled={c.required}
                      onCheckedChange={(v) =>
                        setDraftVisible((prev) =>
                          v
                            ? ACCOUNT_COLUMNS.filter(
                                (x) => prev.includes(x.key) || x.key === c.key,
                              ).map((x) => x.key)
                            : prev.filter((k) => k !== c.key),
                        )
                      }
                    />
                    <span>{c.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-3 border-t border-border pt-4">
              {ACCOUNT_COLUMNS.filter(
                (c) => (c.filter ?? "text") !== "none" && draftVisible.includes(c.key),
              ).map((c) => (
                <div key={c.key}>
                  <div className="text-caption text-text-tertiary mb-1.5">{c.label}</div>
                  {(c.filter ?? "text") === "select" ? (
                    <Select
                      value={draft[c.key] || "__all"}
                      onValueChange={(v) => setDraft((p) => ({ ...p, [c.key]: v }))}
                    >
                      <SelectTrigger className="h-9 text-body-sm">
                        <SelectValue placeholder="全部" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all" className="text-body-sm">全部</SelectItem>
                        {optionsFor(c.key, c.options).map((o) => (
                          <SelectItem key={o} value={o} className="text-body-sm">{o}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={draft[c.key] ?? ""}
                      onChange={(e) => setDraft((p) => ({ ...p, [c.key]: e.target.value }))}
                      placeholder="包含…"
                      className="h-9 text-body-sm"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
          <SheetFooter className="px-5 py-4 border-t border-border flex-row gap-2">
            <Button
              variant="outline"
              className="flex-1 h-9 text-body-sm font-normal"
              onClick={() => {
                setDraft({});
                setDraftVisible(ACCOUNT_COLUMNS.filter((c) => !c.defaultHidden).map((c) => c.key));
              }}
            >
              重置
            </Button>
            <Button
              className="flex-1 h-9 text-body-sm font-normal bg-primary hover:bg-[var(--brand-hover)] text-primary-foreground"
              onClick={() => {
                const next: Record<string, string> = {};
                for (const [k, v] of Object.entries(draft)) {
                  if (draftVisible.includes(k)) next[k] = v;
                }
                setFilters(next);
                setVisible(draftVisible);
                setFilterOpen(false);
              }}
            >
              应用
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>



      {/* 查看 / 编辑 抽屉 */}
      <AccountDrawer
        account={drawerAccount}
        mode={drawerMode}
        onModeChange={setDrawerMode}
        internalRoles={internalRoles}
        externalRoles={externalRoles}
        onClose={closeDrawer}
        onSave={saveEdit}
        onCreateRole={addRoleFor}
        userTypeTagClass={userTypeTagClass}
      />


      {/* 新建 */}
      {creating && (
        <CreateDialog
          internalRoles={internalRoles}
          externalRoles={externalRoles}
          onClose={() => setCreating(false)}
          onCreate={handleCreate}
          onCreateRole={addRoleFor}
        />
      )}

      {/* 批量分配 */}
      {batchOpen && (
        <BatchAssignDialog
          count={selectedIds.size}
          selectedAccounts={accounts.filter((a) => selectedIds.has(a.id))}
          roles={roles}
          internalRoles={internalRoles}
          onCreateRole={(r) => addRoleFor("内部", r)}
          onClose={() => setBatchOpen(false)}
          onApply={applyBatch}
        />
      )}
    </>
  );
}



// 左右两栏：左侧选择角色，右侧为当前角色分配适用牧场
function FarmRolePicker({
  value,
  onChange,
  roles,
  onCreateRole,
}: {
  value: FarmRole[];
  onChange: (next: FarmRole[]) => void;
  roles: string[];
  onCreateRole: (r: string) => void;
}) {
  // 计算「该角色已分配到的牧场列表」
  const farmsForRole = (role: string): string[] =>
    value.filter((v) => v.roles.includes(role)).map((v) => v.farm);
  const isRoleUsed = (role: string) => farmsForRole(role).length > 0;

  const usedRoles = useMemo(
    () => Array.from(new Set(value.flatMap((v) => v.roles))),
    [value],
  );
  const MAX_ROLES = 2;
  const roleLimitReached = usedRoles.length >= MAX_ROLES;

  const [roleKw, setRoleKw] = useState("");
  const [farmKw, setFarmKw] = useState("");
  const initialActive =
    [...roles].find((r) => isRoleUsed(r)) ?? roles[0] ?? null;
  const [activeRole, setActiveRole] = useState<string | null>(initialActive);
  const [newRole, setNewRole] = useState("");

  const filteredRoles = useMemo(() => {
    const kw = roleKw.trim().toLowerCase();
    if (!kw) return roles;
    return roles.filter((r) => r.toLowerCase().includes(kw));
  }, [roles, roleKw]);

  const filteredFarms = useMemo(() => {
    const kw = farmKw.trim().toLowerCase();
    if (!kw) return FARM_OPTIONS;
    return FARM_OPTIONS.filter((f) => f.toLowerCase().includes(kw));
  }, [farmKw]);

  // 当总数据被外部清空导致 activeRole 被移除时回退
  const distinctFarmsCount = useMemo(
    () => new Set(value.filter((v) => v.roles.length > 0).map((v) => v.farm)).size,
    [value],
  );

  // 切换某牧场是否拥有 activeRole
  const toggleFarmForActiveRole = (farm: string) => {
    if (!activeRole) return;
    const existing = value.find((v) => v.farm === farm);
    const adding = !existing || !existing.roles.includes(activeRole);
    if (adding && !usedRoles.includes(activeRole) && roleLimitReached) {
      toast.error(`一个帐号最多配置 ${MAX_ROLES} 个角色`);
      return;
    }
    if (!existing) {
      onChange([...value, { farm, roles: [activeRole] }]);
      return;
    }
    if (existing.roles.includes(activeRole)) {
      const nextRoles = existing.roles.filter((r) => r !== activeRole);
      // 若该牧场已无任何角色，则取消关联
      const next = value
        .map((v) => (v.farm === farm ? { ...v, roles: nextRoles } : v))
        .filter((v) => v.roles.length > 0);
      onChange(next);
    } else {
      onChange(
        value.map((v) =>
          v.farm === farm ? { ...v, roles: [...v.roles, activeRole] } : v,
        ),
      );
    }
  };

  // 清除该角色在所有牧场上的分配
  const clearRole = (role: string) => {
    const next = value
      .map((v) => ({ ...v, roles: v.roles.filter((r) => r !== role) }))
      .filter((v) => v.roles.length > 0);
    onChange(next);
  };

  const handleCreateRole = () => {
    const kw = newRole.trim();
    if (!kw) return;
    if (kw.length > 6) {
      toast.error("角色名称不超过 6 个字");
      return;
    }
    if (!roles.includes(kw)) onCreateRole(kw);
    setActiveRole(kw);
    setNewRole("");
  };

  const activeFarmsSet = useMemo(
    () => new Set(activeRole ? farmsForRole(activeRole) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [value, activeRole],
  );

  return (
    <div className="rounded-md border border-border bg-surface-subtle overflow-hidden">
      <div className="grid grid-cols-[minmax(0,220px)_1fr] min-h-[320px]">
        {/* 左：角色 */}
        <div className="border-r border-border flex flex-col bg-card">
          <div className="relative p-2 border-b border-border">
            <Search className="absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary" />
            <Input
              value={roleKw}
              onChange={(e) => setRoleKw(e.target.value)}
              placeholder="搜索角色"
              className="h-8 pl-8 text-body-sm"
            />
          </div>
          <div className="px-3 py-1.5 text-caption text-text-tertiary border-b border-border">
            已选 {usedRoles.length}/{MAX_ROLES} 个角色
          </div>
          <div className="flex-1 overflow-y-auto py-1 max-h-[340px]">
            {filteredRoles.length === 0 ? (
              <div className="text-caption text-text-tertiary text-center py-6">
                无匹配角色
              </div>
            ) : (
              filteredRoles.map((r) => {
                const used = isRoleUsed(r);
                const isActive = activeRole === r;
                const farmCount = farmsForRole(r).length;
                return (
                  <div
                    key={r}
                    onClick={() => setActiveRole(r)}
                    className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer text-body-sm border-l-2 ${
                      isActive
                        ? "bg-sidebar-hover border-primary text-foreground"
                        : "border-transparent hover:bg-surface-subtle text-text-secondary"
                    }`}
                  >
                    <Checkbox
                      checked={used}
                      disabled={!used && roleLimitReached}
                      onClick={(e) => e.stopPropagation()}
                      onCheckedChange={(v) => {
                        if (!v) clearRole(r);
                        else setActiveRole(r);
                      }}
                    />
                    <span className="flex-1 truncate">{r}</span>
                    {INTERNAL_ROLES.includes(r) ? (
                      <span className="text-caption text-text-tertiary shrink-0">内部</span>
                    ) : EXTERNAL_ROLES.includes(r) ? (
                      <span className="text-caption text-text-tertiary shrink-0">外部</span>
                    ) : null}
                    {used && (
                      <span className="text-caption text-text-tertiary shrink-0">
                        {farmCount}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
          <div className="border-t border-border p-2 flex items-center gap-2">
            <Input
              value={newRole}
              onChange={(e) => setNewRole(e.target.value.slice(0, 6))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCreateRole();
                }
              }}
              placeholder="新角色（≤6 字）"
              className="h-8 text-body-sm"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleCreateRole}
              disabled={!newRole.trim()}
              className="h-8 gap-1 text-body-sm shrink-0"
            >
              <Plus className="h-3.5 w-3.5" /> 新建
            </Button>
          </div>
        </div>

        {/* 右：牧场 */}
        <div className="flex flex-col">
          {!activeRole ? (
            <div className="flex-1 flex items-center justify-center text-caption text-text-tertiary py-12">
              请先在左侧选择角色
            </div>
          ) : (
            <>
              <div className="px-4 py-2.5 border-b border-border flex items-center justify-between gap-2">
                <div className="text-body-sm text-foreground font-medium truncate">
                  {activeRole}
                  <span className="ml-2 text-caption text-text-tertiary font-normal">
                    已分配 {activeFarmsSet.size} 个牧场
                  </span>
                </div>
                {activeFarmsSet.size > 0 && (
                  <button
                    type="button"
                    onClick={() => clearRole(activeRole)}
                    className="inline-flex items-center gap-1 text-caption text-text-tertiary hover:text-destructive"
                  >
                    <Unlink className="h-3 w-3" /> 清除该角色全部分配
                  </button>
                )}
              </div>
              <div className="p-2 border-b border-border relative">
                <Search className="absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary" />
                <Input
                  value={farmKw}
                  onChange={(e) => setFarmKw(e.target.value)}
                  placeholder="搜索牧场"
                  className="h-8 pl-8 text-body-sm"
                />
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-0.5 max-h-[220px]">
                {filteredFarms.length === 0 ? (
                  <div className="text-caption text-text-tertiary text-center py-6">
                    无匹配牧场
                  </div>
                ) : (
                  filteredFarms.map((f) => {
                    const checked = activeFarmsSet.has(f);
                    return (
                      <label
                        key={f}
                        className="flex items-center gap-2 cursor-pointer text-body-sm px-2 py-1.5 rounded hover:bg-surface-subtle"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleFarmForActiveRole(f)}
                        />
                        <span className="flex-1 text-foreground truncate">{f}</span>
                      </label>
                    );
                  })
                )}
              </div>
              <div className="px-4 py-2 border-t border-border text-caption text-text-tertiary leading-relaxed bg-surface-subtle">
                提示：同一牧场可同时分配多个角色，功能权限与数据权限均取所有角色的并集。共关联 {distinctFarmsCount} 个牧场。
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}



function AccountDrawer({
  account,
  mode,
  onModeChange,
  internalRoles,
  externalRoles,
  onClose,
  onSave,
  onCreateRole,
  userTypeTagClass,
}: {
  account: Account | null;
  mode: "detail" | "edit";
  onModeChange: (m: "detail" | "edit") => void;
  internalRoles: string[];
  externalRoles: string[];
  onClose: () => void;
  onSave: (a: Account) => void;
  onCreateRole: (type: UserType, r: string) => void;
  userTypeTagClass: (t: UserType) => string;
}) {
  return (
    <Sheet open={!!account} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:w-1/2 sm:max-w-none p-0 flex flex-col gap-0">
        {account && (
          <AccountDrawerInner
            key={account.id}
            account={account}
            mode={mode}
            onModeChange={onModeChange}
            internalRoles={internalRoles}
            externalRoles={externalRoles}
            onClose={onClose}
            onSave={onSave}
            onCreateRole={onCreateRole}
            userTypeTagClass={userTypeTagClass}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function AccountDrawerInner({
  account,
  mode,
  onModeChange,
  internalRoles,
  externalRoles,
  onClose,
  onSave,
  onCreateRole,
  userTypeTagClass,
}: {
  account: Account;
  mode: "detail" | "edit";
  onModeChange: (m: "detail" | "edit") => void;
  internalRoles: string[];
  externalRoles: string[];
  onClose: () => void;
  onSave: (a: Account) => void;
  onCreateRole: (type: UserType, r: string) => void;
  userTypeTagClass: (t: UserType) => string;
}) {
  const editable = mode === "edit";

  const [phone, setPhone] = useState(account.phone);
  const [userType, setUserType] = useState<UserType>(account.userType);
  const [farmRoles, setFarmRoles] = useState<FarmRole[]>(account.farmRoles);
  const [wecomId, setWecomId] = useState<string | null>(account.wecomId);
  const [wechatId, setWechatId] = useState<string | null>(account.wechatId);
  const [status, setStatus] = useState<Status>(account.status);
  const [pendingUserType, setPendingUserType] = useState<UserType | null>(null);

  const baseRoles = userType === "内部" ? internalRoles : externalRoles;
  const availableRoles = useMemo(() => {
    const set = new Set(baseRoles);
    farmRoles.forEach((fr) => fr.roles.forEach((r) => baseRoles.includes(r) && set.add(r)));
    return Array.from(set);
  }, [baseRoles, farmRoles]);

  const incomplete = farmRoles.some((fr) => fr.roles.length === 0);
  const effectiveFarmRoles = useMemo(
    () => farmRoles.filter((fr) => fr.roles.length > 0),
    [farmRoles],
  );
  const canSave = effectiveFarmRoles.length > 0;

  return (
    <>
      <SheetHeader className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-full bg-brand-subtle flex items-center justify-center shrink-0 text-primary text-body font-medium">
              {account.initial}
            </div>
            <div className="min-w-0">
              <SheetTitle className="text-card-title text-foreground truncate text-left">
                {account.name} · {editable ? "编辑" : "详情"}
              </SheetTitle>
              <SheetDescription className="text-caption text-text-tertiary text-left font-mono">
                {account.id}
              </SheetDescription>
            </div>
          </div>
          {!editable && (
            <button
              className="h-8 px-2 text-body-sm font-normal text-primary hover:underline"
              onClick={() => onModeChange("edit")}
            >
              编辑
            </button>
          )}
        </div>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto">
        {/* 基础信息 */}
        <section className="px-6 py-5 border-b border-border space-y-4">
          <div className="flex items-center gap-2">
            <span className="h-5 w-1 rounded-full bg-primary" />
            <h4 className="text-body font-medium text-foreground">基础信息</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-caption text-text-tertiary">姓名</Label>
              <div className="mt-1.5">
                {editable ? (
                  <Input value={account.name} disabled className="h-9 bg-card border-border text-body-sm" />
                ) : (
                  <div className="text-body text-foreground">{account.name}</div>
                )}
              </div>
            </div>
            <div>
              <Label className="text-caption text-text-tertiary">人员类型</Label>
              <div className="mt-1.5">
                {editable ? (
                  <Select
                    value={userType}
                    onValueChange={(v) => {
                      const next = v as UserType;
                      if (next !== userType) setPendingUserType(next);
                    }}
                  >
                    <SelectTrigger className="h-9 text-body-sm bg-card border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="内部" className="text-body-sm">内部</SelectItem>
                      <SelectItem value="外部" className="text-body-sm">外部</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <span className={`tag ${userTypeTagClass(account.userType)}`}>{account.userType}</span>
                )}
              </div>
            </div>
            <div>
              <Label className="text-caption text-text-tertiary">手机号</Label>
              <div className="mt-1.5">
                {editable ? (
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-9 bg-card border-border text-body-sm tabular-nums" />
                ) : (
                  <div className="text-body text-foreground tabular-nums">{maskPhone(account.phone)}</div>
                )}
              </div>
            </div>
            <div className="sm:col-span-2">
              <Label className="text-caption text-text-tertiary">状态</Label>
              <div className="mt-1.5">
                {editable ? (
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={status === "启用"}
                      onCheckedChange={(v) => setStatus(v ? "启用" : "禁用")}
                      className="data-[state=checked]:bg-primary"
                    />
                    <span className={`text-body-sm ${status === "启用" ? "text-primary" : "text-text-tertiary"}`}>
                      {status === "启用" ? "启用" : "禁用"}
                    </span>
                  </div>
                ) : (
                  <span className={`tag ${account.status === "启用" ? "tag-success" : "tag-muted"}`}>{account.status}</span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 关联牧场 / 角色 */}
        <section className="px-6 py-5 border-b border-border space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="h-5 w-1 rounded-full bg-primary" />
              <h4 className="text-body font-medium text-foreground">关联牧场 / 角色</h4>
            </div>
            {editable && (
              <span className="text-caption text-text-tertiary">已选 {farmRoles.length} 个牧场</span>
            )}
          </div>

          {editable ? (
            <>
              <FarmRolePicker
                value={farmRoles}
                onChange={setFarmRoles}
                roles={availableRoles}
                onCreateRole={(r) => onCreateRole(userType, r)}
              />
              {incomplete && (
                <p className="text-caption text-warning">当前牧场未选择角色，保存时将自动取消该牧场关联</p>
              )}
            </>
          ) : (
            <div className="space-y-2">
              {account.farmRoles.length === 0 ? (
                <span className="tag tag-muted">未关联</span>
              ) : (
                account.farmRoles.map((fr) => (
                  <div key={fr.farm} className="flex items-center gap-2 flex-wrap">
                    <span className="tag tag-muted whitespace-nowrap">{fr.farm}</span>
                    {fr.roles.length === 0 ? (
                      <span className="tag tag-muted">未分配</span>
                    ) : (
                      fr.roles.map((r) => (
                        <span key={r} className="tag tag-brand whitespace-nowrap">{r}</span>
                      ))
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </section>

        {/* 权限范围（仅详情态，默认折叠） */}
        {!editable && account.farmRoles.length > 0 && (
          <PermissionScopeSection farmRoles={account.farmRoles} />
        )}



        {/* 绑定 ID */}
        <section className="px-6 py-5 space-y-4">
          <div className="flex items-center gap-2">
            <span className="h-5 w-1 rounded-full bg-primary" />
            <h4 className="text-body font-medium text-foreground">第三方绑定</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <BindRow
              label="企微 ID"
              value={editable ? wecomId : account.wecomId}
              editable={editable}
              onUnbind={() => setWecomId(null)}
              hint={editable && !wecomId && account.wecomId ? "保存后该用户需重新通过企业微信扫码绑定" : null}
            />
          </div>
        </section>
      </div>

      {editable && (
        <SheetFooter className="px-6 py-3 border-t border-border bg-card">
          <Button variant="outline" onClick={onClose} className="h-9 text-body-sm font-normal">取消</Button>
          <Button
            disabled={!canSave}
            onClick={() => onSave({ ...account, phone, userType, farmRoles: effectiveFarmRoles, wecomId, wechatId, status })}    
            className="h-9 text-body-sm font-normal bg-primary hover:bg-[var(--brand-hover)] text-primary-foreground"
          >
            保存
          </Button>
        </SheetFooter>
      )}
      <AlertDialog open={pendingUserType !== null} onOpenChange={(o) => !o && setPendingUserType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              确认更改为{pendingUserType === "外部" ? "外部" : "内部"}账号？
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingUserType === "外部"
                ? "外部账号将无法查看工单信息、药品信息等业务数据，请确认是否更改为外部账号"
                : "内部账号可以查看工单信息、药品信息等业务数据，请确认是否更改为内部账号"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingUserType) {
                  setUserType(pendingUserType);
                  setFarmRoles((cur) => cur.map((fr) => ({ ...fr, roles: [] })));
                }
                setPendingUserType(null);
              }}
            >
              确认更改
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function PermissionScopeSection({ farmRoles }: { farmRoles: FarmRole[] }) {
  const [open, setOpen] = useState(false);
  const totalRoles = useMemo(
    () => Array.from(new Set(farmRoles.flatMap((fr) => fr.roles))).length,
    [farmRoles],
  );
  return (
    <section className="px-6 py-5 border-b border-border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 group"
      >
        <div className="flex items-center gap-2">
          <span className="h-5 w-1 rounded-full bg-primary" />
          <h4 className="text-body font-medium text-foreground">权限范围</h4>
          <span className="text-caption text-text-tertiary">
            {farmRoles.length} 个牧场 · {totalRoles} 个角色（同牧场多角色取并集）
          </span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-text-tertiary transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="mt-4 space-y-3">
          {farmRoles.map((fr) => {
            const perms = unionPermsForRoles(fr.roles);
            const empty = perms.pc.length === 0 && perms.mini.length === 0;
            return (
              <div key={fr.farm} className="rounded-md border border-border bg-surface-subtle px-4 py-3 space-y-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="tag tag-muted whitespace-nowrap">{fr.farm}</span>
                  {fr.roles.length === 0 ? (
                    <span className="tag tag-muted">未分配</span>
                  ) : (
                    fr.roles.map((r) => (
                      <span key={r} className="tag tag-brand whitespace-nowrap">{r}</span>
                    ))
                  )}
                </div>
                {empty ? (
                  <p className="text-caption text-text-tertiary">该角色暂无权限，请前往「角色权限」配置。</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="text-caption text-text-tertiary mb-1.5">PC 端菜单</div>
                      {perms.pc.length === 0 ? (
                        <div className="text-body-sm text-text-tertiary">—</div>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {perms.pc.map((p) => (
                            <span key={p} className="tag tag-info whitespace-nowrap">{p}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-caption text-text-tertiary mb-1.5">小程序模块</div>
                      {perms.mini.length === 0 ? (
                        <div className="text-body-sm text-text-tertiary">—</div>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {perms.mini.map((p) => (
                            <span key={p} className="tag tag-muted whitespace-nowrap">{p}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <p className="text-caption text-text-tertiary">
            权限明细以「组织管理 / 角色权限」中各角色的最新配置为准。
          </p>
        </div>
      )}
    </section>
  );
}

function BindRow({
  label,
  value,
  editable,
  onUnbind,
  hint,
}: {
  label: string;
  value: string | null;
  editable: boolean;
  onUnbind: () => void;
  hint: string | null;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  return (
    <div>
      <Label className="text-caption text-text-tertiary">{label}</Label>
      <div className="mt-1.5 flex items-center justify-between gap-2 rounded-md border border-border bg-surface-subtle px-3 h-9">
        {value ? (
          <>
            <span className="text-body-sm font-mono text-text-secondary truncate" title="已脱敏显示">{maskId(value)}</span>
            {editable && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmOpen(true)} className="h-7 gap-1 text-caption text-destructive hover:text-destructive">
                <Unlink className="h-3 w-3" /> 解绑
              </Button>
            )}
          </>
        ) : (
          <span className="tag tag-muted">未绑定</span>
        )}
      </div>
      {hint && <p className="mt-1 text-caption text-text-tertiary">{hint}</p>}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认解绑该{label}？</AlertDialogTitle>
            <AlertDialogDescription>
              解绑后该用户需重新通过扫码完成绑定，期间相关通知与登录可能受影响。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onUnbind();
                setConfirmOpen(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              确认解绑
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


function CreateDialog({
  internalRoles,
  externalRoles,
  onClose,
  onCreate,
  onCreateRole,
}: {
  internalRoles: string[];
  externalRoles: string[];
  onClose: () => void;
  onCreate: (a: Omit<Account, "id" | "initial">, newRoleCreated: string | null) => void;
  onCreateRole: (type: UserType, r: string) => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [userType, setUserType] = useState<UserType>("外部");
  const [farmRoles, setFarmRoles] = useState<FarmRole[]>([]);

  const baseRoles = userType === "内部" ? internalRoles : externalRoles;
  // 切换人员类型时，清空已选角色（保留牧场选择）
  const handleUserTypeChange = (v: UserType) => {
    setUserType(v);
    setFarmRoles((cur) => cur.map((fr) => ({ ...fr, roles: [] })));
  };

  const incomplete = farmRoles.some((fr) => fr.roles.length === 0);
  const effectiveFarmRoles = useMemo(
    () => farmRoles.filter((fr) => fr.roles.length > 0),
    [farmRoles],
  );
  const canSubmit = !!name.trim() && !!phone.trim() && effectiveFarmRoles.length > 0;

  const submit = () => {
    if (!canSubmit) return;
    const firstNewRole =
      effectiveFarmRoles.flatMap((fr) => fr.roles).find((r) => !baseRoles.includes(r)) ?? null;
    onCreate(
      {
        name: name.trim(),
        employeeNo: "—",
        phone: phone.trim(),
        userType,
        source: "兽医系统",
        farmRoles: effectiveFarmRoles,
        wecomId: null,
        wechatId: null,

        status: "启用",
        createdAt: new Date().toISOString().slice(0, 10),
      },
      firstNewRole,
    );
  };

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:w-1/2 sm:max-w-none p-0 flex flex-col gap-0">
        <SheetHeader className="px-6 py-4 border-b border-border">
          <SheetTitle className="text-card-title text-foreground text-left">新建账号</SheetTitle>
          <SheetDescription className="text-caption text-text-tertiary text-left">
            维护内部或外部人员账号，并为每个关联牧场指定角色
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="h-5 w-1 rounded-full bg-primary" />
              <h4 className="text-body font-medium text-foreground">基础信息</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-caption text-text-tertiary">姓名</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9 text-body-sm" placeholder="请输入" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-caption text-text-tertiary">手机号</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-9 text-body-sm tabular-nums" placeholder="11 位手机号" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-caption text-text-tertiary">人员类型</Label>
                <Select value={userType} onValueChange={(v) => handleUserTypeChange(v as UserType)}>
                  <SelectTrigger className="h-9 text-body-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="内部" className="text-body-sm">内部</SelectItem>
                    <SelectItem value="外部" className="text-body-sm">外部</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <section className="space-y-3 pt-2 border-t border-border">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="h-5 w-1 rounded-full bg-primary" />
                <h4 className="text-body font-medium text-foreground">关联牧场 / 角色</h4>
              </div>
              <span className="text-caption text-text-tertiary">已选 {farmRoles.length} 个</span>
            </div>
            <FarmRolePicker
              value={farmRoles}
              onChange={setFarmRoles}
              roles={baseRoles}
              onCreateRole={(r) => onCreateRole(userType, r)}
            />
            <p className="text-caption text-text-tertiary">
              勾选牧场后请为每个牧场至少指定一个角色；未选角色的牧场切走时会自动取消关联。当前为「{userType}」人员，可在右上方输入新角色名创建。
            </p>
            {incomplete && (
              <p className="text-caption text-warning">当前牧场未选择角色，提交时将自动取消该牧场关联</p>
            )}
          </section>
        </div>

        <SheetFooter className="px-6 py-3 border-t border-border bg-card">
          <Button variant="outline" onClick={onClose} className="h-9 text-body-sm font-normal">取消</Button>
          <Button
            onClick={submit}
            disabled={!canSubmit}
            className="h-9 text-body-sm font-normal bg-primary hover:bg-[var(--brand-hover)] text-primary-foreground"
          >
            创建账号
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function BatchAssignDialog({
  count,
  selectedAccounts,
  roles,
  internalRoles,
  onCreateRole,
  onClose,
  onApply,
}: {
  count: number;
  selectedAccounts: Account[];
  roles: string[];
  internalRoles: string[];
  onCreateRole: (r: string) => void;
  onClose: () => void;
  onApply: (farmRoles: FarmRole[], mode: "replace" | "merge") => void;
}) {
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const [farmRoles, setFarmRoles] = useState<FarmRole[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const effective = useMemo(
    () => farmRoles.filter((fr) => fr.roles.length > 0),
    [farmRoles],
  );
  const canSubmit = effective.length > 0;

  // 混合人员类型时给出提示
  const hasInternal = selectedAccounts.some((a) => a.userType === "内部");
  const hasExternal = selectedAccounts.some((a) => a.userType === "外部");
  const mixed = hasInternal && hasExternal;

  // 仅展示与所选账号类型相容的角色（混合则全部）
  const visibleRoles = useMemo(() => {
    if (mixed) return roles;
    if (hasInternal) return roles.filter((r) => internalRoles.includes(r));
    return roles.filter((r) => !internalRoles.includes(r));
  }, [roles, internalRoles, mixed, hasInternal]);

  return (
    <>
      <Sheet open onOpenChange={(o) => !o && onClose()}>
        <SheetContent side="right" className="w-full sm:w-1/2 sm:max-w-none p-0 flex flex-col gap-0">
          <SheetHeader className="px-6 py-4 border-b border-border">
            <SheetTitle className="text-card-title text-foreground text-left">批量关联牧场 / 分配角色</SheetTitle>
            <SheetDescription className="text-caption text-text-tertiary text-left">
              将对所选 {count} 个账号统一应用以下牧场与角色配置。
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            {/* 模式 */}
            <div className="rounded-md border border-border bg-surface-subtle p-3 space-y-2">
              <div className="text-body-sm font-medium text-foreground">应用方式</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className={`flex items-start gap-2 p-3 rounded-md border cursor-pointer ${mode === "merge" ? "border-primary bg-card" : "border-border bg-card hover:border-primary/40"}`}>
                  <input
                    type="radio"
                    checked={mode === "merge"}
                    onChange={() => setMode("merge")}
                    className="mt-0.5 accent-primary"
                  />
                  <div className="min-w-0">
                    <div className="text-body-sm text-foreground">追加合并</div>
                    <div className="text-caption text-text-tertiary mt-0.5">
                      在账号原有牧场 / 角色基础上合并新配置（同牧场角色取并集）。
                    </div>
                  </div>
                </label>
                <label className={`flex items-start gap-2 p-3 rounded-md border cursor-pointer ${mode === "replace" ? "border-primary bg-card" : "border-border bg-card hover:border-primary/40"}`}>
                  <input
                    type="radio"
                    checked={mode === "replace"}
                    onChange={() => setMode("replace")}
                    className="mt-0.5 accent-primary"
                  />
                  <div className="min-w-0">
                    <div className="text-body-sm text-foreground">覆盖替换</div>
                    <div className="text-caption text-text-tertiary mt-0.5">
                      清空账号原有牧场 / 角色，统一替换为以下配置。
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {mixed && (
              <div className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-caption text-text-secondary">
                所选账号同时包含内部与外部人员，请确认分配的角色对两类人员都适用。
              </div>
            )}

            <FarmRolePicker
              value={farmRoles}
              onChange={setFarmRoles}
              roles={visibleRoles}
              onCreateRole={onCreateRole}
            />
          </div>

          <SheetFooter className="px-6 py-3 border-t border-border bg-card">
            <Button variant="outline" onClick={onClose} className="h-9 text-body-sm font-normal">
              取消
            </Button>
            <Button
              disabled={!canSubmit}
              onClick={() => setConfirmOpen(true)}
              className="h-9 text-body-sm font-normal bg-primary hover:bg-[var(--brand-hover)] text-primary-foreground"
            >
              应用到 {count} 个账号
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              确认{mode === "replace" ? "覆盖替换" : "追加合并"}？
            </AlertDialogTitle>
            <AlertDialogDescription>
              将对所选 {count} 个账号应用 {effective.length} 个牧场配置。
              {mode === "replace" && "账号原有的牧场与角色将被清空并替换。"}
              此操作会立即生效。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmOpen(false);
                onApply(effective, mode);
              }}
              className="bg-primary hover:bg-[var(--brand-hover)] text-primary-foreground"
            >
              确认应用
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
