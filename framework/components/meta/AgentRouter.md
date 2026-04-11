---
name: AgentRouter
category: meta
description: Enumerate Claude Code agents and route tasks to the best specialist
---

# AgentRouter

Enumerates the Claude Code agents available to the current session and routes
individual plan tasks to the most appropriate specialist. Used by `jdi-planner`
at plan-creation time to pin `agent:` into each task's frontmatter, and by
`implement-plan` (via `ComplexityRouter` and `AgentTeamsOrchestration`) at
execution time to honour those pins when spawning via the Task tool.

The point of this component is simple: **stop defaulting every subagent call to
`general-purpose`**. If the user has installed domain specialists (e.g.
`unity-specialist`, `unity-ui-specialist`, `gameplay-programmer`,
`godot-gdscript-specialist`, `ue-gas-specialist`), JDI plans must surface them
into the plan and implement-plan must use them.

---

## 1. Agent Discovery (at plan time)

The planner MUST perform discovery before task breakdown. Merge two roots (the
project-local list overrides the user-global list on name collision):

1. `.claude/agents/*.md` — project-local specialists (highest priority)
2. `~/.claude/agents/*.md` — user-global specialists

For each `.md` file, read the YAML frontmatter and extract:

- `name` — the subagent_type value passed to the Task tool
- `description` — the one-line capability blurb used for routing decisions
- `model` (optional) — preferred model if specified
- `tools` (optional) — tool allowlist if the agent is tool-restricted

Agents whose frontmatter is unreadable or missing `name` are skipped.

Discovery command (reference — the planner may use `Glob` + `Read`):

```bash
ls ~/.claude/agents/ 2>/dev/null
ls .claude/agents/ 2>/dev/null
```

The resulting catalogue MUST be written into the plan index frontmatter as
`available_agents:` (see `framework/templates/PLAN.md`) so reviewers and the
implement-plan pass can see exactly which agents were visible at plan time.

```yaml
available_agents:
  - name: unity-specialist
    description: Authority on Unity-specific patterns, APIs, and optimisation
  - name: unity-ui-specialist
    description: Unity UI Toolkit / UGUI / runtime UI performance
  - name: gameplay-programmer
    description: Implements game mechanics, player systems, combat
  - name: qa-tester
    description: Writes test cases, bug reports, regression checklists
```

If discovery returns zero agents (or `.claude/agents/` doesn't exist on either
root), the planner falls back to the legacy routing (tech-stack default:
`jdi-backend` or `jdi-frontend`) and records `available_agents: []` so it is
explicit rather than silent.

---

## 2. Task-to-Agent Matching (at plan time)

For each task in the plan, the planner selects ONE primary agent using this
signal hierarchy (highest to lowest):

| Priority | Signal | Example |
|----------|--------|---------|
| 1 | Explicit user instruction | "use the unity-specialist for this task" |
| 2 | Files touched by the task | `Assets/Scripts/UI/**` → `unity-ui-specialist` |
| 3 | Task type + tech_stack | Unity C# gameplay → `gameplay-programmer` or `unity-specialist` |
| 4 | Task objective keywords | "shader", "VFX", "render pipeline" → `unity-shader-specialist` |
| 5 | Checkpoint type | `checkpoint:human-verify` → `qa-tester` |
| 6 | Tech-stack default | PHP → `jdi-backend`, TS/React → `jdi-frontend`, C#/Unity → `unity-specialist` |
| 7 | Fallback | `general-purpose` (only if no specialists exist) |

### Unity routing cheat sheet (common case for game projects)

| Signal | Preferred agent |
|--------|-----------------|
| `Assets/Scripts/**/UI/**` or TMPro/UGUI/UI Toolkit references | `unity-ui-specialist` |
| `Assets/Scripts/**/DOTS/**` or Jobs/Burst/ECS references | `unity-dots-specialist` |
| Shader Graph, HLSL, VFX Graph, render pipeline | `unity-shader-specialist` |
| Addressables, asset bundles, memory budgets | `unity-addressables-specialist` |
| Gameplay mechanics, combat, movement, abilities | `gameplay-programmer` |
| AI, behaviour trees, pathfinding, perception | `ai-programmer` |
| Core engine/framework, performance-critical systems | `engine-programmer` or `performance-analyst` |
| General Unity API guidance, bootstrapping, subsystem integration | `unity-specialist` |
| Tests, QA checklists, regression scripts | `qa-tester` |
| Any task that edits code — no better specialist available | `gameplay-programmer` (games) or `general-purpose` (non-game) |

