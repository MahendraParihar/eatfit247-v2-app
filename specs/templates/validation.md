# Validation: <Feature Name>

> How we know the feature is done and correct. The agent runs every automated check. A human runs the manual checks and signs off on the review.

## Acceptance Scorecard

One row per acceptance criterion. Each must be objectively checkable.

| # | Criterion (Given / When / Then) | How verified | Result |
|---|---------------------------------|--------------|--------|
| A1 | | test / curl / browser | ☐ |
| A2 | | | ☐ |

## Automated Checks

- [ ] `cd shared-library && npm run build`
- [ ] `cd server_1 && npx nx affected --target=lint,test,build`
- [ ] `cd eatfit247-admin && npx nx affected --target=lint,test,build`
- [ ] `cd eatfit247-web-1 && npx nx build` (SSR build)
- [ ] Migration applies cleanly on a fresh DB and on a copy of production data

## Manual Checks

- [ ] API: `curl` the new or changed endpoints (happy path + one failure path)
- [ ] UI: walk the flow in the browser (admin and/or web; Safari + mobile width for web)
- [ ] RBAC: a role **without** permission is denied, and a user from another franchise cannot see the data

## Review

- [ ] Diff reviewed at the requirements level: does the code do what `requirements.md` says?
- [ ] Deep review by subagents (bugs, security / franchise leakage, conventions). Findings fixed or logged
- [ ] Specs and code are in sync. Every fix made during review is reflected back into `requirements.md` / `plan.md`
- [ ] I can explain the change (read the key tests, run them under the debugger if needed)
