import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { SearchableSelect } from "@/components/searchable-select";

// 回传映射配置：本系统 → 第三方系统。表格结构与「拉取映射配置」保持一致，
// 一行一个回传映射，查看与编辑统一走右侧抽屉。
const KINDS = ["工单", "任务", "基础事件"];
// 回传语义：工单=复查任务的结论；任务=检查结果（如孕检的是否怀孕）；基础事件=牧场作业事实
const targetTag = (t: string) => (t === "工单" ? "tag-success" : t === "基础事件" ? "tag-info" : "tag-muted");

// 我方可回传的事件 / 处置清单：编辑时只能从这份清单里选，不手填。
const OUR_EVENTS = [
  "正常", "复诊", "放弃",
  "怀孕", "空怀",
  "血中酮体", "体温", "尿液PH值", "子宫分泌物",
  "普通转群", "围产转群", "产犊", "死亡", "淘汰", "转场转出",
];
const ourEventOptions = OUR_EVENTS.map((n) => ({ value: n, label: n }));

type Sub = { id: string; name: string; code: string; extName?: string };
type Card = { id: string; title: string; typeName: string; typeCode: string; target: string; subs: Sub[] };

const SEED: Card[] = [
  { id: "p-100", title: "诊断治疗结果回传", typeName: "诊断治疗结果", typeCode: "100", target: "工单", subs: [
    { id: "s-606101", name: "正常", code: "606101", extName: "治愈" },
    { id: "s-606102", name: "复诊", code: "606102", extName: "续治" },
    { id: "s-606103", name: "放弃", code: "606103", extName: "放弃" },
  ] },
  { id: "p-6004", title: "孕检回传", typeName: "孕检", typeCode: "6004", target: "基础事件", subs: [
    { id: "s-600401", name: "空怀", code: "600401", extName: "空怀" },
    { id: "s-600402", name: "怀孕", code: "600402", extName: "怀孕" },
  ] },
  { id: "p-6025", title: "检测检查回传", typeName: "检测检查", typeCode: "6025", target: "基础事件", subs: [
    { id: "s-602503", name: "血中酮体", code: "", extName: "血中酮体" },
    { id: "s-602518", name: "体温", code: "", extName: "体温" },
    { id: "s-602519", name: "尿液PH值", code: "", extName: "尿液PH值" },
    { id: "s-602523", name: "子宫分泌物", code: "", extName: "子宫分泌物" },
  ] },
  { id: "p-6023", title: "转群回传", typeName: "转群", typeCode: "6023", target: "基础事件", subs: [
    { id: "s-602301", name: "普通转群", code: "602301", extName: "普通转群" },
    { id: "s-602302", name: "围产转群", code: "", extName: "围产转群" },
  ] },
  { id: "p-6003", title: "产犊回传", typeName: "产犊", typeCode: "6003", target: "基础事件", subs: [{ id: "s-600301", name: "产犊", code: "600301", extName: "产犊" }] },
  { id: "p-6014", title: "离场回传", typeName: "离场", typeCode: "6014", target: "基础事件", subs: [
    { id: "s-601401", name: "死亡", code: "601401", extName: "死亡" },
    { id: "s-601402", name: "淘汰", code: "601402", extName: "淘汰" },
  ] },
  { id: "p-6056", title: "转场回传", typeName: "转场", typeCode: "6056", target: "基础事件", subs: [{ id: "s-605601", name: "转场转出", code: "605601", extName: "转场转出" }] },
];

const textBtn = "h-7 px-2 text-body-sm font-normal text-primary hover:bg-brand-subtle hover:text-primary";
const cell = "border-t border-border px-4 py-3 whitespace-nowrap";
const stickyL = "sticky left-0 z-10 border-t border-r border-border bg-card group-hover/row:bg-surface-subtle";
const stickyR = "sticky right-0 z-10 border-t border-l border-border bg-card group-hover/row:bg-surface-subtle";

