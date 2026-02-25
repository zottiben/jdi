---
description: Entry Point and Architecture for the Jedi (JDI) framework
model: opus
---

# Jedi (JDI) Framework

**Entry Point** | Componentised prompts, Context-efficient, agent-delegated development framework.

---

## Core Principles

| Principle | Description |
|-----------|-------------|
| **Minimal Context** | Commands are ultra-minimal stubs (~300 tokens). Heavy specs stay out of main context. |
| **Agent Delegation** | Complex operations spawn agents via Task tool. Agents run in isolated context. |
| **External State** | All state in JSON files. No context pollution from state tracking. |
| **On-Demand Reading** | Agents read specs, components, hooks, and rules only when needed. |

---

## Critical Constraints

> **WARNING: Task Tool `subagent_type` Parameter**
>
> The Claude Code Task tool **ONLY accepts `subagent_type="general-purpose"`** as a valid value.
>
> **If you use any other value** (e.g., `"jdi-executor"`, `"jdi-planner"`, or any custom type),
> the agent will fail with this error:
>
> ```
> classifyHandoffIfNeeded is not defined
> ```

### Correct Pattern

Agent identity is passed via the **prompt parameter**, NOT the `subagent_type` parameter:

```
Task(
  prompt="You are jdi-executor. Read .claude/jedi/agents/jdi-executor.md for instructions. Execute: {task}",
  subagent_type="general-purpose"   ← MUST be "general-purpose"
)
```

### Incorrect Pattern (WILL FAIL)

```
Task(
  prompt="Execute the plan...",
  subagent_type="jdi-executor"      ← WRONG: Causes classifyHandoffIfNeeded error
)
```

### Why This Matters

- The Task tool validates `subagent_type` against a fixed list
- Only `"general-purpose"` is in that list
- Any other value triggers an internal validation error
- The cryptic `classifyHandoffIfNeeded is not defined` message masks this validation failure

---

## How It Works

```
┌──────────────────────────────────────────────────────┐
│ MAIN CONTEXT                                          │
│                                                       │
│  User: /jdi:create-plan "Add user auth"              │
│         │                                             │
│         ▼                                             │
│  ┌──────────────────────┐                            │
│  │ Command Stub (~300)  │ ← Minimal stub             │
│  └──────────┬───────────┘                            │
│             │ Task tool spawns agent                  │
│             ▼                                         │
└──────────────────────────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────────────────┐
│ AGENT CONTEXT (Isolated, Fresh)                       │
│                                                       │
│  jdi-planner reads spec, researches, creates plan    │
│  → Returns plan_path to main context                  │
└──────────────────────────────────────────────────────┘
```

**create-plan:** Single planner agent (includes research as Step 0).
**implement-plan:** Complexity-routed — single agent for simple plans, Agent Teams swarm for complex plans.

---

## Available Commands

| Command | Type | Description |
|---------|------|-------------|
| `/jdi:init` | Direct | Initialise JDI in current project |
| `/jdi:create-plan` | Agent | Create implementation plan (single planner agent, includes research) |
| `/jdi:implement-plan` | Agent | Execute plan (single agent for simple, Agent Teams for complex) |
| `/jdi:commit` | Agent | Create conventional commit (spawns jdi-committer) |
| `/jdi:generate-pr` | Agent | Generate and create PR (spawns jdi-pr-generator) |
| `/jdi:pr-review` | Agent | Review PR (spawns reviewer) |
| `/jdi:pr-feedback` | Agent | Address PR review comments (spawns jdi-pr-feedback) |
| `/jdi:quick` | Direct | Quick focused change (no orchestration) |
| `/jdi:map-codebase` | Agent | Analyse codebase architecture and conventions (spawns jdi-codebase-mapper) |
| `/jdi:verify` | Agent | Run verification checks (spawns jdi-verifier) |

**Agent commands:** Spawn a Task agent with isolated context (~300 tokens in main)
**Direct commands:** Execute in main context (kept minimal)

---

## Component System

JDI uses **JSX-like component syntax** for referencing reusable markdown:

