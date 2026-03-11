---
name: StateUpdate
category: meta
description: Record decisions, deviations, and blockers in state.yaml
---

# StateUpdate

> **Status transitions are handled by the TypeScript framework.** Do NOT update `position`, `progress`, `current_plan`, `review`, or `session` fields in state.yaml — the CLI manages these automatically.

Use state.yaml ONLY to record decisions, deviations, or blockers:

## Record Decision

Append to `decisions` array in `state.yaml`:

```yaml
- timestamp: "{ISO}"
  phase: "{phase}"
  decision: "{description}"
  rationale: "{why}"
  impact: "{what it affects}"
```

## Record Blocker

Append to `blockers` array in `state.yaml`:

```yaml
- timestamp: "{ISO}"
  type: "technical|external|decision"
  description: "{what's blocked}"
  impact: "{what can't proceed}"
  resolution: null
```

## Record Deviation

Append to `deviations` array in `state.yaml`:

```yaml
- timestamp: "{ISO}"
  rule: "Rule 1|Rule 2|Rule 3|Rule 4"
  description: "{what deviated}"
  reason: "{why}"
  task: "{task context}"
  files: ["{affected files}"]
```

Deviation rules: 1=Auto-fixed bug, 2=Auto-added critical functionality, 3=Auto-fixed blocking issue, 4=Asked about architectural change.
