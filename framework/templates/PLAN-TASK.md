---
plan_id: {phase}-{plan}
task_id: {phase}-{plan}-T{n}
task_name: {Task Name}
type: auto
wave: 1
depends_on: []

# Agent routing (written by jdi-planner via AgentRouter — see
# framework/components/meta/AgentRouter.md). implement-plan reads `agent` and
# passes it as `subagent_type` when spawning via the Task tool. `agent_rationale`
# is a human-readable justification so reviewers can challenge the pick.
agent: general-purpose
agent_rationale: "{Why this specialist was chosen}"
---

# Task {n}: {Task Name}

**Objective:** {What this task accomplishes}

**Files:**
- `{path/to/file.ts}` - {what changes}
- `{path/to/file2.ts}` - {what changes}

**Implementation:**
1. {Step 1}
2. {Step 2}
3. {Step 3}

**Verification:**
- [ ] {Check 1}
- [ ] {Check 2}

**Done when:**
- {Specific, observable completion criterion}
