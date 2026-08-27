import { createFileRoute } from "@tanstack/react-router";
import { WorkOrderPage } from "@/components/work-order-page";

export const Route = createFileRoute("/production/general")({
  head: () => ({ meta: [{ title: "普修工单 — 奇点智牧" }] }),
  component: () => <WorkOrderPage title="普修工单" orders={[]} disabled />,
});
