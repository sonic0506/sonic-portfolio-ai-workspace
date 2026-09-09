# AGENTS.md

This repository uses a shared AI collaboration protocol for Codex and Claude Code.

## Required startup sequence
Before making changes, read these files in order:
1. `docs/01-rules/COMMON_RULES.md`
2. `docs/05-session/CURRENT_STATE.md`
3. `docs/05-session/NEXT_ACTIONS.md`
4. The relevant project/design/test documents for the requested task

## Source of truth
- `docs/` is the source of truth for project intent, decisions, plans, and handoff state.
- Do not create Codex-only project rules when a shared rule can live under `docs/01-rules/`.
- If implementation and documentation conflict, stop and resolve the inconsistency before proceeding.

## Before ending a meaningful work session
Update:
- `docs/05-session/SESSION_LOG.md`
- `docs/05-session/CURRENT_STATE.md`
- `docs/05-session/NEXT_ACTIONS.md`
- Any design/decision documents affected by the work

Follow `docs/01-rules/AI_WORKFLOW.md` for the complete workflow.
