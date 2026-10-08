import { useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Bell, MessageSquareText, Pencil, Search, Smartphone } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export const Route = createFileRoute("/messages")({
  head: () => ({
    meta: [
      { title: "消息管理 — 奇点智牧" },
      { name: "description", content: "配置各类消息的接收对象、文本模板、发送渠道与企微卡片推送时间。" },
      { property: "og:title", content: "消息管理 — 奇点智牧" },
      { property: "og:description", content: "配置各类消息的接收对象、文本模板、发送渠道与企微卡片推送时间。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MessagesPage,
});

const ROLES = ["超级管理员", "场长", "兽医", "兽医助理", "免疫员", "修蹄师", "仓管"] as const;

type PushMode = "realtime" | "scheduled" | "daily";
type MsgType = {
  id: string;
  name: string;
  category: "工单" | "药品" | "牛只" | "系统";
  trigger: string;
  receivers: string[];
  template: string;
  variables: string[];
  inApp: boolean;
  wecom: boolean;
  pushMode: PushMode;
  pushTime: string;
  enabled: boolean;
};

const INITIAL: MsgType[] = [
  { id: "wo-assign", name: "工单下发", category: "工单", trigger: "工单被派发给执行人时", receivers: ["兽医", "兽医助理"], template: "您有一条新的{工单类型}工单：牛号 {牛号}，所在牛舍 {牛舍}，请于 {截止时间} 前处理。", variables: ["工单类型", "牛号", "牛舍", "截止时间"], inApp: true, wecom: true, pushMode: "realtime", pushTime: "08:00", enabled: true },
  { id: "wo-overdue", name: "工单超时提醒", category: "工单", trigger: "工单超过截止时间未完成", receivers: ["场长", "兽医"], template: "{工单类型}工单 {工单号} 已超时 {超时时长}，执行人：{执行人}，请尽快跟进。", variables: ["工单类型", "工单号", "超时时长", "执行人"], inApp: true, wecom: true, pushMode: "scheduled", pushTime: "09:00", enabled: true },
  { id: "diag-confirm", name: "诊断待确认", category: "工单", trigger: "上报的疑似病例等待诊断", receivers: ["场长", "兽医"], template: "牛号 {牛号} 上报疑似 {疾病名称}，上报人 {上报人}，请及时诊断确认。", variables: ["牛号", "疾病名称", "上报人"], inApp: true, wecom: false, pushMode: "realtime", pushTime: "08:00", enabled: true },
  { id: "withdrawal", name: "休药期到期", category: "牛只", trigger: "牛只休药期结束当天", receivers: ["场长", "兽医"], template: "今日共有 {数量} 头牛休药期到期，可恢复正常挤奶：{牛号列表}。", variables: ["数量", "牛号列表"], inApp: true, wecom: true, pushMode: "daily", pushTime: "07:30", enabled: true },
  { id: "abnormal", name: "异常反馈", category: "牛只", trigger: "一线人员提交异常反馈", receivers: ["场长"], template: "{上报人} 反馈牛号 {牛号} 异常：{异常描述}。", variables: ["上报人", "牛号", "异常描述"], inApp: true, wecom: false, pushMode: "realtime", pushTime: "08:00", enabled: true },
  { id: "stock-low", name: "药品库存预警", category: "药品", trigger: "药品库存低于安全库存", receivers: ["场长", "仓管"], template: "{药品名称} 当前库存 {库存数量}，低于安全库存 {安全库存}，请及时补货。", variables: ["药品名称", "库存数量", "安全库存"], inApp: true, wecom: true, pushMode: "daily", pushTime: "08:30", enabled: true },
  { id: "drug-expire", name: "药品临期提醒", category: "药品", trigger: "药品距有效期不足 30 天", receivers: ["仓管"], template: "{药品名称}（批号 {批号}）将于 {有效期} 过期，剩余 {库存数量}。", variables: ["药品名称", "批号", "有效期", "库存数量"], inApp: true, wecom: false, pushMode: "daily", pushTime: "08:30", enabled: false },
  { id: "monthly", name: "月度报告生成", category: "系统", trigger: "每月 1 日生成上月报告", receivers: ["超级管理员", "场长"], template: "{牧场名称} {月份} 月度报告已生成，点击查看详情。", variables: ["牧场名称", "月份"], inApp: true, wecom: true, pushMode: "scheduled", pushTime: "10:00", enabled: true },
];

const pushLabel = (m: MsgType) =>
  !m.wecom ? "—" : m.pushMode === "realtime" ? "实时推送" : m.pushMode === "daily" ? `每日汇总 ${m.pushTime}` : `定时 ${m.pushTime}`;

function MessagesPage() {
  const [list, setList] = useState(INITIAL);
  const [kw, setKw] = useState("");
  const [cat, setCat] = useState<string>("全部");
  const [editing, setEditing] = useState<MsgType | null>(null);

  const rows = useMemo(
    () => list.filter((m) => (cat === "全部" || m.category === cat) && (!kw || m.name.includes(kw))),
    [list, kw, cat],
  );

  const toggle = (id: string, enabled: boolean) =>
    setList((p) => p.map((m) => (m.id === id ? { ...m, enabled } : m)));

  const save = (m: MsgType) => {
    if (!m.inApp && !m.wecom) return toast.error("请至少选择一个发送渠道");
    if (!m.receivers.length) return toast.error("请至少选择一个接收对象");
    if (!m.template.trim()) return toast.error("文本模板不能为空");
    setList((p) => p.map((x) => (x.id === m.id ? m : x)));
    setEditing(null);
    toast.success("消息配置已保存");
  };

  return (
    <>
      <AppHeader title="消息管理" breadcrumb={["消息管理"]} />
      <main className="flex-1 px-6 py-6 space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat label="消息类型" value={list.length} />
          <Stat label="已启用" value={list.filter((m) => m.enabled).length} />
          <Stat label="站内信" value={list.filter((m) => m.inApp).length} />
          <Stat label="企微消息卡片" value={list.filter((m) => m.wecom).length} />
        </div>

        <Card className="border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" />
              <Input value={kw} onChange={(e) => setKw(e.target.value)} placeholder="搜索消息类型" className="h-9 pl-8 text-body-sm" />
            </div>
            <div className="flex gap-1">
              {["全部", "工单", "药品", "牛只", "系统"].map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={`h-8 px-3 rounded-md text-body-sm border ${cat === c ? "border-primary text-primary bg-brand-subtle" : "border-border text-text-secondary"}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-body-sm">
              <thead className="bg-surface-subtle text-text-secondary">
                <tr className="h-12">
                  {["消息类型", "触发条件", "接收对象", "文本模板", "发送渠道", "企微推送时间", "启用", "操作"].map((h) => (
                    <th key={h} className="px-4 text-left font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => (
                  <tr key={m.id} className="border-t border-border align-top">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-foreground font-medium">{m.name}</div>
                      <span className="tag tag-muted mt-1">{m.category}</span>
                    </td>
                    <td className="px-4 py-3 text-text-secondary min-w-[160px]">{m.trigger}</td>
                    <td className="px-4 py-3 min-w-[140px]">
                      <div className="flex flex-wrap gap-1">
                        {m.receivers.map((r) => <span key={r} className="tag tag-info">{r}</span>)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary max-w-[320px]"><div className="line-clamp-2">{m.template}</div></td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        {m.inApp && <span className="inline-flex items-center gap-1 text-foreground"><Bell className="h-3.5 w-3.5 text-primary" />站内信</span>}
                        {m.wecom && <span className="inline-flex items-center gap-1 text-foreground"><Smartphone className="h-3.5 w-3.5 text-primary" />企微卡片</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-text-secondary">{pushLabel(m)}</td>
                    <td className="px-4 py-3"><Switch checked={m.enabled} onCheckedChange={(v) => toggle(m.id, v)} /></td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm" className="h-8 gap-1 text-primary" onClick={() => setEditing({ ...m })}>
                        <Pencil className="h-3.5 w-3.5" />配置
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>

      <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent className="w-[560px] sm:max-w-[560px] overflow-y-auto">
          {editing && <EditForm key={editing.id} value={editing} onChange={setEditing} onSave={save} />}
        </SheetContent>
      </Sheet>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="border-border bg-card p-6">
      <div className="text-caption text-text-tertiary">{label}</div>
      <div className="text-page-title text-foreground mt-1">{value}</div>
    </Card>
  );
}

function EditForm({ value: m, onChange, onSave }: { value: MsgType; onChange: (m: MsgType) => void; onSave: (m: MsgType) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const set = (p: Partial<MsgType>) => onChange({ ...m, ...p });
  const insertVar = (v: string) => {
    const el = ref.current;
    const token = `{${v}}`;
    const s = el?.selectionStart ?? m.template.length;
    const e = el?.selectionEnd ?? m.template.length;
    set({ template: m.template.slice(0, s) + token + m.template.slice(e) });
  };
  const preview = m.template.replace(/\{([^}]+)\}/g, (_, k) => `【${k}】`);

  return (
    <>
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2"><MessageSquareText className="h-4 w-4 text-primary" />配置消息 · {m.name}</SheetTitle>
      </SheetHeader>
      <div className="space-y-6 py-4">
        <Section title="触发条件"><p className="text-body-sm text-text-secondary">{m.trigger}</p></Section>

        <Section title="接收对象">
          <div className="grid grid-cols-3 gap-2">
            {ROLES.map((r) => (
              <label key={r} className="flex items-center gap-2 text-body-sm">
                <Checkbox
                  checked={m.receivers.includes(r)}
                  onCheckedChange={(c) => set({ receivers: c ? [...m.receivers, r] : m.receivers.filter((x) => x !== r) })}
                />
                {r}
              </label>
            ))}
          </div>
        </Section>

        <Section title="文本模板">
          <Textarea ref={ref} value={m.template} onChange={(e) => set({ template: e.target.value })} rows={4} className="text-body-sm" />
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="text-caption text-text-tertiary">插入变量：</span>
            {m.variables.map((v) => (
              <button key={v} type="button" onClick={() => insertVar(v)} className="tag tag-info cursor-pointer">{`{${v}}`}</button>
            ))}
          </div>
          <div className="mt-3 rounded-md bg-surface-subtle p-3 text-body-sm text-text-secondary">
            <div className="text-caption text-text-tertiary mb-1">预览</div>
            {preview}
          </div>
        </Section>

        <Section title="发送渠道">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-body-sm"><Checkbox checked={m.inApp} onCheckedChange={(c) => set({ inApp: !!c })} />站内信（系统右上角通知）</label>
            <label className="flex items-center gap-2 text-body-sm"><Checkbox checked={m.wecom} onCheckedChange={(c) => set({ wecom: !!c })} />企微消息卡片</label>
          </div>
        </Section>

        {m.wecom && (
          <Section title="企微卡片推送时间">
            <RadioGroup value={m.pushMode} onValueChange={(v) => set({ pushMode: v as PushMode })} className="space-y-2">
              {([["realtime", "实时推送（事件触发后立即发送）"], ["scheduled", "定时推送（当天指定时间发送）"], ["daily", "每日汇总（指定时间合并为一张卡片）"]] as const).map(([v, l]) => (
                <div key={v} className="flex items-center gap-2">
                  <RadioGroupItem value={v} id={`pm-${v}`} />
                  <Label htmlFor={`pm-${v}`} className="text-body-sm font-normal">{l}</Label>
                </div>
              ))}
            </RadioGroup>
            {m.pushMode !== "realtime" && (
              <div className="flex items-center gap-2 mt-3">
                <span className="text-body-sm text-text-secondary">推送时间</span>
                <Input type="time" value={m.pushTime} onChange={(e) => set({ pushTime: e.target.value })} className="h-9 w-32" />
              </div>
            )}
          </Section>
        )}
      </div>
      <SheetFooter>
        <Button onClick={() => onSave(m)}>保存配置</Button>
      </SheetFooter>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-card-title text-foreground mb-2">{title}</div>
      {children}
    </div>
  );
}
