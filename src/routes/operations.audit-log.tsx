import { createFileRoute, redirect } from "@tanstack/react-router";

// 原「审计日志」已改为 运营管理 › 日志中心（第三方交互日志 + 消息推送日志），旧链接保持可用。
export const Route = createFileRoute("/operations/audit-log")({
  beforeLoad: () => {
    throw redirect({ to: "/operations/log-center", replace: true });
  },
  component: () => null,
});
