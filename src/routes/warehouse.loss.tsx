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
import { FlowCodes } from "@/components/barcode-viewer";
import { baseUnit, buildCodes, countUnits } from "@/lib/inventory";
import {
  hiddenAllocatedCattleCount,
  visibleAllocatedCattle,
} from "@/lib/loss-allocation";

export const Route = createFileRoute("/warehouse/loss")({
  head: () => ({
    meta: [
      { title: "损耗管理 — 奇点智牧" },
      { name: "description", content: "查看药品损耗记录、损耗明细及牛只均摊范围。" },
      { property: "og:title", content: "损耗管理 — 奇点智牧" },
      { property: "og:description", content: "查看药品损耗记录、损耗明细及牛只均摊范围。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LossPage,
});

type LossDrug = {
  code: string;
  name: string;
  spec: string;
  qty: number;
  pickedAt: string; // 领取时间
  pickedBy: string; // 领取人
  value: number;
};

type LossReport = {
  id: string; // 损耗记录编码
  drugCount: number; // 药品数目
  reportedAt: string; // 损耗上报日期
  reason: string; // 损耗原因
  reporter: string; // 上报人员
  value: number; // 损耗总估值
  type: "牛只均摊" | "公共损耗" | "-"; // 损耗类型（每晚定时判定，判定前为 "-"）
  stage: string;
  remark?: string;
  drugs: LossDrug[];
  photos: number; // 现场照片数量
  cattleEars?: string[]; // 牛只均摊范围
};

const money = (n: number) =>
  `¥ ${n.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** 群防群控场景下的批量均摊耳号（演示数据） */
const herdEars = (count: number, start = 1001) =>
  Array.from({ length: count }, (_, i) =>
    `01-24-${String(start + i).padStart(4, "0")}`,
  );

const initial: LossReport[] = [
  {
    id: "LS-2026-1086",
    drugCount: 2,
    reportedAt: "2026-05-12 10:18",
    reason: "冷链断电",
    reporter: "孙库管",
    value: 660.0,
    type: "-",
    stage: "储存保管",
    remark: "冷库压缩机夜间故障，疫苗温度超标。",
    photos: 3,
    drugs: [
      { code: "02-00214", name: "口蹄疫疫苗 A 型", spec: "50ml/瓶", qty: 8, pickedAt: "2026-05-10 08:30", pickedBy: "张飞", value: 480.0 },
      { code: "04-00412", name: "营养补充剂 复合维生素", spec: "10ml/支", qty: 2, pickedAt: "2026-05-10 08:32", pickedBy: "张飞", value: 180.0 },
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
    cattleEars: [
      "01-24-2381",
      "01-24-2380",
      "01-24-2379",
      "01-24-2378",
      "01-24-2377",
      "01-24-2376",
      "01-24-2375",
      "01-24-2374",
    ],
    drugs: [
      { code: "01-00063", name: "乳房炎抗生素 5mg", spec: "100ml（含5g）/瓶", qty: 1, pickedAt: "2026-05-11 14:05", pickedBy: "李兽医", value: 62.5 },
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
      { code: "05-00521", name: "消毒液 戊二醛", spec: "5L/桶", qty: 5, pickedAt: "2026-04-28 09:10", pickedBy: "孙库管", value: 220.0 },
      { code: "03-00306", name: "驱虫剂 伊维菌素", spec: "100ml（含1g）/瓶", qty: 3, pickedAt: "2026-04-28 09:12", pickedBy: "孙库管", value: 116.25 },
      { code: "01-00063", name: "乳房炎抗生素 5mg", spec: "100ml（含5g）/瓶", qty: 1, pickedAt: "2026-04-28 09:15", pickedBy: "王建国", value: 66.5 },
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
    cattleEars: ["01-24-2368", "01-24-2367", "01-24-2366"],
    drugs: [
      { code: "03-00306", name: "驱虫剂 伊维菌素", spec: "100ml（含1g）/瓶", qty: 1, pickedAt: "2026-05-09 14:20", pickedBy: "周主管", value: 38.75 },
    ],
  },
  {
    id: "LS-2026-1082",
    drugCount: 1,
    reportedAt: "2026-05-08 08:05",
    reason: "群体免疫稀释液失效",
    reporter: "周主管",
    value: 1840.0,
    type: "牛只均摊",
    stage: "给药用药",
    remark: "全场群防群控用药，稀释液配制超时失效，按当次免疫存栏头数均摊。",
    photos: 2,
    cattleEars: herdEars(1286),
    drugs: [
      { code: "02-00214", name: "口蹄疫疫苗 A 型", spec: "50ml/瓶", qty: 26, pickedAt: "2026-05-08 07:40", pickedBy: "周主管", value: 1840.0 },
    ],
  },
];

function LossPage() {
  const [data] = useState<LossReport[]>(initial);
  const [current, setCurrent] = useState<LossReport | null>(null);
  const [expandedAllocationId, setExpandedAllocationId] = useState<string | null>(null);

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
        r.type === "-" ? <span className="text-body-sm text-text-tertiary">—</span> : <span className={r.type === "牛只均摊" ? "tag tag-brand" : "tag tag-info"}>{r.type}</span>
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
        onRowClick={(r) => {
          setCurrent(r);
          setExpandedAllocationId(null);
        }}
        rowActions={(r) => (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-body-sm font-normal text-text-secondary hover:bg-surface-subtle hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              setCurrent(r);
              setExpandedAllocationId(null);
            }}
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
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 px-4 py-3.5">
                  {([
                    ["上报人员", current.reporter],
                    ["上报日期", current.reportedAt],
                    ["损耗环节", current.stage],
                    ["损耗原因", current.reason],
                    ["药品数目", `${current.drugCount} 种`],
                    ["损耗总估值", money(current.value)],
                  ] as [string, string][]).map(([k, v]) => (
                    <div key={k} className="min-w-0">
                      <div className="text-caption text-text-tertiary">{k}</div>
                      <div className="text-body-sm text-foreground truncate">{v}</div>
                    </div>
                  ))}
                  <div className="min-w-0">
                    <div className="text-caption text-text-tertiary">损耗类型</div>
                    <div className="mt-0.5">
                      {current.type === "-" ? <span className="text-body text-text-tertiary">—</span> : <span className={current.type === "牛只均摊" ? "tag tag-brand" : "tag tag-info"}>{current.type}</span>}
                    </div>
                  </div>
                  <div className="col-span-2 min-w-0">
                    <div className="text-caption text-text-tertiary">备注</div>
                    <div className="text-body-sm text-foreground">{current.remark || "—"}</div>
                  </div>
                  {current.type === "牛只均摊" && current.cattleEars && (
                    <div className="col-span-2 min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-caption text-text-tertiary">
                          均摊牛只 · 共 {current.cattleEars.length} 头
                        </div>
                        {hiddenAllocatedCattleCount(current.cattleEars) > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-caption font-normal text-primary hover:bg-brand-subtle hover:text-primary shrink-0"
                            onClick={() =>
                              setExpandedAllocationId((id) =>
                                id === current.id ? null : current.id,
                              )
                            }
                          >
                            {expandedAllocationId === current.id
                              ? "收起"
                              : `+${hiddenAllocatedCattleCount(current.cattleEars)} 展开`}
                          </Button>
                        )}
                      </div>
                      <div
                        className={`mt-1.5 flex flex-wrap items-start gap-1.5 ${
                          expandedAllocationId === current.id
                            ? "max-h-64 overflow-y-auto rounded-lg border border-border p-2.5"
                            : ""
                        }`}
                      >
                        {visibleAllocatedCattle(
                          current.cattleEars,
                          expandedAllocationId === current.id,
                        ).map((ear) => (
                          <span
                            key={ear}
                            className="tag bg-surface-subtle font-mono text-text-secondary"
                          >
                            {ear}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>


              <section className="rounded-lg border border-border">
                <div className="px-4 py-2.5 border-b border-border text-body-sm text-text-secondary">
                  药品明细 · {current.drugs.length} 种
                </div>
                <div className="divide-y divide-border">
                  {current.drugs.map((d) => {
                    const nodes = buildCodes(`${d.code}|${current.id}|${d.pickedAt}`, d.qty);
                    return (
                      <div key={d.code + d.pickedAt} className="px-4 py-3 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="shrink-0 rounded border border-primary/50 bg-primary/5 px-1.5 py-0.5 text-caption-strong text-primary">{baseUnit(d.spec)}</span>
                            <span className="truncate text-body text-foreground">{d.name}</span>
                          </div>
                          <FlowCodes
                            nodes={nodes}
                            title={`损耗 ${current.id} · ${d.name} · 领取 ${d.pickedAt} · ${d.pickedBy} · 共 ${countUnits(nodes)} 个`}
                          >
                            {d.qty}
                          </FlowCodes>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-caption text-text-tertiary">
                          <span className="font-mono">{d.code} · {d.spec}</span>
                          <span className="tabular-nums">{money(d.value)}</span>
                        </div>
                        <div className="text-caption text-text-tertiary">领取时间：{d.pickedAt} · 领取人：{d.pickedBy}</div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-lg border border-border">
                <div className="px-4 py-2.5 border-b border-border text-body-sm text-text-secondary flex items-center gap-1.5">
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
