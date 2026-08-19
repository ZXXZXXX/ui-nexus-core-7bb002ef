import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Beef, Plus, Search, SlidersHorizontal, MoreHorizontal, Trash2, FilePlus2, Baby, Stethoscope, ArrowRightLeft, LogOut, Upload } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { CattleProfileDrawer, type CattleProfile } from "@/components/cattle-profile-drawer";
import { ImportExamResultsDialog } from "@/components/import-exam-results-dialog";

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
    withdrawalDays: c.health === "治疗中" ? 3 : 0,
    withdrawalUntil: "2026-08-13",
    lactationDays: c.sex === "♀" ? 168 : 0,
    pregnancyDays: c.health === "健康" && c.sex === "♀" ? 92 : 0,
    parity: c.parity,
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
  return (
    <>
      <AppHeader title="牛只信息" breadcrumb={["基础档案", "牛只信息"]} />
      <main className="flex-1 px-6 py-6 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary" />
              <Input placeholder="搜索耳号 / 编号" className="h-9 w-56 pl-9 text-body-sm" />
            </div>
            <Button variant="outline" size="sm" className="h-9 gap-1.5 text-body-sm font-normal"><SlidersHorizontal className="h-3.5 w-3.5" /> 精细筛选</Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-9 gap-1.5 text-body-sm font-normal" onClick={() => setImportOpen(true)}>
              <Upload className="h-3.5 w-3.5" /> 导入检测结果
            </Button>
            <Button size="sm" className="h-9 gap-1.5 text-body-sm font-normal bg-primary hover:bg-[var(--brand-hover)] text-primary-foreground">
              <Plus className="h-3.5 w-3.5" /> 新增牛只
            </Button>
          </div>
        </div>

        <Card className="border-border bg-card overflow-hidden">
          <div className="flex items-center gap-4 px-6 h-12 text-table-header text-text-secondary border-b border-border bg-surface-subtle">
            <div className="grid grid-cols-7 gap-4 flex-1 min-w-0">
              <div>耳号</div>
              <div>品种</div>
              <div>年龄</div>
              <div>类型</div>
              <div>胎次</div>
              <div>所在牛舍</div>
              <div>当前状态</div>
            </div>
            <div className="w-[170px] text-right shrink-0">操作</div>
          </div>
          {cattle.map((c) => (
            <div key={c.id} className="flex items-center gap-4 px-6 h-12 text-table-cell border-b border-border last:border-0 hover:bg-surface-subtle">
              <div className="grid grid-cols-7 gap-4 flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-body text-foreground truncate"><Beef className="h-3.5 w-3.5 text-primary shrink-0" />{c.ear}</div>
                <div className="text-body-sm text-text-secondary truncate">{c.breed}</div>
                <div className="text-body-sm text-text-secondary tabular-nums truncate">{ageLabelOf(c.birth)}</div>
                <div className="text-body-sm text-text-secondary truncate">{c.type}</div>
                <div className="text-body-sm text-text-secondary tabular-nums truncate">{c.parity > 0 ? `${c.parity} 胎` : "-"}</div>
                <div className="text-body-sm text-text-secondary truncate">{c.barn}</div>
                <div><span className={healthTag(c.health)}>{c.health}</span></div>
              </div>
              <div className="w-[170px] shrink-0 flex items-center justify-end gap-0.5">
                <Button variant="ghost" size="sm" className="h-7 px-2 text-body-sm font-normal text-text-secondary hover:bg-surface-subtle hover:text-foreground" onClick={() => openProfile(c)}>查看</Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-text-secondary hover:bg-surface-subtle hover:text-foreground" aria-label="更多">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <FilePlus2 className="h-3.5 w-3.5 mr-2" /> 记录事件
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-36">
                        <DropdownMenuItem onClick={() => toast.info(`#${c.ear} 产犊记录`)}>
                          <Baby className="h-3.5 w-3.5 mr-2" /> 产犊记录
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.info(`#${c.ear} 基础检查`)}>
                          <Stethoscope className="h-3.5 w-3.5 mr-2" /> 基础检查
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.info(`#${c.ear} 转栏/转群`)}>
                          <ArrowRightLeft className="h-3.5 w-3.5 mr-2" /> 转栏/转群
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.info(`#${c.ear} 离场记录`)}>
                          <LogOut className="h-3.5 w-3.5 mr-2" /> 离场记录
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuItem
                      className="text-[var(--state-danger)] focus:text-[var(--state-danger)]"
                      onClick={() => toast.success(`已删除 #${c.ear} 的档案`)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-2" /> 删除档案
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </Card>
      </main>
      <CattleProfileDrawer open={open} onOpenChange={setOpen} cow={current} />
      <ImportExamResultsDialog open={importOpen} onOpenChange={setImportOpen} />
    </>
  );
}
