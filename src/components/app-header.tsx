import { useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, Building2, Users, Briefcase, LogOut, Check, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FARMS, useFarm, setFarmId } from "@/lib/farm-store";
import { scopeOptions, setScope, useDashboardView } from "@/lib/dashboard-view";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


interface AppHeaderProps {
  title: string;
  breadcrumb?: string[];
}

const currentUser = {
  name: "张磊",
  initial: "ZL",
  role: "场长",
  team: "兽医部 · 巡检 A 组",
};

export function AppHeader({ title, breadcrumb }: AppHeaderProps) {
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [farmOpen, setFarmOpen] = useState(false);
  const currentFarm = useFarm();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const showFarmSwitcher = pathname === "/" || pathname.startsWith("/production");
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card">
      <div className="flex h-11 items-center gap-3 px-6">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="text-body-sm text-text-tertiary flex items-center gap-1.5">
            {breadcrumb.map((b, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-text-tertiary/60">/</span>}
                <span className={i === breadcrumb.length - 1 ? "text-foreground" : ""}>{b}</span>
              </span>
            ))}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-2">
          {showFarmSwitcher && (
            <Popover open={farmOpen} onOpenChange={setFarmOpen}>
              <PopoverTrigger asChild>
                <button className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-border bg-card hover:bg-surface-subtle transition-colors">
                  <Building2 className="h-3.5 w-3.5 text-primary" />
                  <span className="text-body-sm text-foreground font-medium">{currentFarm.name}</span>
                  <span className="text-caption text-text-tertiary hidden lg:inline">· {currentFarm.region}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-text-tertiary" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 p-0 border-border">
                <div className="px-3 py-2 border-b border-border">
                  <div className="text-caption text-text-tertiary">切换牧场视角 · 仅影响当前模块的数据范围</div>
                </div>
                <div className="p-1 max-h-80 overflow-auto">
                  {FARMS.map((f) => {
                    const active = f.id === currentFarm.id;
                    return (
                      <button
                        key={f.id}
                        onClick={() => { setFarmId(f.id); setFarmOpen(false); }}
                        className={`w-full flex items-start gap-2 px-2 py-2 rounded-md text-left hover:bg-surface-subtle transition-colors ${active ? "bg-brand-subtle" : ""}`}
                      >
                        <div className="flex-1 min-w-0 leading-tight">
                          <div className={`text-body-sm ${active ? "text-primary font-medium" : "text-foreground"}`}>{f.name}</div>
                          <div className="text-caption text-text-tertiary mt-0.5 truncate">{f.region} · {f.scale}</div>
                        </div>
                        {active && <Check className="h-3.5 w-3.5 text-primary mt-1 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          )}


          <button className="relative h-9 w-9 inline-flex items-center justify-center rounded-md text-text-secondary hover:bg-surface-subtle hover:text-foreground transition-colors">
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2.5 h-1.5 w-1.5 rounded-full bg-destructive" />
          </button>

          <Popover>
            <PopoverTrigger asChild>
              <button className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
                <Avatar className="h-8 w-8 cursor-pointer">
                  <AvatarFallback className="bg-brand-subtle text-primary text-body-sm font-medium">
                    {currentUser.initial}
                  </AvatarFallback>
                </Avatar>
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 p-0 border-border">
              <div className="flex items-center gap-3 p-4 border-b border-border">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-brand-subtle text-primary text-body font-medium">
                    {currentUser.initial}
                  </AvatarFallback>
                </Avatar>
                <div className="leading-tight min-w-0">
                  <div className="text-body text-foreground font-medium truncate">{currentUser.name}</div>
                  <div className="text-caption text-text-tertiary">当前账号</div>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-start gap-2.5">
                  <Users className="h-3.5 w-3.5 text-text-tertiary mt-0.5 shrink-0" />
                  <div className="leading-tight">
                    <div className="text-caption text-text-tertiary">角色</div>
                    <div className="text-body-sm text-foreground">{currentUser.role}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Briefcase className="h-3.5 w-3.5 text-text-tertiary mt-0.5 shrink-0" />
                  <div className="leading-tight">
                    <div className="text-caption text-text-tertiary">所属班组</div>
                    <div className="text-body-sm text-foreground">{currentUser.team}</div>
                  </div>
                </div>
              </div>
              <div className="border-t border-border p-2">
                <button
                  onClick={() => setConfirmOpen(true)}
                  className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-body-sm text-text-secondary hover:bg-surface-subtle hover:text-foreground transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  退出登录
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {title && (
        <div className="px-6 pb-2.5 pt-0">
          <h1 className="text-page-title text-foreground">{title}</h1>
        </div>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认退出登录？</AlertDialogTitle>
            <AlertDialogDescription>
              退出后将返回登录页面，未保存的内容可能会丢失。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-primary hover:bg-[var(--brand-hover)] text-primary-foreground"
              onClick={() => {
                setConfirmOpen(false);
                navigate({ to: "/login" });
              }}
            >
              确认退出
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}
