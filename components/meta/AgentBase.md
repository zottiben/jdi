# AgentBase Component

Standards inherited by all JDI agents via `<JDI:AgentBase />`.

## Standards

- Use **Australian English** spelling in all outputs.
- Follow `CLAUDE.md` and `.claude/rules/` conventions.
- Read `.jdi/config/state.yaml` before updating — update `position`, `progress`, `current_plan` fields.
- Use the Read tool before editing any file.
- Use **TaskList/TaskUpdate** to find, claim, and track task progress.
- Update **`.jdi/config/state.yaml`** via `<JDI:StateUpdate />` after each task transition.

## Sandbox Awareness

You run in a sandboxed environment. Key constraints:

| Operation | Tool / Method | Persists? | Notes |
|-----------|--------------|-----------|-------|
| Edit existing files | Edit tool | **Yes** | Primary way to modify code |
| Delete files | Bash `rm` | **Yes** | Destructive — use with care |
| Create new files | Write tool / Bash `cat >` | **No** | Silently fails — report in `files_to_create` |
| Git commits | Bash `git commit` | **No** | Silently fails — report in `commits_pending` |
| Read files | Read tool | **Yes** | Works reliably |
| Run commands | Bash tool | **Yes** | Output is real; side-effects vary |

**Key Rules:**
1. **NEVER attempt `git commit`** — it will appear to succeed but produces no real commit. Do not report commit hashes.
2. **NEVER create new files** via Write tool or Bash redirection — they will not persist after agent exits.
3. **ALWAYS use the Edit tool** to modify existing files — the only reliable write operation.
4. **Report pending work** in structured returns using `files_to_create` and `commits_pending` fields.

### Structured Returns for Sandbox-Limited Operations

```yaml
files_to_create:
  - path: "path/to/new/file.md"
    content: |
      Full file content here...
files_modified:
  - path/to/edited/file1.ts
commits_pending:
  - message: |
      feat(01-01-T1): implement feature X
    files:
      - path/to/modified/file1.ts
```

### Orchestrator Post-Agent Handling

After a sandboxed agent completes, the orchestrator must:
1. Create files from `files_to_create` using Write tool
2. Execute commits from `commits_pending` via `git add` + `git commit`
3. Record real commit hashes in `.jdi/config/state.yaml`
4. Verify all `files_modified` are present in working tree

## Communication (Team Mode)

When operating within an Agent Team (spawned by coordinator):

1. **Claim tasks**: Call TaskList, find tasks assigned to you
2. **Execute**: Read task description, implement using Edit tool
3. **Verify**: Run task verification (lint, test, type checks as applicable)
4. **Report**: SendMessage to coordinator with structured return (include `files_modified`, `files_to_create`, `commits_pending`)
5. **Complete**: TaskUpdate(status: "completed")
6. **Next**: Check TaskList for more assigned tasks. If none, go idle.

**Team Mode Rules:**
- NEVER write to state.yaml (coordinator handles this)
- ALWAYS SendMessage results to coordinator before TaskUpdate(completed)
- Mark task completed via TaskUpdate AFTER sending results
- Use **SendMessage** to communicate — plain text is not visible to teammates.

## Component Resolution

When a spec contains `<JDI:*>` tags:
1. Read the file from `.claude/jedi/components/` (execution/, planning/, quality/, meta/).
2. Follow instructions; apply tag parameters as constraints.
3. Return to agent spec and continue.

Do NOT skip `<JDI:*>` tags — they contain essential instructions.

## Activation Protocol

On encountering the Activation section, announce as the named agent and begin work immediately:
```
You are now active as {agent-name}. {Action verb} as requested.
```

## Structured Returns

Return a YAML block with `status`, agent-specific fields, and `next_action` after all work is complete.

## Boundaries

- **Will Do**: Actions within agent responsibility. Prioritise these.
- **Will Not**: Actions outside scope. Delegate or escalate, never attempt.
