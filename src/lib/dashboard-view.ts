import { useSyncExternalStore } from "react";

export type ReportScope = "farm-in" | "farm-out" | "region" | "group";

export const scopeOptions: { key: ReportScope; label: string; desc: string }[] = [
  { key: "farm-in", label: "牧场级·内部", desc: "牧场内部视角：全量专题" },
  { key: "farm-out", label: "牧场级·外部", desc: "外部视角：默认隐藏药品、工单与预警告警" },
  { key: "region", label: "区域（中心）", desc: "牧场数据上卷至区域级" },
  { key: "group", label: "集团高管", desc: "牧场数据上卷至区域级、集团级" },
];

export type TopicKey =
  | "herd"
  | "calving"
  | "culling"
  | "disease"
  | "drug"
  | "vaccine"
  | "workorder"
  | "alert"
  | "ops";

export const topicMeta: { key: TopicKey; label: string; anchor?: string }[] = [
  { key: "herd", label: "牛群专题", anchor: "topic-herd" },
  { key: "calving", label: "产犊专题", anchor: "topic-calving" },
  { key: "culling", label: "死淘专题", anchor: "topic-culling" },
  { key: "disease", label: "疾病专题", anchor: "topic-disease" },
  { key: "drug", label: "药品专题", anchor: "topic-drug" },
  { key: "vaccine", label: "疫苗免疫专题", anchor: "topic-vaccine" },
  { key: "workorder", label: "兽医工单专题", anchor: "topic-workorder" },
  { key: "alert", label: "预警告警专题", anchor: "topic-alert" },
  { key: "ops", label: "区域 / 集团运营统计" },
];

export type TopicVisibility = Record<TopicKey, boolean>;

function base(overrides: Partial<TopicVisibility> = {}): TopicVisibility {
  const all = Object.fromEntries(topicMeta.map((t) => [t.key, true])) as TopicVisibility;
  return { ...all, ...overrides };
}

export const defaultConfig: Record<ReportScope, TopicVisibility> = {
  "farm-in": base({ ops: false, culling: false }),
  "farm-out": base({ drug: false, workorder: false, alert: false, ops: true }),
  region: base(),
  group: base(),
};

export type TopicOrder = TopicKey[];

export const defaultOrder: TopicOrder = topicMeta.map((t) => t.key);

export const defaultOrders: Record<ReportScope, TopicOrder> = {
  "farm-in": ["herd", "calving", "vaccine", "disease", "drug", "workorder", "culling", "alert", "ops"],
  "farm-out": [...defaultOrder],
  region: [...defaultOrder],
  group: [...defaultOrder],
};

/** 补全/去重，保证顺序数组始终包含全部专题 */
function normalizeOrder(list?: TopicKey[]): TopicOrder {
  const seen = new Set<TopicKey>();
  const out: TopicKey[] = [];
  (list ?? []).forEach((k) => {
    if (defaultOrder.includes(k) && !seen.has(k)) {
      seen.add(k);
      out.push(k);
    }
  });
  defaultOrder.forEach((k) => {
    if (!seen.has(k)) out.push(k);
  });
  return out;
}

type State = {
  scope: ReportScope;
  config: Record<ReportScope, TopicVisibility>;
  order: Record<ReportScope, TopicOrder>;
  level: DataLevel;
};

const KEY = "pc:dashboard-view";
/** 专题结构调整后需要重置旧的显隐配置，避免历史缓存把专题全部隐藏 */
const VERSION = 2;
const listeners = new Set<() => void>();
let state: State = { scope: "farm-in", config: defaultConfig, order: defaultOrders, level: "farm" };
let loaded = false;

