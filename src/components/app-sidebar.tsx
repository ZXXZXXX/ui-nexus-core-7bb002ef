import * as React from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  Pill,
  BookOpen,
  FolderArchive,
  MessageSquare,
  BarChart3,
  ChevronDown,
} from "lucide-react";


import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type LeafItem = { title: string; url: string };
type NavGroup = {
  title: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  url?: string;
  children?: LeafItem[];
};

const groups: NavGroup[] = [
  {
    title: "首页",
    icon: LayoutDashboard,
    url: "/",
  },
  {
    title: "基础档案",
    icon: FolderArchive,
    children: [
      { title: "牛场信息", url: "/archive/farm" },
      { title: "牛舍信息", url: "/archive/barn" },
      { title: "牛只信息", url: "/archive/cattle" },
    ],
  },
  {
    title: "工单管理",
    icon: Stethoscope,
    children: [
      { title: "疾病治疗", url: "/production/disease" },
      { title: "疫苗免疫", url: "/production/vaccine" },
      { title: "产后护理", url: "/production/postpartum" },
      { title: "修蹄工单", url: "/production/hoof" },
      { title: "干奶工单", url: "/production/drying" },
      { title: "驱虫工单", url: "/production/deworm" },
      { title: "普修工单", url: "/production/general" },
    ],
  },
  {
    title: "药品管理",
    icon: Pill,
    children: [
      { title: "药品档案", url: "/warehouse/drug" },
      { title: "药品库存", url: "/warehouse" },
      { title: "调拨记录", url: "/warehouse/transfer" },
      { title: "取药记录", url: "/warehouse/dispense" },
      { title: "损耗管理", url: "/warehouse/loss" },
    ],
  },
  {
    title: "诊疗管理",
    icon: BookOpen,
    children: [
      { title: "疾病管理", url: "/knowledge/disease" },
      { title: "症状管理", url: "/knowledge/symptom" },
      { title: "处方管理", url: "/knowledge/prescription" },
    ],
  },
  {
    title: "组织管理",
    icon: Users,
    children: [
      { title: "账号管理", url: "/organization/account" },
      { title: "角色管理", url: "/organization/role" },
      { title: "租户管理", url: "/organization/tenant" },
    ],
  },
  {
    title: "统计分析",
    icon: BarChart3,
    url: "/stats",
  },
  {
    title: "反馈管理",
    icon: MessageSquare,
    url: "/feedback",
  },
];

export function AppSidebar() {
  const currentPath = useRouterState({
    select: (router) => router.location.pathname,
  });

  const isLeafActive = (url: string) =>
    url === "/" ? currentPath === "/" : currentPath === url;

  const hasActiveChild = (g: NavGroup) =>
    !!g.children?.some((c) => isLeafActive(c.url)) || (!!g.url && isLeafActive(g.url));

  // 默认收起；当前页所在分组自动展开。手动开关后保持用户选择。
  const [openMap, setOpenMap] = React.useState<Record<string, boolean>>(() =>
    Object.fromEntries(groups.map((g) => [g.title, hasActiveChild(g)])),
  );

  // 路由切换时，确保当前活动分组展开（不强制收起其他用户已展开项）
  React.useEffect(() => {
    setOpenMap((prev) => {
      const next = { ...prev };
      groups.forEach((g) => {
        if (hasActiveChild(g)) next[g.title] = true;
      });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPath]);

  return (
    <Sidebar collapsible="none" className="border-r border-border bg-card">
      <SidebarHeader className="h-[88px] border-b border-border bg-card p-0">
        <div className="flex h-full items-center px-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-subtle">
              <span className="text-card-title text-primary font-semibold leading-none">奇</span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-card-title font-medium text-foreground leading-tight">奇点</span>
              <span className="text-caption text-text-tertiary leading-tight">智牧管理系统</span>
            </div>
          </Link>
        </div>
      </SidebarHeader>

      {/* 中部导航：纵向滚动 */}
      <SidebarContent className="bg-card pt-2 overflow-y-auto">
        {groups.map((group) => {
          const open = !!openMap[group.title];
          const sectionActive = hasActiveChild(group);
          const isLeaf = !group.children && !!group.url;

          return (
            <SidebarGroup
              key={group.title}
              className="px-2 py-0 rounded-lg"
            >
              {isLeaf ? (
                <SidebarMenuButton
                  asChild
                  isActive={sectionActive}
                  className={`relative h-9 rounded-lg px-3 text-body-sm transition-colors
                    text-text-secondary
                    hover:bg-[var(--sidebar-hover)] hover:text-foreground
                    data-[active=true]:bg-[var(--brand-soft)] data-[active=true]:text-primary data-[active=true]:font-medium
                    data-[active=true]:before:absolute data-[active=true]:before:left-0 data-[active=true]:before:top-1.5 data-[active=true]:before:bottom-1.5 data-[active=true]:before:w-[3px] data-[active=true]:before:rounded-r-full data-[active=true]:before:bg-primary`}
                >
                  <Link to={group.url!} className="flex items-center gap-2">
                    <group.icon className="h-[16px] w-[16px] shrink-0" strokeWidth={1.75} />
                    <span>{group.title}</span>
                  </Link>
                </SidebarMenuButton>
              ) : (
                <Collapsible
                  open={open}
                  onOpenChange={(v) => setOpenMap((m) => ({ ...m, [group.title]: v }))}
                >
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className={`flex w-full items-center gap-2 h-9 px-3 rounded-lg text-body-sm hover:bg-[var(--sidebar-hover)] hover:text-foreground transition-colors ${
                        sectionActive ? "text-primary font-medium" : "text-text-secondary"
                      }`}
                    >
                      <group.icon className="h-[16px] w-[16px] shrink-0" strokeWidth={1.75} />
                      <span className="flex-1 text-left">{group.title}</span>
                      <ChevronDown
                        className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""} ${sectionActive ? "text-primary" : "text-text-tertiary"}`}
                        strokeWidth={1.75}
                      />
                    </button>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="overflow-hidden">
                    <SidebarGroupContent className="pt-1 pb-1">
                      <SidebarMenu className="gap-0.5">
                        {group.children!.map((c) => {
                          const active = isLeafActive(c.url);
                          return (
                            <SidebarMenuItem key={c.title}>
                              <SidebarMenuButton
                                asChild
                                isActive={active}
                                className={`relative h-9 rounded-lg pl-9 pr-3 text-body-sm transition-colors
                                  text-text-secondary
                                  hover:bg-[var(--sidebar-hover)] hover:text-foreground
                                  data-[active=true]:bg-[var(--brand-soft)] data-[active=true]:text-primary data-[active=true]:font-medium
                                  data-[active=true]:before:absolute data-[active=true]:before:left-0 data-[active=true]:before:top-1.5 data-[active=true]:before:bottom-1.5 data-[active=true]:before:w-[3px] data-[active=true]:before:rounded-r-full data-[active=true]:before:bg-primary`}
                              >
                                <Link to={c.url}>{c.title}</Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          );
                        })}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </SidebarGroup>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
}
