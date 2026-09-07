import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Search, Star, ThumbsUp, ThumbsDown, ImageIcon, MessageSquare } from "lucide-react";
import { toast } from "sonner";
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

export const Route = createFileRoute("/feedback")({
  head: () => ({ meta: [{ title: "反馈管理 — 奇点智牧" }] }),
  component: FeedbackAdminPage,
});

type Verdict = "valuable" | "invalid" | null;

type FeedbackRow = {
  id: string;
  rating: number; // 0-5，0 表示未评分
  topic: string;
  content: string;
  images: number; // 图片数量
  user: string;
  role: string;
  farm: string;
  createdAt: string; // yyyy-mm-dd hh:mm
  verdict: Verdict;
};

const TOPICS = ["功能建议", "使用问题", "数据/账号", "性能卡顿", "界面体验", "其他"];

const RATING_LABELS = ["", "很差", "较差", "一般", "满意", "非常满意"];

const initialData: FeedbackRow[] = [
  {
    id: "#0721",
    rating: 5,
    topic: "功能建议",
    content: "希望在工单列表可以按牛舍批量分配任务，现在只能一个一个点，效率低。",
    images: 2,
    user: "李海波",
    role: "场长",
    farm: "奇点一牧",
    createdAt: "2026-07-24 09:12",
    verdict: null,
  },
  {
    id: "#0720",
    rating: 2,
    topic: "性能卡顿",
    content: "扫描耳标进入牛只档案偶发白屏，等 3-5 秒才刷出，弱网时更明显。",
    images: 1,
    user: "王芳",
    role: "兽医助理",
    farm: "奇点一牧",
    createdAt: "2026-07-23 18:47",
    verdict: "valuable",
  },
  {
    id: "#0719",
    rating: 4,
    topic: "界面体验",
    content: "首页速查区希望能自定义顺序。",
    images: 0,
    user: "赵磊",
    role: "兽医",
    farm: "北疆二牧",
    createdAt: "2026-07-23 10:22",
    verdict: null,
  },
  {
    id: "#0718",
    rating: 1,
    topic: "使用问题",
    content: "登录不上，页面卡在加载。",
    images: 0,
    user: "test01",
    role: "免疫员",
    farm: "奇点一牧",
    createdAt: "2026-07-22 21:03",
    verdict: "invalid",
  },
  {
    id: "#0717",
    rating: 5,
    topic: "数据/账号",
    content: "月度报告 PDF 里希望增加每头牛的用药总成本明细。",
    images: 3,
    user: "陈志强",
    role: "场长",
    farm: "绿源三牧",
    createdAt: "2026-07-22 15:38",
    verdict: null,
  },
];

