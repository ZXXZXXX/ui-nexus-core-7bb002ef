import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  X,
  Mic,
  Video,
  Search,
  Image,
  Sparkles,
  FileText,
  RefreshCw,
  Check,
  ImagePlus,
  Pencil,
  Stethoscope,
} from "lucide-react";
import { MobileShell } from "@/components/mobile-shell";

import { MAddMediaSheet } from "@/components/m-add-media-sheet";

import { TransferBarnControl } from "@/components/m/transfer-barn-control";
import { ConfirmTransferDialog } from "@/components/m/confirm-transfer-dialog";
import { TagPicker } from "@/components/m/tag-picker";
import {
  RelatedOrderPicker,
  RelatedOrderCard,
  type RelatedOrder,
} from "@/components/related-order-picker";
import { DiseasePicker } from "@/components/disease-picker";
import { useRole } from "@/lib/mobile-role";
import { toast } from "sonner";

type ReportSearch = {
  target?: string;
  barn?: string;
  lock?: number;
  draftId?: string;
  revisitFrom?: string;
  revisitReason?: string;
};

export const Route = createFileRoute("/m/report")({
  head: () => ({ meta: [{ title: "健康上报 · 奇点智牧" }] }),
  validateSearch: (s: Record<string, unknown>): ReportSearch => ({
    target: typeof s.target === "string" ? s.target : undefined,
    barn: typeof s.barn === "string" ? s.barn : undefined,
    lock: s.lock ? 1 : undefined,
    draftId: typeof s.draftId === "string" ? s.draftId : undefined,
    revisitFrom: typeof s.revisitFrom === "string" ? s.revisitFrom : undefined,
    revisitReason: typeof s.revisitReason === "string" ? s.revisitReason : undefined,
  }),
  component: ReportPage,
});

// 复诊原因预设
const REVISIT_REASONS = [
  "症状未缓解",
  "症状加重",
  "出现新症状",
  "用药反应异常",
  "需进一步检查",
];

