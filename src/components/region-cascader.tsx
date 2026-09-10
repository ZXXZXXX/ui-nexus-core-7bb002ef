import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { REGIONS, citiesOf, districtsOf } from "@/data/regions";

export type RegionValue = { province: string; city: string; district: string };

/** 省 / 市 / 区 三级联动合并选择器 */
export function RegionCascader({
  value,
  onChange,
  className,
  placeholder = "请选择省 / 市 / 区",
}: {
  value: RegionValue;
  onChange: (v: RegionValue) => void;
  className?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);

  const label = [value.province, value.city, value.district].filter(Boolean).join(" / ");
  const cities = citiesOf(value.province);
  const districts = districtsOf(value.province, value.city);

  const Column = ({
    items,
    active,
    onPick,
    empty,
  }: { items: string[]; active: string; onPick: (v: string) => void; empty: string }) => (
    <div className="max-h-64 w-1/3 overflow-y-auto border-r border-border last:border-r-0">
      {items.length === 0 ? (
        <div className="px-3 py-2 text-caption text-text-tertiary">{empty}</div>
      ) : (
        items.map((it) => (
          <button
            key={it}
            type="button"
            onClick={() => onPick(it)}
            className={cn(
              "block w-full truncate px-3 py-1.5 text-left text-body-sm hover:bg-surface-subtle",
              active === it ? "bg-brand-subtle text-primary" : "text-foreground",
            )}
          >
            {it}
          </button>
        ))
      )}
    </div>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-border bg-card px-3 text-body-sm",
            label ? "text-foreground" : "text-text-tertiary",
            className,
          )}
        >
          <span className="truncate">{label || placeholder}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-text-tertiary" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[420px] p-0">
        <div className="flex">
          <Column
            items={REGIONS.map((p) => p.name)}
            active={value.province}
            empty="暂无数据"
            onPick={(p) => onChange({ province: p, city: "", district: "" })}
          />
          <Column
            items={cities.map((c) => c.name)}
            active={value.city}
            empty="请先选择省份"
            onPick={(c) => onChange({ ...value, city: c, district: "" })}
          />
          <Column
            items={districts}
            active={value.district}
            empty="请先选择城市"
            onPick={(d) => {
              onChange({ ...value, district: d });
              setOpen(false);
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
