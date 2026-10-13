import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  Users,
  MapPin,
  Phone,
  UserPlus,
  MoreHorizontal,
  Filter,
  Warehouse,
} from "lucide-react";

export const Route = createFileRoute("/organization/")({
  head: () => ({
    meta: [
      { title: "架构管理 — 奇点智牧" },
      { name: "description", content: "组织概览与人员账号集中管理" },
    ],
  }),
  component: OrganizationPage,
});

type AccountStatus = "正常" | "已冻结";

type Person = {
  name: string;
  role: string;
  dept: string;
  phone: string;
  status: AccountStatus;
};

type Farm = {
  id: string;
  code: string;
  name: string;
  leader: string;
  phone: string;
  address: string;
  founded: string;
  herd: number;
  staff: number;
  status: "启用" | "停用";
  departments: string[];
  people: Person[];
};

const group = { code: "GRP-001", name: "奇点牧业集团" };

const initialFarms: Farm[] = [
  {
    id: "ORG-101",
    code: "ORG-101",
    name: "1 号牧场",
    leader: "张磊",
    phone: "138****2381",
    address: "内蒙古 · 锡林郭勒盟 · 牧场路 1 号",
    founded: "2018-04",
    herd: 1024,
    staff: 48,
    status: "启用",
    departments: ["兽医部", "饲养部", "挤奶车间", "运维支持"],
    people: [
      { name: "张磊", role: "场长", dept: "兽医部", phone: "138****2381", status: "正常" },
      { name: "李雨晴", role: "兽医", dept: "兽医部", phone: "139****9210", status: "正常" },
      { name: "王建国", role: "场长", dept: "饲养部", phone: "137****1102", status: "正常" },
      { name: "周凯", role: "兽医助理", dept: "兽医部", phone: "135****8821", status: "正常" },
      { name: "刘倩", role: "兽医助理", dept: "挤奶车间", phone: "186****3344", status: "正常" },
      { name: "陈思琪", role: "超级管理员", dept: "运维支持", phone: "186****4421", status: "已冻结" },
    ],
  },
  {
    id: "ORG-102",
    code: "ORG-102",
    name: "2 号牧场",
    leader: "高建波",
    phone: "139****1102",
    address: "内蒙古 · 锡林郭勒盟 · 牧场路 12 号",
    founded: "2020-06",
    herd: 762,
    staff: 32,
    status: "启用",
    departments: ["兽医部", "饲养部", "挤奶车间"],
    people: [
      { name: "高建波", role: "场长", dept: "兽医部", phone: "139****1102", status: "正常" },
      { name: "孙明", role: "兽医", dept: "饲养部", phone: "135****1923", status: "正常" },
      { name: "赵岩", role: "兽医助理", dept: "挤奶车间", phone: "139****7710", status: "正常" },
    ],
  },
  {
    id: "ORG-103",
    code: "ORG-103",
    name: "3 号牧场",
    leader: "周凯",
    phone: "135****8821",
    address: "内蒙古 · 通辽 · 草原路 8 号",
    founded: "2022-03",
    herd: 480,
    staff: 28,
    status: "启用",
    departments: ["管理处", "饲养部"],
    people: [
      { name: "周凯", role: "场长", dept: "管理处", phone: "135****8821", status: "正常" },
      { name: "杨帆", role: "兽医助理", dept: "饲养部", phone: "186****6612", status: "正常" },
    ],
  },
  {
    id: "ORG-104",
    code: "ORG-104",
    name: "西部育成基地",
    leader: "孙明",
    phone: "135****1923",
    address: "甘肃 · 张掖 · 育成基地",
    founded: "2023-09",
    herd: 220,
    staff: 22,
    status: "启用",
    departments: ["管理处"],
    people: [
      { name: "孙明", role: "场长", dept: "管理处", phone: "135****1923", status: "正常" },
    ],
  },
];

const ROLES = ["超级管理员", "场长", "兽医", "兽医助理"];

