# Spec-Driven Development

Every non-trivial change starts as a written spec, gets reviewed, and only then turns into code. The spec holds the **what** and **why**, and the agent works out the **how**. Specs are the project's memory: agents start each session without memory, so they boot from these files rather than from old chat history.

## Layout

```
specs/
├── README.md                 ← this file (the workflow)
├── product/                  ← the CONSTITUTION: project-level, read first
│   ├── mission.md            ← why: users, problem, product principles, non-goals
│   ├── tech-stack.md         ← with what: stack, versions, layering, conventions
│   └── roadmap.md            ← in what order: phases in small steps, status
├── templates/                ← copied for each feature
│   ├── requirements.md
│   ├── plan.md
│   └── validation.md
├── features/
│   └── YYYY-MM-DD-<slug>/    ← one folder per feature (one branch per feature)
│       ├── requirements.md   ← context, scope, decisions, constraints
│       ├── plan.md           ← numbered task groups
│       └── validation.md     ← acceptance scorecard + checks
└── backlog/                  ← research notes not yet on the roadmap
```

`docs/BRD.md` and `docs/PRD*.md` remain the long-form business record. Specs reference them by section (for example `BR-10`, `PRD §3 story 21`) instead of copying them.

## The Loop

```
Constitution ──► [ Plan ─► Implement ─► Validate ─► Merge ] ──► Replan ──► next feature …
```

### 1. Constitution (once, then living)

`product/mission.md`, `tech-stack.md` and `roadmap.md`. For this brownfield repo they were generated from the code, `docs/`, migrations and git history. **Change them through the agent**, not by hand, so related files stay in sync. Commit constitution changes on their own branch (`replan/<topic>`) so it's clear which version of the constitution produced which code.

### 2. Plan the feature

Before starting, check for a clean slate:

- [ ] No unfinished work; the previous feature branch is merged
- [ ] The next roadmap item is still the right one
- [ ] Agent context is cleared (`/clear`), so it works from the specs and not from memory

Then:

1. Create the branch `feature/<slug>` from `main`.
2. Have the agent **interview you** (scope, key decisions, validation approach) and write `features/<date>-<slug>/{requirements,plan,validation}.md` from the templates. In Claude Code, the `/feature-spec` skill does this.
3. **Review all three files.** Ask the agent to make fixes so the three stay consistent. Give context the agent lacks, but don't over-steer it with low-level details.
4. Commit the spec on its own: `spec: <feature>`.

### 3. Implement

- Start from a fresh context: *"Implement `specs/features/<folder>/plan.md`"* (all groups, or *"group 1 only"*).
- For **payments, tax/invoices, RBAC and migrations**, work one task group at a time and commit between groups.

### 4. Validate (human in the loop)

- Work through `validation.md`: automated checks, manual checks (curl, browser) and the acceptance scorecard.
- Review the diff for intent, not nitpicks. When something is wrong, ask the agent to fix **both the spec and the code**. Don't make silent manual edits: they cause drift between code and specs.
- Ask for a **deep review by subagents** (bugs, franchise leakage and security, conventions). This preserves the main context and usually catches real issues.
- Tick the roadmap item ✅ with a link to the feature folder, commit, and merge.

### 5. Replan (between features, don't skip)

- Does the roadmap still make sense? Should items be merged, split or reordered?
- Did this feature reveal a missing convention (testing, responsive design, prop typing…)? Put it in `tech-stack.md` / `mission.md`, then ask the agent to bring existing specs and code into line.
- Small changes can be done right away. Large ones become a new roadmap item.
- Could part of the workflow be automated with a skill (for example changelog or validation)?

## Research Backlog

If an idea comes up mid-feature (for example "should we move media to S3?"), research it with the agent without leaving the branch. Ask for a report at `specs/backlog/<date>-<topic>.md`. Later, schedule it on the roadmap with a link to that file.

## When a spec is required

- **Required:** a new feature or module, schema changes, new or changed API endpoints, RBAC/permission changes, anything touching payments, tax, invoices or franchise scoping.
- **Optional:** bug fixes with an obvious cause, copy/style tweaks, dependency bumps without behavioural change. Use a short note in the PR instead.

## Naming

- Feature folder: `YYYY-MM-DD-kebab-slug` (date the spec was created). Branch: `feature/<slug>`. Constitution changes: `replan/<topic>`.
- Migrations named in a spec use the next free `db_changes/NNN_*.sql` number.
- Commit prefixes: `spec:` (spec files), `feat:` / `fix:` (code), `replan:` (constitution).
