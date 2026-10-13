# Project Architecture Rules

- Keep loss-allocation display rules in `src/lib/loss-allocation.ts` so the UI and rule tests share one source of truth.
- Keep inventory display rules (SKU merging, staying in the list once stocked, default ordering, default batch folding when a batch has zero stock) in `src/lib/inventory.ts` so the pages and their rule tests read one source of truth.
- Keep table sorting and column-filter behaviour inside `src/components/list-page.tsx`; pages opt a column in with `sortable` and a page-level `defaultSort` instead of sorting locally.
- On wide list tables, give data columns explicit `width` + `grow` so leftover space is shared proportionally (uniform column rhythm) instead of letting one flex-1 column absorb all slack; keep headers and cells in such tables uniformly left-aligned.
- Error/failure callouts use the semantic `.callout-danger` class defined in `src/styles.css`; never hardcode danger hex values or raw state variables in components.