function OrganizationPage() {
  const [farms, setFarms] = useState<Farm[]>(initialFarms);
  const [selectedId, setSelectedId] = useState<string>(initialFarms[0].id);
  const [groupOpen, setGroupOpen] = useState(true);
  const [newDept, setNewDept] = useState("");
  const [deptDetail, setDeptDetail] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ index: number; person: Person } | null>(null);

  const farm = farms.find((f) => f.id === selectedId)!;

  const updateFarm = (id: string, patch: Partial<Farm>) =>
    setFarms((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  const addDept = () => {
    const v = newDept.trim();
    if (!v || farm.departments.includes(v)) return;
    updateFarm(farm.id, { departments: [...farm.departments, v] });
    setNewDept("");
  };

  const removeDept = (d: string) => {
    updateFarm(farm.id, { departments: farm.departments.filter((x) => x !== d) });
  };

  const savePerson = () => {
    if (!editing) return;
    const next = farm.people.map((p, i) => (i === editing.index ? editing.person : p));
    updateFarm(farm.id, { people: next });
    setEditing(null);
  };

  return (
    <>
      <AppHeader title="架构管理" breadcrumb={["组织与人员", "架构管理"]} />
      <main className="flex-1 px-6 py-6">
        <div className="grid grid-cols-12 gap-4">
          {/* Left: org overview */}
          <Card className="col-span-12 lg:col-span-3 border-border bg-card p-4 h-fit">
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-card-title text-foreground">组织概览</h3>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-text-tertiary hover:text-primary hover:bg-brand-subtle">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="relative mb-3">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary" />
              <Input placeholder="搜索组织" className="h-8 pl-8 text-body-sm bg-card border-border" />
            </div>

            <div className="space-y-0.5">
              <div className="group flex items-center gap-1 py-1.5 px-1 rounded-md hover:bg-surface-subtle">
                <button
                  onClick={() => setGroupOpen((o) => !o)}
                  className="h-4 w-4 inline-flex items-center justify-center text-text-tertiary"
                >
                  {groupOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                </button>
                <Building2 className="h-3.5 w-3.5 text-text-secondary" strokeWidth={1.75} />
                <span className="flex-1 text-body text-foreground font-medium truncate">{group.name}</span>
                <span className="tag tag-muted">租户</span>
                <button className="opacity-0 group-hover:opacity-100 h-5 w-5 inline-flex items-center justify-center rounded text-text-tertiary hover:text-primary hover:bg-brand-subtle transition-opacity" title="新增牧场">
                  <Plus className="h-3 w-3" />
                </button>
              </div>

              {groupOpen && (
                <div className="ml-4 border-l border-border pl-2 space-y-0.5">
                  {farms.map((f) => {
                    const active = selectedId === f.id;
                    return (
                      <button
                        key={f.id}
                        onClick={() => setSelectedId(f.id)}
                        className={`group/item w-full flex items-center gap-2 py-1.5 pl-2 pr-1 rounded-md text-left relative ${
                          active
                            ? "bg-brand-subtle text-primary font-medium before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[2px] before:bg-primary before:rounded-r"
                            : "hover:bg-surface-subtle text-text-secondary"
                        }`}
                      >
                        <Warehouse className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                        <span className="flex-1 text-body-sm truncate">{f.name}</span>
                        <span className="text-caption opacity-70 tabular-nums">{f.staff}</span>
                      </button>
                    );
                  })}
                  <button className="w-full flex items-center gap-2 py-1.5 pl-2 pr-1 rounded-md text-body-sm text-text-tertiary hover:bg-surface-subtle hover:text-primary">
                    <Plus className="h-3.5 w-3.5" />
                    新增牧场
                  </button>
                </div>
              )}
            </div>
          </Card>

          {/* Right */}
          <div className="col-span-12 lg:col-span-9 space-y-4">
            {/* Farm basic info */}
            <Card className="border-border bg-card p-6">
              <div className="flex items-start justify-between mb-5 gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-md bg-brand-subtle flex items-center justify-center">
                    <Warehouse className="h-5 w-5 text-primary" strokeWidth={1.75} />
                  </div>
                  <div className="leading-tight">
                    <div className="flex items-center gap-2">
                      <span className="text-section-title text-foreground">{farm.name}</span>
                      <span className={`tag ${farm.status === "启用" ? "tag-success" : "tag-muted"}`}>{farm.status}</span>
                      <span className="tag tag-brand">经营主体</span>
                    </div>
                    <div className="text-caption text-text-tertiary mt-0.5 font-mono">{farm.code} · 隶属 {group.name}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-9 text-body-sm font-normal">编辑信息</Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "负责人", value: farm.leader, icon: Users },
                  { label: "联系方式", value: farm.phone, icon: Phone, mono: true },
                  { label: "成立时间", value: farm.founded, icon: Building2 },
                  { label: "地址", value: farm.address, icon: MapPin },
                ].map((c) => (
                  <div key={c.label} className="leading-tight">
                    <div className="flex items-center gap-1 text-caption text-text-tertiary mb-1">
                      <c.icon className="h-3 w-3" />
                      {c.label}
                    </div>
                    <div className={`text-body text-foreground ${c.mono ? "font-mono" : ""}`}>{c.value}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-5 border-t border-border">
                <div>
                  <div className="text-caption text-text-tertiary">在册人员</div>
                  <div className="text-section-title tabular-nums text-foreground">{farm.staff}</div>
                </div>
                <div>
                  <div className="text-caption text-text-tertiary">存栏量</div>
                  <div className="text-section-title tabular-nums text-foreground">
                    {farm.herd.toLocaleString()} <span className="text-body-sm text-text-tertiary font-normal">头</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Departments overview */}
            <Card className="border-border bg-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-card-title text-foreground">部门概览</h3>
                  <p className="text-caption text-text-tertiary mt-0.5">共 {farm.departments.length} 个部门</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {farm.departments.map((d) => {
                  const count = farm.people.filter((p) => p.dept === d).length;
                  return (
                    <div
                      key={d}
                      className="group inline-flex items-center gap-2 h-8 pl-3 pr-1.5 rounded-md border border-border bg-surface-subtle hover:border-primary/40 transition-colors"
                    >
                      <Building2 className="h-3.5 w-3.5 text-text-tertiary" strokeWidth={1.75} />
                      <span className="text-body-sm text-foreground">{d}</span>
                      <span className="text-caption text-text-tertiary tabular-nums">{count}</span>
                      <button
                        onClick={() => setDeptDetail(d)}
                        className="h-5 w-5 inline-flex items-center justify-center rounded text-text-tertiary hover:text-primary hover:bg-brand-subtle transition-colors"
                        title="部门详情"
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
                <div className="inline-flex items-center gap-1 h-8 rounded-md border border-dashed border-border px-2">
                  <Input
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addDept()}
                    placeholder="新增部门"
                    className="h-6 w-28 text-body-sm border-0 shadow-none p-0 focus-visible:ring-0 bg-transparent"
                  />
                  <button
                    onClick={addDept}
                    className="h-5 w-5 inline-flex items-center justify-center rounded text-text-tertiary hover:text-primary hover:bg-brand-subtle"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </Card>

            {/* People list */}
            <Card className="border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between p-6 pb-4 flex-wrap gap-3">
                <div>
                  <h3 className="text-card-title text-foreground">人员账号</h3>
                  <p className="text-caption text-text-tertiary mt-0.5">
                    共 {farm.people.length} 人 · 正常 {farm.people.filter((p) => p.status === "正常").length} 人
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary" />
                    <Input placeholder="搜索人员、角色、手机号" className="h-9 w-64 pl-9 text-body-sm bg-card border-border" />
                  </div>
                  <Button variant="outline" size="sm" className="h-9 gap-1.5 text-body-sm font-normal">
                    <Filter className="h-3.5 w-3.5" /> 筛选
                  </Button>
                  <Button size="sm" className="h-9 gap-1.5 text-body-sm font-normal bg-primary hover:bg-[var(--brand-hover)] text-primary-foreground">
                    <UserPlus className="h-3.5 w-3.5" /> 新增人员
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-4 px-6 h-12 text-table-header text-text-secondary border-y border-border bg-surface-subtle">
                <div className="grid grid-cols-5 gap-4 flex-1 min-w-0">
                  <div>姓名</div>
                  <div>角色</div>
                  <div>部门</div>
                  <div>联系方式</div>
                  <div>账号状态</div>
                </div>
                <div className="w-[140px] text-right shrink-0">操作</div>
              </div>
              {farm.people.map((p, idx) => (
                <div key={p.name + idx} className="flex items-center gap-4 px-6 h-12 text-table-cell border-b border-border last:border-0 hover:bg-surface-subtle transition-colors">
                  <div className="grid grid-cols-5 gap-4 flex-1 min-w-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="bg-brand-subtle text-primary text-body-sm font-medium">
                          {p.name.slice(0, 1)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-body text-foreground truncate">{p.name}</div>
                    </div>
                    <div className="truncate"><span className="tag tag-brand">{p.role}</span></div>
                    <div className="text-body-sm text-text-secondary truncate">{p.dept}</div>
                    <div className="font-mono text-body-sm text-text-tertiary truncate">{p.phone}</div>
                    <div className="truncate">
                      <span className={`tag ${p.status === "正常" ? "tag-success" : "tag-muted"}`}>{p.status}</span>
                    </div>
                  </div>
                  <div className="w-[140px] shrink-0 flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-body-sm font-normal text-text-secondary hover:bg-surface-subtle hover:text-foreground"
                    >
                      查看
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-body-sm font-normal text-primary hover:bg-transparent hover:text-primary/80"
                      onClick={() => setEditing({ index: idx, person: { ...p } })}
                    >
                      编辑
                    </Button>
                  </div>

                </div>
              ))}
            </Card>
          </div>
        </div>
      </main>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>编辑人员账号</DialogTitle>
            <DialogDescription>修改后保存即可生效</DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-body-sm text-text-secondary">姓名</Label>
                <Input
                  value={editing.person.name}
                  onChange={(e) => setEditing({ ...editing, person: { ...editing.person, name: e.target.value } })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-body-sm text-text-secondary">角色</Label>
                <Select
                  value={editing.person.role}
                  onValueChange={(v) => setEditing({ ...editing, person: { ...editing.person, role: v } })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-body-sm text-text-secondary">部门</Label>
                <Select
                  value={editing.person.dept}
                  onValueChange={(v) => setEditing({ ...editing, person: { ...editing.person, dept: v } })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {farm.departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-body-sm text-text-secondary">联系方式</Label>
                <Input
                  value={editing.person.phone}
                  onChange={(e) => setEditing({ ...editing, person: { ...editing.person, phone: e.target.value } })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-body-sm text-text-secondary">账号状态</Label>
                <Select
                  value={editing.person.status}
                  onValueChange={(v: AccountStatus) => setEditing({ ...editing, person: { ...editing.person, status: v } })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="正常">正常</SelectItem>
                    <SelectItem value="已冻结">已冻结</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>取消</Button>
            <Button className="bg-primary hover:bg-[var(--brand-hover)] text-primary-foreground" onClick={savePerson}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deptDetail} onOpenChange={(o) => !o && setDeptDetail(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" strokeWidth={1.75} />
              {deptDetail}
            </DialogTitle>
            <DialogDescription>
              隶属 {farm.name} · 共 {farm.people.filter((p) => p.dept === deptDetail).length} 名成员
            </DialogDescription>
          </DialogHeader>
          {deptDetail && (
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-md border border-border bg-surface-subtle p-3">
                  <div className="text-caption text-text-tertiary">成员数</div>
                  <div className="text-section-title tabular-nums text-foreground">
                    {farm.people.filter((p) => p.dept === deptDetail).length}
                  </div>
                </div>
                <div className="rounded-md border border-border bg-surface-subtle p-3">
                  <div className="text-caption text-text-tertiary">在岗</div>
                  <div className="text-section-title tabular-nums text-foreground">
                    {farm.people.filter((p) => p.dept === deptDetail && p.status === "正常").length}
                  </div>
                </div>
                <div className="rounded-md border border-border bg-surface-subtle p-3">
                  <div className="text-caption text-text-tertiary">已冻结</div>
                  <div className="text-section-title tabular-nums text-foreground">
                    {farm.people.filter((p) => p.dept === deptDetail && p.status === "已冻结").length}
                  </div>
                </div>
              </div>
              <div className="rounded-md border border-border overflow-hidden">
                <div className="grid grid-cols-12 gap-2 px-3 h-9 items-center text-table-header text-text-secondary bg-surface-subtle border-b border-border">
                  <div className="col-span-4">姓名</div>
                  <div className="col-span-4">角色</div>
                  <div className="col-span-4">联系方式</div>
                </div>
                {farm.people.filter((p) => p.dept === deptDetail).length === 0 ? (
                  <div className="px-3 py-6 text-center text-body-sm text-text-tertiary">暂无成员</div>
                ) : (
                  farm.people
                    .filter((p) => p.dept === deptDetail)
                    .map((p, i) => (
                      <div key={p.name + i} className="grid grid-cols-12 gap-2 px-3 h-10 items-center text-body-sm border-b border-border last:border-0">
                        <div className="col-span-4 text-foreground">{p.name}</div>
                        <div className="col-span-4"><span className="tag tag-brand">{p.role}</span></div>
                        <div className="col-span-4 font-mono text-text-tertiary">{p.phone}</div>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              className="text-[var(--state-danger)] hover:text-[var(--state-danger)] hover:bg-[var(--state-danger)]/10 border-border"
              onClick={() => {
                if (deptDetail) {
                  removeDept(deptDetail);
                  setDeptDetail(null);
                }
              }}
            >
              删除部门
            </Button>
            <Button onClick={() => setDeptDetail(null)} className="bg-primary hover:bg-[var(--brand-hover)] text-primary-foreground">
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
