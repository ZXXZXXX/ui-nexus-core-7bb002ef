import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  ShieldCheck,
  Briefcase,
  Stethoscope,
  HeartPulse,
  Monitor,
  Smartphone,
  MoreVertical,
  Users,
  Power,
  Info,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { usePcRole, isSuperAdmin } from "@/lib/pc-role";

export const Route = createFileRoute("/organization/role")({
  head: () => ({ meta: [{ title: "角色权限 — 奇点智牧" }] }),
  component: RolePage,
});

type RoleKey = string;

type Role = {
  key: RoleKey;
  name: string;
  count: number;
  scope: string;
  desc: string;
  enabled: boolean;
  icon: typeof ShieldCheck;
};

const initialRoles: Role[] = [
  { key: "admin", name: "超级管理员", count: 2, scope: "全平台", desc: "拥有系统全部权限，可管理租户、角色与所有业务数据。", enabled: true, icon: ShieldCheck },
  { key: "manager", name: "场长", count: 3, scope: "本牧场全部", desc: "负责牧场日常运营管理，拥有除组织权限外的所有业务功能。", enabled: true, icon: Briefcase },
  { key: "vet", name: "兽医", count: 8, scope: "健康相关数据", desc: "负责诊疗与工单管理，可处理疾病、疫苗、工作等业务。", enabled: true, icon: Stethoscope },
  { key: "assistant", name: "兽医助理", count: 6, scope: "健康执行 / 录入", desc: "协助兽医完成日常工作录入与执行，部分功能仅查看权限。", enabled: false, icon: HeartPulse },
];

/** 与左侧菜单导航完全对应的权限结构 */
type NavAction = { key: string; name: string };
type NavLeaf = { key: string; name: string; actions?: NavAction[] };
type NavGroupDef = {
  key: string;
  name: string;
  desc: string;
  kind?: "home";
  children?: NavLeaf[];
  actions?: NavAction[];
  required?: boolean;
};

const woActions: NavAction[] = [
  { key: "create", name: "新建工单" },
  { key: "assign", name: "下发 / 指派" },
  { key: "diagnose", name: "诊断 / 确认方案" },
  { key: "execute", name: "执行 / 完成" },
  { key: "export", name: "导出" },
];

const crudActions: NavAction[] = [
  { key: "create", name: "新建" },
  { key: "edit", name: "编辑" },
  { key: "delete", name: "删除" },
  { key: "export", name: "导出" },
];

const navSpec: NavGroupDef[] = [
  {
    key: "home",
    name: "首页",
    desc: "选择该角色进入首页时看到的看板视角（4 选 1）",
    kind: "home",
    required: true,
  },
  {
    key: "archive",
    name: "基础档案",
    desc: "仅区分能否查看二级菜单界面，无其他操作能力",
    children: [
      { key: "farm", name: "牛场信息" },
      { key: "barn", name: "牛舍信息" },
      { key: "cattle", name: "牛只信息" },
    ],
  },
  {
    key: "workorder",
    name: "工单管理",
    desc: "可分别配置二级菜单的查看与操作能力",
    children: [
      { key: "disease", name: "疾病治疗", actions: woActions },
      { key: "vaccine", name: "疫苗免疫", actions: woActions },
      { key: "postpartum", name: "产后护理", actions: woActions },
      { key: "hoof", name: "修蹄工单", actions: woActions },
      { key: "drying", name: "干奶工单", actions: woActions },
      { key: "deworm", name: "驱虫工单", actions: woActions },
      { key: "general", name: "普修工单", actions: woActions },
    ],
  },
  {
    key: "drug",
    name: "药品管理",
    desc: "可分别配置二级菜单的查看与操作能力",
    children: [
      {
        key: "drug-file",
        name: "药品档案",
        actions: [
          { key: "create", name: "新建药品" },
          { key: "edit", name: "编辑 / 调价" },
          { key: "delete", name: "删除" },
          { key: "export", name: "导出" },
        ],
      },
      {
        key: "stock",
        name: "药品库存",
        actions: [
          { key: "inbound", name: "入库登记" },
          { key: "adjust", name: "库存调整" },
          { key: "export", name: "导出" },
        ],
      },
      {
        key: "transfer",
        name: "调拨记录",
        actions: [
          { key: "create", name: "发起调拨" },
          { key: "audit", name: "审核" },
          { key: "export", name: "导出" },
        ],
      },
      {
        key: "dispense",
        name: "取药记录",
        actions: [
          { key: "create", name: "登记取药" },
          { key: "export", name: "导出" },
        ],
      },
      {
        key: "loss",
        name: "损耗管理",
        actions: [
          { key: "create", name: "登记损耗" },
          { key: "audit", name: "判定 / 审核" },
          { key: "export", name: "导出" },
        ],
      },
    ],
  },
  {
    key: "diagnosis",
    name: "诊疗管理",
    desc: "可分别配置二级菜单的查看与维护能力",
    children: [
      { key: "disease", name: "疾病管理", actions: crudActions },
      { key: "symptom", name: "症状管理", actions: crudActions },
      { key: "prescription", name: "处方管理", actions: crudActions },
    ],
  },
  {
    key: "org",
    name: "组织管理",
    desc: "可分别配置二级菜单的查看与管理能力",
    children: [
      {
        key: "account",
        name: "账号管理",
        actions: [
          { key: "create", name: "新建账号" },
          { key: "edit", name: "编辑" },
          { key: "toggle", name: "启用 / 停用" },
        ],
      },
      {
        key: "role",
        name: "角色管理",
        actions: [
          { key: "create", name: "新建角色" },
          { key: "edit", name: "编辑权限" },
          { key: "delete", name: "删除" },
        ],
      },
      {
        key: "integration",
        name: "第三方系统管理",
        actions: [
          { key: "edit", name: "编辑" },
          { key: "toggle", name: "启用 / 停用" },
        ],
      },
    ],
  },
  {
    key: "stats",
    name: "统计分析",
    desc: "一级菜单，可配置查看与操作能力",
    actions: [
      { key: "custom", name: "自定义分析（新建 / 编辑模板）" },
      { key: "export", name: "导出" },
    ],
  },
  {
    key: "feedback",
    name: "反馈管理",
    desc: "一级菜单，可配置查看与操作能力",
    actions: [
      { key: "mark", name: "标注有价值 / 无价值" },
      { key: "export", name: "导出" },
    ],
  },
];



