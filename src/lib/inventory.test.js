import { describe, expect, it } from "bun:test";
import {
  DEFAULT_INVENTORY_SORT,
  buildSkuRows,
  hasInbound,
  isBatchCollapsedByDefault,
} from "./inventory";

const bySku = (sku) => buildSkuRows().find((r) => r.sku === sku);

describe("库存列表常驻与排序规则", () => {
  it("同一商品编码只占一行，当前库存为各批次合计", () => {
    const rows = buildSkuRows().filter((r) => r.sku === "01-00063");
    expect(rows).toHaveLength(1);
    expect(rows[0].stock).toBe(110);
    expect(rows[0].batches).toHaveLength(3);
  });

  it("有过入库、当前库存为 0 的药品仍常驻列表", () => {
    const row = bySku("07-00741");
    expect(row).toBeDefined();
    expect(row?.stock).toBe(0);
    expect(row?.lastInQty).toBe(30);
    expect(row?.lastOutQty).toBe(30);
  });

  it("从未入库的药品不进入库存列表", () => {
    expect(hasInbound("09-00912")).toBe(false);
    expect(bySku("09-00912")).toBeUndefined();
  });

  it("默认按当前库存量倒序排列", () => {
    expect(DEFAULT_INVENTORY_SORT).toEqual({ key: "stock", dir: "desc" });
    const rows = buildSkuRows();
    expect(rows[0].sku).toBe("04-00412");
    expect(rows[0].stock).toBe(120);
    expect(rows[1].stock).toBe(110);
    const stocks = rows.map((r) => r.stock);
    expect(stocks).toEqual([...stocks].sort((a, b) => b - a));
    expect(rows[rows.length - 1].stock).toBe(0);
  });
});

describe("批次组默认折叠规则", () => {
  it("当前余量为 0 的批次默认折叠，有余量的批次默认展开", () => {
    const row = bySku("01-00063");
    const used = row?.batches.find((b) => b.batchNo === "B23K0518");
    const alive = row?.batches.find((b) => b.batchNo === "B25A0142");
    expect(used?.stock).toBe(0);
    expect(isBatchCollapsedByDefault(used)).toBe(true);
    expect(isBatchCollapsedByDefault(alive)).toBe(false);
  });

  it("批次折叠不改变该商品编码的当前库存合计", () => {
    const row = bySku("01-00063");
    expect(row?.stock).toBe(row?.batches.reduce((a, b) => a + b.stock, 0));
    expect(row?.stock).toBe(110);
  });
});
