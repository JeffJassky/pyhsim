# Open Source & Architecture Plan

## 1. Executive Summary

**Goal:** Transform the project into a hybrid open-source ecosystem where the scientific core is community-driven, while the application layer remains proprietary.

**Target Audience:** DIY biohackers, neurodivergent individuals, and chronic illness managers. _Not_ a certified medical device.

**Strategy:** A **Two-Repository** architecture consisting of a public monorepo for the engine/science and a private repository for the application product.

---

## 2. Architecture: The Two-Repo Solution

To satisfy the requirement of "Open Science, Closed App" while maintaining a seamless developer experience, we will split the codebase into two distinct Git repositories.

### Repository A: `physim-engine` (Public Monorepo)

- **Visibility:** Public (MIT / Apache 2.0).
- **Structure:** Monorepo (NPM Workspaces).
- **Entities:**
    - **`@physim/core` (Pure Mathematics)**
        - Engine (ODE Solvers, Bateman PK)
        - Math helpers (RK4, Sigmoids, Gaussians)
        - Units of measurement (Base types)
    - **`@physim/physiology` (Human Biology)**
        - Signal entities (Biomarkers, Circadian, Hormones, Metabolic, Neurotransmitters)
        - Enzymes & Transporters
        - Pathways (Network topology and systems)
    - **`@physim/registry` (Community Catalog)**
        - Subject entities (Demographics, Physiology state)
        - Intervention entities (Drugs, Supplements, Lifestyle)
        - Agent entities (Molecules, Chemicals)
        - Condition entities (ADHD, Depression, etc.)
        - Gene entities (Future expansion)

### Repository B: `physim-studio` (Private Product)

- **Visibility:** Private (Proprietary).
- **Contents:** The Vue.js application, User Profile logic, Cloud Sync, Onboarding, and UI components.
- **Dependency:** Consumes the packages from `kynetic-engine` as standard NPM dependencies (or linked locally for dev).

---

## 3. Developer Experience (The "Linked" Workflow)

How you (the admin) can develop both simultaneously without friction, and ensure AI coding assistants understand the context.

### 1. Workspace Setup (VS Code Multi-Root)

Instead of opening just one folder, you will use a **VS Code Workspace**.

- **Action:** Open `kynetic-studio`, then `File > Add Folder to Workspace...` and select `kynetic-engine`.
- **Benefit:** Side-by-side editing, unified search, and independent Git control for each repo in a single window.

### 2. Local Linking (No Publishing Needed for Dev)

To test changes in the engine immediately within the studio without publishing to NPM:

- **Tooling:** Use `pnpm link` or `npm link`.
- **Flow:**
  ```bash
  cd kynetic-engine/packages/core
  npm link
  cd ../../../kynetic-studio
  npm link @kyneticbio/core
  ```
- **Result:** Changes in the engine are immediately reflected in the app (Hot Module Reloading works across repo boundaries).

### 3. AI & Intellisense Configuration

To ensure tools like Gemini, Claude, and VS Code Intellisense "see" the source code (instead of compiled `.js` in `node_modules`), we configure path mapping in `kynetic-studio/tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@kyneticbio/core/*": ["../kynetic-engine/packages/core/src/*"],
      "@kyneticbio/physiology/*": ["../kynetic-engine/packages/physiology/src/*"],
      "@kyneticbio/registry/*": ["../kynetic-engine/packages/registry/src/*"]
    }
  }
}
```

- **Benefit:** AI tools can trace logic from the UI button click all the way down to the differential equation in the solver, even across repositories.

---

## 4. Package Management & Governance

### Identity & Namespacing

1.  **GitHub Organization:** Create an organization (e.g., `kyneticbio`) to own the `kynetic-engine` repo. This separates the project from your personal account.
2.  **NPM Organization:** Create an organization on npmjs.com (e.g., `kyneticbio`). This is **critical** to own the `@kyneticbio/` namespace.
    - _Note:_ You must register this organization on NPM before publishing.

### Contribution Workflow

- **The Hub:** The `kynetic-engine` GitHub repo is the center for contributions.
- **Pull Requests:** Community members submit PRs to `@kyneticbio/registry` to add new interventions.
- **Quality Control:**
  1.  **Citation Policy:** New interventions must include metadata pointing to a source (paper/databank) for parameters like half-life.
  2.  **Experimental Flags:** Unverified community submissions are flagged (e.g., `tier: 'community'`) so the UI can warn users.
  3.  **Strict Typing:** The `@kyneticbio/core` package enforces types to prevent invalid physics configurations.

---

## 5. Migration Roadmap

### Phase 1: Decouple Engine (COMPLETED)

- **Goal:** Make `src/models/engine` strictly generic.
- **Action:** Refactor `integrateStep` and `runOptimizedV2` to accept `SystemDefinitions` as arguments. Remove all imports of `SIGNALS_ALL` or specific chemicals from the solver files.
- **Outcome:** Successfully refactored `optimized-v2.ts` to be signal-agnostic. Verified with 152 simulation tests. Added a "Human Physiology" wrapper in `src/models/engine/index.ts` to maintain backward compatibility.

### Phase 2: Repository Extraction (COMPLETED)

- **Action:**
  1.  Create the `@physim` monorepo structure locally in `packages/`.
  2.  Move `solvers/` and generic types to `packages/core`.
  3.  Move `signal-definitions/` and human biology logic to `packages/physiology`.
  4.  Move `interventions/` and conditions to `packages/registry`.
- **Outcome:** Standalone packages created and successfully built with `tsc -b`. All simulation tests pass.

### Phase 3: Integration (COMPLETED)

- **Action:** Update the `src/` (Studio) project to remove local model files and import from `@physim/*` packages.
- **Outcome:** Entire UI layer migrated. Verified type safety with `vue-tsc` and resolved runtime issues (Worker DataCloneError, Splitpanes unmount).

### Phase 4: Public Launch

- **Action:**
  1.  Register NPM Org.
  2.  `npm publish` the packages.
  3.  Push `kynetic-engine` to the public GitHub Organization.
  4.  Announce to community.
