import { describe, expect, it } from "bun:test";
import { mergeBatches as _merge } from "./inventory";
import {
  DEFAULT_INVENTORY_SORT,
  buildSkuRows,
  hasInbound,
  inventory,
  isBatchUsedUp,
  partitionBatches,
  usedUpAt,
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

describe("已用完批次分组规则", () => {
  it("当前余量为 0 的批次判定为已用完，有余量的批次不算", () => {
    const row = bySku("01-00063");
    const used = row?.batches.find((b) => b.batchNo === "B23K0518");
    const alive = row?.batches.find((b) => b.batchNo === "B25A0142");
    expect(used?.stock).toBe(0);
    expect(isBatchUsedUp(used)).toBe(true);
    expect(isBatchUsedUp(alive)).toBe(false);
  });

  it("已用完批次统一排到批次列表末尾，有余量的批次在前", () => {
    const row = bySku("01-00063");
    const { active, used } = partitionBatches(row.batches);
    expect(active.map((b) => b.batchNo)).toEqual(["B24A0631", "B25A0142"]);
    expect(used.map((b) => b.batchNo)).toEqual(["B23K0518"]);
    expect(row.batches.map((b) => b.batchNo)).toEqual([
      "B24A0631",
      "B25A0142",
      "B23K0518",
    ]);
  });

  it("批次分组不改变该商品编码的当前库存合计", () => {
    const row = bySku("01-00063");
    expect(row.stock).toBe(row.batches.reduce((a, b) => a + b.stock, 0));
    expect(row.stock).toBe(110);
  });

  it("全部批次都已用完的药品，没有可默认展开的批次", () => {
    const row = bySku("07-00741");
    const { active, used } = partitionBatches(row.batches);
    expect(active).toHaveLength(0);
    expect(used.map((b) => b.batchNo)).toEqual(["C25B0330"]);
  });

  it("已用完批次按库存变为 0 的时间由近到远排列", () => {
    const item = (sku) => inventory.find((i) => i.sku === sku);
    const c = item("07-00741"); // 出库 2026-08-25 16:40 → 归零
    const o = item("08-00855"); // 出库 2026-08-18 15:25 → 归零
    const { used } = partitionBatches([c, o]);
    expect(used.map((b) => b.batchNo)).toEqual(["C25B0330", "O25D0119"]);
    expect(usedUpAt(c)).toBe("2026-08-25 16:40");
    expect(usedUpAt(o)).toBe("2026-08-18 15:25");
  });
});

const _b = (o) => ({ sku: "X", batchNo: "B1", price: 10, stock: 5, updatedAt: "2026-01-01", ...o });
it("同批次同单价合并为一个批次，余量相加", () => {
  const r = _merge([_b({}), _b({ stock: 7 })]);
  expect(r).toHaveLength(1);
  expect(r[0].stock).toBe(12);
});
it("同批次不同单价分开展示", () => {
  expect(_merge([_b({}), _b({ price: 12 })])).toHaveLength(2);
});

import { buildCodes, countUnits } from "./inventory";
it("条码最多两层：满 10 个归入外包装，余数为单层散件，且全为数字", () => {
  const n = buildCodes("s", 23);
  expect(n).toHaveLength(5);
  expect(n.slice(0, 2).every((x) => x.children.length === 10)).toBe(true);
  expect(n.slice(2).every((x) => x.children.length === 0)).toBe(true);
  expect(countUnits(n)).toBe(23);
  expect(n.flatMap((x) => [x.code, ...x.children]).every((c) => /^\d+$/.test(c))).toBe(true);
});
