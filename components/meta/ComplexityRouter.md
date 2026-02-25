# ComplexityRouter Component

Evaluates plan complexity and returns the routing decision for implement-plan.

---

## Decision Matrix

Read the PLAN.md file and extract these signals:

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

Spawn one specialist agent directly via Task tool:

```
Task(
  subagent_type: "general-purpose",
  name: "{primary_agent}",
  prompt: "You are {primary_agent}. Read .claude/jedi/agents/{primary_agent}.md and .claude/jedi/components/meta/AgentBase.md. Execute all tasks in the plan sequentially. PLAN: {plan-path}. WORKING_DIR: {cwd}. Report: files_modified, files_to_create, commits_pending."
)
```

No TeamCreate, no TaskCreate, no cross-agent coordination.

---

## Agent Teams Mode

Follow full orchestration from `.claude/jedi/components/meta/AgentTeamsOrchestration.md`:
TeamCreate → TaskCreate per plan task → spawn specialists per tech-stack routing → wave-based coordination → collect deferred ops → shutdown → TeamDelete.

---

## Usage

```
<JDI:ComplexityRouter />
```

Referenced by implement-plan command stub. Evaluates at orchestration time, before any agents are spawned.
