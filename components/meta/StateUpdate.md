---
name: StateUpdate
category: meta
description: Update state.yaml and STATE.md with current progress and position
params:
  - name: phase
    type: string
    required: false
    description: Phase number to set
  - name: plan
    type: string
    required: false
    description: Plan number to set
  - name: task
    type: string
    required: false
    description: Task number to set
  - name: status
    type: string
    required: false
    options: ["idle", "planning", "executing", "verifying", "complete", "blocked", "error"]
    description: Current status to set
---

# StateUpdate

Update JDI state files to track current progress and position.

---

## File Paths

| File | Purpose |
|------|---------|
| `.jdi/config/state.yaml` | Runtime state (position, session, decisions, blockers) |
| `.jdi/config/variables.yaml` | Runtime variables (feature metadata, implementation tracking) |

**IMPORTANT**: These are RUNTIME state files in the project's `.jdi/` directory, NOT the template files in `.claude/jedi/config/`. If `.jdi/config/` does not exist, create it and copy templates from `.claude/jedi/config/`.

---

## How to Execute This Component

When you are directed here by a `<JDI:StateUpdate />` tag, follow these steps:

1. **Read** `.jdi/config/state.yaml` using the Read tool
2. **Parse** the YAML content into a mental model of the current state
3. **Modify** the specific fields described in the relevant section below
4. **Write** the complete updated YAML back to `.jdi/config/state.yaml` using the Write tool
For variables updates:
1. **Read** `.jdi/config/variables.yaml` using the Read tool
2. **Modify** the specific fields as needed
3. **Write** the complete updated YAML back to `.jdi/config/variables.yaml` using the Write tool

IMPORTANT: Always preserve fields you are not updating. Read the full file, change only what is specified, write the full file back.

---

## Default Behaviour

When invoked as `<JDI:StateUpdate />`:

1. **Read** `.jdi/config/state.yaml` using the Read tool and note current values

2. **Update** the timestamp field:
   ```json
   {
     "session": {
       "last_activity": "{ISO timestamp}"
     }
   }
   ```

3. **Write** the updated YAML to `.jdi/config/state.yaml` using the Write tool

---

<section name="Position">

## Position Update

When executing this section: Read `.jdi/config/state.yaml` using the Read tool, update the fields below, then write it back using the Write tool.

Update these fields to reflect the current position in the workflow:

```json
{
  "position": {
    "phase": "{phase}",
    "phase_name": "{name from ROADMAP.yaml}",
    "plan": "{plan}",
    "plan_name": "{name from PLAN.md}",
    "task": "{task}",
    "task_name": "{name from plan}",
    "status": "{status}"
  }
}
```

**Resolution:**
- Phase/plan names are looked up from ROADMAP.yaml
- Task names are looked up from current PLAN.md
- Status reflects current activity

</section>

---


---

<section name="Decisions">

## Record Decision

When executing this section: Read `.jdi/config/state.yaml` using the Read tool, update the fields below, then write it back using the Write tool.

Add a decision to state:

```json
{
  "decisions": [
    {
      "timestamp": "{ISO}",
      "phase": "{phase}",
      "decision": "{description}",
      "rationale": "{why}",
      "impact": "{what it affects}"
    }
  ]
}
```

Also append to STATE.md decisions table:

```markdown
## Decisions

| Date | Phase | Decision | Rationale |
|------|-------|----------|-----------|
| {date} | {phase} | {decision} | {rationale} |
```

</section>

---

<section name="Blocker">

## Record Blocker

When executing this section: Read `.jdi/config/state.yaml` using the Read tool, update the fields below, then write it back using the Write tool.

Add a blocker to state:

```json
{
  "blockers": [
    {
      "timestamp": "{ISO}",
      "type": "technical|external|decision",
      "description": "{what's blocked}",
      "impact": "{what can't proceed}",
      "resolution": null
    }
  ]
}
```

Also update STATE.md:

```markdown
## Blockers

- [ ] **{type}**: {description}
  - Impact: {impact}
  - Added: {date}
```

When resolved:
```markdown
- [x] **{type}**: {description}
  - Resolved: {date} - {resolution}
```

</section>

---

<section name="Deviation">

## Record Deviation

When executing this section: Read `.jdi/config/state.yaml` using the Read tool, update the fields below, then write it back using the Write tool.

Add a deviation (unplanned work) to state:

```json
{
  "deviations": [
    {
      "timestamp": "{ISO}",
      "rule": "Rule 1|Rule 2|Rule 3|Rule 4",
      "description": "{what deviated}",
      "reason": "{why}",
      "task": "{task context}",
      "files": ["{affected files}"]
    }
  ]
}
```

**Deviation Rules:**
- **Rule 1**: Auto-fixed bug
- **Rule 2**: Auto-added critical functionality
- **Rule 3**: Auto-fixed blocking issue
- **Rule 4**: Asked about architectural change

</section>

---

<section name="Session">

## Session Management

When executing this section: Read `.jdi/config/state.yaml` using the Read tool, update `session.last_activity` to the current ISO timestamp, then write it back.

</section>


### Record a Decision
```markdown
<JDI:StateUpdate:Decisions
  decision="Use Zod for validation"
  rationale="Better TypeScript integration"
/>
```

### Add a Blocker
```markdown
<JDI:StateUpdate:Blocker
  type="external"
  description="Waiting for API credentials"
  impact="Cannot test integration"
/>
```
