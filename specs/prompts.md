# Software Factory Prompts

Copy-paste prompts for each station of the spec loop in [README.md](./README.md). Replace the `<placeholders>`. Every station starts from a **fresh context** (`/clear`), so the agent works from the specs on disk and not from chat history.

```
 ① Boot ─► ② Plan ─► ③ Spec review ─► ④ Implement ─► ⑤ Validate ─► ⑥ Deep review ─► ⑦ Fix ─► ⑧ Ship ─► ⑨ Replan
                                                                                                  │
                                    ⑩ Research backlog · ⑪ Bug fix · ⑫ Data operation (side lines)
```

**Human gates** (the agent stops and waits): after ②/③ (spec approval), after each risky task group in ④, after ⑥ (findings triage), before ⑧ (merge), and before any destructive or production action.

---

## ① Boot (start of any session)

```text
Read specs/README.md, specs/product/mission.md, specs/product/tech-stack.md and
specs/product/roadmap.md. Then run git status and git branch --show-current.
Tell me in 5 lines or fewer: the current branch, any uncommitted work, which roadmap
item is 🚧 in progress, and the next 📋 item. Don't change anything yet.
```

## ② Plan a feature

Preferred: run the skill.

```text
/feature-spec <roadmap item number, e.g. 4.4>
```

Without the skill:

```text
Plan roadmap item <N.N> following specs/README.md step 2. Don't write application code.
1. Branch feature/<slug> from an up-to-date m3-cms-update. If the tree is dirty, stop and tell me.
2. Research the code this touches (modules, models, migrations, docs/ sections). Use subagents
   for broad searches.
3. Interview me with AskUserQuestion (recommended option first) about scope, real trade-offs,
   and how we'll validate. Skip anything the code or constitution already answers.
4. Write specs/features/<YYYY-MM-DD>-<slug>/{requirements,plan,validation}.md from
   specs/templates/. Put payments, tax, RBAC and migrations in their own task groups.
5. Run the principle check against mission.md, then summarise the decisions and open questions.
```

## ③ Spec review (before any code)

```text
Review specs/features/<folder>/ as a skeptical tech lead. Check:
- Every acceptance criterion in validation.md traces to a requirement, and every requirement
  has at least one criterion.
- plan.md groups are in dependency order and each one can be committed on its own.
- Migration numbers use the next free db_changes/NNN.
- Nothing contradicts mission.md principles or tech-stack.md conventions (franchise scoping,
  RBAC via @RequireAbility, soft deletes, shared-lib for cross-project types).
- Missing failure paths: wrong role, other franchise, invalid input, idempotency, timezones.
List the gaps, then fix them in all three files so they stay consistent. Don't commit.
```

After approval:

```text
Commit only specs/features/<folder>/ with the message "spec: <feature name>".
```

## ④ Implement

Low-risk feature, all groups:

```text
Implement specs/features/<folder>/plan.md. Work group by group in order and tick each task
in plan.md as you finish it. After each group run the relevant lint/test/build for the
projects you touched. If the code needs to deviate from the spec, stop and propose the spec
change first. Don't commit.
```

Risky areas (payments, tax/invoices, RBAC, migrations): one group at a time.

```text
Implement Group <n> only of specs/features/<folder>/plan.md. Tick its tasks, run lint/test/build
for the touched projects, and live-test the group (curl or browser) where possible. Then stop
and show me: files changed, test results, and anything that surprised you.
```

After review of that group:

```text
Commit Group <n>, staging only the files you changed by explicit path (no `git add -A`).
Message: "feat(<scope>): <group summary>". Then wait.
```

Resume in a new session:

```text
Continue specs/features/<folder>/plan.md. Read plan.md to see which tasks are ticked, check
git log and git status, then carry on with the next unticked group only.
```

## ⑤ Validate

