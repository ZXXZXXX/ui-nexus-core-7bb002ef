import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
  SheetFooter,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Pencil,
  Trash2,
  X,
  MoreHorizontal,
  FileText,
  Stethoscope,
  Pill,
  Tag,
} from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { StatScopeCard, diseaseStats } from "@/components/stat-scope-card";
import { KB_CATEGORIES, KB_DISEASES, symptomName } from "@/lib/disease-kb";
import { PRESCRIPTION_SEED } from "@/lib/prescription-kb";

function RxSearchSelect({
  selected,
  onAdd,
}: {
  selected: PrescriptionRef[];
  onAdd: (rx: { code: string; name: string }) => void;
}) {
  const [kw, setKw] = useState("");
  const picked = new Set(selected.map((s) => s.code));
  const results = useMemo(() => {
    const q = kw.trim().toLowerCase();
    if (!q) return [];
    return PRESCRIPTION_SEED.filter((r) => r.enabled !== false)
      .filter((r) =>
        `${r.name} ${r.code} ${r.category}`.toLowerCase().includes(q),
      )
      .slice(0, 20);
  }, [kw]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" />
        <Input
          value={kw}
          onChange={(e) => setKw(e.target.value)}
          placeholder="搜索处方名称 / 编号 / 分类，点击添加"
          className="h-8 pl-8 text-body-sm"
        />
      </div>
      {kw.trim() && (
        <div className="rounded-md border border-border divide-y divide-border max-h-56 overflow-auto">
          {results.length === 0 && (
            <div className="px-3 py-2 text-body-sm text-text-tertiary">未找到匹配的处方</div>
          )}
          {results.map((o) => (
            <div key={o.code} className="flex items-center gap-2 px-3 py-2">
              <span className="font-mono text-caption text-text-tertiary w-24 shrink-0">{o.code}</span>
              <span className="flex-1 min-w-0 truncate text-body-sm text-foreground">{o.name}</span>
              <span className="text-caption text-text-tertiary truncate max-w-[96px]">{o.category}</span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-body-sm shrink-0"
                disabled={picked.has(o.code)}
                onClick={() => {
                  onAdd({ code: o.code, name: o.name });
                  setKw("");
                }}
              >
                {picked.has(o.code) ? "已添加" : "添加"}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



export const Route = createFileRoute("/knowledge/disease")({
  head: () => ({ meta: [{ title: "疾病知识库 — 奇点智牧" }] }),
  component: DiseaseKBPage,
});

// ---------- 数据模型 ----------

type DiseaseCategory = { code: string; name: string };
type DiseaseType = { id: string; name: string; seq: string; categoryCode: string };
type SymptomRef = { code: string; name: string; core?: boolean };
type PrescriptionRef = { code: string; name: string; level: "首选" | "备选" | "特殊处方"; defaultRx?: boolean };
type CattleGroup = "泌乳牛" | "青年牛" | "干奶牛" | "围产牛" | "犊牛" | "育成牛";

type Disease = {
  id: string;
  code: string;              // DZ-xxxxxx
  typeId: string;            // 所属疾病类型
  subSeq: string;            // 子类型 3 位序号
  name: string;              // 疾病子类型名称
  alias?: string;            // 英文/缩写
  aliases: string[];         // 别名
  presentation: string;      // 典型表现
  treatable: boolean;        // 是否治疗
  groups: CattleGroup[];     // 适用牛群
  status: "启用" | "停用";
  order?: number;
  remark?: string;
  symptoms: SymptomRef[];
  prescriptions: PrescriptionRef[];
};

const CATEGORIES: DiseaseCategory[] = KB_CATEGORIES.map((c) => ({ code: c.code, name: c.name }));

const TYPES: DiseaseType[] = (() => {
  const map = new Map<string, DiseaseType>();
  KB_DISEASES.forEach((d) => {
    const key = `${d.cat}|${d.type}`;
    if (!map.has(key)) {
      const seq = String(map.size + 1).padStart(3, "0");
      map.set(key, { id: `T-${seq}`, name: d.type, seq, categoryCode: d.cat });
    }
  });
  return [...map.values()];
})();

const GROUP_OPTIONS: CattleGroup[] = ["泌乳牛", "青年牛", "干奶牛", "围产牛", "犊牛", "育成牛"];

const seed: Disease[] = KB_DISEASES.map((d, i) => {
  const type = TYPES.find((t) => t.name === d.type && t.categoryCode === d.cat);
  const rxCodes = [
    ...(d.rx ?? []),
    ...PRESCRIPTION_SEED.filter((r) => r.diseaseCode === d.id).map((r) => r.code),
  ].filter((c, idx, arr) => arr.indexOf(c) === idx);
  return {
    id: d.id.replace("DZ-", "D-"),
    code: d.id,
    typeId: type?.id ?? "T-001",
    subSeq: d.id.slice(-3),
    name: d.name,
    alias: d.abbr,
    aliases: [],
    presentation: `${d.catName} · ${d.type}，常见症状 ${d.symptoms.length} 项，易感牛群：${d.groups.join("、") || "未标注"}。`,
    // 无关联处方 = 不治疗（走放弃治疗兜底）
    treatable: rxCodes.length > 0,
    groups: (d.groups.length ? d.groups : ["泌乳牛"]) as CattleGroup[],
    status: d.status === "启用" ? "启用" : "停用",
    order: i + 1,
    symptoms: d.symptoms.map((code, idx) => ({ code, name: symptomName(code), core: idx < 3 })),
    prescriptions: rxCodes.map((code, idx) => ({
      code,
      name: PRESCRIPTION_SEED.find((r) => r.code === code)?.name ?? code,
      level: (idx === 0 ? "首选" : "备选") as PrescriptionRef["level"],
      defaultRx: idx === 0,
    })),
  } satisfies Disease;
});

// ---------- 工具 ----------

const typeById = (id: string) => TYPES.find((t) => t.id === id);
const categoryByCode = (code: string) => CATEGORIES.find((c) => c.code === code);
const typeLabel = (id: string) => typeById(id)?.name ?? "—";
const categoryOfType = (id: string) => {
  const t = typeById(id);
  return t ? categoryByCode(t.categoryCode) : undefined;
};

function statusTagClass(s: string) {
  return s === "启用" ? "tag-success" : "tag-muted";
}

// ---------- 主页面 ----------

function DiseaseKBPage() {
  const [list, setList] = useState<Disease[]>(seed);
  const [keyword, setKeyword] = useState("");
  const [filterCat, setFilterCat] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Disease | null>(null);
  const [viewing, setViewing] = useState<Disease | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string[] | null>(null);

  const filtered = useMemo(() => {
    return list.filter((d) => {
      const t = typeById(d.typeId);
      if (filterCat !== "all" && t?.categoryCode !== filterCat) return false;
      if (!keyword.trim()) return true;
      const k = keyword.trim().toLowerCase();
      return (
        d.name.toLowerCase().includes(k) ||
        d.code.toLowerCase().includes(k) ||
        (t?.name.toLowerCase().includes(k) ?? false) ||
        d.symptoms.some((s) => s.name.toLowerCase().includes(k))
      );
    });
  }, [list, keyword, filterCat]);

  const allChecked = filtered.length > 0 && filtered.every((d) => selected.has(d.id));
  const someChecked = selected.size > 0 && !allChecked;

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const toggleAll = () =>
    setSelected(allChecked ? new Set() : new Set(filtered.map((d) => d.id)));

  const confirmDelete = () => {
    if (!pendingDelete) return;
    setList((prev) => prev.filter((d) => !pendingDelete.includes(d.id)));
    setSelected((prev) => {
      const next = new Set(prev);
      pendingDelete.forEach((id) => next.delete(id));
      return next;
    });
    toast.success(`已删除 ${pendingDelete.length} 条疾病`);
    setPendingDelete(null);
  };

  const saveEdit = () => {
    if (!editing) return;
    setList((prev) => prev.map((d) => (d.id === editing.id ? editing : d)));
    toast.success("已保存");
    setEditing(null);
  };

  const openCreate = () => {
    const nextTypeSeq = "007";
    const draft: Disease = {
      id: `D-new-${Date.now()}`,
      code: "DZ-—",
      typeId: TYPES[0]?.id ?? "T-001",
      subSeq: nextTypeSeq,
      name: "",
      aliases: [],
      presentation: "",
      treatable: true,
      groups: [],
      status: "启用",
      symptoms: [],
      prescriptions: [],
    };
    setEditing(draft);
  };

  const headerCheckRef = useMemo(
    () => (el: HTMLButtonElement | null) => {
      if (el) (el as unknown as { dataset: DOMStringMap }).dataset.indeterminate = someChecked ? "true" : "false";
    },
    [someChecked],
  );

  return (
    <>
      <AppHeader title="疾病知识库" breadcrumb={["诊疗管理", "疾病知识库"]} />
      <main className="flex-1 px-6 py-6 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary" />
              <Input
                placeholder="搜索疾病名称 / 编码 / 症状"
                className="h-9 w-72 pl-9 text-body-sm"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <Select value={filterCat} onValueChange={setFilterCat}>
              <SelectTrigger className="h-9 w-40 text-body-sm">
                <div className="flex items-center gap-1.5">
                  <Filter className="h-3.5 w-3.5" />
                  <SelectValue placeholder="疾病分类" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部分类</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            size="sm"
            className="h-9 gap-1.5 text-body-sm font-normal bg-primary hover:bg-[var(--brand-hover)] text-primary-foreground"
            onClick={openCreate}
          >
            <Plus className="h-3.5 w-3.5" /> 新建疾病
          </Button>
        </div>

        {selected.size > 0 && (
          <div className="flex items-center justify-between gap-3 px-4 h-11 rounded-md border border-primary/30 bg-brand-subtle">
            <span className="text-body-sm text-foreground">已选 {selected.size} 项</span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-body-sm font-normal text-[var(--state-danger)] hover:text-[var(--state-danger)] hover:bg-[color-mix(in_oklab,var(--state-danger)_8%,transparent)]"
                onClick={() => setPendingDelete(Array.from(selected))}
              >
                <Trash2 className="h-3.5 w-3.5" /> 批量删除
              </Button>
              <Button variant="ghost" size="sm" className="h-8 gap-1 text-body-sm font-normal text-text-tertiary" onClick={() => setSelected(new Set())}>
                <X className="h-3.5 w-3.5" /> 取消
              </Button>
            </div>
          </div>
        )}

        <Card className="border-border bg-card overflow-hidden">
          <div className="flex items-center gap-4 px-6 h-12 text-table-header text-text-secondary border-b border-border bg-surface-subtle">
            <Checkbox ref={headerCheckRef} checked={allChecked} onCheckedChange={toggleAll} aria-label="全选" />
            <div className="grid grid-cols-[140px_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_80px_80px_minmax(0,1.6fr)] gap-4 flex-1 min-w-0">
              <div>疾病编码</div>
              <div>疾病名称</div>
              <div>所属疾病类型</div>
              <div>疾病分类</div>
              <div>是否治疗</div>
              <div>状态</div>
              <div>常见症状</div>
            </div>
            <div className="w-[160px] text-right shrink-0">功能</div>
          </div>
          {filtered.map((d) => {
            const checked = selected.has(d.id);
            const t = typeById(d.typeId);
            const cat = t ? categoryByCode(t.categoryCode) : undefined;
            return (
              <div
                key={d.id}
                className={`flex items-center gap-4 px-6 h-12 text-table-cell border-b border-border last:border-0 ${checked ? "bg-brand-subtle/60" : "hover:bg-surface-subtle"}`}
              >
                <Checkbox checked={checked} onCheckedChange={() => toggleOne(d.id)} aria-label={`选择 ${d.name}`} />
                <div className="grid grid-cols-[140px_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_80px_80px_minmax(0,1.6fr)] gap-4 flex-1 min-w-0">
                  <div className="font-mono text-body text-foreground truncate">{d.code}</div>
                  <div className="flex items-center gap-1.5 text-body text-foreground truncate">
                    <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="truncate">{d.name}</span>
                  </div>
                  <div className="text-body-sm text-text-secondary truncate">{t?.name ?? "—"}</div>
                  <div className="text-body-sm text-text-secondary truncate">{cat?.name ?? "—"}</div>
                  <div className="truncate">
                    <span className={`tag ${d.treatable ? "tag-warning" : "tag-muted"}`}>{d.treatable ? "是" : "否"}</span>
                  </div>
                  <div className="truncate">
                    <span className={`tag ${statusTagClass(d.status)}`}>{d.status}</span>
                  </div>
                  <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                    {d.symptoms.slice(0, 3).map((s) => (
                      <span key={s.code} className="tag tag-muted whitespace-nowrap">{s.name}</span>
                    ))}
                    {d.symptoms.length > 3 && (
                      <span className="tag tag-muted whitespace-nowrap">+{d.symptoms.length - 3}</span>
                    )}
                    {d.symptoms.length === 0 && <span className="text-text-tertiary text-body-sm">暂无</span>}
                  </div>
                </div>
                <div className="w-[160px] shrink-0 flex justify-end items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-body-sm font-normal text-text-secondary hover:bg-surface-subtle hover:text-foreground"
                    onClick={() => setViewing(d)}
                  >
                    查看
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-body-sm font-normal text-primary hover:bg-brand-subtle hover:text-primary"
                    onClick={() => setEditing({ ...d, aliases: [...d.aliases], groups: [...d.groups], symptoms: d.symptoms.map((s) => ({ ...s })), prescriptions: d.prescriptions.map((p) => ({ ...p })) })}
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
                        onClick={() => setPendingDelete([d.id])}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" /> 删除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="px-6 py-12 text-center text-body-sm text-text-tertiary">暂无匹配的疾病</div>
          )}
        </Card>
      </main>

      {/* 编辑抽屉 —— 底部吸底保存/取消 */}
      <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent side="right" className="w-full sm:w-1/2 sm:max-w-none flex flex-col gap-0 p-0 overflow-hidden">
          <SheetHeader className="px-6 pt-6 pb-2">
            <SheetTitle className="text-section-title">
              {editing?.code?.startsWith("DZ-—") ? "新建疾病" : editing?.name ?? "编辑疾病"}
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-2 space-y-4">
            {editing && <EditForm value={editing} onChange={setEditing} />}
          </div>
          <SheetFooter className="p-6 border-t border-border bg-white flex-row justify-end gap-2">
            <Button variant="outline" onClick={() => setEditing(null)}>取消</Button>
            <Button className="bg-primary hover:bg-[var(--brand-hover)] text-primary-foreground" onClick={saveEdit}>保存</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* 查看抽屉 */}
      <Sheet open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <SheetContent side="right" className="w-full sm:w-1/2 sm:max-w-none flex flex-col gap-0 p-0 overflow-hidden">
          <SheetHeader className="px-6 pt-6 pb-2">
            <SheetTitle className="text-section-title flex items-baseline gap-2">
              <span>{viewing?.name ?? "疾病详情"}</span>
              {viewing?.code && <span className="text-body-sm font-normal text-text-tertiary font-mono">{viewing.code}</span>}
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-2 space-y-4">
            {viewing && <DetailView value={viewing} />}
          </div>
          <SheetFooter className="p-6 border-t border-border bg-white flex-row justify-end gap-2">
            <Button variant="outline" onClick={() => setViewing(null)}>关闭</Button>
            <Button
              className="bg-primary hover:bg-[var(--brand-hover)] text-primary-foreground"
              onClick={() => {
                if (viewing) {
                  setEditing({ ...viewing, aliases: [...viewing.aliases], groups: [...viewing.groups], symptoms: viewing.symptoms.map((s) => ({ ...s })), prescriptions: viewing.prescriptions.map((p) => ({ ...p })) });
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
              将删除 {pendingDelete?.length ?? 0} 条疾病,删除后不可恢复。历史诊断记录仍会保留当时的编码快照。
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
}: {
  title: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
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

function Field({ label, required, children, hint }: { label: string; required?: boolean; children: React.ReactNode; hint?: string }) {
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

function EditForm({ value, onChange }: { value: Disease; onChange: (v: Disease) => void }) {
  const cat = categoryOfType(value.typeId);

  return (
    <>
      <SectionCard title="基础信息" icon={<FileText className="h-4 w-4 text-primary" />}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="疾病编码" hint="系统自动生成,不可修改">
            <Input value={value.code} readOnly className="font-mono bg-surface-subtle" />
          </Field>
          <Field label="所属疾病类型" required>
            <Select value={value.typeId} onValueChange={(v) => onChange({ ...value, typeId: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="疾病名称" required>
            <Input value={value.name} onChange={(e) => onChange({ ...value, name: e.target.value })} placeholder="如:乳房炎一级" />
          </Field>
          <Field label="疾病分类" hint="由所属疾病类型带出">
            <Input value={cat?.name ?? "—"} readOnly className="bg-surface-subtle" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="疾病英文/缩写">
            <Input value={value.alias ?? ""} onChange={(e) => onChange({ ...value, alias: e.target.value })} placeholder="如: LDA" />
          </Field>
          <Field label="疾病别名">
            <TagInput value={value.aliases} onChange={(v) => onChange({ ...value, aliases: v })} placeholder="输入后回车" />
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="状态" required>
            <Select value={value.status} onValueChange={(v) => onChange({ ...value, status: v as Disease["status"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="启用">启用</SelectItem>
                <SelectItem value="停用">停用</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="排序值">
            <Input
              type="number"
              value={value.order ?? ""}
              onChange={(e) => onChange({ ...value, order: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="同类型内排序"
            />
          </Field>
          <Field label="是否治疗" required hint="选择否将走放弃治疗兜底">
            <Select value={value.treatable ? "yes" : "no"} onValueChange={(v) => onChange({ ...value, treatable: v === "yes" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">是</SelectItem>
                <SelectItem value="no">否</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="临床信息" icon={<Stethoscope className="h-4 w-4 text-primary" />}>
        <Field label="典型表现">
          <Textarea
            rows={3}
            value={value.presentation}
            onChange={(e) => onChange({ ...value, presentation: e.target.value })}
            placeholder="用于疾病详情页展示的疾病介绍或典型表现"
          />
        </Field>
        <Field label="适用牛群">
          <div className="flex flex-wrap gap-2">
            {GROUP_OPTIONS.map((g) => {
              const active = value.groups.includes(g);
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() =>
                    onChange({
                      ...value,
                      groups: active ? value.groups.filter((x) => x !== g) : [...value.groups, g],
                    })
                  }
                  className={`px-3 h-7 rounded-md border text-body-sm transition-colors ${
                    active
                      ? "border-primary bg-brand-subtle text-primary"
                      : "border-border text-text-secondary hover:bg-surface-subtle"
                  }`}
                >
                  {g}
                </button>
              );
            })}
          </div>
        </Field>
      </SectionCard>

      <SectionCard title="常见症状" icon={<Tag className="h-4 w-4 text-primary" />}>
        <div className="space-y-2">
          {value.symptoms.length === 0 && (
            <div className="text-body-sm text-text-tertiary py-2">暂未关联症状</div>
          )}
          {value.symptoms.map((s, idx) => (
            <div key={s.code + idx} className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
              <span className="font-mono text-body-sm text-text-secondary w-20 shrink-0">{s.code}</span>
              <Input
                value={s.name}
                onChange={(e) => {
                  const next = [...value.symptoms];
                  next[idx] = { ...s, name: e.target.value };
                  onChange({ ...value, symptoms: next });
                }}
                className="h-8"
              />
              <label className="flex items-center gap-1.5 text-body-sm text-text-secondary shrink-0">
                <Checkbox
                  checked={!!s.core}
                  onCheckedChange={(c) => {
                    const next = [...value.symptoms];
                    next[idx] = { ...s, core: !!c };
                    onChange({ ...value, symptoms: next });
                  }}
                />
                核心症状
              </label>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-text-tertiary hover:text-[var(--state-danger)]"
                onClick={() => onChange({ ...value, symptoms: value.symptoms.filter((_, i) => i !== idx) })}
                aria-label="移除症状"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-body-sm font-normal"
            onClick={() =>
              onChange({
                ...value,
                symptoms: [...value.symptoms, { code: `SY-${String(100 + value.symptoms.length).padStart(3, "0")}`, name: "" }],
              })
            }
          >
            <Plus className="h-3.5 w-3.5" /> 关联症状
          </Button>
        </div>
      </SectionCard>

      {value.treatable ? (
        <SectionCard title="适用处方" icon={<Pill className="h-4 w-4 text-primary" />}>
          <div className="space-y-2">
            <RxSearchSelect
              selected={value.prescriptions}
              onAdd={(rx) =>
                onChange({
                  ...value,
                  prescriptions: [...value.prescriptions, { code: rx.code, name: rx.name, level: "备选" }],
                })
              }
            />
            {value.prescriptions.length === 0 && (
              <div className="text-body-sm text-text-tertiary py-2">暂未配置处方</div>
            )}

            {value.prescriptions.map((p, idx) => (
              <div key={p.code + idx} className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
                <span className="font-mono text-body-sm text-text-secondary w-24 shrink-0">{p.code}</span>
                <span className="flex-1 min-w-0 truncate text-body-sm text-foreground">{p.name || "—"}</span>
                <Select
                  value={p.level}
                  onValueChange={(v) => {
                    const next = [...value.prescriptions];
                    next[idx] = { ...p, level: v as PrescriptionRef["level"] };
                    onChange({ ...value, prescriptions: next });
                  }}
                >
                  <SelectTrigger className="h-8 w-28 shrink-0"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="首选">首选</SelectItem>
                    <SelectItem value="备选">备选</SelectItem>
                    <SelectItem value="特殊处方">特殊处方</SelectItem>
                  </SelectContent>
                </Select>
                <label className="flex items-center gap-1.5 text-body-sm text-text-secondary shrink-0">
                  <Checkbox
                    checked={!!p.defaultRx}
                    onCheckedChange={(c) => {
                      const next = value.prescriptions.map((x, i) => ({ ...x, defaultRx: i === idx ? !!c : false }));
                      onChange({ ...value, prescriptions: next });
                    }}
                  />
                  默认
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-text-tertiary hover:text-[var(--state-danger)]"
                  onClick={() => onChange({ ...value, prescriptions: value.prescriptions.filter((_, i) => i !== idx) })}
                  aria-label="移除处方"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}

          </div>
        </SectionCard>
      ) : (
        <SectionCard title="适用处方" icon={<Pill className="h-4 w-4 text-primary" />}>
          <div className="rounded-md bg-surface-subtle px-3 py-3 text-body-sm text-text-secondary">
            该疾病「是否治疗」= 否,mobile 端诊断时将展示:放弃治疗,请登记"死亡/淘汰"。
          </div>
        </SectionCard>
      )}

      <SectionCard title="备注" icon={<FileText className="h-4 w-4 text-primary" />}>
        <Textarea
          rows={2}
          value={value.remark ?? ""}
          onChange={(e) => onChange({ ...value, remark: e.target.value })}
          placeholder="数据清洗、待确认事项或业务说明"
        />
      </SectionCard>
    </>
  );
}

// ---------- 详情视图 ----------

function DetailView({ value }: { value: Disease }) {
  const t = typeById(value.typeId);
  const cat = t ? categoryByCode(t.categoryCode) : undefined;
  return (
    <>
      <StatScopeCard metrics={diseaseStats(value.code)} />

      <SectionCard title="基础信息" icon={<FileText className="h-4 w-4 text-primary" />}>
        <KV label="疾病类型" value={t?.name ?? "—"} />
        <KV label="疾病分类" value={cat?.name ?? "—"} />
        {value.alias && <KV label="英文/缩写" value={value.alias} />}
        {value.aliases.length > 0 && (
          <KV
            label="别名"
            valueNode={
              <div className="flex flex-wrap gap-1">
                {value.aliases.map((a) => <span key={a} className="tag tag-muted">{a}</span>)}
              </div>
            }
          />
        )}
        <KV label="是否治疗" value={value.treatable ? "是" : "否"} />
        <KV
          label="状态"
          valueNode={<span className={`tag ${statusTagClass(value.status)}`}>{value.status}</span>}
        />
        {value.groups.length > 0 && (
          <KV
           label="易感牛群"
            valueNode={
              <div className="flex flex-wrap gap-1">
                {value.groups.map((g) => <span key={g} className="tag tag-muted">{g}</span>)}
              </div>
            }
          />
        )}
      </SectionCard>

      {value.presentation && (
        <SectionCard title="典型表现" icon={<Stethoscope className="h-4 w-4 text-primary" />}>
          <div className="text-body text-foreground whitespace-pre-wrap">{value.presentation}</div>
        </SectionCard>
      )}

      <SectionCard title="常见症状" icon={<Tag className="h-4 w-4 text-primary" />}>
        {value.symptoms.length === 0 ? (
          <div className="text-body-sm text-text-tertiary">暂无</div>
        ) : (
          <div className="space-y-1.5">
            {value.symptoms.map((s) => (
              <div key={s.code} className="flex items-center gap-2 text-body">
                <span className={`tag ${s.core ? "tag-success" : "tag-muted"}`}>{s.name}</span>
                <span className="font-mono text-body-sm text-text-tertiary">{s.code}</span>
                {s.core && <span className="text-caption text-primary">核心</span>}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="适用处方" icon={<Pill className="h-4 w-4 text-primary" />}>
        {!value.treatable ? (
          <div className="rounded-md bg-surface-subtle px-3 py-3 text-body-sm text-text-secondary">
            放弃治疗,请登记"死亡/淘汰"
          </div>
        ) : value.prescriptions.length === 0 ? (
          <div className="text-body-sm text-text-tertiary">暂无</div>
        ) : (
          <div className="space-y-1.5">
            {value.prescriptions.map((p) => {
              const seed = PRESCRIPTION_SEED.find((r) => r.code === p.code);
              return (
                <div key={p.code} className="rounded-md bg-white border border-border px-3 py-2.5 space-y-1.5">
                  <div className="flex items-center gap-2 text-body">
                    <span className="text-foreground">{p.name}</span>
                    <span className="font-mono text-body-sm text-text-tertiary">{p.code}</span>
                    <span className={`tag ${p.level === "首选" ? "tag-success" : p.level === "备选" ? "tag-muted" : "tag-warning"}`}>{p.level}</span>
                    {p.defaultRx && <span className="tag tag-brand">默认</span>}
                    {seed && <span className="text-caption text-text-tertiary">疗程 {seed.duration} 天</span>}
                  </div>
                  {seed?.summary && (
                    <div className="text-body-sm text-text-secondary whitespace-pre-wrap">{seed.summary}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {value.remark && (
        <SectionCard title="备注" icon={<FileText className="h-4 w-4 text-primary" />}>
          <div className="text-body text-foreground whitespace-pre-wrap">{value.remark}</div>
        </SectionCard>
      )}
    </>
  );
}

function KV({ label, value, valueNode, mono }: { label: string; value?: string; valueNode?: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-24 shrink-0 text-body-sm text-text-secondary">{label}</div>
      <div className={`flex-1 text-body text-foreground ${mono ? "font-mono" : ""}`}>
        {valueNode ?? value ?? "—"}
      </div>
    </div>
  );
}

function TagInput({ value, onChange, placeholder }: { value: string[]; onChange: (next: string[]) => void; placeholder?: string }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (!v || value.includes(v)) { setDraft(""); return; }
    onChange([...value, v]);
    setDraft("");
  };
  const remove = (s: string) => onChange(value.filter((x) => x !== s));
  return (
    <div className="rounded-md border border-input bg-background px-2 py-1.5 min-h-[38px] flex flex-wrap gap-1.5 items-center focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-0">
      {value.map((s) => (
        <span key={s} className="inline-flex items-center gap-1 rounded-md bg-brand-subtle text-primary text-body-sm px-2 py-0.5">
          {s}
          <button type="button" onClick={() => remove(s)} className="hover:text-[var(--state-danger)]" aria-label={`移除 ${s}`}>
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); }
          else if (e.key === "Backspace" && !draft && value.length) { onChange(value.slice(0, -1)); }
        }}
        onBlur={add}
        placeholder={value.length ? "" : placeholder ?? "输入后回车添加"}
        className="flex-1 min-w-[100px] bg-transparent outline-none text-body-sm placeholder:text-text-tertiary"
      />
    </div>
  );
}
