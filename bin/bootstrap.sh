#!/usr/bin/env bash
set -euo pipefail

# JDI Framework Bootstrap
# Copies the full /jdi:init command into .claude/commands/jdi/
# so the framework can self-initialise via /jdi:init
#
# The init command is the source of truth for all stub templates.
# It lives at .claude/commands/jdi/init.md and contains the full
# initialisation logic including embedded stub templates for all commands.

PROJECT_ROOT="${1:-.}"
COMMANDS_DIR="${PROJECT_ROOT}/.claude/commands/jdi"
JEDI_DIR="${PROJECT_ROOT}/.claude/jedi"
INIT_SOURCE="${COMMANDS_DIR}/init.md"

mkdir -p "$COMMANDS_DIR"

# If init.md already exists with full content, skip unless --force
FILE_SIZE=$(wc -c < "${INIT_SOURCE}" 2>/dev/null || echo "0")
if [ "$FILE_SIZE" -gt 500 ] && [ "${2:-}" != "--force" ]; then
  echo "JDI init.md already exists with full content (${FILE_SIZE} bytes)."
  echo "Use: bash $0 $PROJECT_ROOT --force to overwrite."
  exit 0
fi

# If init.md doesn't exist or is a stub, check if there's a source copy
# in the jedi framework directory (for fresh project bootstrapping)
JEDI_INIT_SOURCE="${JEDI_DIR}/init-source.md"
if [ -f "$JEDI_INIT_SOURCE" ]; then
  cp "$JEDI_INIT_SOURCE" "$INIT_SOURCE"
  echo "JDI bootstrap complete. Copied full init from jedi framework."
  echo "Run /jdi:init in Claude Code to generate all commands."
  exit 0
fi

# Fallback: generate a minimal but functional init stub
# This stub contains enough logic to bootstrap all commands
cat > "${INIT_SOURCE}" << 'STUB'
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

For each command below, write the stub content to `.claude/commands/jdi/{name}.md`.
Skip files that already exist and are >500 bytes (unless `--force` is passed).

**Commands to generate:**

- **create-plan.md**: Spawns single jdi-planner agent (includes research as Step 0). Cache-first codebase context. Creates plan for: $ARGUMENTS
- **implement-plan.md**: Complexity-based routing — simple plans (≤3 tasks, single stack) spawn single specialist agent; complex plans (>3 tasks, multi-stack) use Agent Teams swarm via TeamCreate. See `.claude/jedi/components/meta/ComplexityRouter.md`. Executes plan: $ARGUMENTS
- **commit.md**: Delegates to jdi-committer agent (`Read .claude/jedi/agents/jdi-committer.md`). Creates conventional commit.
- **generate-pr.md**: Delegates to jdi-pr-generator agent (`Read .claude/jedi/agents/jdi-pr-generator.md`). Generates PR for: $ARGUMENTS
- **pr-review.md**: Delegates to PRReview component (`Read .claude/jedi/components/quality/PRReview.md`). Reviews PR: $ARGUMENTS
- **pr-feedback.md**: Delegates to jdi-pr-feedback agent (`Read .claude/jedi/agents/jdi-pr-feedback.md`). Addresses feedback for: $ARGUMENTS
- **quick.md**: Direct execution. Parse task, detect stack, execute, verify, commit.
- **status.md**: Direct execution. Read `.jdi/config/state.yaml`, display position/progress, suggest next action.

Each stub should have frontmatter (name, description) and use `subagent_type="general-purpose"` for delegated commands.

### Step 3: Initialise Config Files

```bash
cp .claude/jedi/config/state.yaml .jdi/config/state.yaml
cp .claude/jedi/config/variables.yaml .jdi/config/variables.yaml
cp .claude/jedi/config/jdi-config.yaml .jdi/config/jdi-config.yaml
```

### Step 4: Generate Markdown Scaffolding

Read templates from `.claude/jedi/templates/` and write to `.jdi/` (only if missing):
- PROJECT.yaml, REQUIREMENTS.yaml, ROADMAP.yaml

### Step 5: Display Completion

List all available commands including /jdi:quick and suggest `/jdi:create-plan "your feature"` to get started.

## Arguments

| Argument | Description |
|----------|-------------|
| `--force` | Overwrite existing command files |
STUB

echo "JDI bootstrap complete. Run /jdi:init in Claude Code to generate all commands."
