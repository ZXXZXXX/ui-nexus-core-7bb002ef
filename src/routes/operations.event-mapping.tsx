import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/operations/event-mapping")({
  head: () => ({
    meta: [
      { title: "事件映射管理 — 奇点智牧" },
      { name: "description", content: "配置从 UD 拉取的工单与事件编码，以及本系统处置与事件回传 UD 的编码。" },
      { property: "og:title", content: "事件映射管理 — 奇点智牧" },
      { property: "og:description", content: "配置从 UD 拉取的工单与事件编码，以及本系统处置与事件回传 UD 的编码。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

const PENDING = "待确认";

// ============ 拉取映射：UD → 本系统 ============
type InRow = {
  id: string;
  group: "工单" | "基础事件";
  udType: string;
  udTypeName: string;
  udSub: string;
  udSubName: string;
  bizCategory: string;
  target: string;
  disease?: string;
  fromCode: string;
  note: string;
};

const VACCINES = [
  "口蹄疫", "传染性鼻支气管炎", "魏氏梭菌", "布病疫苗", "犊牛腹泻五联苗", "巴氏杆菌免疫", "流行热免疫", "结核免疫",
  "IBR/BVDV疫苗", "山羊痘活疫苗", "病毒性腹泻", "曼氏杆菌免疫", "副伤寒免疫", "炭疽免疫", "支原体免疫", "大肠杆菌免疫", "乳房炎免疫",
];
const pad = (i: number) => String(i + 1).padStart(2, "0");

const IN_SEED: InRow[] = [
  { id: "in-606001", group: "工单", udType: "6060", udTypeName: "驱虫", udSub: "606001", udSubName: "驱虫", bizCategory: "工单", target: "驱虫工单", disease: "体内外寄生虫病", fromCode: "606001", note: "" },
  { id: "in-600601", group: "工单", udType: "6006", udTypeName: "干奶", udSub: "600601", udSubName: "干奶", bizCategory: "工单", target: "干奶工单", disease: "干奶期保健", fromCode: "600601", note: "" },
  { id: "in-601301", group: "工单", udType: "6013", udTypeName: "修蹄", udSub: "601301", udSubName: "修蹄", bizCategory: "工单", target: "修蹄工单", disease: "蹄病（修蹄保健）", fromCode: "601301", note: "" },
  ...VACCINES.map((n, i) => ({
    id: `in-6048${pad(i)}`, group: "工单" as const, udType: "6048", udTypeName: "免疫", udSub: `6048${pad(i)}`, udSubName: n,
    bizCategory: "工单", target: "疫苗免疫", disease: `${n}（免疫预防）`, fromCode: `6048${pad(i)}`, note: "",
  })),
  { id: "in-600401", group: "基础事件", udType: "6004", udTypeName: "孕检", udSub: "600401", udSubName: "空怀", bizCategory: "基础事件任务", target: "孕检", fromCode: PENDING, note: "UD 工作单中的编码待确认" },
  { id: "in-600402", group: "基础事件", udType: "6004", udTypeName: "孕检", udSub: "600402", udSubName: "怀孕", bizCategory: "基础事件任务", target: "孕检", fromCode: PENDING, note: "" },
  { id: "in-602503", group: "基础事件", udType: "6025", udTypeName: "检测检查", udSub: "602503", udSubName: "血中酮体", bizCategory: "基础事件任务", target: "血酮检查", fromCode: PENDING, note: "" },
  { id: "in-602518", group: "基础事件", udType: "6025", udTypeName: "检测检查", udSub: "602518", udSubName: "体温", bizCategory: "基础事件任务", target: "体温检查", fromCode: PENDING, note: "" },
  { id: "in-602519", group: "基础事件", udType: "6025", udTypeName: "检测检查", udSub: "602519", udSubName: "尿液PH值", bizCategory: "基础事件任务", target: "尿液pH检查", fromCode: PENDING, note: "" },
  { id: "in-602523", group: "基础事件", udType: "6025", udTypeName: "检测检查", udSub: "602523", udSubName: "子宫分泌物", bizCategory: "基础事件任务", target: "子宫分泌物检查", fromCode: PENDING, note: "" },
  { id: "in-605601", group: "基础事件", udType: "6056", udTypeName: "转场", udSub: "605601", udSubName: "转场转出", bizCategory: "现场事件记录", target: "离场—转场", fromCode: PENDING, note: "" },
  { id: "in-602302", group: "基础事件", udType: "6023", udTypeName: "转群", udSub: "602302", udSubName: "围产转群", bizCategory: "基础事件任务", target: "转群／转栏", fromCode: "602302", note: "UD 通过工作单发布围产转群任务，完成后需回填" },
];

// ============ 回传映射：本系统 → UD ============
type OutRow = {
  id: string;
  group: "工单处置" | "基础事件" | "现场事件";
  source: string;
  action: string;
  toType: string;
  toSub: string;
  withDrug: boolean;
  note: string;
};

const OUT_SEED: OutRow[] = [
  { id: "out-dw", group: "工单处置", source: "驱虫工单", action: "驱虫处置", toType: "6060", toSub: "617905", withDrug: false, note: "" },
  { id: "out-dry", group: "工单处置", source: "干奶工单", action: "干奶处置", toType: "6006", toSub: "617801", withDrug: false, note: "" },
  { id: "out-hoof", group: "工单处置", source: "修蹄工单", action: "修蹄实际用药", toType: "6005", toSub: "617010", withDrug: true, note: "同时回传药品信息" },
  ...VACCINES.map((n, i) => ({
    id: `out-vac-${i}`, group: "工单处置" as const, source: "疫苗免疫", action: `${n} 实际用药`, toType: "6005",
    toSub: n === "乳房炎免疫" ? PENDING : `6176${pad(i)}`, withDrug: true,
    note: n === "乳房炎免疫" ? "处置子类型未提供，待 UD 确认" : "同时回传药品信息",
  })),
  { id: "out-600401", group: "基础事件", source: "孕检", action: "空怀", toType: "6004", toSub: "600401", withDrug: false, note: "" },
  { id: "out-600402", group: "基础事件", source: "孕检", action: "怀孕", toType: "6004", toSub: "600402", withDrug: false, note: "" },
  { id: "out-602503", group: "基础事件", source: "血酮检查", action: "血中酮体", toType: "6025", toSub: PENDING, withDrug: false, note: "" },
  { id: "out-602518", group: "基础事件", source: "体温检查", action: "体温", toType: "6025", toSub: PENDING, withDrug: false, note: "" },
  { id: "out-602519", group: "基础事件", source: "尿液pH检查", action: "尿液PH值", toType: "6025", toSub: PENDING, withDrug: false, note: "" },
  { id: "out-602523", group: "基础事件", source: "子宫分泌物检查", action: "子宫分泌物", toType: "6025", toSub: PENDING, withDrug: false, note: "" },
  { id: "out-602301", group: "基础事件", source: "转群／转栏", action: "普通转群", toType: "6023", toSub: "602301", withDrug: false, note: "" },
  { id: "out-602302", group: "基础事件", source: "转群／转栏", action: "围产转群", toType: "6023", toSub: PENDING, withDrug: false, note: "回填编码待确认" },
  { id: "out-600301", group: "现场事件", source: "产犊", action: "产犊", toType: "6003", toSub: "600301", withDrug: false, note: "" },
  { id: "out-601401", group: "现场事件", source: "离场—死亡", action: "死亡", toType: "6014", toSub: "601401", withDrug: false, note: "" },
  { id: "out-601402", group: "现场事件", source: "离场—淘汰", action: "淘汰", toType: "6014", toSub: "601402", withDrug: false, note: "" },
  { id: "out-605601", group: "现场事件", source: "离场—转场", action: "转场转出", toType: "6056", toSub: "605601", withDrug: false, note: "" },
];

const isPending = (v: string) => !v || v === PENDING;
const StatusTag = ({ ok }: { ok: boolean }) => (
  <span className={`tag ${ok ? "tag-success" : "tag-warning"}`}>{ok ? "已配置" : "待确认"}</span>
);
const Code = ({ v }: { v: string }) =>
  isPending(v) ? <span className="text-text-tertiary">—</span> : <span className="font-mono tabular-nums">{v}</span>;

function Page() {
  return (
    <>
      <AppHeader title="事件映射管理" breadcrumb={["运营管理", "事件映射管理"]} />
      <main className="flex-1 px-6 py-6 space-y-4">
        <Tabs defaultValue="wo">
          <TabsList className="h-9 rounded-lg bg-surface-subtle">
            <TabsTrigger value="wo" className="rounded-md px-4">工单映射（UD → 工单类型／疾病结论）</TabsTrigger>
            <TabsTrigger value="ev" className="rounded-md px-4">基础事件映射（UD → 基础事件任务）</TabsTrigger>
            <TabsTrigger value="out" className="rounded-md px-4">回传映射（本系统 → UD）</TabsTrigger>
          </TabsList>
          <TabsContent value="wo" className="mt-4"><InTable kind="工单" /></TabsContent>
          <TabsContent value="ev" className="mt-4"><InTable kind="基础事件" /></TabsContent>
          <TabsContent value="out" className="mt-4"><OutTable /></TabsContent>
        </Tabs>
      </main>
    </>
  );
}

function Filters({ kw, onKw, placeholder, group, onGroup, groups, status, onStatus }: {
  kw: string; onKw: (v: string) => void; placeholder: string;
  group: string; onGroup: (v: string) => void; groups: string[];
  status: string; onStatus: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="relative w-64">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" />
        <Input value={kw} onChange={(e) => onKw(e.target.value)} placeholder={placeholder} className="h-9 pl-8 text-body-sm" />
      </div>
      <Select value={group} onValueChange={onGroup}>
        <SelectTrigger className="h-9 w-36 text-body-sm"><SelectValue placeholder="映射分类" /></SelectTrigger>
        <SelectContent>{["全部分类", ...groups].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={status} onValueChange={onStatus}>
        <SelectTrigger className="h-9 w-32 text-body-sm"><SelectValue placeholder="配置状态" /></SelectTrigger>
        <SelectContent>{["全部状态", "已配置", "待确认"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}

function Th({ cols }: { cols: string[] }) {
  return (
    <thead className="bg-surface-subtle text-text-secondary">
      <tr className="h-12">{cols.map((h) => <th key={h} className="px-4 text-left font-medium whitespace-nowrap">{h}</th>)}</tr>
    </thead>
  );
}

function InTable({ kind }: { kind: "工单" | "基础事件" }) {
  const wo = kind === "工单";
  const [rows, setRows] = useState(() => IN_SEED.filter((r) => r.group === kind));
  const [kw, setKw] = useState("");
  const [status, setStatus] = useState("全部状态");
  const [edit, setEdit] = useState<InRow | null>(null);
  const done = (r: InRow) => !!r.target && (!wo || !!r.disease);
  const list = useMemo(() => rows.filter((r) =>
    (status === "全部状态" || (status === "已配置") === done(r)) &&
    (!kw || [r.udType, r.udTypeName, r.udSub, r.udSubName, r.target, r.disease ?? ""].some((s) => s.includes(kw)))), [rows, kw, status]);
  const cols = ["事件类型编码", "事件类型", "事件子类型编码", "事件子类型", ...(wo ? ["本系统工单类型", "疾病结论"] : ["本系统基础事件任务类型"]), "状态", "备注", "操作"];
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" />
          <Input value={kw} onChange={(e) => setKw(e.target.value)} placeholder={wo ? "搜索 UD 编码 / 工单类型 / 疾病结论" : "搜索 UD 编码 / 基础事件任务"} className="h-9 pl-8 text-body-sm" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-9 w-32 text-body-sm"><SelectValue /></SelectTrigger>
          <SelectContent>{["全部状态", "已配置", "待确认"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-body-sm">
          <Th cols={cols} />
          <tbody>
            {list.map((r) => (
              <tr key={r.id} className="border-t border-border h-12">
                <td className="px-4 py-3 whitespace-nowrap"><Code v={r.udType} /></td>
                <td className="px-4 py-3 whitespace-nowrap">{r.udTypeName}</td>
                <td className="px-4 py-3 whitespace-nowrap"><Code v={r.udSub} /></td>
                <td className="px-4 py-3 whitespace-nowrap">{r.udSubName}</td>
                <td className="px-4 py-3 whitespace-nowrap">{r.target || <span className="text-text-tertiary">—</span>}</td>
                {wo && <td className="px-4 py-3 whitespace-nowrap">{r.disease || <span className="text-text-tertiary">—</span>}</td>}
                <td className="px-4 py-3 whitespace-nowrap"><StatusTag ok={done(r)} /></td>
                <td className="px-4 py-3 text-text-secondary max-w-[240px] truncate" title={r.note}>{r.note || "—"}</td>
                <td className="px-4 py-3 whitespace-nowrap"><Button variant="ghost" size="sm" className="h-7 px-2 text-body-sm font-normal text-primary hover:bg-brand-subtle hover:text-primary" onClick={() => setEdit(r)}>编辑</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <EditDialog
        open={!!edit} onClose={() => setEdit(null)}
        title={edit ? `编辑${kind}映射 · ${edit.udTypeName} / ${edit.udSubName}` : ""}
        fields={edit ? [
          { k: "udType", label: "UD 事件类型编码", v: edit.udType, code: true },
          { k: "udSub", label: "UD 事件子类型编码", v: edit.udSub, code: true },
          { k: "target", label: wo ? "本系统工单类型" : "本系统基础事件任务类型", v: edit.target },
          ...(wo ? [{ k: "disease", label: "疾病结论", v: edit.disease ?? "" }] : []),
          { k: "note", label: "备注", v: edit.note, multi: true },
        ] : []}
        onSave={(vals) => { setRows((rs) => rs.map((r) => r.id === edit!.id ? { ...r, ...vals } : r)); setEdit(null); }}
      />
    </div>
  );
}

function OutTable() {
  const [rows, setRows] = useState(OUT_SEED);
  const [kw, setKw] = useState("");
  const [group, setGroup] = useState("全部分类");
  const [status, setStatus] = useState("全部状态");
  const [edit, setEdit] = useState<OutRow | null>(null);
  const list = useMemo(() => rows.filter((r) =>
    (group === "全部分类" || r.group === group) &&
    (status === "全部状态" || (status === "已配置") === !isPending(r.toSub)) &&
    (!kw || [r.source, r.action, r.toType, r.toSub].some((s) => s.includes(kw)))), [rows, kw, group, status]);

  return (
    <div className="space-y-4">
      <Filters kw={kw} onKw={setKw} placeholder="搜索处置 / 事件 / 回传编码" group={group} onGroup={setGroup} groups={["工单处置", "基础事件", "现场事件"]} status={status} onStatus={setStatus} />
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-body-sm">
          <Th cols={["本系统来源", "本系统映射结论", "处置／事件", "回传类型编码", "回传子类型编码（To UD）", "附带药品信息", "状态", "备注", "操作"]} />
          <tbody>
            {list.map((r) => (
              <tr key={r.id} className="border-t border-border h-12">
                <td className="px-4 py-3 whitespace-nowrap">{r.source}</td>
                <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{`向 UD 回传「${r.action}」记录${r.withDrug ? "及药品信息" : ""}`}</td>
                <td className="px-4 py-3 whitespace-nowrap">{r.action}</td>
                <td className="px-4 py-3 whitespace-nowrap"><Code v={r.toType} /></td>
                <td className="px-4 py-3 whitespace-nowrap"><Code v={r.toSub} /></td>
                <td className="px-4 py-3 whitespace-nowrap text-text-secondary">{r.withDrug ? "是" : "否"}</td>
                <td className="px-4 py-3 whitespace-nowrap"><StatusTag ok={!isPending(r.toSub)} /></td>
                <td className="px-4 py-3 text-text-secondary max-w-[240px] truncate" title={r.note}>{r.note || "—"}</td>
                <td className="px-4 py-3 whitespace-nowrap"><Button variant="ghost" size="sm" className="h-7 px-2 text-body-sm font-normal text-primary hover:bg-brand-subtle hover:text-primary" onClick={() => setEdit(r)}>编辑</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <EditDialog
        open={!!edit} onClose={() => setEdit(null)}
        title={edit ? `编辑回传映射 · ${edit.source} / ${edit.action}` : ""}
        fields={edit ? [
          { k: "toType", label: "回传类型编码", v: edit.toType, code: true },
          { k: "toSub", label: "回传子类型编码（To UD）", v: isPending(edit.toSub) ? "" : edit.toSub, code: true },
          { k: "note", label: "备注", v: edit.note, multi: true },
        ] : []}
        onSave={(vals) => { setRows((rs) => rs.map((r) => r.id === edit!.id ? { ...r, ...vals, toSub: vals.toSub || PENDING } : r)); setEdit(null); }}
      />
    </div>
  );
}

type Field = { k: string; label: string; v: string; code?: boolean; multi?: boolean };
function EditDialog({ open, onClose, title, fields, onSave }: {
  open: boolean; onClose: () => void; title: string; fields: Field[]; onSave: (v: Record<string, string>) => void;
}) {
  const [vals, setVals] = useState<Record<string, string>>({});
  const key = title;
  const [lastKey, setLastKey] = useState("");
  if (open && key !== lastKey) {
    setLastKey(key);
    setVals(Object.fromEntries(fields.map((f) => [f.k, f.v])));
  }
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setLastKey(""); onClose(); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          {fields.map((f) => (
            <label key={f.k} className="block space-y-1.5">
              <span className="text-body-sm text-text-secondary">{f.label}</span>
              {f.multi ? (
                <Textarea value={vals[f.k] ?? ""} onChange={(e) => setVals({ ...vals, [f.k]: e.target.value })} rows={3} />
              ) : (
                <Input
                  value={vals[f.k] ?? ""}
                  inputMode={f.code ? "numeric" : undefined}
                  placeholder={f.code ? "留空表示待确认" : undefined}
                  className={f.code ? "font-mono" : undefined}
                  onChange={(e) => setVals({ ...vals, [f.k]: f.code ? e.target.value.replace(/\D/g, "") : e.target.value })}
                />
              )}
            </label>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setLastKey(""); onClose(); }}>取消</Button>
          <Button onClick={() => { setLastKey(""); onSave(vals); }}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