function Stars({ n }: { n: number }) {
  if (!n) return <span className="text-caption text-text-tertiary">未评分</span>;
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i <= n ? "fill-[#F5B301] text-[#F5B301]" : "text-border"
          }`}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

function VerdictTag({ v }: { v: Verdict }) {
  if (v === "valuable")
    return <span className="tag tag-success">有价值</span>;
  if (v === "invalid")
    return <span className="tag" style={{ backgroundColor: "#F0F2F4", color: "#475569" }}>无价值</span>;
  return <span className="text-caption text-text-tertiary">-</span>;
}

function FeedbackAdminPage() {
  const [list, setList] = useState<FeedbackRow[]>(initialData);
  const [kw, setKw] = useState("");
  const [topic, setTopic] = useState<string>("all");
  const [verdict, setVerdict] = useState<string>("all");
  const [rating, setRating] = useState<string>("all");
  const [detail, setDetail] = useState<FeedbackRow | null>(null);

  const filtered = useMemo(() => {
    return list.filter((r) => {
      if (topic !== "all" && r.topic !== topic) return false;
      if (verdict !== "all") {
        if (verdict === "pending" && r.verdict !== null) return false;
        if (verdict === "valuable" && r.verdict !== "valuable") return false;
        if (verdict === "invalid" && r.verdict !== "invalid") return false;
      }
      if (rating !== "all") {
        const n = Number(rating);
        if (r.rating !== n) return false;
      }
      if (kw.trim()) {
        const k = kw.trim().toLowerCase();
        const hay = `${r.id} ${r.content} ${r.user} ${r.farm}`.toLowerCase();
        if (!hay.includes(k)) return false;
      }
      return true;
    });
  }, [list, kw, topic, verdict, rating]);

  const stats = useMemo(() => {
    const total = list.length;
    const pending = list.filter((r) => r.verdict === null).length;
    const valuable = list.filter((r) => r.verdict === "valuable").length;
    const invalid = list.filter((r) => r.verdict === "invalid").length;
    const rated = list.filter((r) => r.rating > 0);
    const avg = rated.length
      ? (rated.reduce((s, r) => s + r.rating, 0) / rated.length).toFixed(1)
      : "—";
    return { total, pending, valuable, invalid, avg };
  }, [list]);

  const mark = (id: string, v: Verdict) => {
    setList((prev) => prev.map((r) => (r.id === id ? { ...r, verdict: v } : r)));
    setDetail((d) => (d && d.id === id ? { ...d, verdict: v } : d));
    toast.success(
      v === "valuable" ? "已标注为有价值" : v === "invalid" ? "已标注为无价值" : "已清除标注",
    );
  };

  const [confirming, setConfirming] = useState<{ id: string; next: Verdict } | null>(null);
  const requestMark = (id: string, current: Verdict, next: Verdict) => {
    if (current === next) {
      mark(id, null);
      return;
    }
    if (current === null) {
      mark(id, next);
      return;
    }
    setConfirming({ id, next });
  };
  const nextLabel = confirming?.next === "valuable" ? "有价值" : confirming?.next === "invalid" ? "无价值" : "";

  const STATUS_TABS: { key: string; label: string; count: number }[] = [
    { key: "all", label: "全部", count: stats.total },
    { key: "pending", label: "待处理", count: stats.pending },
    { key: "valuable", label: "有价值", count: stats.valuable },
    { key: "invalid", label: "无价值", count: stats.invalid },
  ];

  return (
    <>
      <AppHeader title="反馈管理" breadcrumb={["反馈管理"]} />
      <main className="flex-1 px-6 py-6 space-y-4">
        {/* 概览 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="反馈总数" value={stats.total} suffix="条" />
          <StatCard label="待处理" value={stats.pending} suffix="条" tone="warning" />
          <StatCard label="有价值" value={stats.valuable} suffix="条" tone="success" />
          <StatCard label="平均体验评分" value={stats.avg} suffix="/ 5" />
        </div>

        {/* 列表 */}
        <Card className="border-border bg-card p-0 overflow-hidden">
          {/* 状态分段 + 筛选栏 */}
          <div className="px-4 pt-4 pb-3 space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="inline-flex items-center gap-1 rounded-lg bg-surface-subtle p-1">
                {STATUS_TABS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setVerdict(t.key)}
                    className={`h-8 rounded-md px-3 text-body-sm transition-colors ${
                      verdict === t.key
                        ? "bg-card text-foreground shadow-sm font-medium"
                        : "text-text-secondary hover:text-foreground"
                    }`}
                  >
                    {t.label}
                    <span className="ml-1.5 text-caption text-text-tertiary tabular-nums">{t.count}</span>
                  </button>
                ))}
              </div>
              <div className="text-caption text-text-tertiary">共 {filtered.length} 条</div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary" />
                <Input
                  value={kw}
                  onChange={(e) => setKw(e.target.value)}
                  placeholder="搜索内容 / 上传人 / 编号"
                  className="h-9 w-72 pl-9 text-body-sm"
                />
              </div>
              <Select value={topic} onValueChange={setTopic}>
                <SelectTrigger className="h-9 w-36 text-body-sm"><SelectValue placeholder="反馈类型" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  {TOPICS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={rating} onValueChange={setRating}>
                <SelectTrigger className="h-9 w-36 text-body-sm"><SelectValue placeholder="评分" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部评分</SelectItem>
                  {[5, 4, 3, 2, 1].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n} 星 · {RATING_LABELS[n]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(kw || topic !== "all" || rating !== "all" || verdict !== "all") && (
                <Button
                  variant="ghost"
                  className="h-9 px-2 text-body-sm text-text-secondary"
                  onClick={() => { setKw(""); setTopic("all"); setRating("all"); setVerdict("all"); }}
                >
                  重置
                </Button>
              )}
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="bg-surface-subtle/60 hover:bg-surface-subtle/60">
                <TableHead className="w-[110px]">编号</TableHead>
                <TableHead className="w-[120px]">评分</TableHead>
                <TableHead className="w-[110px]">反馈类型</TableHead>
                <TableHead>详细描述</TableHead>
                <TableHead className="w-[180px]">上传人</TableHead>
                <TableHead className="w-[150px]">上传时间</TableHead>
                <TableHead className="w-[100px]">状态</TableHead>
                <TableHead className="w-[120px] text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-caption text-text-tertiary">
                    暂无符合条件的反馈
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((r) => (
                <TableRow
                  key={r.id}
                  className="cursor-pointer hover:bg-surface-subtle/70 transition-colors"
                  onClick={() => setDetail(r)}
                >
                  <TableCell className="font-mono text-caption text-text-secondary">{r.id}</TableCell>
                  <TableCell><Stars n={r.rating} /></TableCell>
                  <TableCell><Badge variant="secondary" className="font-normal">{r.topic}</Badge></TableCell>
                  <TableCell>
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2 max-w-[420px]">
                            <span className="text-body-sm text-foreground text-left line-clamp-1">{r.content}</span>
                            {r.images > 0 && (
                              <span className="shrink-0 inline-flex items-center gap-0.5 rounded bg-surface-subtle px-1.5 py-0.5 text-caption text-text-secondary">
                                <ImageIcon className="h-3 w-3" />{r.images}
                              </span>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" align="start" className="max-w-sm whitespace-pre-wrap leading-relaxed">
                          {r.content}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 shrink-0 rounded-full bg-brand-subtle text-primary text-caption flex items-center justify-center">
                        {r.user.slice(0, 1)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-body-sm text-foreground truncate">{r.user}</div>
                        <div className="text-caption text-text-tertiary truncate">{r.role} · {r.farm}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-caption text-text-secondary tabular-nums">{r.createdAt}</TableCell>
                  <TableCell><VerdictTag v={r.verdict} /></TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <TooltipProvider delayDuration={200}>
                      <div className="inline-flex items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              aria-label="标为有价值"
                              onClick={() => requestMark(r.id, r.verdict, "valuable")}
                              className={`h-8 w-8 rounded-md border flex items-center justify-center transition-colors ${
                                r.verdict === "valuable"
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border text-text-secondary hover:border-primary hover:text-primary"
                              }`}
                            >
                              <ThumbsUp className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>{r.verdict === "valuable" ? "取消有价值" : "标为有价值"}</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              aria-label="标为无价值"
                              onClick={() => requestMark(r.id, r.verdict, "invalid")}
                              className={`h-8 w-8 rounded-md border flex items-center justify-center transition-colors ${
                                r.verdict === "invalid"
                                  ? "border-transparent bg-text-tertiary text-white"
                                  : "border-border text-text-secondary hover:border-text-secondary hover:text-foreground"
                              }`}
                            >
                              <ThumbsDown className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>{r.verdict === "invalid" ? "取消无价值" : "标为无价值"}</TooltipContent>
                        </Tooltip>
                      </div>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </main>


      {/* 详情抽屉 */}
      <Sheet open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <SheetContent side="right" className="w-full sm:w-[560px] sm:max-w-none p-0 flex flex-col gap-0 bg-card">
          {detail && (
            <>
              <SheetHeader className="px-6 py-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-md bg-brand-subtle flex items-center justify-center shrink-0">
                    <MessageSquare className="h-5 w-5 text-primary" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <SheetTitle className="text-card-title text-foreground text-left">反馈详情</SheetTitle>
                    <SheetDescription className="text-caption text-text-tertiary text-left font-mono">
                      {detail.id}
                    </SheetDescription>
                  </div>
                  <VerdictTag v={detail.verdict} />
                </div>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <Meta label="系统体验评分">
                    <div className="flex items-center gap-2">
                      <Stars n={detail.rating} />
                      {detail.rating > 0 && (
                        <span className="text-caption text-text-secondary">{RATING_LABELS[detail.rating]}</span>
                      )}
                    </div>
                  </Meta>
                  <Meta label="反馈类型">
                    <Badge variant="secondary" className="font-normal">{detail.topic}</Badge>
                  </Meta>
                  <Meta label="上传人">
                    <div className="text-body-sm text-foreground">{detail.user}</div>
                    <div className="text-caption text-text-tertiary">{detail.role} · {detail.farm}</div>
                  </Meta>
                  <Meta label="上传时间">
                    <div className="text-body-sm text-foreground tabular-nums">{detail.createdAt}</div>
                  </Meta>
                </div>

                <div>
                  <div className="text-caption text-text-tertiary mb-2">详细描述</div>
                  <div className="rounded-lg border border-border bg-surface-subtle/40 p-3 text-body-sm text-foreground leading-relaxed whitespace-pre-wrap">
                    {detail.content}
                  </div>
                </div>

                <div>
                  <div className="text-caption text-text-tertiary mb-2 inline-flex items-center gap-1">
                    <ImageIcon className="h-3.5 w-3.5" /> 图片 · {detail.images} 张
                  </div>
                  {detail.images > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {Array.from({ length: detail.images }).map((_, i) => (
                        <div key={i} className="aspect-square rounded-md bg-gradient-to-br from-surface-subtle to-border border border-border flex items-center justify-center">
                          <ImageIcon className="h-5 w-5 text-text-tertiary" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-caption text-text-tertiary">未上传图片</div>
                  )}
                </div>
              </div>

              <div className="px-6 py-3 border-t border-border flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  className={`h-9 ${
                    detail.verdict === "invalid"
                      ? "border-transparent text-white hover:text-white"
                      : detail.verdict === "valuable"
                      ? "opacity-40"
                      : ""
                  }`}
                  style={detail.verdict === "invalid" ? { backgroundColor: "#94A3B8" } : undefined}
                  onClick={() => requestMark(detail.id, detail.verdict, "invalid")}
                >
                  <ThumbsDown className="h-3.5 w-3.5 mr-1.5" />
                  {detail.verdict === "invalid" ? "取消无价值" : "标为无价值"}
                </Button>
                <Button
                  variant="outline"
                  className={`h-9 ${
                    detail.verdict === "valuable"
                      ? "bg-primary border-primary text-primary-foreground hover:bg-[var(--brand-hover)] hover:text-primary-foreground"
                      : detail.verdict === "invalid"
                      ? "opacity-40"
                      : ""
                  }`}
                  onClick={() => requestMark(detail.id, detail.verdict, "valuable")}
                >
                  <ThumbsUp className="h-3.5 w-3.5 mr-1.5" />
                  {detail.verdict === "valuable" ? "取消有价值" : "标为有价值"}
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!confirming} onOpenChange={(o) => !o && setConfirming(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认标注</AlertDialogTitle>
            <AlertDialogDescription>
              是否将其标注改为「{nextLabel}」？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirming) mark(confirming.id, confirming.next);
                setConfirming(null);
              }}
            >
              确认
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function StatCard({
  label,
  value,
  suffix,
  tone,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  tone?: "success" | "warning" | "muted";
}) {
  const toneCls =
    tone === "success"
      ? "text-primary"
      : tone === "warning"
        ? "text-[#F5B301]"
        : tone === "muted"
          ? "text-text-tertiary"
          : "text-foreground";
  return (
    <Card className="border-border bg-card p-4">
      <div className="text-caption text-text-tertiary">{label}</div>
      <div className={`mt-1 text-section-title tabular-nums ${toneCls}`}>
        {value}
        {suffix && <span className="text-caption text-text-tertiary ml-1">{suffix}</span>}
      </div>
    </Card>
  );
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-caption text-text-tertiary mb-1">{label}</div>
      {children}
    </div>
  );
}
