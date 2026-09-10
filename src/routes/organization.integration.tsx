import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Beef, Boxes, Layers, Link2, Info } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/organization/integration")({
  head: () => ({
    meta: [
      { title: "第三方系统管理 — 奇点智牧" },
      { name: "description", content: "统一管理牛群系统、ERP 系统与人事系统的接口对接与帐套配置。" },
      { property: "og:title", content: "第三方系统管理 — 奇点智牧" },
      { property: "og:description", content: "统一管理牛群系统、ERP 系统与人事系统的接口对接与帐套配置。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: IntegrationPage,
});

type SysKind = "herd" | "erp" | "external";

type Book = {
  id: string;
  name: string;
  code: string;
  clientId: string;
  clientSecret: string;
  appKey: string;
  instanceId: string;
  customClientId: string;
  customClientSecret: string;
  customAppKey: string;
  customInstanceId: string;
  enabled: boolean;
};

type BookFieldKey =
  | "clientId"
  | "clientSecret"
  | "appKey"
  | "instanceId"
  | "customClientId"
  | "customClientSecret"
  | "customAppKey"
  | "customInstanceId";

const BOOK_FIELDS: { key: BookFieldKey; label: string }[] = [
  { key: "clientId", label: "ClientId" },
  { key: "clientSecret", label: "ClientSecret" },
  { key: "appKey", label: "AppKey" },
  { key: "instanceId", label: "InstanceId" },
  { key: "customClientId", label: "CustomClientId" },
  { key: "customClientSecret", label: "CustomClientSecret" },
  { key: "customAppKey", label: "CustomAppKey" },
  { key: "customInstanceId", label: "CustomInstanceId" },
];

type SystemRow = {
  id: string;
  kind: SysKind;
  name: string;
  apiUrl: string;
  appKey: string;
  appSecret: string;
  remark: string;
  domain?: string;
  enabled: boolean;
  books?: Book[];
};

const initialSystems: SystemRow[] = [
  {
    id: "S-HERD",
    kind: "herd",
    name: "一牧云牛群管理系统",
    apiUrl: "https://api.yimuyun.com/v2/herd",
    domain: "yimuyun.com",
    appKey: "herd_ak_8f21c9",
    appSecret: "••••••••••••",
    remark: "牛只基础档案与繁育数据同步",
    enabled: true,
  },
  {
    id: "S-ERP",
    kind: "erp",
    name: "金蝶云",
    apiUrl: "https://erp.qidian-farm.com/openapi",
    domain: "kingdee.com",
    appKey: "erp_ak_2b77de",
    appSecret: "••••••••••••",
    remark: "药品采购与费用凭证对接",
    enabled: true,
    books: [
      {
        id: "B1",
        name: "内蒙古晟安畜牧服务有限公司",
        code: "1339492152346189312",
        clientId: "287468",
        clientSecret: "4022211ee6e5180cfa263081",
        appKey: "vcGwysTa",
        instanceId: "306147945068236800",
        customClientId: "287468",
        customClientSecret: "4022211ee6e5180cfa263081",
        customAppKey: "vcGwysTa",
        customInstanceId: "306147945068236800",
        enabled: true,
      },
      {
        id: "B2",
        name: "连云港晟安畜牧服务有限公司",
        code: "1341719110069057024",
        clientId: "341214",
        clientSecret: "5a18423d2608389d1f9603b",
        appKey: "QWuHcrwb",
        instanceId: "525438283317121024",
        customClientId: "341214",
        customClientSecret: "5a18423d2608389d1f9603b",
        customAppKey: "QWuHcrwb",
        customInstanceId: "525438283317121024",
        enabled: true,
      },
    ],
  },

  {
    id: "S-EXT-1",
    kind: "external",
    name: "i人事",
    apiUrl: "https://api.ihr360.com/openapi",
    domain: "ihr360.com",
    appKey: "ihr_ak_5c93af",
    appSecret: "••••••••••••",
    remark: "人事组织架构与人员信息同步",
    enabled: true,
  },
];

const KIND_META: Record<SysKind, { title: string; desc: string; limit: string; icon: typeof Beef }> = {
  herd: { title: "牛群系统", desc: "同步牛只档案、繁育与生产数据", limit: "1 个系统", icon: Beef },
  erp: { title: "ERP 系统", desc: "对接采购、库存与财务凭证", limit: "1 个系统，2个帐套", icon: Boxes },
  external: { title: "人事系统", desc: "人事与组织人员数据接口", limit: "1 个系统", icon: Link2 },
};

function emptyForm(kind: SysKind): SystemRow {
  return { id: "", kind, name: "", apiUrl: "", appKey: "", appSecret: "", remark: "", enabled: true, books: kind === "erp" ? [] : undefined };
}

function IntegrationPage() {
  const [systems, setSystems] = useState<SystemRow[]>(initialSystems);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<SystemRow>(emptyForm("external"));
  const [editing, setEditing] = useState(false);

  const of = (kind: SysKind) => systems.filter((s) => s.kind === kind);

  const openCreate = (kind: SysKind) => {
    setForm(emptyForm(kind));
    setEditing(false);
    setOpen(true);
  };
  const openEdit = (row: SystemRow) => {
    setForm({ ...row, books: row.books ? row.books.map((b) => ({ ...b })) : undefined });
    setEditing(true);
    setOpen(true);
  };

  const set = <K extends keyof SystemRow>(k: K, v: SystemRow[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    if (!form.name.trim()) return toast.error("请填写系统名称");
    if (!form.apiUrl.trim()) return toast.error("请填写 API 地址");
    if (!editing && of(form.kind).length >= 1) {
      return toast.error(`${KIND_META[form.kind].title}只能接入 1 个系统`);
    }
    if (form.kind === "erp" && (form.books ?? []).some((b) => !b.name.trim() || !b.code.trim())) {
      return toast.error("请完整填写帐套名称与编码");
    }
    if (editing) {
      setSystems((prev) => prev.map((s) => (s.id === form.id ? form : s)));
      toast.success("配置已保存");
    } else {
      setSystems((prev) => [...prev, { ...form, id: `S-${Date.now()}` }]);
      toast.success("系统接入成功");
    }
    setOpen(false);
  };

  const remove = (id: string) => {
    setSystems((prev) => prev.filter((s) => s.id !== id));
    toast.success("已解除接入");
  };

  const toggle = (id: string, v: boolean) => {
    setSystems((prev) => prev.map((s) => (s.id === id ? { ...s, enabled: v } : s)));
    toast.success(v ? "已启用" : "已停用");
  };

  const addBook = () =>
    setForm((f) => ({
      ...f,
      books: [
        ...(f.books ?? []),
        {
          id: `B-${Date.now()}`,
          name: "",
          code: "",
          clientId: "",
          clientSecret: "",
          appKey: "",
          instanceId: "",
          customClientId: "",
          customClientSecret: "",
          customAppKey: "",
          customInstanceId: "",
          enabled: true,
        },
      ],
    }));
  const updateBook = (id: string, patch: Partial<Book>) =>
    setForm((f) => ({ ...f, books: (f.books ?? []).map((b) => (b.id === id ? { ...b, ...patch } : b)) }));
  const removeBook = (id: string) =>
    setForm((f) => ({ ...f, books: (f.books ?? []).filter((b) => b.id !== id) }));

  return (
    <>
      <AppHeader title="第三方系统管理" breadcrumb={["组织管理", "第三方系统管理"]} />
      <main className="flex-1 px-6 py-6">
        <div className="mx-auto w-full max-w-4xl">
          <Card className="border-border bg-card p-0 overflow-hidden divide-y divide-border">
            {(["herd", "erp", "external"] as SysKind[]).map((kind) => {
              const meta = KIND_META[kind];
              const rows = of(kind);
              return (
                <div key={kind} className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-caption text-text-tertiary">{meta.title}</span>
                    <span className="text-caption text-text-tertiary/60 truncate">{meta.desc}</span>
                    <span className="text-caption text-text-tertiary/60 ml-auto shrink-0">{meta.limit}</span>
                  </div>

                  {rows.length === 0 ? (
                    <div className="flex items-center gap-3 py-2">
                      <span className="text-body-sm text-text-tertiary">暂未接入</span>
                      <Button variant="ghost" size="sm" className="ml-auto shrink-0 text-primary" onClick={() => openCreate(kind)}>
                        新增配置
                      </Button>
                    </div>
                  ) : (

                    rows.map((s) => (
                      <div key={s.id} className="flex items-center gap-3 py-1">
                        <SystemLogo name={s.name} domain={s.domain} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-body font-medium text-foreground truncate">{s.name}</span>
                            <span className={`tag shrink-0 ${s.enabled ? "tag-success" : "tag-muted"}`}>
                              {s.enabled ? "已启用" : "已停用"}
                            </span>
                          </div>
                          {s.remark && (
                            <div className="text-caption text-text-tertiary truncate">{s.remark}</div>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" className="shrink-0 text-primary" onClick={() => openEdit(s)}>
                          编辑/配置
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </Card>
        </div>
      </main>


      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:w-1/2 sm:max-w-none p-0 flex flex-col gap-0">
          <SheetHeader className="px-6 py-4 border-b border-border">
            <SheetTitle className="text-card-title text-foreground text-left">
              {editing ? "配置" : "接入"}{KIND_META[form.kind].title}
            </SheetTitle>
            <SheetDescription className="text-caption text-text-tertiary text-left">
              {KIND_META[form.kind].limit}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            <section className="px-6 py-5 border-b border-border space-y-4">
              <div className="flex items-center gap-2">
                <span className="h-5 w-1 rounded-full bg-primary" />
                <h4 className="text-body font-medium text-foreground inline-flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-text-secondary" /> 接口信息
                </h4>
              </div>
              <Field label="系统名称" required>
                <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="如：金蝶云" className="h-9 bg-card border-border text-body-sm" />
              </Field>
              <Field label="API 地址" required>
                <Input value={form.apiUrl} onChange={(e) => set("apiUrl", e.target.value)} placeholder="https://" className="h-9 bg-card border-border text-body-sm font-mono" />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="AppKey">
                  <Input value={form.appKey} onChange={(e) => set("appKey", e.target.value)} placeholder="接口账号 / AppKey" className="h-9 bg-card border-border text-body-sm font-mono" />
                </Field>
                <Field label="AppSecret">
                  <Input value={form.appSecret} onChange={(e) => set("appSecret", e.target.value)} placeholder="接口密钥" className="h-9 bg-card border-border text-body-sm font-mono" />
                </Field>
              </div>
              <Field label="备注">
                <Textarea value={form.remark} onChange={(e) => set("remark", e.target.value)} placeholder="用途说明" className="min-h-20 bg-card border-border text-body-sm" />
              </Field>
              <div className="flex items-center justify-between">
                <span className="text-body-sm text-foreground">启用该系统</span>
                <Switch checked={form.enabled} onCheckedChange={(v) => set("enabled", v)} />
              </div>
            </section>

            {form.kind === "erp" && (
              <section className="px-6 py-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-1 rounded-full bg-primary" />
                    <h4 className="text-body font-medium text-foreground inline-flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-text-secondary" /> 帐套配置
                    </h4>
                  </div>
                  <Button variant="outline" size="sm" onClick={addBook}>新增帐套</Button>
                </div>

                {(form.books ?? []).length === 0 ? (
                  <div className="rounded-md border border-dashed border-border px-4 py-6 text-center text-body-sm text-text-tertiary">
                    暂无帐套，可新增多个帐套
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(form.books ?? []).map((b, i) => (
                      <div key={b.id} className="rounded-md border border-border bg-card p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-body-sm font-medium text-foreground">帐套 {i + 1}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-caption text-text-tertiary">启用该帐套</span>
                            <Switch checked={b.enabled} onCheckedChange={(v) => updateBook(b.id, { enabled: v })} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="帐套名称" required>
                            <Input value={b.name} onChange={(e) => updateBook(b.id, { name: e.target.value })} placeholder="如：集团总账套" className="h-9 bg-card border-border text-body-sm" />
                          </Field>
                          <Field label="帐套编码" required>
                            <Input value={b.code} onChange={(e) => updateBook(b.id, { code: e.target.value })} placeholder="如：001" className="h-9 bg-card border-border text-body-sm font-mono" />
                          </Field>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {BOOK_FIELDS.map((f) => (
                            <Field key={f.key} label={f.label}>
                              <Input
                                value={b[f.key]}
                                onChange={(e) => updateBook(b.id, { [f.key]: e.target.value })}
                                placeholder={f.label}
                                className="h-9 bg-card border-border text-body-sm font-mono"
                              />
                            </Field>
                          ))}
                        </div>
                        <div className="flex items-center justify-end">
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => removeBook(b.id)}>删除</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>

          <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-2 bg-background">
            {editing && (
              <Button
                variant="ghost"
                className="text-destructive mr-auto"
                onClick={() => {
                  remove(form.id);
                  setOpen(false);
                }}
              >
                解除接入
              </Button>
            )}
            <Button variant="outline" onClick={() => setOpen(false)}>取消</Button>
            <Button onClick={submit} className="bg-primary hover:bg-[var(--brand-hover)] text-primary-foreground">
              {editing ? "保存配置" : "确认接入"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function SystemLogo({ name, domain }: { name: string; domain?: string }) {
  const token = import.meta.env['VITE_LOVABLE_CONNECTOR_LOGO_DEV_API_KEY'] as string | undefined;
  const [failed, setFailed] = useState(false);
  const src = domain && token ? `https://img.logo.dev/${domain}?token=${token}&size=80&format=png` : undefined;
  return (
    <div className="h-8 w-8 shrink-0 rounded-md bg-brand-subtle overflow-hidden flex items-center justify-center">
      {src && !failed ? (
        <img src={src} alt={`${name} logo`} className="h-full w-full object-contain" loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <span className="text-body-sm font-medium text-primary">{name.slice(0, 1)}</span>
      )}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-caption text-text-tertiary">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

function InfoItem({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="text-caption text-text-tertiary">{label}</div>
      <div className={`text-body-sm text-foreground truncate ${mono ? "font-mono" : ""}`}>{value || "—"}</div>
    </div>
  );
}