```text
Run validation.md for specs/features/<folder>/:
1. Run every automated check and paste the actual result (pass/fail and the error output).
2. For each acceptance criterion that can be checked with curl or a test, run it and record
   the evidence. Use a role without permission and a user from another franchise for the
   RBAC rows.
3. For browser checks, walk the flow (admin and/or web; mobile width and Safari notes for web)
   and record what you saw.
Tick the rows that pass in validation.md. List what's still ☐ and what needs me (manual
sign-off, production data, credentials).
```

## ⑥ Deep review (subagents, in parallel)

```text
Review the diff of this branch against m3-cms-update with three parallel subagents. Give each one
requirements.md and the diff:
1. Correctness: logic bugs, edge cases, race conditions, error handling, money/tax rounding,
   timezone mistakes.
2. Security and franchise leakage: every new or changed admin endpoint enforces
   @RequireAbility and franchise scoping; no IDOR; input validation; secrets; private files
   never served publicly.
3. Conventions: tech-stack.md and CLAUDE.md rules (layering, no `any`, no .js, shared-lib
   types, Material + CSS tokens, .html/.scss files, soft deletes, snake_case columns).
Verify each finding against the code before reporting it. Give me one list ranked by severity
with file:line, a failure scenario, and a suggested fix. Don't change anything.
```

## ⑦ Fix findings (spec and code together)

```text
Fix findings <#, #, #> from the review. For each one, update the spec first (requirements.md
decision, a new plan.md task or group, a validation.md row), then the code, then a test that
would have caught it. Re-run the affected checks and show me the results.
```

## ⑧ Ship

```text
Close out specs/features/<folder>/:
- Confirm every validation.md row is ticked or explicitly waived by me.
- Set requirements.md status to Shipped and tick roadmap item <N.N> ✅ with a link to the folder.
- Note any constitution changes this feature implies (for the replan step) without making them.
- Commit with explicit paths, push the branch, and open a PR against m3-cms-update with a
  summary, the validation evidence and any rollout steps (migrations, env vars, prod data).
```

## ⑨ Replan (between features)

```text
We just shipped <feature>. Run the replan step from specs/README.md:
1. Does the roadmap order still make sense? Propose merges, splits or reorders with reasons.
2. Did this feature reveal a missing convention or principle? Propose exact edits to
   tech-stack.md or mission.md, and list existing specs or code that would need to follow it.
3. Could any part of this cycle be automated with a skill or hook?
Show me proposals only. Once I approve, apply them on a replan/<topic> branch and commit with
"replan: <topic>".
```

## ⑩ Research backlog (mid-feature, no branch switch)

```text
Research "<question>" without changing application code or leaving this branch. Look at the
current code, docs/ and the relevant constraints in mission.md and tech-stack.md. Write
specs/backlog/<YYYY-MM-DD>-<topic>.md with: the question, current state (file:line references),
2–3 options with trade-offs, a recommendation, and the roadmap item it would become.
```

## ⑪ Bug fix (no spec needed)

```text
Bug: <symptom, where, steps to reproduce, expected vs actual>.
Reproduce it first (failing test, curl or browser), find the root cause, and explain it to me
before fixing. Then fix it with the smallest change, add a regression test, and run lint/test
for the touched project. If the fix changes behaviour that a spec describes, update that spec
too. Write a short PR note: cause, fix, test.
```

## ⑫ Data operation (production data, invoices, backfills)

```text
Prepare a data operation for <goal>. Don't run anything against production.
1. Write a read-only SELECT that shows exactly which rows are affected, and the expected
   before/after.
2. Write the change as db_changes/<NNN>_<description>.sql inside a transaction, with a
   rollback script next to it. Use soft deletes (active=false), never DELETE.
3. Run it on a local copy, show me the diff of affected rows, and list the checks to run
   after applying it in production.
Stop for my approval before anything touches shared or production data.
```

---

## Tips

- **One feature, one context.** `/clear` between stations ②→④ and ④→⑥ so the agent reads the specs rather than remembering the chat.
- **Don't over-steer.** Give the agent business context it lacks (GST filing, franchise deals, client data) and leave the *how* to the spec and plan.
- **No silent edits.** If you fix something by hand, ask the agent to reflect it in the spec, or the next session will undo it.
