import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/operations/audit-log")({
  head: () => ({
    meta: [
      { title: "审计日志 — 奇点智牧" },
      { name: "description", content: "查看账号在系统内的关键操作记录，便于追溯与合规审计。" },
      { property: "og:title", content: "审计日志 — 奇点智牧" },
      { property: "og:description", content: "查看账号在系统内的关键操作记录，便于追溯与合规审计。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-page-title text-foreground">审计日志</h1>
      <div className="rounded-lg border border-border bg-card p-10 text-center text-body-sm text-text-tertiary">
        查看账号在系统内的关键操作记录，便于追溯与合规审计。功能建设中。
      </div>
    </div>
  );
}