// 牛只编号格式：{牧场两位}-{出生年份后两位}-{顺序四位}
function parseCowId(cowId: string): { farm: string; yy: number; seq: number } {
  const parts = (cowId || "").replace(/^#/, "").split("-");
  if (parts.length >= 3) {
    return {
      farm: parts[0],
      yy: parseInt(parts[1], 10) || 24,
      seq: parseInt(parts[2], 10) || 0,
    };
  }
  const digits = (cowId || "").replace(/\D/g, "");
  return { farm: "08", yy: 24, seq: parseInt(digits || "0", 10) || 0 };
}

// mock：根据牛只编号生成近 7 日疾病诊疗工单号
function recentDiseaseOrderOf(cowId: string): string | null {
  if (!cowId) return null;
  const { seq } = parseCowId(cowId);
  if (!seq) return null;
  // mock：编号能被 2 整除的牛只视为近 7 日有疾病诊疗工单
  if (seq % 2 !== 0) return null;
  return `WO-2026${String(seq).padStart(4, "0").slice(-4)}`;
}



// 牛舍档案（mock）
function barnProfileOf(barn: string) {
  const n = parseInt(barn.replace(/\D/g, ""), 10) || 1;
  const descs = [
    "泌乳牛舍 · 自由卧栏",
    "干奶牛舍 · 散栏饲养",
    "围产牛舍 · 产前观察",
    "后备牛舍 · 育成培育",
    "犊牛舍 · 单栏饲养",
  ];
  const pools = ["泌乳牛", "干奶牛", "围产牛", "后备牛", "犊牛", "青年牛"];
  const catCount = (n % 3) + 1;
  const cats = Array.from({ length: catCount }, (_, i) => pools[(n + i) % pools.length]);
  return {
    desc: descs[n % descs.length],
    stock: 60 + ((n * 17) % 180),
    categories: cats,
  };
}

function BarnProfileCard({ barn, onRemove }: { barn: string; onRemove?: () => void }) {
  const p = useMemo(() => barnProfileOf(barn), [barn]);
  const shown = p.categories.slice(0, 2);
  const rest = p.categories.length - shown.length;
  return (
    <div className="rounded-2xl overflow-hidden shadow-sm border border-[color-mix(in_oklab,var(--brand)_25%,transparent)]">
      <div className="bg-primary text-primary-foreground pl-4 pr-2 py-3 flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-section font-medium leading-tight truncate">{barn}</div>
          <div className="text-caption opacity-85 truncate">{p.desc}</div>
        </div>
        <span className="shrink-0 inline-flex items-baseline gap-1 h-7 px-2.5 rounded-full bg-primary-foreground/15 text-caption">
          <span>存栏</span>
          <span className="tabular-nums font-medium">{p.stock}</span>
          <span>头</span>
        </span>
        {onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="h-9 w-9 shrink-0 inline-flex items-center justify-center rounded-full text-primary-foreground/80 active:bg-primary-foreground/15"
            aria-label="删除已选牛舍"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="p-4 bg-card">
        <div className="text-caption text-text-tertiary">主要牛只类别</div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {shown.map((c) => (
            <span
              key={c}
              className="inline-flex items-center h-7 px-2.5 rounded-full bg-brand-subtle text-primary text-body-sm"
            >
              {c}
            </span>
          ))}
          {rest > 0 && (
            <span className="inline-flex items-center h-7 px-2.5 rounded-full bg-surface-subtle text-text-secondary text-body-sm">
              等 {rest} 类
            </span>
          )}
        </div>
      </div>
    </div>
  );

}



type ReportKind = "health";


// 健康工作类型
const healthWorkTypes = ["疾病治疗", "修蹄", "产后护理", "干奶", "疫苗", "驱虫", "普修"] as const;
type WorkType = (typeof healthWorkTypes)[number];

// 每种工作类型的字段配置
type WorkTypeConfig = {
  tags?: { label: string; required: boolean; presets: string[] };
  note?: { label: string; placeholder: string };
  allowDisease: boolean;
};

const workTypeConfig: Record<WorkType, WorkTypeConfig> = {
  疾病治疗: {
    tags: {
      label: "症状标签",
      required: true,
      // 仅为临床观察到的体征（症状），不含诊断结论
      presets: [
        "体温升高", "采食下降", "反刍减少", "精神沉郁", "卧地不起",
        "阴道分泌物恶臭", "分泌物含脓", "恶露异常", "外阴红肿",
        "乳房红肿", "乳汁异常", "跛行", "腹泻", "鼻液增多", "咳嗽", "外伤出血",
      ],
    },
    allowDisease: true,
  },
  修蹄: {
    tags: {
      label: "症状标签",
      required: true,
      // 仅处理牛蹄变形/过长需要修蹄的情况；蹄病治疗走「疾病治疗」工单
      presets: [
        "蹄过长", "蹄形不正", "蹄壁裂纹", "副蹄过长",
        "行走姿势异常", "步态不稳", "频繁抬蹄", "轻度跛行",
      ],
    },
    allowDisease: true,
  },
  产后护理: {
    tags: {
      label: "症状标签",
      required: true,
      // 产后可观察到的体征，不含诊断结论
      presets: [
        "一切正常",
        "产犊难易度 ≥ 3",
        "产道损伤等级 ≥ 2",
        "产犊数量 ≥ 2",
        "犊牛体重 ≥ 45kg",
        "犊牛为「死胎」",
        "早产",
        "双胎或以上",
        "胎衣不下",
      ],
    },
    allowDisease: true,
  },
  干奶: {
    tags: {
      label: "干奶依据",
      required: true,
      // 干奶症状池：仅保留两条现场判断标签
      presets: ["确认已孕", "干奶后乳区仍旧漏奶"],
    },
    allowDisease: true,
  },

  疫苗: {
    note: { label: "事项说明", placeholder: "请描述疫苗品种、批次、覆盖范围等" },
    allowDisease: false,
  },
  驱虫: {
    note: { label: "事项说明", placeholder: "请描述驱虫药品、覆盖范围、给药方式" },
    allowDisease: false,
  },
  普修: {
    tags: {
      label: "症状标签",
      required: true,
      presets: ["采食下降", "精神沉郁", "外伤", "卧地不起", "体况下降", "行为异常", "其他异常"],
    },
    allowDisease: false,
  },
};


// 疾病知识库 + 自动治疗方案（分工单类型；来源：晟安标准处方）
// 处方内容以结构化条目表示，展示时按映射规则拼装：
//   用药任务：{药品名称} + {给药方式} + {用药方法?} + {具体剂量结果}
//   非用药任务：{任务名称} + {任务类型} + {记录方式}
type PlanDrugItem = {
  kind: "drug";
  name: string;
  route: string; // 给药方式：肌注 / 静推 / 口服 / 乳房灌注 / 子宫灌注 …
  method?: string; // 用药方法：如「缓慢推注」「隔日 1 次」，可选
  dose: string; // 具体剂量结果
};
type PlanCareItem = {
  kind: "care";
  name: string; // 任务名称
  type: string; // 任务类型：护理 / 观察 / 检查 …
  record: string; // 记录方式：图片视频 / 文字记录 / 数值录入 …
};
type PlanItem = PlanDrugItem | PlanCareItem;

type DiseasePlan = { id: string; rx: string; desc?: string; items: PlanItem[]; duration: string };
type DiseaseEntry = { name: string; symptoms: string[]; plans: DiseasePlan[] };

// 单条处方内容的展示串
export function formatPlanItem(it: PlanItem): string {
  if (it.kind === "drug") {
    return [it.name, it.route].filter(Boolean).join(" · ");
  }
  return it.name;
}


// 常用条目模板，减少重复
const D = (name: string, route: string, dose: string, method?: string): PlanDrugItem => ({
  kind: "drug", name, route, dose, ...(method ? { method } : {}),
});
const C = (name: string, type: string, record: string): PlanCareItem => ({
  kind: "care", name, type, record,
});

// 疾病治疗（子宫炎类）
const diseaseKB_disease: DiseaseEntry[] = [
  {
    name: "产道创伤",
    symptoms: ["阴道黏膜层撕裂", "助产 3 分及以上", "外伤出血"],
    plans: [
      { id: "p1", rx: "处方 1 · 5% 头孢噻呋 + 氟尼辛", desc: "5% 盐酸头孢噻呋（畜可健等），4.4mL/100kg，肌肉注射，1 天 1 次，连用 3 天。氟尼辛葡甲胺，4mL/100kg，静脉推注，1 天 1 次，连用 3 天。", items: [
        D("5% 盐酸头孢噻呋（畜可健）", "肌注", "4.4mL/100kg"),
        D("氟尼辛葡甲胺（福欣安）", "静推", "4mL/100kg"),
      ], duration: "3-5 天" },
      { id: "p2", rx: "处方 2 · 10% 头孢噻呋 + 氟尼辛", desc: "10% 盐酸头孢噻呋，20mL/次，3 天 1 次。氟尼辛葡甲胺，4mL/100kg，静脉推注，1 天 1 次，连用 3 天。", items: [
        D("10% 盐酸头孢噻呋", "肌注", "20mL/次", "3 天 1 次"),
        D("氟尼辛葡甲胺（福欣安）", "静推", "4mL/100kg"),
      ], duration: "3-5 天" },
    ],
  },
  {
    name: "产后子宫炎",
    symptoms: ["体温升高", "体温 > 39.5℃", "分泌物恶臭", "分泌物含 >50% 脓", "采食下降", "精神沉郁"],
    plans: [
      { id: "p1", rx: "处方 1 · 青霉素钠 + 氟尼辛", desc: "青霉素钠，2.2 万单位/kg，肌肉或静脉注射，1 天 2 次，连用 3 天。氟尼辛葡甲胺，4mL/100kg，静脉推注，1 天 1 次，连用 3 天。", items: [
        D("注射用青霉素钠（联治灵）", "肌注", "2.2 万 IU/kg"),
        D("氟尼辛葡甲胺（福欣安）", "静推", "4mL/100kg"),
      ], duration: "3 天" },
      { id: "p2", rx: "处方 2 · 5% 头孢噻呋 + 氟尼辛", desc: "5% 盐酸头孢噻呋（畜可健等），4.4mL/100kg，肌肉注射，1 天 1 次，连用 3 天。氟尼辛葡甲胺，4mL/100kg，静脉推注，1 天 1 次，连用 3 天。", items: [
        D("5% 盐酸头孢噻呋（畜可健）", "肌注", "4.4mL/100kg"),
        D("氟尼辛葡甲胺（福欣安）", "静推", "4mL/100kg"),
      ], duration: "3 天" },
      { id: "p3", rx: "处方 3 · 10% 头孢噻呋 + 利福昔明灌注", desc: "10% 盐酸头孢噻呋，20mL/次，3 天 1 次。氟尼辛葡甲胺，4mL/100kg，静脉推注，1 天 1 次，连用 3 天。产后 5 天以上的，可同时辅助利福昔明子宫灌注，100mL/次，2 天一次，连用 2-3 次。", items: [
        D("10% 盐酸头孢噻呋", "肌注", "20mL", "3 天 1 次"),
        D("氟尼辛葡甲胺（福欣安）", "静推", "4mL/100kg"),
        D("利福昔明子宫注入剂（澳利舒）", "子宫灌注", "100mL/次"),
      ], duration: "3 天" },
    ],
  },
  {
    name: "子宫内膜炎",
    symptoms: ["直肠检查子宫异常", "分泌物含 >50% 脓", "产后 21-28 天"],
    plans: [
      { id: "p1", rx: "处方 1 · 青霉素钠 + 氟尼辛", desc: "青霉素钠，2.2 万单位/kg，肌肉或静脉注射，1 天 2 次，连用 3 天。氟尼辛葡甲胺，4mL/100kg，静脉推注，1 天 1 次，连用 3 天。", items: [
        D("注射用青霉素钠（联治灵）", "肌注", "2.2 万 IU/kg"),
        D("氟尼辛葡甲胺（福欣安）", "静推", "4mL/100kg"),
      ], duration: "3 天" },
      { id: "p2", rx: "处方 2 · 利福昔明子宫灌注", desc: "利福昔明子宫注入剂，100mL/次，2 天一次，连用 2-3 次。", items: [
        D("利福昔明子宫注入剂（澳利舒）", "子宫灌注", "100mL/次", "2 天 1 次"),
      ], duration: "2-3 次" },
    ],
  },
];

// 修蹄工单：只覆盖「牛蹄变形需修蹄」的场景（蹄病治疗走「疾病治疗」工单）
// 结论固定为「修蹄处理」，仅一个处方，含五步修蹄法的护理任务
const diseaseKB_hoof: DiseaseEntry[] = [
  {
    name: "修蹄处理",
    symptoms: [
      "蹄过长", "蹄形不正", "蹄壁裂纹", "副蹄过长",
      "行走姿势异常", "步态不稳", "频繁抬蹄", "轻度跛行",
    ],
    plans: [
      {
        id: "p1",
        rx: "处方 1 · 五步修蹄法",
        desc: "按「前内后外」顺序完成五步修蹄；清除蹄底淤血与溃烂组织，实现双蹄瓣负重面平整、等高，站立舒适、行走稳定",
        items: [
          C("修长度", "护理", "图片视频"),
          C("修平整度", "护理", "图片视频"),
          C("修角度", "护理", "图片视频"),
          C("清理趾间与特殊结构", "护理", "图片视频"),
          C("检查与修复", "护理", "图片视频"),
        ],
        duration: "1 天",
      },
    ],
  },
];

// 干奶工单（乳注处方）：结论固定为「干奶处理」，下含 5 个按非盲乳数一次量乳注的处方
const diseaseKB_drying: DiseaseEntry[] = [
  {
    name: "干奶处理",
    symptoms: ["确认已孕", "干奶后乳区仍旧漏奶"],
    plans: [
      { id: "p1", rx: "处方 1 · 硫酸头孢喹肟乳注（牧全欣）", desc: "处方摘要：硫酸头孢喹肟乳房注入剂 干乳期（牧全欣），4支/次，一天一次；复查3天。", items: [
        D("硫酸头孢喹肟乳房注入剂 干乳期（牧全欣）", "乳房灌注", "3 g/支 × 非盲乳数"),
      ], duration: "1 天" },
      { id: "p2", rx: "处方 2 · 硫酸头孢喹肟乳注（茹通）", desc: "处方摘要：硫酸头孢喹肟乳房注入剂（干乳期）（茹通），4支/次，一天一次；复查3天。", items: [
        D("硫酸头孢喹肟乳房注入剂（干乳期）（茹通）", "乳房灌注", "3 g/支 × 非盲乳数"),
      ], duration: "1 天" },
      { id: "p3", rx: "处方 3 · 硫酸头孢喹肟乳注（海喹宁）", desc: "处方摘要：硫酸头孢喹肟乳房注入剂（干乳期）（海喹宁），4支/次，一天一次；复查3天。", items: [
        D("硫酸头孢喹肟乳房注入剂（干乳期）（海喹宁）", "乳房灌注", "3 g/支 × 非盲乳数"),
      ], duration: "1 天" },
      { id: "p4", rx: "处方 4 · 盐酸头孢噻呋乳注（畜可健）", desc: "处方摘要：盐酸头孢噻呋乳房注入剂 干乳期（畜可健），4支/次，一天一次；复查3天。", items: [
        D("盐酸头孢噻呋乳房注入剂 干乳期（畜可健）", "乳房灌注", "8 ml/支 × 非盲乳数"),
      ], duration: "1 天" },
      { id: "p5", rx: "处方 5 · 硫酸头孢喹肟乳注（赛福魁）", desc: "处方摘要：硫酸头孢喹肟乳房注入剂 干乳期（赛福魁），4支/次，一天一次；复查3天。", items: [
        D("硫酸头孢喹肟乳房注入剂 干乳期（赛福魁）", "乳房灌注", "3 g/支 × 非盲乳数"),
      ], duration: "1 天" },
    ],
  },
];

// 产后护理工单：结论仅两种——「产后正常」与「产后高危」
// 数据严格按标准处方录入；剂量含「体重区间」计算变量时以档位公式展示。
const diseaseKB_postpartum: DiseaseEntry[] = [
  {
    name: "产后正常",
    symptoms: ["一切正常"],
    plans: [
      {
        id: "p1",
        rx: "处方 1 · 检查处方",
        desc: "为期 14 天的产后检查任务，包含直肠体温数字记录和牛只正前方、正后方照片采集。",
        items: [
          C("直肠体温", "检查", "数字输入"),
          C("情况评估", "检查", "图片视频"),
        ],
        duration: "14 天",
      },
    ],
  },
  {
    name: "产后高危",
    symptoms: [
      "产犊难易度 ≥ 3", "产道损伤等级 ≥ 2", "产犊数量 ≥ 2",
      "犊牛体重 ≥ 45kg", "犊牛为「死胎」", "早产", "双胎或以上", "胎衣不下",
    ],
    plans: [
      { id: "p1", rx: "处方 1 · 5% 头孢噻呋 + 氟尼辛", desc: "5% 盐酸头孢噻呋（畜可健等），4.4mL/100kg，肌肉注射，1 天 1 次，连用 3 天。氟尼辛葡甲胺，4mL/100kg，静脉推注，1 天 1 次，连用 3 天。", items: [
        D("5% 盐酸头孢噻呋注射液（畜可健）", "肌肉注射", "按体重 10/20/30/35 mL/次（200-400 / 400-600 / 600-900 / ≥900 kg）", "1 天 1 次，连用 3 天"),
        D("氟尼辛葡甲胺注射液（福欣安）", "静脉注射", "按体重 10/20/30/35 mL/次（200-400 / 400-600 / 600-900 / ≥900 kg）", "1 天 1 次，连用 3 天"),
        C("直肠体温", "检查", "数字输入"),
        C("情况评估", "检查", "图片视频"),
      ], duration: "14 天" },
      { id: "p2", rx: "处方 2 · 10% 头孢噻呋 + 氟尼辛", desc: "10% 盐酸头孢噻呋，20mL/次，3 天 1 次。氟尼辛葡甲胺，4mL/100kg，静脉推注，1 天 1 次，连用 3 天。", items: [
        D("10% 盐酸头孢噻呋注射液（畜可健 / 欣利达）", "肌肉注射", "按体重 5/10/15/20 mL/次（200-400 / 400-600 / 600-900 / ≥900 kg）", "3 天 1 次"),
        D("氟尼辛葡甲胺注射液（福欣安）", "静脉注射", "按体重 10/20/30/35 mL/次（200-400 / 400-600 / 600-900 / ≥900 kg）", "1 天 1 次，连用 3 天"),
        C("直肠体温", "检查", "数字输入"),
        C("情况评估", "检查", "图片视频"),
      ], duration: "14 天" },
    ],
  },
];



const diseaseKBByType: Record<WorkType, DiseaseEntry[]> = {
  疾病治疗: diseaseKB_disease,
  修蹄: diseaseKB_hoof,
  干奶: diseaseKB_drying,
  产后护理: diseaseKB_postpartum,

  疫苗: [],
  驱虫: [],
  普修: [],
};


// 根据牛只编号查询所属牛舍（mock）
function barnOfCattle(id: string): string {
  const { seq } = parseCowId(id);
  if (seq) {
    const idx = (Math.floor(seq / 100) % 8) + 1;
    return `${idx} 号牛舍`;
  }
  return "未知牛舍";
}


function loadDraft(draftId?: string, target?: string): any | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("report:drafts");
    if (!raw) return null;
    const list = JSON.parse(raw) as any[];
    if (draftId) return list.find((x) => x.id === draftId) ?? null;
    if (target) return list.find((x) => x.target === target) ?? null;
    return null;
  } catch {
    return null;
  }
}

function ReportPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const role = useRole();
  // 健康类工作：内部角色（兽医/场长/兽医助理/管理员）与外部专项执行人员（如修蹄工）均可上报
  const canReportHealth = true;

  // 草稿预填：从 localStorage 读取，保证编辑页与上报页排版/字段完全一致
  const draft = useMemo(
    () => loadDraft(search.draftId, search.target),
    [search.draftId, search.target]
  );
  const draftId = draft?.id as string | undefined;

  const [kind] = useState<ReportKind>("health");

  // 上报模式：扫到牛舍且无指定牛只 → 默认以牛舍为对象；从现场上报入口进入时支持手动切换
  const lockMode = !!search.barn || !!search.target;
  const [mode, setMode] = useState<"cow" | "barn">(
    !!search.barn && !search.target ? "barn" : "cow"
  );
  const barnMode = mode === "barn";

  const [targets, setTargets] = useState<string[]>(
    draft?.targets?.length
      ? draft.targets
      : draft?.target
      ? String(draft.target).split("、").filter(Boolean)
      : search.target
      ? [search.target]
      : []
  );
  const [barns, setBarns] = useState<string[]>(
    barnMode && search.barn ? [search.barn] : []
  );
  // 牛舍信息：优先使用 URL 锁定值，否则按首个牛只编号自动获取
  const barn = useMemo(() => {
    if (search.barn) return search.barn;
    if (targets.length > 0) return barnOfCattle(targets[0]);
    return "";
  }, [search.barn, targets]);
  const lockBarn = !!barn;

  const addTarget = (v: string) => {
    const t = v.trim();
    if (!t) return;
    setTargets((prev) => (prev.includes(t) ? prev : [...prev, t]));
  };

  const removeTarget = (t: string) => setTargets((prev) => prev.filter((x) => x !== t));
  const updateTarget = (oldVal: string, newVal: string) => {
    const v = newVal.trim();
    if (!v) return;
    setTargets((prev) => prev.map((x) => (x === oldVal ? v : x)));
  };

  // 牛舍多选（barnMode）
  const allBarns = useMemo(
    () => Array.from({ length: 48 }, (_, i) => `${i + 1} 号牛舍`),
    []
  );

  const addBarn = (v: string) => {
    const t = v.trim();
    if (!t) return;
    setBarns((prev) => (prev.includes(t) ? prev : [...prev, t]));
  };
  const removeBarn = (t: string) => {
    setBarns((prev) => (prev.length <= 1 ? prev : prev.filter((x) => x !== t)));
  };
  const [barnAddQuery, setBarnAddQuery] = useState("");
  const [barnPickerOpen, setBarnPickerOpen] = useState(false);
  const barnMatches = useMemo(() => {
    const kw = barnAddQuery.trim();
    const pool = allBarns.filter((b) => !barns.includes(b));
    return kw ? pool.filter((b) => b.includes(kw)) : pool;
  }, [allBarns, barns, barnAddQuery]);


  const [editingTarget, setEditingTarget] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [desc, setDesc] = useState<string>(draft?.desc ?? "");
  const [photos, setPhotos] = useState<number[]>(draft?.photos ?? [1, 2]);
  const [videos, setVideos] = useState<number[]>(draft?.videos ?? []);
  const [voiceSecs, setVoiceSecs] = useState<number | null>(draft?.voiceSecs ?? null);
  const [recording, setRecording] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showDraftDialog, setShowDraftDialog] = useState(false);

  // 复诊关联
  const fromRevisit = !!search.revisitFrom;
  const [isRevisit, setIsRevisit] = useState<boolean | null>(
    fromRevisit ? true : false
  );
  const [relatedOrderId, setRelatedOrderId] = useState<string>(
    search.revisitFrom ?? ""
  );
  const [revisitReason, setRevisitReason] = useState<string>(
    search.revisitReason ?? ""
  );
  const [revisitReasonOther, setRevisitReasonOther] = useState("");
  const [orderPickerOpen, setOrderPickerOpen] = useState(false);
  const [detectDialog, setDetectDialog] = useState<{
    cowId: string;
    orderId: string;
  } | null>(null);
  

  // 可选关联工单候选（含近 7 日检测到的工单 + 该牛只最近的几条 mock 工单）
  const candidateOrders = useMemo<RelatedOrder[]>(() => {
    const cowId = targets[0] ?? "";
    const targetLabel = cowId ? `#${cowId}` : "—";
    const detected = cowId ? recentDiseaseOrderOf(cowId) : null;
    const list: RelatedOrder[] = [];
    if (detected) {
      list.push({
        id: detected,
        type: "疾病治疗",
        conclusion: "乳房炎急性发作",
        target: targetLabel,
        reportedAt: "2026-05-26 08:12",
        diagnosedAt: "2026-05-26 09:30",
        startedAt: "2026-05-26 10:05",
        completedAt: "2026-05-26 16:40",
        recent: true,
      });
    }
    const extras: RelatedOrder[] = [
      { id: "WO-20260128", type: "疾病治疗", conclusion: "蹄叶炎", target: targetLabel, reportedAt: "2026-04-28 09:10", diagnosedAt: "2026-04-28 10:20", startedAt: "2026-04-28 11:00", completedAt: "2026-04-28 17:20" },
      { id: "WO-20260117", type: "疾病治疗", conclusion: "瘤胃酸中毒", target: targetLabel, reportedAt: "2026-04-17 07:45", diagnosedAt: "2026-04-17 08:50", startedAt: "2026-04-17 09:30", completedAt: "2026-04-17 15:10" },
      { id: "WO-20260105", type: "疾病治疗", conclusion: "酮病", target: targetLabel, reportedAt: "2026-04-05 08:20", diagnosedAt: "2026-04-05 09:15", startedAt: "2026-04-05 10:00", completedAt: "2026-04-05 14:30" },
    ];
    extras.forEach((o) => {
      if (!list.find((x) => x.id === o.id)) list.push(o);
    });
    return list;
  }, [targets]);

  const selectedOrder = useMemo(
    () => candidateOrders.find((o) => o.id === relatedOrderId) ?? null,
    [candidateOrders, relatedOrderId]
  );

  // 牛只填好后探测近 7 日工单：按"首个牛只编号"为粒度，换一头牛重新触发
  const [detectedFor, setDetectedFor] = useState<string | null>(
    fromRevisit && targets[0] ? targets[0] : null
  );
  useEffect(() => {
    if (fromRevisit || barnMode) return;
    const cowId = targets[0];
    if (!cowId) return;
    if (detectedFor === cowId) return;
    const orderId = recentDiseaseOrderOf(cowId);
    setDetectedFor(cowId);
    if (orderId) {
      setDetectDialog({ cowId, orderId });
    } else if (isRevisit === null) {
      setIsRevisit(false);
      setRelatedOrderId("-");
    }
  }, [targets, barnMode, fromRevisit, detectedFor, isRevisit]);

  // 健康
  // 工单类型：疾病治疗 / 干奶 / 修蹄；修蹄工固定为修蹄且不可改
  const [workType, setWorkType] = useState<WorkType>(
    role === "hoof_trimmer" ? "修蹄" : "疾病治疗"
  );
  const lockWorkType = role === "hoof_trimmer";
  const cfg = workTypeConfig[workType];

  const [symptoms, setSymptoms] = useState<string[]>(draft?.symptoms ?? []);
  const [note, setNote] = useState<string>(draft?.note ?? "");
  const [temperature, setTemperature] = useState<string>(draft?.temperature ?? "");
  const [ketone, setKetone] = useState<string>(draft?.ketone ?? "");
  const [diseaseQ, setDiseaseQ] = useState("");
  const [diseaseFocused, setDiseaseFocused] = useState(false);
  const [diseasePickerOpen, setDiseasePickerOpen] = useState(false);
  const [suspectedDisease, setSuspectedDisease] = useState<string>(draft?.suspectedDisease ?? "");


  // 是否转栏
  const [needTransfer, setNeedTransfer] = useState(false);
  const [transferBarn, setTransferBarn] = useState<string>("");
  const [transferQ, setTransferQ] = useState("");
  const [transferFocused, setTransferFocused] = useState(false);
  const lastTransferBarn = typeof window !== "undefined"
    ? localStorage.getItem("mp:lastTransferBarn") ?? ""
    : "";

  // 是否完成"线索上传"——之后才显示疑似疾病（照片/视频必填）
  const evidenceReady = photos.length > 0 || videos.length > 0;

  const activeDiseaseKB = diseaseKBByType[workType] ?? [];
  const diseaseMatches = useMemo(() => {
    const kw = diseaseQ.trim().toLowerCase();
    const base = kw
      ? activeDiseaseKB.filter((d) => d.name.toLowerCase().includes(kw))
      : [...activeDiseaseKB].sort((a, b) => {
          const ai = a.symptoms.filter((s) => symptoms.includes(s)).length;
          const bi = b.symptoms.filter((s) => symptoms.includes(s)).length;
          return bi - ai;
        });
    return base.slice(0, 6);
  }, [diseaseQ, symptoms, activeDiseaseKB]);

  const selectedDisease = useMemo(
    () => activeDiseaseKB.find((d) => d.name === suspectedDisease) ?? null,
    [suspectedDisease, activeDiseaseKB]
  );

  const [planIdx, setPlanIdx] = useState(0);
  const [planPickerOpen, setPlanPickerOpen] = useState(false);
  useEffect(() => { setPlanIdx(0); }, [suspectedDisease]);
  const selectedPlan = selectedDisease?.plans[planIdx] ?? null;

  // 处方用药所需的计算变量（体重区间 / 非盲乳数），根据处方内容自动识别
  const planCalcVars = useMemo<("weight" | "quarter")[]>(() => {
    if (!selectedDisease || !selectedPlan) return [];
    const vars: ("weight" | "quarter")[] = [];
    const text = selectedPlan.items.map(formatPlanItem).join(" ");
    if (/\/\s*(?:100)?\s*kg|IU\s*\/\s*kg|mg\s*\/\s*kg/i.test(text)) vars.push("weight");
    if (selectedDisease.name === "干奶处理") vars.push("quarter");
    return vars;
  }, [selectedDisease, selectedPlan]);

  // 现场可选填的计算变量
  const [cattleWeight, setCattleWeight] = useState<string>("");
  const [nonBlindQuarters, setNonBlindQuarters] = useState<string>("");
  // 切换处方时不清空，避免误操作；用户可手动更改




  const startVoice = () => {
    if (recording) {
      setRecording(false);
      setVoiceSecs(12);
      return;
    }
    setRecording(true);
  };

  const finalRevisitReason =
    revisitReason === "其他" ? revisitReasonOther.trim() : revisitReason;

  const canSubmit =
    (barnMode ? barns.length > 0 : targets.length > 0) &&
    (!cfg?.tags?.required || symptoms.length > 0) &&
    (!cfg?.note || note.trim().length > 0) &&
    desc.trim().length > 0 &&
    evidenceReady &&
    (isRevisit !== true || finalRevisitReason.length > 0);



  const [transferConfirmOpen, setTransferConfirmOpen] = useState(false);
  const earTagLabel = useMemo(() => {
    if (barnMode) {
      if (barns.length === 0) return "本批牛只";
      return barns.length === 1 ? `${barns[0]} 整栏` : `${barns.join("、")} 整栏`;
    }
    if (targets.length === 0) return "本批牛只";
    const formatted = targets.map((t) => (t.startsWith("#") ? t : `#${t}`));
    if (formatted.length === 1) return formatted[0];
    if (formatted.length <= 3) return formatted.join("、");
    return `${formatted.slice(0, 2).join("、")} 等 ${formatted.length} 头`;
  }, [barnMode, barns, targets]);

  const [postSubmitOpen, setPostSubmitOpen] = useState(false);
  const [newWorkOrderId, setNewWorkOrderId] = useState<string>("");

  // 干奶复诊：干奶后 3 天复查窗口内，兽医/助理再次上报（关联原干奶工单），
  // 提交后系统自动完成诊断（默认通过），无需人工诊断确认。
  const isDryingRevisit = workType === "干奶" && isRevisit === true && !!relatedOrderId && relatedOrderId !== "-";

  const doSubmit = () => {
    setSubmitted(true);
    const newId = `WO-${Math.floor(Math.random() * 9000 + 1000)}`;

    if (isDryingRevisit) {
      toast.success("已上报，系统已自动完成诊断（默认通过）", {
        description: `关联原干奶工单 ${relatedOrderId}，工单 ${newId} 已进入执行阶段`,
      });
      setTimeout(() => navigate({ to: "/m/health" }), 900);
      return;
    }

    // 兽医/场长在现场上报后，提示是否直接进入诊断
    if (role === "vet" || role === "manager") {
      setNewWorkOrderId(newId);
      setTimeout(() => setPostSubmitOpen(true), 400);
      return;
    }
    setTimeout(() => navigate({ to: "/m/health" }), 900);
  };

  const submit = () => {
    if (!canSubmit) return;
    if (needTransfer && transferBarn) {
      setTransferConfirmOpen(true);
      return;
    }
    doSubmit();
  };

  // 同牛舍其他牛只（mock 数据，规模 30+ 头，需搜索/扫码添加）
  // 全牧场牛只池（mock；跨牛舍）
  const farmCattlePool = useMemo(
    () =>
      Array.from({ length: 240 }, (_, i) => {
        const seq = 2100 + i;
        // {牧场两位数编号}-{出生年份后两位}-{顺序编号四位}
        const yy = String(20 + (seq % 6)).padStart(2, "0");
        return `08-${yy}-${String(seq).padStart(4, "0")}`;
      }),
    []

  );
  const [addQuery, setAddQuery] = useState("");
  const [cowPickerOpen, setCowPickerOpen] = useState(false);
  const addMatches = useMemo(() => {
    const kw = addQuery.trim().toLowerCase();
    const pool = farmCattlePool.filter((x) => !targets.includes(x));
    const base = kw ? pool.filter((x) => x.toLowerCase().includes(kw)) : pool;
    return base.slice(0, 30);
  }, [addQuery, farmCattlePool, targets]);
  

  return (
    <MobileShell title="健康上报" back hideTabBar>
      <div className="px-4 pt-3 pb-28 space-y-5">
        {kind === "health" ? (
          <>

            {/* 上报类型 */}
            <Section title="上报类型" required>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { v: "疾病治疗" as WorkType, label: "疾病治疗" },
                  { v: "产后护理" as WorkType, label: "产后护理" },
                  { v: "干奶" as WorkType, label: "干奶工单" },
                  { v: "修蹄" as WorkType, label: "修蹄工单" },
                ]).map((opt) => {
                  const active = workType === opt.v;
                  const disabled = lockWorkType && opt.v !== "修蹄";
                  return (
                    <button
                      key={opt.v}
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        if (disabled || workType === opt.v) return;
                        setWorkType(opt.v);
                        setSymptoms([]);
                        setSuspectedDisease("");
                        setNote("");
                      }}
                      className={`h-10 rounded-lg text-body-sm transition-colors border ${
                        active
                          ? "bg-brand-subtle text-primary border-primary/40 font-medium"
                          : disabled
                          ? "bg-surface-subtle text-text-tertiary border-border opacity-50"
                          : "bg-card text-text-secondary border-border"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              {lockWorkType && (
                <div className="mt-2 text-caption text-text-tertiary">
                  当前角色为修蹄工，仅可上报修蹄工单
                </div>
              )}
            </Section>

            {/* 上报对象 */}
            <Section
              title="上报对象"
              required
            >


              {!lockMode && (
                <div className="mb-2.5 inline-flex rounded-full border border-border bg-surface-subtle p-0.5">
                  {[
                    { v: "cow" as const, label: "按牛只" },
                    { v: "barn" as const, label: "按牛舍" },
                  ].map((opt) => {
                    const active = mode === opt.v;
                    return (
                      <button
                        key={opt.v}
                        type="button"
                        onClick={() => {
                          if (mode === opt.v) return;
                          setMode(opt.v);
                          setTargets([]);
                          setBarns([]);
                          setAddQuery("");
                          setBarnAddQuery("");
                        }}
                        className={`h-8 min-w-[72px] px-3 rounded-full text-body-sm transition-colors ${
                          active
                            ? "bg-card text-foreground border border-border shadow-sm"
                            : "text-text-tertiary"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              )}
              {barnMode ? (
                <div className="space-y-2">
                  {barns.map((b) => (
                    <BarnProfileCard key={b} barn={b} onRemove={() => setBarns([])} />
                  ))}

                  {barns.length === 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setBarnAddQuery("");
                        setBarnPickerOpen(true);
                      }}
                      className="w-full h-12 px-3 rounded-xl bg-card border border-border text-left text-body text-text-tertiary flex items-center gap-2"
                    >
                      <Search className="h-4 w-4 text-text-tertiary" />
                      <span className="flex-1">点击选择牛舍</span>
                    </button>
                  )}
                </div>
              ) : (
              <div
                className="space-y-2"
                onClick={(e) => {
                  if (editingTarget && (e.target as HTMLElement).tagName !== "INPUT") {
                    updateTarget(editingTarget, editingValue);
                    setEditingTarget(null);
                  }
                }}
              >

                {targets.map((t) => {
                  const isEditing = editingTarget === t;
                  const canDelete = true;
                  const tBarn = search.barn ?? barnOfCattle(t);
                  return (
                    <div key={t} className="space-y-2">
                    {isEditing ? (
                    <div
                      className="flex items-center h-12 pl-3 pr-2 rounded-xl bg-card border border-border text-body text-foreground gap-2"
                    >
                          <span className="font-mono text-text-tertiary">#</span>
                          <input
                            autoFocus
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                updateTarget(t, editingValue);
                                setEditingTarget(null);
                              } else if (e.key === "Escape") {
                                setEditingTarget(null);
                              }
                            }}
                            className="font-mono flex-1 min-w-0 h-9 px-2 rounded-md bg-surface-subtle border border-border text-body"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className="font-mono text-text-tertiary shrink-0 text-caption">· {tBarn}</span>
                    </div>
                    ) : (
                      <CowProfileCard
                        cowId={t}
                        barn={tBarn}
                        onRemove={canDelete ? () => removeTarget(t) : undefined}
                      />
                    )}
                    </div>
                  );

                })}
                {targets.length > 0 ? (
                  <div className="text-caption text-text-tertiary">
                    单次仅可上报一头牛只；如需更换，请先删除已选牛只
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setAddQuery("");
                      setCowPickerOpen(true);
                    }}
                    className="w-full h-12 px-3 rounded-xl bg-card border border-border text-left text-body text-text-tertiary flex items-center gap-2"
                  >
                    <Search className="h-4 w-4 text-text-tertiary" />
                    <span className="flex-1">输入牛只耳号搜索并选择</span>
                  </button>
                )}
              </div>
              )}

            </Section>


            {/* 复诊信息：默认折叠，仅切到"是"时展开 */}
            {!barnMode && (
              <Section title="复诊信息">
                <div className="flex items-center justify-between">
                  <div className="text-body-sm text-foreground">是否为复诊</div>
                  <div className="inline-flex rounded-full border border-border bg-surface-subtle p-0.5">
                    {[
                      { v: false, label: "否" },
                      { v: true, label: "是" },
                    ].map((opt) => {
                      const active = isRevisit === opt.v;
                      return (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() => {
                            if (opt.v) {
                              setIsRevisit(true);
                              if (!relatedOrderId || relatedOrderId === "-") {
                                const cowId = targets[0];
                                const detected = cowId ? recentDiseaseOrderOf(cowId) : null;
                                setRelatedOrderId(detected ?? "");
                              }
                            } else {
                              setIsRevisit(false);
                              setRelatedOrderId("-");
                              setRevisitReason("");
                              setRevisitReasonOther("");
                            }
                          }}
                          className={`h-8 min-w-[56px] px-3 rounded-full text-body-sm transition-colors ${
                            active
                              ? opt.v
                                ? "bg-primary text-primary-foreground"
                                : "bg-card text-foreground border border-border"
                              : "text-text-tertiary"
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {isRevisit === true && (
                  <div className="mt-4 space-y-4">
                    {workType === "干奶" && (
                      <div className="rounded-lg border border-primary/30 bg-brand-subtle px-3 py-2 text-caption text-primary leading-relaxed">
                        干奶后 3 天复查窗口：本次上报将作为原干奶工单的复诊。提交后系统会自动完成诊断（默认通过），无需人工确认。
                      </div>
                    )}
                    <div>
                      <div className="text-caption text-text-tertiary mb-2">
                        关联原始工单 <span className="text-[var(--state-danger)]">*</span>
                      </div>
                      {selectedOrder ? (
                        <div className="space-y-2">
                          <RelatedOrderCard order={selectedOrder} selected />
                          <button
                            type="button"
                            onClick={() => setOrderPickerOpen(true)}
                            className="w-full h-10 rounded-lg border border-dashed border-border bg-card text-body-sm text-text-secondary active:bg-surface-subtle"
                          >
                            重新选择
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setOrderPickerOpen(true)}
                          className="w-full h-11 rounded-lg border border-dashed border-border bg-card text-body-sm text-text-secondary inline-flex items-center justify-center gap-1 active:bg-surface-subtle"
                        >
                          <Search className="h-4 w-4" />
                          选择关联工单
                        </button>
                      )}
                    </div>

                    <div>
                      <div className="text-caption text-text-tertiary mb-2">
                        复诊原因 <span className="text-[var(--state-danger)]">*</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {[...REVISIT_REASONS, "其他"].map((r) => {
                          const active = revisitReason === r;
                          return (
                            <button
                              key={r}
                              type="button"
                              onClick={() => setRevisitReason(r)}
                              className={`h-8 px-3 rounded-full text-body-sm border ${
                                active
                                  ? "bg-brand-subtle text-primary border-primary/40"
                                  : "bg-card text-text-secondary border-border"
                              }`}
                            >
                              {r}
                            </button>
                          );
                        })}
                      </div>
                      {revisitReason === "其他" && (
                        <textarea
                          value={revisitReasonOther}
                          onChange={(e) => setRevisitReasonOther(e.target.value)}
                          placeholder="请输入复诊原因"
                          className="mt-2 w-full min-h-[72px] rounded-lg border border-border bg-card px-3 py-2 text-body-sm placeholder:text-text-tertiary resize-none focus:outline-none focus:border-primary/40"
                        />
                      )}
                    </div>
                  </div>
                )}
              </Section>
            )}

            {(
              <></>
            )}
            {true && (
              <>
                {/* ===== 牛只情况 分组 ===== */}
                <div className="pt-1 pb-0.5 flex items-center gap-2">
                  <span className="text-section-title text-foreground font-medium">牛只情况</span>
                  <span className="text-caption text-text-tertiary">症状、体征数据与现场记录</span>
                </div>

                {/* 标签字段（按工作类型显示） */}
                {cfg?.tags && (
                  <Section
                    title={cfg.tags.label}
                    required={cfg.tags.required}
                    hint="输入关键词搜索，或直接创建"
                  >
                    <TagPicker
                      selected={symptoms}
                      onChange={(next) => {
                        // 产后护理：「一切正常」与其它症状互斥
                        if (workType === "产后护理") {
                          const NORMAL = "一切正常";
                          const prevHas = symptoms.includes(NORMAL);
                          const nextHas = next.includes(NORMAL);
                          if (nextHas && !prevHas) {
                            setSymptoms([NORMAL]);
                            return;
                          }
                          if (nextHas && next.length > 1) {
                            setSymptoms(next.filter((s) => s !== NORMAL));
                            return;
                          }
                        }
                        setSymptoms(next);
                      }}
                      presets={cfg.tags.presets}
                    />
                  </Section>
                )}

                {/* 体征数据（体温非必填） */}
                <Section title="体征数据" hint="可选；如已现场测量请填写">
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block">
                      <div className="text-caption text-text-tertiary mb-1">
                        体温 <span className="text-text-tertiary">(选填)</span>
                      </div>
                      <div className="relative">
                        <input
                          inputMode="decimal"
                          value={temperature}
                          onChange={(e) => setTemperature(e.target.value)}
                          placeholder="如 39.2"
                          maxLength={5}
                          className="h-10 w-full pl-3 pr-10 rounded-lg bg-card border border-border text-body-sm placeholder:text-text-tertiary focus:outline-none focus:border-primary"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-caption text-text-tertiary">℃</span>
                      </div>
                    </label>
                    <label className="block">
                      <div className="text-caption text-text-tertiary mb-1">
                        血酮 <span className="text-text-tertiary">(选填)</span>
                      </div>
                      <div className="relative">
                        <input
                          inputMode="decimal"
                          value={ketone}
                          onChange={(e) => setKetone(e.target.value)}
                          placeholder="如 1.2"
                          maxLength={5}
                          className="h-10 w-full pl-3 pr-16 rounded-lg bg-card border border-border text-body-sm placeholder:text-text-tertiary focus:outline-none focus:border-primary"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-caption text-text-tertiary">mmol/L</span>
                      </div>
                    </label>
                  </div>
                </Section>

                {/* 事项说明（干奶 / 疫苗 / 驱虫） */}
                {cfg?.note && (
                  <Section title={cfg.note.label} required>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder={cfg.note.placeholder}
                      rows={3}
                      className="w-full p-3 rounded-xl bg-card border border-border text-body placeholder:text-text-tertiary resize-none leading-relaxed"
                    />
                    <div className="text-right text-caption text-text-tertiary mt-1">{note.length} / 200</div>
                  </Section>
                )}

                {/* 证据材料 / 线索 */}
                <EvidenceSection
                  desc={desc}
                  setDesc={setDesc}
                  photos={photos}
                  setPhotos={setPhotos}
                  videos={videos}
                  setVideos={setVideos}
                  voiceSecs={voiceSecs}
                  setVoiceSecs={setVoiceSecs}
                  recording={recording}
                  onVoiceToggle={startVoice}
                />

                {/* ===== 诊断结论 分组（疑似疾病将预填至诊断页） ===== */}
                {cfg?.allowDisease && evidenceReady && (
                  <>
                    <div className="pt-1 pb-0.5 flex items-center gap-2">
                      <span className="text-section-title text-foreground font-medium">诊断结论</span>
                      <span className="text-caption text-text-tertiary inline-flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-primary" />
                        预填写，诊断时可修改
                      </span>
                    </div>

                    <Section
                      title="疑似疾病"
                      hint="可选；选择后将自动匹配治疗方案"
                    >
                      {!suspectedDisease ? (
                        <button
                          type="button"
                          onClick={() => setDiseasePickerOpen(true)}
                          className="w-full h-11 rounded-lg border border-dashed border-border bg-card text-body-sm text-text-secondary inline-flex items-center justify-center gap-1 active:bg-surface-subtle"
                        >
                          <Search className="h-4 w-4" />
                          选择疑似疾病
                        </button>
                      ) : (
                        <div className="rounded-lg border border-primary/20 bg-brand-subtle p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Check className="h-3.5 w-3.5 text-primary" />
                              <span className="text-body-sm text-primary font-medium">
                                {suspectedDisease}
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                setSuspectedDisease("");
                                setDiseaseQ("");
                              }}
                              className="text-caption text-text-tertiary"
                            >
                              重选
                            </button>
                          </div>
                        </div>
                      )}
                    </Section>

                    {/* ===== 治疗方案 分组 ===== */}
                    <div className="pt-1 pb-0.5 flex items-center gap-2">
                      <span className="text-section-title text-foreground font-medium">治疗方案</span>
                      <span className="text-caption text-text-tertiary inline-flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-primary" />
                        {selectedDisease ? "已自动匹配标准处方，仍可更换" : "选择疑似疾病后自动匹配"}
                      </span>
                    </div>

                    <Section
                      title="标准处方"
                      extra={
                        selectedDisease && selectedDisease.plans.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => setPlanPickerOpen(true)}
                            className="inline-flex items-center gap-1 text-caption text-primary active:opacity-70"
                          >
                            <RefreshCw className="h-3 w-3" />
                            更换方案（{planIdx + 1}/{selectedDisease.plans.length}）
                          </button>
                        ) : undefined
                      }
                    >
                      {selectedDisease && selectedPlan ? (
                        <div className="rounded-lg border border-primary/20 bg-brand-subtle/40 p-3 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-body font-medium text-foreground">
                            <FileText className="h-3.5 w-3.5 text-primary" />
                            {selectedPlan.rx}
                          </div>
                          {selectedPlan.desc && (
                            <div className="text-caption text-text-secondary">
                              <span className="text-text-tertiary">摘要：</span>
                              <span className="text-foreground">
                                {selectedPlan.desc}
                              </span>
                            </div>
                          )}
                          <div className="text-caption text-text-secondary">
                            <span className="text-text-tertiary">疗程：</span>
                            <span className="text-foreground">
                              {selectedPlan.duration}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-lg border border-dashed border-border bg-surface-2/40 p-4 text-center">
                          <FileText className="h-5 w-5 text-text-tertiary mx-auto mb-1.5" />
                          <div className="text-caption text-text-tertiary">
                            请先在上方选择疑似疾病，系统将自动匹配标准处方
                          </div>
                        </div>
                      )}
                    </Section>

                    {/* 处方计算变量（选填）：根据处方用药自动出现 */}
                    {planCalcVars.length > 0 && (
                      <Section
                        title="处方计算变量"
                        hint="选填；填写后诊断/执行时可直接沿用，无需重新采集"
                      >
                        <div className="grid grid-cols-2 gap-2">
                          {planCalcVars.includes("weight") && (
                            <label className="block">
                              <div className="text-caption text-text-tertiary mb-1">
                                牛只体重 <span className="text-text-tertiary">(选填)</span>
                              </div>
                              <div className="relative">
                                <input
                                  inputMode="decimal"
                                  value={cattleWeight}
                                  onChange={(e) => setCattleWeight(e.target.value)}
                                  placeholder="如 520"
                                  maxLength={5}
                                  className="h-10 w-full pl-3 pr-10 rounded-lg bg-card border border-border text-body-sm placeholder:text-text-tertiary focus:outline-none focus:border-primary"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-caption text-text-tertiary">kg</span>
                              </div>
                            </label>
                          )}
                          {planCalcVars.includes("quarter") && (
                            <label className="block">
                              <div className="text-caption text-text-tertiary mb-1">
                                非盲乳数 <span className="text-text-tertiary">(选填)</span>
                              </div>
                              <div className="flex gap-1.5">
                                {["1", "2", "3", "4"].map((n) => {
                                  const active = nonBlindQuarters === n;
                                  return (
                                    <button
                                      key={n}
                                      type="button"
                                      onClick={() =>
                                        setNonBlindQuarters(active ? "" : n)
                                      }
                                      className={`h-10 flex-1 rounded-lg border text-body-sm font-medium transition-colors ${
                                        active
                                          ? "border-primary bg-brand-subtle text-primary"
                                          : "border-border bg-card text-text-secondary"
                                      }`}
                                    >
                                      {n}
                                    </button>
                                  );
                                })}
                              </div>
                            </label>
                          )}
                        </div>
                      </Section>
                    )}
                  </>
                )}


                {/* 是否转栏 */}
                <Section title="是否转栏" hint="转入新栏会同步更新档案">
                  <TransferBarnControl
                    enabled={needTransfer}
                    onEnabledChange={setNeedTransfer}
                    value={transferBarn}
                    onValueChange={setTransferBarn}
                    exclude={[barn, ...barns]}
                    bordered={false}
                  />
                </Section>

              </>
            )}
          </>
        ) : null}

      </div>

      {/* 底部提交 */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] bg-card/95 backdrop-blur border-t border-border p-3 pb-[calc(env(safe-area-inset-bottom)+12px)] shadow-[0_-4px_16px_-8px_rgba(15,23,42,0.08)]">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowDraftDialog(true)}
            className="h-12 px-4 rounded-xl border border-border bg-card text-body-sm text-text-secondary inline-flex items-center justify-center active:bg-surface-subtle active:scale-[0.98] transition-transform"
          >
            存草稿
          </button>
          <button
            disabled={!canSubmit || submitted}
            onClick={submit}
            className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground text-body font-medium disabled:opacity-50 active:scale-[0.98] transition-all shadow-[0_4px_12px_-4px_color-mix(in_oklab,var(--primary)_55%,transparent)] disabled:shadow-none"
          >
            {submitted ? "已提交,工作已生成" : "提交上报"}
          </button>
        </div>
      </div>

      {/* 复诊检测弹窗 */}
      <DiseasePicker
        open={diseasePickerOpen}
        onClose={() => setDiseasePickerOpen(false)}
        diseases={activeDiseaseKB}
        selectedName={suspectedDisease}
        matchedSymptoms={symptoms}
        onSelect={(d) => setSuspectedDisease(d.name)}
      />

      <RelatedOrderPicker
        open={orderPickerOpen}
        onClose={() => setOrderPickerOpen(false)}
        orders={candidateOrders}
        selectedId={relatedOrderId}
        onSelect={(o) => setRelatedOrderId(o.id)}
      />

      {detectDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-[360px] rounded-2xl bg-card p-5 space-y-4">
            <h3 className="text-card-title text-foreground">是否为复诊？</h3>
            <p className="text-body-sm text-text-secondary">
              监测到牛只
              <span className="font-mono text-foreground"> #{detectDialog.cowId} </span>
              近 7 日有疾病诊疗工单
              <span className="font-mono text-foreground"> {detectDialog.orderId}</span>
              ，本次是否为复诊？
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsRevisit(false);
                  setRelatedOrderId("-");
                  setDetectDialog(null);
                }}
                className="flex-1 h-10 rounded-lg border border-border bg-card text-body-sm text-text-secondary"
              >
                否，非复诊
              </button>
              <button
                onClick={() => {
                  setIsRevisit(true);
                  setRelatedOrderId(detectDialog.orderId);
                  setDetectDialog(null);
                }}
                className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-body-sm"
              >
                是，复诊
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmTransferDialog
        open={transferConfirmOpen}
        earTag={earTagLabel}
        barn={transferBarn}
        onCancel={() => setTransferConfirmOpen(false)}
        onConfirm={() => {
          setTransferConfirmOpen(false);
          doSubmit();
        }}
      />

      {/* 兽医/场长：上报后是否直接进入诊断 */}
      {/* 更换治疗方案抽屉 */}
      {planPickerOpen && selectedDisease && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40"
          onClick={() => setPlanPickerOpen(false)}
        >
          <div
            className="w-full max-w-[440px] rounded-t-2xl bg-card pb-[calc(env(safe-area-inset-bottom)+12px)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <div className="text-card-title text-foreground font-medium">选择治疗方案</div>
              <button
                type="button"
                onClick={() => setPlanPickerOpen(false)}
                className="text-caption text-text-tertiary"
              >
                取消
              </button>
            </div>
            <div className="px-4 pb-2 text-caption text-text-tertiary">
              「{selectedDisease.name}」共 {selectedDisease.plans.length} 个推荐方案
            </div>
            <ul className="px-4 pb-3 space-y-2 max-h-[60vh] overflow-y-auto">
              {selectedDisease.plans.map((p, i) => {
                const active = i === planIdx;
                const drugCount = p.items.filter((it) => it.kind === "drug").length;
                const careCount = p.items.filter((it) => it.kind === "care").length;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setPlanIdx(i);
                        setPlanPickerOpen(false);
                      }}
                      className={`w-full text-left rounded-xl border p-3 flex items-start gap-3 ${
                        active
                          ? "border-primary bg-card"
                          : "border-border bg-card"
                      }`}
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="text-body font-medium text-foreground">
                          {p.rx}
                        </div>
                        {p.desc && (
                          <div className="text-caption text-text-tertiary">{p.desc}</div>
                        )}
                        <div className="text-caption text-text-tertiary">
                          包含 {p.items.length} 项 · {drugCount} 用药 / {careCount} 非用药
                        </div>
                      </div>
                      <div
                        className={`mt-0.5 h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${
                          active
                            ? "bg-primary text-primary-foreground"
                            : "border border-border bg-card"
                        }`}
                      >
                        {active && <Check className="h-3 w-3" />}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {postSubmitOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-[360px] rounded-2xl bg-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <span className="h-9 w-9 rounded-full bg-brand-subtle inline-flex items-center justify-center">
                <FileText className="h-4 w-4 text-primary" />
              </span>
              <h3 className="text-card-title text-foreground">是否直接进行诊断？</h3>
            </div>
            <p className="text-body-sm text-text-secondary leading-relaxed">
              上报已生成工单
              <span className="font-mono text-foreground"> {newWorkOrderId}</span>
              ，可立即进入诊断界面继续处理，或返回首页。
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setPostSubmitOpen(false);
                  navigate({ to: "/m/homepage" });
                }}
                className="flex-1 h-10 rounded-lg border border-border bg-card text-body-sm text-text-secondary"
              >
                否，返回首页
              </button>
              <button
                type="button"
                onClick={() => {
                  setPostSubmitOpen(false);
                  navigate({
                    to: "/m/health/$id/diagnose",
                    params: { id: newWorkOrderId },
                  });
                }}
                className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-body-sm"
              >
                是，进入诊断
              </button>
            </div>
          </div>
        </div>
      )}




      {/* 存草稿确认弹窗 */}
      {showDraftDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-[360px] rounded-2xl bg-card p-5 space-y-4">
            <h3 className="text-card-title text-foreground">保存草稿？</h3>
            <p className="text-body-sm text-text-secondary">
              当前已填写的内容将被保存为草稿，下次进入可继续编辑。
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDraftDialog(false)}
                className="flex-1 h-10 rounded-lg border border-border bg-card text-body-sm text-text-secondary inline-flex items-center justify-center"
              >
                取消
              </button>
              <button
                onClick={() => {
                  const draftRecord = {
                    id: draftId ?? `DR-${Date.now().toString().slice(-6)}`,
                    target: targets.join("、"),
                    targets,
                    workType,
                    symptoms,
                    note,
                    suspectedDisease,
                    desc,
                    photos,
                    videos,
                    voiceSecs,
                    savedAt: new Date().toISOString(),
                  };
                  try {
                    const raw = localStorage.getItem("report:drafts");
                    const list: any[] = raw ? JSON.parse(raw) : [];
                    const idx = list.findIndex((x) => x.id === draftRecord.id);
                    if (idx >= 0) list.splice(idx, 1);
                    list.unshift(draftRecord);
                    localStorage.setItem("report:drafts", JSON.stringify(list));
                  } catch {
                    localStorage.setItem("report:drafts", JSON.stringify([draftRecord]));
                  }
                  setShowDraftDialog(false);
                  toast.success("草稿已保存");
                  setTimeout(() => navigate({ to: "/m/drafts" }), 400);
                }}


                className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-body-sm inline-flex items-center justify-center"
              >
                确认保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 牛舍选择弹层 */}
      {barnPickerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center"
          onClick={() => setBarnPickerOpen(false)}
        >
          <div
            className="w-full max-w-[440px] bg-card rounded-t-2xl h-[75vh] max-h-[75vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 h-12 flex items-center justify-between border-b border-border shrink-0">
              <div className="text-body font-medium text-foreground">选择牛舍</div>
              <button
                type="button"
                onClick={() => setBarnPickerOpen(false)}
                className="h-8 w-8 -mr-2 inline-flex items-center justify-center text-text-tertiary"
                aria-label="关闭"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-4 pt-3 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                <input
                  autoFocus
                  value={barnAddQuery}
                  onChange={(e) => setBarnAddQuery(e.target.value)}
                  placeholder="搜索牛舍编号"
                  className="w-full h-10 pl-9 pr-3 rounded-lg bg-surface-subtle border border-border text-body-sm placeholder:text-text-tertiary"
                />
              </div>
            </div>
            <div className="p-3 overflow-y-auto flex-1">
              {barnMatches.length === 0 ? (
                <div className="text-center py-12 text-body-sm text-text-tertiary">无匹配牛舍</div>
              ) : (
                <div className="divide-y divide-border">
                  {barnMatches.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => {
                        addBarn(b);
                        setBarnPickerOpen(false);
                        setBarnAddQuery("");
                      }}
                      className="w-full text-left px-2 h-12 flex items-center text-body text-foreground active:bg-surface-subtle"
                    >
                      {b}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 牛只选择弹层（按牛只 - 全牧场搜索） */}
      {cowPickerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center"
          onClick={() => setCowPickerOpen(false)}
        >
          <div
            className="w-full max-w-[440px] bg-card rounded-t-2xl h-[75vh] max-h-[75vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 h-12 flex items-center justify-between border-b border-border shrink-0">
              <div className="text-body font-medium text-foreground">选择牛只</div>
              <button
                type="button"
                onClick={() => setCowPickerOpen(false)}
                className="h-8 w-8 -mr-2 inline-flex items-center justify-center text-text-tertiary"
                aria-label="关闭"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-4 pt-3 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                <input
                  autoFocus
                  inputMode="numeric"
                  value={addQuery}
                  onChange={(e) => setAddQuery(e.target.value)}
                  placeholder="输入耳号数字，搜索整个牧场"
                  className="w-full h-10 pl-9 pr-3 rounded-lg bg-surface-subtle border border-border text-body-sm placeholder:text-text-tertiary"
                />
              </div>
              <div className="mt-2 text-caption text-text-tertiary">
                搜索范围为整个牧场；选定后将自动获取所属牛舍
              </div>
            </div>
            <div className="p-3 overflow-y-auto flex-1">
              {addQuery.trim() && addMatches.length === 0 ? (
                <div className="text-center py-12 text-body-sm text-text-tertiary">无匹配牛只</div>
              ) : (
                <div className="divide-y divide-border">
                  {addMatches.map((cowId) => (
                    <button
                      key={cowId}
                      type="button"
                      onClick={() => {
                        addTarget(cowId);
                        setAddQuery("");
                        setCowPickerOpen(false);
                      }}
                      className="w-full px-2 h-12 flex items-center justify-between text-body text-foreground active:bg-surface-subtle"
                    >
                      <span className="font-mono">#{cowId}</span>
                      <span className="text-caption text-text-tertiary">{barnOfCattle(cowId)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </MobileShell>

  );
}

function EvidenceSection({
  desc,
  setDesc,
  photos,
  setPhotos,
  videos,
  setVideos,
  voiceSecs,
  setVoiceSecs,
  recording,
  onVoiceToggle,
  hideVideo,
  descLabel = "具体描述",
}: {
  desc: string;
  setDesc: (v: string) => void;
  photos: number[];
  setPhotos: React.Dispatch<React.SetStateAction<number[]>>;
  videos: number[];
  setVideos: React.Dispatch<React.SetStateAction<number[]>>;
  voiceSecs: number | null;
  setVoiceSecs: (v: number | null) => void;
  recording: boolean;
  onVoiceToggle: () => void;
  hideVideo?: boolean;
  descLabel?: string;
}) {

  type MediaItem = { id: number; type: "photo" | "video" };
  const media: MediaItem[] = [
    ...photos.map((id) => ({ id, type: "photo" as const })),
    ...videos.map((id) => ({ id, type: "video" as const })),
  ];
  const maxMedia = 9;
  const remaining = maxMedia - media.length;

  const voiceCount = voiceSecs === null ? 0 : 1;

  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const albumInputRef = useRef<HTMLInputElement>(null);

  return (
    <Section title="现场记录">
      <div className="text-caption text-text-tertiary inline-flex items-center gap-1 mb-2">
        <Camera className="h-3.5 w-3.5" /> 照片 / 视频
        <span className="text-[var(--state-danger)]">*</span>
        <span>· {media.length} 条</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {media.map((m) => (
          <div
            key={`${m.type}-${m.id}`}
            className="relative aspect-square rounded-lg bg-gradient-to-br from-surface-subtle to-border border border-border flex items-center justify-center"
          >
            {m.type === "video" && <Video className="h-5 w-5 text-text-tertiary" />}
            <button
              onClick={() =>
                m.type === "photo"
                  ? setPhotos((prev) => prev.filter((x) => x !== m.id))
                  : setVideos((prev) => prev.filter((x) => x !== m.id))
              }
              className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-foreground/85 text-background inline-flex items-center justify-center shadow"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {remaining > 0 && (
          <button
            type="button"
            onClick={() => setAddSheetOpen(true)}
            className="aspect-square rounded-lg bg-surface-subtle flex flex-col items-center justify-center gap-1 text-text-tertiary active:bg-border transition-colors"
          >
            <Camera className="h-5 w-5" />
            <span className="text-caption">添加</span>
          </button>
        )}
      </div>

      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          files.forEach(() => setPhotos((p) => [...p, Date.now() + Math.random()]));
          e.target.value = "";
        }}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          files.forEach(() => setVideos((p) => [...p, Date.now() + Math.random()]));
          e.target.value = "";
        }}
      />
      <input
        ref={albumInputRef}
        type="file"
        accept={hideVideo ? "image/*" : "image/*,video/*"}
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          files.forEach((f) => {
            if (f.type.startsWith("video/")) {
              setVideos((p) => [...p, Date.now() + Math.random()]);
            } else {
              setPhotos((p) => [...p, Date.now() + Math.random()]);
            }
          });
          e.target.value = "";
        }}
      />

      <MAddMediaSheet
        open={addSheetOpen}
        onClose={() => setAddSheetOpen(false)}
        actions={[
          { key: "photo", icon: Camera, label: "拍照", onClick: () => photoInputRef.current?.click() },
          ...(hideVideo
            ? []
            : [{ key: "video", icon: Video, label: "拍视频", onClick: () => videoInputRef.current?.click() }]),
          { key: "album", icon: Image, label: "相册", onClick: () => albumInputRef.current?.click() },
        ]}
      />

      <div className="text-caption text-text-tertiary inline-flex items-center gap-1 mt-4 mb-2">
        <Mic className="h-3.5 w-3.5" /> 录音 · {voiceCount} 条
      </div>
      {voiceSecs === null ? (
        <button
          onClick={onVoiceToggle}
          className={`w-full h-11 rounded-lg border border-dashed inline-flex items-center justify-center gap-2 text-body-sm active:scale-[0.98] transition-all ${
            recording
              ? "border-[var(--state-danger)]/50 bg-[var(--state-danger)]/8 text-[var(--state-danger)]"
              : "border-border bg-card text-text-secondary"
          }`}
        >
          <Mic className={`h-4 w-4 ${recording ? "animate-pulse" : ""}`} />
          {recording ? "录音中…点击结束" : "点击开始录音"}
        </button>
      ) : (
        <div className="flex items-center gap-2 h-11 px-3 rounded-lg bg-brand-subtle border border-primary/20">
          <Mic className="h-4 w-4 text-primary" />
          <div className="flex-1 h-1.5 rounded-full bg-primary/20 overflow-hidden">
            <div className="h-full w-1/2 bg-primary" />
          </div>
          <span className="text-caption text-primary font-mono">00:{String(voiceSecs).padStart(2, "0")}</span>
          <button
            onClick={() => setVoiceSecs(null)}
            className="h-7 w-7 rounded-full bg-card border border-border inline-flex items-center justify-center text-text-tertiary active:bg-surface-subtle"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}


      <div className="mt-4">
        <div className="text-body-sm text-foreground mb-2">
          {descLabel}
          <span className="text-[var(--state-danger)] ml-0.5">*</span>
        </div>
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="补充体征、用药反应、隔离建议等"
          rows={3}
          maxLength={500}
          className="w-full p-3 rounded-lg bg-card border border-border text-body placeholder:text-text-tertiary resize-none leading-relaxed"
        />
        <div className="text-right text-caption text-text-tertiary mt-1">{desc.length} / 500</div>
      </div>
    </Section>
  );
}

function Section({
  title,
  required,
  hint,
  extra,
  children,
}: {
  title: string;
  required?: boolean;
  hint?: string;
  extra?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-card border border-border p-4">
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="text-card-title text-foreground">
          {title}
          {required && <span className="text-[var(--state-danger)] ml-0.5">*</span>}
        </div>
        {extra
          ? extra
          : hint && <div className="text-caption text-text-tertiary text-right">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