/** 小程序模块与功能权限 */
const WO_TYPES = ["疾病治疗", "疫苗免疫", "产后护理", "修蹄", "干奶", "驱虫", "普修"];
const EVENT_TYPES = ["产犊", "基础检查", "转栏 / 转群", "离场"];

type MiniScope = "wo" | "event";
type MiniViewDef = { key: string; name: string };
type MiniFuncDef = { key: string; name: string; scope?: MiniScope; views?: MiniViewDef[] };
type MiniModuleDef = { key: string; name: string; funcs: MiniFuncDef[] };

const scopeOptions = (s: MiniScope) => (s === "wo" ? WO_TYPES : EVENT_TYPES);
const scopeLabel = (s: MiniScope) =>
  s === "wo" ? "选择对该角色开放的工单类型" : "选择对该角色开放的基础事件类型";

const miniSpec: MiniModuleDef[] = [
  {
    key: "home",
    name: "首页",
    funcs: [
      { key: "work-status", name: "签到卡片" },
      {
        key: "ops",
        name: "查看运营概览",
        views: [
          { key: "ops", name: "运营概览" },
          { key: "work", name: "工作概览" },
        ],
      },
    ],
  },
  {
    key: "report",
    name: "现场上报",
    funcs: [
      { key: "health", name: "健康上报" },
      { key: "loss", name: "药品损耗上报" },
      { key: "return", name: "药品退料上报" },
    ],
  },
  {
    key: "prep",
    name: "备药",
    funcs: [
      { key: "prep-done", name: "完成备药" },
      { key: "level3", name: "查询三级库" },
    ],
  },
  {
    key: "task",
    name: "任务处理",
    funcs: [
      { key: "view", name: "查看任务" },
      { key: "diagnose", name: "工单任务 - 诊断", scope: "wo" },
      { key: "execute-wo", name: "工单任务 - 执行", scope: "wo" },
      { key: "review", name: "工单任务 - 复查" },
      { key: "execute-event", name: "基础事件任务", scope: "event" },
      { key: "abnormal", name: "异常排查任务" },
      { key: "assign", name: "指定任务责任人" },
      { key: "batch", name: "批量执行任务" },
    ],
  },
  {
    key: "workorder",
    name: "工单管理",
    funcs: [
      { key: "view", name: "查看工单", scope: "wo" },
      { key: "abort", name: "终止工单", scope: "wo" },
    ],
  },
  {
    key: "kb",
    name: "知识查询",
    funcs: [
      { key: "symptom", name: "查询症状" },
      { key: "disease", name: "查询疾病" },
      { key: "drug", name: "查询药品" },
    ],
  },
  {
    key: "cattle",
    name: "牛只档案",
    funcs: [
      { key: "view", name: "查看牛只档案" },
      { key: "alert", name: "处理异常预警" },
      { key: "calving", name: "记录产犊" },
      { key: "exam", name: "记录基础检查" },
      { key: "transfer", name: "记录转栏 / 转群" },
      { key: "leave", name: "记录离场" },
    ],
  },
  { key: "message", name: "消息中心", funcs: [{ key: "view", name: "查看消息" }] },
  {
    key: "me",
    name: "个人中心",
    funcs: [
      { key: "drafts", name: "管理健康上报草稿" },
      { key: "feedback", name: "提交帮助与反馈" },
    ],
  },
];

/** 工作台可选的 4 套定制化看板视图 */
export type WorkbenchView = "group" | "region" | "farm-report" | "farm-internal";

const workbenchViews: { key: WorkbenchView; name: string; desc: string }[] = [
  { key: "group", name: "集团级别运营看板", desc: "全集团口径汇总，面向集团高管" },
  { key: "region", name: "区域级别运营看板", desc: "区域（中心）口径汇总，面向区域负责人" },
  { key: "farm-report", name: "牧场客户汇报看板", desc: "对外汇报视角，默认隐藏药品、工单与预警告警" },
  { key: "farm-internal", name: "牧场内部管理看板", desc: "牧场内部全量专题，面向场长与现场团队" },
];

type LeafPerm = { view: boolean; actions: Record<string, boolean> };
type GroupPerm = { view: boolean; leaves: Record<string, LeafPerm>; actions: Record<string, boolean> };
type NavPerms = Record<string, GroupPerm>;
type PcPerms = { allowLogin: boolean; nav: NavPerms; workbenchView: WorkbenchView };
type MiniFuncPerm = { on: boolean; scope: string[]; view?: string };
type MiniPerms = Record<string, Record<string, MiniFuncPerm>>;
type RolePerms = Record<RoleKey, { pc: PcPerms; mini: MiniPerms }>;

function buildNav(on: boolean, groupKeys?: string[]): NavPerms {
  return navSpec.reduce((acc, g) => {
    const gOn = groupKeys ? !!g.required || groupKeys.includes(g.key) : on;
    acc[g.key] = {
      view: gOn,
      actions: (g.actions ?? []).reduce(
        (a, act) => ({ ...a, [act.key]: gOn }),
        {} as Record<string, boolean>,
      ),
      leaves: (g.children ?? []).reduce((a, leaf) => {
        a[leaf.key] = {
          view: gOn,
          actions: (leaf.actions ?? []).reduce(
            (x, act) => ({ ...x, [act.key]: gOn }),
            {} as Record<string, boolean>,
          ),
        };
        return a;
      }, {} as Record<string, LeafPerm>),
    };
    return acc;
  }, {} as NavPerms);
}

