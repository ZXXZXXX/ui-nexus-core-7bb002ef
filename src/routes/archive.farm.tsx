import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Building2, MoreHorizontal, Trash2 } from "lucide-react";
import { ListPage, type ListColumn } from "@/components/list-page";

export const Route = createFileRoute("/archive/farm")({
  head: () => ({ meta: [{ title: "牛场信息 — 奇点智牧" }] }),
  component: FarmPage,
});

type Farm = {
  id: string; name: string; region: string; slot: string; type: string; manager: string;
  stock: number; barns: number; status: string;
};

const farms: Farm[] = [
  { id: "F001", name: "1 号牧场", region: "内蒙古·呼伦贝尔市", slot: "C-01", type: "普通牧场", manager: "张磊", stock: 1240, barns: 12, status: "运营中" },
  { id: "F002", name: "2 号牧场", region: "内蒙古·锡林郭勒市", slot: "C-02", type: "有机牧场", manager: "李建国", stock: 856, barns: 8, status: "运营中" },
  { id: "F003", name: "3 号牧场", region: "黑龙江·齐齐哈尔市", slot: "C-03", type: "普通牧场", manager: "王志强", stock: 390, barns: 5, status: "已冻结" },
];

const columns: ListColumn<Farm>[] = [
  { key: "id", label: "牛场编号", required: true, render: (f) => <span className="font-mono text-body text-foreground">{f.id}</span> },
  {
    key: "name", label: "牛场名称", required: true,
    render: (f) => (
      <span className="flex items-center gap-2 text-body text-foreground truncate">
        <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
        <span className="truncate">{f.name}</span>
      </span>
    ),
  },
  { key: "region", label: "所在地区", filter: "select", render: (f) => <span className="text-body-sm text-text-secondary">{f.region}</span> },
  { key: "slot", label: "仓位号", filter: "select", render: (f) => <span className="font-mono text-body-sm text-text-secondary">{f.slot}</span> },
  {
    key: "type", label: "牛场类型", filter: "select",
    render: (f) => <span className={`tag ${f.type === "有机牧场" ? "tag-info" : "tag-warning"}`}>{f.type}</span>,
  },
  {
    key: "barns", label: "牛舍数量", filter: "none",
    value: (f) => f.barns,
    render: (f) => <span className="text-body-sm text-text-secondary tabular-nums">{f.barns}</span>,
  },
  {
    key: "stock", label: "存栏总数", filter: "none",
    value: (f) => f.stock,
    render: (f) => <span className="text-body-sm text-text-secondary tabular-nums">{f.stock}</span>,
  },
  { key: "manager", label: "负责人", filter: "select", render: (f) => <span className="text-body-sm text-text-secondary">{f.manager}</span> },
  {
    key: "status", label: "状态", filter: "select",
    render: (f) => <span className={`tag ${f.status === "运营中" ? "tag-success" : "tag-muted"}`}>{f.status}</span>,
  },
];

function FarmPage() {
  return (
    <ListPage<Farm>
      title="牛场信息"
      breadcrumb={["基础档案", "牛场信息"]}
      rows={farms}
      columns={columns}
      searchKeys={["name", "id"]}
      searchPlaceholder="搜索牛场名称 / 编号"
      getRowKey={(f) => f.id}
      rowActions={() => (
        <>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-body-sm font-normal text-text-secondary hover:bg-surface-subtle hover:text-foreground">查看</Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-body-sm font-normal text-primary hover:bg-brand-subtle hover:text-primary">编辑</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-text-secondary hover:bg-surface-subtle hover:text-foreground" aria-label="更多">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-28">
              <DropdownMenuItem className="text-[var(--state-danger)] focus:text-[var(--state-danger)]">
                <Trash2 className="h-3.5 w-3.5 mr-2" /> 删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
    />
  );
}
