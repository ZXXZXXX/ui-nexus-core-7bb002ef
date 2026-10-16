import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PullMapping } from "@/components/pull-mapping";
import { PushMapping } from "@/components/push-mapping";

export const Route = createFileRoute("/operations/event-mapping")({
  head: () => ({
    meta: [
      { title: "事件映射管理 — 奇点智牧" },
      { name: "description", content: "配置从第三方系统拉取的事件编码到本系统工单与基础事件的映射，以及本系统处置与事件回传第三方系统的编码映射。" },
      { property: "og:title", content: "事件映射管理 — 奇点智牧" },
      { property: "og:description", content: "配置从第三方系统拉取的事件编码到本系统工单与基础事件的映射，以及本系统处置与事件回传第三方系统的编码映射。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <>
      <AppHeader title="事件映射管理" breadcrumb={["运营管理", "事件映射管理"]} />
      <main className="flex-1 px-6 py-6 space-y-4">
        <Tabs defaultValue="in">
          <TabsList className="h-9 rounded-lg bg-surface-subtle">
            <TabsTrigger value="in" className="rounded-md px-4">拉取映射配置</TabsTrigger>
            <TabsTrigger value="out" className="rounded-md px-4">回传映射配置</TabsTrigger>
          </TabsList>
          <TabsContent value="in" className="mt-4"><PullMapping /></TabsContent>
          <TabsContent value="out" className="mt-4"><PushMapping /></TabsContent>
        </Tabs>
      </main>
    </>
  );
}
