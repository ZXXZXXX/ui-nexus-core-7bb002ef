import { createFileRoute, redirect } from "@tanstack/react-router";

// 原「消息管理」板块已并入 运营管理 › 消息配置管理，旧链接保持可用。
export const Route = createFileRoute("/messages")({
  beforeLoad: () => {
    throw redirect({ to: "/operations/message-config", replace: true });
  },
  component: () => null,
});
