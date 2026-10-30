import { describe, expect, it } from "bun:test";
import { copyPrevDay, defaultPlan, dropItem, resizePlan, scheduledDays, toggleDay } from "./rx-plan";

const f = (n = 1) => ({ n, m: 1 });

describe("处方按天编排", () => {
  it("疗程天数决定可编排的天数，缩短时截掉尾部安排", () => {
    const plan = resizePlan([], 5);
    expect(plan.length).toBe(5);
    const t = toggleDay(plan, 4, "drugs", "a").plan;
    expect(resizePlan(t, 3).length).toBe(3);
    expect(scheduledDays(resizePlan(t, 3), "drugs", "a")).toBe(0);
  });

  it("每天可以单独安排用药、非用药和复查", () => {
    let plan = resizePlan([], 3);
    plan = toggleDay(plan, 0, "drugs", "d1").plan;
    plan = toggleDay(plan, 1, "tasks", "t1").plan;
    plan = toggleDay(plan, 2, "review").plan;
    expect(plan[0]).toEqual({ drugs: ["d1"], tasks: [], review: false });
    expect(plan[1]).toEqual({ drugs: [], tasks: ["t1"], review: false });
    expect(plan[2]).toEqual({ drugs: [], tasks: [], review: true });
  });

  it("药品安排天数不能超过药品档案的最大用药天数", () => {
    let plan = resizePlan([], 5);
    plan = toggleDay(plan, 0, "drugs", "d1", 2).plan;
    plan = toggleDay(plan, 1, "drugs", "d1", 2).plan;
    const r = toggleDay(plan, 2, "drugs", "d1", 2);
    expect(r.blocked).toBeTruthy();
    expect(scheduledDays(r.plan, "drugs", "d1")).toBe(2);
  });

  it("复查最多安排 9 天", () => {
    let plan = resizePlan([], 12);
    for (let i = 0; i < 9; i++) plan = toggleDay(plan, i, "review").plan;
    expect(toggleDay(plan, 9, "review").blocked).toBeTruthy();
  });

  it("旧配置默认：用药按连续天数排在前面，复查排在治疗结束之后", () => {
    const plan = defaultPlan({
      duration: 3,
      drugs: [{ id: "d1", days: 3, freq: f() }],
      tasks: [{ id: "t1", days: 4, freq: f(2) }],
      review: { on: true, days: 1, freq: f() },
    });
    expect(plan.length).toBe(5);
    expect(scheduledDays(plan, "drugs", "d1")).toBe(3);
    expect(plan.map((d) => d.tasks.includes("t1"))).toEqual([true, false, true, false, false]);
    expect(plan.map((d) => d.review)).toEqual([false, false, false, false, true]);
  });

  it("同前一天会复制前一天的全部安排", () => {
    let plan = resizePlan([], 2);
    plan = toggleDay(plan, 0, "drugs", "d1").plan;
    plan = toggleDay(plan, 0, "review").plan;
    expect(copyPrevDay(plan, 1)[1]).toEqual({ drugs: ["d1"], tasks: [], review: true });
  });

  it("删除明细后不再出现在任何一天", () => {
    let plan = resizePlan([], 2);
    plan = toggleDay(plan, 0, "drugs", "d1").plan;
    plan = toggleDay(plan, 1, "drugs", "d1").plan;
    expect(scheduledDays(dropItem(plan, "drugs", "d1"), "drugs", "d1")).toBe(0);
  });
});
