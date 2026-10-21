import { useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Bell, MessageSquareText, Plus, Search, Smartphone } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { categoryTag } from "@/lib/message-category";

export const Route = createFileRoute("/operations/message-config")({
  head: () => ({
    meta: [
      { title: "消息配置管理 — 奇点智牧" },
      { name: "description", content: "配置各类提醒的名称、文本、跳转页面、推送渠道与推送时间。" },
      { property: "og:title", content: "消息配置管理 — 奇点智牧" },
      { property: "og:description", content: "配置各类提醒的名称、文本、跳转页面、推送渠道与推送时间。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

const CATEGORIES = ["工单任务类", "药品类", "系统类", "其他类"] as const;
type Category = (typeof CATEGORIES)[number];
const JUMPS = ["牛只档案页", "工单详情页", "工单列表页", "任务列表页", "三级库详情页", "不跳转"] as const;
type Jump = (typeof JUMPS)[number];
type PushMode = "realtime" | "scheduled";

type Msg = {
  id: string;
  name: string;
  desc?: string;
  category: Category;
  template: string;
  variables: string[];
  jump: Jump;
  inApp: boolean;
  wecom: boolean;
  pushMode: PushMode;
  pushTime: string;
  enabled: boolean;
  recipients?: string[];
};

const ROLES = ["管理员", "场长", "兽医", "兽医助理", "免疫员", "修蹄工"];
const RECIPIENTS_BY_CAT: Record<string, string[]> = {
  工单任务类: ["第一责任人", ...ROLES, "牧场负责人"],
  药品类: ["药品领取人", "牧场负责人"],
  系统类: ["事件关联账户   "],
  其他类: [...ROLES, "牧场负责人"],
};


const INITIAL: Msg[] = [
  { id: "wo-due", name: "工单临期提醒", desc: "工单临近截止时间时提醒责任人尽快处理，避免任务逾期。", category: "工单任务类", template: "{工单类型}工单 {工单号}（牛号 {牛号}）将于 {截止时间} 到期，请尽快处理。", variables: ["工单类型", "工单号", "牛号", "截止时间"], jump: "工单详情页", inApp: true, wecom: true, pushMode: "realtime", pushTime: "08:00", enabled: true },
  { id: "wo-overdue", name: "工单逾期提醒", desc: "工单超过截止时间仍未完成，提醒责任人及管理层跟进。", category: "工单任务类", template: "{工单类型}工单 {工单号} 已逾期 {逾期时长}，执行人：{执行人}，请尽快跟进。", variables: ["工单类型", "工单号", "逾期时长", "执行人"], jump: "工单列表页", inApp: true, wecom: true, pushMode: "scheduled", pushTime: "09:00", enabled: true },
  { id: "wo-diagnose", name: "待诊断提醒", desc: "牧场人员上报疑似疾病后，提醒兽医及时给出诊断。", category: "工单任务类", template: "牛号 {牛号} 上报疑似 {疾病名称}，上报人 {上报人}，请及时诊断。", variables: ["牛号", "疾病名称", "上报人"], jump: "工单详情页", inApp: true, wecom: true, pushMode: "realtime", pushTime: "08:00", enabled: true },
  { id: "wo-abnormal", name: "工单异常提醒", desc: "工单执行中出现异常（如实际用药与处方不符），提醒相关人核查。", category: "工单任务类", template: "工单 {工单号} 出现异常：{异常描述}，牛号 {牛号}。", variables: ["工单号", "异常描述", "牛号"], jump: "牛只档案页", inApp: true, wecom: false, pushMode: "realtime", pushTime: "08:00", enabled: true },
  { id: "drug-pile", name: "药品堆积提醒", desc: "三级库某药品存量超过建议值，提醒及时消耗或调拨。", category: "药品类", template: "{药品名称} 在三级库 {库位} 堆积 {库存数量}，超过建议存量，请及时处理。", variables: ["药品名称", "库位", "库存数量"], jump: "三级库详情页", inApp: true, wecom: true, pushMode: "scheduled", pushTime: "08:30", enabled: true },
  { id: "drug-near", name: "药品临期提醒", desc: "药品临近有效期，提醒优先使用，减少过期损耗。", category: "药品类", template: "{药品名称}（批号 {批号}）将于 {有效期} 过期，剩余 {库存数量}。", variables: ["药品名称", "批号", "有效期", "库存数量"], jump: "三级库详情页", inApp: true, wecom: false, pushMode: "scheduled", pushTime: "08:30", enabled: true },
  { id: "drug-expired", name: "药品过期提醒", desc: "药品已超过有效期，提醒立即停用并下架处理。", category: "药品类", template: "{药品名称}（批号 {批号}）已于 {有效期} 过期，剩余 {库存数量}，请勿使用。", variables: ["药品名称", "批号", "有效期", "库存数量"], jump: "三级库详情页", inApp: true, wecom: true, pushMode: "realtime", pushTime: "08:00", enabled: true },
  { id: "sys-role", name: "角色权限变更提醒", desc: "账号在牧场的角色被调整时通知本人，了解当前可用功能。", category: "系统类", template: "您在 {牧场名称} 的角色已变更为 {角色名称}，操作人 {操作人}。", variables: ["牧场名称", "角色名称", "操作人"], jump: "不跳转", inApp: true, wecom: false, pushMode: "realtime", pushTime: "08:00", enabled: true },
  { id: "lab-result", name: "实验室结果更新提醒", desc: "送检样本的实验室结果回传后，提醒相关人员查看并处理。", category: "其他类", template: "牛号 {牛号} 的 {检测项目} 实验室结果已更新，请查看。", variables: ["牛号", "检测项目"], jump: "牛只档案页", inApp: true, wecom: true, pushMode: "realtime", pushTime: "08:00", enabled: false },
];

const varsOf = (c: Category) => [...new Set(INITIAL.filter((m) => m.category === c).flatMap((m) => m.variables))];
// 预览用示例值（模拟真实数据）
const SAMPLE: Record<string, string> = {
  工单类型: "疾病治疗", 工单号: "GD20261020-0137", 牛号: "#01-23-0412", 截止时间: "10月21日 18:00",
  逾期时长: "6小时", 执行人: "王建国", 疾病名称: "乳房炎", 上报人: "李明", 异常描述: "实际用药量与处方不符",
  药品名称: "头孢噻呋钠", 库位: "3号舍药品柜", 库存数量: "48支", 批号: "B240815", 有效期: "2026-11-30",
  牧场名称: "奇点一牧", 角色名称: "兽医", 操作人: "张伟", 检测项目: "隐性乳房炎检测",
};
const channelText = (m: Msg) => [m.inApp && "站内信", m.wecom && "企微消息"].filter(Boolean).join("、") || "—";
const timeText = (m: Msg) => (m.pushMode === "realtime" ? "实时推送" : `定时 ${m.pushTime}`);

function Page() {
  const [list, setList] = useState(INITIAL);
  const [kw, setKw] = useState("");
  const [cat, setCat] = useState<string>("全部");
  const [editing, setEditing] = useState<Msg | null>(null);

  const rows = useMemo(
    () => list.filter((m) => (cat === "全部" || m.category === cat) && (!kw || m.name.includes(kw))),
    [list, kw, cat],
  );

  const save = (m: Msg) => {
    if (!m.name.trim()) return toast.error("提醒名称不能为空");
    if (!m.template.trim()) return toast.error("提醒文本不能为空");
    if (!m.inApp && !m.wecom) return toast.error("请至少选择一个推送渠道");
    setList((p) => (p.some((x) => x.id === m.id) ? p.map((x) => (x.id === m.id ? m : x)) : [m, ...p]));
    setEditing(null);
    toast.success("消息配置已保存");
  };
  const openNew = () =>
    setEditing({ id: `new-${Date.now()}`, name: "", desc: "", category: "工单任务类", template: "", variables: varsOf("工单任务类"), jump: "不跳转", inApp: true, wecom: false, pushMode: "realtime", pushTime: "08:00", enabled: true });

  return (
    <>
      <AppHeader title="消息配置管理" breadcrumb={["运营管理", "消息配置管理"]} />
      <main className="flex-1 px-6 py-6 space-y-4">
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" />
              <Input value={kw} onChange={(e) => setKw(e.target.value)} placeholder="搜索提醒名称" className="h-9 pl-8 text-body-sm" />
            </div>
            <Select value={cat} onValueChange={setCat}>
              <SelectTrigger className="h-9 w-36 text-body-sm">
                <SelectValue placeholder="消息类型" />
              </SelectTrigger>
              <SelectContent>
                {["全部", ...CATEGORIES].map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button className="ml-auto h-9" onClick={openNew}>
              <Plus className="size-4" />
              新增消息配置
            </Button>
          </div>

          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-body-sm">
              <thead className="bg-surface-subtle text-text-secondary">
                <tr className="h-12">
                  {["消息名称", "消息类型", "提醒文本", "跳转界面", "推送渠道", "推送时间", "启用", "操作"].map((h) => (
                    <th key={h} className="px-4 text-left font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => (
                  <tr key={m.id} className="border-t border-border h-12">
                    <td className="px-4 py-3 whitespace-nowrap text-foreground font-medium">{m.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap"><span className={`tag ${categoryTag(m.category)}`}>{m.category}</span></td>
                    <td className="px-4 py-3 text-text-secondary max-w-[360px]"><div className="line-clamp-2">{m.template}</div></td>
                    <td className="px-4 py-3 whitespace-nowrap text-text-secondary">{m.jump}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-foreground">{channelText(m)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-text-secondary">{timeText(m)}</td>
                    <td className="px-4 py-3">
                      <Switch checked={m.enabled} onCheckedChange={(v) => setList((p) => p.map((x) => (x.id === m.id ? { ...x, enabled: v } : x)))} />
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm" className="h-8 px-0 text-primary hover:bg-transparent hover:text-primary/80" onClick={() => setEditing({ ...m })}>
                        配置
                      </Button>
                    </td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-text-tertiary">暂无匹配的提醒</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent className="w-[560px] sm:max-w-[560px] overflow-y-auto">
          {editing && <EditForm key={editing.id} value={editing} onChange={setEditing} onSave={save} />}
        </SheetContent>
      </Sheet>
    </>
  );
}

function EditForm({ value: m, onChange, onSave }: { value: Msg; onChange: (m: Msg) => void; onSave: (m: Msg) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const set = (p: Partial<Msg>) => onChange({ ...m, ...p });
  const insertVar = (v: string) => {
    const el = ref.current;
    const s = el?.selectionStart ?? m.template.length;
    const e = el?.selectionEnd ?? m.template.length;
    set({ template: m.template.slice(0, s) + `{${v}}` + m.template.slice(e) });
  };
  const preview = m.template.replace(/\{([^}]+)\}/g, (_, k) => SAMPLE[k] ?? k);

  return (
    <>
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2"><MessageSquareText className="h-4 w-4 text-primary" />配置提醒 · {m.category}</SheetTitle>
      </SheetHeader>
      <div className="space-y-6 py-4">
        <Section title="提醒名称">
          <Input value={m.name} onChange={(e) => set({ name: e.target.value })} maxLength={20} placeholder="请输入提醒名称" className="h-9 text-body-sm" />
        </Section>

        <Section title="消息描述">
          <Textarea value={m.desc ?? ""} onChange={(e) => set({ desc: e.target.value })} rows={2} maxLength={60} placeholder="说明这条消息用于什么场景" className="text-body-sm" />
        </Section>

        <Section title="消息类型">
          <Select value={m.category} onValueChange={(v) => set({ category: v as Category, variables: varsOf(v as Category), recipients: (m.recipients ?? []).filter((r) => RECIPIENTS_BY_CAT[v].includes(r)) })}>
            <SelectTrigger className="h-9 text-body-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </Section>

        <Section title="提醒文本">
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

        <Section title="接收人">
          <div className="flex flex-wrap gap-2">
            {RECIPIENTS_BY_CAT[m.category].map((r) => {
              const on = (m.recipients ?? []).includes(r);
              return (
                <button key={r} type="button"
                  onClick={() => set({ recipients: on ? (m.recipients ?? []).filter((x) => x !== r) : [...(m.recipients ?? []), r] })}
                  className={`h-8 px-3 rounded-md border text-body-sm transition-colors ${on ? "border-primary bg-brand-subtle text-primary" : "border-border text-text-secondary hover:border-primary"}`}>
                  {r}
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="跳转界面">
          <Select value={m.jump} onValueChange={(v) => set({ jump: v as Jump })}>
            <SelectTrigger className="h-9 text-body-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {JUMPS.map((j) => <SelectItem key={j} value={j}>{j}</SelectItem>)}
            </SelectContent>
          </Select>
        </Section>

        <Section title="推送渠道">
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-body-sm"><Checkbox checked={m.inApp} onCheckedChange={(c) => set({ inApp: !!c })} /><Bell className="h-3.5 w-3.5 text-primary" />站内信</label>
            <label className="flex items-center gap-2 text-body-sm"><Checkbox checked={m.wecom} onCheckedChange={(c) => set({ wecom: !!c })} /><Smartphone className="h-3.5 w-3.5 text-primary" />企微消息</label>
          </div>
        </Section>

        <Section title="推送时间">
          <RadioGroup value={m.pushMode} onValueChange={(v) => set({ pushMode: v as PushMode })} className="flex gap-6">
            {([["realtime", "实时推送"], ["scheduled", "定时推送"]] as const).map(([v, l]) => (
              <div key={v} className="flex items-center gap-2">
                <RadioGroupItem value={v} id={`pm-${v}`} />
                <Label htmlFor={`pm-${v}`} className="text-body-sm font-normal">{l}</Label>
              </div>
            ))}
          </RadioGroup>
          {m.pushMode === "scheduled" && (
            <div className="flex items-center gap-2 mt-3">
              <span className="text-body-sm text-text-secondary">每日推送时间</span>
              <Input type="time" value={m.pushTime} onChange={(e) => set({ pushTime: e.target.value })} className="h-9 w-32" />
            </div>
          )}
        </Section>

        <Section title="启用状态">
          <div className="flex items-center gap-2">
            <Switch checked={m.enabled} onCheckedChange={(v) => set({ enabled: v })} />
            <span className="text-body-sm text-text-secondary">{m.enabled ? "已启用" : "已停用"}</span>
          </div>
        </Section>
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
