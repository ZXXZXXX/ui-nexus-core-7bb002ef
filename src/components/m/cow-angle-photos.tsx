import React from "react";
import { Camera, X } from "lucide-react";

export type AnglePhotos = { front: number | null; left: number | null; right: number | null };

export const emptyAnglePhotos: AnglePhotos = { front: null, left: null, right: null };

export const anglePhotosDone = (v: AnglePhotos) =>
  v.front !== null && v.left !== null && v.right !== null;

const SLOTS: { key: keyof AnglePhotos; label: string }[] = [
  { key: "front", label: "正面" },
  { key: "left", label: "左视角" },
  { key: "right", label: "右视角" },
];

/**
 * 牛只三视角照片录入：正面 / 左视角 / 右视角，各一张，均为必填。
 */
export function CowAnglePhotos({
  value,
  onChange,
  title = "牛只照片",
  hint = "请分别上传正面、左视角、右视角照片",
  required = true,
}: {
  value: AnglePhotos;
  onChange: (v: AnglePhotos) => void;
  title?: string;
  hint?: string;
  required?: boolean;
}) {
  return (
    <div>
      <div className="text-body-sm text-foreground">
        {title}
        {required && <span className="text-[var(--state-danger)] ml-0.5">*</span>}
      </div>
      <div className="text-caption text-text-tertiary mt-1">{hint}</div>
      <div className="grid grid-cols-3 gap-3 mt-3">
        {SLOTS.map((s) => {
          const filled = value[s.key] !== null;
          return (
            <div key={s.key} className="space-y-1.5">
              {filled ? (
                <div className="relative aspect-square rounded-xl bg-gradient-to-br from-surface-subtle to-border border border-border">
                  <button
                    type="button"
                    onClick={() => onChange({ ...value, [s.key]: null })}
                    className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-foreground/85 text-background inline-flex items-center justify-center shadow"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <label className="aspect-square rounded-xl bg-surface-subtle flex flex-col items-center justify-center gap-1 text-text-tertiary cursor-pointer active:bg-border transition-colors">
                  <Camera className="h-5 w-5" />
                  <span className="text-caption">添加</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (!e.target.files?.length) return;
                      onChange({ ...value, [s.key]: Date.now() + Math.random() });
                      e.target.value = "";
                    }}
                  />
                </label>
              )}
              <div className="text-center text-caption text-text-secondary">{s.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
