import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/operations/event-mapping")({
  head: () => ({
    meta: [
      { title: "事件映射管理 — 奇点智牧" },
      { name: "description", content: "维护本系统事件与第三方系统（如 UD）事件之间的映射关系。" },
      { property: "og:title", content: "事件映射管理 — 奇点智牧" },
      { property: "og:description", content: "维护本系统事件与第三方系统（如 UD）事件之间的映射关系。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-page-title text-foreground">事件映射管理</h1>
      <div className="rounded-lg border border-border bg-card p-10 text-center text-body-sm text-text-tertiary">
        维护本系统事件与第三方系统（如 UD）事件之间的映射关系。功能建设中。
      </div>
    </div>
  );
}