function fullPc(allow = true, on = true): PcPerms {
  return { allowLogin: allow, workbenchView: "group", nav: buildNav(on) };
}
function buildMini(pick?: (mKey: string, fKey: string) => boolean): MiniPerms {
  return miniSpec.reduce((acc, m) => {
    acc[m.key] = m.funcs.reduce((a, f) => {
      a[f.key] = {
        on: pick ? pick(m.key, f.key) : false,
        scope: f.scope ? [...scopeOptions(f.scope)] : [],
        ...(f.views ? { view: f.views[0]!.key } : {}),
      };
      return a;
    }, {} as Record<string, MiniFuncPerm>);
    return acc;
  }, {} as MiniPerms);
}

function fullMini(v = true): MiniPerms {
  return buildMini(() => v);
}
function partialPc(keys: string[], workbenchView: WorkbenchView = "farm-internal"): PcPerms {
  return { allowLogin: true, workbenchView, nav: buildNav(false, keys) };
}

/** map：模块 key -> true（全部功能）或功能 key 数组 */
function partialMini(map: Record<string, true | string[]>): MiniPerms {
  return buildMini((mKey, fKey) => {
    const v = map[mKey];
    return v === true || (Array.isArray(v) && v.includes(fKey));
  });
}

const defaultPerms: RolePerms = {
  admin: { pc: fullPc(true, true), mini: fullMini(true) },
  manager: {
    pc: partialPc(["workorder", "drug", "archive", "diagnosis", "stats", "feedback"]),
    mini: fullMini(true),
  },
  vet: {
    pc: partialPc(["workorder", "drug", "diagnosis", "archive"]),
    mini: partialMini({
      home: true,
      report: true,
      prep: true,
      task: true,
      workorder: true,
      kb: true,
      cattle: true,
      message: true,
      me: true,
    }),
  },
  assistant: {
    pc: { allowLogin: false, workbenchView: "farm-internal", nav: buildNav(false) },
    mini: partialMini({
      home: ["work-status"],
      report: ["health", "loss", "return"],
      prep: true,
      task: ["view", "execute-wo", "execute-event", "batch"],
      workorder: ["view"],
      kb: true,
      cattle: ["view", "exam", "transfer"],
      message: true,
      me: true,
    }),
  },
};


type ViewMode = "detail" | "edit";

