import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ListPage, type ListColumn } from "@/components/list-page";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Star, ThumbsUp, ThumbsDown, ImageIcon, MessageSquare } from "lucide-react";
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
  head: () => ({
    meta: [
      { title: "反馈管理 — 奇点智牧" },
      { name: "description", content: "汇总牧场用户提交的系统体验评分与改进建议，支持标注反馈价值。" },
      { property: "og:title", content: "反馈管理 — 奇点智牧" },
      { property: "og:description", content: "汇总牧场用户提交的系统体验评分与改进建议，支持标注反馈价值。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FeedbackAdminPage,
});

type Verdict = "valuable" | "invalid" | null;

type FeedbackRow = {
  id: string;
  rating: number; // 0-5，0 表示未评分
  topic: string;
  content: string;
  images: number;
  user: string;
  role: string;
  farm: string;
  createdAt: string;
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
          className={`h-3.5 w-3.5 ${i <= n ? "fill-[#F5B301] text-[#F5B301]" : "text-border"}`}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

function VerdictTag({ v }: { v: Verdict }) {
  if (v === "valuable") return <span className="tag tag-success">有价值</span>;
  if (v === "invalid")
    return <span className="tag" style={{ backgroundColor: "#F0F2F4", color: "#475569" }}>无价值</span>;
  return <span className="tag" style={{ backgroundColor: "#FFF6E5", color: "#B77500" }}>待处理</span>;
}

const verdictText = (v: Verdict) => (v === "valuable" ? "有价值" : v === "invalid" ? "无价值" : "待处理");

function FeedbackAdminPage() {
  const [list, setList] = useState<FeedbackRow[]>(initialData);
  const [detail, setDetail] = useState<FeedbackRow | null>(null);
  const [confirming, setConfirming] = useState<{ id: string; next: Verdict } | null>(null);

  const mark = (id: string, v: Verdict) => {
    setList((prev) => prev.map((r) => (r.id === id ? { ...r, verdict: v } : r)));
    setDetail((d) => (d && d.id === id ? { ...d, verdict: v } : d));
    toast.success(
      v === "valuable" ? "已标注为有价值" : v === "invalid" ? "已标注为无价值" : "已清除标注",
    );
  };

  const requestMark = (id: string, current: Verdict, next: Verdict) => {
    if (current === next) return mark(id, null);
    if (current === null) return mark(id, next);
    setConfirming({ id, next });
  };
  const nextLabel = confirming ? verdictText(confirming.next) : "";

  const columns = useMemo<ListColumn<FeedbackRow>[]>(
    () => [
      {
        key: "id",
        label: "编号",
        required: true,
        value: (r) => r.id,
        render: (r) => <span className="font-mono text-caption text-text-secondary">{r.id}</span>,
        className: "max-w-[86px]",
      },
      {
        key: "rating",
        label: "评分",
        value: (r) => (r.rating ? `${r.rating} 星` : "未评分"),
        filter: "select",
        options: ["5 星", "4 星", "3 星", "2 星", "1 星", "未评分"],
        render: (r) => <Stars n={r.rating} />,
        className: "max-w-[110px]",
      },
      {
        key: "topic",
        label: "反馈类型",
        value: (r) => r.topic,
        filter: "select",
        options: TOPICS,
        render: (r) => (
          <span className="tag" style={{ backgroundColor: "#F1F5F9", color: "#475569" }}>
            {r.topic}
          </span>
        ),
        className: "max-w-[96px]",
      },
      {
        key: "content",
        label: "详细描述",
        required: true,
        value: (r) => r.content,
        render: (r) => (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="truncate text-body text-foreground">{r.content}</span>
                  {r.images > 0 && (
                    <span className="shrink-0 inline-flex items-center gap-0.5 rounded bg-surface-subtle px-1.5 py-0.5 text-caption text-text-secondary">
                      <ImageIcon className="h-3 w-3" />
                      {r.images}
                    </span>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" align="start" className="max-w-sm whitespace-pre-wrap leading-relaxed">
                {r.content}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ),
      },
      {
        key: "user",
        label: "上传人",
        value: (r) => r.user,
        render: (r) => (
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-7 w-7 shrink-0 rounded-full bg-brand-subtle text-primary text-caption flex items-center justify-center">
              {r.user.slice(0, 1)}
            </div>
            <div className="min-w-0">
              <div className="truncate text-body text-foreground">{r.user}</div>
              <div className="truncate text-caption text-text-tertiary">
                {r.role} · {r.farm}
              </div>
            </div>
          </div>
        ),
      },
      {
        key: "farm",
        label: "所属牧场",
        value: (r) => r.farm,
        filter: "select",
        defaultHidden: true,
      },
      {
        key: "createdAt",
        label: "上传时间",
        date: true,
        value: (r) => r.createdAt,
        render: (r) => (
          <span className="text-caption text-text-secondary tabular-nums whitespace-nowrap">{r.createdAt}</span>
        ),
      },
      {
        key: "verdict",
        label: "状态",
        value: (r) => verdictText(r.verdict),
        filter: "select",
        options: ["待处理", "有价值", "无价值"],
        render: (r) => <VerdictTag v={r.verdict} />,
        className: "max-w-[88px]",
      },
    ],
    [],
  );

  return (
    <>
      <ListPage<FeedbackRow>
        title="反馈管理"
        breadcrumb={["反馈管理"]}
        rows={list}
        columns={columns}
        searchKeys={["content", "user"]}
        searchPlaceholder="搜索描述 / 上传人"
        getRowKey={(r) => r.id}
        onRowClick={(r) => setDetail(r)}
        emptyText="暂无符合条件的反馈"
        actionsWidth={92}
        rowActions={(r) => (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  aria-label="标为有价值"
                  onClick={() => requestMark(r.id, r.verdict, "valuable")}
                  className={`h-8 w-8 flex items-center justify-center transition-colors ${
                    r.verdict === "valuable"
                      ? "text-primary"
                      : "text-text-tertiary hover:text-primary"
                  }`}
                >
                  <ThumbsUp className={`h-4 w-4 ${r.verdict === "valuable" ? "fill-current" : ""}`} />
                </button>
              </TooltipTrigger>
              <TooltipContent>{r.verdict === "valuable" ? "取消有价值" : "标为有价值"}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  aria-label="标为无价值"
                  onClick={() => requestMark(r.id, r.verdict, "invalid")}
                  className={`ml-1 h-8 w-8 flex items-center justify-center transition-colors ${
                    r.verdict === "invalid"
                      ? "[color:var(--text-tertiary)]"
                      : "text-text-tertiary hover:text-foreground"
                  }`}
                >

                  <ThumbsDown className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{r.verdict === "invalid" ? "取消无价值" : "标为无价值"}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      />

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
                    <span className="tag" style={{ backgroundColor: "#F1F5F9", color: "#475569" }}>
                      {detail.topic}
                    </span>
                  </Meta>
                  <Meta label="上传人">
                    <div className="text-body-sm text-foreground">{detail.user}</div>
                    <div className="text-caption text-text-tertiary">
                      {detail.role} · {detail.farm}
                    </div>
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
                        <div
                          key={i}
                          className="aspect-square rounded-md bg-surface-subtle border border-border flex items-center justify-center"
                        >
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
            <AlertDialogDescription>是否将其标注改为「{nextLabel}」？</AlertDialogDescription>
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

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-caption text-text-tertiary mb-1">{label}</div>
      {children}
    </div>
  );
}