```markdown
<JDI:Commit />                    # Full component
<JDI:Commit:Message />            # Specific section
<JDI:Commit scope="task" />       # With parameters
```

**How it works:** When agents encounter component references, they:
1. Read the component file from `components/`
2. Execute the instructions within
3. Return to the calling context

Components are **loaded on-demand** by agents, not pre-embedded in commands.

---

## Component Resolution Protocol

**CRITICAL**: When you encounter a `<JDI:ComponentName />` tag anywhere in a spec,
command, hook, or workflow, you MUST:

1. **Parse** the tag to extract the component name, optional section, and parameters.
   - `<JDI:Commit />` -> Component: Commit, Section: (none), Params: (none)
   - `<JDI:StateUpdate:Progress />` -> Component: StateUpdate, Section: Progress, Params: (none)
   - `<JDI:Commit scope="task" />` -> Component: Commit, Section: (none), Params: scope=task

2. **Locate** the component file by searching these directories in order:
   - `.claude/jedi/components/execution/{ComponentName}.md`
   - `.claude/jedi/components/planning/{ComponentName}.md`
   - `.claude/jedi/components/quality/{ComponentName}.md`
   - `.claude/jedi/components/meta/{ComponentName}.md`

3. **Read** the component file using the Read tool.

4. **Execute** the instructions found in the component (or the specified section).
   Apply any parameters from the tag as contextual constraints.

5. **Return** to the calling context and continue execution.

Component tags are NOT decorative markers. They are lazy-loaded instructions
that MUST be resolved and executed at the point where they appear.

---

## State Management

### JSON State Files

| File | Purpose | Updates |
|------|---------|---------|
| `config/jdi-config.yaml` | Global settings | Manual |
| `config/state.yaml` | Runtime state (phase, plan, task) | Automatic |
| `config/variables.yaml` | Shareable variables | Automatic |

### Project State Files

When initialised in a project (`.jdi/`):

| File | Purpose |
|------|---------|
| `PROJECT.yaml` | Project vision and constraints |
| `REQUIREMENTS.yaml` | Scoped requirements with REQ-IDs |
| `ROADMAP.yaml` | Phase structure |
| `STATE.md` | Living memory across sessions |

---

## Context Budget

| Scenario | Old Pattern | New Pattern | Savings |
|----------|-------------|-------------|---------|
| Single command | ~6,900 tokens | ~300 tokens | 95% |
| 5-command workflow | ~34,500 tokens | ~1,500 tokens | 96% |

**Target:** Keep main context usage minimal. Let agents do heavy work in isolated context.

### Warning Thresholds

| Usage | Status | Action |
|-------|--------|--------|
| <50% | Green | Normal operation |
| 50-70% | Yellow | Reduce verbosity |
| 70-85% | Orange | Essential only |
| >85% | Red | Complete task and pause |

### No Direct Fallback Rule

Agent commands MUST use agent delegation. If agent spawning fails: report error, set state to "blocked", ask user for guidance. NEVER fall back to direct implementation.

---

## Quick Start

### New Feature

```
1. /jdi:create-plan "Add user authentication"
   → Spawns single planner agent (researches + plans)
   → Creates .jdi/plans/01-01-PLAN.md

2. /jdi:implement-plan
   → Routes by complexity (single agent or Agent Teams swarm)
   → Commits per task

3. /jdi:generate-pr
   → Creates PR with structured description
```

### Quick Commit

```
1. [Make changes]

2. /jdi:commit
   → Stages files individually
   → Creates conventional commit
```

---

## Bootstrap

To add JDI commands to a project:

```
/jdi:init
```

This creates:
- `.claude/commands/jdi/` — Command stubs
- `.jdi/` — Project state directory

---

## Core Rules

1. **Commands are stubs** — Just spawn instructions, not full specs
2. **Agents read on-demand** — Load what they need in their context
3. **State is external** — JSON files, not context pollution
4. **Components are modular** — Reusable across agents
5. **Atomic commits** — One commit per task, staged individually

---

*Jedi - Context-efficient development through agent delegation.*
