import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/operations/message-config")({
  head: () => ({
    meta: [
      { title: "消息配置管理 — 奇点智牧" },
      { name: "description", content: "配置各类业务消息的推送对象、渠道与触发条件。" },
      { property: "og:title", content: "消息配置管理 — 奇点智牧" },
      { property: "og:description", content: "配置各类业务消息的推送对象、渠道与触发条件。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-page-title text-foreground">消息配置管理</h1>
      <div className="rounded-lg border border-border bg-card p-10 text-center text-body-sm text-text-tertiary">
        配置各类业务消息的推送对象、渠道与触发条件。功能建设中。
      </div>
    </div>
  );
}
