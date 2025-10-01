# Algorithmic Music (MVP)

Minimal web-based algorithmic music generator built with React + TypeScript following a strict TDD workflow.

## Quick Start

- Node 18+
- Install deps: `npm install`
- Run tests (with coverage): `npm run test:unit`
- Type check: `npm run typecheck`
- Dev server: `npm run dev`

## TDD Workflow

1. Write failing tests capturing acceptance criteria.
2. Implement minimal code to pass tests.
3. Refactor with tests green.

## Current Status

- Engines implemented with deterministic seeding and tests: Markov, Cellular Automata, L-Systems, Generative Grammar, Stochastic, Euclidean Rhythms.
- Storage: Memory + IndexedDB history adapters with a 20-item cap and tests.

## Scripts

- `npm run dev` — Vite dev server.
- `npm run test:unit` — Vitest run with coverage.
- `npm run typecheck` — TypeScript type check.
