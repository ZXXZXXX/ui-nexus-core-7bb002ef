# Project Architecture Rules

- Keep loss-allocation display rules in `src/lib/loss-allocation.ts` so the UI and rule tests share one source of truth.
- Keep inventory display rules (SKU merging, staying in the list once stocked, default ordering, default batch folding when a batch has zero stock) in `src/lib/inventory.ts` so the pages and their rule tests read one source of truth.
- Keep table sorting and column-filter behaviour inside `src/components/list-page.tsx`; pages opt a column in with `sortable` and a page-level `defaultSort` instead of sorting locally.
- On wide list tables, give data columns explicit `width` + `grow` so leftover space is shared proportionally (uniform column rhythm) instead of letting one flex-1 column absorb all slack; keep headers and cells in such tables uniformly left-aligned.
- Error/failure callouts use the semantic `.callout-danger` class defined in `src/styles.css`; never hardcode danger hex values or raw state variables in components.
- Keep message-category tag colors in `src/lib/message-category.ts` so every page that lists messages renders one shared color per category instead of picking a tag class locally.
- Keep the 用药异常 rules (whether a prescription involves variable calculation, which parameters to show, the dose text that gets validated, and the submit-readiness of each mode) in `src/lib/wo-abnormal.ts`; the two modes differ by design — 计算参数调整 changes what is validated without lifting any restriction, 部分药品未使用 lifts the restriction without changing validated values.
- Keep pull-mapping card config (event type → 工单类型/基础事件, subtype → 疾病/检测项目) in `src/components/pull-mapping.tsx` and push-mapping card config (本系统处置/事件 → 回传子类型编码) in `src/components/push-mapping.tsx`, so the event-mapping route stays a thin tab shell.
- The 拉取映射配置 and 回传映射配置 tabs render the same table shape (same seven headers, same frozen first/last columns); change one only together with the other.
