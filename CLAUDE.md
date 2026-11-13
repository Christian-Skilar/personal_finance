# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

Personal finance app for Norway (Norwegian only: language, NOK, rules). v1 = debt module
(loans/credit, repayment plans, plan vs. actual, what-if, avalanche/snowball, interest deduction).
Installable PWA used on the owner's Android phone. Single user, all data local (IndexedDB), no server.

- Spec: `docs/superpowers/specs/2026-11-13-gjeld-v1-design.md`
- Plan: `docs/superpowers/plans/2026-11-13-gjeld-v1.md`
- Research: `docs/research/`

## Stack & commands

TypeScript, React 19, Vite, React Router (HashRouter), Dexie (IndexedDB), vite-plugin-pwa, Vitest + jsdom + Testing Library + fake-indexeddb.
Node is installed at `C:\Program Files\nodejs` (in Git Bash: `export PATH="/c/Program Files/nodejs:$PATH"`).

- `npm test` — run all tests once
- `npm run dev` — dev server
- `npm run build` — typecheck + production build to `dist/`
- `npm run typecheck`

## Structure

- `src/domain/` — pure calculation logic, no React, no DB. Must never import from `data/` or `ui/`.
- `src/data/` — Dexie database, repositories, backup.
- `src/ui/` — React screens, all text in Norwegian (bokmål).
- `src/config/` — tax rates per year.

## Rules

- **Money is stored as integer øre** (`Ore`), never float kroner. **Rates are integer hundredths of a percent** (5,20 % = `520`).
- Months are `"YYYY-MM"`, dates `"YYYY-MM-DD"`.
- All repayment plans go through `buildSchedule` in `src/domain/loan-schedule.ts`.
- Formatting via `Intl` with `nb-NO`.
- TDD: write the failing test first.
- **Never commit real financial data or secrets.** Use synthetic data in tests.

## Git

- Remote: `origin` → https://github.com/Christian-Skilar/personal_finance.git
- Default branch: `main`
