# PhySim Scientific Reference:

**PhySim** is a high-fidelity biological simulation engine that models human physiology, neurochemistry, and metabolism using a systems-biology approach. Unlike statistical or rule-based models, PhySim employs a **unified Ordinary Differential Equation (ODE) architecture** to simulate the continuous-time evolution of biological states ("Neurostates"). It accounts for the complex interplay between intrinsic rhythms, individual physiology, and extrinsic interventions (pharmacology, nutrition, and lifestyle).

---

## The Simulation Engine Architecture

### ODE Architecture & Solvers

The core of PhySim is a vectorized **Runge-Kutta 4 (RK4)** integration engine. The state of the system at time $t$ is represented as a high-dimensional vector $\mathbf{S}$, and the engine solves for:
$$\frac{d\mathbf{S}}{dt} = f(\mathbf{S}, t, \mathbf{P})$$
where $\mathbf{P}$ represents external parameters and interventions.

- **Vectorized Solver:** To achieve real-time performance in the browser, the engine flattens all signals, auxiliary variables, and receptor states into a `Float64Array`.
- **Pre-Resolved Definitions:** Signal behaviors (setpoints, $\tau$ values, production/clearance constants) are pre-computed to avoid lookups during the integration loop.
- **Homeostasis & Setpoints:** Signals generally follow mean-reverting dynamics towards a time-varying setpoint $\mu(t)$, governed by a time constant $\tau$:
  $$\frac{dS}{dt} = \frac{\mu(t) - S}{\tau} + \sum \text{Production} - \sum \text{Clearance}$$

---

## Biological Systems & Signals

PhySim organizes physiological signals into distinct but interconnected systems:

| System             | Description                                       | Key Signals                                                                                   |
| :----------------- | :------------------------------------------------ | :-------------------------------------------------------------------------------------------- |
| **Nervous**        | Synaptic health and neurotransmitter balance.     | Dopamine, Serotonin, GABA, Glutamate, Acetylcholine, Norepinephrine, BDNF, Histamine, Orexin. |
| **Endocrine**      | Hormonal regulation of stress, sleep, and growth. | Cortisol, Adrenaline, Melatonin, Growth Hormone, Oxytocin, Prolactin, Thyroid.                |
| **Metabolic**      | Energy production, fuel storage, and utilization. | Glucose, Insulin, Glucagon, Ketones, GLP-1, Leptin, Ghrelin, mTOR, AMPK.                      |
| **Reproductive**   | Sex hormones and menstrual cycle dynamics.        | Testosterone, Estrogen, Progesterone, LH, FSH, SHBG.                                          |
| **Cardiovascular** | Autonomic balance and circulatory stress.         | Blood Pressure, HRV, Vagal Tone, Oxygen Saturation.                                           |
| **Organ Health**   | Filtration, detoxification, and systemic stress.  | ALT, AST, eGFR (Kidney), Ethanol, Acetaldehyde, Inflammation.                                 |
| **Nutritional**    | Micronutrient cofactors and mineral status.       | Magnesium, Ferritin, Vitamin D3, Zinc, B12, Folate, Iron, Choline.                            |

---

## Contributors to Dynamics

### Receptors & Transduction

PhySim models pharmacology at the receptor level. Each receptor has defined couplings to downstream signals.

- **Mechanisms:**
  - **Agonist:** Directly increases signal activity.
  - **Antagonist:** Blocks binding, shifting the $K_d$ rightward.
  - **PAM/NAM:** Allosteric modulators that enhance or reduce receptor sensitivity.
- **Transduction:** Uses the **Operational Model of Agonism** (Black & Leff):
  $$E = \frac{E_{max} \cdot \tau \cdot [L]}{(\tau + 1)[L] + K_d}$$
- **Receptor Adaptation:** Models tolerance and sensitization through density ($\mathbf{B}_{max}$) and sensitivity dynamics:
  $$\frac{dR}{dt} = k_{rec}(R_0 - R) - k_{down} \cdot \text{Occupancy} \cdot R$$

### Transporters & Clearance

