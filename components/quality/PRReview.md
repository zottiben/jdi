---
name: PRReview
category: quality
description: Review pull request changes and post line comments to GitHub
params:
  - name: pr_number
    type: string
    required: false
    description: PR number to review (auto-detected if not provided)
  - name: context
    type: string
    required: false
    description: Extra context - ClickUp URL, focus areas, or specific instructions
  - name: depth
    type: string
    required: false
    options: ["quick", "standard", "thorough"]
    default: "standard"
    description: How deeply to analyse the changes
  - name: post
    type: boolean
    required: false
    default: true
    description: Whether to post comments to GitHub (false = local review only)
---

# PRReview

Review pull request changes with structured analysis and post line comments to GitHub.

---

## Default Behaviour

When invoked as `<JDI:PRReview />`:

**STOP. Execute these steps in order. Do not skip ahead.**

### Step 1: Identify PR (REQUIRED)

If PR number provided, use it. Otherwise detect from current branch:

```bash
gh pr view --json number,url,title,headRefName,baseRefName,author --jq '.'
```

If no PR found, respond:
"No PR found. Please provide a PR number or switch to a branch with an open PR."

Then STOP completely.

**Output:**
```
✓ PR identified
  - Number: #[number]
  - Title: [title]
  - Author: [author]
  - Branch: [head] → [base]
  - URL: [url]
```

### Step 2: Checkout PR Branch (REQUIRED)

Fetch latest and checkout the PR branch:

```bash
# Fetch latest from origin
git fetch origin

# Checkout the PR branch
gh pr checkout [pr_number]

# Verify branch
git branch --show-current
```

**Output:**
```
✓ Checked out PR branch
  - Branch: [branch_name]
  - Latest commit: [short sha] - [commit message]
```

### Step 3: Gather PR Context

Fetch PR details and diff:

```bash
# Get PR metadata
gh pr view [pr_number] --json title,body,additions,deletions,changedFiles,commits,labels

# Get list of changed files
gh pr view [pr_number] --json files --jq '.files[].path'

# Get the full diff
gh pr diff [pr_number]

# Get the latest commit SHA (needed for posting comments)
gh pr view [pr_number] --json commits --jq '.commits[-1].oid'
```

**Output:**
```
✓ PR context gathered
  - Files changed: [N]
  - Additions: +[N]
  - Deletions: -[N]
  - Commits: [N]
  - Latest commit: [sha]

Files to review:
- [file1]
- [file2]
- [file3]
```

### Step 4: Understand PR Intent

Before reviewing code, understand what the PR is trying to accomplish:

1. **Read PR description** — what problem is being solved?
2. **Read commit messages** — what approach was taken?
3. **Identify scope** — what should and shouldn't be reviewed?

#### If Context Provided

Parse the context parameter:
- **If ClickUp URL** (contains `app.clickup.com`): Note for requirements checking
- **If focus keywords** (e.g., "security,performance"): Prioritise these areas
- **If instructions**: Follow the specific guidance during review

**Output:**
```
✓ PR intent understood

Purpose: [1-2 sentence summary of what PR does]
Approach: [how it accomplishes this]
Scope: [what's in/out of scope for this review]
Focus: [summarised focus areas from context, if any]
```

### Step 5: Read Changed Files FULLY

For each changed file:

1. **Read the entire file** (not just the diff) to understand context
2. **Identify the role** of this file in the codebase
3. **Note existing patterns** the changes should follow

```bash
# For each file in the PR
cat [file_path]
```

**IMPORTANT:** Read files FULLY — never use limit/offset. You need complete context to review properly.

### Step 6: Perform Code Review

Apply <JDI:PRReview:Checklist /> to analyse each change.

### Step 7: Categorise Findings (Internal)

**This step is internal analysis — do NOT output detailed findings here.**

Categorise each finding using <JDI:PRReview:SeverityGuide />

Build an internal list of findings with:
- File path and line number
- Severity emoji
- Title (brief)
- Explanation
- Suggested fix (if applicable)

**Do NOT output the detailed findings yet — they will be posted as line comments in Step 9.**

