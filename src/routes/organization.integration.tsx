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
import { Beef, Boxes, Layers, Link2, Plus, Info } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/organization/integration")({
  head: () => ({
    meta: [
      { title: "第三方系统管理 — 奇点智牧" },
      { name: "description", content: "统一管理牛群系统、ERP 系统与外部系统的接口对接与帐套配置。" },
      { property: "og:title", content: "第三方系统管理 — 奇点智牧" },
      { property: "og:description", content: "统一管理牛群系统、ERP 系统与外部系统的接口对接与帐套配置。" },
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
  apiUrl: string;
  enabled: boolean;
};

type SystemRow = {
  id: string;
  kind: SysKind;
  name: string;
  apiUrl: string;
  appKey: string;
  appSecret: string;
  remark: string;
  enabled: boolean;
  books?: Book[];
};

const initialSystems: SystemRow[] = [
  {
    id: "S-HERD",
    kind: "herd",
    name: "一牧云牛群管理系统",
    apiUrl: "https://api.yimuyun.com/v2/herd",
    appKey: "herd_ak_8f21c9",
    appSecret: "••••••••••••",
    remark: "牛只基础档案与繁育数据同步",
    enabled: true,
  },
  {
    id: "S-ERP",
    kind: "erp",
    name: "用友 U8 Cloud",
    apiUrl: "https://erp.qidian-farm.com/openapi",
    appKey: "erp_ak_2b77de",
    appSecret: "••••••••••••",
    remark: "药品采购与费用凭证对接",
    enabled: true,
    books: [
      { id: "B1", name: "集团总账套", code: "001", apiUrl: "https://erp.qidian-farm.com/openapi/001", enabled: true },
      { id: "B2", name: "华北区帐套", code: "002", apiUrl: "https://erp.qidian-farm.com/openapi/002", enabled: true },
    ],
  },
  {
    id: "S-EXT-1",
    kind: "external",
    name: "企业微信开放平台",
    apiUrl: "https://qyapi.weixin.qq.com/cgi-bin",
    appKey: "ww1234567890abcdef",
    appSecret: "••••••••••••",
    remark: "组织架构与消息推送",
    enabled: true,
  },
];

const KIND_META: Record<SysKind, { title: string; desc: string; limit: string; icon: typeof Beef }> = {
  herd: { title: "牛群系统", desc: "同步牛只档案、繁育与生产数据", limit: "仅允许接入 1 个系统", icon: Beef },
  erp: { title: "ERP 系统", desc: "对接采购、库存与财务凭证", limit: "仅允许接入 1 个系统，可配置多个帐套", icon: Boxes },
  external: { title: "外部系统", desc: "其他第三方平台接口", limit: "可接入多个系统", icon: Link2 },
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
    if (!editing && form.kind !== "external" && of(form.kind).length >= 1) {
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
      books: [...(f.books ?? []), { id: `B-${Date.now()}`, name: "", code: "", apiUrl: "", enabled: true }],
    }));
  const updateBook = (id: string, patch: Partial<Book>) =>
    setForm((f) => ({ ...f, books: (f.books ?? []).map((b) => (b.id === id ? { ...b, ...patch } : b)) }));
  const removeBook = (id: string) =>
    setForm((f) => ({ ...f, books: (f.books ?? []).filter((b) => b.id !== id) }));

  return (
    <>
      <AppHeader title="第三方系统管理" breadcrumb={["组织管理", "第三方系统管理"]} />
      <main className="flex-1 px-6 py-6 space-y-6">
        {(["herd", "erp", "external"] as SysKind[]).map((kind) => {
          const meta = KIND_META[kind];
          const rows = of(kind);
          const canAdd = kind === "external" || rows.length === 0;
          const Icon = meta.icon;
          return (
            <section key={kind} className="space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-lg bg-brand-subtle flex items-center justify-center">
                    <Icon className="h-4 w-4 text-primary" strokeWidth={1.75} />
                  </div>
                  <div>
                    <div className="text-section-title text-foreground">{meta.title}</div>
                    <div className="text-caption text-text-tertiary">{meta.desc} · {meta.limit}</div>
                  </div>
                </div>
                <Button
                  size="sm"
                  disabled={!canAdd}
                  onClick={() => openCreate(kind)}
                  className="h-9 gap-1.5 text-body-sm font-normal bg-primary hover:bg-[var(--brand-hover)] text-primary-foreground"
                >
                  <Plus className="h-3.5 w-3.5" /> 接入系统
                </Button>
              </div>

              {rows.length === 0 ? (
                <Card className="border-dashed border-border bg-card p-8 text-center text-body-sm text-text-tertiary">
                  暂未接入{meta.title}
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {rows.map((s) => (
                    <Card key={s.id} className="border-border bg-card p-5 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-card-title text-foreground truncate">{s.name}</div>
                          <div className="text-caption text-text-tertiary font-mono truncate">{s.apiUrl}</div>
                        </div>
                        <span className={`tag ${s.enabled ? "tag-success" : "tag-muted"}`}>
                          {s.enabled ? "已启用" : "已停用"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
                        <div>
                          <div className="text-caption text-text-tertiary">AppKey</div>
                          <div className="text-body-sm text-foreground font-mono truncate">{s.appKey || "—"}</div>
                        </div>
                        <div>
                          <div className="text-caption text-text-tertiary">AppSecret</div>
                          <div className="text-body-sm text-foreground font-mono truncate">{s.appSecret || "—"}</div>
                        </div>
                      </div>

                      {s.kind === "erp" && (
                        <div className="pt-2 border-t border-border space-y-1.5">
                          <div className="flex items-center gap-1.5 text-caption text-text-tertiary">
                            <Layers className="h-3 w-3" /> 帐套（{s.books?.length ?? 0}）
                          </div>
                          {(s.books ?? []).length === 0 ? (
                            <div className="text-body-sm text-text-tertiary">暂无帐套</div>
                          ) : (
                            <div className="space-y-1">
                              {(s.books ?? []).map((b) => (
                                <div key={b.id} className="flex items-center justify-between gap-2 rounded-md bg-muted/40 px-2.5 py-1.5">
                                  <span className="text-body-sm text-foreground truncate">{b.name}</span>
                                  <span className="text-caption text-text-tertiary font-mono shrink-0">{b.code}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {s.remark && <div className="text-caption text-text-tertiary">{s.remark}</div>}

                      <div className="flex items-center justify-between pt-3 border-t border-border">
                        <div className="flex items-center gap-2">
                          <span className="text-caption text-text-tertiary">启用</span>
                          <Switch checked={s.enabled} onCheckedChange={(v) => toggle(s.id, v)} />
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEdit(s)}>配置</Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => remove(s.id)}>解除接入</Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          );
        })}
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
                <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="如：用友 U8 Cloud" className="h-9 bg-card border-border text-body-sm" />
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
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => removeBook(b.id)}>删除</Button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="帐套名称" required>
                            <Input value={b.name} onChange={(e) => updateBook(b.id, { name: e.target.value })} placeholder="如：集团总账套" className="h-9 bg-card border-border text-body-sm" />
                          </Field>
                          <Field label="帐套编码" required>
                            <Input value={b.code} onChange={(e) => updateBook(b.id, { code: e.target.value })} placeholder="如：001" className="h-9 bg-card border-border text-body-sm font-mono" />
                          </Field>
                        </div>
                        <Field label="帐套 API 地址">
                          <Input value={b.apiUrl} onChange={(e) => updateBook(b.id, { apiUrl: e.target.value })} placeholder="https://" className="h-9 bg-card border-border text-body-sm font-mono" />
                        </Field>
                        <div className="flex items-center justify-between">
                          <span className="text-body-sm text-foreground">启用该帐套</span>
                          <Switch checked={b.enabled} onCheckedChange={(v) => updateBook(b.id, { enabled: v })} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>

          <div className="px-6 py-4 border-t border-border flex justify-end gap-2 bg-background">
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
