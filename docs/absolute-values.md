# Grounding the Simulation: A Strategy for Absolute Values

## Overview
Currently, **Physim** uses a "0.0 to 1.0" normalized scale for most signals. While this is effective for visualization, it lacks the scientific transparency required for high-stakes optimization. To increase user confidence, we must anchor the simulation in **Absolute Biological Units** (mg/dL, pg/mL, nmol/L).

---

## 1. The "Anchor" Strategy (Setting the Baseline)
Instead of 0.5 being "normal," we define the baseline based on clinical reference ranges for a "Standard Subject", or ideally, based on their actual biological profile (age, height, weight, sex, etc).

*   **Current State:** `melatonin` baseline returns `Math.max(0, rise - fall)`.
*   **Proposed State:** `melatonin` baseline returns values in **pg/mL**.
    *   *Night Peak:* ~60–100 pg/mL.
    *   *Day Baseline:* < 5 pg/mL.
*   **Implementation:** Update `SIGNAL_DEFS` in `src/models/signals.ts` to return these raw values. The UI layer will handle the normalization for the charts, but the **Worker** will compute in absolute concentrations.

## 2. Standardizing Units by Signal Group
We will adopt the following standard units across the codebase:

| Group | Signal Example | Standard Unit | Ref. Range (Typical) |
| :--- | :--- | :--- | :--- |
| **Metabolic** | Glucose | **mg/dL** | 70 — 140 |
| **Endocrine** | Cortisol | **µg/dL** | 5 — 25 |
| **Endocrine** | Insulin | **µIU/mL** | 2 — 20 |
| **Neuro** | Dopamine | **nmol/L** | 0.01 — 0.5 |
| **Autonomic** | Blood Pressure | **mmHg** | 90 — 140 (Systolic) |
| **Metabolic** | Ethanol | **g/dL (BAC)** | 0.00 — 0.20 |

## 3. Reference-Based Kernels (Pharmacokinetics)
Currently, kernels use "Magic Normalizers" (e.g., `p.mg / 200`). We will replace these with real Pharmacokinetic (PK) parameters.

*   **Vd (Volume of Distribution):** Expressed in **L/kg**.
*   **Cl (Clearance):** Expressed in **mL/min**.
*   **Example (Caffeine):**
    *   *Current:* `return I * (p.mg/100) * 0.3 * pk;`
    *   *Proposed:* `const concentration = p.mg / (subject.weight * Vd_caffeine);`
    *   *Value:* This allows the simulation to naturally account for how a 50kg person responds to 200mg of caffeine vs. a 100kg person.

## 4. UI Transparency: The "Dual-Value" Display
To maintain the "at-a-glance" utility of the current app while providing depth:
*   **The Chart:** Remains normalized (0–1) so different signals (Glucose vs. Cortisol) can be compared on one axis.
*   **The Tooltip:** Shows both: *"Glucose: 0.82 (115 mg/dL)"*.
*   **The Inspector:** Shows the "Reference Range" context: *"Your predicted Cortisol peak is 22 µg/dL (High-Normal)."*

## 5. User-Guided Calibration (Lab Imports)
The ultimate way to improve accuracy is to let users "pin" the simulation to their real-world lab results.
*   **Feature:** "Calibrate Baseline."
*   **Action:** User enters their latest Fasting Glucose (e.g., 92 mg/dL).
*   **Model Adjustment:** The simulation shifts the entire `glucose` baseline function to intersect with 92 at the 8:00 AM mark.

## 6. Mathematical "Check-Sums" (Mass Balance)
Using absolute units allows us to implement **Conservation of Mass**.
*   **Example:** If a user logs 50g of Carbs, the area under the `glucose` curve (appearance) must mathematically equal 50g (accounting for oxidation and storage).
*   **Confidence Multiplier:** If the math adds up, the model is physically plausible.

---

## Strategic Roadmap for Implementation

1.  **Phase 1 (Interventions):** Update all kernels in `interventions.ts` to use real dosage math (mg per kg of body weight) instead of arbitrary intensity.
2.  **Phase 2 (Signals):** Update `signals.ts` metadata to include `absoluteUnit` and `referenceRange` objects for every signal.
3.  **Phase 3 (The Engine):** Update `engine.worker.ts` to calculate deltas in absolute units and only normalize at the final step before returning to the UI.
4.  **Phase 4 (Validation):** Compare simulation outputs against published PK/PD charts for substances like Caffeine and Adderall to verify "Visual Parity."