export function PushMapping() {
  const [cards, setCards] = useState(SEED);
  const [kw, setKw] = useState("");
  const [viewCard, setViewCard] = useState<Card | null>(null); // 抽屉查看态
  const [draft, setDraft] = useState<Card | null>(null); // 抽屉编辑态

  const list = useMemo(() => cards.filter((c) => !kw || [c.title, c.typeName, c.typeCode, ...c.subs.flatMap((s) => [s.name, s.code, s.extName ?? ""])].some((v) => v.includes(kw))), [cards, kw]);
  const isNew = !!draft && !cards.some((x) => x.id === draft.id);
  const openEdit = (c: Card) => { setViewCard({ ...c, subs: c.subs.map((s) => ({ ...s })) }); setDraft({ ...c, subs: c.subs.map((s) => ({ ...s })) }); };
  const openView = (c: Card) => setViewCard({ ...c, subs: c.subs.map((s) => ({ ...s })) });
  const openNew = () => { setViewCard(null); setDraft({ id: `p-${Date.now()}`, title: "", typeName: "", typeCode: "", target: "", subs: [] }); };
  const closeAll = () => { setViewCard(null); setDraft(null); };
  const drawerOpen = !!viewCard || !!draft;
  const patchDraft = (p: Partial<Card>) => setDraft((d) => (d ? { ...d, ...p } : d));
  const patchSub = (sid: string, p: Partial<Sub>) =>
    setDraft((d) => (d ? { ...d, subs: d.subs.map((s) => (s.id === sid ? { ...s, ...p } : s)) } : d));
  const delSub = (sid: string) => setDraft((d) => (d ? { ...d, subs: d.subs.filter((s) => s.id !== sid) } : d));
  const addSub = () => setDraft((d) => (d ? { ...d, subs: [...d.subs, { id: `s-${Date.now()}`, name: "", code: "", extName: "" }] } : d));

  const saveDraft = () => {
    if (!draft) return;
    setCards((cs) => (isNew ? [draft, ...cs] : cs.map((x) => (x.id === draft.id ? draft : x))));
    closeAll();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" />
          <Input value={kw} onChange={(e) => setKw(e.target.value)} placeholder="搜索映射名称 / 事件类型 / 处置 / 编码" className="h-9 pl-8 text-body-sm" />
        </div>
        <Button className="ml-auto h-9" onClick={openNew}>
          <Plus className="h-4 w-4" />新建映射卡片
        </Button>
      </div>

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full border-separate border-spacing-0 text-body-sm">
          <thead className="bg-surface-subtle text-text-secondary">
            <tr className="h-12">
              <th className="sticky left-0 z-20 border-r border-border bg-surface-subtle px-4 text-left font-medium whitespace-nowrap w-[220px] grow">映射名称</th>
              <th className="px-4 text-left font-medium whitespace-nowrap w-[140px] grow">（第三方）事件类型名称</th>
              <th className="px-4 text-left font-medium whitespace-nowrap w-[150px]">（第三方）事件类型编号</th>
              <th className="px-4 text-left font-medium whitespace-nowrap w-[110px]">（我方）对应类型</th>
              <th className="px-4 text-left font-medium whitespace-nowrap w-[120px]">子类型映射数目</th>
              <th className="px-4 text-left font-medium whitespace-nowrap w-[100px]">状态</th>
              <th className="sticky right-0 z-20 border-l border-border bg-surface-subtle px-4 text-left font-medium whitespace-nowrap w-[80px]">操作</th>
            </tr>
          </thead>
          <tbody>
            {list.map((c) => {
              const ok = !!c.target && c.subs.length > 0 && c.subs.every((s) => !!s.code);
              return (
                <tr key={c.id} className="group/row h-12">
                  <td className={`${stickyL} px-4 py-3 whitespace-nowrap`}>
                    <button type="button" className="text-text-primary hover:text-primary" onClick={() => openView(c)} title="查看全部子类型映射详情">
                      {c.title || "未命名卡片"}
                    </button>
                  </td>
                  <td className={`${cell} whitespace-nowrap`}>{c.typeName || "—"}</td>
                  <td className={`${cell} font-mono tabular-nums whitespace-nowrap`}>{c.typeCode || "—"}</td>
                  <td className={`${cell} whitespace-nowrap`}>
                    {c.target ? <span className={`tag ${targetTag(c.target)}`}>{c.target}</span> : <span className="text-text-tertiary">未选择</span>}
                  </td>
                  <td className={`${cell} tabular-nums text-text-primary whitespace-nowrap`}>{c.subs.length}</td>
                  <td className={`${cell} whitespace-nowrap`}><span className={`tag ${ok ? "tag-success" : "tag-warning"}`}>{ok ? "已配置" : "待配置"}</span></td>
                  <td className={`${stickyR} px-4 py-3 whitespace-nowrap`}>
                    <Button variant="ghost" size="sm" className={textBtn} onClick={() => openEdit(c)}>编辑</Button>
                  </td>
                </tr>
              );
            })}
            {list.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-body-sm text-text-tertiary">暂无映射卡片，点击右上角「新建映射卡片」新增</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Sheet open={drawerOpen} onOpenChange={(o) => !o && closeAll()}>
        <SheetContent side="right" className="w-full sm:w-[560px] sm:max-w-none overflow-y-auto bg-card">
          <SheetHeader className="text-left px-0 pb-4 border-b border-border">
            <SheetTitle className="text-section text-foreground">{draft ? (isNew ? "新建映射卡片" : "编辑映射卡片") : "映射卡片详情"}</SheetTitle>
            <SheetDescription className="text-caption text-text-tertiary">回传内容为我方系统产生的结果数据</SheetDescription>
          </SheetHeader>

          {viewCard && !draft && (
            <div className="space-y-6 py-5">
              <div className="grid gap-3 text-body-sm">
                <Row label="映射名称" value={viewCard.title || "未命名卡片"} />
                <Row label="回传事件类型" value={`${viewCard.typeName}（${viewCard.typeCode}）`} mono />
                <div className="flex items-center gap-3">
                  <span className="text-text-secondary shrink-0 w-24">对应类型</span>
                  {viewCard.target ? <span className={`tag ${targetTag(viewCard.target)}`}>{viewCard.target}</span> : <span className="text-text-tertiary">未选择</span>}
                </div>
              </div>
                <div className="space-y-1">
                  <div className="text-card-title font-medium text-text-primary">事件子类型（{viewCard.subs.length}）</div>
                  {viewCard.subs.length === 0 && <div className="py-6 text-center text-body-sm text-text-tertiary">暂无子类型</div>}
                  {viewCard.subs.length > 0 && (
                    <div className="grid grid-cols-[minmax(0,1fr)_7rem_minmax(0,1fr)_auto] gap-3 px-1 pb-1 text-caption text-text-tertiary">
                      <span>我方</span><span>第三方编码</span><span>第三方</span><span />
                    </div>
                  )}
                  <div className="divide-y divide-border">
                    {viewCard.subs.map((s) => (
                      <div key={s.id} className="py-2.5 grid grid-cols-[minmax(0,1fr)_7rem_minmax(0,1fr)_auto] items-center gap-3 text-body-sm">
                        <div className="min-w-0 truncate text-text-primary">{s.name || "—"}</div>
                        <div className="min-w-0">{s.code ? <span className="font-mono tabular-nums text-text-primary">{s.code}</span> : <span className="text-text-tertiary">未配置</span>}</div>
                        <div className="min-w-0 truncate">{s.extName ? <span className="text-text-primary">{s.extName}</span> : <span className="text-text-tertiary">未配置</span>}</div>
                        <span className={`tag ${s.code ? "tag-success" : "tag-warning"} shrink-0`}>{s.code ? "已配置" : "待配置"}</span>
                      </div>
                    ))}
                  </div>
                </div>
            </div>
          )}

          {draft && (
            <div className="space-y-6 py-5">
              <div className="grid gap-4">
                <Field label="映射名称">
                  <Input value={draft.title} placeholder="如：驱虫回传" onChange={(e) => patchDraft({ title: e.target.value })} />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="回传事件类型名称">
                    <Input value={draft.typeName} onChange={(e) => patchDraft({ typeName: e.target.value })} />
                  </Field>
                  <Field label="回传事件类型编码">
                    <Input value={draft.typeCode} className="font-mono" onChange={(e) => patchDraft({ typeCode: e.target.value.replace(/\D/g, "") })} />
                  </Field>
                </div>
                <Field label="对应类型">
                  <Select value={draft.target} onValueChange={(v) => patchDraft({ target: v })}>
                    <SelectTrigger className="h-9 bg-card text-body-sm"><SelectValue placeholder="请选择" /></SelectTrigger>
                    <SelectContent>{KINDS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-card-title font-medium text-text-primary">事件子类型（{draft.subs.length}）</div>
                  <Button variant="ghost" size="sm" className={textBtn} onClick={addSub}>
                    <Plus className="h-3.5 w-3.5" />添加子类型
                  </Button>
                </div>
                {draft.subs.length === 0 && <div className="py-6 text-center text-body-sm text-text-tertiary">暂无子类型，点击「添加子类型」新增</div>}
                {draft.subs.length > 0 && (
                  <div className="grid grid-cols-[minmax(0,1fr)_7rem_minmax(0,1fr)_auto] gap-3 px-1 text-caption text-text-tertiary">
                    <span>我方</span><span>第三方编码</span><span>第三方</span><span />
                  </div>
                )}
                <div className="divide-y divide-border">
                  {draft.subs.map((s) => (
                    <div key={s.id} className="py-2 grid grid-cols-[minmax(0,1fr)_7rem_minmax(0,1fr)_auto] items-center gap-3 text-body-sm">
                      <SearchableSelect
                        value={s.name}
                        options={ourEventOptions}
                        placeholder="选择我方"
                        searchPlaceholder="搜索我方"
                        className="h-9 w-full min-w-0"
                        onChange={(v) => patchSub(s.id, { name: v })}
                      />
                      <Input value={s.code} placeholder="编码" className="h-9 w-full min-w-0 font-mono text-body-sm"
                        onChange={(e) => patchSub(s.id, { code: e.target.value.replace(/\D/g, "") })} />
                      <Input value={s.extName ?? ""} placeholder="第三方名称" onChange={(e) => patchSub(s.id, { extName: e.target.value })} className="h-9 w-full min-w-0 text-body-sm" />
                      <Button variant="ghost" size="sm" className={`${textBtn} shrink-0`} onClick={() => delSub(s.id)}>删除</Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {draft && (
            <div className="sticky bottom-0 -mx-6 mt-4 flex justify-end gap-3 border-t border-border bg-card px-6 py-4">
              <Button variant="outline" onClick={() => setDraft(null)}>取消</Button>
              <Button disabled={!draft.title || !draft.typeName || !draft.typeCode} onClick={saveDraft}>保存</Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
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

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-text-secondary shrink-0 w-24">{label}</span>
      <span className={`text-text-primary ${mono ? "font-mono tabular-nums" : ""}`}>{value}</span>
    </div>
  );
}
