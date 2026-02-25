---
name: product-research
description: Gathers project requirements, performs research and development without writing code
members: [jdi-ux-designer, jdi-planner, jdi-product-lead, jdi-researcher]
---

# Product and Research Team

## Purpose

Requirements gathering, research, and planning. Analyses designs, researches codebase patterns, defines acceptance criteria, produces implementation plans. Does NOT write code.

## Members

| Role | Agent | Spec Path |
|------|-------|-----------|
| Lead UI/UX Designer | `jdi-ux-designer` | `.claude/jedi/agents/jdi-ux-designer.md` |
| Product Manager | `jdi-planner` | `.claude/jedi/agents/jdi-planner.md` |
| Product Lead | `jdi-product-lead` | `.claude/jedi/agents/jdi-product-lead.md` |
| Senior Analyst | `jdi-researcher` | `.claude/jedi/agents/jdi-researcher.md` |

## Coordination

Product Lead clarifies requirements → researcher investigates codebase → UX Designer maps component specs → planner synthesises into plans → Product Lead validates.

## Boundaries

**Will:** Analyse Figma designs, research codebase, define acceptance criteria, create plans, identify risks.
**Won't:** Write production/test code, make commits, make architectural decisions, deploy.
