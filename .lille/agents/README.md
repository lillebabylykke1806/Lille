# Agents

Definitions for specialized AI agent roles on the Lille project.

Each file can describe:

- **Role** — what the agent owns (e.g. mobile, payments, content)
- **Scope** — directories and concerns in/out of bounds
- **Inputs** — what context to load from `knowledge/` and `docs/`
- **Outputs** — expected artifacts (PR description, test plan, etc.)
- **Handoffs** — when to escalate to another agent or a human

This folder does not execute agents; it only documents how they should behave.
