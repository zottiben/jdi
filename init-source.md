---
name: init
description: "JDI: Initialise JDI commands in the current project"
---

# /jdi:init

Initialise the JDI slash commands in the current project.

## Direct Execution

### Step 1: Create Directories

```bash
mkdir -p .claude/commands/jdi
mkdir -p .jdi/plans .jdi/research .jdi/config
```

### Step 2: Generate Command Stubs

Generate ultra-minimal command stubs in `.claude/commands/jdi/`. **Only write stubs for files that don't exist or are <500 bytes** (unless `--force` is passed, in which case overwrite all).

For each command below, check:
```bash
# Skip if file exists and is >500 bytes (i.e., already has full content)
FILE_SIZE=$(wc -c < ".claude/commands/jdi/{cmd}.md" 2>/dev/null || echo "0")
if [ "$FILE_SIZE" -gt 500 ] && [ "$FORCE" != "true" ]; then
  echo "Skipping {cmd}.md (already exists with full content)"
  continue
fi
```

---

#### create-plan.md

```markdown
---
name: create-plan
description: "JDI: Create implementation plan"
---

# /jdi:create-plan

Create an implementation plan using a single planner agent (includes research).

## Flags

- `--worktree` — Create an isolated git worktree with **full environment** before planning. Derives name from ticket/task:
  1. Slugify the task description (e.g. "PROJ-1234 Add user auth" → `proj-1234-add-user-auth`)
  2. Follow the **Direct Execution** steps in `.claude/commands/jdi/worktree.md` to set up the full environment
  3. Continue planning inside the worktree working directory (`.worktrees/<derived-name>`)
  4. State tracks worktree context so `/jdi:implement-plan` inherits it
- `--worktree-lightweight` — Same as `--worktree` but pass `--lightweight` flag (skips databases and local server setup — just deps, migrate, type generation)

> **CRITICAL: Do NOT use the built-in `EnterWorktree` tool.** It only creates a bare git worktree without databases or dependency installation. Always follow the `/jdi:worktree` Direct Execution steps which set up the full environment.

## Orchestration

1. **If `--worktree`**: derive worktree name, follow `.claude/commands/jdi/worktree.md` Direct Execution steps (full: databases, server, deps, migrations, seeders), then `cd` into `.worktrees/<name>`
   **If `--worktree-lightweight`**: derive worktree name, follow `.claude/commands/jdi/worktree.md` Direct Execution steps with `--lightweight` (deps, migrate, types), then `cd` into `.worktrees/<name>`
2. Read codebase context (cache-first — read `.jdi/codebase/SUMMARY.md` if exists, never spawn mapper)
3. Read scaffolding (.jdi/PROJECT.yaml, REQUIREMENTS.yaml, ROADMAP.yaml) — create from templates if missing
4. Quick Mode Detection — suggest /jdi:quick for trivial tasks
5. Spawn single `jdi-planner` agent via Task tool (subagent_type="general-purpose"):
   - Planner includes research as Step 0 (analyses codebase, gathers context)
   - Then creates PLAN.md with task breakdown, dependencies, wave computation
   - Writes plan to .jdi/plans/ and updates state files
6. Collect deferred ops (files_to_create, commits_pending), execute them
7. Update `.jdi/config/state.yaml` — set status to `"plan_ready"`, set worktree state if active
8. Report plan path, task count, estimated duration, worktree path (if created)

Agent spec: .claude/jedi/agents/jdi-planner.md
Base protocol: .claude/jedi/components/meta/AgentBase.md

Feature to plan: $ARGUMENTS
```

---

#### implement-plan.md

```markdown
---
name: implement-plan
description: "JDI: Execute implementation plan"
---

# /jdi:implement-plan

Execute a PLAN.md with complexity-based routing: single agent for simple plans, Agent Teams swarm for complex plans.

## Orchestration

1. Read codebase context (cache-first — read `.jdi/codebase/SUMMARY.md` if exists, never spawn mapper)
2. Read plan file and state.yaml, parse tasks, dependencies, waves, tech_stack
3. **Complexity routing** via `<JDI:ComplexityRouter />`:
   - **Simple** (≤3 tasks, single stack, single wave): spawn single specialist agent directly (no TeamCreate)
   - **Complex** (>3 tasks, multi-stack, or multi-wave): full Agent Teams swarm via TeamCreate
   - Override: `--team` forces swarm, `--single` forces single-agent
4. Tech-stack routing per task:
   - PHP only → jdi-backend | TS/React only → jdi-frontend | Full-stack → both | Config/docs → jdi-backend
5. **Simple mode**: spawn one specialist agent, it executes all tasks sequentially, reports back
6. **Agent Teams mode**: TeamCreate → spawn specialists per routing → wave-based coordination → monitor
7. Collect deferred ops (files_to_create, commits_pending) from agent(s)
8. Execute deferred ops — Write files, git add + commit
9. Run verification: backend quality checks (lint, static analysis, tests), frontend quality checks (lint, typecheck, tests)
10. Cleanup (shutdown agents, TeamDelete if teams used) → update state → report

Agent specs: .claude/jedi/agents/jdi-backend.md, .claude/jedi/agents/jdi-frontend.md
Base protocol: .claude/jedi/components/meta/AgentBase.md
Orchestration ref: .claude/jedi/components/meta/AgentTeamsOrchestration.md
Complexity routing: .claude/jedi/components/meta/ComplexityRouter.md

Plan to execute: $ARGUMENTS
```

