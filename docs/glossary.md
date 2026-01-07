# Physiological Modeling Glossary

This glossary defines key terms used throughout the physim codebase, ensuring alignment between developers and the scientific literature.

---

## Pharmacokinetics (PK)

### Absorption

| Term | Symbol | Unit | Definition |
|------|--------|------|------------|
| **Bioavailability** | F | 0..1 | Fraction of administered dose reaching systemic circulation |
| **Absorption Rate Constant** | k_a | 1/min | First-order rate constant for drug absorption |
| **Time to Peak** | t_max | min | Time from dosing to maximum plasma concentration |
| **Lag Time** | t_lag | min | Delay before absorption begins (gastric emptying) |

### Distribution

| Term | Symbol | Unit | Definition |
|------|--------|------|------------|
| **Volume of Distribution** | Vd | L or L/kg | Apparent volume into which drug distributes |
| **Plasma Concentration** | Cp | ng/mL, µg/mL, or nM | Drug concentration in plasma |
| **Protein Binding** | fu | 0..1 | Fraction unbound (free drug) |

### Elimination

| Term | Symbol | Unit | Definition |
|------|--------|------|------------|
| **Clearance** | CL | L/hr or mL/min | Volume of plasma cleared per unit time |
| **Elimination Rate Constant** | k_e | 1/min | First-order rate constant for elimination |
| **Half-life** | t½ | min or hr | Time for concentration to decrease by 50% |
| **Hepatic Extraction Ratio** | E | 0..1 | Fraction removed per pass through liver |

### Key Equations

```
# First-order elimination
C(t) = C₀ × e^(-k_e × t)

# Half-life relationship
t½ = ln(2) / k_e = 0.693 / k_e

# One-compartment oral dosing (Bateman equation)
C(t) = (F × Dose × k_a) / (Vd × (k_a - k_e)) × (e^(-k_e×t) - e^(-k_a×t))

# Clearance-Volume relationship
k_e = CL / Vd
```

---

## Pharmacodynamics (PD)

### Receptor Theory

| Term | Symbol | Unit | Definition |
|------|--------|------|------------|
| **Dissociation Constant** | Kd | nM or µM | Concentration at 50% receptor occupancy (lower = higher affinity) |
| **Inhibition Constant** | Ki | nM | Affinity of an antagonist/inhibitor |
| **Maximum Receptor Density** | Bmax | fmol/mg | Total receptor concentration |
| **Receptor Occupancy** | ρ | 0..1 | Fraction of receptors bound by ligand |

### Effect Parameters

| Term | Symbol | Unit | Definition |
|------|--------|------|------------|
| **Maximum Effect** | Emax | varies | Maximum achievable effect |
| **Potency** | EC₅₀ | nM | Concentration producing 50% of Emax |
| **Inhibitory Potency** | IC₅₀ | nM | Concentration producing 50% inhibition |
| **Hill Coefficient** | n | dimensionless | Steepness of dose-response curve |
| **Efficacy** | τ (tau) | dimensionless | Intrinsic activity of an agonist |

### Receptor Occupancy Models

```
# Simple occupancy
ρ = [L] / ([L] + Kd)

# Hill equation
E = Emax × [L]ⁿ / (EC₅₀ⁿ + [L]ⁿ)

# Operational model of agonism (Black & Leff)
E = (Emax × τ × [L]) / ((τ + 1) × [L] + Kd)

# Competitive antagonism (Schild equation)
Apparent_EC₅₀ = EC₅₀ × (1 + [Antagonist] / Ki)
```

---

## Receptor Types

### Dopaminergic System

| Receptor | Location | Function | Relevance |
|----------|----------|----------|-----------|
| **D1** | Striatum, PFC | Excitatory, learning | Reward, motivation |
| **D2** | Striatum, VTA | Inhibitory, autoreceptor | Antipsychotic target |
| **D3** | Limbic | Modulation | Addiction, mood |
| **DAT** | Presynaptic | Reuptake transporter | Stimulant target |

### Serotonergic System

| Receptor | Location | Function | Relevance |
|----------|----------|----------|-----------|
| **5-HT1A** | Raphe, hippocampus | Autoreceptor, anxiolytic | Antidepressant target |
| **5-HT2A** | Cortex | Excitatory | Psychedelics, atypical antipsychotics |
| **5-HT2C** | Hypothalamus | Feeding, anxiety | Weight, mood |
| **SERT** | Presynaptic | Reuptake transporter | SSRI target |

### GABAergic System

| Receptor | Location | Function | Relevance |
|----------|----------|----------|-----------|
| **GABA-A** | Widespread | Fast inhibition (Cl⁻ channel) | Benzos, alcohol, anesthetics |
| **GABA-B** | Presynaptic | Slow inhibition (G-protein) | Baclofen, GHB |
| **GAT-1** | Presynaptic | Reuptake transporter | Tiagabine |

### Adrenergic System

