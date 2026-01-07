# Physiologically Based System Modeling: Migration Strategy

## 1. Executive Summary
The current modelling engine relies on **phenomenological superposition**: analytical baselines (Gaussian/Sigmoid curves) representing circadian rhythms are summed with pre-calculated "kernels" (impulse responses) from interventions. While computationally efficient and visually controllable, this approach lacks mechanistic depth. It cannot natively simulate **homeostasis**, **tolerance/down-regulation**, **competitive binding**, or **non-linear feedback loops** without ad-hoc scripting.

To align with modern systems biology and quantitative systems pharmacology (QSP), the engine should migrate toward a **Mechanistic / Semi-Mechanistic** architecture. This document outlines the strategy for this migration.

---

## 2. Current Architecture Analysis

### Strengths
*   **Determinism:** Signals are functions of time $S(t)$. Computation is O(1) for any point in time.
*   **Editability:** "Vibes-based" tuning allows for rapid adjustment of curves to match intuition or textbook illustrations.
*   **Simplicity:** No need for numerical solvers (Runge-Kutta); no stability issues.

### Limitations
*   **Linear Superposition:** `Baseline + Effect A + Effect B` assumes effects are additive. In biology, effects often saturate (Emax) or compete.
*   **Lack of State:** The system has no "memory" of previous states other than what is encoded in fixed kernel decays. It cannot easily model "depletion" (e.g., neurotransmitter exhaustion) or "tolerance" (receptor downregulation over days).
*   **Arbitrary Units:** Many signals use `0-100` or arbitrary scalars, making integration with literature data (e.g., $K_d$ values, Clearance in L/hr) difficult.

---

## 3. Scientific Pillars of the New Architecture

We propose a layered migration:

### Phase 1: Physiologically Based Pharmacokinetics (PBPK) Lite
*Current state: Hardcoded `k_a`, `k_e` in kernels.*

**Migration:**
1.  **Subject-Specific Parameters:** Derive clearance (CL) and volume of distribution ($V_d$) from `Subject` attributes (Weight, Height, Age, Sex, Organ Function).
    *   *Example:* Alcohol clearance should strictly follow Michaelis-Menten kinetics (zero-order at high concentrations) scaled by liver mass/function.
2.  **Compartmental Models:** Replace generic `pk1` helpers with explicit `OneCompartment` or `TwoCompartment` classes.
    *   **Input:** Dose (mg).
    *   **System:** $V_d$ (L), $CL$ (L/hr).
    *   **Output:** Plasma Concentration ($C_p$).

### Phase 2: Receptor-Occupancy Pharmacodynamics (PD)
*Current state: `Hill` functions applied to dose scalars.*

**Migration:**
1.  **Concentration-Effect Relationship:** Drive effects using *Calculated Concentration* (from Phase 1) rather than "Dose".
2.  **Receptor Theory:**
    *   Define **Receptors** (e.g., $D_2$, $5-HT_{2A}$) with specific densities ($B_{max}$). 
    *   Define **Ligands** with affinity ($K_d$) and efficacy ($	au$).
    *   **Occupancy:** Calculate fractional occupancy: $ho = \frac{[L]}{[L] + K_d}$.
    *   **Operational Model:** Effect $E = \frac{E_{max} \cdot \tau \cdot [L]}{(\tau + 1) [L] + K_d}$ (allows modeling partial agonists and spare receptors).

### Phase 3: Homeostatic Feedback (Control Systems)
*Current state: Linear coupling (`source: 'insulin', mapping: linear(-1.5)`).*

**Migration:**
1.  **Setpoints vs. Baselines:** Treat the circadian baseline as a "moving setpoint" rather than the final value.
2.  **Error Correction:** The system should generate "Control Signals" to reduce the error between *Current State* and *Setpoint*.
    *   *Example:* Instead of `Insulin = Baseline + Meal_Response`, model `d(Glucose)/dt = Appearance - Insulin_Mediated_Uptake`.
3.  **Numerical Integration:** This requires moving from analytical evaluation $f(t)$ to a time-stepping solver (e.g., `step(dt)`).
    *   *Trade-off:* We lose random-access time travel (cannot jump to $t=1000$ without calculating $0..999$), but gain true emergent behavior.

---

## 4. Implementation Roadmap

### Step 1: Standardization & Metadata (Low Hanging Fruit)
Refactor `src/models/signals.ts` and `interventions.ts`.
*   **Action:** Enforce standard SI units or clinical units (ng/mL, IU/L) for all signals.
*   **Action:** Add `molarMass` to interventions to allow conversion from mg $	o$ mmol.

### Step 2: The "Physiology" Context
Expand `src/models/subject.ts`.
*   **Action:** Implement estimators for:
    *   Liver Blood Flow ($Q_H$)
    *   GFR (Kidney function)
    *   Lean Body Mass (LBM) vs Adipose Mass.
*   **Action:** Pass this `PhysiologyContext` into every kernel evaluation.

### Step 3: Refactoring Interventions
Refactor `src/models/interventions.ts`.
*   **Current:** `fn: "function(t,p,I){ ... pk1(...) ... }"`
*   **Proposed Structure:**
    ```typescript
    interface PharmacologyDef {
      molecule: {
        name: "Caffeine";
        molarMass: 194.19;
        pK_a: 14.0;
        logP: -0.07;
      };
      pk: {
        model: "1-compartment";
        bioavailability: 0.99;
        absorptionRate: number; // or formula based on p
        clearance: (phys: Physiology) => number; // L/hr
        volumeDist: (phys: Physiology) => number; // L/kg
      };
      pd: {
        target: "Adenosine_A2a";
        mechanism: "antagonist";
        Ki: 15; // nM
      }[];
    }
    ```

### Step 4: The Hybrid Solver
To maintain performance while adding depth:
1.  Keep **Circadian Baselines** as analytical curves (the "feed-forward" driver).
2.  Run a **lightweight ODE solver** on top for fast-moving metabolic pools (Glucose/Insulin) and receptor states.
3.  Use **Analytical PK** (superposition) for drugs, as linear PK is solved analytically.

## 5. Specific Codebase Actions

1.  **Refactor `interventions.ts`**:
    *   Extract the `Hill` and `pk1` logic into a dedicated `Pharmacokinetics` class.
    *   Remove hardcoded magic numbers (e.g., `1/60`, `30.0`) and replace them with named constants representing biological half-lives.

2.  **Refactor `profiles.ts`**:
    *   Instead of `amplitudeGain` on a signal, apply `sensitivityChange` to a **Receptor**.
    *   Example: ADHD isn't just "low dopamine signal"; it's "high DAT clearance" or "low D2 sensitivity".

3.  **Documentation**:
    *   Create a `glossary.md` defining $K_d$, $EC_{50}$, $t_{1/2}$, Clearance, etc., to ensure developer alignment.
