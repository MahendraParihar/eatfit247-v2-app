# Plan: Old Diet Plan Recipes (Bug #14)

> Source: [requirements.md](./requirements.md) · Done when: [validation.md](./validation.md) passes
>
> No payments, tax, RBAC or migration work, so the groups can ship together in one `fix:` commit.

## Group 1: Backend recipe lookup (`server_1`)

- [x] 1.1 `MemberDietPlanService.collectRecipeIds(dietPlans)`: unique numeric recipe IDs from stored `diet_plan` arrays (Decision 4)
- [x] 1.2 `getList()`: drop `getRecipeDropdownList()`; after loading the detail rows, resolve labels with `recipeService.findDropdownByIds(collectRecipeIds(...))` (Decision 1)
- [x] 1.3 `fetchDietDetail()`: reuse `collectRecipeIds()` for the existing backfill (no behaviour change)

## Group 2: PDF meal table (`server_1`)

- [x] 2.1 `DietPlanPdfService`: register an `or` Handlebars helper (Decision 5)
- [x] 2.2 `templates/diet-plan.hbs`: one row per meal that has detail **or** recipes; the Details cell shows the detail, then "Recipe(s): name, name" (Decision 3). `.meal-recipes` spacing, no top margin when it's the only content

## Group 3: Automated tests (`server_1`)

- [x] 3.1 `member-diet-plan.service.spec.ts`: `getList()` resolves recipes outside the old top-200 list, de-duplicates IDs, skips non-numeric IDs, keeps per-meal order, and doesn't call `findAll` on recipes
- [x] 3.2 `diet-plan-pdf.service.spec.ts`: rendering `diet-plan.hbs` lists recipe names for a recipe-only meal and for a meal with detail + recipes, and skips a meal with neither
- [x] 3.3 Test config, needed for 3.1/3.2 to load: `libs/platform/jest.config.ts` gains the `moduleNameMapper` + `setupFiles` the member config has; `libs/modules/member/tsconfig.spec.json` sets `esModuleInterop` (matching `server_1/tsconfig.json`)

## Group 4: Close-out

- [x] 4.1 All checks in `validation.md` pass (browser run on the test member), except the owner's diff review
- [ ] 4.2 `requirements.md` status → Shipped; GitHub issue #14 referenced in the `fix:` commit / PR
- [ ] 4.3 Replan note: the editor dropdown limit (Open Question) is logged as a follow-up if the owner wants it
