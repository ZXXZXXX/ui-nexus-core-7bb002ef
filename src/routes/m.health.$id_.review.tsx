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

type LeaveKind = "死亡" | "淘汰";

const LEAVE_KINDS: LeaveKind[] = ["死亡", "淘汰"];

const ABANDON_REASONS = ["牛只死亡", "淘汰处理", "其他"] as const;

type AbandonReason = (typeof ABANDON_REASONS)[number];

const inputCls =
  "w-full h-11 px-3 rounded-lg border border-border bg-card text-body-sm text-foreground outline-none focus:border-primary";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="text-caption text-text-tertiary">
        {label} {required && <span className="text-[var(--state-danger)]">*</span>}
      </div>
      {children}
    </div>
  );
}





function ReviewPage() {
  const { id } = useParams({ from: "/m/health/$id_/review" });
  const role = useRole();
  const navigate = useNavigate();

  const isVet = role === "vet" || role === "manager";

  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [abandonReason, setAbandonReason] = useState<AbandonReason | null>(null);
  const [leaveDate, setLeaveDate] = useState(new Date().toISOString().slice(0, 10));
  const [leaveKind, setLeaveKind] = useState<LeaveKind>("死亡");
  const [leaveDetail, setLeaveDetail] = useState("");
  const [leavePrice, setLeavePrice] = useState("");
  const [leaveNote, setLeaveNote] = useState("");
  const [media, setMedia] = useState<number[]>([]);
  const [needTransfer, setNeedTransfer] = useState(false);
  const [transferTo, setTransferTo] = useState("");
  const [transferConfirmOpen, setTransferConfirmOpen] = useState(false);
  const [revisitConfirmOpen, setRevisitConfirmOpen] = useState(false);
  const [confirmAbortOpen, setConfirmAbortOpen] = useState(false);
  const earTagLabel = getOrderEarTagLabel(id);

  const finalAbandonReason = abandonReason === "其他"
    ? leaveDetail.trim()
    : abandonReason
      ? [abandonReason, leaveDetail.trim()].filter(Boolean).join(" / ")
      : leaveDetail.trim();

  const canSubmit = (() => {
    if (!verdict) return false;
    if (verdict === "revisit") return true;
    if (verdict === "abandon") {
      if (!abandonReason) return false;
      if (!finalAbandonReason) return false;
      if (media.length === 0) return false;
      return true;
    }
    if (needTransfer && !transferTo) return false;
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
      toast.success(`已放弃治疗（${finalAbandonReason}），工单终止并登记${leaveKind}离场（${leaveDate}）`);
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
                { v: "cure", icon: CheckCircle2, label: "正常", tone: "primary" },
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
                        if (v === "abandon") {
                          setVerdict("abandon");
                          setAbandonReason(null);
                          setLeaveDetail("");
                          return;
                        }
                        setVerdict(v);
                        setAbandonReason(null);
                        setLeaveDetail("");
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

          {/* 放弃流程：选择原因后自动展开补充信息 */}
          {verdict === "abandon" && (
            <div className="space-y-4">
              <div className="rounded-xl bg-card border border-border p-4 space-y-4">
                <div className="text-caption text-text-tertiary">放弃原因</div>
                <div className="grid grid-cols-2 gap-2">
                  {ABANDON_REASONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        setAbandonReason(r);
                        if (r === "牛只死亡") setLeaveKind("死亡");
                        if (r === "淘汰处理") setLeaveKind("淘汰");
                        setLeaveDetail("");
                      }}
                      className={`h-11 rounded-lg text-body-sm ${
                        abandonReason === r
                          ? "bg-primary text-primary-foreground"
                          : "bg-card border border-border text-text-secondary"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {abandonReason === "其他" && (
                <div className="rounded-xl bg-card border border-border p-4 space-y-4">
                  <div className="text-caption text-text-tertiary">补充原因</div>
                  <Field label="具体原因" required>
                    <textarea
                      value={leaveDetail}
                      onChange={(e) => setLeaveDetail(e.target.value)}
                      rows={3}
                      className="w-full p-3 rounded-lg border border-border bg-card text-body-sm text-foreground outline-none focus:border-primary resize-none"
                      placeholder="请填写具体放弃原因"
                    />
                  </Field>
                </div>
              )}

              {(abandonReason === "牛只死亡" || abandonReason === "淘汰处理") && (
                <div className="rounded-xl bg-card border border-border p-4 space-y-4">
                  <div className="text-caption text-text-tertiary">登记离场信息</div>

                  <Field label="详情" required>
                    <textarea
                      value={leaveDetail}
                      onChange={(e) => setLeaveDetail(e.target.value)}
                      rows={3}
                      className="w-full p-3 rounded-lg border border-border bg-card text-body-sm text-foreground outline-none focus:border-primary resize-none"
                      placeholder="请填写具体详情"
                    />
                  </Field>

                  <Field label="离场日期" required>
                    <input
                      type="date"
                      value={leaveDate}
                      onChange={(e) => setLeaveDate(e.target.value)}
                      className={inputCls}
                    />
                  </Field>

                  <div className="space-y-1.5">
                    <div className="text-caption text-text-tertiary">离场类型</div>
                    <div className="grid grid-cols-2 gap-2">
                      {LEAVE_KINDS.map((k) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setLeaveKind(k)}
                          className={`h-10 rounded-lg text-body-sm ${
                            leaveKind === k
                              ? "bg-primary text-primary-foreground"
                              : "bg-card border border-border text-text-secondary"
                          }`}
                        >
                          {k}
                        </button>
                      ))}
                    </div>
                  </div>

                  {leaveKind === "淘汰" && (
                    <Field label="金额 (元)">
                      <input
                        type="number"
                        value={leavePrice}
                        onChange={(e) => setLeavePrice(e.target.value)}
                        className={inputCls}
                      />
                    </Field>
                  )}
                  <Field label="备注">
                    <textarea
                      value={leaveNote}
                      onChange={(e) => setLeaveNote(e.target.value)}
                      rows={3}
                      className="w-full p-3 rounded-lg border border-border bg-card text-body-sm text-foreground outline-none focus:border-primary resize-none"
                      placeholder="补充说明"
                    />
                  </Field>
                </div>
              )}
            </div>
          )}

          {/* 现场材料 */}
          {verdict && (
            <div className="rounded-xl bg-card border border-border p-4">
              {verdict === "abandon" ? (
                <MediaGrid
                  items={media}
                  setItems={setMedia}
                  max={9}
                  required
                  caption="现场照片 / 视频"
                  helper="离场事件需上传或拍摄现场材料，用于业务回溯追责"
                />
              ) : (
                <>
                  <div className="text-caption text-text-tertiary mb-2">现场材料</div>
                  <MediaGrid items={media} setItems={setMedia} max={9} />
                </>
              )}
            </div>
          )}

          {/* 转栏 */}
          {verdict === "cure" && (
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
          <Send className="h-4 w-4" />
          {verdict === "abandon" && abandonStep === 1
            ? abandonReason === "其他"
              ? "下一步：补充原因"
              : "下一步：登记离场信息"
            : "提交复查结论"}
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

      <ConfirmRevisitDialog
        open={revisitConfirmOpen}
        orderId={id}
        onOpenChange={setRevisitConfirmOpen}
        onConfirm={() => {
          setRevisitConfirmOpen(false);
          goRevisit();
        }}
      />
    </MobileShell>
  );
}