function RolePage() {
  const pcRole = usePcRole();
  const canManage = isSuperAdmin(pcRole);
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const [perms, setPerms] = useState<RolePerms>(defaultPerms);


  const [drawerRole, setDrawerRole] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("detail");

  const [confirmAction, setConfirmAction] = useState<
    | { kind: "toggle"; role: Role }
    | { kind: "delete"; role: Role }
    | null
  >(null);

  const [draftRoleKey, setDraftRoleKey] = useState<string | null>(null);

  /** 权限树展开状态：一级默认展开，二级默认收起 */
  const [treeOpen, setTreeOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(navSpec.map((g) => [g.key, true])),
  );
  const toggleNode = (k: string) => setTreeOpen((m) => ({ ...m, [k]: !m[k] }));
  const isOpen = (k: string) => !!treeOpen[k];
  /** 权限树左右布局：当前选中的一级菜单 */
  const [navActive, setNavActive] = useState<string>(navSpec[0]!.key);
  const [miniActive, setMiniActive] = useState<string>(miniSpec[0]!.key);

  const startCreate = () => {
    if (!canManage) return;
    if (roles.length >= 12) {
      toast.error("角色数量已达上限 12 个，如需更多请联系客服开放");
      return;
    }

    const key = `role_${Date.now()}`;
    setRoles((prev) => [
      ...prev,
      {
        key,
        name: "",
        count: 0,
        scope: "自定义",
        desc: "",
        enabled: false,
        icon: ShieldCheck,
      },
    ]);
    setPerms((prev) => ({
      ...prev,
      [key]: {
        pc: {
          allowLogin: false,
          workbenchView: "farm-internal" as WorkbenchView,
          nav: buildNav(false),
        },

        mini: fullMini(false),
      },
    }));
    setDraftRoleKey(key);
    setDrawerRole(key);
    setViewMode("edit");
  };

  const closeDrawer = () => {
    if (draftRoleKey) {
      const dk = draftRoleKey;
      setRoles((prev) => prev.filter((r) => r.key !== dk));
      setPerms((prev) => {
        const { [dk]: _, ...rest } = prev;
        return rest;
      });
      setDraftRoleKey(null);
    }
    setDrawerRole(null);
  };

  const updateActiveRole = (patch: Partial<Role>) => {
    if (!drawerRole) return;
    setRoles((prev) => prev.map((r) => (r.key === drawerRole ? { ...r, ...patch } : r)));
  };

  const openDetail = (key: RoleKey) => {
    setDrawerRole(key);
    setViewMode("detail");
  };
  const openEdit = (key: RoleKey) => {
    if (!canManage) return;
    setDrawerRole(key);
    setViewMode("edit");
  };

  const activeRole = drawerRole ? roles.find((r) => r.key === drawerRole)! : null;
  const editable = viewMode === "edit" && canManage;

  const cur = drawerRole ? perms[drawerRole] : null;

  const setPcAllow = (v: boolean) => {
    if (!drawerRole || !editable) return;
    setPerms((prev) => ({
      ...prev,
      [drawerRole]: { ...prev[drawerRole], pc: { ...prev[drawerRole].pc, allowLogin: v } },
    }));
  };
  const mutateNav = (fn: (nav: NavPerms) => NavPerms) => {
    if (!drawerRole || !editable) return;
    setPerms((prev) => ({
      ...prev,
      [drawerRole]: {
        ...prev[drawerRole],
        pc: { ...prev[drawerRole].pc, nav: fn(prev[drawerRole].pc.nav) },
      },
    }));
  };

  /** 一级菜单开关：关闭时连带关闭其下二级菜单与操作 */
  const setGroupView = (gKey: string, v: boolean) =>
    mutateNav((nav) => {
      const g = nav[gKey];
      return {
        ...nav,
        [gKey]: {
          view: v,
          actions: Object.fromEntries(
            Object.keys(g.actions).map((k) => [k, v ? g.actions[k] : false]),
          ),
          leaves: Object.fromEntries(
            Object.entries(g.leaves).map(([lk, lp]) => [
              lk,
              v
                ? lp
                : { view: false, actions: Object.fromEntries(Object.keys(lp.actions).map((k) => [k, false])) },
            ]),
          ),
        },
      };
    });

  /** 二级菜单查看开关：关闭时连带关闭其操作能力 */
  const setLeafView = (gKey: string, lKey: string, v: boolean) =>
    mutateNav((nav) => {
      const lp = nav[gKey].leaves[lKey];
      return {
        ...nav,
        [gKey]: {
          ...nav[gKey],
          view: v ? true : nav[gKey].view,
          leaves: {
            ...nav[gKey].leaves,
            [lKey]: {
              view: v,
              actions: v
                ? lp.actions
                : Object.fromEntries(Object.keys(lp.actions).map((k) => [k, false])),
            },
          },
        },
      };
    });

  const setLeafAction = (gKey: string, lKey: string, aKey: string, v: boolean) =>
    mutateNav((nav) => ({
      ...nav,
      [gKey]: {
        ...nav[gKey],
        view: v ? true : nav[gKey].view,
        leaves: {
          ...nav[gKey].leaves,
          [lKey]: {
            view: v ? true : nav[gKey].leaves[lKey].view,
            actions: { ...nav[gKey].leaves[lKey].actions, [aKey]: v },
          },
        },
      },
    }));

  const setGroupAction = (gKey: string, aKey: string, v: boolean) =>
    mutateNav((nav) => ({
      ...nav,
      [gKey]: {
        ...nav[gKey],
        view: v ? true : nav[gKey].view,
        actions: { ...nav[gKey].actions, [aKey]: v },
      },
    }));

  const setWorkbenchView = (v: WorkbenchView) => {
    if (!drawerRole || !editable) return;
    setPerms((prev) => ({
      ...prev,
      [drawerRole]: {
        ...prev[drawerRole],
        pc: { ...prev[drawerRole].pc, workbenchView: v },
      },
    }));
  };
  const [batchNoticeOpen, setBatchNoticeOpen] = useState(false);
  const mutateMini = (fn: (m: MiniPerms) => MiniPerms) => {
    if (!drawerRole || !editable) return;
    setPerms((prev) => ({
      ...prev,
      [drawerRole]: { ...prev[drawerRole], mini: fn(prev[drawerRole].mini) },
    }));
  };
  /** 单个功能开关 */
  const setMiniFunc = (mKey: string, fKey: string, v: boolean) => {
    if (v && mKey === "task" && fKey === "batch") setBatchNoticeOpen(true);
    mutateMini((m) => ({
      ...m,
      [mKey]: { ...m[mKey], [fKey]: { ...m[mKey][fKey], on: v } },
    }));
  };
  /** 功能视角单选 */
  const setMiniView = (mKey: string, fKey: string, view: string) =>
    mutateMini((m) => ({
      ...m,
      [mKey]: { ...m[mKey], [fKey]: { ...m[mKey][fKey], view } },
    }));
  /** 模块整行 */
  const setMiniModule = (mKey: string, v: boolean) =>
    mutateMini((m) => ({
      ...m,
      [mKey]: Object.fromEntries(
        Object.entries(m[mKey]).map(([k, p]) => [k, { ...p, on: v }]),
      ),
    }));
  const setMiniAll = (v: boolean) =>
    mutateMini((m) =>
      Object.fromEntries(
        Object.entries(m).map(([mk, fs]) => [
          mk,
          Object.fromEntries(Object.entries(fs).map(([fk, p]) => [fk, { ...p, on: v }])),
        ]),
      ),
    );
  /** 全局可选范围（工单类型 / 基础事件类型）——所有功能通用，仅需选择一次 */
  const globalScope = (kind: MiniScope): string[] => {
    for (const m of miniSpec) {
      for (const f of m.funcs) {
        if (f.scope === kind) return cur?.mini[m.key][f.key].scope ?? [];
      }
    }
    return [];
  };
  const toggleGlobalScope = (kind: MiniScope, t: string) =>
    mutateMini((m) => {
      const curList = (() => {
        for (const mod of miniSpec) {
          for (const f of mod.funcs) {
            if (f.scope === kind) return m[mod.key][f.key].scope;
          }
        }
        return [] as string[];
      })();
      const next = curList.includes(t) ? curList.filter((x) => x !== t) : [...curList, t];
      return Object.fromEntries(
        miniSpec.map((mod) => [
          mod.key,
          Object.fromEntries(
            mod.funcs.map((f) => [
              f.key,
              f.scope === kind ? { ...m[mod.key][f.key], scope: next } : m[mod.key][f.key],
            ]),
          ),
        ]),
      ) as MiniPerms;
    });


  const handleConfirmToggle = () => {
    if (confirmAction?.kind !== "toggle") return;
    const r = confirmAction.role;
    setRoles((prev) => prev.map((x) => (x.key === r.key ? { ...x, enabled: !x.enabled } : x)));
    toast.success(`${r.name} 已${r.enabled ? "停用" : "启用"}`);
    setConfirmAction(null);
  };
  const handleConfirmDelete = () => {
    if (confirmAction?.kind !== "delete") return;
    const r = confirmAction.role;
    setRoles((prev) => prev.filter((x) => x.key !== r.key));
    toast.success(`已删除角色：${r.name}`);
    setConfirmAction(null);
  };

  return (
    <>
      <AppHeader title="角色管理" breadcrumb={["组织管理", "角色管理"]} />
      <main className="flex-1 px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-card-title text-foreground">角色列表</h3>
            <p className="text-caption text-text-tertiary mt-1">
              共 {roles.length} / 12 个角色
              {roles.length >= 12 && (
                <span className="ml-2 text-destructive">已达上限，如需更多请联系客服开放</span>
              )}
              {!canManage && (
                <span className="ml-2 text-text-tertiary">当前账号无角色管理权限，仅可查看</span>
              )}
            </p>
          </div>
          <Button
            size="sm"
            onClick={startCreate}
            disabled={!canManage}
            title={!canManage ? "仅超级管理员可新建角色" : undefined}
            className="h-9 gap-1.5 text-body-sm font-normal bg-primary hover:bg-[var(--brand-hover)] text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-3.5 w-3.5" /> 新建角色
          </Button>


        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {roles.map((r) => {
            const disabled = !r.enabled;
            return (
              <Card
                key={r.key}
                onClick={() => openDetail(r.key)}
                className={`group relative p-5 cursor-pointer transition-all ${
                  disabled
                    ? "bg-muted/70 border-muted-foreground/20 hover:border-muted-foreground/30 opacity-80"
                    : "border-border bg-card hover:border-primary/40 hover:shadow-sm"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`h-10 w-10 rounded-md flex items-center justify-center shrink-0 ${
                    disabled ? "bg-muted" : "bg-brand-subtle"
                  }`}>
                    <r.icon className={`h-5 w-5 ${disabled ? "text-muted-foreground" : "text-primary"}`} strokeWidth={1.75} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className={`text-card-title truncate ${disabled ? "text-muted-foreground" : "text-foreground"}`}>
                        {r.name}
                      </h4>
                      {disabled && (
                        <Badge variant="outline" className="h-5 px-1.5 text-caption font-normal border-muted-foreground/30 text-muted-foreground bg-muted">
                          已停用
                        </Badge>
                      )}
                      {r.enabled && (
                        <Badge variant="outline" className="h-5 px-1.5 text-caption font-normal border-[#6EDB7B]/30 text-[#2F7A3A] bg-[#6EDB7B]/10">
                          启用中
                        </Badge>
                      )}
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className={`h-7 w-7 rounded-md flex items-center justify-center transition-colors ${
                          disabled
                            ? "text-muted-foreground/60 hover:bg-muted hover:text-muted-foreground"
                            : "text-text-tertiary hover:bg-surface-subtle hover:text-foreground"
                        }`}
                        aria-label="更多操作"
                      >
                        <MoreVertical className="h-4 w-4" strokeWidth={1.75} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-32"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenuItem disabled={!canManage} onClick={() => openEdit(r.key)}>编辑</DropdownMenuItem>
                      <DropdownMenuItem disabled={!canManage} onClick={() => canManage && setConfirmAction({ kind: "toggle", role: r })}>
                        {r.enabled ? "停用" : "启用"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        disabled={!canManage}
                        className="text-destructive focus:text-destructive"
                        onClick={() => canManage && setConfirmAction({ kind: "delete", role: r })}
                      >
                        删除
                      </DropdownMenuItem>

                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <p className={`text-body-sm mt-3 line-clamp-2 min-h-[2.5rem] ${disabled ? "text-muted-foreground/60" : "text-text-secondary"}`}>
                  {r.desc}
                </p>

                <div className={`flex items-center gap-4 mt-4 pt-3 border-t text-caption ${
                  disabled ? "border-muted-foreground/10 text-muted-foreground/60" : "border-border text-text-tertiary"
                }`}>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" strokeWidth={1.75} /> {r.count} 人
                  </span>
                  <span className="flex items-center gap-1">
                    <Power className="h-3.5 w-3.5" strokeWidth={1.75} />
                    {r.enabled ? "启用中" : "已停用"}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      </main>

      {/* Drawer: detail / edit */}
      <Sheet open={!!drawerRole} onOpenChange={(v) => !v && closeDrawer()}>
        <SheetContent side="right" className="w-full sm:w-1/2 sm:max-w-none p-0 flex flex-col gap-0">
          <SheetHeader className="px-6 py-4 border-b border-border">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {activeRole && (
                  <div className="h-10 w-10 rounded-md bg-brand-subtle flex items-center justify-center shrink-0">
                    <activeRole.icon className="h-5 w-5 text-primary" strokeWidth={1.75} />
                  </div>
                )}
                <div className="min-w-0">
                  <SheetTitle className="text-card-title text-foreground truncate text-left">
                    {draftRoleKey === drawerRole
                      ? "新建角色"
                      : `${activeRole?.name} · ${viewMode === "edit" ? "编辑" : "详情"}`}
                  </SheetTitle>
                  <SheetDescription className="text-caption text-text-tertiary text-left">
                    {viewMode === "edit" ? "可调整角色信息与权限配置" : "查看角色信息与全部权限"}
                  </SheetDescription>
                </div>
              </div>
              {viewMode === "detail" && activeRole && canManage && (
                <button
                  className="h-8 px-2 text-body-sm font-normal text-primary hover:underline"
                  onClick={() => setViewMode("edit")}
                >
                  编辑
                </button>
              )}

            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            {activeRole && cur && (
              <>
                {/* 1. Basic info */}
                <section className="px-6 py-5 border-b border-border space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-1 rounded-full bg-primary" />
                    <h4 className="text-body font-medium text-foreground">基础信息</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-caption text-text-tertiary">角色名称</Label>
                      {editable ? (
                        <Input
                          value={activeRole.name}
                          onChange={(e) => updateActiveRole({ name: e.target.value })}
                          maxLength={6}
                          placeholder="请输入角色名称（最多6个字）"
                          className="h-9 mt-1.5 bg-card border-border text-body-sm"
                        />
                      ) : (
                        <div className="mt-1.5 text-body text-foreground">{activeRole.name}</div>
                      )}
                    </div>
                    <div>
                      <Label className="text-caption text-text-tertiary">是否启用</Label>
                      {editable ? (
                        <div className="mt-1.5 flex items-center gap-2">
                          <Switch
                            checked={activeRole.enabled}
                            onCheckedChange={(v) => {
                              setRoles((prev) =>
                                prev.map((r) =>
                                  r.key === activeRole.key ? { ...r, enabled: v } : r,
                                ),
                              );
                            }}
                          />
                          <span className="text-body-sm text-foreground">
                            {activeRole.enabled ? "启用" : "停用"}
                          </span>
                        </div>
                      ) : (
                        <div className="mt-1.5 flex items-center gap-1.5 text-body text-foreground">
                          <span
                            className={`inline-block h-2 w-2 rounded-full ${
                              activeRole.enabled ? "bg-primary" : "bg-text-tertiary"
                            }`}
                          />
                          {activeRole.enabled ? "启用中" : "已停用"}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-caption text-text-tertiary">角色说明</Label>
                    {editable ? (
                      <Textarea
                        value={activeRole.desc}
                        onChange={(e) => updateActiveRole({ desc: e.target.value })}
                        rows={2}
                        placeholder="描述该角色的职责范围"
                        className="mt-1.5 bg-card border-border text-body-sm"
                      />
                    ) : (
                      <p className="mt-1.5 text-body-sm text-text-secondary">{activeRole.desc}</p>
                    )}
                  </div>
                </section>

                {/* 2. PC 管理与诊断权限 */}
                <section className="px-6 py-5 border-b border-border space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="h-5 w-1 rounded-full bg-primary" />
                      <h4 className="text-body font-medium text-foreground inline-flex items-center gap-1.5">
                        <Monitor className="h-3.5 w-3.5 text-text-secondary" />
                        PC 端 · 管理与诊断权限
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-body-sm text-text-secondary">允许登录 PC 端</span>
                      <Switch
                        checked={cur.pc.allowLogin}
                        disabled={!editable}
                        onCheckedChange={setPcAllow}
                      />
                    </div>
                  </div>

                  {cur.pc.allowLogin ? (
                    <div className="rounded-md border border-border bg-card overflow-hidden flex">
                      {/* 左：一级菜单 */}
                      <div className="w-[200px] shrink-0 border-r border-border bg-surface-subtle/40 py-1">
                        {navSpec.map((g) => {
                          const gp = cur.pc.nav[g.key];
                          if (!gp) return null;
                          const locked = !!g.required;
                          const flags: boolean[] = [
                            ...Object.values(gp.actions),
                            ...Object.values(gp.leaves).flatMap((lp) => [
                              lp.view,
                              ...Object.values(lp.actions),
                            ]),
                          ];
                          const allOn = gp.view && flags.every(Boolean);
                          const someOn = gp.view || flags.some(Boolean);
                          const groupState: boolean | "indeterminate" = locked
                            ? true
                            : allOn
                              ? true
                              : someOn
                                ? "indeterminate"
                                : false;
                          const active = navActive === g.key;
                          return (
                            <div
                              key={g.key}
                              onClick={() => setNavActive(g.key)}
                              className={`flex items-center gap-2 px-3 py-2 cursor-pointer border-l-2 transition-colors ${
                                active
                                  ? "border-primary bg-card"
                                  : "border-transparent hover:bg-card/70"
                              }`}
                            >
                              <Checkbox
                                checked={groupState}
                                disabled={!editable || locked}
                                onCheckedChange={(v) => !locked && setGroupView(g.key, !!v)}
                                onClick={(e) => e.stopPropagation()}
                                className="h-[16px] w-[16px]"
                              />
                              <span
                                className={`text-body-sm truncate ${
                                  active ? "text-primary font-medium" : "text-foreground"
                                }`}
                              >
                                {g.name}
                              </span>
                              {locked && (
                                <span className="ml-auto text-caption text-primary">必选</span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* 右：当前一级菜单的详情 */}
                      <div className="flex-1 min-w-0 p-3">
                        {navSpec
                          .filter((g) => g.key === navActive)
                          .map((g) => {
                            const gp = cur.pc.nav[g.key];
                            if (!gp) return null;
                            return (
                              <div key={g.key} className="space-y-3">
                                <p className="text-caption text-text-tertiary">{g.desc}</p>

                                {/* 首页：4 类视角（单选） */}
                                {g.kind === "home" && (
                                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
                                    {workbenchViews.map((v) => {
                                      const active = cur.pc.workbenchView === v.key;
                                      return (
                                        <button
                                          key={v.key}
                                          type="button"
                                          disabled={!editable}
                                          onClick={() => setWorkbenchView(v.key)}
                                          className={`flex items-start gap-2 rounded-md border px-3 py-2 text-left transition-colors ${
                                            active
                                              ? "border-primary bg-primary/5"
                                              : "border-border bg-card hover:bg-surface-subtle"
                                          }`}
                                        >
                                          <span
                                            className={`mt-0.5 h-[14px] w-[14px] shrink-0 rounded-full border ${
                                              active
                                                ? "border-primary bg-primary shadow-[inset_0_0_0_2px_var(--card)]"
                                                : "border-border bg-card"
                                            }`}
                                          />
                                          <span className="min-w-0">
                                            <span
                                              className={`block text-body-sm ${
                                                active ? "text-primary font-medium" : "text-foreground"
                                              }`}
                                            >
                                              {v.name}
                                            </span>
                                            <span className="block text-caption text-text-tertiary">
                                              {v.desc}
                                            </span>
                                          </span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}

                                {/* 一级菜单自身的操作能力 */}
                                {!!g.actions?.length && (
                                  <div className="flex flex-wrap gap-x-5 gap-y-2">
                                    <label
                                      className={`inline-flex items-center gap-2 ${
                                        editable ? "cursor-pointer" : "cursor-default"
                                      }`}
                                    >
                                      <Checkbox
                                        checked={gp.view}
                                        disabled={!editable}
                                        onCheckedChange={(v) => setGroupView(g.key, !!v)}
                                        className="h-[16px] w-[16px]"
                                      />
                                      <span className="text-body-sm text-text-secondary">查看</span>
                                    </label>
                                    {g.actions.map((act) => (
                                      <label
                                        key={act.key}
                                        className={`inline-flex items-center gap-2 ${
                                          editable ? "cursor-pointer" : "cursor-default"
                                        }`}
                                      >
                                        <Checkbox
                                          checked={gp.actions[act.key]}
                                          disabled={!editable}
                                          onCheckedChange={(v) => setGroupAction(g.key, act.key, !!v)}
                                          className="h-[16px] w-[16px]"
                                        />
                                        <span className="text-body-sm text-text-secondary">
                                          {act.name}
                                        </span>
                                      </label>
                                    ))}
                                  </div>
                                )}

                                {/* 二级节点：左右两列排布 */}
                                {!!g.children?.length && (
                                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
                                    {g.children.map((leaf) => {
                                      const lp = gp.leaves[leaf.key];
                                      if (!lp) return null;
                                      const acts = leaf.actions ?? [];
                                      const lFlags = Object.values(lp.actions);
                                      const lState: boolean | "indeterminate" =
                                        lp.view && lFlags.every(Boolean)
                                          ? true
                                          : lp.view || lFlags.some(Boolean)
                                            ? acts.length
                                              ? "indeterminate"
                                              : true
                                            : false;
                                      return (
                                        <div
                                          key={leaf.key}
                                          className="rounded-md border border-border bg-card px-3 py-2"
                                        >
                                          <div className="flex items-center gap-2">
                                            <Checkbox
                                              checked={lState}
                                              disabled={!editable}
                                              onCheckedChange={(v) => setLeafView(g.key, leaf.key, !!v)}
                                              className="h-[16px] w-[16px]"
                                            />
                                            <span className="text-body-sm text-foreground">
                                              {leaf.name}
                                            </span>
                                            {!acts.length && (
                                              <span className="text-caption text-text-tertiary">
                                                可查看
                                              </span>
                                            )}
                                          </div>
                                          {!!acts.length && (
                                            <div className="mt-2 pl-6 flex flex-wrap gap-x-4 gap-y-1.5">
                                              <label
                                                className={`inline-flex items-center gap-1.5 ${
                                                  editable ? "cursor-pointer" : "cursor-default"
                                                }`}
                                              >
                                                <Checkbox
                                                  checked={lp.view}
                                                  disabled={!editable}
                                                  onCheckedChange={(v) =>
                                                    setLeafView(g.key, leaf.key, !!v)
                                                  }
                                                  className="h-[14px] w-[14px]"
                                                />
                                                <span className="text-caption text-text-secondary">
                                                  查看
                                                </span>
                                              </label>
                                              {acts.map((act) => (
                                                <label
                                                  key={act.key}
                                                  className={`inline-flex items-center gap-1.5 ${
                                                    editable ? "cursor-pointer" : "cursor-default"
                                                  }`}
                                                >
                                                  <Checkbox
                                                    checked={lp.actions[act.key]}
                                                    disabled={!editable}
                                                    onCheckedChange={(v) =>
                                                      setLeafAction(g.key, leaf.key, act.key, !!v)
                                                    }
                                                    className="h-[14px] w-[14px]"
                                                  />
                                                  <span className="text-caption text-text-secondary">
                                                    {act.name}
                                                  </span>
                                                </label>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-md border border-dashed border-border bg-surface-subtle px-4 py-6 text-center text-body-sm text-text-tertiary">
                      已关闭 PC 端登录权限
                    </div>
                  )}


                </section>

                {/* 3. 小程序现场能力 */}
                <section className="px-6 py-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-1 rounded-full bg-primary" />
                    <h4 className="text-body font-medium text-foreground inline-flex items-center gap-1.5">
                      <Smartphone className="h-3.5 w-3.5 text-text-secondary" />
                      小程序 · 现场能力
                    </h4>
                  </div>
                  <p className="text-caption text-text-tertiary flex items-start gap-1.5 -mt-1">
                    <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    请按模块配置功能权限；涉及工单任务的功能可进一步限定可选范围。
                  </p>

                  <div className="rounded-md border border-border bg-card overflow-hidden flex">
                    {/* 左：模块 */}
                    <div className="w-[200px] shrink-0 border-r border-border bg-surface-subtle/40 py-1">
                      {editable ? (
                        <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
                          <Checkbox
                            checked={
                              miniSpec.every((m) => m.funcs.every((f) => cur.mini[m.key][f.key].on))
                                ? true
                                : miniSpec.some((m) => m.funcs.some((f) => cur.mini[m.key][f.key].on))
                                  ? "indeterminate"
                                  : false
                            }
                            onCheckedChange={(v) => setMiniAll(!!v)}
                            className="h-[16px] w-[16px]"
                            aria-label="全选"
                          />
                          <span className="text-caption text-text-tertiary">全选模块</span>
                        </div>
                      ) : null}
                      {miniSpec.map((m) => {
                        const fs = cur.mini[m.key];
                        const rowAll = m.funcs.every((f) => fs[f.key].on);
                        const rowAny = m.funcs.some((f) => fs[f.key].on);
                        const active = miniActive === m.key;
                        return (
                          <div
                            key={m.key}
                            onClick={() => setMiniActive(m.key)}
                            className={`flex items-center gap-2 px-3 py-2 cursor-pointer border-l-2 transition-colors ${
                              active ? "border-primary bg-card" : "border-transparent hover:bg-card/70"
                            }`}
                          >
                            <Checkbox
                              checked={rowAll ? true : rowAny ? "indeterminate" : false}
                              disabled={!editable}
                              onCheckedChange={(v) => setMiniModule(m.key, !!v)}
                              onClick={(e) => e.stopPropagation()}
                              className="h-[16px] w-[16px]"
                              aria-label={`整行：${m.name}`}
                            />
                            <span
                              className={`text-body-sm truncate ${
                                active ? "text-primary font-medium" : "text-foreground"
                              }`}
                            >
                              {m.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* 右：功能权限 */}
                    <div className="flex-1 min-w-0 p-3 flex flex-col">
                      {miniSpec
                        .filter((m) => m.key === miniActive)
                        .map((m) => {
                          const fs = cur.mini[m.key];
                          return (
                            <div key={m.key} className="flex flex-col flex-1 min-h-0">
                              <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-5 gap-y-2">
                                {m.funcs.map((f) => (
                                  <div key={f.key} className="flex flex-col gap-1.5">
                                    <label
                                      className={`inline-flex items-center gap-2 ${
                                        editable ? "cursor-pointer" : ""
                                      }`}
                                    >
                                      <Checkbox
                                        checked={fs[f.key].on}
                                        disabled={!editable}
                                        onCheckedChange={(v) => setMiniFunc(m.key, f.key, !!v)}
                                        className="h-[16px] w-[16px]"
                                      />
                                      <span className="text-body-sm text-text-secondary">{f.name}</span>
                                    </label>
                                    {f.views && fs[f.key].on ? (
                                      <div className="ml-6 flex items-center gap-4">
                                        {f.views.map((v) => (
                                          <label
                                            key={v.key}
                                            className={`inline-flex items-center gap-1.5 ${
                                              editable ? "cursor-pointer" : ""
                                            }`}
                                          >
                                            <input
                                              type="radio"
                                              name={`mini-view-${m.key}-${f.key}`}
                                              className="h-[14px] w-[14px] accent-primary"
                                              disabled={!editable}
                                              checked={(fs[f.key].view ?? f.views![0]!.key) === v.key}
                                              onChange={() => setMiniView(m.key, f.key, v.key)}
                                            />
                                            <span className="text-caption text-text-tertiary">{v.name}</span>
                                          </label>
                                        ))}
                                      </div>
                                    ) : null}
                                  </div>
                                ))}
                              </div>
                              {m.key === "workorder" ? (
                                <div className="mt-auto whitespace-nowrap pt-4 text-right text-caption text-text-tertiary">
                                  可查看、操作的工单范围仅限于：开放的工单类型
                                </div>
                              ) : m.key === "task" ? (
                                <div className="mt-auto whitespace-nowrap pt-4 text-right text-caption text-text-tertiary">
                                  可查看、操作的任务范围仅限于：开放的工单类型
                                </div>
                              ) : null}

                            </div>
                          );
                        })}

                    </div>

                  </div>

                  {/* 通用范围：工单类型 / 基础事件类型，全局仅需选择一次 */}
                  <div className="grid grid-cols-1 gap-3">
                    {(["wo"] as MiniScope[]).map((kind) => {
                      const opts = scopeOptions(kind);
                      const sel = globalScope(kind);
                      return (
                        <div key={kind} className="rounded-md border border-border bg-card px-3 py-2.5">
                          <div className="text-caption text-text-tertiary mb-2">
                            {scopeLabel(kind)}
                            <span className="ml-1">
                              （已选 {sel.length}/{opts.length}）
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {opts.map((t) => {
                              const on = sel.includes(t);
                              return (
                                <button
                                  key={t}
                                  type="button"
                                  disabled={!editable}
                                  onClick={() => toggleGlobalScope(kind, t)}
                                  className={`px-2 py-0.5 rounded-md border text-caption transition-colors ${
                                    on
                                      ? "border-primary text-primary bg-primary/5"
                                      : "border-border text-text-tertiary bg-card"
                                  } ${editable ? "cursor-pointer" : "cursor-default"}`}
                                >
                                  {t}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>




                </section>
              </>
            )}
          </div>

          {editable && (
            <SheetFooter className="px-6 py-3 border-t border-border bg-card">
              <Button
                variant="outline"
                className="h-9 text-body-sm font-normal"
                onClick={closeDrawer}
              >
                取消
              </Button>
              <Button
                className="h-9 text-body-sm font-normal bg-primary hover:bg-[var(--brand-hover)] text-primary-foreground"
                onClick={() => {
                  if (activeRole && !activeRole.name.trim()) {
                    toast.error("请输入角色名称");
                    return;
                  }
                  if (draftRoleKey === drawerRole) {
                    if (activeRole && !activeRole.desc.trim()) {
                      updateActiveRole({ desc: "自定义角色" });
                    }
                    setDraftRoleKey(null);
                    toast.success("角色创建成功");
                  } else {
                    toast.success("已保存变更");
                  }
                  setDrawerRole(null);
                }}
              >
                保存
              </Button>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>


      {/* Enable / Disable confirm */}
      <AlertDialog
        open={confirmAction?.kind === "toggle"}
        onOpenChange={(v) => !v && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              确认{confirmAction?.kind === "toggle" && confirmAction.role.enabled ? "停用" : "启用"}该角色？
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.kind === "toggle" && confirmAction.role.enabled
                ? `停用后，「${confirmAction.role.name}」名下的 ${confirmAction.role.count} 名成员将无法继续使用对应权限。`
                : confirmAction?.kind === "toggle"
                ? `启用后，「${confirmAction.role.name}」名下成员将恢复对应权限。`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmToggle}
              className="bg-primary hover:bg-[var(--brand-hover)] text-primary-foreground"
            >
              确认
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirm */}
      <AlertDialog
        open={confirmAction?.kind === "delete"}
        onOpenChange={(v) => !v && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除该角色？</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.kind === "delete"
                ? `删除「${confirmAction.role.name}」后将无法恢复，名下 ${confirmAction.role.count} 名成员需重新分配角色。`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 批量执行任务提示 */}
      <AlertDialog open={batchNoticeOpen} onOpenChange={setBatchNoticeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>批量执行说明</AlertDialogTitle>
            <AlertDialogDescription>
              仅免疫、驱虫类型工单，基础事件任务允许批量执行
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setBatchNoticeOpen(false)}>
              知道了
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
