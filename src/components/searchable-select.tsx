import { useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

// 可搜索的下拉选择：输入关键字过滤选项，用于选项较多的场景（如疾病名称）。
export function SearchableSelect({
  value,
  options,
  placeholder,
  searchPlaceholder,
  emptyText = "没有匹配的选项",
  className,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  placeholder: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-9 w-full items-center justify-between gap-1 rounded-md border border-border bg-card px-3 py-2 text-body-sm",
            "hover:bg-surface-subtle focus:outline-none focus:ring-1 focus:ring-ring",
            className,
          )}
        >
          <span className={cn("truncate", !selected && "text-text-tertiary")}>{selected ? selected.label : placeholder}</span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-text-tertiary" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[240px] p-0" align="start">
        <Command>
          <div className="border-b border-border [&_svg]:hidden">
            <CommandInput className="h-9 border-0 focus-visible:ring-0" placeholder={searchPlaceholder ?? placeholder} />
          </div>
          <CommandList>
            <CommandEmpty className="py-6 text-center text-body-sm text-text-tertiary">{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((o) => (
                <CommandItem
                  key={o.value}
                  value={o.value}
                  keywords={[o.label]}
                  onSelect={() => { onChange(o.value); setOpen(false); }}
                >
                  <Check className={cn("h-4 w-4", value === o.value ? "opacity-100" : "opacity-0")} />
                  {o.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
