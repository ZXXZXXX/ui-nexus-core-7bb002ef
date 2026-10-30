/**
 * 处方按天编排规则：输入疗程天数后，逐日安排当天的用药、非用药和复查任务。
 * 页面与规则测试共用这里的逻辑。
 */

export type DayPlan = { drugs: string[]; tasks: string[]; review: boolean };

export const MAX_COURSE_DAYS = 30;
export const MAX_REVIEW_DAYS = 9;

type Freqish = { n: number; m: number };
type Item = { id: string; days: number; freq: Freqish };
type ReviewLike = { on: boolean; days: number; freq: Freqish };

const emptyDay = (): DayPlan => ({ drugs: [], tasks: [], review: false });

export const clampCourse = (n: number) => Math.min(MAX_COURSE_DAYS, Math.max(1, Math.floor(n) || 1));

/** 调整疗程天数：多出的天数为空，缩短时截掉尾部的安排 */
export function resizePlan(plan: DayPlan[], days: number): DayPlan[] {
  const n = clampCourse(days);
  if (plan.length >= n) return plan.slice(0, n);
  return [...plan, ...Array.from({ length: n - plan.length }, emptyDay)];
}

/** 从旧版“连续 N 天、每 n 天 m 次”的配置推出默认编排：先用药/非用药，复查排在治疗结束后 */
export function defaultPlan(rx: {
  duration: number;
  drugs: Item[];
  tasks: Item[];
  review: ReviewLike;
}): DayPlan[] {
  const stepDays = (len: number, step: number, start = 0) => {
    const out: number[] = [];
    for (let d = start; d < start + len; d += Math.max(1, step || 1)) out.push(d);
    return out;
  };
  const treatEnd = Math.max(
    0,
    ...rx.drugs.map((d) => d.days || 0),
    ...rx.tasks.map((t) => t.days || 0),
  );
  const reviewDays = rx.review.on ? stepDays(rx.review.days || 1, rx.review.freq.n, treatEnd) : [];
  const last = Math.max(treatEnd, reviewDays.length ? reviewDays[reviewDays.length - 1] + 1 : 0);
  const plan = resizePlan([], Math.max(rx.duration || 1, last));
  for (const d of rx.drugs) for (const i of stepDays(d.days, d.freq.n)) plan[i]?.drugs.push(d.id);
  for (const t of rx.tasks) for (const i of stepDays(t.days, t.freq.n)) plan[i]?.tasks.push(t.id);
  for (const i of reviewDays) if (plan[i]) plan[i].review = true;
  return plan;
}

export type PlanKind = "drugs" | "tasks" | "review";

export const scheduledDays = (plan: DayPlan[], kind: PlanKind, id?: string) =>
  plan.filter((d) => (kind === "review" ? d.review : d[kind].includes(id ?? ""))).length;

export type ToggleResult = { plan: DayPlan[]; blocked?: string };

/** 切换某一天是否安排该项；超过上限（药品最大用药天数 / 复查 9 天）时拦截 */
export function toggleDay(
  plan: DayPlan[],
  dayIndex: number,
  kind: PlanKind,
  id?: string,
  limit?: number,
): ToggleResult {
  const day = plan[dayIndex];
  if (!day) return { plan };
  const on = kind === "review" ? day.review : day[kind].includes(id ?? "");
  const cap = kind === "review" ? Math.min(limit ?? MAX_REVIEW_DAYS, MAX_REVIEW_DAYS) : limit;
  if (!on && cap != null && scheduledDays(plan, kind, id) >= cap) {
    return { plan, blocked: kind === "review" ? `复查最多安排 ${cap} 天` : `该药品最多用药 ${cap} 天` };
  }
  const next = plan.slice();
  if (kind === "review") next[dayIndex] = { ...day, review: !on };
  else
    next[dayIndex] = {
      ...day,
      [kind]: on ? day[kind].filter((x) => x !== id) : [...day[kind], id ?? ""],
    };
  return { plan: next };
}

/** 当天沿用前一天的安排 */
export function copyPrevDay(plan: DayPlan[], dayIndex: number): DayPlan[] {
  if (dayIndex <= 0 || !plan[dayIndex - 1]) return plan;
  const prev = plan[dayIndex - 1];
  const next = plan.slice();
  next[dayIndex] = { drugs: [...prev.drugs], tasks: [...prev.tasks], review: prev.review };
  return next;
}

/** 删除明细时同步移除它在每天的安排 */
export const dropItem = (plan: DayPlan[], kind: "drugs" | "tasks", id: string) =>
  plan.map((d) => ({ ...d, [kind]: d[kind].filter((x) => x !== id) }));

/** 第几天（1 起）列表，用于摘要/详情展示，如 “第1、3、5天” */
export const dayList = (plan: DayPlan[], kind: PlanKind, id?: string) =>
  plan
    .map((d, i) => ((kind === "review" ? d.review : d[kind].includes(id ?? "")) ? i + 1 : 0))
    .filter(Boolean);
