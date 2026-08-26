import * as XLSX from "xlsx";

export type SheetData = {
  name: string;
  heads: string[];
  body: (string | number)[][];
};

/** 安全的 sheet 名称：不超过 31 字符且不含非法字符 */
function safeName(name: string, used: Set<string>) {
  let base = name.replace(/[\\/?*[\]:]/g, "-").slice(0, 28) || "Sheet";
  let out = base;
  let i = 2;
  while (used.has(out)) out = `${base.slice(0, 25)}(${i++})`;
  used.add(out);
  return out;
}

export function exportXlsx(filename: string, sheets: SheetData[]) {
  const wb = XLSX.utils.book_new();
  const used = new Set<string>();
  for (const s of sheets) {
    const ws = XLSX.utils.aoa_to_sheet([s.heads, ...s.body]);
    ws["!cols"] = s.heads.map((h) => ({ wch: Math.max(10, h.length * 2 + 2) }));
    XLSX.utils.book_append_sheet(wb, ws, safeName(s.name, used));
  }
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
