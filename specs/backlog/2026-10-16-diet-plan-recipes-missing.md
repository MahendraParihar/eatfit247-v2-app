# Bug: past diet plans show no recipes (view dialog and PDF)

> **Date:** 2026-10-16
> **Type:** bug
> **Area:** admin, member → Diet Plan tab (`server_1` member module, `eatfit247-admin` members lib)
> **Severity:** High. Most recipes a coach attached are missing from what the admin sees and from what is sent to the member.

## Symptom

When an admin opens a member's past diet plan (Diet Plan tab → view a cycle/day), the dialog shows the recipe categories and their detail text, but the **Recipes** column is empty or incomplete. The downloaded PDF has the same problem.

## Root cause

### 1. View dialog: recipe names come from a 200-row lookup

`MemberDietPlanService.getList()` (`server_1/libs/modules/member/src/services/member-diet-plan.service.ts:384-425`) builds each category's `recipeList` with `convertDietDetail(categoryList, recipeList, s)`. `recipeList` comes from `getRecipeDropdownList()` (`:635-642`), which calls `recipeService.findAll({ page: 0, limit: 200 })`. That returns only the **first 200 recipes by name**.

`convertDietDetail()` (`:606-633`) drops any saved `recipeId` that is not in that list (`if (tR) dietRecipeList.push(tR)`). `recipeIds` is still returned, but the dialog renders `item.recipeList` (`member-diet-plan-details-dialog.component.html`), so the recipe is not shown.

`fetchDietDetail()` (`:736-753`) already backfills missing IDs with `recipeService.findDropdownByIds()`. `getList()` does not.

Local DB evidence (2026-10-16): 1,175 recipes. Of 141,420 recipe references in `txn_member_diet_details.diet_plan`, **118,542 (~84%) point to recipes outside the first 200 by name**, across every year from 2017 to 2026. Only 13 references (2023) point to recipes that no longer exist. Stored IDs are JSON numbers, so this is not a type mismatch. New plans are affected too, unless every recipe they use happens to sort into the first 200 names. The bug is most visible on past plans because those are what admins open to review.

### 2. PDF: the category table never lists recipes

`templates/diet-plan.hbs:345-368` renders only `recipeCategory` and `dietDetail` per category. A category that has recipes but no detail text gets an empty cell (`{{else if this.recipeList}} … <td></td>`). Recipe names are never printed against their meal or category.

Full recipe cards are appended after the table (`:371+`, built in `downloadDietPlan()` `:1184-1205` via `recipeService.fetchById`). That path uses the backfilled IDs, so the cards should be complete, but they are not tied to a meal. **Not reproduced end to end yet:** confirm with a real past plan whether the cards appear. If they do not, check `fetchById` / `processRecipeImages` for errors that are swallowed (`logger.warn`).

### Minor, found while tracing

- `fetchDietDetail()` with no `dayNo` does not filter `dayNo IS NULL`, so `findOne` can pick a day row for a cycle download. Only 2 plan cycles in the local DB mix cycle and day rows.
- `MembersApiService.getDietHistory()` calls `GET member/:id/diet-plan/history`, which has no backend route. It is dead code.

## Suggested fix

1. Backend `getList()`: collect every `recipeId` from `dpDetails`, load labels with `recipeService.findDropdownByIds(ids)` (one query), and pass that map to `convertDietDetail()`. Better still, use the same lookup in `getList()`, `fetchDietDetail()` and `downloadDietPlan()` and stop relying on the 200-row dropdown for display. Also compare IDs with `Number(...)` in `convertDietDetail()`.
2. Template: print recipe names per category, e.g. under `dietDetail` or in a "Recipes" column (`{{#each this.recipeList}}{{this.label}}{{/each}}`), so a recipe-only category is no longer blank.
3. `downloadDietPlan()`: fetch the full recipes in one `IN` query instead of calling `fetchById` once per recipe.
4. Optional: add `dayNo: null` to the cycle `where` in `fetchDietDetail()`, and remove `getDietHistory()`.

## Validation

- [ ] Open a past plan whose recipes sort after the first 200 names (most plans qualify): every saved recipe appears in the dialog.
- [ ] Download the cycle PDF and the day PDF for the same plan: every category shows its recipe names, and the recipe cards match.
- [ ] "Send Mail" PDF (`sendDietPlan`) matches the download.
- [ ] Edit screen (`fetchDietDetail`) is unchanged.
- [ ] Inactive recipes saved on old plans still show (labels come from `findDropdownByIds`, with no `active` filter).
