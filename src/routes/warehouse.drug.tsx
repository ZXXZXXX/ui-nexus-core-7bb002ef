import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Pill, Plus, Search, Filter, Lock, Trash2, Download } from "lucide-react";
import { exportCsv } from "@/lib/export-csv";
import { ExportConfirmButton } from "@/components/export-confirm";

export const Route = createFileRoute("/warehouse/drug")({
  head: () => ({ meta: [{ title: "药品档案 — 奇点智牧" }] }),
  component: DrugArchivePage,
});

type DrugStatus = "启用" | "停用";
type DrugType = "处方药" | "非处方药";
type DoseRuleType = "按实际用量回传" | "按指定规则回传";

type Drug = {
  // ERP 同步基础信息（只读）
  id: string; // 药品ID
  code: string; // 商品编码
  name: string; // 药品展示名称
  generic?: string; // 通用名
  brand?: string; // 商品名/品牌名
  ingredient?: string; // 主要成分
  spec: string; // 规格型号
  scanUnit?: string; // 最小扫码单位
  supplier?: string; // 供应商
  maker: string; // 生产厂家
  reg?: string; // 批准文号
  shelfLife?: string; // 保质期

  // 兽医业务配置
  status: DrugStatus;
  drugType: DrugType;
  routes: string[]; // 默认给药方式
  withdraw: string; // 休药期
  doseUnit: string; // 默认用药单位
  freqRule?: string; // 用药频次规则
  daysRange?: string; // 用药天数范围
  variableDose: boolean; // 是否按变量计算
  variable?: string; // 默认计算变量
  defaultDose: string; // 默认具体剂量
  pcDoseMax?: string; // PC单位用药剂量上限
  remark?: string; // 备注

  // 回传规则
  reportOut: boolean; // 回传至第三方系统
  reportCode?: string; // 第三方系统药品编码（默认=商品编码）
  reportRule: DoseRuleType;
  reportDose?: string; // 指定回传剂量
};

const ROUTE_OPTIONS = ["肌肉注射", "静脉注射", "皮下注射", "乳注", "口服", "局部用药"];
const UNIT_OPTIONS = ["ml", "g", "kg", "支", "头份", "片"];
const VARIABLE_OPTIONS = ["体重区间", "非盲乳数", "自定义变量"];