### Unreal routing cheat sheet

| Signal | Preferred agent |
|--------|-----------------|
| Blueprints and Blueprint architecture | `ue-blueprint-specialist` |
| UMG / CommonUI widgets | `ue-umg-specialist` |
| Gameplay Ability System, abilities, attribute sets | `ue-gas-specialist` |
| Replication, RPCs, prediction | `ue-replication-specialist` |
| General UE API and subsystem guidance | `unreal-specialist` |

### Godot routing cheat sheet

| Signal | Preferred agent |
|--------|-----------------|
| GDScript code, typed signals, node architecture | `godot-gdscript-specialist` |
| GDExtension / C++ / Rust bindings | `godot-gdextension-specialist` |
| Godot shading language, visual shaders, particles | `godot-shader-specialist` |
| General Godot API and node/scene guidance | `godot-specialist` |

### Non-game defaults

| Signal | Preferred agent |
|--------|-----------------|
| PHP backend | `jdi-backend` |
| TypeScript / React frontend | `jdi-frontend` |
| Full-stack | `jdi-backend` + `jdi-frontend` |

---

## 3. Output Format (written into plan files)

### Plan index (`{phase}-{plan}-{slug}.plan.md`) frontmatter

```yaml
available_agents:
  - name: unity-specialist
    description: ...
  - name: gameplay-programmer
    description: ...

# Primary agent for single-agent mode (first task's agent, or most common)
primary_agent: unity-specialist
```

### Task file (`{phase}-{plan}-{slug}.T{n}.md`) frontmatter

```yaml
agent: unity-ui-specialist   # REQUIRED when available_agents is non-empty
agent_rationale: "Edits Canvas-based HUD — UI Toolkit expertise needed"
```

`agent_rationale` is a short free-text note explaining WHY the planner picked
this specialist. Reviewers can use it to challenge bad routings.

---

## 4. Execution (at implement-plan time)

`implement-plan` MUST read the task's `agent:` field from each task file and
pass it as `subagent_type` when spawning via the Task tool.

### Single-agent mode

```
Task(
  subagent_type: "{plan.primary_agent}",   # NOT "general-purpose"
  name: "{plan.primary_agent}",
  prompt: "<standard single-agent spawn prompt from ComplexityRouter>"
)
```

If `plan.primary_agent` is missing (legacy plan or empty `available_agents`),
fall back to `general-purpose` with a `jdi-backend` / `jdi-frontend` spec load.

### Agent-teams mode

For each task, read its `agent:` frontmatter field and spawn ONE Task tool call
per task with `subagent_type` set to that value:

```
Task(
  subagent_type: "{task.agent}",           # per-task specialist
  name: "{task.agent}-{task_id}",
  prompt: "<spawn prompt from AgentTeamsOrchestration with TASK_FILE: {task file}>"
)
```

Tasks with no `agent:` field fall back to the tech-stack default
(`jdi-backend` / `jdi-frontend` / `general-purpose`).

### Mixed fallbacks

- If the discovered specialist name does NOT match a valid subagent type in the
  current session (e.g. plan was created on a different machine), downgrade to
  `general-purpose` and log a warning in the implement-plan summary: `agent
  downgrade: {planned} → general-purpose (not installed)`.
- Never silently change the pin; always surface downgrades in the summary.

---

## 5. Validation Rules

The planner MUST NOT:

1. Invent agent names that are not in `available_agents`.
2. Route a task to an agent whose description clearly does not match the task
   (e.g. `narrative-director` for a shader task).
3. Leave `agent:` blank when `available_agents` is non-empty.

The implement-plan pass MUST:

1. Read `agent:` from every task file before spawning.
2. Surface any downgrade in the summary.
3. Prefer project-local `.claude/agents/` over `~/.claude/agents/` on name
   collision.

---

## Usage

```
<JDI:AgentRouter mode="discover" />     # at plan time — enumerate + match
<JDI:AgentRouter mode="spawn" />        # at implement time — honour pins
```

Referenced by:
- `framework/agents/jdi-planner.md` (discover + match)
- `framework/components/meta/ComplexityRouter.md` (spawn)
- `framework/components/meta/AgentTeamsOrchestration.md` (spawn)
- `framework/commands/create-plan.md` (discover)
- `framework/commands/implement-plan.md` (spawn)
