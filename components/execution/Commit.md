---
name: Commit
category: execution
description: Create atomic commits with proper formatting and state tracking
params:
  - name: scope
    type: string
    required: false
    default: "task"
    options: ["task", "plan", "phase", "docs", "fix"]
    description: What level of work is being committed
  - name: type
    type: string
    required: false
    default: null
    options: ["feat", "fix", "refactor", "docs", "test", "chore", "perf", "style"]
    description: Override commit type (auto-detected if not provided)
  - name: files
    type: array
    required: false
    default: null
    description: Specific files to stage (auto-detected if not provided)
---

# Commit

Create an atomic commit with proper formatting, staging, and state tracking.

---

## Default Behaviour

When invoked as `<JDI:Commit />`:

1. **Check for changes**
   ```bash
   git status --porcelain
   ```
   If no changes, skip commit.

2. **Identify modified files**
   - Parse git status output
   - Group by change type (new, modified, deleted)

3. **Determine commit type**
   - Analyse changes to select appropriate type
   - New functionality → `feat`
   - Bug fix → `fix`
   - Code improvement → `refactor`
   - Documentation → `docs`
   - Tests → `test`

4. **Stage files individually**
   ```bash
   git add path/to/file1
   git add path/to/file2
   ```
   **NEVER** use `git add .` or `git add -A`

   **CRITICAL: EXCLUDED DIRECTORIES**

   The following directories must NEVER be staged:
   - `.worktrees/**` - Git worktrees are execution infrastructure
   - `.jdi/**` - JDI runtime state and configuration

   Before staging, filter out any files matching these patterns:
   ```bash
   # Skip files in excluded directories
   if [[ "$file" == .worktrees/* ]] || [[ "$file" == .jdi/* ]]; then
     echo "SKIP (excluded): $file"
     continue
   fi
   ```

5. **Create commit message**
   Use <JDI:Commit:MessageFormat />

6. **Execute commit**
   ```bash
   git commit -m "$(cat <<'EOF'
   {message}
   EOF
   )"
   ```

7. **Record commit hash**
   ```bash
   git rev-parse --short HEAD
   ```

8. **Update state**
   Add commit to `state.yaml` session_commits array.

---

<section name="MessageFormat">

## Message Format

Commit messages follow conventional commits format:

```
{type}({scope}): {description}

- {change 1}
- {change 2}
- {change 3}
```

### Type Selection

| Type | When to Use |
|------|-------------|
| `feat` | New feature, endpoint, component, functionality |
| `fix` | Bug fix, error correction |
| `test` | Test-only changes |
| `refactor` | Code cleanup, no behaviour change |
| `perf` | Performance improvement |
| `docs` | Documentation changes |
| `style` | Formatting, linting fixes |
| `chore` | Config, tooling, dependencies |

### Scope

Scope is derived from the current position:
- If in a plan: `{phase}-{plan}` (e.g., `01-02`)
- If standalone: Feature name or file area

### Description

- Imperative mood ("add feature" not "added feature")
- No capitalisation at start
- No period at end
- Max 72 characters

### Body

- List key changes as bullet points
- Focus on WHAT changed, not HOW
- Max 3-5 bullet points

</section>

---

<section name="ScopeTask">

## Task-Level Commit

When `scope="task"`:

1. Commit only files modified by the current task
2. Use task name as description basis
3. Reference task number in scope: `{type}({phase}-{plan}): task {N} - {description}`

**Example:**
```
feat(01-02): task 3 - add user validation endpoint

- Create POST /api/users/validate endpoint
- Add validation schema with Zod
- Return validation errors in standard format
```

</section>

---

<section name="ScopePlan">

## Plan-Level Commit

When `scope="plan"`:

This is for committing plan metadata (SUMMARY.md, etc.), not code.

```
docs({phase}-{plan}): complete {plan-name} plan

Tasks completed: {N}/{N}
- {Task 1 name}
- {Task 2 name}

SUMMARY: {path to SUMMARY.md}
```

</section>

---

<section name="ScopePhase">

## Phase-Level Commit

When `scope="phase"`:

This is for committing phase completion metadata.

```
docs({phase}): complete {phase-name} phase

Plans completed: {N}/{N}
- {Plan 1 name}
- {Plan 2 name}

All phase requirements verified.
```

</section>

---

<section name="ScopeFix">

## Quick Fix Commit

When `scope="fix"`:

Simplified flow for quick fixes outside of a plan:

```
fix: {brief description}

- {what was wrong}
- {what was changed}
```

</section>

---

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `scope` | string | "task" | What level of work is being committed |
| `type` | string | auto | Override commit type |
| `files` | array | auto | Specific files to stage |

### Parameter: scope

Controls the commit message format and what gets staged:

| Value | Stages | Message Format |
|-------|--------|----------------|
| `task` | Task-related files | `{type}({phase}-{plan}): task {N} - {desc}` |
| `plan` | Plan metadata only | `docs({phase}-{plan}): complete {plan-name}` |
| `phase` | Phase metadata | `docs({phase}): complete {phase-name}` |
| `docs` | Documentation only | `docs: {description}` |
| `fix` | Fix-related files | `fix: {description}` |

### Parameter: type

Override automatic type detection:

```markdown
<JDI:Commit type="refactor" />
```

Forces the commit type regardless of what was detected.

### Parameter: files

Explicit file list:

```markdown
<JDI:Commit files="['src/api/users.ts', 'src/types/user.ts']" />
```

Only these files will be staged.

---

## State Updates

After successful commit, update:

**state.yaml:**
```yaml
commits:
  session_commits:
    - ... # existing
    - "{hash}"
  last_commit_hash: "{hash}"
  last_commit_message: "{message}"
```

**variables.yaml:**
```yaml
implementation:
  files_modified:
    - ... # existing
    - "{files}"
```

---

## Error Handling

### No Changes to Commit

```
No changes to commit. Working tree is clean.
```
Skip commit, do not error.

### Staging Failure

If `git add` fails:
1. Log the error
2. Report which file failed
3. Do not proceed with commit

### Commit Failure

If `git commit` fails:
1. Check for pre-commit hook failures
2. Report the error
3. Suggest: "Run lint/format and try again"

---

## Examples

### Basic Task Commit
```markdown
<JDI:Commit />
```

### Specific Type
```markdown
<JDI:Commit type="fix" />
```

### Plan Metadata
```markdown
<JDI:Commit scope="plan" />
```

### Explicit Files
```markdown
<JDI:Commit scope="task" files="['src/auth.ts']" />
```
