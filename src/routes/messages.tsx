import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bell, MessageSquareText, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/messages")({
  head: () => ({
    meta: [
      { title: "消息管理 — 奇点智牧" },
      { name: "description", content: "配置各类业务消息的接收对象、文本模板、站内信与企微消息卡片渠道及推送时间。" },
      { property: "og:title", content: "消息管理 — 奇点智牧" },
      { property: "og:description", content: "配置各类业务消息的接收对象、文本模板、站内信与企微消息卡片渠道及推送时间。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MessagesPage,
});

const ROLES = ["超级管理员", "场长", "兽医", "兽医助理", "仓管员", "区域经理"];
const CATEGORIES = ["工单", "药品", "牛只", "系统"] as const;

type PushMode = "instant" | "scheduled";
type MsgType = {
  id: string;
  name: string;
  category: (typeof CATEGORIES)[number];
  trigger: string;
  receivers: string[];
  template: string;
  inApp: boolean;
  wecom: boolean;
  pushMode: PushMode;
  pushTimes: string[];
  quietNight: boolean;
  enabled: boolean;
};

const VARS = ["{牧场}", "{牛舍}", "{牛号}", "{工单类型}", "{工单号}", "{药品名称}", "{库存}", "{数量}", "{执行人}", "{日期}"];

const INITIAL: MsgType[] = [
  { id: "wo-assign", name: "工单派发提醒", category: "工单", trigger: "新工单创建并指派执行人", receivers: ["兽医", "兽医助理"], template: "【{牧场}】您有新的{工单类型}工单 {工单号}，牛号 {牛号}（{牛舍}），请及时处理。", inApp: true, wecom: true, pushMode: "instant", pushTimes: [], quietNight: true, enabled: true },
  { id: "wo-overdue", name: "工单超时提醒", category: "工单", trigger: "工单超过计划完成时间未执行", receivers: ["场长", "兽医"], template: "【{牧场}】{工单类型}工单 {工单号} 已超时，执行人 {执行人}，请督促处理。", inApp: true, wecom: true, pushMode: "scheduled", pushTimes: ["08:30", "16:30"], quietNight: true, enabled: true },
  { id: "wo-today", name: "今日任务汇总", category: "工单", trigger: "每日定时汇总当日待办", receivers: ["场长", "兽医", "兽医助理"], template: "【{牧场}】{日期} 今日共有 {数量} 项待办任务，请登录小程序查看。", inApp: false, wecom: true, pushMode: "scheduled", pushTimes: ["07:30"], quietNight: false, enabled: true },
  { id: "drug-low", name: "药品库存预警", category: "药品", trigger: "库存低于安全库存", receivers: ["仓管员", "场长"], template: "【{牧场}】{药品名称} 当前库存 {库存}，已低于安全库存，请及时补货。", inApp: true, wecom: true, pushMode: "scheduled", pushTimes: ["09:00"], quietNight: true, enabled: true },
  { id: "drug-expire", name: "药品临期提醒", category: "药品", trigger: "药品距有效期不足 30 天", receivers: ["仓管员"], template: "【{牧场}】{药品名称} 将于 {日期} 过期，剩余 {数量}，请优先使用。", inApp: true, wecom: false, pushMode: "instant", pushTimes: [], quietNight: true, enabled: true },
  { id: "drug-loss", name: "损耗待判定", category: "药品", trigger: "提交损耗上报且需判定", receivers: ["场长"], template: "【{牧场}】{执行人} 提交了 {药品名称} 损耗 {数量}，待您判定。", inApp: true, wecom: true, pushMode: "instant", pushTimes: [], quietNight: true, enabled: true },
  { id: "cow-withdraw", name: "休药期结束提醒", category: "牛只", trigger: "牛只休药期到期", receivers: ["兽医", "场长"], template: "【{牧场}】牛号 {牛号}（{牛舍}）休药期已于 {日期} 结束。", inApp: true, wecom: false, pushMode: "instant", pushTimes: [], quietNight: true, enabled: true },
  { id: "cow-alert", name: "外接设备异常告警", category: "牛只", trigger: "体温/活动量设备上报异常", receivers: ["兽医"], template: "【{牧场}】牛号 {牛号}（{牛舍}）设备检测异常，请尽快排查。", inApp: true, wecom: true, pushMode: "instant", pushTimes: [], quietNight: false, enabled: true },
  { id: "sys-account", name: "账号权限变更", category: "系统", trigger: "账号角色或牧场权限变更", receivers: ["超级管理员"], template: "账号 {执行人} 的权限已于 {日期} 变更，请知悉。", inApp: true, wecom: false, pushMode: "instant", pushTimes: [], quietNight: true, enabled: false },
];

function preview(t: string) {
  const sample: Record<string, string> = { "{牧场}": "一牧场", "{牛舍}": "3号泌乳舍", "{牛号}": "250312", "{工单类型}": "疾病治疗", "{工单号}": "WO20261008001", "{药品名称}": "头孢噻呋钠", "{库存}": "12 瓶", "{数量}": "8", "{执行人}": "李明", "{日期}": "2026-10-08" };
  return t.replace(/\{[^}]+\}/g, (m) => sample[m] ?? m);
}

function ChannelTag({ on, label }: { on: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-caption ${on ? "bg-brand-subtle text-primary" : "bg-muted text-text-tertiary line-through"}`}>
      {label}
    </span>
  );
}

function MessagesPage() {
  const [items, setItems] = useState(INITIAL);
  const [cat, setCat] = useState<string>("all");
  const [kw, setKw] = useState("");
  const [editing, setEditing] = useState<MsgType | null>(null);

  const list = useMemo(
    () => items.filter((i) => (cat === "all" || i.category === cat) && (!kw || i.name.includes(kw) || i.template.includes(kw))),
    [items, cat, kw],
  );

  const save = () => {
    if (!editing) return;
    if (!editing.template.trim()) return toast.error("文本模板不能为空");
    if (!editing.inApp && !editing.wecom) return toast.error("请至少选择一个推送渠道");
    if (!editing.receivers.length) return toast.error("请至少选择一个接收对象");
    if (editing.wecom && editing.pushMode === "scheduled" && !editing.pushTimes.length) return toast.error("请设置企微卡片推送时间");
    setItems((p) => p.map((i) => (i.id === editing.id ? editing : i)));
    setEditing(null);
    toast.success("消息配置已保存");
  };

  const upd = (patch: Partial<MsgType>) => setEditing((e) => (e ? { ...e, ...patch } : e));

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-page-title text-foreground">消息管理</h1>
        <p className="text-body-sm text-text-secondary mt-1">配置各类业务消息的接收对象、文本模板与推送渠道</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { l: "消息类型", v: items.length },
          { l: "已启用", v: items.filter((i) => i.enabled).length },
          { l: "启用站内信", v: items.filter((i) => i.inApp).length },
          { l: "启用企微卡片", v: items.filter((i) => i.wecom).length },
        ].map((s) => (
          <div key={s.l} className="rounded-lg border border-border bg-card p-6">
            <div className="text-caption text-text-tertiary">{s.l}</div>
            <div className="text-page-title text-foreground tabular-nums mt-1">{s.v}</div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <div className="flex gap-1">
            {["all", ...CATEGORIES].map((c) => (
              <button key={c} onClick={() => setCat(c)} className={`h-8 px-3 rounded-md text-body-sm ${cat === c ? "bg-brand-subtle text-primary font-medium" : "text-text-secondary hover:bg-muted"}`}>
                {c === "all" ? "全部" : c}
              </button>
            ))}
          </div>
          <div className="relative ml-auto w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
            <Input value={kw} onChange={(e) => setKw(e.target.value)} placeholder="搜索消息名称或模板" className="pl-8 h-8" />
          </div>
        </div>
        <table className="w-full text-body-sm">
          <thead className="bg-muted/40 text-text-secondary">
            <tr className="h-12 text-left">
              <th className="px-4 font-medium w-[180px]">消息类型</th>
              <th className="px-4 font-medium w-[200px]">接收对象</th>
              <th className="px-4 font-medium">文本模板</th>
              <th className="px-4 font-medium w-[170px]">推送渠道</th>
              <th className="px-4 font-medium w-[150px]">企微推送时间</th>
              <th className="px-4 font-medium w-[80px]">启用</th>
              <th className="px-4 font-medium w-[80px]">操作</th>
            </tr>
          </thead>
          <tbody>
            {list.map((i) => (
              <tr key={i.id} className="border-t border-border align-top">
                <td className="px-4 py-3">
                  <div className="text-foreground font-medium">{i.name}</div>
                  <div className="text-caption text-text-tertiary mt-0.5">{i.category} · {i.trigger}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {i.receivers.map((r) => (
                      <span key={r} className="rounded bg-muted px-1.5 py-0.5 text-caption text-text-secondary">{r}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-text-secondary">{i.template}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <ChannelTag on={i.inApp} label="站内信" />
                    <ChannelTag on={i.wecom} label="企微卡片" />
                  </div>
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  {!i.wecom ? "—" : i.pushMode === "instant" ? "触发即推送" : `每日 ${i.pushTimes.join("、")}`}
                </td>
                <td className="px-4 py-3">
                  <Switch
                    checked={i.enabled}
                    onCheckedChange={(v) => {
                      setItems((p) => p.map((x) => (x.id === i.id ? { ...x, enabled: v } : x)));
                      toast.success(v ? `已启用「${i.name}」` : `已停用「${i.name}」`);
                    }}
                  />
                </td>
                <td className="px-4 py-3">
                  <button className="text-primary hover:underline" onClick={() => setEditing({ ...i, receivers: [...i.receivers], pushTimes: [...i.pushTimes] })}>配置</button>
                </td>
              </tr>
            ))}
            {!list.length && (
              <tr><td colSpan={7} className="py-12 text-center text-text-tertiary">暂无匹配的消息类型</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent className="w-[560px] sm:max-w-[560px] overflow-y-auto">
          {editing && (
            <>
              <SheetHeader>
                <SheetTitle>配置「{editing.name}」</SheetTitle>
                <SheetDescription>触发条件：{editing.trigger}</SheetDescription>
              </SheetHeader>
              <div className="space-y-6 py-6">
                <section className="space-y-2">
                  <Label>接收对象（按角色）</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {ROLES.map((r) => (
                      <label key={r} className="flex items-center gap-2 text-body-sm">
                        <Checkbox
                          checked={editing.receivers.includes(r)}
                          onCheckedChange={(v) => upd({ receivers: v ? [...editing.receivers, r] : editing.receivers.filter((x) => x !== r) })}
                        />
                        {r}
                      </label>
                    ))}
                  </div>
                  <p className="text-caption text-text-tertiary">仅推送给对应牧场下拥有该角色的账号</p>
                </section>

                <section className="space-y-2">
                  <Label>文本模板</Label>
                  <Textarea rows={4} value={editing.template} onChange={(e) => upd({ template: e.target.value })} />
                  <div className="flex flex-wrap gap-1">
                    {VARS.map((v) => (
                      <button key={v} type="button" onClick={() => upd({ template: editing.template + v })} className="rounded border border-border px-1.5 py-0.5 text-caption text-text-secondary hover:border-primary hover:text-primary">
                        {v}
                      </button>
                    ))}
                  </div>
                  <div className="rounded-md bg-muted/50 p-3 text-body-sm text-text-secondary">
                    <span className="text-caption text-text-tertiary">预览：</span>{preview(editing.template)}
                  </div>
                </section>

                <section className="space-y-3">
                  <Label>推送渠道</Label>
                  <label className="flex items-center justify-between rounded-md border border-border p-3">
                    <span className="flex items-center gap-2 text-body-sm"><Bell className="h-4 w-4 text-primary" />站内信</span>
                    <Switch checked={editing.inApp} onCheckedChange={(v) => upd({ inApp: v })} />
                  </label>
                  <div className="rounded-md border border-border p-3 space-y-3">
                    <label className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-body-sm"><MessageSquareText className="h-4 w-4 text-primary" />企微消息卡片</span>
                      <Switch checked={editing.wecom} onCheckedChange={(v) => upd({ wecom: v })} />
                    </label>
                    {editing.wecom && (
                      <div className="space-y-3 border-t border-border pt-3">
                        <div className="flex items-center gap-3">
                          <span className="text-body-sm text-text-secondary w-20">推送时间</span>
                          <Select value={editing.pushMode} onValueChange={(v) => upd({ pushMode: v as PushMode, pushTimes: v === "scheduled" && !editing.pushTimes.length ? ["09:00"] : editing.pushTimes })}>
                            <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="instant">触发即推送</SelectItem>
                              <SelectItem value="scheduled">每日定时汇总</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {editing.pushMode === "scheduled" && (
                          <div className="pl-[92px] space-y-2">
                            {editing.pushTimes.map((t, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <Input type="time" value={t} className="h-8 w-32" onChange={(e) => upd({ pushTimes: editing.pushTimes.map((x, j) => (j === idx ? e.target.value : x)) })} />
                                <button className="text-caption text-text-tertiary hover:text-destructive" onClick={() => upd({ pushTimes: editing.pushTimes.filter((_, j) => j !== idx) })}>移除</button>
                              </div>
                            ))}
                            {editing.pushTimes.length < 4 && (
                              <button className="text-caption text-primary" onClick={() => upd({ pushTimes: [...editing.pushTimes, "17:00"] })}>+ 添加推送时间</button>
                            )}
                          </div>
                        )}
                        <label className="flex items-center gap-2 text-body-sm">
                          <Checkbox checked={editing.quietNight} onCheckedChange={(v) => upd({ quietNight: !!v })} />
                          夜间免打扰（22:00–07:00 的消息顺延至 07:00 推送）
                        </label>
                        <div className="rounded-md bg-muted/50 p-3">
                          <div className="text-caption text-text-tertiary mb-1">卡片预览</div>
                          <div className="rounded-md bg-card border border-border p-3">
                            <div className="text-body-sm font-medium text-foreground">{editing.name}</div>
                            <div className="text-caption text-text-secondary mt-1">{preview(editing.template)}</div>
                            <div className="text-caption text-primary mt-2 border-t border-border pt-2">查看详情</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              </div>
              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <Button variant="outline" onClick={() => setEditing(null)}>取消</Button>
                <Button onClick={save}>保存</Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