const initialDrugs: Drug[] = [
  {
    id: "DR-0108",
    code: "01-00063",
    name: "5%盐酸头孢噻呋注射液（畜可健）",
    generic: "盐酸头孢噻呋注射液",
    brand: "畜可健",
    ingredient: "盐酸头孢噻呋",
    spec: "100ml/瓶",
    scanUnit: "瓶",
    supplier: "华牧供应链",
    maker: "华牧药业",
    reg: "兽药字 2023021",
    shelfLife: "2年",
    status: "启用",
    drugType: "处方药",
    routes: ["肌肉注射"],
    withdraw: "7天",
    doseUnit: "ml",
    freqRule: "",
    daysRange: "3-5天",
    variableDose: true,
    variable: "体重区间",
    defaultDose: "600-800kg → 30ml/次；400-600kg → 20ml/次",
    pcDoseMax: "30",
    remark: "",
    reportOut: true,
    reportCode: "01-00063",
    reportRule: "按实际用量回传",
    reportDose: "",
  },
  {
    id: "DR-0214",
    code: "02-00215",
    name: "口蹄疫疫苗 A 型",
    generic: "口蹄疫 A 型灭活疫苗",
    brand: "",
    ingredient: "口蹄疫 A 型抗原",
    spec: "10ml/支",
    scanUnit: "支",
    supplier: "国农生物",
    maker: "国农生物",
    reg: "兽药字 2024008",
    shelfLife: "1.5年",
    status: "启用",
    drugType: "非处方药",
    routes: ["肌肉注射"],
    withdraw: "21天",
    doseUnit: "ml",
    freqRule: "",
    daysRange: "",
    variableDose: false,
    defaultDose: "2ml/次",
    pcDoseMax: "",
    remark: "免疫计划专用",
    reportOut: true,
    reportCode: "02-00215",
    reportRule: "按实际用量回传",
  },
  {
    id: "DR-0306",
    code: "03-00108",
    name: "伊维菌素注射液",
    generic: "伊维菌素注射液",
    brand: "",
    ingredient: "伊维菌素",
    spec: "100ml/瓶",
    scanUnit: "瓶",
    supplier: "瑞畜医药",
    maker: "瑞畜医药",
    reg: "兽药字 2022115",
    shelfLife: "2年",
    status: "启用",
    drugType: "处方药",
    routes: ["皮下注射"],
    withdraw: "14天",
    doseUnit: "ml",
    freqRule: "每3天1次",
    daysRange: "",
    variableDose: true,
    variable: "体重区间",
    defaultDose: "1ml/50kg",
    pcDoseMax: "",
    remark: "",
    reportOut: true,
    reportCode: "03-00108",
    reportRule: "按实际用量回传",
  },
  {
    id: "DR-0412",
    code: "04-00072",
    name: "复合维生素",
    generic: "复合维生素",
    brand: "",
    ingredient: "维生素A/D/E 复合",
    spec: "500g/罐",
    scanUnit: "罐",
    supplier: "牧元生物",
    maker: "牧元生物",
    reg: "兽药字 2023089",
    shelfLife: "3年",
    status: "启用",
    drugType: "非处方药",
    routes: ["口服"],
    withdraw: "0天",
    doseUnit: "g",
    freqRule: "",
    daysRange: "5-7天",
    variableDose: false,
    defaultDose: "30g/次",
    pcDoseMax: "",
    remark: "",
    reportOut: false,
    reportCode: "04-00072",
    reportRule: "按实际用量回传",
  },
  {
    id: "DR-0521",
    code: "05-00033",
    name: "戊二醛消毒液",
    generic: "戊二醛溶液",
    brand: "",
    ingredient: "戊二醛 2%",
    spec: "5L/桶",
    scanUnit: "桶",
    supplier: "华牧药业",
    maker: "华牧药业",
    reg: "兽药字 2021045",
    shelfLife: "3年",
    status: "启用",
    drugType: "非处方药",
    routes: ["局部用药"],
    withdraw: "0天",
    doseUnit: "ml",
    freqRule: "",
    daysRange: "",
    variableDose: false,
    defaultDose: "按环境用量",
    pcDoseMax: "",
    remark: "环境消毒",
    reportOut: false,
    reportCode: "05-00033",
    reportRule: "按实际用量回传",
  },
];

