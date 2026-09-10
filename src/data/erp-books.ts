// 组织管理 · 第三方系统管理 中 ERP（金蝶云）已配置的帐套
export type ErpBookRef = { id: string; name: string; code: string };

export const ERP_BOOKS: ErpBookRef[] = [
  { id: "B1", name: "内蒙古晟安畜牧服务有限公司", code: "1339492152346189312" },
  { id: "B2", name: "连云港晟安畜牧服务有限公司", code: "1341719110069057024" },
];
