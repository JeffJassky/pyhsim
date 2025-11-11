# Physim

Physim is an open‑source physiology simulator built with Vue 3 + Vite. It lets you compose a 24‑hour day with interventions (sleep, food, movement, meds, light, etc.), visualize how those actions ripple through neuro‑hormonal baselines, organ loads, and subjective meters, and overlay long‑running phenotypes such as ADHD or Autism.

Every signal, coupling, description, and chart lives in a single registry (`src/models/signals.ts`), so both the UI and the engine consume the same ground truth.

---

## Table of Contents

1. [Features](#features)
2. [Quick Start](#quick-start)
3. [Scripts](#scripts)
4. [Key Concepts](#key-concepts)
5. [Project Structure](#project-structure)
6. [Extending Physim](#extending-physim)
7. [Contributing](#contributing)

---

## Features

- 🎛️ **Timeline Composer** – Drop interventions on a day-long canvas and see their impulse kernels overlaid on signal charts.
- 🧠 **Signal Tabs** – View biologically grouped charts (SCN coupling, neural arousal, endocrine outputs, metabolic states, organ dynamics, subjective meters).
- 🧬 **Profiles** – Toggle ADHD/Autism phenotypes, adjust severity sliders, and immediately see baseline/coupling adjustments applied everywhere.
- 📚 **Rich Metadata** – Every signal and coupling exposes physiology/application notes and references via chart info popovers.
- ⚙️ **Unified Modeling** – Baselines, couplings, descriptions, display hints, and registry metadata all live in `SignalDef` entries, ensuring the UI, worker, and docs stay in sync.

---

## Quick Start

### Prerequisites

- Node.js ≥ 18
- Yarn (classic) – the repo uses Yarn for scripts

### Install dependencies

```bash
yarn install
```

### Run the dev server

```bash
yarn dev
```

This starts Vite on `http://localhost:5173` with hot-module reload.

### Build for production

```bash
yarn build
```

This type-checks (via `vue-tsc`) and outputs a production bundle to `dist/`.

### Preview the production build

```bash
yarn preview
```

### Testing

- `yarn test` – Vitest (unit/component tests, jsdom environment)
- `yarn test:e2e` – Playwright E2E specs (Studio flows, timeline editing)

---

## Scripts

| Command           | Description                                                  |
|-------------------|--------------------------------------------------------------|
| `yarn dev`        | Launch Vite dev server with HMR.                             |
| `yarn build`      | Run type-checker and build production assets.                |
| `yarn preview`    | Serve the built app locally for manual QA.                   |
| `yarn test`       | Run Vitest unit tests.                                       |
| `yarn test:e2e`   | Run Playwright E2E tests (spins up a dev server automatically). |

---

## Key Concepts

### Signal Registry (`src/models/signals.ts`)

Each `SignalDef` entry specifies:

- `semantics` (units, normalization, latency)
- `description` (physiology + application copy)
- `display` hints (tendency, color, ordering)
- `baseline` spec (function, sigmoid, gaussian mix, etc.)
- `couplings` (ResponseSpec + DelaySpec describing influences)

Helpers derive:

- `SIGNAL_LIBRARY` (metadata for UI)
- `SIGNAL_BASELINES` (runtime functions for the worker)
- `SIGNAL_COUPLINGS` (influence matrices)

### Profiles (`src/models/profiles.ts`)

Profiles behave like always-on, parameterizable interventions:

- Each profile defines sliders (e.g., ADHD severity, Autism E/I imbalance) and signal modifiers (baseline amplitude/phase changes, extra couplings).
- The profiles store (`src/stores/profiles.ts`) tracks on/off state + slider values.
- The engine recomputes `profileBaselines`/`profileCouplings` and passes them to the worker so charts update instantly.

### Engine & Worker

- `src/stores/engine.ts` bridges the timeline + interventions + profiles to the worker.
- `src/workers/engine.worker.ts` evaluates baselines (with profile shifts), adds intervention kernels, and applies nonlinear couplings with delays, returning `Float32Array` series to the UI.

### UI Surfaces

- **Studio** (`src/pages/StudioPage.vue`) renders the timeline, charts, inspector, and now the Profiles panel.
- **Intervention Palette** allows quick drag-in of food, stimulants, light, etc.
- **Profile Palette** exposes ADHD/Autism toggles and sliders.

---

## Project Structure

```
src/
├── components/       # Vue components (charts, panels, inspector, timeline, profiles)
├── composables/      # Hooks (engine bridge, meters, heatmap, playhead, etc.)
├── core/             # Serialization helpers for worker payloads
├── models/
│   ├── signals.ts    # SignalDef registry (baselines, couplings, metadata)
│   ├── profiles.ts   # ADHD/Autism profile definitions + adjustment helpers
│   ├── interventions.ts
│   └── weights.ts
├── stores/           # Pinia stores (engine, timeline, profiles, ui, meters, ...)
├── workers/          # engine.worker.ts + kernel preview worker
├── pages/            # Route-level views (Studio, Library, Scenarios)
└── types/            # Shared TypeScript contracts
```

---

## Extending Physim

1. **Add a signal:** Update `SIGNAL_DEFS` with a new `SignalDef` entry and extend `SIGNALS_ALL`.
2. **Add a profile:** Append a `ProfileDef` in `src/models/profiles.ts` with sliders + signal modifiers.
3. **Add an intervention:** Create a new entry in `INTERVENTIONS` with parameter definitions and kernels.
4. **Add metadata:** Because the registry drives both UI & engine, any new physiology (descriptions, couplings, semantics) automatically shows up in charts and info popovers.

Tips:

- Favor declarative baseline specs (`sigmoidCombo`, `gaussianMix`) over ad-hoc functions when possible.
- Document couplings with `description` so users understand the mechanism (the popovers render this text).
- For profiles, keep modifiers proportional to the slider intensity so stacking profiles remains predictable.

---

## Contributing

We welcome physiology nerds, UI enthusiasts, and simulation engineers alike.

1. Fork the repo.
2. `yarn install`
3. Make your changes (add signal defs, interventions, UI improvements, etc.).
4. Run `yarn test` and `yarn build`.
5. Open a PR with screenshots/gifs if possible and cite any physiological references you used.

Bug reports and feature discussions are also welcome via issues. Let us know which signals, interventions, or profiles you’d like to see next!
