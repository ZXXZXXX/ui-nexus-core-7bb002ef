import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import {
  CheckCircle2,
  Ban,
  Stethoscope as StethoscopeIcon,
  Send,
  Stethoscope,
  Lock,
} from "lucide-react";
import { MobileShell } from "@/components/mobile-shell";
import { TransferBarnControl } from "@/components/m/transfer-barn-control";
import { MediaGrid } from "@/components/m/media-grid";
import { ConfirmTransferDialog } from "@/components/m/confirm-transfer-dialog";
import { ConfirmAbortDialog } from "@/components/m/confirm-abort-dialog";
import { ConfirmRevisitDialog } from "@/components/m/confirm-revisit-dialog";
import { getOrderEarTagLabel } from "@/lib/work-order-cattle";
import { useRole } from "@/lib/mobile-role";
import { toast } from "sonner";

export const Route = createFileRoute("/m/health/$id_/review")({
  head: () => ({ meta: [{ title: "复查记录 · 奇点智牧" }] }),
  component: ReviewPage,
});

type Verdict = "cure" | "abandon" | "revisit";

const ABANDON_REASONS = [
  "治疗无效",
  "牛只死亡",
  "经济性放弃",
  "牛只淘汰",
  "其他",
];



function ReviewPage() {
  const { id } = useParams({ from: "/m/health/$id_/review" });
  const role = useRole();
  const navigate = useNavigate();

  const isVet = role === "vet" || role === "manager";

  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [abandonReason, setAbandonReason] = useState("");
  const [abandonOther, setAbandonOther] = useState("");
  const [media, setMedia] = useState<number[]>([]);
  const [needTransfer, setNeedTransfer] = useState(false);
  const [transferTo, setTransferTo] = useState("");
  const [transferConfirmOpen, setTransferConfirmOpen] = useState(false);
  const [revisitConfirmOpen, setRevisitConfirmOpen] = useState(false);
  const [confirmAbortOpen, setConfirmAbortOpen] = useState(false);
  const earTagLabel = getOrderEarTagLabel(id);

  const finalAbandonReason = abandonReason === "其他" ? abandonOther.trim() : abandonReason;

  const canSubmit = (() => {
    if (!verdict) return false;
    if (verdict === "revisit") return true;
    if (needTransfer && !transferTo) return false;
    if (verdict === "abandon" && !finalAbandonReason) return false;
    return true;
  })();

  if (!isVet) {
    return (
      <MobileShell title="复查" back hideTabBar>
        <div className="px-4 pt-16 flex flex-col items-center text-center">
          <span className="h-12 w-12 rounded-full bg-surface-subtle inline-flex items-center justify-center mb-3">
            <Lock className="h-5 w-5 text-text-tertiary" />
          </span>
          <div className="text-body font-medium text-foreground">仅兽医可执行复查</div>
          <p className="text-body-sm text-text-tertiary mt-2 max-w-[260px]">
            处方执行完毕后，本工单需由兽医进行复查记录。当前角色无权限。
          </p>
        </div>
      </MobileShell>
    );
  }

  const goRevisit = () => {
    const targetTag = earTagLabel.replace(/^#/, "");
    navigate({
      to: "/m/report",
      search: { target: targetTag, revisitFrom: id, lock: 1 },
    });
  };

  const doSubmit = () => {
    if (verdict === "cure") {
      toast.success(needTransfer ? `已确认治愈，转至 ${transferTo}` : "已确认治愈");
      navigate({ to: "/m/health/$id", params: { id }, search: { tab: "execute" } });
    } else if (verdict === "abandon") {
      toast.success(needTransfer ? `已放弃治疗，已转至 ${transferTo}` : "已放弃治疗，工单已终止");
      navigate({ to: "/m/health/$id", params: { id }, search: { tab: "execute" } });
    } else if (verdict === "revisit") {
      goRevisit();
    }
  };

  const submit = () => {
    if (!canSubmit) {
      toast.error("请完成必填项");
      return;
    }
    if (verdict === "abandon") {
      setConfirmAbortOpen(true);
      return;
    }
    if (needTransfer && transferTo) {
      setTransferConfirmOpen(true);
      return;
    }
    doSubmit();
  };

  const handleAbortConfirm = () => {
    setConfirmAbortOpen(false);
    if (needTransfer && transferTo) {
      setTransferConfirmOpen(true);
      return;
    }
    doSubmit();
  };

  return (
    <MobileShell title="复查记录" back hideTabBar>
      <div className="pb-28">
        <div className="px-4 pt-3 pb-2">
          <div className="text-caption text-text-tertiary inline-flex items-center gap-1">
            <Stethoscope className="h-3.5 w-3.5" />
            工单 <span className="font-mono text-text-secondary">{id}</span>
            <span className="mx-1">·</span>
            复查须由兽医完成
          </div>
        </div>

        <div className="px-4 space-y-4">
          {/* 三选一 */}
          <div className="rounded-xl bg-card border border-border p-4">
            <div className="text-caption text-text-tertiary mb-2">复查结论</div>
            <div className="grid grid-cols-3 gap-2">
              {([
                { v: "cure", icon: CheckCircle2, label: "治愈", tone: "primary" },
                { v: "revisit", icon: StethoscopeIcon, label: "复诊", tone: "info" },
                { v: "abandon", icon: Ban, label: "放弃", tone: "danger" },
              ] as { v: Verdict; icon: typeof CheckCircle2; label: string; tone: string }[]).map(
                ({ v, icon: Icon, label, tone }) => {
                  const active = verdict === v;
                  const activeCls =
                    tone === "primary"
                      ? "border-primary/50 bg-brand-subtle text-primary"
                      : tone === "danger"
                        ? "border-[var(--state-danger)]/50 bg-[var(--state-danger)]/10 text-[var(--state-danger)]"
                        : "border-[#22ACEB]/50 bg-[#22ACEB]/10 text-[#22ACEB]";
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => {
                        if (v === "revisit") {
                          setRevisitConfirmOpen(true);
                          return;
                        }
                        setVerdict(v);
                      }}
                      className={`h-20 rounded-lg border flex flex-col items-center justify-center gap-1 text-body-sm ${
                        active ? activeCls : "border-border bg-card text-foreground"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {label}
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* 放弃原因 */}
          {verdict === "abandon" && (
            <div className="rounded-xl bg-card border border-border p-4">
              <div className="text-caption text-text-tertiary mb-2">
                放弃原因 <span className="text-[var(--state-danger)]">*</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ABANDON_REASONS.map((r) => {
                  const active = abandonReason === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setAbandonReason(r)}
                      className={`h-8 px-3 rounded-full text-body-sm border ${
                        active
                          ? "bg-brand-subtle text-primary border-primary/40"
                          : "bg-card text-text-secondary border-border"
                      }`}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
              {abandonReason === "其他" && (
                <textarea
                  value={abandonOther}
                  onChange={(e) => setAbandonOther(e.target.value)}
                  placeholder="请输入放弃原因"
                  className="mt-2 w-full min-h-[72px] rounded-lg border border-border bg-card px-3 py-2 text-body-sm placeholder:text-text-tertiary resize-none focus:outline-none focus:border-primary/40"
                />
              )}
            </div>
          )}

          {/* 现场材料 */}
          {verdict && (
            <div className="rounded-xl bg-card border border-border p-4">
              <div className="text-caption text-text-tertiary mb-2">现场材料</div>
              <MediaGrid items={media} setItems={setMedia} max={9} />
            </div>
          )}

          {/* 转栏 */}
          {verdict && verdict !== "revisit" && (
            <TransferBarnControl
              enabled={needTransfer}
              onEnabledChange={setNeedTransfer}
              value={transferTo}
              onValueChange={setTransferTo}
            />
          )}

        </div>
      </div>


      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] bg-card border-t border-border p-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
        <button
          onClick={submit}
          disabled={!canSubmit}
          className={`w-full h-11 rounded-lg text-body inline-flex items-center justify-center gap-1.5 ${
            canSubmit
              ? verdict === "abandon"
                ? "bg-[var(--state-danger)] text-white"
                : "bg-primary text-primary-foreground"
              : "bg-border text-text-tertiary"
          }`}
        >
          <Send className="h-4 w-4" /> 提交复查结论
        </button>
      </div>

      <ConfirmAbortDialog
        open={confirmAbortOpen}
        orderId={id}
        reason={finalAbandonReason}
        onCancel={() => setConfirmAbortOpen(false)}
        onConfirm={handleAbortConfirm}
      />

      <ConfirmTransferDialog
        open={transferConfirmOpen}
        earTag={earTagLabel}
        barn={transferTo}
        onCancel={() => setTransferConfirmOpen(false)}
        onConfirm={() => {
          setTransferConfirmOpen(false);
          doSubmit();
        }}
      />

      {revisitConfirmOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center"
          onClick={() => setRevisitConfirmOpen(false)}
        >
          <div
            className="w-full max-w-[440px] bg-card rounded-t-2xl sm:rounded-2xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-body font-medium text-foreground mb-2">前往复诊上报</div>
            <p className="text-body-sm text-text-secondary leading-relaxed">
              确认后，本工单 <span className="font-mono text-text-primary">{id}</span> 将自动完结，并在新的复诊上报中自动关联本工单的所有信息字段。
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setRevisitConfirmOpen(false)}
                className="flex-1 h-10 rounded-lg border border-border bg-card text-body-sm text-text-secondary"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  setRevisitConfirmOpen(false);
                  goRevisit();
                }}
                className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-body-sm"
              >
                确认并前往
              </button>
            </div>
          </div>
        </div>
      )}
    </MobileShell>
  );
}