### Step 8: Review Checkpoint

**Output a brief summary for confirmation:**

```
✓ Review analysis complete

Findings to post:
🔴 Blockers: [N]
🟠 Major: [N]
🟡 Minor: [N]
🔵 Suggestions: [N]
💬 Questions: [N]
👍 Praise: [N]

Total line comments: [N]
Review state: [APPROVE | REQUEST_CHANGES]
```

**If `post="false"` (i.e., `--no-comments` was used):**

```
Output mode: File (no GitHub comments will be posted)
Review file: .jdi/reviews/PR-[number]-review.md
```

**CHECKPOINT — Reply with one of:**
- **"continue"** — proceed to submit review (or write review file if `--no-comments`)
- **"list"** — show detailed findings before deciding
- **"cancel"** — abort without posting or writing

**STOP and wait for user confirmation before proceeding.**

### Step 8a: Branch on Post Mode

After the user replies "continue":

- **If `post="true"` (default):** Continue to Step 9 (build and submit review to GitHub).
- **If `post="false"` (`--no-comments`):** Skip Steps 9-10 entirely. Instead, execute `<JDI:PRReviewLocal />` to write the review file to `.jdi/reviews/PR-{number}-review.md`. Then proceed directly to Step 11.

### Step 9: Build Review Payload

**Only when `post="true"` (default).**

Use <JDI:PRReview:PostComments /> to build the atomic review submission.

### Step 10: Submit Review

**Only when `post="true"` (default).**

Use <JDI:PRReview:PostComments /> to post all comments as a single atomic submission.

### Step 11: Return to Master (MANDATORY - DO NOT SKIP)

**You MUST return to master after completing the review. This step is NOT optional. Do NOT end the review without executing this step.**

```bash
git checkout master
git branch --show-current
```

Verify the output shows `master`. If not, retry `git checkout master`.

**Output:**
```
✓ Returned to master branch
```

### Step 12: Confirm Completion (MANDATORY - DO NOT SKIP)

**You MUST output this completion message. Do NOT end the review without this step.**

**Output:**
```
✓ PR Review Complete

PR #[number]: [title]
State: [APPROVED | CHANGES_REQUESTED]
Line comments: [N]

URL: [pr_url]
Branch: master (verified)
```

**If the current branch is NOT master at this point, go back to Step 11 and execute it.**

---

<section name="Checklist">

## Review Checklist

Apply these checks during Step 6.

### Correctness
- [ ] Logic is sound and handles expected cases
- [ ] Edge cases are considered and handled
- [ ] Error handling is appropriate
- [ ] Types are correct (no unsafe casts)
- [ ] Null/undefined handled properly
- [ ] Async operations handled correctly

### Security
- [ ] No hardcoded secrets or credentials
- [ ] Input is validated before use
- [ ] SQL/NoSQL injection prevented
- [ ] XSS vulnerabilities prevented
- [ ] Authentication/authorisation checks present
- [ ] Sensitive data not logged

### Performance
- [ ] No obvious N+1 queries
- [ ] Large datasets handled efficiently
- [ ] No unnecessary re-renders (React)
- [ ] Appropriate caching considered
- [ ] No memory leaks introduced

### Architecture
- [ ] Follows existing patterns
- [ ] Appropriate separation of concerns
- [ ] No circular dependencies introduced
- [ ] APIs are consistent with existing
- [ ] Changes are appropriately scoped

### Style
- [ ] Naming is clear and consistent
- [ ] Code is readable
- [ ] No dead code or commented-out code
- [ ] Comments explain "why" not "what"
- [ ] Consistent formatting

### Testing
- [ ] New functionality has tests
- [ ] Edge cases are tested
- [ ] Tests are meaningful (not just coverage)
- [ ] No flaky tests introduced

### Type Safety
- [ ] Types are properly defined
- [ ] No unnecessary use of `any`
- [ ] Null/undefined cases handled with types
- [ ] Generic types used appropriately

</section>

---

<section name="SeverityGuide">

## Severity Classification

Use during Step 7 to categorise findings.