function DrugArchivePage() {
  const [list, setList] = useState<Drug[]>(initialDrugs);
  const [detail, setDetail] = useState<Drug | null>(null);
  const [mode, setMode] = useState<"view" | "edit" | "create">("view");
  const [kw, setKw] = useState("");

  const filtered = useMemo(() => {
    const k = kw.trim().toLowerCase();
    if (!k) return list;
    return list.filter(
      (d) =>
        d.name.toLowerCase().includes(k) ||
        d.code.toLowerCase().includes(k) ||
        d.id.toLowerCase().includes(k),
    );
  }, [list, kw]);

  const save = (d: Drug) => {
    if (mode === "create") {
      setList((prev) => [{ ...d, id: d.id || `DR-${Date.now().toString().slice(-4)}` }, ...prev]);
    } else {
      setList((prev) => prev.map((x) => (x.id === d.id ? d : x)));
    }
    setDetail(null);
  };

  const columns: ListColumn<Drug>[] = [
    {
      key: "code", label: "商品编码", required: true,
      render: (d) => <span className="font-mono text-body text-foreground truncate">{d.code}</span>,
    },
    {
      key: "name", label: "药品展示名称", required: true,
      render: (d) => (
        <span className="flex items-center gap-1.5 text-body text-foreground truncate">
          <Pill className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="truncate">{d.name}</span>
        </span>
      ),
    },
    { key: "spec", label: "规格型号", render: (d) => <span className="text-body-sm text-text-secondary truncate">{d.spec}</span> },
    { key: "drugType", label: "类型", filter: "select", render: (d) => <span className="text-body-sm text-text-secondary truncate">{d.drugType}</span> },
    {
      key: "routes", label: "默认用药方式", filter: "select",
      value: (d) => d.routes.join("、"),
      render: (d) => <span className="text-body-sm text-text-secondary truncate">{d.routes.join("、") || "—"}</span>,
    },
    { key: "withdraw", label: "休药期", render: (d) => <span className="text-body-sm text-text-secondary truncate">{d.withdraw}</span> },
    {
      key: "status", label: "启用状态", filter: "select",
      render: (d) => <span className={d.status === "启用" ? "tag tag-success" : "tag tag-muted"}>{d.status}</span>,
    },
    { key: "generic", label: "通用名称", defaultHidden: true, render: (d) => <span className="text-body-sm text-text-secondary truncate">{d.generic || "—"}</span> },
    { key: "ingredient", label: "主要成分", defaultHidden: true, render: (d) => <span className="text-body-sm text-text-secondary truncate">{d.ingredient || "—"}</span> },
    { key: "scanUnit", label: "扫码单位", filter: "select", defaultHidden: true, render: (d) => <span className="text-body-sm text-text-secondary">{d.scanUnit || "—"}</span> },
    { key: "supplier", label: "供应商", filter: "select", defaultHidden: true, render: (d) => <span className="text-body-sm text-text-secondary truncate">{d.supplier || "—"}</span> },
    { key: "maker", label: "生产厂家", filter: "select", defaultHidden: true, render: (d) => <span className="text-body-sm text-text-secondary truncate">{d.maker || "—"}</span> },
    { key: "reg", label: "批准文号", defaultHidden: true, render: (d) => <span className="text-body-sm text-text-secondary truncate">{d.reg || "—"}</span> },
    { key: "shelfLife", label: "保质期", defaultHidden: true, render: (d) => <span className="text-body-sm text-text-secondary">{d.shelfLife || "—"}</span> },
    { key: "defaultDose", label: "默认剂量", defaultHidden: true, render: (d) => <span className="text-body-sm text-text-secondary truncate">{d.defaultDose || "—"}</span> },
    { key: "daysRange", label: "疗程范围", defaultHidden: true, render: (d) => <span className="text-body-sm text-text-secondary">{d.daysRange || "—"}</span> },
    { key: "remark", label: "备注", defaultHidden: true, render: (d) => <span className="text-body-sm text-text-secondary truncate">{d.remark || "—"}</span> },
  ];

  return (
    <>
      <ListPage<Drug>
        title="药品档案"
        breadcrumb={["药品管理", "药品档案"]}
        rows={list}
        columns={columns}
        searchKeys={["name", "code"]}
        searchPlaceholder="搜索药品名称 / 商品编码"
        getRowKey={(d) => d.id}
        emptyText="未找到匹配的药品"
        rowActions={(d) => (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-body-sm font-normal text-text-secondary hover:bg-surface-subtle hover:text-foreground"
              onClick={() => {
                setMode("view");
                setDetail(d);
              }}
            >
              查看
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-body-sm font-normal text-primary hover:bg-brand-subtle hover:text-primary"
              onClick={() => {
                setMode("edit");
                setDetail(d);
              }}
            >
              编辑
            </Button>
          </>
        )}
      />


      <Sheet open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <SheetContent side="right" className="w-full sm:w-1/2 sm:max-w-none overflow-y-auto bg-white">
          <SheetHeader>
            <SheetTitle className="text-section-title">
              {mode === "edit" ? "编辑药品" : mode === "create" ? "新建药品" : "药品详情"}
            </SheetTitle>
          </SheetHeader>
          {detail && (
            <DrugForm
              key={`${detail.id}-${mode}`}
              value={detail}
              mode={mode}
              onCancel={() => setDetail(null)}
              onSave={save}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function DrugForm({
  value,
  mode,
  onCancel,
  onSave,
}: {
  value: Drug;
  mode: "view" | "edit" | "create";
  onCancel: () => void;
  onSave: (d: Drug) => void;
}) {
  const readOnly = mode === "view";
  const [d, setD] = useState<Drug>(value);
  const patch = (p: Partial<Drug>) => setD((s) => ({ ...s, ...p }));

  return (
    <div className="mt-4 space-y-6">
      {/* 顶部标题条 */}
      <div className="flex items-center justify-between rounded-md border border-border bg-surface-subtle px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <Pill className="h-4 w-4 text-primary shrink-0" />
          <span className="font-mono text-body-sm text-foreground">{d.code || "—"}</span>
          <span className="text-text-tertiary">·</span>
          <span className="text-body-sm text-foreground truncate">{d.name || "新药品"}</span>
        </div>
        <span
          className={
            d.status === "启用" ? "tag tag-success" : "tag tag-muted"
          }
        >
          {d.status}
        </span>
      </div>

      {/* Section 1: ERP 基础信息（只读） */}
      <Section
        title="ERP 同步基础信息"
        hint={
          <span className="inline-flex items-center gap-1 text-caption text-text-tertiary">
            <Lock className="h-3 w-3" /> 由 ERP 同步，只读
          </span>
        }
      >
        <Grid>
          <F label="商品编码" value={d.code} readOnly onChange={(v) => patch({ code: v })} mono />
          <F label="药品ID" value={d.id || "系统生成"} readOnly mono />
          <F label="药品展示名称" value={d.name} readOnly={mode !== "create"} onChange={(v) => patch({ name: v })} span2 />
          <F label="通用名" value={d.generic ?? ""} readOnly onChange={(v) => patch({ generic: v })} />
          <F label="商品名/品牌名" value={d.brand ?? ""} readOnly onChange={(v) => patch({ brand: v })} />
          <F label="规格型号" value={d.spec} readOnly={mode !== "create"} onChange={(v) => patch({ spec: v })} />
          <F label="最小扫码单位" value={d.scanUnit ?? ""} readOnly onChange={(v) => patch({ scanUnit: v })} />
          <F label="供应商" value={d.supplier ?? ""} readOnly onChange={(v) => patch({ supplier: v })} />
          <F label="生产厂家" value={d.maker} readOnly onChange={(v) => patch({ maker: v })} />
          <F label="批准文号" value={d.reg ?? ""} readOnly onChange={(v) => patch({ reg: v })} />
          <F label="保质期" value={d.shelfLife ?? ""} readOnly onChange={(v) => patch({ shelfLife: v })} />
          <FLong label="主要成分" value={d.ingredient ?? ""} readOnly onChange={(v) => patch({ ingredient: v })} />
        </Grid>
      </Section>

      {/* Section 2: 兽医业务配置 */}
      <Section title="兽医业务配置" hint={<span className="text-caption text-text-tertiary">由本系统维护</span>}>
        <Grid>
          <FSelect
            label="药品状态"
            required
            value={d.status}
            options={["启用", "停用"]}
            readOnly={readOnly}
            onChange={(v) => patch({ status: v as DrugStatus })}
          />
          <FSelect
            label="药品类型"
            required
            value={d.drugType}
            options={["处方药", "非处方药"]}
            readOnly={readOnly}
            onChange={(v) => patch({ drugType: v as DrugType })}
          />
          <FMulti
            label="默认给药方式"
            required
            values={d.routes}
            options={ROUTE_OPTIONS}
            readOnly={readOnly}
            onChange={(vs) => patch({ routes: vs })}
            span2
          />
          <F
            label="休药期"
            required
            value={d.withdraw}
            readOnly={readOnly}
            onChange={(v) => patch({ withdraw: v })}
            placeholder="如：7天"
          />
          <FSelect
            label="默认用药单位"
            required
            value={d.doseUnit}
            options={UNIT_OPTIONS}
            readOnly={readOnly}
            onChange={(v) => patch({ doseUnit: v })}
          />
          <FrequencyEditor
            label="用药频次规则"
            value={d.freqRule ?? ""}
            readOnly={readOnly}
            onChange={(v: string) => patch({ freqRule: v })}
          />
          <F
            label="用药天数范围"
            value={d.daysRange ?? ""}
            readOnly={readOnly}
            onChange={(v) => patch({ daysRange: v })}
            placeholder="如：3-5天"
          />
          <FBool
            label="是否按变量计算"
            value={d.variableDose}
            readOnly={readOnly}
            onChange={(v) =>
              patch({ variableDose: v, variable: v ? d.variable || "体重区间" : "" })
            }
          />
          {d.variableDose ? (
            <FSelect
              label="默认计算变量"
              required
              value={d.variable ?? ""}
              options={VARIABLE_OPTIONS}
              readOnly={readOnly}
              onChange={(v) => patch({ variable: v })}
            />
          ) : (
            <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
              <F
                label="具体剂量"
                required
                value={d.defaultDose}
                readOnly={readOnly}
                onChange={(v) => patch({ defaultDose: v })}
                placeholder="如 20"
              />
              <div className="pb-2 text-body-sm text-text-tertiary">{d.doseUnit}/次</div>
            </div>
          )}
          {d.variableDose && (
            <VariableDoseEditor
              label="默认具体剂量"
              required
              value={d.defaultDose}
              unit={d.doseUnit}
              readOnly={readOnly}
              onChange={(v) => patch({ defaultDose: v })}
            />
          )}
          <F
            label="PC单位用药剂量上限"
            value={d.pcDoseMax ?? ""}
            readOnly={readOnly}
            onChange={(v) => patch({ pcDoseMax: v })}
          />
          <FLong
            label="备注"
            value={d.remark ?? ""}
            readOnly={readOnly}
            onChange={(v) => patch({ remark: v })}
          />
        </Grid>
      </Section>

      {/* Section 3: 第三方回传 */}
      <Section title="第三方系统回传规则">
        <Grid>
          <FBool
            label="回传至第三方系统"
            required
            value={d.reportOut}
            readOnly={readOnly}
            onChange={(v) => patch({ reportOut: v })}
          />
          <F
            label="第三方系统药品编码"
            value={d.reportCode ?? ""}
            readOnly={readOnly || !d.reportOut}
            onChange={(v) => patch({ reportCode: v })}
            placeholder="默认等于商品编码"
            mono
          />
          <FSelect
            label="剂量规则类型"
            required
            value={d.reportRule}
            options={["按实际用量回传", "按指定规则回传"]}
            readOnly={readOnly || !d.reportOut}
            onChange={(v) =>
              patch({ reportRule: v as DoseRuleType, reportDose: v === "按实际用量回传" ? "" : d.reportDose })
            }
          />
          {d.reportRule === "按指定规则回传" ? (
            <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
              <F
                label="指定回传剂量"
                required
                value={d.reportDose ?? ""}
                readOnly={readOnly || !d.reportOut}
                onChange={(v) => patch({ reportDose: v })}
                placeholder="数字，如 5"
              />
              <div className="pb-2 text-body-sm text-text-tertiary">
                单位：{d.doseUnit}
              </div>
            </div>
          ) : (
            <div />
          )}
        </Grid>
      </Section>

      {!readOnly && (
        <SheetFooter className="gap-2 sticky bottom-0 bg-card pt-3 pb-1">
          <Button variant="outline" onClick={onCancel}>
            取消
          </Button>
          <Button
            className="bg-primary hover:bg-[var(--brand-hover)] text-primary-foreground"
            onClick={() => onSave(d)}
          >
            保存
          </Button>
        </SheetFooter>
      )}
    </div>
  );
}

/* ---------- 表单原子 ---------- */

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-card-title text-foreground">{title}</h3>
        {hint}
      </div>
      <div className="rounded-md border border-border p-4">{children}</div>
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-4 gap-y-3">{children}</div>;
}

function Lbl({ label, required }: { label: string; required?: boolean }) {
  return (
    <Label className="text-caption text-text-tertiary">
      {label}
      {required && <span className="text-[var(--state-danger)] ml-0.5">*</span>}
    </Label>
  );
}

function F({
  label,
  value,
  onChange,
  readOnly,
  required,
  placeholder,
  span2,
  mono,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
  required?: boolean;
  placeholder?: string;
  span2?: boolean;
  mono?: boolean;
}) {
  return (
    <div className={span2 ? "col-span-2" : ""}>
      <Lbl label={label} required={required} />
      {readOnly ? (
        <div
          className={`mt-1 h-9 flex items-center px-2 rounded-md bg-surface-subtle text-body-sm text-foreground ${
            mono ? "font-mono" : ""
          }`}
        >
          {value || <span className="text-text-tertiary">—</span>}
        </div>
      ) : (
        <Input
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className={`h-9 mt-1 text-body-sm ${mono ? "font-mono" : ""}`}
        />
      )}
    </div>
  );
}

function FLong({
  label,
  value,
  onChange,
  readOnly,
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="col-span-2">
      <Lbl label={label} required={required} />
      {readOnly ? (
        <div className="mt-1 min-h-9 px-2 py-2 rounded-md bg-surface-subtle text-body-sm text-foreground whitespace-pre-wrap">
          {value || <span className="text-text-tertiary">—</span>}
        </div>
      ) : (
        <Textarea
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className="mt-1 text-body-sm min-h-[64px]"
        />
      )}
    </div>
  );
}

function FSelect({
  label,
  value,
  options,
  onChange,
  readOnly,
  required,
}: {
  label: string;
  value: string;
  options: string[];
  onChange?: (v: string) => void;
  readOnly?: boolean;
  required?: boolean;
}) {
  return (
    <div>
      <Lbl label={label} required={required} />
      {readOnly ? (
        <div className="mt-1 h-9 flex items-center px-2 rounded-md bg-surface-subtle text-body-sm text-foreground">
          {value || <span className="text-text-tertiary">—</span>}
        </div>
      ) : (
        <Select value={value} onValueChange={(v) => onChange?.(v)}>
          <SelectTrigger className="h-9 mt-1 text-body-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((o) => (
              <SelectItem key={o} value={o} className="text-body-sm">
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

function FMulti({
  label,
  values,
  options,
  onChange,
  readOnly,
  required,
  span2,
}: {
  label: string;
  values: string[];
  options: string[];
  onChange?: (v: string[]) => void;
  readOnly?: boolean;
  required?: boolean;
  span2?: boolean;
}) {
  const toggle = (o: string) => {
    if (readOnly) return;
    onChange?.(values.includes(o) ? values.filter((v) => v !== o) : [...values, o]);
  };
  return (
    <div className={span2 ? "col-span-2" : ""}>
      <Lbl label={label} required={required} />
      <div className="mt-1 flex flex-wrap gap-1.5">
        {options.map((o) => {
          const on = values.includes(o);
          return (
            <button
              key={o}
              type="button"
              disabled={readOnly}
              onClick={() => toggle(o)}
              className={`h-7 px-2.5 rounded-full text-body-sm border transition-colors ${
                on
                  ? "bg-brand-subtle text-primary border-primary/40"
                  : "bg-surface-subtle text-text-secondary border-border"
              } ${readOnly ? "cursor-default" : "hover:border-primary/60"}`}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function VariableDoseEditor({
  label,
  value,
  unit,
  readOnly,
  required,
  onChange,
}: {
  label: string;
  value: string;
  unit: string;
  readOnly?: boolean;
  required?: boolean;
  onChange?: (v: string) => void;
}) {
  const [rows, setRows] = useState(() => parseVariableDose(value, unit));

  useEffect(() => {
    setRows(parseVariableDose(value, unit));
  }, [value, unit]);

  const updateRows = (next: Array<{ range: string; dose: string }>) => {
    setRows(next);
    const serialized = serializeVariableDose(next, unit);
    if (serialized !== value) onChange?.(serialized);
  };

  const addRow = () => updateRows([...rows, { range: "", dose: "" }]);
  const removeRow = (idx: number) => updateRows(rows.filter((_, i) => i !== idx));
  const patchRow = (idx: number, patch: Partial<{ range: string; dose: string }>) => {
    updateRows(rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  return (
    <div className="col-span-2">
      <Lbl label={label} required={required} />
      {readOnly ? (
        <div className="mt-1 min-h-9 px-2 py-2 rounded-md bg-surface-subtle text-body-sm text-foreground whitespace-pre-wrap">
          {value || <span className="text-text-tertiary">—</span>}
        </div>
      ) : (
        <div className="mt-1 space-y-2">
          {rows.map((row, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
              <Input
                value={row.range}
                onChange={(e) => patchRow(i, { range: e.target.value })}
                placeholder="变量区间，如 600-800kg"
                className="h-9 text-body-sm"
              />
              <div className="flex items-center gap-2">
                <Input
                  value={row.dose}
                  onChange={(e) => patchRow(i, { dose: e.target.value })}
                  placeholder="剂量"
                  className="h-9 text-body-sm"
                />
                <span className="text-body-sm text-text-secondary whitespace-nowrap">
                  {unit}/次
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-text-secondary hover:text-state-danger"
                onClick={() => removeRow(i)}
                disabled={rows.length <= 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1 text-body-sm font-normal"
            onClick={addRow}
          >
            <Plus className="h-3.5 w-3.5" /> 添加一组
          </Button>
        </div>
      )}
    </div>
  );
}

function parseVariableDose(value: string, unit: string): Array<{ range: string; dose: string }> {
  const s = value.trim();
  if (!s) return [{ range: "", dose: "" }];
  return s.split(/[;；]/).map((part) => {
    const m = part.match(/(.+?)\s*(?:→|->)\s*(\d+(?:\.\d+)?)(.*)/);
    if (m) {
      return { range: m[1].trim(), dose: m[2] };
    }
    const unitMatch = part.match(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*${unit}`));
    return { range: part.trim(), dose: unitMatch ? unitMatch[1] : "" };
  });
}

function serializeVariableDose(rows: Array<{ range: string; dose: string }>, unit: string): string {
  return rows
    .filter((r) => r.range.trim() || r.dose.trim())
    .map((r) => `${r.range.trim()} → ${r.dose.trim()}${unit}/次`)
    .join("；");
}

function FrequencyEditor({
  label,
  value,
  readOnly,
  required,
  onChange,
}: {
  label: string;
  value: string;
  readOnly?: boolean;
  required?: boolean;
  onChange?: (v: string) => void;
}) {
  const [days, setDays] = useState("");
  const [times, setTimes] = useState("");

  useEffect(() => {
    const parsed = parseFrequency(value);
    setDays(parsed.days);
    setTimes(parsed.times);
  }, [value]);

  const update = (nextDays: string, nextTimes: string) => {
    setDays(nextDays);
    setTimes(nextTimes);
    const serialized = serializeFrequency(nextDays, nextTimes);
    if (serialized !== value) onChange?.(serialized);
  };

  return (
    <div>
      <Lbl label={label} required={required} />
      {readOnly ? (
        <div className="mt-1 h-9 flex items-center px-2 rounded-md bg-surface-subtle text-body-sm text-foreground">
          {value || <span className="text-text-tertiary">—</span>}
        </div>
      ) : (
        <div className="mt-1 h-9 flex items-center gap-2">
          <span className="text-body-sm text-text-secondary">每</span>
          <Input
            type="text"
            inputMode="numeric"
            value={days}
            onChange={(e) => update(sanitizeFreqValue(e.target.value), times)}
            className="h-9 w-20 text-body-sm text-center"
          />
          <span className="text-body-sm text-text-secondary">天</span>
          <Input
            type="text"
            inputMode="numeric"
            value={times}
            onChange={(e) => update(days, sanitizeFreqValue(e.target.value))}
            className="h-9 w-20 text-body-sm text-center"
          />
          <span className="text-body-sm text-text-secondary">次</span>
        </div>
      )}
    </div>
  );
}

function parseFrequency(value: string): { days: string; times: string } {
  const m = value.match(/每?(\d+)天(\d+)次/);
  if (m) {
    return { days: sanitizeFreqValue(m[1]), times: sanitizeFreqValue(m[2]) };
  }
  return { days: "", times: "" };
}

function serializeFrequency(days: string, times: string): string {
  if (!days.trim() && !times.trim()) return "";
  return `每${days.trim()}天${times.trim()}次`;
}

function sanitizeFreqValue(v: string): string {
  const digits = v.replace(/\D/g, "");
  if (!digits) return "";
  const n = parseInt(digits, 10);
  if (n <= 0) return "";
  return String(n);
}

function FBool({
  label,
  value,
  onChange,
  readOnly,
  required,
}: {
  label: string;
  value: boolean;
  onChange?: (v: boolean) => void;
  readOnly?: boolean;
  required?: boolean;
}) {
  return (
    <div>
      <Lbl label={label} required={required} />
      <div className="mt-1 h-9 flex items-center gap-2">
        <Switch checked={value} onCheckedChange={(v) => onChange?.(v)} disabled={readOnly} />
        <span className="text-body-sm text-text-secondary">{value ? "是" : "否"}</span>
      </div>
    </div>
  );
}
