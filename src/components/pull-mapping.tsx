import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { KB_DISEASES } from "@/lib/disease-kb";

// 拉取映射配置：事件类型（名称 + 编码）决定对应的工单类型 / 基础事件；
// 子类型决定疾病（工单）或具体检测项目（基础事件）。
// 卡片只做查看展示，编辑统一走右侧抽屉。
export const WO_TYPES = ["疾病治疗", "产后护理", "修蹄", "免疫", "干奶", "驱虫"];
export const BASE_EVENTS: Record<string, string[]> = {
  孕检: ["空怀判定", "怀孕判定"],
  检测检查: ["血中酮体检测", "体温检测", "尿液 pH 检测", "子宫分泌物检查"],
  转群: ["普通转群", "围产转群"],
  转场: ["转场转出"],
};
const targetKind = (t: string) => (WO_TYPES.includes(t) ? "工单" : t ? "基础事件" : "");
const targetLabel = (t: string) => (WO_TYPES.includes(t) ? `${t}工单` : t);
const diseaseNameOf = (id: string) => KB_DISEASES.find((d) => d.id === id)?.name ?? id;

type Sub = { id: string; name: string; code: string; diseaseId?: string; item?: string };
type Card = { id: string; title: string; typeName: string; typeCode: string; target: string; subs: Sub[] };

const VACCINES = [
  "口蹄疫", "传染性鼻支气管炎", "魏氏梭菌", "布病疫苗", "犊牛腹泻五联苗", "巴氏杆菌免疫", "流行热免疫", "结核免疫",
  "IBR/BVDV疫苗", "山羊痘活疫苗", "病毒性腹泻", "曼氏杆菌免疫", "副伤寒免疫", "炭疽免疫", "支原体免疫", "大肠杆菌免疫", "乳房炎免疫",
];
const pad = (i: number) => String(i + 1).padStart(2, "0");

const SEED: Card[] = [
  { id: "c-6060", title: "驱虫工单拉取", typeName: "驱虫", typeCode: "6060", target: "驱虫", subs: [{ id: "s-606001", name: "驱虫", code: "606001" }] },
  { id: "c-6006", title: "干奶工单拉取", typeName: "干奶", typeCode: "6006", target: "干奶", subs: [{ id: "s-600601", name: "干奶", code: "600601" }] },
  { id: "c-6013", title: "修蹄工单拉取", typeName: "修蹄", typeCode: "6013", target: "修蹄", subs: [{ id: "s-601301", name: "修蹄", code: "601301" }] },
  { id: "c-6048", title: "免疫工单拉取", typeName: "免疫", typeCode: "6048", target: "免疫", subs: VACCINES.map((n, i) => ({ id: `s-6048${pad(i)}`, name: n, code: `6048${pad(i)}` })) },
  { id: "c-6004", title: "孕检任务拉取", typeName: "孕检", typeCode: "6004", target: "孕检", subs: [
    { id: "s-600401", name: "空怀", code: "600401", item: "空怀判定" },
    { id: "s-600402", name: "怀孕", code: "600402", item: "怀孕判定" },
  ] },
  { id: "c-6025", title: "检测检查任务拉取", typeName: "检测检查", typeCode: "6025", target: "检测检查", subs: [
    { id: "s-602503", name: "血中酮体", code: "602503", item: "血中酮体检测" },
    { id: "s-602518", name: "体温", code: "602518", item: "体温检测" },
    { id: "s-602519", name: "尿液PH值", code: "602519", item: "尿液 pH 检测" },
    { id: "s-602523", name: "子宫分泌物", code: "602523", item: "子宫分泌物检查" },
  ] },
  { id: "c-6023", title: "围产转群任务拉取", typeName: "转群", typeCode: "6023", target: "转群", subs: [{ id: "s-602302", name: "围产转群", code: "602302", item: "围产转群" }] },
  { id: "c-6056", title: "转场任务拉取", typeName: "转场", typeCode: "6056", target: "转场", subs: [{ id: "s-605601", name: "转场转出", code: "605601", item: "转场转出" }] },
];

