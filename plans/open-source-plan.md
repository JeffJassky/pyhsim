# Open Source & Architecture Plan

## 1. Executive Summary

**Goal:** Transform the project into a hybrid open-source ecosystem where the scientific core is community-driven, while the application layer remains proprietary.

**Target Audience:** DIY biohackers, neurodivergent individuals, and chronic illness managers. *Not* a certified medical device.

**Strategy:** A **Two-Repository** architecture consisting of a public monorepo for the engine/science and a private repository for the application product.

---

## 2. Architecture: The Two-Repo Solution

To satisfy the requirement of "Open Science, Closed App" while maintaining a seamless developer experience, we will split the codebase into two distinct Git repositories.

### Repository A: `kynetic-engine` (Public Monorepo)
*   **Visibility:** Public (MIT / Apache 2.0).
*   **Structure:** Monorepo (using PNPM Workspaces).
*   **Contents:**
    1.  **`@kyneticbio/core`**: The pure mathematical solver (RK4, Bateman PK), vector logic, and generic types. *Signal-agnostic.*
    2.  **`@kyneticbio/physiology`**: The "Standard Library" of human biology. Defines specific signals (Dopamine, Cortisol), their network topology, and default parameters.
    3.  **`@kyneticbio/registry`**: The community catalog of interventions (Supplements, Drugs) and Conditions (ADHD, etc.).

### Repository B: `kynetic-studio` (Private Product)
*   **Visibility:** Private (Proprietary).
*   **Contents:** The Vue.js application, User Profile logic, Cloud Sync, Onboarding, and UI components.
*   **Dependency:** Consumes the packages from `kynetic-engine` as standard NPM dependencies (or linked locally for dev).

---

## 3. Developer Experience (The "Linked" Workflow)

How you (the admin) can develop both simultaneously without friction, and ensure AI coding assistants understand the context.

### 1. Workspace Setup (VS Code Multi-Root)
Instead of opening just one folder, you will use a **VS Code Workspace**.
*   **Action:** Open `kynetic-studio`, then `File > Add Folder to Workspace...` and select `kynetic-engine`.
*   **Benefit:** Side-by-side editing, unified search, and independent Git control for each repo in a single window.

### 2. Local Linking (No Publishing Needed for Dev)
To test changes in the engine immediately within the studio without publishing to NPM:
*   **Tooling:** Use `pnpm link` or `npm link`.
*   **Flow:**
    ```bash
    cd kynetic-engine/packages/core
    npm link
    cd ../../../kynetic-studio
    npm link @kyneticbio/core
    ```
*   **Result:** Changes in the engine are immediately reflected in the app (Hot Module Reloading works across repo boundaries).

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
*   **Benefit:** AI tools can trace logic from the UI button click all the way down to the differential equation in the solver, even across repositories.

---

## 4. Package Management & Governance

### Identity & Namespacing
1.  **GitHub Organization:** Create an organization (e.g., `kyneticbio`) to own the `kynetic-engine` repo. This separates the project from your personal account.
2.  **NPM Organization:** Create an organization on npmjs.com (e.g., `kyneticbio`). This is **critical** to own the `@kyneticbio/` namespace.
    *   *Note:* You must register this organization on NPM before publishing.

### Contribution Workflow
*   **The Hub:** The `kynetic-engine` GitHub repo is the center for contributions.
*   **Pull Requests:** Community members submit PRs to `@kyneticbio/registry` to add new interventions.
*   **Quality Control:**
    1.  **Citation Policy:** New interventions must include metadata pointing to a source (paper/databank) for parameters like half-life.
    2.  **Experimental Flags:** Unverified community submissions are flagged (e.g., `tier: 'community'`) so the UI can warn users.
    3.  **Strict Typing:** The `@kyneticbio/core` package enforces types to prevent invalid physics configurations.

---

## 5. Migration Roadmap

### Phase 1: Decouple Engine (Current Task)
*   **Goal:** Make `src/models/engine` strictly generic.
*   **Action:** Refactor `integrateStep` and `runOptimizedV2` to accept `SystemDefinitions` as arguments. Remove all imports of `SIGNALS_ALL` or specific chemicals from the solver files.
*   **Output:** A solver that can simulate *any* defined system, not just the hardcoded one.

### Phase 2: Repository Extraction
*   **Action:**
    1.  Create the `kynetic-engine` monorepo structure locally.
    2.  Move `solvers/` to `packages/core`.
    3.  Move `signal-definitions/` to `packages/physiology`.
    4.  Move `interventions/` to `packages/registry`.
*   **Setup:** Configure `package.json` exports and TypeScript project references.

### Phase 3: Integration
*   **Action:** Update the existing `kynetic-studio` project to remove the local models and instead import from the (locally linked) new packages.
*   **Config:** Apply the `tsconfig.json` path mappings.

### Phase 4: Public Launch
*   **Action:**
    1.  Register NPM Org.
    2.  `npm publish` the packages.
    3.  Push `kynetic-engine` to the public GitHub Organization.
    4.  Announce to community.