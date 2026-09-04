import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Camera } from "lucide-react";
import { ListPage, type ListColumn } from "@/components/list-page";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/warehouse/loss")({
  head: () => ({ meta: [{ title: "损耗管理 — 奇点智牧" }] }),
  component: LossPage,
});

type LossDrug = {
  code: string;
  name: string;
  spec: string;
  qty: number;
  unit: string;
  pickedAt: string; // 领取时间
  value: number;
};

type LossReport = {
  id: string; // 损耗记录编码
  drugCount: number; // 药品数目
  reportedAt: string; // 损耗上报日期
  reason: string; // 损耗原因
  reporter: string; // 上报人员
  value: number; // 损耗总估值
  type: "牛只均摊" | "公共损耗"; // 损耗类型
  stage: string;
  remark?: string;
  drugs: LossDrug[];
  photos: number; // 现场照片数量
};

const money = (n: number) =>
  `¥ ${n.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const initial: LossReport[] = [
  {
    id: "LS-2026-1086",
    drugCount: 2,
    reportedAt: "2026-05-12 10:18",
    reason: "冷链断电",
    reporter: "孙库管",
    value: 660.0,
    type: "公共损耗",
    stage: "储存保管",
    remark: "冷库压缩机夜间故障，疫苗温度超标。",
    photos: 3,
    drugs: [
      { code: "02-00214", name: "口蹄疫疫苗 A 型", spec: "50ml/瓶", qty: 8, unit: "支", pickedAt: "2026-05-10 08:30", value: 480.0 },
      { code: "04-00412", name: "营养补充剂 复合维生素", spec: "10ml/支", qty: 2, unit: "罐", pickedAt: "2026-05-10 08:32", value: 180.0 },
    ],
  },
  {
    id: "LS-2026-1085",
    drugCount: 1,
    reportedAt: "2026-05-11 15:30",
    reason: "操作失误",
    reporter: "李雨晴",
    value: 62.5,
    type: "牛只均摊",
    stage: "给药用药",
    remark: "保定失败，药液外洒。",
    photos: 2,
    drugs: [
      { code: "01-00063", name: "乳房炎抗生素 5mg", spec: "100ml（含5g）/瓶", qty: 1, unit: "支", pickedAt: "2026-05-11 14:05", value: 62.5 },
    ],
  },
  {
    id: "LS-2026-1084",
    drugCount: 3,
    reportedAt: "2026-05-10 09:00",
    reason: "过期失效",
    reporter: "王仓管",
    value: 402.75,
    type: "公共损耗",
    stage: "储存保管",
    photos: 1,
    drugs: [
      { code: "05-00521", name: "消毒液 戊二醛", spec: "5L/桶", qty: 5, unit: "L", pickedAt: "2026-04-28 09:10", value: 220.0 },
      { code: "03-00306", name: "驱虫剂 伊维菌素", spec: "100ml（含1g）/瓶", qty: 3, unit: "瓶", pickedAt: "2026-04-28 09:12", value: 116.25 },
      { code: "01-00063", name: "乳房炎抗生素 5mg", spec: "100ml（含5g）/瓶", qty: 1, unit: "支", pickedAt: "2026-04-28 09:15", value: 66.5 },
    ],
  },
  {
    id: "LS-2026-1083",
    drugCount: 1,
    reportedAt: "2026-05-09 14:42",
    reason: "取药破损",
    reporter: "陈建国",
    value: 38.75,
    type: "牛只均摊",
    stage: "取药配药",
    photos: 2,
    drugs: [
      { code: "03-00306", name: "驱虫剂 伊维菌素", spec: "100ml（含1g）/瓶", qty: 1, unit: "瓶", pickedAt: "2026-05-09 14:20", value: 38.75 },
    ],
  },
];

function LossPage() {
  const [data] = useState<LossReport[]>(initial);
  const [current, setCurrent] = useState<LossReport | null>(null);

  const columns: ListColumn<LossReport>[] = [
    { key: "id", label: "损耗记录编码", required: true, render: (r) => <span className="font-mono text-body text-foreground">{r.id}</span> },
    {
      key: "drugCount", label: "药品数目", filter: "number", value: (r) => r.drugCount,
      render: (r) => <span className="text-body tabular-nums text-foreground">{r.drugCount}</span>,
    },
    { key: "stage", label: "损耗环节", filter: "select", render: (r) => <span className="text-body-sm text-text-secondary">{r.stage}</span> },
    { key: "reason", label: "损耗原因", filter: "select", render: (r) => <span className="text-body-sm text-text-secondary truncate">{r.reason}</span> },
    { key: "reporter", label: "上报人员", filter: "select", render: (r) => <span className="text-body-sm text-text-secondary">{r.reporter}</span> },
    { key: "reportedAt", label: "上报日期", date: true, filter: "date", render: (r) => <span className="text-body-sm text-text-secondary tabular-nums">{r.reportedAt}</span> },
    {
      key: "value", label: "损耗总估值", filter: "number", value: (r) => r.value,
      render: (r) => <span className="text-body tabular-nums text-foreground">{money(r.value)}</span>,
    },
    {
      key: "type", label: "损耗类型", filter: "select",
      render: (r) => (
        <span className={r.type === "牛只均摊" ? "tag tag-brand" : "tag tag-info"}>{r.type}</span>
      ),
    },

  ];

  return (
    <>
      <ListPage<LossReport>
        title="损耗管理"
        breadcrumb={["仓库管理", "损耗管理"]}
        rows={data}
        columns={columns}
        searchKeys={["id", "reporter"]}
        searchPlaceholder="按损耗记录编码 / 上报人员搜索"
        getRowKey={(r) => r.id}
        onRowClick={(r) => setCurrent(r)}
        rowActions={(r) => (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-body-sm font-normal text-text-secondary hover:bg-surface-subtle hover:text-foreground"
            onClick={(e) => { e.stopPropagation(); setCurrent(r); }}
          >
            查看
          </Button>
        )}
      />

      <Sheet open={!!current} onOpenChange={(v) => !v && setCurrent(null)}>
        <SheetContent side="right" className="w-full sm:w-1/2 sm:max-w-none p-0 flex flex-col gap-0 bg-card">
          <SheetHeader className="px-6 py-4 border-b border-border">
            <SheetTitle className="text-card-title text-foreground text-left">
              损耗详情 <span className="text-text-tertiary font-normal">{current?.id}</span>
            </SheetTitle>
            <SheetDescription className="text-caption text-text-tertiary text-left">
              查看该次损耗上报的药品明细与现场留证材料。
            </SheetDescription>
          </SheetHeader>

          {current && (
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              <section className="rounded-lg border border-border">
                <div className="px-4 py-2.5 border-b border-border text-body-sm text-text-secondary">基础信息</div>
                <div className="px-4 py-3 divide-y divide-border">
                  {[
                    ["损耗上报日期", current.reportedAt],
                    ["上报人员", current.reporter],
                    ["发生环节", current.stage],
                    ["损耗原因", current.reason],
                    ["损耗类型", current.type],
                    ["药品数目", `${current.drugCount} 种`],
                    ["损耗总估值", money(current.value)],
                    ["备注", current.remark || "—"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-start justify-between gap-6 py-2">
                      <span className="text-body-sm text-text-tertiary shrink-0">{k}</span>
                      <span className="text-body-sm text-foreground text-right">{v}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-lg border border-border">
                <div className="px-4 py-2.5 border-b border-border text-body-sm text-text-secondary">
                  药品明细 · {current.drugs.length} 种
                </div>
                <div className="divide-y divide-border">
                  {current.drugs.map((d) => (
                    <div key={d.code + d.pickedAt} className="px-4 py-3 space-y-1.5">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-body text-foreground truncate">{d.name}</span>
                        <span className="text-body tabular-nums text-foreground shrink-0">
                          {d.qty} {d.unit}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-caption text-text-tertiary">
                        <span className="font-mono">{d.code} · {d.spec}</span>
                        <span className="tabular-nums">{money(d.value)}</span>
                      </div>
                      <div className="text-caption text-text-tertiary">领取时间：{d.pickedAt}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-lg border border-border">
                <div className="px-4 py-2.5 border-b border-border text-body-sm text-text-secondary inline-flex items-center gap-1.5">
                  <Camera className="h-3.5 w-3.5" /> 现场照片 · {current.photos} 张
                </div>
                <div className="px-4 py-3">
                  {current.photos > 0 ? (
                    <div className="grid grid-cols-4 gap-2">
                      {Array.from({ length: current.photos }).map((_, i) => (
                        <div
                          key={i}
                          className="aspect-square rounded-lg border border-border bg-gradient-to-br from-surface-subtle to-border flex items-center justify-center text-caption text-text-tertiary"
                        >
                          现场 {i + 1}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-caption text-text-tertiary">暂无现场照片</div>
                  )}
                </div>
              </section>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