---

#### commit.md

```markdown
---
name: commit
description: "JDI: Create conventional commit"
---

# /jdi:commit

Create a well-formatted conventional commit.

## Delegation

**Agent:** jdi-committer

Use Task tool with subagent_type="general-purpose" and prompt:

You are jdi-committer. Read ./.claude/jedi/agents/jdi-committer.md for instructions.

Create a conventional commit for the current changes.
```

---

#### generate-pr.md

```markdown
---
name: generate-pr
description: "JDI: Generate pull request"
---

# /jdi:generate-pr

Generate a comprehensive PR description and create the pull request.

## Delegation

**Agent:** jdi-pr-generator

Use Task tool with subagent_type="general-purpose" and prompt:

You are jdi-pr-generator. Read ./.claude/jedi/agents/jdi-pr-generator.md for instructions.

Generate PR for current branch: $ARGUMENTS
```

---

#### pr-review.md

```markdown
---
name: pr-review
description: "JDI: Review pull request"
---

# /jdi:pr-review

## Delegation

Use Task tool with subagent_type="general-purpose" and prompt:

Read ./.claude/jedi/components/quality/PRReview.md for review instructions.

Review PR: $ARGUMENTS
```

---

#### pr-feedback.md

```markdown
---
name: pr-feedback
description: "JDI: Address PR feedback"
---

# /jdi:pr-feedback

Address PR review comments systematically.

## Delegation

**Agent:** jdi-pr-feedback

Use Task tool with subagent_type="general-purpose" and prompt:

You are jdi-pr-feedback. Read ./.claude/jedi/agents/jdi-pr-feedback.md for instructions.

Address feedback for PR: $ARGUMENTS
```

---

#### status.md

```markdown
---
name: status
description: "JDI: Show framework status"
---

# /jdi:status

## Direct Execution

1. Read `.jdi/config/state.yaml`
2. Display current position and progress
3. Show recent commits
4. Suggest next action
```

---

#### quick.md

```markdown
---
name: quick
description: "JDI: Quick focused change"
---

# /jdi:quick

Execute a small, focused change directly without full orchestration.

## Direct Execution

1. Parse task from $ARGUMENTS
2. Detect tech stack from target files
3. Execute changes directly (no agent spawn, no team, no waves)
4. Run verification gates
5. Commit with conventional format
6. Brief state update (if .jdi/ exists)
```

---

#### worktree.md

```markdown
---
name: worktree
description: "JDI: Create git worktree with full environment"
---

# /jdi:worktree

Create an isolated git worktree with full environment setup from a ticket, task name, or description.

> **CRITICAL: Do NOT use the built-in `EnterWorktree` tool.** It creates a bare worktree without database setup or dependency installation. Always follow the Direct Execution steps below.

## Direct Execution

1. **Parse name** from `$ARGUMENTS`:
   - Extract ticket ID if present (e.g. "PROJ-1234", "FIX-567") — use as prefix
   - Slugify the rest: lowercase, spaces/special chars to hyphens, strip trailing hyphens, max 40 chars
   - Examples: `"PROJ-1234 Add user auth"` → `proj-1234-add-user-auth`
   - Examples: `"fix broken calculator"` → `fix-broken-calculator`
   - If no arguments, generate random adjective-noun name
   - `--lightweight` flag: skip databases and local server setup (deps + migrate only)
   - `--base <branch>` flag: base branch (default: master)
2. **Validate**: check git repo, branch doesn't exist, required tools available
3. **Create worktree**:
   ```bash
   mkdir -p .worktrees
   git worktree add -b <name> .worktrees/<name> <base-branch>
   ```
4. **Create databases** (skip if `--lightweight`):
   Create project databases with worktree-specific names. Consult `.env.example` for required connections.
5. **Configure .env**: copy `.env.example`, update database names, `APP_URL`, and domain-specific variables
6. **Install deps**: run project dependency install commands
7. **Framework setup**: generate keys, run migrations, seed databases
8. **Local server** (skip if `--lightweight`): link to local dev server with SSL
9. **Update state**: set `worktree.active: true`, `worktree.path`, `worktree.branch`, `worktree.created_at`, `worktree.type` in `.jdi/config/state.yaml`
10. **Report**: worktree path, branch, databases, URLs

**On error**: clean up (drop databases, remove worktree, unlink server).

Worktree to create: $ARGUMENTS
```

