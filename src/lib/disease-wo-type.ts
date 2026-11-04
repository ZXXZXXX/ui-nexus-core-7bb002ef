// 疾病「所属工单类型」规则：先定工单类型，再只允许关联该工单类型下的症状与处方。
import { KB_DISEASES, KB_SYMPTOMS, type KBDisease } from "./disease-kb";
import { PRESCRIPTION_SEED, type RxSeed } from "./prescription-kb";

export const DISEASE_WO_TYPES = ["疾病治疗", "产后护理", "修蹄", "干奶", "免疫", "驱虫"] as const;
export type DiseaseWoType = (typeof DISEASE_WO_TYPES)[number];

export const woTypeLabel = (t: string) => (t ? `${t}工单` : "—");

const RX_KIND_TO_WO: Record<RxSeed["kind"], DiseaseWoType> = {
  disease: "疾病治疗",
  postpartum: "产后护理",
  hoof: "修蹄",
  drying: "干奶",
  immune: "免疫",
  deworm: "驱虫",
};

const CAT_TO_WO: Record<string, DiseaseWoType> = {
  "DL-06": "修蹄",
  "DL-07": "驱虫",
  "DL-08": "干奶",
  "DL-09": "修蹄",
  "DL-10": "免疫",
};

/** 处方所属工单类型 */
export function rxWoType(rx: Pick<RxSeed, "kind">): DiseaseWoType {
  return RX_KIND_TO_WO[rx.kind];
}

const rxLinksDisease = (rx: RxSeed, diseaseId: string) =>
  !!rx.diseaseCode && rx.diseaseCode.split(/[、,，\s]+/).includes(diseaseId);

/** 标准疾病的所属工单类型：有关联处方时以处方为准，否则按疾病分类推断，默认疾病治疗 */
export function kbDiseaseWoType(d: Pick<KBDisease, "id" | "cat" | "rx">): DiseaseWoType {
  const rx = PRESCRIPTION_SEED.find((r) => d.rx?.includes(r.code) || rxLinksDisease(r, d.id));
  if (rx) return rxWoType(rx);
  return CAT_TO_WO[d.cat] ?? "疾病治疗";
}

const SYMPTOM_WO = (() => {
  const map = new Map<string, Set<DiseaseWoType>>();
  const add = (sy: string, t: DiseaseWoType) => {
    if (!map.has(sy)) map.set(sy, new Set());
    map.get(sy)!.add(t);
  };
  const byId = new Map(KB_DISEASES.map((d) => [d.id, kbDiseaseWoType(d)]));
  KB_DISEASES.forEach((d) => d.symptoms.forEach((s) => add(s, byId.get(d.id)!)));
  KB_SYMPTOMS.forEach((s) => s.diseases.forEach((id) => byId.has(id) && add(s.id, byId.get(id)!)));
  return map;
})();

/** 症状是否属于某工单类型（症状挂在该工单类型下的任一疾病上） */
export function symptomInWoType(code: string, t: string) {
  return !!t && !!SYMPTOM_WO.get(code)?.has(t as DiseaseWoType);
}

/** 某工单类型下可关联的症状（仅启用） */
export function symptomsForWoType(t: string) {
  return KB_SYMPTOMS.filter((s) => s.status === "启用" && symptomInWoType(s.id, t));
}

/** 处方是否属于某工单类型 */
export function rxInWoType(code: string, t: string) {
  const rx = PRESCRIPTION_SEED.find((r) => r.code === code);
  return !!t && !!rx && rxWoType(rx) === t;
}

/** 某工单类型下可关联的处方（仅启用） */
export function prescriptionsForWoType(t: string) {
  return PRESCRIPTION_SEED.filter((r) => r.enabled !== false && !!t && rxWoType(r) === t);
}

/** 切换工单类型后，剔除不属于新工单类型的症状与处方 */
export function pruneForWoType<S extends { code: string }, P extends { code: string }>(
  v: { symptoms: S[]; prescriptions: P[] },
  t: string,
) {
  const symptoms = v.symptoms.filter((s) => symptomInWoType(s.code, t));
  const prescriptions = v.prescriptions.filter((p) => rxInWoType(p.code, t));
  return {
    symptoms,
    prescriptions,
    removed: v.symptoms.length - symptoms.length + v.prescriptions.length - prescriptions.length,
  };
}
