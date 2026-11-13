# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

Personal finance app for Norway (Norwegian only: language, NOK, rules). v1 = debt module
(loans/credit, repayment plans, plan vs. actual, what-if, avalanche/snowball, interest deduction).
Installable PWA used on the owner's Android phone. Single user, all data local (IndexedDB), no server.

- Spec: `docs/superpowers/specs/2026-11-13-gjeld-v1-design.md`
- Plan: `docs/superpowers/plans/2026-11-13-gjeld-v1.md`
- Research: `docs/research/` (start notes + analyses of the repos securo, actual, finlynq)
- Screen mockups (design canvas): https://claude.ai/artifact/U36JzyXBkdvSRmRm4SjFEh
- Android test checklist + Cloudflare deploy steps: `docs/android-sjekkliste.md`

Roadmap: 1) Gjeld (debt) ✅ v1 built → 2) Nettoformue (assets + value history minus debt) → 3) Budsjett (plan vs. actual per category/month).

## Status (last updated 2026-11-13)

**Done:** Debt module v1 is fully built, reviewed and merged to `main` (93 tests green, build OK, pushed).
Screens: Oversikt, Lån (list + closed loans/reopen), Lån-detalj, Nytt/rediger lån, Månedlig oppdatering,
Hva om, Gjeldfri-plan (skred/snøball), Backup (Innstillinger). Branch `gjeld-v1` still exists (merged; can be deleted).

**Next session — start here:**
1. Owner connects the GitHub repo to Cloudflare Pages (steps in `docs/android-sjekkliste.md`), installs the app on the Android phone and runs the checklist. Fix whatever the phone test reveals.
2. Verify the interest deduction rate (22 % for 2026) against Skatteetaten; rates live in `src/config/satser.ts`.
3. Deferred minors from the final review (pick as needed):
   - Extra payments + a future rate change: payment is recomputed over the original term (drops) instead of shortening the term (`loan-schedule.ts`).
   - PayoffPlan: "tidligere enn uten ekstra" text is wrong when the baseline never finishes; total interest not shown.
   - Validation errors are not focused/scrolled into view on save (LoanForm, MonthlyUpdate).
   - No deviation warning when the plan expects 0 (MonthlyUpdate).
   - `useLoans` has no error handling — a DB load error leaves a blank screen.
   - Settings download fallback revokes the object URL immediately (defer with setTimeout).
   - `Date.parse` accepts impossible dates like 2026-02-31 (validate.ts, format.ts `isIsoDate`).
   - A mistyped rate change cannot be edited or deleted.
4. Then: brainstorm + spec for module 2, Nettoformue (same process: brainstorm → spec → mockup → plan → TDD build → review).

**Key decisions already made (don't re-litigate):** Norway-only; single user; Android PWA; data local only, no server, no bank integration
(manual monthly entry); no code copied from AGPL repos (Securo, Finlynq) — Actual (MIT) may be reused with attribution; monthly balance entry
means "after that month's payment"; edit mode changes rate only via rate history; closed loans are hidden from totals but can be reopened.

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
