# ComplexityRouter Component

Evaluates plan complexity and returns the routing decision for implement-plan.

---

## Decision Matrix

Read the plan index file (frontmatter + task manifest table) and extract these signals:

| Signal | Simple | Complex |
|--------|--------|---------|
| Task count | ≤3 | >3 |
| Tech stacks | Single (PHP-only OR TS-only) | Mixed (PHP + TS/React) |
| Wave count | 1 (all tasks parallel or sequential) | >1 (multi-wave dependencies) |

**Routing rule:** If ANY signal is "Complex" → use Agent Teams mode. All signals must be "Simple" for single-agent mode.

**Override flags:**
- `--team` in command arguments → force Agent Teams mode
- `--single` in command arguments → force single-agent mode

---

## Output

After evaluation, set the routing decision:

```yaml
mode: single-agent | agent-teams
primary_agent: jdi-backend | jdi-frontend  # based on tech stack
secondary_agents: []  # only populated in agent-teams mode
reasoning: "{why this mode was chosen}"
```

---

## Single-Agent Mode

Spawn one specialist agent directly via Task tool. Follow cache-optimised load
order (AgentBase first).

**Pinning rule:** read `primary_agent` from the plan index frontmatter. If set
and the agent is installed (verify against `.claude/agents/{name}.md` or
`~/.claude/agents/{name}.md`), use it as the `subagent_type`. If unset or not
installed, fall back to `general-purpose` and record a `agent_downgrade:` note
in the summary. Never silently default to `general-purpose` when a pin exists.
See `.jdi/framework/components/meta/AgentRouter.md`.

```
Task(
  subagent_type: "{plan.primary_agent}",   # e.g. unity-specialist — NOT hardcoded
  name: "{plan.primary_agent}",
  prompt: "You are {plan.primary_agent}. Your Claude Code agent definition has
already been loaded from .claude/agents/{name}.md (or ~/.claude/agents/{name}.md)
— follow it. Also read .jdi/framework/components/meta/AgentBase.md for the
JDI base protocol.

## Project Context
- Type: {project_type}
- Tech stack: {tech_stack}
- Quality gates: {quality_gates}
- Working directory: {cwd}

## Task
Execute all tasks in the plan sequentially. PLAN: {plan-path}.
For split plans (task_files in frontmatter), read each task file one at a time
from the file: field in state.yaml.
Report: files_modified, files_to_create, commits_pending."
)
```

No TeamCreate, no TaskCreate, no cross-agent coordination.

### Legacy fallback (no pins)

When `primary_agent` is missing or empty (legacy plan with no AgentRouter
discovery), use `subagent_type: "general-purpose"` and load the jdi-backend /
jdi-frontend spec inside the prompt as before.

---

## Agent Teams Mode

Follow full orchestration from `.jdi/framework/components/meta/AgentTeamsOrchestration.md`:
TeamCreate → TaskCreate per plan task → spawn specialists per tech-stack routing → wave-based coordination → collect deferred ops → shutdown → TeamDelete.

---

## Usage

```
<JDI:ComplexityRouter />
```

Referenced by implement-plan command stub. Evaluates at orchestration time, before any agents are spawned.
