# Project Architecture Rules

- Keep loss-allocation display rules in `src/lib/loss-allocation.ts` so the UI and rule tests share one source of truth.
- Keep inventory-list display rules (SKU merging, staying in the list once stocked, default ordering) in `src/lib/inventory.ts` so the page and its rule tests read one source of truth.
- Keep table sorting and column-filter behaviour inside `src/components/list-page.tsx`; pages opt a column in with `sortable` and a page-level `defaultSort` instead of sorting locally.
