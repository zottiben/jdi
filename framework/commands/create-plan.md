---
name: create-plan
description: "JDI: Create implementation plan"
---

# /jdi:create-plan

Create an implementation plan using a single planner agent (includes research).

## Flags

- `--worktree` — Create git worktree with full environment before planning (follow `.claude/commands/jdi/worktree.md` steps)
- `--worktree-lightweight` — Same but skip databases/web server (deps + migrate only)

> **Do NOT use the built-in `EnterWorktree` tool.** Always follow `/jdi:worktree` Direct Execution steps.

## Orchestration

1. **Worktree** (if flagged): derive name from task, follow worktree.md steps, `cd` into `.worktrees/<name>`
2. Read codebase context (`.jdi/codebase/SUMMARY.md` if exists)
3. Read scaffolding (.jdi/PROJECT.yaml, REQUIREMENTS.yaml, ROADMAP.yaml) — create from templates if missing
4. **Agent Discovery (MANDATORY)** — before spawning the planner, enumerate available Claude Code agents by listing `.claude/agents/` (project-local) and `~/.claude/agents/` (user-global). Read each `.md` file's frontmatter for `name` and `description`. Pass the resulting catalogue into the planner's spawn prompt as `AVAILABLE_AGENTS` so it can pin specialists per task. If neither directory exists, pass an empty list. See `.jdi/framework/components/meta/AgentRouter.md` for the full routing rules.
5. Quick Mode Detection — suggest /jdi:quick for trivial tasks
6. Spawn `jdi-planner` agent (subagent_type="general-purpose") — creates split plan files (index .plan.md + per-task .T{n}.md files). The planner MUST write these files directly via Write tool (sandbox override for plan files). The planner MUST write the `available_agents` catalogue into the plan index frontmatter and pin an `agent:` field in every task file via AgentRouter.
7. Collect and execute deferred ops — if the agent returned `files_to_create`, create them now using Write tool. Verify split plan files exist: index `.plan.md` + individual `.T{n}.md` task files. Verify each task file's frontmatter contains an `agent:` field (unless `available_agents` is empty).
8. **Update state via CLI** — do NOT manually edit state.yaml. Run:
   ```bash
   npx jdi state plan-ready --plan-path ".jdi/plans/{plan-file}" --plan-name "{plan name}"
   ```
9. **Present summary** (name, objective, task table including the assigned `agent:` per task, files) then ask: _"Provide feedback to refine, or say **approved** to finalise."_
10. **Review loop**: Feedback → revise plan in-place, increment revision, re-present summary. Repeat until approved. Approval → run `npx jdi state approved`, then **STOP**.

## HARD STOP — Planning Gate

After the user approves the plan, your work is **DONE**. Output: _"Plan approved and locked in. Let me know when you want to implement."_ Then **STOP completely**. Do NOT invoke `/jdi:implement-plan`, do NOT spawn implementation agents, do NOT begin writing source code. Planning and implementation are separate human-gated phases.

Agent base (read FIRST for cache): .jdi/framework/components/meta/AgentBase.md | Agent spec: .jdi/framework/agents/jdi-planner.md | Agent routing: .jdi/framework/components/meta/AgentRouter.md

Feature to plan: $ARGUMENTS