Synaptic concentrations are heavily influenced by reuptake transporters:

- **DAT (Dopamine Transporter):** Primary clearance for Dopamine.
- **NET (Norepinephrine Transporter):** Clears NE; targeted by many stimulants and SNRIs.
- **SERT (Serotonin Transporter):** Primary target for SSRIs.
- **GAT1/GLT1:** Clear GABA and Glutamate to maintain E/I balance.

### Enzymes & Metabolic Degradation

The engine models enzymatic breakdown using linear and saturable kinetics:

- **MAO-A/B:** Degrades Monoamines (Serotonin, Dopamine, NE).
- **COMT:** Degrades Catecholamines, particularly in the prefrontal cortex.
- **AChE:** Rapidly degrades Acetylcholine.
- **DAO:** Metabolizes Histamine.

### Auxiliary Dynamics (Internal Pools)

The engine tracks hidden variables that limit or facilitate signal production:

- **Vesicle Capacity:** (Dopamine/Norepi) Limits maximum phasic release; requires time to refill.
- **Precursor Availability:** (Serotonin/GABA) Models how diet (Tryptophan/B6) limits synthesis.
- **Hepatic Glycogen:** Buffer for blood glucose maintenance.
- **Adenosine Pressure (Process S):** Accumulates during wakefulness, cleared during sleep.

---

## Pharmacokinetics (PK) Models

PhySim uses a library of standard and advanced PK models:

- **1-Compartment Bolus/Infusion:** Standard for most supplements and meals.
- **2-Compartment Models:** Models distribution into peripheral tissues (e.g., Methylphenidate).
- **Michaelis-Menten Kinetics:** For saturable elimination where $\frac{dC}{dt} = -\frac{V_{max} \cdot C}{K_m + C}$ (e.g., Alcohol).
- **Bateman Equation:** Analytical solutions for first-order absorption and elimination.

---

## Interventions & Agents

### Nutritional Pharmacology

PhySim treats food as a complex multi-agent intervention:

- **Glucose/Carbs:** Triggers biphasic insulin release, GLP-1, and dopamine reward.
- **Lipids:** Strongest ghrelin suppression and vagal/CCK activation.
- **Protein:** Primary driver of **mTOR** activation and glucagon secretion.
- **Fiber:** Modulates gastric emptying and fuels SCFA-mediated GABA production via the gut-brain axis.

### Lifestyle & Environment

- **Sleep:** A major systemic override that clears adenosine, spikes Growth Hormone, and suppresses Orexin/Cortisol.
- **Exercise:** Modeled as three concurrent loads:
  1. **Sympathetic Stress:** (Norepi/Adrenaline spike).
  2. **Metabolic Load:** (AMPK activation, glucose uptake).
  3. **Mechanical Load:** (mTOR activation, muscle inflammation).
- **Cold/Heat:** Modulates norepinephrine, cortisol, and metabolic rate through thermoregulatory stress.

---

## Neurodiversity & Conditions

PhySim models conditions mechanistically by modifying baseline receptor densities, transporter activities, and coupling gains:

- **ADHD:** Modeled as **transporter hyperfunction** (upregulated DAT/NET) leading to low tonic dopamine/norepinephrine.
- **Autism (ASD):** Modeled as an **E/I Imbalance** (reduced GABA-A density, enhanced NMDA sensitivity) and reduced Oxytocin receptor density.
- **POTS:** Models NET dysfunction and alpha-1 receptor supersensitivity leading to autonomic instability.
- **MCAS:** Models mast cell instability through chronic histamine excess and DAO enzyme deficiency.

---

## Subject Physiology & Scaling

The engine scales all constants to the individual user:

- **Metabolic Rate (BMR):** Uses Mifflin-St Jeor to scale metabolic clearance.
- **Fluid Volumes:** Uses Watson formula for Total Body Water (TBW) to determine drug concentrations ($C = \text{Dose} / V_d$).
- **Menstrual Cycle:** Uses a 28-day mathematical model (Gaussian pulses) to simulate Estrogen, Progesterone, LH, and FSH phases.