function load(): State {
  if (loaded || typeof window === "undefined") return state;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<State> & { v?: number };
      if (parsed.v !== VERSION) {
        // 旧版本缓存：仅保留视角与层级，显隐 / 顺序回到默认
        state = { ...state, scope: parsed.scope ?? "farm-in", level: parsed.level ?? "farm" };
        localStorage.setItem(KEY, JSON.stringify({ ...state, v: VERSION }));
        return state;
      }

      state = {
        scope: parsed.scope ?? "farm-in",
        level: parsed.level ?? "farm",
        config: {
          "farm-in": { ...defaultConfig["farm-in"], ...(parsed.config?.["farm-in"] ?? {}) },
          "farm-out": { ...defaultConfig["farm-out"], ...(parsed.config?.["farm-out"] ?? {}) },
          region: { ...defaultConfig.region, ...(parsed.config?.region ?? {}) },
          group: { ...defaultConfig.group, ...(parsed.config?.group ?? {}) },
        },
        order: {
          "farm-in": normalizeOrder(parsed.order?.["farm-in"]),
          "farm-out": normalizeOrder(parsed.order?.["farm-out"]),
          region: normalizeOrder(parsed.order?.region),
          group: normalizeOrder(parsed.order?.group),
        },
      };
    }
  } catch {}
  return state;
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...state, v: VERSION }));
  } catch {}
  listeners.forEach((fn) => fn());
}

export function setScope(scope: ReportScope) {
  load();
  state = { ...state, scope };
  persist();
}

export function setTopicVisible(scope: ReportScope, topic: TopicKey, visible: boolean) {
  load();
  state = {
    ...state,
    config: { ...state.config, [scope]: { ...state.config[scope], [topic]: visible } },
  };
  persist();
}

/** 上移 / 下移某个专题 */
export function moveTopic(scope: ReportScope, topic: TopicKey, dir: -1 | 1) {
  load();
  const list = [...normalizeOrder(state.order[scope])];
  const i = list.indexOf(topic);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  state = { ...state, order: { ...state.order, [scope]: list } };
  persist();
}

export function resetScopeConfig(scope: ReportScope) {
  load();
  state = {
    ...state,
    config: { ...state.config, [scope]: { ...defaultConfig[scope] } },
    order: { ...state.order, [scope]: [...defaultOrder] },
  };
  persist();
}

/** 当前视角下、按用户排序后的可见专题 */
export function useTopicOrder(): TopicKey[] {
  const { scope, config, order } = useDashboardView();
  return normalizeOrder(order?.[scope]).filter((k) => config[scope][k]);
}

export function useDashboardView(): State {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => load(),
    () => state,
  );
}

/* ---------- 数量级分层：集团级 > 区域级 > 牧场级 ---------- */

export type DataLevel = "group" | "region" | "farm";

export const levelMeta: Record<DataLevel, { label: string; short: string; factor: number; desc: string }> = {
  group: { label: "集团级", short: "集团", factor: 6.2, desc: "6 个牧场 · 3 个区域合计" },
  region: { label: "区域级", short: "区域", factor: 2.6, desc: "东北大区 2 个牧场合计" },
  farm: { label: "牧场级", short: "牧场", factor: 1, desc: "1 号牧场" },
};

/** 各视角可用的层级（由高到低） */
export function levelsForScope(scope: ReportScope): DataLevel[] {
  if (scope === "group") return ["group", "region", "farm"];
  if (scope === "region") return ["region", "farm"];
  return ["farm"];
}

export function setDataLevel(next: DataLevel) {
  load();
  state = { ...state, level: next };
  persist();
}

/** 当前生效层级与放大系数（专题内容与牧场级一致，仅统计口径上卷） */
export function useDataLevel(): { level: DataLevel; factor: number; levels: DataLevel[] } {
  const { scope, level } = useDashboardView();
  const levels = levelsForScope(scope);
  const current = levels.includes(level) ? level : levels[0];
  return { level: current, factor: levelMeta[current].factor, levels };
}

export function scaleValue(n: number, factor: number, digits = 0) {
  const v = n * factor;
  return digits > 0 ? Number(v.toFixed(digits)) : Math.round(v);
}

export function scaleList<T extends { value: number }>(list: T[], factor: number, digits = 0): T[] {
  return list.map((d) => ({ ...d, value: scaleValue(d.value, factor, digits) }));
}
