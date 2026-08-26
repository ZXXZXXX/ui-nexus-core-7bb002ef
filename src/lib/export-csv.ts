/** 通用 CSV 导出：按当前界面筛选结果生成文件 */
function cell(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v).replace(/\s+/g, " ").trim();
  return `"${s.replace(/"/g, '""')}"`;
}

export function exportCsv(filename: string, headers: string[], rows: (string | number | null | undefined)[][]) {
  const csv = [headers, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const stamp = new Date().toISOString().slice(0, 10);
  a.download = `${filename}_${stamp}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