| Receptor | Location | Function | Relevance |
|----------|----------|----------|-----------|
| **α1** | Smooth muscle | Vasoconstriction | Blood pressure |
| **α2** | Presynaptic | Autoreceptor, sedation | Clonidine, dexmedetomidine |
| **β1** | Heart | Chronotropic, inotropic | Beta-blockers |
| **NET** | Presynaptic | NE reuptake | SNRIs, atomoxetine |

---

## Homeostasis & Control Theory

| Term | Definition |
|------|------------|
| **Setpoint** | Target value the system regulates toward |
| **Error Signal** | Difference between current state and setpoint |
| **Negative Feedback** | Error correction that opposes deviation |
| **Allostasis** | Adaptation of setpoint based on predicted demands |
| **Allostatic Load** | Cumulative cost of chronic stress adaptation |

### Glucose-Insulin Homeostasis

| Term | Symbol | Unit | Definition |
|------|--------|------|------------|
| **Fasting Glucose** | G₀ | mg/dL | Baseline glucose (70-100 normal) |
| **Fasting Insulin** | I₀ | µIU/mL | Baseline insulin (5-15 normal) |
| **Insulin Sensitivity** | Si | (min⁻¹)/(µIU/mL) | Insulin's glucose-lowering effect |
| **Glucose Effectiveness** | Sg | min⁻¹ | Glucose-mediated glucose disposal |
| **HOMA-IR** | — | dimensionless | Homeostatic Model Assessment of Insulin Resistance |

### Sleep Homeostasis (Two-Process Model)

| Term | Symbol | Definition |
|------|--------|------------|
| **Process S** | S | Homeostatic sleep pressure (adenosine accumulation) |
| **Process C** | C | Circadian alertness signal |
| **Sleep Propensity** | — | S - C (higher = more sleepy) |

---

## Signal Processing

| Term | Definition |
|------|------------|
| **Baseline** | Endogenous circadian rhythm of a signal |
| **Kernel** | Impulse response function for interventions |
| **Coupling** | Influence of one signal on another (causal relationship) |
| **Delay** | Temporal lag in coupling effects |
| **Saturation** | Non-linear ceiling effect at high signal levels |

### Response Specifications (in code)

```typescript
// Linear: y = gain × x
{ kind: 'linear', gain: 0.5 }

// Hill (saturation): y = Emax × xⁿ / (EC₅₀ⁿ + xⁿ)
{ kind: 'hill', Emax: 1.0, EC50: 0.5, n: 1.4 }

// Inverse Hill (inhibition): y = Imax × IC₅₀ⁿ / (IC₅₀ⁿ + xⁿ)
{ kind: 'ihill', Imax: 1.0, IC50: 0.5, n: 1.4 }

// Logistic: y = L / (1 + e^(-k×(x - x₀)))
{ kind: 'logistic', L: 1.0, k: 4.0, x0: 0.5 }
```

---

## Units & Conventions

### Concentration Units

| Unit | Conversion | Typical Use |
|------|------------|-------------|
| **nM** (nanomolar) | 10⁻⁹ M | Ki, Kd values |
| **µM** (micromolar) | 10⁻⁶ M | High-affinity binding |
| **ng/mL** | — | Plasma drug levels |
| **µg/dL** | — | Cortisol |
| **mg/dL** | — | Glucose |
| **µIU/mL** | — | Insulin |
| **pg/mL** | — | Melatonin, hormones |

### Time Units in Code

| Context | Unit |
|---------|------|
| Simulation grid | minutes |
| PK rate constants | 1/min |
| Half-lives | minutes (in code), hours (in literature) |
| Circadian phase | minutes from midnight |

### Signal Units

The engine operates in two modes:

1. **Normalized (0..1)**: For signals without clear physical units (e.g., "mood", "focus")
2. **Absolute**: For physiologically meaningful concentrations (e.g., glucose in mg/dL)

Each signal's `semantics.referenceRange` defines the expected physiological range for UI normalization.

---

## Code Architecture Terms

| Term | Definition |
|------|------------|
| **Signal** | A time-varying physiological quantity (neurotransmitter, hormone, metabolite) |
| **Intervention** | A user-initiated event that modifies signals (meal, supplement, activity) |
| **PharmacologyDef** | Structured definition of a molecule's PK/PD properties |
| **Kernel** | Mathematical function computing intervention effects over time |
| **Profile** | Neurophysiological phenotype (ADHD, autism) modeled via receptor/transporter changes |
| **Physiology** | Subject-derived parameters (GFR, liver blood flow, metabolic capacity) |

---

## References

1. **Rowland M, Tozer TN.** *Clinical Pharmacokinetics and Pharmacodynamics.* 5th ed. Lippincott Williams & Wilkins; 2019.

2. **Kenakin T.** *A Pharmacology Primer.* 5th ed. Academic Press; 2019.

3. **Bergman RN et al.** Physiologic evaluation of factors controlling glucose tolerance in man. *J Clin Invest.* 1981;68(6):1456-1467.

4. **Borbély AA.** A two process model of sleep regulation. *Hum Neurobiol.* 1982;1(3):195-204.

5. **Black JW, Leff P.** Operational models of pharmacological agonism. *Proc R Soc Lond B.* 1983;220(1219):141-162.