| Emoji | Severity | Description | Action |
|-------|----------|-------------|--------|
| 🔴 | **Blocker** | Bugs, security issues, data loss risk | Must fix before merge |
| 🟠 | **Major** | Significant issues, performance problems | Should fix before merge |
| 🟡 | **Minor** | Code quality, maintainability | Should fix, not blocking |
| 🔵 | **Suggestion** | Optional improvements | Consider for future |
| 💬 | **Question** | Clarification needed | Needs response |
| 👍 | **Praise** | Good patterns worth highlighting | Positive feedback |

### Event Logic

| Findings | Event |
|----------|-------|
| Any 🔴 blockers | `REQUEST_CHANGES` |
| Any 🟠 major | `REQUEST_CHANGES` |
| Any 🟡 minor | `REQUEST_CHANGES` |
| 🔵 suggestions only | `APPROVE` |
| No issues | `APPROVE` |

</section>

---

<section name="PostComments">

## Post Comments to GitHub

Use during Steps 9-10 for atomic review submission.

> **CRITICAL / MANDATORY**: Each finding MUST be a separate object in the `comments` array. NEVER put individual findings in the review `body` field. The `body` field is ONLY for the summary table. All code-specific feedback goes in the `comments` array with exact `path` and `line` number. Before posting, verify that your `comments` array has one entry per finding (excluding praise, which goes in the summary body).

### Get Repository Info

```bash
gh repo view --json owner,name --jq '"\(.owner.login)/\(.name)"'
```

### Build Comments Array

For EACH finding (except Praise which goes in summary), create a comment object:

```json
{
  "path": "[exact_file_path]",
  "line": [line_number],
  "side": "RIGHT",
  "body": "[severity emoji] **[title]**\n\n[detailed explanation]\n\n**Suggested fix:**\n```[language]\n[code suggestion]\n```\n\n- 🤖 AI Ben"
}
```

**JSON formatting rules:**
- Use `\n` for newlines in the body text
- Escape quotes inside body with `\"`
- Line number must be an integer (no quotes)

### Submit Review (SINGLE ATOMIC POST)

**Post ALL line comments AND summary together as one review.**

```bash
gh api repos/[owner]/[repo]/pulls/[pr_number]/reviews \
  --input - <<'EOF'
{
  "commit_id": "[latest_commit_sha]",
  "event": "[APPROVE|REQUEST_CHANGES]",
  "body": "## Review Summary\n\n[1-2 sentence assessment]\n\n| Category | Count |\n|----------|-------|\n| 🔴 Blockers | [N] |\n| 🟠 Major | [N] |\n| 🟡 Minor | [N] |\n| 🔵 Suggestions | [N] |\n\n**[N] line comments below with details.**\n\n- 🤖 AI Ben",
  "comments": [
    {
      "path": "path/to/file1.php",
      "line": 12,
      "side": "RIGHT",
      "body": "🔴 **Issue title**\n\nExplanation here.\n\n**Suggested fix:**\n```php\ncode here\n```\n\n- 🤖 AI Ben"
    },
    {
      "path": "path/to/file2.php",
      "line": 45,
      "side": "RIGHT",
      "body": "🟡 **Another issue**\n\nExplanation here.\n\n- 🤖 AI Ben"
    }
  ]
}
EOF
```

**CHECKPOINT — Reply "post" to submit, "cancel" to abort.**

**STOP and wait for user confirmation before posting.**

</section>

---

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `pr_number` | string | auto | PR to review |
| `context` | string | null | ClickUp URL, focus areas, or instructions |
| `post` | boolean | true | Whether to post to GitHub (false = use `<JDI:PRReviewLocal />`) |

---

## Key Principles

1. **Be Constructive** — Focus on the code, not the author. Offer solutions, not just criticism.
2. **Be Thorough** — Read full file context, not just the diff. Consider edge cases and security.
3. **Be Balanced** — Acknowledge good work (praise). Distinguish blocking vs non-blocking issues.
4. **Be Clear** — Use severity emojis consistently. Provide code examples when helpful.
