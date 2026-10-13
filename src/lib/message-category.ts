// 消息类型 → 标签配色。列表页与日志中心共用同一份映射，保证同一个类别在两个页面颜色一致。
export const MESSAGE_CATEGORIES = ["工单类", "药品类", "系统类", "其他类"] as const;
export type MessageCategory = (typeof MESSAGE_CATEGORIES)[number];

const CATEGORY_TAG: Record<MessageCategory, string> = {
  工单类: "tag-brand",
  药品类: "tag-info",
  系统类: "tag-warning",
  其他类: "tag-pink",
};

export const categoryTag = (category: string): string =>
  CATEGORY_TAG[category as MessageCategory] ?? "tag-muted";
