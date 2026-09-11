import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Beef, Upload } from "lucide-react";
import { useState } from "react";
import { CattleProfileDrawer, type CattleProfile } from "@/components/cattle-profile-drawer";
import { ImportExamResultsDialog } from "@/components/import-exam-results-dialog";
import { ListPage, type ListColumn } from "@/components/list-page";

export const Route = createFileRoute("/archive/cattle")({
  head: () => ({ meta: [{ title: "牛只信息 — 奇点智牧" }] }),
  component: CattlePage,
});

type Health = "健康" | "观察中" | "治疗中" | "死淘";
type Cow = {
  id: string;
  ear: string;
  breed: string;
  sex: string;
  birth: string;
  farm: string;
  barn: string;
  type: string;
  parity: number;
  health: Health;
};
const cattle: Cow[] = [
  { id: "C-2381", ear: "01-24-2381", breed: "荷斯坦", sex: "♀", birth: "2022-03-15", farm: "1 号牧场", barn: "3 号牛舍", type: "泌乳牛", parity: 3, health: "治疗中" },
  { id: "C-2380", ear: "01-24-2380", breed: "荷斯坦", sex: "♀", birth: "2021-11-08", farm: "1 号牧场", barn: "1 号牛舍", type: "干奶牛", parity: 4, health: "健康" },
  { id: "C-2379", ear: "01-24-2379", breed: "荷斯坦", sex: "♀", birth: "2023-06-20", farm: "1 号牧场", barn: "犊牛舍 A", type: "犊牛", parity: 0, health: "健康" },
  { id: "C-2378", ear: "01-24-2378", breed: "西门塔尔", sex: "♂", birth: "2022-09-10", farm: "2 号牧场", barn: "2 号牛舍", type: "育成牛", parity: 0, health: "观察中" },
  { id: "C-2377", ear: "01-24-2377", breed: "荷斯坦", sex: "♀", birth: "2020-05-12", farm: "1 号牧场", barn: "3 号牛舍", type: "泌乳牛", parity: 5, health: "健康" },
];


function healthTag(h: Health) {
  return h === "健康"
    ? "tag tag-success"
    : h === "观察中"
      ? "tag tag-warning"
      : h === "死淘"
        ? "tag tag-muted"
        : h === "治疗中"
          ? "tag tag-info"
          : "tag tag-danger";
}


function ageLabelOf(birth: string) {
  const days = Math.max(1, Math.round((Date.now() - new Date(birth).getTime()) / 86400000));
  if (days >= 730) return `${(days / 365).toFixed(1)} 岁`;
  if (days > 90) return `${Math.floor(days / 30)} 月龄`;
  return `${days} 日龄`;
}


const healthToProfile: Record<Health, CattleProfile["health"]> = {
  健康: "健康",
  观察中: "观察中",
  治疗中: "治疗中",
  死淘: "死淘",
};

