// 牛只状态推导：与 /m/search 列表的 mock 规则保持一致，
// 保证从列表进入详情页时状态一致。
export type CowStatus = "健康" | "观察中" | "治疗中" | "异常" | "死淘";

const STATUSES: CowStatus[] = [
  "健康",
  "健康",
  "健康",
  "健康",
  "健康",
  "观察中",
  "治疗中",
  "异常",
  "死淘",
];

const PEN_PER_BARN = 4;
const COWS_PER_PEN = 100;

/** 由耳号 aa-bb-cccc 反推牛舍 / 栏位 / 序号 */
export function locateCow(id: string) {
  const cleaned = (id || "").replace(/^#/, "");
  const last = Number(cleaned.split("-")[2] ?? "0") || 0;
  const seq = Math.max(1, last - 2000);
  const barnIdx = Math.floor((seq - 1) / (PEN_PER_BARN * COWS_PER_PEN)) + 1;
  const rest = (seq - 1) % (PEN_PER_BARN * COWS_PER_PEN);
  const penIdx = Math.floor(rest / COWS_PER_PEN) + 1;
  const i = rest % COWS_PER_PEN;
  return { barnIdx, penIdx, i };
}

export function cowStatusOf(id: string): CowStatus {
  const { barnIdx, penIdx, i } = locateCow(id);
  return STATUSES[(barnIdx * 13 + penIdx * 7 + i) % STATUSES.length];
}

export type LeaveInfo = {
  kind: "死亡" | "淘汰" | "转场";
  date: string;
  reason: string;
  dest: string;
  operator: string;
  weight: string;
  note: string;
};

const LEAVE_KINDS: LeaveInfo["kind"][] = ["死亡", "淘汰", "转场"];
const LEAVE_REASONS: Record<LeaveInfo["kind"], string> = {
  死亡: "急性乳房炎继发败血症，治疗无效死亡",
  淘汰: "慢性跛行反复复发，产奶量持续低于群体均值",
  转场: "产能调配，整批转出至协作牧场",
};
const LEAVE_DESTS: Record<LeaveInfo["kind"], string> = {
  死亡: "无害化处理中心",
  淘汰: "屠宰场（合规回收）",
  转场: "3 号牧场",
};

export function leaveInfoOf(id: string): LeaveInfo {
  const { i } = locateCow(id);
  const kind = LEAVE_KINDS[i % LEAVE_KINDS.length];
  const day = String((i % 27) + 1).padStart(2, "0");
  return {
    kind,
    date: `2026-05-${day}`,
    reason: LEAVE_REASONS[kind],
    dest: LEAVE_DESTS[kind],
    operator: i % 2 === 0 ? "李雨晴" : "王场长",
    weight: `${520 + (i % 90)} kg`,
    note: kind === "死亡" ? "已完成剖检取样并上报" : "已完成资产核销",
  };
}
