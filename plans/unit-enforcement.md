# Unit Enforcement Plan

## Goal

Enforce proper physiological units throughout the system with minimal code changes, while ensuring full support for:

1.  **Subject Variability:** Sex, weight, age, and menstrual cycle dynamics.
2.  **Clinical Profiles:** ADHD, Autism, Depression, Anxiety, etc.
3.  **Intervention Specifics:** Exact dosages (mg), intensities, and environmental parameters.

---

## Current State vs. Target State

| Signal            | Current Unit | Target Unit | Reference Range (Healthy)  | Notes                   |
| ----------------- | ------------ | ----------- | -------------------------- | ----------------------- |
| **Dopamine**      | % baseline   | **nM**      | 5 - 20 nM                  | Synaptic/Extracellular  |
| **Serotonin**     | % baseline   | **nM**      | 1 - 10 nM                  | Extracellular           |
| **Norepi**        | % baseline   | **pg/mL**   | 100 - 400 pg/mL            | Plasma / Synaptic proxy |
| **GABA**          | % baseline   | **nM**      | 100 - 500 nM               | Extracellular           |
| **Glutamate**     | % baseline   | **µM**      | 1 - 10 µM                  | Extracellular           |
| **Acetylcholine** | % baseline   | **nM**      | 1 - 20 nM                  | Extracellular           |
| **Cortisol**      | µg/dL        | **µg/dL**   | 5 - 25 µg/dL               | **Already Correct**     |
| **Estradiol**     | a.u.         | **pg/mL**   | 20 - 400 pg/mL             | Cycle-dependent         |
| **Progesterone**  | a.u.         | **ng/mL**   | 0.5 - 20 ng/mL             | Cycle-dependent         |
| **Testosterone**  | a.u.         | **ng/dL**   | 300 - 1000 (M) / 15-70 (F) | Sex-dependent           |

---

## Holistic Integration Strategy

### 1. The Core Unit System (Static Type Safety)

We use the `PhysiologicalUnit` type union (already implemented in `src/types/units.ts`) to enforce compile-time correctness.

```typescript
type PhysiologicalUnit = 'nM' | 'pg/mL' | 'mg/dL' | 'µM' | ...;
```

### 2. Subject Variability (Physiology Engine)

Endogenous homeostatic setpoints (e.g., "Target Dopamine = 10nM") are generally **concentration-conserved** across body sizes. A 50kg human and 100kg human both regulate synapses to ~10nM.

However, **Pharmacokinetics (PK)** of interventions _must_ scale with body size.

- **Volume of Distribution ($V_d$):** Calculated from `Subject.weight` and `Physiology.tbw` / `lbm`.
- **Clearance ($Cl$):** Scaled by `Physiology.drugClearance` (renal/hepatic function).

**Implementation:**
The `ode-solver.ts` already calculates $V_d$ dynamically. We will ensure all interventions use `pk.volume` definitions that reference body properties (e.g., `{ kind: 'lbm', base_L_kg: 2.0 }` for hydrophilic drugs).

### 3. Menstrual Cycle Integration

The `Subject` model tracks `cycleDay`. We currently have `getMenstrualHormones(day)` returning normalized `0-1` values.

**Migration:**
We will map these normalized curves to physical ranges in `signal-definitions/hormones.ts`:

```typescript
// Example for Estrogen
setpoint: (ctx) => {
  const norm = getMenstrualHormones(ctx.subject.cycleDay).estrogen; // 0..1
  const min = 20;  // pg/mL (Follicular base)
  const max = 400; // pg/mL (Pre-ovulatory peak)
  return min + (max - min) * norm;
}
```

### 4. Clinical Profiles (Neurodivergence & Conditions)

Conditions like ADHD, Depression, etc., are defined in `src/models/profiles.ts` using **Mechanistic Modifiers**:

- `receptorModifiers` (Density/Sensitivity)
- `transporterModifiers` (Activity)

**Integration with Units:**
These multipliers will apply directly to the new physical constants in the ODE solver.

- **Example: ADHD Profile (`DAT` activity +40%)**
  - **Baseline:** `Dopamine` clearance rate via DAT = $0.002 \text{ min}^{-1}$ (calibrated to maintain 10nM).
  - **Effect:** New rate = $0.002 \times (1.0 + 0.4) = 0.0028 \text{ min}^{-1}$.
  - **Result:** Equilibrium Dopamine drops from 10nM to $\approx 7.1 \text{ nM}$.
  - **No Code Change Required:** The solver logic `rate = clear.rate * enzymeActivity` already handles this, provided `enzymeActivity` is initialized from the profile.

---

## Phased Migration Plan

### Phase 1: Type System (Done)

- Created `src/types/units.ts`.
- Updated `SignalDefinition` to use `PhysiologicalUnit`.

### Phase 2: Signal Documentation & Conversion Logic (Immediate)

1.  Create `src/models/unified/signal-units.ts`.
2.  Define `SIGNAL_UNITS` with specific ranges for Men/Women where applicable.
3.  Define `UNIT_CONVERSIONS` map.

### Phase 3: Display-Layer Migration (Safe)

1.  Update `InspectorPanel.vue` and `SignalChart.vue`.
2.  Use `UNIT_CONVERSIONS` to scale the raw "Arbitrary" values to "Displayed Physical" values.
3.  _User Experience:_ Users immediately see "10 nM" instead of "50%", even though the engine is still running on "50".

### Phase 4: Internal Engine Migration (The "Math" Update)

**Per-Signal Transition:**

1.  **Refactor Definition:** Update `setpoint`, `min`, `max` to physical values.
2.  **Refactor Couplings:** Scale coupling strengths by $\alpha_{target} / \alpha_{source}$.
3.  **Refactor Interventions:** Scale `intrinsicEfficacy` in `interventions/*.ts`.
4.  **Verify:** Run test suite to ensure dynamics (rise time, decay) remain identical, just scaled.

---

## Risk Mitigation: The "Dual-Mode" Solver

During Phase 4, we can add a flag to `SignalDefinition`: `isPhysical: boolean`.

- If `true`, the solver treats values as physical (nM).
- If `false`, it treats them as arbitrary (0-100).
- This allows migrating signals **one by one** (e.g., migrate Dopamine first, leave others alone) without breaking the whole network.