const textBtn = "h-7 px-2 text-body-sm font-normal text-primary hover:bg-brand-subtle hover:text-primary";

export function PullMapping() {
  const [cards, setCards] = useState(SEED);
  const [kw, setKw] = useState("");
  const [viewCard, setViewCard] = useState<Card | null>(null); // 抽屉查看态
  const [draft, setDraft] = useState<Card | null>(null); // 抽屉编辑态
  const [subDlg, setSubDlg] = useState<Sub | null>(null);

  const list = useMemo(() => cards.filter((c) => !kw || [c.title, c.typeName, c.typeCode, c.target, ...c.subs.flatMap((s) => [s.name, s.code])].some((v) => v.includes(kw))), [cards, kw]);
  const isNew = !!draft && !cards.some((x) => x.id === draft.id);
  const openEdit = (c: Card) => setDraft({ ...c, subs: c.subs.map((s) => ({ ...s })) });
  const openView = (c: Card) => setViewCard({ ...c, subs: c.subs.map((s) => ({ ...s })) });
  const openNew = () => { setViewCard(null); setDraft({ id: `c-${Date.now()}`, title: "", typeName: "", typeCode: "", target: "", subs: [] }); };
  const closeAll = () => { setViewCard(null); setDraft(null); };
  const drawerOpen = !!viewCard || !!draft;
  const patchDraft = (p: Partial<Card>) => setDraft((d) => (d ? { ...d, ...p } : d));
  const patchSub = (sid: string, p: Partial<Sub>) =>
    setDraft((d) => (d ? { ...d, subs: d.subs.map((s) => (s.id === sid ? { ...s, ...p } : s)) } : d));

  const saveDraft = () => {
    if (!draft) return;
    setCards((cs) => (isNew ? [draft, ...cs] : cs.map((x) => (x.id === draft.id ? draft : x))));
    closeAll();
  };

  const saveSub = (s: Sub) => {
    setDraft((d) =>
      d ? { ...d, subs: d.subs.some((x) => x.id === s.id) ? d.subs.map((x) => (x.id === s.id ? s : x)) : [...d.subs, s] } : d,
    );
    setSubDlg(null);
  };

  const kind = draft ? targetKind(draft.target) : "";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" />
          <Input value={kw} onChange={(e) => setKw(e.target.value)} placeholder="搜索卡片名称 / 事件类型 / 子类型 / 编码" className="h-9 pl-8 text-body-sm" />
        </div>
        <Button className="ml-auto h-9" onClick={openNew}>
          <Plus className="h-4 w-4" />新建映射卡片
        </Button>
      </div>

      <div className="space-y-4">
        {list.map((c) => {
          const ck = targetKind(c.target);
          return (
            <section key={c.id} className="rounded-lg border border-border bg-card overflow-hidden">
              <header className="flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4 bg-surface-subtle">
                <div className="min-w-0">
                  <span className="text-card-title font-medium text-text-primary">{c.title || "未命名卡片"}</span>
                  <div className="mt-0.5 flex items-center gap-3 text-body-sm text-text-secondary">
                    <span>拉取事件类型：<span className="text-text-primary">{c.typeName}</span></span>
                    <span>编码：<span className="font-mono tabular-nums text-text-primary">{c.typeCode}</span></span>
                  </div>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-body-sm text-text-secondary shrink-0">对应工单 / 任务</span>
                  {c.target
                    ? <span className="text-body-sm text-text-primary">{targetLabel(c.target)}</span>
                    : <span className="text-body-sm text-text-tertiary">未选择</span>}
                  {ck && <span className={`tag ${ck === "工单" ? "tag-success" : "tag-info"}`}>{ck}</span>}
                  <Button variant="ghost" size="sm" className={textBtn} onClick={() => openEdit(c)}>编辑</Button>
                </div>
              </header>

              <div className="relative max-h-[210px] overflow-hidden">
              <div className="divide-y divide-border">
                {c.subs.map((s) => {
                  const ok = ck === "工单" ? !!s.diseaseId : ck === "基础事件" ? !!s.item : false;
                  return (
                    <div key={s.id} className="flex items-center gap-6 px-5 py-3 text-body-sm">
                      <div className="w-56 min-w-0">
                        <div className="text-caption text-text-tertiary">事件子类型</div>
                        <div className="text-text-primary truncate">{s.name || "—"}</div>
                      </div>
                      <div className="w-28">
                        <div className="text-caption text-text-tertiary">子类型编码</div>
                        <div className="font-mono tabular-nums">{s.code || "—"}</div>
                      </div>
                      <div className="flex-1 min-w-0 flex items-center gap-3">
                        {ck === "工单" && (
                          <>
                            <span className="text-text-secondary shrink-0">疾病</span>
                            {s.diseaseId ? (
                              <>
                                <span className="text-text-primary truncate max-w-64">{diseaseNameOf(s.diseaseId)}</span>
                                <span className="font-mono tabular-nums text-caption text-text-tertiary">{s.diseaseId}</span>
                              </>
                            ) : (
                              <span className="text-text-tertiary">未配置</span>
                            )}
                          </>
                        )}
                        {ck === "基础事件" && (
                          <>
                            <span className="text-text-secondary shrink-0">检测项目</span>
                            {s.item ? <span className="text-text-primary">{s.item}</span> : <span className="text-text-tertiary">未配置</span>}
                          </>
                        )}
                        {!ck && <span className="text-text-tertiary">未选择对应工单 / 任务，点击「编辑」配置</span>}
                      </div>
                      <span className={`tag ${ok ? "tag-success" : "tag-warning"}`}>{ok ? "已配置" : "待配置"}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <Sheet open={!!draft} onOpenChange={(o) => !o && closeEdit()}>
        <SheetContent side="right" className="w-full sm:w-[560px] sm:max-w-none overflow-y-auto bg-card">
          <SheetHeader className="text-left px-0 pb-4 border-b border-border">
            <SheetTitle className="text-section text-foreground">{isNew ? "新建映射卡片" : "编辑映射卡片"}</SheetTitle>
            <SheetDescription className="text-caption text-text-tertiary">配置事件类型到工单 / 基础事件的映射关系</SheetDescription>
          </SheetHeader>

          {draft && (
            <div className="space-y-6 py-5">
              <div className="grid gap-4">
                <Field label="卡片名称">
                  <Input value={draft.title} placeholder="如：驱虫工单拉取" onChange={(e) => patchDraft({ title: e.target.value })} />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="拉取事件类型名称">
                    <Input value={draft.typeName} onChange={(e) => patchDraft({ typeName: e.target.value })} />
                  </Field>
                  <Field label="拉取事件类型编码">
                    <Input value={draft.typeCode} className="font-mono" onChange={(e) => patchDraft({ typeCode: e.target.value.replace(/\D/g, "") })} />
                  </Field>
                </div>
                <Field label="对应工单 / 任务">
                  <Select
                    value={draft.target}
                    onValueChange={(v) => {
                      const changed = targetKind(v) !== kind;
                      patchDraft({
                        target: v,
                        subs: changed
                          ? draft.subs.map((s) => ({ ...s, diseaseId: undefined, item: undefined }))
                          : draft.subs.map((s) => (targetKind(v) === "基础事件" && v !== draft.target ? { ...s, item: undefined } : s)),
                      });
                    }}
                  >
                    <SelectTrigger className="h-9 bg-card text-body-sm"><SelectValue placeholder="请选择" /></SelectTrigger>
                    <SelectContent>
                      <SelectGroup><SelectLabel>工单类型</SelectLabel>{WO_TYPES.map((t) => <SelectItem key={t} value={t}>{t}工单</SelectItem>)}</SelectGroup>
                      <SelectGroup><SelectLabel>基础事件</SelectLabel>{Object.keys(BASE_EVENTS).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-card-title font-medium text-text-primary">事件子类型（{draft.subs.length}）</div>
                  <Button variant="ghost" size="sm" className={textBtn} onClick={() => setSubDlg({ id: `s-${Date.now()}`, name: "", code: "" })}>
                    <Plus className="h-3.5 w-3.5" />添加子类型
                  </Button>
                </div>
                {draft.subs.length === 0 && <div className="rounded-md border border-dashed border-border px-4 py-6 text-center text-body-sm text-text-tertiary">暂无子类型，点击「添加子类型」新增</div>}
                <div className="space-y-2">
                  {draft.subs.map((s) => {
                    const ok = kind === "工单" ? !!s.diseaseId : kind === "基础事件" ? !!s.item : false;
                    return (
                      <div key={s.id} className="rounded-md border border-border px-4 py-3 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="text-text-primary truncate">{s.name || "—"}</div>
                            <div className="font-mono tabular-nums text-caption text-text-tertiary">{s.code || "—"}</div>
                          </div>
                          <span className={`tag ${ok ? "tag-success" : "tag-warning"}`}>{ok ? "已配置" : "待配置"}</span>
                          <Button variant="ghost" size="sm" className={textBtn} onClick={() => setSubDlg({ ...s })}>编辑</Button>
                        </div>
                        {kind === "工单" && (
                          <div className="flex items-center gap-3">
                            <span className="text-body-sm text-text-secondary shrink-0">疾病</span>
                            <Select value={s.diseaseId ?? ""} onValueChange={(v) => patchSub(s.id, { diseaseId: v })}>
                              <SelectTrigger className="h-9 flex-1 text-body-sm"><SelectValue placeholder="选择疾病名称" /></SelectTrigger>
                              <SelectContent className="max-h-72">
                                {KB_DISEASES.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <span className="font-mono tabular-nums text-caption text-text-tertiary shrink-0">{s.diseaseId ?? "—"}</span>
                          </div>
                        )}
                        {kind === "基础事件" && (
                          <div className="flex items-center gap-3">
                            <span className="text-body-sm text-text-secondary shrink-0">检测项目</span>
                            <Select value={s.item ?? ""} onValueChange={(v) => patchSub(s.id, { item: v })}>
                              <SelectTrigger className="h-9 flex-1 text-body-sm"><SelectValue placeholder="选择具体检测项目" /></SelectTrigger>
                              <SelectContent>{(BASE_EVENTS[draft.target] ?? []).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                        )}
                        {!kind && <div className="text-body-sm text-text-tertiary">请先在上方选择对应工单 / 任务</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="sticky bottom-0 -mx-6 mt-4 flex justify-end gap-3 border-t border-border bg-card px-6 py-4">
            <Button variant="outline" onClick={closeEdit}>取消</Button>
            <Button disabled={!draft || !draft.title || !draft.typeName || !draft.typeCode} onClick={saveDraft}>保存</Button>
          </div>
        </SheetContent>
      </Sheet>

      <FormDialog
        open={!!subDlg}
        title="事件子类型"
        fields={[["name", "事件子类型名称"], ["code", "事件子类型编码"]]}
        init={subDlg ? { name: subDlg.name, code: subDlg.code } : {}}
        onClose={() => setSubDlg(null)}
        onSave={(v) => subDlg && saveSub({ ...subDlg, ...v })}
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-body-sm text-text-secondary">{label}</span>
      {children}
    </label>
  );
}

function FormDialog({ open, title, fields, init, onClose, onSave }: {
  open: boolean; title: string; fields: [string, string][]; init: Record<string, string>;
  onClose: () => void; onSave: (v: Record<string, string>) => void;
}) {
  const [vals, setVals] = useState<Record<string, string>>({});
  const [wasOpen, setWasOpen] = useState(false);
  if (open !== wasOpen) { setWasOpen(open); if (open) setVals(init); }
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          {fields.map(([k, label]) => (
            <label key={k} className="block space-y-1.5">
              <span className="text-body-sm text-text-secondary">{label}</span>
              <Input value={vals[k] ?? ""} className={k.toLowerCase().includes("code") ? "font-mono" : undefined}
                onChange={(e) => setVals({ ...vals, [k]: k.toLowerCase().includes("code") ? e.target.value.replace(/\D/g, "") : e.target.value })} />
            </label>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button disabled={fields.some(([k]) => !vals[k])} onClick={() => onSave(vals)}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
