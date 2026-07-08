# Lille — Internal AI Operating System

> **The intelligence system behind the Lille ecosystem.**

Lille OS is the shared intelligence layer for everything we build.

It exists to help AI agents, developers and future team members create a consistent, scalable and world-class parenting platform.

Everything starts here.

This folder is **documentation and workflow infrastructure only**. It does not affect the application runtime, build, or dependencies.

## Purpose

`.lille` is a shared workspace for AI agents and developers working on the Lille project. Use it to store prompts, agent definitions, domain knowledge, templates, and repeatable workflows—without coupling any of this to the Next.js/Capacitor app.

## Structure

| Path | Purpose |
|------|---------|
| `docs/` | Project documentation, architecture notes, decisions |
| `prompts/` | Reusable prompt templates for common tasks |
| `agents/` | Agent role definitions, scopes, and handoff rules |
| `knowledge/` | Domain knowledge (baby care, product, business rules) |
| `templates/` | Issue/PR/spec templates and boilerplate |
| `workflows/` | Step-by-step procedures (releases, onboarding, debugging) |

## Rules

- **Do not** import from `.lille` into `app/`, `android/`, `ios/`, or any runtime code.
- **Do not** add npm dependencies for this folder.
- **Do not** reference `.lille` from `package.json` or build pipelines unless explicitly adding a docs-only step later.

## For humans and agents

When starting work on Lille, read relevant files under `.lille` before making changes. When you learn something durable (architecture, product rule, release step), add or update docs here instead of only leaving it in chat history.