function withdrawalUntilOf(days: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toProfile(c: Cow): CattleProfile {

  const ageDays = Math.max(1, Math.round((Date.now() - new Date(c.birth).getTime()) / 86400000));
  return {
    ear: c.ear,
    farm: c.farm,
    barn: c.barn,
    breed: c.breed,
    sex: c.sex === "♀" ? "母" : "公",
    type: c.type,
    ageDays,
    health: healthToProfile[c.health],
    withdrawalDays: c.health === "治疗中" ? 3 : c.health === "观察中" ? 5 : 0,
    withdrawalUntil: withdrawalUntilOf(c.health === "治疗中" ? 3 : c.health === "观察中" ? 5 : 0),

    lactationDays: c.sex === "♀" ? 168 : 0,
    pregnancyDays: c.health === "健康" && c.sex === "♀" ? 92 : 0,
    parity: c.parity,
  };
}

/** 基础信息（繁育 / 血统）派生字段，与档案抽屉保持同一套 mock 规则 */
function baseInfoOf(c: Cow) {
  const p = toProfile(c);
  const seed = Number(c.ear.replace(/\D/g, "").slice(-4) || 0);
  const pick = (n: number, mod: number, base = 0) => base + ((seed + n) % mod);
  const dateAgo = (days: number) => {
    const d = new Date(Date.now() - days * 86400000);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const female = c.sex === "♀";
  const lactating = female && p.lactationDays > 0;
  const bred = female && p.pregnancyDays > 0;
  const farmNo = c.ear.slice(0, 2);
  return {
    lactationDays: lactating ? `${p.lactationDays} 天` : "—",
    pregnancyDays: bred ? `${p.pregnancyDays} 天` : "—",
    dryOffDate: c.parity > 0 ? dateAgo((p.lactationDays || 200) + 60) : "—",
    breedCount: female ? `${1 + pick(6, 4)} 次` : "—",
    lastBreedDate: bred ? dateAgo(p.pregnancyDays) : "—",
    lastTransitionDate: c.parity > 0 ? dateAgo((p.lactationDays || 200) + 21) : "—",
    lastAbortionDate: female && pick(7, 4) === 0 ? dateAgo(pick(9, 300, 60)) : "—",
    damEar: `${farmNo}-${18 + pick(2, 5)}-${String(pick(3, 9999)).padStart(4, "0")}`,
    sireEar: `USA-${1000000 + pick(4, 900000)}`,
    birthWeight: `${(38 + pick(1, 8)).toFixed(0)} kg`,
    origin: pick(5, 3) === 0 ? "本场出生" : pick(5, 3) === 1 ? "外购引进" : "牧场调入",
  };
}

function CattlePage() {
  const [current, setCurrent] = useState<CattleProfile | null>(null);
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const openProfile = (c: Cow) => {
    setCurrent(toProfile(c));
    setOpen(true);
  };

  const columns: ListColumn<Cow>[] = [
    {
      key: "ear",
      label: "耳号",
      required: true,
      width: "10em",
      value: (c) => c.ear,
      render: (c) => (
        <span className="flex items-center gap-1.5 text-body text-foreground truncate">
          <Beef className="h-3.5 w-3.5 text-primary shrink-0" />
          {c.ear}
        </span>
      ),
    },
    { key: "breed", label: "品种", filter: "select", value: (c) => c.breed },
    { key: "age", label: "月龄", filter: "none", value: (c) => monthAgeOf(c.birth) },
    { key: "type", label: "类型", filter: "select", value: (c) => c.type },
    { key: "parity", label: "胎次", filter: "number", value: (c) => c.parity, render: (c) => (c.parity > 0 ? `${c.parity} 胎` : "-") },
    { key: "barn", label: "所在牛舍", filter: "select", value: (c) => c.barn },
    {
      key: "health",
      label: "当前状态",
      filter: "select",
      value: (c) => c.health,
      render: (c) => <span className={healthTag(c.health)}>{c.health}</span>,
    },
    // ---- 基础信息字段（默认隐藏，可在列设置中开启）----
    { key: "sex", label: "性别", filter: "select", defaultHidden: true, value: (c) => (c.sex === "♀" ? "母" : "公") },
    { key: "farm", label: "所属牧场", filter: "select", defaultHidden: true, value: (c) => c.farm },
    { key: "birth", label: "出生日期", filter: "date", date: true, defaultHidden: true, width: "8em", value: (c) => c.birth },
    { key: "lactationDays", label: "泌乳天数", filter: "none", defaultHidden: true, value: (c) => baseInfoOf(c).lactationDays },
    { key: "pregnancyDays", label: "怀孕天数", filter: "none", defaultHidden: true, value: (c) => baseInfoOf(c).pregnancyDays },
    { date: true, key: "dryOffDate", label: "干奶日期", filter: "date", defaultHidden: true, width: "8em", value: (c) => baseInfoOf(c).dryOffDate },
    { key: "breedCount", label: "配次", filter: "none", defaultHidden: true, value: (c) => baseInfoOf(c).breedCount },
    { date: true, key: "lastBreedDate", label: "最近配种日期", filter: "date", defaultHidden: true, width: "8em", value: (c) => baseInfoOf(c).lastBreedDate },
    { date: true, key: "lastTransitionDate", label: "最近围产日期", filter: "date", defaultHidden: true, width: "8em", value: (c) => baseInfoOf(c).lastTransitionDate },
    { date: true, key: "lastAbortionDate", label: "最近流产日期", filter: "date", defaultHidden: true, width: "8em", value: (c) => baseInfoOf(c).lastAbortionDate },
    { key: "damEar", label: "母号", defaultHidden: true, width: "9em", value: (c) => baseInfoOf(c).damEar },
    { key: "sireEar", label: "父号", defaultHidden: true, width: "9em", value: (c) => baseInfoOf(c).sireEar },
    { key: "birthWeight", label: "出生体重", filter: "none", defaultHidden: true, value: (c) => baseInfoOf(c).birthWeight },
    { key: "origin", label: "入群来源", filter: "select", defaultHidden: true, value: (c) => baseInfoOf(c).origin },
  ];

  return (
    <>
      <ListPage<Cow>
        title="牛只信息"
        breadcrumb={["基础档案", "牛只信息"]}
        rows={cattle}
        columns={columns}
        searchKeys={["ear", "barn"]}
        searchPlaceholder="搜索耳号 / 牛舍"
        getRowKey={(c) => c.id}
        actionsWidth={120}
        secondaryActions={
          <Button variant="outline" size="sm" className="h-9 gap-1.5 text-body-sm font-normal" onClick={() => setImportOpen(true)}>
            <Upload className="h-3.5 w-3.5" /> 导入检测结果
          </Button>
        }
        rowActions={(c) => (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-body-sm font-normal text-text-secondary hover:bg-surface-subtle hover:text-foreground"
            onClick={() => openProfile(c)}
          >
            查看
          </Button>
        )}
      />
      <CattleProfileDrawer open={open} onOpenChange={setOpen} cow={current} />
      <ImportExamResultsDialog open={importOpen} onOpenChange={setImportOpen} />
    </>
  );
}