---

#### worktree-remove.md

```markdown
---
name: worktree-remove
description: "JDI: Remove git worktree and clean up"
---

# /jdi:worktree-remove

Remove a git worktree and clean up all associated resources (databases, local server, branch).

## Direct Execution

1. **Identify worktree** from `$ARGUMENTS`:
   - If name provided: use `.worktrees/<name>`
   - If no arguments: read `worktree.path` from `.jdi/config/state.yaml`
   - If neither: list worktrees via `git worktree list`, prompt which to remove
   - `--force` flag: skip confirmation prompt
   - `--keep-branch` flag: don't delete the git branch after removal
2. **Confirm** with user (unless `--force`): show worktree path, branch, databases that will be dropped
3. **Derive db_name**: worktree name with hyphens replaced by underscores
4. **Drop databases**: consult `.env` in worktree directory for database names, drop all worktree databases
5. **Unlink local server**: remove from dev server (e.g. `herd unlink`, `valet unlink`)
6. **Remove worktree**: `git worktree remove .worktrees/<name> --force`
7. **Delete branch** (unless `--keep-branch`):
   - Merged: `git branch -d <name>`
   - Unmerged: `git branch -D <name>` (warn user first)
8. **Clean up**: `rmdir .worktrees 2>/dev/null` (only if empty)
9. **Update state**: set `worktree.active: false`, clear `worktree.path`, `worktree.branch` in `.jdi/config/state.yaml`
10. **Report**: what was removed

Reference: `.claude/jedi/hooks/jdi-worktree-cleanup.md`

Worktree to remove: $ARGUMENTS
```

---

### Step 3: Initialise Config Files

Copy config templates from source (preserves full schema):

```bash
cp .claude/jedi/config/state.yaml .jdi/config/state.yaml
cp .claude/jedi/config/variables.yaml .jdi/config/variables.yaml
cp .claude/jedi/config/jdi-config.yaml .jdi/config/jdi-config.yaml
```

This copies the complete schemas including:
- **state.yaml**: session, project, position, progress, current_plan, commits, checkpoints, deviations, blockers, metadata
- **variables.yaml**: feature, context, implementation, review, testing, references, custom
- **jdi-config.yaml**: workflow, agents, models, defaults, git, quality, context, ui settings

### Step 4: Generate Markdown Scaffolding

Generate the project scaffolding markdown files from templates. For each file, check if it already exists first. **Do not overwrite existing files.**

1. Read `.claude/jedi/templates/PROJECT.yaml` and write to `.jdi/PROJECT.yaml` (if `.jdi/PROJECT.yaml` does not exist)
2. Read `.claude/jedi/templates/REQUIREMENTS.yaml` and write to `.jdi/REQUIREMENTS.yaml` (if `.jdi/REQUIREMENTS.yaml` does not exist)
3. Read `.claude/jedi/templates/ROADMAP.yaml` and write to `.jdi/ROADMAP.yaml` (if `.jdi/ROADMAP.yaml` does not exist)

These files provide project context, scoped requirements, and phase structure for the JDI workflow.

### Step 5: Display Completion

```
JDI INITIALISED

Commands created in: .claude/commands/jdi/

  /jdi:create-plan     Create implementation plan (supports --worktree)
  /jdi:implement-plan  Execute plan with atomic commits
  /jdi:worktree        Create git worktree with full environment
  /jdi:worktree-remove Remove worktree and clean up resources
  /jdi:commit          Create conventional commit
  /jdi:generate-pr     Generate pull request
  /jdi:pr-review       Review pull request
  /jdi:pr-feedback     Address review feedback
  /jdi:quick           Quick focused change (no orchestration)
  /jdi:status          Show current status

Project documents:
  .jdi/PROJECT.yaml        Project context
  .jdi/REQUIREMENTS.yaml   Scoped requirements
  .jdi/ROADMAP.yaml        Phase structure

Project directories:
  .jdi/plans/          Implementation plans
  .jdi/research/       Research documentation
  .jdi/config/         State and variables

Get started: /jdi:create-plan "your feature"
```

## Arguments

| Argument | Description |
|----------|-------------|
| `--force` | Overwrite existing command files |
