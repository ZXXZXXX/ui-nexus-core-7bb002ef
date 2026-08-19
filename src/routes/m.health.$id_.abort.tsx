import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Camera, X } from "lucide-react";
import { MobileShell } from "@/components/mobile-shell";
import { TransferBarnControl } from "@/components/m/transfer-barn-control";
import { ConfirmTransferDialog } from "@/components/m/confirm-transfer-dialog";
import { ConfirmAbortDialog } from "@/components/m/confirm-abort-dialog";
import { getOrderEarTagLabel } from "@/lib/work-order-cattle";

export const Route = createFileRoute("/m/health/$id_/abort")({
  head: () => ({ meta: [{ title: "异常终止 · 奇点智牧" }] }),
  validateSearch: (s: Record<string, unknown>): { disease?: number } => ({
    disease: s.disease ? 1 : undefined,
  }),
  component: AbortPage,
});

const BASE_REASONS = ["牛只健康，无需治疗", "已转交其他工单", "其他"];
const DISEASE_EXTRA = ["牛只已死亡", "牛只已淘汰"];

function AbortPage() {
  const { id } = useParams({ from: "/m/health/$id_/abort" });
  const search = Route.useSearch();
  const navigate = useNavigate();
  const isDisease = Boolean(search.disease);

  const [reason, setReason] = useState("");
  const [other, setOther] = useState("");
  const [needTransfer, setNeedTransfer] = useState(false);
  const [transferTo, setTransferTo] = useState("");
  const [confirmTransferOpen, setConfirmTransferOpen] = useState(false);
  const [confirmAbortOpen, setConfirmAbortOpen] = useState(false);

  const [photoFront, setPhotoFront] = useState<number | null>(null);
  const [photoLeft, setPhotoLeft] = useState<number | null>(null);
  const [photoRight, setPhotoRight] = useState<number | null>(null);

  const needPhotos =
    isDisease && (reason === "牛只已死亡" || reason === "牛只已淘汰");

  const reasons = isDisease
    ? [BASE_REASONS[0], ...DISEASE_EXTRA, BASE_REASONS[1], BASE_REASONS[2]]
    : BASE_REASONS;

  const canSubmit =
    !!reason &&
    (reason !== "其他" || other.trim().length > 0) &&
    (!needTransfer || transferTo.trim().length > 0) &&
    (!needPhotos ||
      (photoFront !== null && photoLeft !== null && photoRight !== null));

  const submit = () => {
    setConfirmAbortOpen(true);
  };

  const handleAbortConfirm = () => {
    setConfirmAbortOpen(false);
    if (needTransfer) {
      setConfirmTransferOpen(true);
      return;
    }
    toast.success("工单已终止");
    navigate({ to: "/m/health/$id", params: { id } });
  };

  return (
    <MobileShell title="异常终止" back={{ to: `/m/health/${id}` }} hideTabBar>
      <div className="pb-28">
        <div className="p-4 space-y-4">
          <section className="bg-card rounded-2xl border border-border p-4">
            <div className="text-body-sm text-foreground mb-3">
              终止原因<span className="text-[var(--state-danger)] ml-0.5">*</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {reasons.map((r) => {
                const active = reason === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReason(r)}
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
            {reason === "其他" && (
              <textarea
                value={other}
                onChange={(e) => setOther(e.target.value.slice(0, 200))}
                placeholder="请输入其他终止原因"
                className="mt-3 h-20 w-full rounded-lg bg-white border border-border p-3 text-body-sm placeholder:text-text-tertiary focus:outline-none focus:border-primary resize-none"
              />
            )}
          </section>

          {needPhotos && (
            <section className="bg-card rounded-2xl border border-border p-4">
              <div className="text-body-sm text-foreground mb-1">
                牛只照片<span className="text-[var(--state-danger)] ml-0.5">*</span>
              </div>
              <div className="text-caption text-text-tertiary mb-3">
                请分别上传正面、左视角、右视角照片
              </div>
              <div className="grid grid-cols-3 gap-2">
                <PhotoSlot label="正面" value={photoFront} onChange={setPhotoFront} />
                <PhotoSlot label="左视角" value={photoLeft} onChange={setPhotoLeft} />
                <PhotoSlot label="右视角" value={photoRight} onChange={setPhotoRight} />
              </div>
            </section>
          )}

          <section className="bg-card rounded-2xl border border-border p-4">
            <TransferBarnControl
              enabled={needTransfer}
              onEnabledChange={setNeedTransfer}
              value={transferTo}
              onValueChange={setTransferTo}
              bordered={false}
            />
          </section>
        </div>
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] z-40 bg-card border-t border-border p-4 pb-[calc(env(safe-area-inset-bottom)+16px)] flex gap-2">
        <button
          type="button"
          onClick={() => navigate({ to: "/m/health/$id", params: { id } })}
          className="flex-1 h-11 rounded-lg border border-border text-body text-text-secondary"
        >
          取消
        </button>
        <button
          type="button"
          disabled={!canSubmit}
          onClick={submit}
          className="flex-1 h-11 rounded-lg bg-[var(--state-danger)] text-white text-body disabled:opacity-50"
        >
          确认终止
        </button>
      </div>

      <ConfirmAbortDialog
        open={confirmAbortOpen}
        orderId={id}
        reason={reason === "其他" ? other : reason}
        onCancel={() => setConfirmAbortOpen(false)}
        onConfirm={handleAbortConfirm}
      />

      <ConfirmTransferDialog
        open={confirmTransferOpen}
        earTag={getOrderEarTagLabel(id)}
        barn={transferTo}
        onCancel={() => setConfirmTransferOpen(false)}
        onConfirm={() => {
          setConfirmTransferOpen(false);
          toast.success(`工单已终止，已安排转栏至 ${transferTo}`);
          navigate({ to: "/m/health/$id", params: { id } });
        }}
      />
    </MobileShell>
  );
}

function PhotoSlot({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      {value === null ? (
        <label className="aspect-square w-full rounded-lg bg-surface-subtle flex flex-col items-center justify-center gap-1 text-text-tertiary cursor-pointer active:bg-border transition-colors">
          <Camera className="h-5 w-5" />
          <span className="text-caption">添加</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onChange(Date.now() + Math.random());
              e.target.value = "";
            }}
          />
        </label>
      ) : (
        <div className="relative aspect-square w-full rounded-lg bg-gradient-to-br from-surface-subtle to-border border border-border">
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-foreground/85 text-background inline-flex items-center justify-center shadow"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
      <span className="text-caption text-text-secondary">{label}</span>
    </div>
  );
}
