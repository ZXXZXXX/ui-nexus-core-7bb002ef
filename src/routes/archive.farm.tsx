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
  id: string; name: string; region: string; area: string; manager: string;
  stock: number; barns: number; status: string; createdAt: string;
};

const farms: Farm[] = [
  { id: "F001", name: "1 号牧场", region: "内蒙古·呼伦贝尔", area: "1280 亩", manager: "张磊", stock: 1240, barns: 12, status: "运营中", createdAt: "2026-08-20" },
  { id: "F002", name: "2 号牧场", region: "内蒙古·锡林郭勒", area: "960 亩", manager: "李建国", stock: 856, barns: 8, status: "运营中", createdAt: "2026-08-15" },
  { id: "F003", name: "3 号牧场", region: "黑龙江·齐齐哈尔", area: "1450 亩", manager: "王志强", stock: 390, barns: 5, status: "筹建中", createdAt: "2026-07-02" },
];

const columns: ListColumn<Farm>[] = [
  { key: "id", label: "编号", required: true, render: (f) => <span className="font-mono text-body text-foreground">{f.id}</span> },
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
  { key: "area", label: "面积", render: (f) => <span className="text-body-sm text-text-secondary">{f.area}</span> },
  { key: "manager", label: "负责人", filter: "select", render: (f) => <span className="text-body-sm text-text-secondary">{f.manager}</span> },
  {
    key: "stock", label: "存栏 / 牛舍", filter: "none",
    value: (f) => f.stock,
    render: (f) => <span className="text-body-sm text-text-secondary">{f.stock} 头 / {f.barns} 个</span>,
  },
  {
    key: "status", label: "状态", filter: "select",
    render: (f) => <span className={`tag ${f.status === "运营中" ? "tag-success" : "tag-warning"}`}>{f.status}</span>,
  },
  {
    key: "createdAt", label: "建档时间", date: true, filter: "date", defaultHidden: true,
    render: (f) => <span className="text-body-sm text-text-secondary tabular-nums">{f.createdAt}</span>,
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
      primaryAction={{ label: "新建牛场" }}
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
