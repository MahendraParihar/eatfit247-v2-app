# Validation: Old Diet Plan Recipes (Bug #14)

## Acceptance Scorecard

Result key: ✅ verified · ◐ partly verified (the note says what is missing) · ☐ not verified yet.

Test member: a member in the local database (a production copy) with one 3-cycle plan, picked by the owner. 24 of its 29 saved recipe references fall outside the old top-200 list, and every meal with recipes also has detail text.

Verification on 2026-10-17 used the local admin (:4200, logged in as Super Admin) against the local admin-api dev server, which recompiled with this change at 12:56. The plan was not modified (its last update is still 2026-10-16 08:46). To stop the browser saving a file, the Download test stubbed the page's anchor click for `data:application/pdf` links. The UI → API call ran for real, and the PDF the server wrote to `media-files/downloads/<memberId>/diet-plans/` was read and then deleted.

| # | Criterion (Given / When / Then) | How verified | Result |
|---|---------------------------------|--------------|--------|
| A1 | Given a plan whose meals reference recipes outside the first 200 by name, when staff open a cycle in the diet plan dialog, then every saved recipe is listed under its meal | Browser (test member, cycles 1–3) + Jest | ✅ Dialog lists all 29: cycle 1 Break fast 3, Dinner 3; cycle 2 Break fast 3, Lunch 4, Dinner 2; cycle 3 Break fast 5, Lunch 4, Dinner 5. Before the fix, the same data resolved 2 of 7 on another member's 2026 plan and 0 of 2 on a 2017 plan. Jest: `getList` resolves IDs outside the dropdown and never calls `recipeService.findAll` |
| A2 | Given a meal with detail text and recipes, when the cycle PDF is downloaded, then the Details cell shows the text followed by "Recipes: …" with every recipe name | Browser download (test member) + Jest | ✅ Cycle 1 PDF (675,486 bytes): Break fast "Recipes: Porridge style kanji, Vegetable Poha, Seviyaan Upma"; Dinner "Recipes: Ash gourd Soup ( L ), Dalia Khichdi ( OP I ), Rava Pongal ( OP I )". Jest: "lists recipe names after the detail text" |
| A3 | Given a meal with recipes but no detail text, when the PDF is generated, then the row shows "Recipe(s): …" instead of an empty cell | Jest + local PDF of a 2024 plan | ✅ Jest: "lists recipe names under a meal that has only recipes". Local PDF of a June-2024 cycle: Mid Morning was blank and now reads "Recipe: Mint and Spinach Soup ( L )" |
| A4 | Given a meal with neither detail nor recipes, then the PDF has no row for it (unchanged behaviour) | Jest | ✅ Jest: "skips a meal with neither detail nor recipes". Note: a meal whose detail is only empty markup (e.g. `<div><br></div>`) still renders an empty row, as before (out of scope) |
| A5 | The full recipe pages at the end of the PDF are unchanged (one page per unique recipe) | Browser download (test member) | ✅ 6-page PDF: the meal table, then 6 recipe cards (Porridge style kanji, Vegetable Poha, Seviyaan Upma, Ash gourd Soup, Dalia Khichdi, Rava Pongal) with images |
| A6 | Given an inactive recipe saved on a plan, then it is still listed in the dialog and the PDF | Jest (`findDropdownByIds` has no `active` filter) | ✅ Jest: inactive "Khatte Moong" (`isActive: false`) still listed on Lunch |
| A7 | The diet plan edit form still loads with saved recipes preselected (the `fetchDietDetail` refactor doesn't change behaviour) | Browser: edit a cycle of the test member, then cancel without saving | ✅ Cycle 3 edit screen: Break fast, Lunch and Dinner selects preselect the same 5/4/5 recipes as the dialog. Left without saving |

## Automated Checks

- [x] `cd server_1 && npx jest -c libs/modules/member/jest.config.ts member-diet-plan`: 2/2 (new spec)
- [x] `cd server_1 && npx jest -c libs/platform/jest.config.ts diet-plan-pdf`: 4/4 (new spec). The platform Jest config had no `moduleNameMapper` / `setupFiles`, so nothing importing `@server_1/core` could load. It now mirrors the member config. `google.service.spec.ts` still fails as before: it `jest.mock`s the shared library, so `InputLengthEnum` is undefined (an existing failure)
- [x] `cd server_1 && npx jest -c libs/modules/member/jest.config.ts`: 23/23. The member spec tsconfig now sets `esModuleInterop` (as `server_1/tsconfig.json` does), so `import moment from 'moment'` works under Jest
- [◐] Build: the admin-api dev server (webpack watch) recompiled with the change and served it for the browser run. A separate `nx build admin-api` was not run, because it writes to the same `dist/` the running dev server uses
- [x] Type-check (`tsc --noEmit` on the member and platform lib + spec configs): no new errors. The only errors in the touched files are the 4 existing TS4111 ones in `updateStatus`

## Manual Checks

- [x] API: covered by the UI run (the dialog renders the `list` response; Download calls `download-cycle`)
- [x] UI: dialog for cycles 1–3 of the test member + Download, PDF opened and read
- [x] RBAC: unchanged endpoints and guards, so no new RBAC check is needed

## Found During Validation (not this bug)

- Recipe cards in the PDF print the recipe description's HTML literally (`<p>Healthy</p>`, `<br/>`), because `recipe.hbs`/`diet-plan.hbs` use `{{this.details}}` (escaped). This is an existing issue, to be logged separately if wanted.

## Review

- [ ] Diff reviewed against `requirements.md` (owner)
- [x] Specs and code in sync
