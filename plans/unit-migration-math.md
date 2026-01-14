# Unit Migration: Mathematical Verification & Scaling Plan

## Overview
This document details the mathematical transformation required to migrate the simulation engine from arbitrary units ("% baseline") to physiological units (e.g., nM, pg/mL), explicitly accounting for **Subject Variability** (Sex, Weight) and **Clinical Profiles**.

## 1. General Scaling Rules

Let $S$ be the signal value in **Old Units**.
Let $S'$ be the signal value in **New Units**.
Let $\alpha$ be the scaling factor: $S' = \alpha S$.

The governing ODE is:
$$ \frac{dS}{dt} = \frac{Setpoint - S}{\tau} + P - C(S) \cdot S + \sum_{i} \frac{k_{i}}{\tau} \cdot S_{i} $$

We transform to:
$$ \frac{dS'}{dt} = \alpha \frac{dS}{dt} $$

### Transformation Table

| Parameter Type | Symbol | Transformation Rule | Reason |
|---|---|---|---|
| **State / Setpoint** | $S, S_{set}$ | $S' = \alpha S$ | Definition |
| **Time Constant** | $\tau$ | $\tau' = \tau$ | Speed of dynamics is invariant |
| **Production** | $P$ | $P' = \alpha P$ | Zero-order flux must scale with pool size |
| **Clearance (Linear)** | $k_{clear}$ | $k' = k$ | Rate constant ($min^{-1}$) is invariant |
| **Clearance (Saturable)** | $V_{max}, K_m$ | $V'_{max} = \alpha V_{max}, K'_m = \alpha K_m$ | Preserves saturation curve shape |
| **Coupling Strength** | $k_{A \to B}$ | $k' = k \cdot \frac{\alpha_B}{\alpha_A}$ | Preserves relative impact of A on B |
| **Intervention Gain** | $Gain$ | $Gain' = \alpha \cdot Gain$ | External forcing scales with target |

---

## 2. Signal Scaling Factors ($\alpha$) & Subject-Specific Ranges

| Signal | Old Baseline | New Baseline (Target) | Unit | $\alpha$ (Factor) | Notes |
|---|---|---|---|---|---|
| **Dopamine** | 50 | 10 | nM | **0.2** | |
| **Serotonin** | 50 | 5 | nM | **0.1** | |
| **Norepinephrine** | 40 | 250 | pg/mL | **6.25** | |
| **GABA** | 50 | 300 | nM | **6.0** | |
| **Glutamate** | 60 | 5 | µM | **0.0833** | |
| **Acetylcholine** | 40 | 10 | nM | **0.25** | |
| **Cortisol** | 50 | 15 | µg/dL | **0.3** | |
| **Testosterone** | 50 | 600 (M) / 40 (F) | ng/dL | **12.0 (M)** | **Sex-Dependent** |
| **Estradiol** | 50 | 30 (M) / 100* (F) | pg/mL | **2.0** | **Cycle-Dependent** |

* For cycle-dependent hormones, the "Baseline" is a function of cycle day.

---

## 3. Coupling Recalibration Plan

Formula: $k'_{A \to B} = k_{A \to B} \cdot \frac{\alpha_B}{\alpha_A}$

| Source ($A$) | Target ($B$) | Old Strength ($k$) | $\frac{\alpha_B}{\alpha_A}$ Ratio | New Strength ($k'$) |
|---|---|---|---|---|
| **Cortisol** | **Dopamine** | 0.0042 | $0.2 / 0.3 = 0.66$ | **0.0028** |
| **VIP** | **Serotonin** | 0.0016 | $0.1 / 1.0 = 0.1$ | **0.00016** |
| **Cortisol** | **Serotonin** | 0.0028 | $0.1 / 0.3 = 0.33$ | **0.0009** |
| **Cortisol** | **Norepi** | 0.005 | $6.25 / 0.3 = 20.8$ | **0.104** |
| **Orexin** | **Norepi** | 0.008 | $6.25 / 1.0 = 6.25$ | **0.05** |
| **Melatonin** | **GABA** | 0.1 | $6.0 / 1.0 = 6.0$ | **0.6** |
| **Glutamate** | **GABA** | 0.05 | $6.0 / 0.0833 = 72.0$ | **3.6** |
| **Norepi** | **Glutamate** | 0.05 | $0.0833 / 6.25 = 0.013$ | **0.00065** |
| **GABA** | **Glutamate** | 0.1 | $0.0833 / 6.0 = 0.014$ | **0.0014** |
| **Orexin** | **Ach** | 0.15 | $0.25 / 1.0 = 0.25$ | **0.0375** |

---

## 4. Intervention Recalibration & Subject Scaling

### 4.1. Drug Dosage (Pharmacokinetics)
*   **Input:** Dose $D$ (mg).
*   **Formula:** $C_{synaptic} = \frac{D \cdot F}{V_d} \times \text{MappingFactor}$
*   **Scaling:** $V_d$ (Volume of Distribution) is already calculated from `Subject.weight` and `Physiology`.
*   **Action:** Ensure all drug `pk.volume` parameters are set correctly.

### 4.2. Intervention Gain (Pharmacodynamics)
$Gain' = \alpha_{target} \cdot Gain$

| Intervention | Target | Old Gain | $\alpha$ | New Gain |
|---|---|---|---|---|
| **Caffeine** | Dopamine | 30.0 | 0.2 | **6.0 nM** |
| **SSRI** | Serotonin | 50.0 | 0.1 | **5.0 nM** |
| **Exercise** | Norepi | 45.0 | 6.25 | **281 pg/mL** |
| **Cold Plunge** | Dopamine | 60.0 | 0.2 | **12.0 nM** |

---

## 5. Clinical Profile Integration

Profiles (ADHD, Depression) apply multipliers to **Receptor Density** ($R$) and **Transporter Activity** ($A$).

### Governing Equation with Modifiers:
$$ \frac{dS}{dt} = \dots - (k_{clear} \cdot \mathbf{A_{transporter}}) \cdot S + (k_{coupling} \cdot S_{source} \cdot \mathbf{R_{density}}) $$

### Examples:

**1. ADHD (High Severity):**
*   **Modifier:** `DAT activity = +40%` ($\mathbf{A} = 1.4$)
*   **Old Logic:** Baseline Dopamine drops from 50 -> ~35.
*   **New Logic:** Baseline Dopamine drops from 10 nM -> ~7.1 nM.
*   **Verification:** $\frac{Rate_{prod}}{k_{clear} \times 1.4} = \frac{10 \cdot k_{clear}}{k_{clear} \times 1.4} \approx 7.14$. (Correct behavior maintained).

**2. Depression (High Severity):**
*   **Modifier:** `5HT2A density = +15%` ($\mathbf{R} = 1.15$), `SERT activity = +20%` ($\mathbf{A} = 1.2$).
*   **Effect:**
    *   Serotonin Baseline: Drops due to higher clearance ($1.2x$). $5 \text{ nM} \to 4.16 \text{ nM}$.
    *   Downstream Coupling: Signals stimulated by Serotonin via 5HT2A receive $0.83 \text{ (conc)} \times 1.15 \text{ (receptor)} \approx 0.95x$ stimulation.
    *   **Result:** Blunted signaling despite receptor upregulation (compensatory mechanism modeled correctly).

---

## Execution Checklist

1.  **Phase 1 & 2:** Define types and documentation (no math changes).
2.  **Phase 4 Prep:** Create a `UNIT_SCALARS` constant map in code to prevent magic numbers.
3.  **Phase 4 Execution:**
    *   Update `setpoint` functions.
    *   Update `min`/`max`.
    *   Update `production` coefficients.
    *   Update `couplings` strengths using the table above.
    *   Update `interventions` library gains.