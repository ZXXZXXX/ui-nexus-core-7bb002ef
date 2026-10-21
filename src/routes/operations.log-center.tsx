import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search, SlidersHorizontal } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { categoryTag } from "@/lib/message-category";

export const Route = createFileRoute("/operations/log-center")({
  head: () => ({
    meta: [
      { title: "日志中心 — 奇点智牧" },
      { name: "description", content: "查看与第三方系统的接口交互记录，以及消息推送与查看的日志。" },
      { property: "og:title", content: "日志中心 — 奇点智牧" },
      { property: "og:description", content: "查看与第三方系统的接口交互记录，以及消息推送与查看的日志。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

// ============ 第三方交互日志 ============
type ApiStatus = "成功" | "失败" | "重试中";
type ApiLog = {
  id: string;
  time: string;
  system: string;
  direction: "推送" | "拉取";
  event: string;
  bizKey: string;
  farm: string;
  status: ApiStatus;
  cost: number;
  trigger: string;
  endpoint: string;
  request: string;
  response: string;
  error?: string;
  retry: number;
};

const API_LOGS: ApiLog[] = [
  { id: "AP-20260142-01", time: "2026-05-19 09:12:07", system: "UD 平台", direction: "推送", event: "诊断事件回传", bizKey: "UDX-DIS-0031", farm: "奶牛一场", status: "成功", cost: 214, trigger: "工单提交触发", endpoint: "POST /ud/v2/diagnosis/events", request: '{"cattleNo":"2310","udCode":"UDX-DIS-0031","disease":"乳房炎","vet":"张磊","occurredAt":"2026-05-19T09:12:00+08:00"}', response: '{"code":0,"message":"ok","udEventId":"EVT-77410"}', retry: 0 },
  { id: "AP-20260142-02", time: "2026-05-19 09:12:09", system: "UD 平台", direction: "拉取", event: "工作单同步", bizKey: "WO-UD-5582", farm: "全部牧场", status: "成功", cost: 486, trigger: "定时任务 · 每 15 分钟", endpoint: "GET /ud/v2/work-orders?since=2026-05-19T09:00", request: '{"since":"2026-05-19T09:00:00+08:00","pageSize":50}', response: '{"code":0,"total":3,"items":["WO-UD-5582","WO-UD-5583","WO-UD-5584"]}', retry: 0 },
  { id: "AP-20260142-03", time: "2026-05-19 09:05:31", system: "企业微信", direction: "推送", event: "消息下发", bizKey: "MSG-90112", farm: "奶牛一场", status: "失败", cost: 1532, trigger: "工单临期提醒", endpoint: "POST /cgi-bin/message/send", request: '{"touser":"li_ming","msgtype":"text","content":"工单 WO-2026-0142 将于 10:00 到期"}', response: '{"errcode":45009,"errmsg":"api freq out of limit"}', error: "接口调用超过频率限制（45009），已进入重试队列。", retry: 2 },
  { id: "AP-20260142-04", time: "2026-05-19 08:58:14", system: "UD 平台", direction: "推送", event: "牛只档案同步", bizKey: "2310", farm: "奶牛一场", status: "成功", cost: 302, trigger: "档案编辑触发", endpoint: "PUT /ud/v2/animals/2310", request: '{"cattleNo":"2310","parity":3,"avgYield":28.4,"barn":"A2"}', response: '{"code":0,"message":"ok"}', retry: 0 },
  { id: "AP-20260142-05", time: "2026-05-19 08:45:02", system: "实验室系统", direction: "拉取", event: "检测结果同步", bizKey: "LAB-20260142-07", farm: "全部牧场", status: "成功", cost: 738, trigger: "定时任务 · 每日 08:45", endpoint: "GET /lab/v1/results?date=2026-05-19", request: '{"date":"2026-05-19","dept":"乳房炎组"}', response: '{"code":0,"total":7,"updated":2}', retry: 0 },
  { id: "AP-20260142-06", time: "2026-05-19 08:30:55", system: "UD 平台", direction: "推送", event: "诊断事件回传", bizKey: "UDX-DIS-0028", farm: "奶牛二场", status: "重试中", cost: 1204, trigger: "工单提交触发", endpoint: "POST /ud/v2/diagnosis/events", request: '{"cattleNo":"1872","udCode":"UDX-DIS-0028","disease":"口蹄疫疑似","vet":"李明"}', response: '{"code":5003,"message":"gateway timeout"}', error: "网关超时（5003），第 3 次重试等待中。", retry: 3 },
  { id: "AP-20260142-07", time: "2026-05-19 08:15:20", system: "企业微信", direction: "推送", event: "消息下发", bizKey: "MSG-90108", farm: "全部牧场", status: "成功", cost: 168, trigger: "药品过期提醒", endpoint: "POST /cgi-bin/message/send", request: '{"touser":"wang_fang","msgtype":"text","content":"口蹄疫疫苗 A 型（批号 B23K0518）已过期"}', response: '{"errcode":0,"errmsg":"ok","msgid":"MW-33120"}', retry: 0 },
  { id: "AP-20260142-08", time: "2026-05-19 08:00:11", system: "UD 平台", direction: "拉取", event: "工作单同步", bizKey: "WO-UD-5579", farm: "全部牧场", status: "成功", cost: 452, trigger: "定时任务 · 每 15 分钟", endpoint: "GET /ud/v2/work-orders?since=2026-05-19T07:45", request: '{"since":"2026-05-19T07:45:00+08:00","pageSize":50}', response: '{"code":0,"total":1,"items":["WO-UD-5579"]}', retry: 0 },
  { id: "AP-20260142-09", time: "2026-05-19 07:45:38", system: "实验室系统", direction: "推送", event: "样本信息上报", bizKey: "SMP-20260142-03", farm: "奶牛一场", status: "失败", cost: 903, trigger: "采样登记触发", endpoint: "POST /lab/v1/samples", request: '{"cattleNo":"2198","sampleType":"乳汁","collector":"赵倩"}', response: '{"code":4001,"message":"invalid sampleType"}', error: "样本类型未在实验室系统登记（4001），需先补全映射。", retry: 1 },
  { id: "AP-20260142-10", time: "2026-05-19 07:30:04", system: "UD 平台", direction: "推送", event: "免疫记录回传", bizKey: "VAC-20260142-11", farm: "奶牛一场", status: "成功", cost: 276, trigger: "疫苗工单完成触发", endpoint: "POST /ud/v2/immunization/records", request: '{"cattleNos":["2310","2311","2312"],"vaccine":"口蹄疫疫苗 A 型","batch":"B25A0142"}', response: '{"code":0,"accepted":3}', retry: 0 },
];

// ============ 消息推送日志 ============
type PushLog = {
  id: string;
  time: string;
  name: string;
  category: string;
  receivers: string[];
  farm: string;
  channel: string;
  pushStatus: "已送达" | "发送失败";
  readStatus: "已读" | "未读";
  readTime: string;
  content: string;
  jump: string;
  error?: string;
};

const PUSH_LOGS: PushLog[] = [
  { id: "MSG-90112", time: "2026-05-19 09:05:31", name: "工单临期提醒", category: "工单任务类", receivers: ["李明"], farm: "奶牛一场", channel: "企微消息", pushStatus: "发送失败", readStatus: "未读", readTime: "—", content: "疾病治疗工单 WO-2026-0142（牛号 2310）将于 10:00 到期，请尽快处理。", jump: "工单详情页", error: "企微接口频率限制（45009），已自动重试 2 次仍未送达；站内信渠道已送达。" },
  { id: "MSG-90111", time: "2026-05-19 09:05:31", name: "工单临期提醒", category: "工单任务类", receivers: ["李明"], farm: "奶牛一场", channel: "站内信", pushStatus: "已送达", readStatus: "已读", readTime: "2026-05-19 09:14:02", content: "疾病治疗工单 WO-2026-0142（牛号 2310）将于 10:00 到期，请尽快处理。", jump: "工单详情页" },
  { id: "MSG-90110", time: "2026-05-19 08:47:19", name: "待诊断提醒", category: "工单任务类", receivers: ["张磊", "李明", "王芳", "赵倩", "孙悦", "周强", "陈静"], farm: "奶牛一场", channel: "站内信、企微消息", pushStatus: "已送达", readStatus: "已读", readTime: "2026-05-19 08:52:40", content: "牛号 1872 上报疑似乳房炎，上报人 赵倩，请及时诊断。", jump: "工单详情页" },
  { id: "MSG-90109", time: "2026-05-19 08:30:05", name: "药品临期提醒", category: "药品类", receivers: ["王芳"], farm: "全部牧场", channel: "站内信", pushStatus: "已送达", readStatus: "未读", readTime: "—", content: "乳房炎抗生素 5mg（批号 B24A0631）将于 2026-06-30 过期，剩余 24。", jump: "三级库详情页" },
  { id: "MSG-90108", time: "2026-05-19 08:15:20", name: "药品过期提醒", category: "药品类", receivers: ["王芳"], farm: "奶牛一场", channel: "站内信、企微消息", pushStatus: "已送达", readStatus: "已读", readTime: "2026-05-19 08:26:11", content: "口蹄疫疫苗 A 型（批号 B23K0518）已于 2026-05-10 过期，剩余 8，请勿使用。", jump: "三级库详情页" },
  { id: "MSG-90107", time: "2026-05-19 08:00:02", name: "工单逾期提醒", category: "工单任务类", receivers: ["赵倩", "张磊", "孙悦"], farm: "奶牛二场", channel: "站内信、企微消息", pushStatus: "已送达", readStatus: "未读", readTime: "—", content: "修蹄工单 WO-2026-0138 已逾期 3 小时 20 分，执行人：赵倩，请尽快跟进。", jump: "工单列表页" },
  { id: "MSG-90106", time: "2026-05-19 08:00:02", name: "药品堆积提醒", category: "药品类", receivers: ["王芳"], farm: "奶牛二场", channel: "站内信、企微消息", pushStatus: "已送达", readStatus: "已读", readTime: "2026-05-19 08:41:55", content: "戊二醛消毒液（批号 D24B0907）在三级库 B2-3 堆积 30，超过建议存量，请及时处理。", jump: "三级库详情页" },
  { id: "MSG-90105", time: "2026-05-18 17:22:48", name: "实验室结果更新提醒", category: "其他类", receivers: ["张磊", "李明", "王芳", "赵倩", "孙悦", "周强", "陈静", "刘洋", "吴昊", "郑丽", "黄涛", "林峰"], farm: "全部牧场", channel: "站内信、企微消息", pushStatus: "已送达", readStatus: "已读", readTime: "2026-05-18 17:35:09", content: "牛号 2198 的乳汁体细胞检测实验室结果已更新，请查看。", jump: "牛只档案页" },
  { id: "MSG-90104", time: "2026-05-18 16:10:33", name: "工单异常提醒", category: "工单任务类", receivers: ["李明"], farm: "奶牛一场", channel: "站内信", pushStatus: "已送达", readStatus: "已读", readTime: "2026-05-18 16:18:27", content: "工单 WO-2026-0131 出现异常：用药剂量超出处方上限，牛号 2198。", jump: "牛只档案页" },
  { id: "MSG-90103", time: "2026-05-18 15:02:17", name: "角色权限变更提醒", category: "系统类", receivers: ["孙悦"], farm: "奶牛二场", channel: "站内信", pushStatus: "已送达", readStatus: "未读", readTime: "—", content: "您在 奶牛二场 的角色已变更为 场长，操作人 张磊。", jump: "不跳转" },
  { id: "MSG-90102", time: "2026-05-18 14:40:06", name: "工单逾期提醒", category: "工单任务类", receivers: ["赵倩"], farm: "奶牛二场", channel: "企微消息", pushStatus: "发送失败", readStatus: "未读", readTime: "—", content: "驱虫工单 WO-2026-0129 已逾期 1 小时 05 分，执行人：赵倩，请尽快跟进。", jump: "工单列表页", error: "企微账号未绑定（errcode 60011），请让对方在企业微信中完成绑定。" },
  { id: "MSG-90101", time: "2026-05-18 11:18:52", name: "待诊断提醒", category: "工单任务类", receivers: ["张磊", "孙悦"], farm: "奶牛二场", channel: "站内信、企微消息", pushStatus: "已送达", readStatus: "已读", readTime: "2026-05-18 11:24:30", content: "牛号 1902 上报疑似口蹄疫，上报人 孙悦，请及时诊断。", jump: "工单详情页" },
];

const statusTag = (s: ApiStatus) => (s === "成功" ? "tag-success" : s === "失败" ? "tag-danger" : "tag-warning");
const pushTag = (s: PushLog["pushStatus"]) => (s === "已送达" ? "tag-success" : "tag-danger");
const readTag = (s: PushLog["readStatus"]) => (s === "已读" ? "tag-brand" : "tag-muted");

function Page() {
  return (
    <>
      <AppHeader title="日志中心" breadcrumb={["运营管理", "日志中心"]} />
      <main className="flex-1 px-6 py-6 space-y-4">
        <Tabs defaultValue="api">
          <TabsList className="h-9 rounded-lg bg-surface-subtle">
            <TabsTrigger value="api" className="rounded-md px-4">第三方交互日志</TabsTrigger>
            <TabsTrigger value="push" className="rounded-md px-4">消息推送日志</TabsTrigger>
          </TabsList>
          <TabsContent value="api" className="mt-4"><ApiTable /></TabsContent>
          <TabsContent value="push" className="mt-4"><PushTable /></TabsContent>
        </Tabs>
      </main>
    </>
  );
}

type Col<T> = {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  /** 可筛选列：选项 + 取值 */
  options?: string[];
  value?: (row: T) => string;
  required?: boolean;
};

type LogTableState<T> = ReturnType<typeof useLogTable<T>>;

function useLogTable<T>(cols: Col<T>[], statusKey: string) {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [visible, setVisible] = useState<string[]>(cols.map((c) => c.key));
  return useMemo(() => {
    const apply = (rows: T[]) =>
      rows.filter((r) =>
        Object.entries(filters).every(([k, v]) => {
          if (!v || v === ALL) return true;
          const c = cols.find((x) => x.key === k);
          return !c?.value || c.value(r) === v;
        }),
      );
    const statusCol = cols.find((c) => c.key === statusKey)!;
    const activeCount = Object.values(filters).filter((v) => v && v !== ALL).length;
    return { cols, filters, setFilters, visible, setVisible, apply, statusCol, activeCount, shown: cols.filter((c) => visible.includes(c.key)) };
  }, [cols, filters, visible, statusKey]);
}

const ALL = "全部";

function FilterBar<T>({
  kw,
  onKw,
  placeholder,
  table,
  statusLabel,
}: {
  kw: string;
  onKw: (v: string) => void;
  placeholder: string;
  table: LogTableState<T>;
  statusLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const sk = table.statusCol.key;
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="relative w-64">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" />
        <Input value={kw} onChange={(e) => onKw(e.target.value)} placeholder={placeholder} className="h-9 pl-8 text-body-sm" />
      </div>
      <Select value={table.filters[sk] || ALL} onValueChange={(v) => table.setFilters((p) => ({ ...p, [sk]: v }))}>
        <SelectTrigger className="h-9 w-36 text-body-sm">
          <span className="text-text-tertiary mr-1">{statusLabel}</span>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {[ALL, ...(table.statusCol.options ?? [])].map((c) => (
            <SelectItem key={c} value={c}>{c}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button variant="outline" className="relative ml-auto h-9 gap-1.5 text-body-sm font-normal" onClick={() => setOpen(true)}>
        <SlidersHorizontal className="h-4 w-4" />
        列设置与筛选
        {table.activeCount > 0 && (
          <span className="ml-0.5 min-w-4 h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] leading-4 text-center tabular-nums">
            {table.activeCount}
          </span>
        )}
      </Button>
      <SettingsSheet open={open} onOpenChange={setOpen} table={table} />
    </div>
  );
}

function SettingsSheet<T>({ open, onOpenChange, table }: { open: boolean; onOpenChange: (o: boolean) => void; table: LogTableState<T> }) {
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [vis, setVis] = useState<string[]>([]);
  useEffect(() => {
    if (open) {
      setDraft(table.filters);
      setVis(table.visible);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[420px] sm:max-w-[420px] flex flex-col">
        <SheetHeader>
          <SheetTitle>列设置与筛选</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          <section className="space-y-3">
            <div className="text-card-title text-foreground">筛选条件</div>
            {table.cols.filter((c) => c.options).map((c) => (
              <div key={c.key} className="space-y-1.5">
                <div className="text-caption text-text-secondary">{c.label}</div>
                <Select value={draft[c.key] || ALL} onValueChange={(v) => setDraft((p) => ({ ...p, [c.key]: v }))}>
                  <SelectTrigger className="h-9 text-body-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[ALL, ...c.options!].map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </section>
          <section className="space-y-3">
            <div className="text-card-title text-foreground">列设置</div>
            <div className="grid grid-cols-2 gap-2">
              {table.cols.map((c) => (
                <label key={c.key} className="flex items-center gap-2 text-body-sm text-foreground cursor-pointer">
                  <Checkbox
                    checked={vis.includes(c.key)}
                    disabled={c.required}
                    onCheckedChange={(v) => setVis((p) => (v ? [...p, c.key] : p.filter((k) => k !== c.key)))}
                  />
                  {c.label}
                </label>
              ))}
            </div>
          </section>
        </div>
        <SheetFooter className="border-t border-border pt-4 gap-2">
          <Button variant="outline" onClick={() => { setDraft({}); setVis(table.cols.map((c) => c.key)); }}>重置</Button>
          <Button
            onClick={() => {
              table.setFilters(draft);
              table.setVisible(table.cols.map((c) => c.key).filter((k) => vis.includes(k)));
              onOpenChange(false);
            }}
          >
            确定
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function LogGrid<T>({ table, rows, rowKey, onDetail, empty }: { table: LogTableState<T>; rows: T[]; rowKey: (r: T) => string; onDetail: (r: T) => void; empty: string }) {
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full text-body-sm">
        <thead className="bg-surface-subtle text-text-secondary">
          <tr className="h-12">
            {[...table.shown.map((c) => c.label), "操作"].map((h) => (
              <th key={h} className="px-4 text-left font-medium whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={rowKey(r)} className="border-t border-border h-12">
              {table.shown.map((c) => (
                <td key={c.key} className="px-4 py-3 whitespace-nowrap text-foreground">{c.render(r)}</td>
              ))}
              <td className="px-4 py-3 whitespace-nowrap">
                <Button variant="ghost" size="sm" className="h-8 px-0 text-primary hover:bg-transparent hover:text-primary/80" onClick={() => onDetail(r)}>
                  详情
                </Button>
              </td>
            </tr>
          ))}
          {!rows.length && <tr><td colSpan={table.shown.length + 1} className="px-4 py-10 text-center text-text-tertiary">{empty}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

const API_COLS: Col<ApiLog>[] = [
  { key: "time", label: "时间", required: true, render: (l) => <span className="text-text-secondary">{l.time}</span> },
  { key: "system", label: "对接系统", render: (l) => l.system, options: ["UD 平台", "企业微信", "实验室系统"], value: (l) => l.system },
  { key: "direction", label: "方向", render: (l) => <span className={`tag ${l.direction === "推送" ? "tag-brand" : "tag-info"}`}>{l.direction}</span>, options: ["推送", "拉取"], value: (l) => l.direction },
  { key: "event", label: "事件类型", render: (l) => l.event, options: [...new Set(API_LOGS.map((l) => l.event))], value: (l) => l.event },
  { key: "bizKey", label: "业务标识", render: (l) => <span className="text-text-secondary">{l.bizKey}</span> },
  { key: "farm", label: "关联牧场", render: (l) => l.farm, options: ["奶牛一场", "奶牛二场", "全部牧场"], value: (l) => l.farm },
  { key: "status", label: "状态", render: (l) => <span className={`tag ${statusTag(l.status)}`}>{l.status}</span>, options: ["成功", "失败", "重试中"], value: (l) => l.status },
  { key: "cost", label: "耗时", render: (l) => <span className="text-text-secondary">{l.cost} ms</span> },
];

function ApiTable() {
  const [kw, setKw] = useState("");
  const [detail, setDetail] = useState<ApiLog | null>(null);
  const t = useLogTable(API_COLS, "status");

  const rows = useMemo(
    () => t.apply(API_LOGS).filter((l) => !kw || l.bizKey.includes(kw) || l.event.includes(kw) || l.id.includes(kw)),
    [kw, t],
  );

  return (
    <>
      <div className="space-y-4">
        <FilterBar kw={kw} onKw={setKw} placeholder="搜索业务标识 / 事件" table={t} statusLabel="状态" />
        <LogGrid table={t} rows={rows} rowKey={(l) => l.id} onDetail={setDetail} empty="暂无匹配的交互记录" />
      </div>

      <Sheet open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <SheetContent className="w-[620px] sm:max-w-[620px] overflow-y-auto">
          {detail && (
            <>
              <SheetHeader>
                <SheetTitle>交互详情 · {detail.id}</SheetTitle>
              </SheetHeader>
              <div className="space-y-5 py-4">
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-body-sm">
                  <KV k="时间" v={detail.time} />
                  <KV k="对接系统" v={detail.system} />
                  <KV k="方向" v={detail.direction} />
                  <KV k="事件类型" v={detail.event} />
                  <KV k="业务标识" v={detail.bizKey} />
                  <KV k="关联牧场" v={detail.farm} />
                  <KV k="状态" v={detail.status} />
                  <KV k="耗时" v={`${detail.cost} ms`} />
                  <KV k="重试次数" v={String(detail.retry)} />
                  <KV k="触发方式" v={detail.trigger} />
                  <KV k="接口" v={detail.endpoint} />
                </div>
                {detail.error && (
                  <div className="callout-danger rounded-md p-3 text-body-sm text-foreground">
                    <div className="text-caption text-text-tertiary mb-1">失败原因</div>
                    {detail.error}
                  </div>
                )}
                <Code title="请求内容" text={detail.request} />
                <Code title="响应内容" text={detail.response} />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

const PUSH_COLS: Col<PushLog>[] = [
  { key: "time", label: "推送时间", required: true, render: (l) => <span className="text-text-secondary">{l.time}</span> },
  { key: "name", label: "消息名称", render: (l) => <span className="font-medium">{l.name}</span>, options: [...new Set(PUSH_LOGS.map((l) => l.name))], value: (l) => l.name },
  { key: "category", label: "消息类型", render: (l) => <span className={`tag ${categoryTag(l.category)}`}>{l.category}</span>, options: ["工单任务类", "药品类", "系统类", "其他类"], value: (l) => l.category },
  { key: "farm", label: "关联牧场", render: (l) => l.farm, options: ["奶牛一场", "奶牛二场", "全部牧场"], value: (l) => l.farm },
  { key: "receivers", label: "接收人", render: (l) => <ReceiverCell names={l.receivers} /> },
  { key: "channel", label: "推送渠道", render: (l) => <span className="text-text-secondary">{l.channel}</span>, options: ["站内信", "企微消息", "站内信、企微消息"], value: (l) => l.channel },
  { key: "pushStatus", label: "推送状态", render: (l) => <span className={`tag ${pushTag(l.pushStatus)}`}>{l.pushStatus}</span>, options: ["已送达", "发送失败"], value: (l) => l.pushStatus },
];

function PushTable() {
  const [kw, setKw] = useState("");
  const [detail, setDetail] = useState<PushLog | null>(null);
  const t = useLogTable(PUSH_COLS, "pushStatus");

  const rows = useMemo(
    () =>
      t.apply(PUSH_LOGS).filter(
        (l) => !kw || l.name.includes(kw) || l.receivers.some((r) => r.includes(kw)) || l.id.includes(kw),
      ),
    [kw, t],
  );

  return (
    <>
      <div className="space-y-4">
        <FilterBar kw={kw} onKw={setKw} placeholder="搜索消息名称 / 接收人" table={t} statusLabel="推送状态" />
        <LogGrid table={t} rows={rows} rowKey={(l) => l.id} onDetail={setDetail} empty="暂无匹配的推送记录" />
      </div>

      <Sheet open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <SheetContent className="w-[560px] sm:max-w-[560px] overflow-y-auto">
          {detail && (
            <>
              <SheetHeader>
                <SheetTitle>推送详情 · {detail.id}</SheetTitle>
              </SheetHeader>
              <div className="space-y-5 py-4">
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-body-sm">
                  <KV k="消息名称" v={detail.name} />
                  <KV k="消息类型" v={detail.category} />
                  <KV k="关联牧场" v={detail.farm} />
                  <KV k="推送渠道" v={detail.channel} />
                  <KV k="推送状态" v={detail.pushStatus} />
                  <KV k="查看状态" v={detail.readStatus} />
                  <KV k="查看时间" v={detail.readTime} />
                  <KV k="跳转界面" v={detail.jump} />
                </div>
                <div>
                  <div className="text-caption text-text-tertiary mb-1.5">接收人（{detail.receivers.length} 人）</div>
                  <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto rounded-md bg-surface-subtle p-3">
                    {detail.receivers.map((r) => (
                      <span key={r} className="rounded bg-background px-2 py-0.5 text-body-sm text-foreground border border-border">{r}</span>
                    ))}
                  </div>
                </div>
                {detail.error && (
                  <div className="callout-danger rounded-md p-3 text-body-sm text-foreground">
                    <div className="text-caption text-text-tertiary mb-1">失败原因</div>
                    {detail.error}
                  </div>
                )}
                <div>
                  <div className="text-caption text-text-tertiary mb-1.5">消息内容</div>
                  <div className="rounded-md bg-surface-subtle p-3 text-body-sm text-foreground">{detail.content}</div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function ReceiverCell({ names }: { names: string[] }) {
  const full = names.join("、");
  if (full.length <= 10) return <span>{full}</span>;
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-default">{full.slice(0, 10)}…</span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs whitespace-normal">共 {names.length} 人：{full}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="min-w-0">
      <div className="text-caption text-text-tertiary">{k}</div>
      <div className="text-foreground mt-0.5 break-all">{v}</div>
    </div>
  );
}

function Code({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <div className="text-caption text-text-tertiary mb-1.5">{title}</div>
      <pre className="max-h-52 overflow-auto rounded-md bg-surface-subtle p-3 text-caption leading-relaxed text-text-secondary whitespace-pre-wrap break-all">{text}</pre>
    </div>
  );
}
