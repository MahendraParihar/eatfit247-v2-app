---
name: feature-spec
description: Start a new spec-driven feature for EatFit247. Creates the feature branch, interviews the user, and writes specs/features/<date>-<slug>/{requirements,plan,validation}.md from the templates. Use when the user says "start feature", "spec the next roadmap item", "create a feature spec", or names a roadmap item to plan.
---

# Feature Spec

Plan one roadmap feature following `specs/README.md`. **Do not write any application code in this skill.**

## Steps

1. **Load context.** Read `specs/README.md`, `specs/product/mission.md`, `specs/product/tech-stack.md` and `specs/product/roadmap.md`. If the user didn't name an item, propose the next 📋 item and confirm it.
2. **Check for a clean slate.** Run `git status` and `git branch --show-current`. If there are uncommitted changes, or you aren't on `main`, stop and tell the user. Don't stash, reset or discard anything yourself.
3. **Branch.** `git checkout -b feature/<slug>` from an up-to-date `main`.
4. **Research.** Explore the code this feature touches: existing modules, models, migrations, related `docs/` sections. Use subagents for broad searches.
5. **Interview.** Use AskUserQuestion, at most 4 questions per round and as many rounds as needed, to settle:
   - scope (what's in and out, and whether to split the feature into smaller roadmap items)
   - key decisions where there is a real trade-off (data model, sync vs async, which roles get access)
   - how success is validated (tests, curl, browser, data checks)
   Put your recommended option first. Don't ask about things the code or constitution already answer.
6. **Write the specs.** Copy `specs/templates/{requirements,plan,validation}.md` into `specs/features/<YYYY-MM-DD>-<slug>/` and fill them in:
   - `requirements.md`: context, decisions (with reasons), constraints. Leave out details the implementer can work out.
   - `plan.md`: numbered task groups in dependency order. Split payments, tax, RBAC and migration work into their own groups.
   - `validation.md`: one scorecard row per acceptance criterion, plus the relevant automated and manual checks.
   - Run the principle check against `mission.md`.
7. **Hand back for review.** Summarise the decisions and open questions, and ask the user to review the three files. Apply requested changes across **all three files** so they stay consistent.
8. **Commit** only the spec folder once the user approves: `spec: <feature name>`.

Finish by telling the user to run `/clear` and then: *"Implement specs/features/<folder>/plan.md"* (or group by group for risky areas).
