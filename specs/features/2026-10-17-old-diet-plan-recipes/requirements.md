# Requirements: Old Diet Plan Recipes (Bug #14)

| Field | Value |
|-------|-------|
| Status | In Progress |
| Branch | `bug/old-diet-plan-recipe-issues` (bug fix; branched from `m3-cms-update`) |
| Roadmap | None. Bug fix for shipped "diet plans, recipes, PDFs" (roadmap § Coaching and commerce) |
| References | GitHub issue [#14](https://github.com/MahendraParihar/eatfit247-v2-app/issues/14) |
| Apps touched | server_1 |

## Context

When staff view or download an older diet plan in the admin (Member → Diet Plan → view a cycle or day → Download), the recipes attached to the meals are missing. Nutritionists send these PDFs to members, so a missing recipe means the member doesn't know which recipe a meal refers to.

The local database (a production copy) shows the scale:

- 1,225 recipes exist. Saved plans reference 1,143 distinct recipe IDs, but the view resolved only the 193 that sort into the first 200 names. The rest silently disappeared.
- 1,637 saved meal rows have recipes and no detail text (mostly 2023–2025 plans). The PDF printed an empty Details cell for them.

**Root causes**

1. **View.** `MemberDietPlanService.getList()` (data source of the view dialog) maps recipe IDs to names with `getRecipeDropdownList()`, which returns only the first 200 recipes by name. `fetchDietDetail()` (edit form + PDF) already backfilled missing IDs; `getList()` did not.
2. **Download.** `templates/diet-plan.hbs` prints only `dietDetail` per meal. The Recipes column was removed in `b98b9788` (Feb 2026) and nothing replaced it, so recipe names never appear in the meal table, and recipe-only meals render blank. The full recipe pages at the end of the PDF were not affected.

## User Stories

- As a **nutritionist**, I want the diet plan dialog to list every recipe saved on each meal, so that I can check an old plan before re-sending it.
- As a **nutritionist**, I want the downloaded or emailed PDF to name the recipes under each meal, so that the member knows which recipe page belongs to which meal.

## Scope

**In scope**
- Recipe names resolved for every recipe ID saved on any plan, cycle or day in the diet plan list (view dialog).
- The PDF meal table lists recipe names under each meal, with or without detail text.
- The same PDF is used by **Send Mail** (`sendDietPlan` → `downloadDietPlan`), so emailed plans get the fix too.

**Out of scope**
- The recipe dropdown in the diet plan edit form (still the top-200 list plus backfill of saved IDs). Searching all recipes in the editor is a separate improvement.
- Meals that are truly empty in the data (for example `<div><br></div>` with no recipes) keep rendering an empty row, as before.
- Sequential `fetchById` calls for the recipe pages in `downloadDietPlan` (a performance tidy-up, not a correctness bug).
- The member-facing "My Plan" (roadmap 9.2) doesn't exist yet.
- Recipe descriptions printing raw HTML on the PDF recipe cards (found during validation; an older, separate issue).

## Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | `getList()` looks up **exactly the referenced recipe IDs** with `RecipeService.findDropdownByIds`, instead of the top-200 dropdown | One query, always complete, and smaller than loading 200 recipes with their includes. The list never needed the dropdown itself |
| 2 | Inactive recipes saved on a plan are still shown | The plan is a historical record of what the member was given. `findDropdownByIds` doesn't filter on `active`, matching the existing edit-form backfill |
| 3 | The PDF shows recipe names as a "Recipe(s): …" line **inside the Details cell**, not as a third column | The column was removed on purpose in `b98b9788`; this keeps the two-column layout |
| 4 | A shared private helper `collectRecipeIds()` reads IDs from the stored `diet_plan` JSON for both `getList()` and the `fetchDietDetail()` backfill | One place that skips non-numeric IDs and de-duplicates |
| 5 | A Handlebars `or` helper is added in `DietPlanPdfService` (arrays count as truthy only when non-empty) | Lets one template row cover "detail or recipes" without duplicating the markup |

## Technical Constraints

- **Data:** no schema change. Reads `txn_member_diet_details.diet_plan` (JSON array of `{recipeCategoryId, recipeCategory, dietDetail, recipeIds[]}`) and `mst_recipes`.
- **Contract:** no shared-library change. `IMemberDietDetail.dietPlan[].recipeList` keeps its `{ id, label, isActive }` shape.
- **API:** no new endpoints. Behaviour changes in admin-api `GET member/:id/diet-plan/list`, `download-cycle`, `download-day`, `send-email-cycle`, `send-email-day`.
- **RBAC:** unchanged. The endpoints keep their existing ability checks and member scoping.
- **Money / Async:** none.

## Principle Check

- **3/4 Franchise isolation:** unchanged. Recipes are global master data, and the member lookup is untouched.
- **6 Soft delete:** inactive recipes are still shown on historical plans (Decision 2). Nothing is deleted.
- **8 One contract:** no new shared shapes.
- **9 Automated proof:** Jest unit tests cover the recipe lookup in `getList()` and the meal-table rendering in the PDF template. The integration and e2e harness (roadmap Phase 5) doesn't exist yet, so the browser check stays manual.

## Open Questions

- [ ] Should the editor's recipe dropdown search all 1,225 recipes (server-side autocomplete)? Proposed as a separate improvement.
