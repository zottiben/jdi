---
phase: {X}
plan: {YY}
name: {Plan Name}
type: implementation
autonomous: true
wave: 1
gap_closure: false

# Dependency Graph (enables context assembly and parallel execution)
requires:
  - phase: {N}
    provides: [dependency1, dependency2]
provides: [deliverable1, deliverable2]
affects: [{future-phase-1}, {future-phase-2}]

# Semantic Indexing (enables fast scanning and context selection)
subsystem: {auth|api|ui|data|infra|docs|test}
tags: [tag1, tag2, tag3]

# Tech Tracking
tech_stack:
  added: []
  patterns: []
---

# Phase {X} Plan {YY}: {Plan Name}

---

## Objective

{One paragraph describing what this plan accomplishes. Be specific about the outcome.}

---

## Context

**Read before executing:**
- @{path/to/relevant/file}
- @{path/to/another/file}

**Relevant patterns:**
- {Pattern to follow}

**Previous work:**
- {What's already done that this builds on}

---

## Tasks

<task id="1" type="auto" wave="1">

### Task 1: {Task Name}

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

</task>

---

<task id="2" type="auto" wave="1">

### Task 2: {Task Name}

**Objective:** {What this task accomplishes}

**Files:**
- `{path/to/file.ts}` - {what changes}

**Implementation:**
1. {Step 1}
2. {Step 2}

**Verification:**
- [ ] {Check 1}

**Done when:**
- {Specific criterion}

</task>

---

<task id="3" type="checkpoint:human-verify" wave="2">

### Task 3: {Task Name}

**Objective:** {What needs verification}

**Checkpoint Details:**

**What was built:**
{Description of completed work}

**How to verify:**
1. {Step 1}
2. {Step 2}
3. {Expected behaviour}

**Awaiting:**
Type "approved" or describe issues to fix.

</task>

---

## Verification

After all tasks complete, verify:

- [ ] {Overall verification 1}
- [ ] {Overall verification 2}
- [ ] Tests pass: `{test command}`
- [ ] Types check: `{type check command}`

---

## Success Criteria

This plan is complete when:

1. {Observable outcome 1}
2. {Observable outcome 2}
3. All tasks have commits
4. Verification checks pass

---

## Output

**Creates:**
- `{path/to/new/file}` - {purpose}

**Modifies:**
- `{path/to/existing/file}` - {what changes}

**SUMMARY location:** `.jdi/plans/{phase}-{plan}-SUMMARY.md`

---

## Notes

{Any additional context, warnings, or guidance for execution}

---

## Deviation Rules Reference

During execution, apply automatically:
- **Rule 1**: Auto-fix bugs
- **Rule 2**: Auto-add critical functionality
- **Rule 3**: Auto-fix blocking issues
- **Rule 4**: Ask about architectural changes

Document all deviations in SUMMARY.md.
