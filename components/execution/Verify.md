---
name: Verify
category: execution
description: Verify completion of tasks, plans, phases, or requirements
params:
  - name: scope
    type: string
    required: false
    options: ["task", "plan", "phase", "requirements"]
    default: "task"
    description: What level to verify
  - name: strict
    type: boolean
    required: false
    default: false
    description: Fail on any unmet criteria (vs warn)
  - name: include_tests
    type: boolean
    required: false
    default: true
    description: Run tests as part of verification
---

# Verify

Verify completion of work at various levels of granularity.

---

## Default Behaviour

When invoked as `<JDI:Verify />`:

1. **Determine scope**
   - Check current position from state.yaml
   - Default to task-level verification

2. **Load verification criteria**
   - For tasks: From current PLAN.md task verification section
   - For plans: From PLAN.md success_criteria
   - For phases: From ROADMAP.yaml phase must_haves

3. **Execute verification**
   - Run each verification check
   - Record pass/fail status

4. **Report results**
   - Output verification summary
   - Update state with verification status

---

<section name="Task">

## Task Verification

When `scope="task"`:

1. **Load task verification criteria**
   ```markdown
   **Verification:**
   - [ ] {check 1}
   - [ ] {check 2}
   ```

2. **Execute each check**
   - File existence checks
   - Code pattern checks
   - **Backend test gate** — if ANY `.php` files were modified, run `composer test` (MANDATORY, blocking)
   - Frontend test execution (if TS/JS files modified)
   - Manual inspection criteria

3. **Load done criteria**
   ```markdown
   **Done when:**
   - {criterion}
   ```

4. **Report result**
   ```markdown
   ## Task Verification: Task {N}

   **Status:** PASS | FAIL

   ### Verification Checks
   - [x] {check 1} - PASS
   - [ ] {check 2} - FAIL: {reason}

   ### Done Criteria
   - [x] {criterion} - Met

   ### Issues
   - {issue description if any}
   ```

</section>

---

<section name="Plan">

## Plan Verification

When `scope="plan"`:

1. **Verify all tasks complete**
   - Check task completion status
   - Verify all task commits exist

2. **Load plan success criteria**
   ```markdown
   <success_criteria>
   - [ ] {criterion 1}
   - [ ] {criterion 2}
   </success_criteria>
   ```

3. **Execute plan-level checks**
   - Run test suite if specified
   - Check lint/type errors
   - Verify integration points

4. **Generate SUMMARY.md preview**
   - Draft what would go in summary
   - Include deviations

5. **Report result**
   ```markdown
   ## Plan Verification: {phase}-{plan}

   **Status:** PASS | FAIL

   ### Task Completion
   - [x] Task 1: {name} - {commit}
   - [x] Task 2: {name} - {commit}

   ### Success Criteria
   - [x] {criterion 1} - Met
   - [ ] {criterion 2} - NOT MET: {reason}

   ### Tests
   - Suite: {test suite}
   - Result: {pass/fail}
   - Coverage: {percentage}

   ### Ready for SUMMARY.md: YES | NO
   ```

</section>

---

## Advanced Verification (Phase & Requirements)

For `scope="phase"` or `scope="requirements"`, load `<JDI:VerifyAdvanced />` for full instructions.

---

<section name="TestRunner">

## Test Execution

When `include_tests="true"`:

1. **Detect which files changed**

   ```bash
   # For task-level: check staged/modified files
   git diff --cached --name-only
   git diff --name-only

   # For plan-level: check all changes vs base branch
   git diff master --name-only
   ```

2. **MANDATORY Backend Test Gate**

   **If ANY files matching `*.php` are found in the changed files, you MUST run `composer test`.** This is not optional. Backend tests are a blocking gate -- verification FAILS if backend tests fail.

   ```bash
   # Check for PHP file changes
   git diff --cached --name-only | grep '\.php$'

   # If ANY PHP files found, this is MANDATORY:
   composer test
   ```

   - If `composer test` passes: record as PASS
   - If `composer test` fails: verification FAILS. Do not proceed. Fix the tests first.

3. **Frontend Test Detection**

   If any files matching `*.ts`, `*.tsx`, `*.js`, `*.jsx` are found:
   ```bash
   bun run test:vitest
   ```

4. **Parse results**
   - Total tests
   - Passed/failed/skipped
   - Coverage percentage if available

5. **Include in verification report**
   ```markdown
   ### Test Results

   #### Backend (PHP)
   - **Ran:** Yes/No (PHP files changed: Yes/No)
   - **Command:** `composer test`
   - **Result:** PASS/FAIL
   - **Total:** {count}
   - **Passed:** {count}
   - **Failed:** {count}

   #### Frontend (TypeScript/JavaScript)
   - **Ran:** Yes/No (TS/JS files changed: Yes/No)
   - **Command:** `bun run test:vitest`
   - **Result:** PASS/FAIL

   #### Failed Tests
   - `test name` - {failure reason}
   ```

</section>

---

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `scope` | string | "task" | Verification level |
| `strict` | boolean | false | Fail on any issue |
| `include_tests` | boolean | true | Run tests |

### Parameter: scope

| Value | Verifies | Output |
|-------|----------|--------|
| `task` | Current task criteria | Pass/fail summary |
| `plan` | All tasks + success criteria | Summary readiness |
| `phase` | All plans + must-haves | VERIFICATION.md |
| `requirements` | All v1 requirements | Coverage report |

### Parameter: strict

- `false`: Warn on issues, continue
- `true`: Fail immediately on any unmet criterion

---

## Three-Level Verification

Every artifact must pass three levels:

1. **Existence** — Does it exist at the expected path? Is the export present?
2. **Substantive** — Is it real implementation, not a stub? (Detect: `throw new Error('Not implemented')`, `// TODO:` with empty body, `return null` in non-null function, empty function body)
3. **Wired** — Is it connected to the system? Imported somewhere? Registered in routing/config?

## Gap Detection

When verification reveals gaps:

| Level | Definition | Action |
|-------|------------|--------|
| **Critical** | Goal cannot be achieved | Generate gap closure plan |
| **High** | Major requirement unmet | Generate targeted fix |
| **Medium** | Minor requirement partially met | Note and optionally fix |
| **Low** | Enhancement opportunity | Document for future |

---

## State Updates

After verification, update:

**state.yaml:**
```yaml
position:
  status: verified  # or verification_failed
```

**If gaps found:**
```yaml
blockers:
  - type: verification_gap
    description: "{gap}"
    scope: "{task|plan|phase}"
```

---

## Examples

### Verify Current Task
```markdown
<JDI:Verify />
```

### Verify Plan Completion
```markdown
<JDI:Verify scope="plan" include_tests="true" />
```

### Strict Phase Verification
```markdown
<JDI:Verify scope="phase" strict="true" />
```

### Full Requirements Check
```markdown
<JDI:Verify scope="requirements" />
```
