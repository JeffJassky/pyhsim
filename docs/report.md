# Application Overview: Physim (Physiological Simulation Engine)

## Executive Summary

**Physim** is a sophisticated, web-based biological simulation platform designed to model human physiology, neurochemistry, and metabolism in real-time. Unlike simple tracking applications that log data, Physim employs a **mechanistic simulation engine** governed by systems of Ordinary Differential Equations (ODEs). It predicts the user's physiological state ("Neurostate") based on a complex interplay of intrinsic biological rhythms (circadian, ultradian, infradian), individual physiological characteristics, and extrinsic interventions (pharmacology, nutrition, lifestyle).

The application serves as a "Flight Simulator for Biology," allowing users—categorized into archetypes like Biohackers, Neurodivergent individuals, or Cycle Syncers—to visualize the impact of their choices on signals like Dopamine, Cortisol, Glucose, and Sleep Pressure.

## Core Philosophy & Approach

The defining philosophy of Physim is **First-Principles Modeling**.

*   **Mechanistic vs. Phenomenological:** Instead of hardcoding simple rules like "Caffeine increases Energy," the system models Caffeine as an adenosine receptor antagonist. The simulation then calculates the downstream effects: blocking adenosine receptors prevents the detection of sleep pressure, which indirectly sustains arousal and modulates dopamine.
*   **Unified Architecture:** All inputs—whether a prescription drug, a meal, a workout, or a cold plunge—are treated as **Interventions** that introduce **Agents** into the system. These agents interact with a unified set of **Pharmacokinetic (PK)** and **Pharmacodynamic (PD)** laws.
*   **Homeostasis & Adaptation:** The engine models the body's attempts to maintain equilibrium. It accounts for receptor downregulation (tolerance), vesicle depletion, and enzyme saturation, allowing it to simulate phenomena like "caffeine crashes," "sugar highs," or the diminishing returns of stimulants.

## Technical Architecture

### 1. The Simulation Engine (`@src/models/engine`)
At the heart of the application is a custom **ODE Solver** (using Runge-Kutta 4 integration) that advances the biological state in discrete time steps (typically minutes).

*   **Signals:** The fundamental units of the simulation. These include neurotransmitters (Dopamine, Serotonin), hormones (Cortisol, Insulin), metabolic markers (Glucose, Ketones), and derived metrics (Energy, Focus).
*   **Dynamics:** Each signal has a defined biological behavior, including:
    *   **Baselines & Setpoints:** Regulated by circadian rhythms (e.g., Cortisol Awakening Response).
    *   **Production & Clearance:** Governed by enzymatic rates (e.g., COMT, MAO) and transport mechanisms.
    *   **Couplings:** Inter-signal relationships (e.g., High Insulin inhibits Glucagon; High Cortisol increases Glucose).
*   **Vectorized Solver:** The solver uses a highly optimized, flat-vector memory layout to handle potentially hundreds of interacting signals efficiently in a Web Worker.

### 2. Pharmacokinetics & Pharmacodynamics (PK/PD)
The application implements rigorous pharmacological modeling standards:

*   **PK Models:**
    *   **Compartmental Models:** 1-compartment and 2-compartment models for drug distribution.
    *   **Absorption:** First-order absorption (oral) and infusions.
    *   **Metabolism:** Michaelis-Menten kinetics for saturable metabolism (e.g., Alcohol).
    *   **Bioavailability & Volume of Distribution:** Scaled by user weight and body composition.
*   **PD Models:**
    *   **Receptor Binding:** Uses Hill equations and Dissociation Constants ($K_d$ or $K_i$) to calculate fractional receptor occupancy.
    *   **Mechanisms:** Supports Agonists, Antagonists, Partial Agonists, Inverse Agonists, and Allosteric Modulators (PAM/NAM).

## Physiological Domains

The simulation covers a vast array of biological systems, deeply interconnected:

### Nervous System
*   **Neurotransmitters:** Dopamine (motivation), Serotonin (mood), Norepinephrine (focus), GABA (calm), Glutamate (excitation), Acetylcholine (learning), Histamine (wakefulness).
*   **Mechanisms:** Models synaptic release, reuptake transporters (DAT, SERT, NET), and degradation enzymes (MAO-A/B, COMT).
*   **Sleep/Wake:** Models the "Flip-Flop Switch" between Orexin/Histamine (wake) and GABA/Melatonin (sleep), integrated with Adenosine pressure (Process S).

### Endocrine System
*   **HPA Axis:** Stress response involving CRH, ACTH, and Cortisol.
*   **Reproductive:** Models the menstrual cycle (Follicular/Luteal phases) driving Estrogen, Progesterone, LH, and FSH. Includes Testosterone dynamics for all subjects.
*   **Growth:** Growth Hormone and IGF-1 dynamics, influenced by sleep and exercise.

### Metabolic System
*   **Nutrient Processing:** Detailed modeling of macronutrients (Sugar, Starch, Protein, Fat, Fiber).
    *   **Gastric Emptying:** Modulated by meal volume, viscosity (fiber), and caloric density (fat).
    *   **Glucose/Insulin:** Biphasic insulin secretion, glucagon counter-regulation, and incretin effects (GLP-1).
    *   **Energy partitioning:** Storage (Glycogen, Adipose) vs. Utilization (ATP, Ketones).

## Key Features & User Experience

### 1. The Studio (`StudioPage.vue`)
The main workspace where experimentation happens.
*   **Timeline View:** A drag-and-drop interface for scheduling interventions over multiple days. It visualizes duration, intensity, and stacking of events.
*   **Signal Charts:** Real-time visualization of simulated signals. Users can overlay different signals (e.g., "Show me Insulin vs. Glucose" or "Dopamine vs. Energy").
*   **Inspector:** Detailed view of specific interventions or timepoints.

### 2. Intervention Registry
A comprehensive library of "Agents" categorized by type:
*   **Food:** Dynamic construction of meals based on macros, Glycemic Index, and physical properties.
*   **Medications:** Prescription drugs (e.g., Adderall, SSRIs) with accurate PK profiles.
*   **Supplements:** Over-the-counter compounds (Magnesium, L-Theanine, Omega-3s).
*   **Lifestyle:** Activities like Sleep, Meditation, Exercise (Cardio/Resistance), and thermal stress (Sauna/Cold Plunge).

### 3. Personalization & Conditions
Physim moves beyond a "generic human" model:
*   **Physiology:** Inputs for Age, Weight, Sex, and Body Fat % scale the PK/PD parameters (e.g., blood volume, metabolic rate).
*   **Pathology Modeling:** The "Conditions" engine allows enabling overlays for specific profiles (e.g., ADHD, Depression, PCOS).
    *   *Example:* **ADHD** is modeled not as a flag, but as a specific upregulation of Dopamine Transporter (DAT) density and downregulation of tonic Dopamine firing.
*   **Archetypes:** Quick-start profiles (e.g., "Biohacker" for optimization, "Neurodivergent" for regulation).

### 4. Goals System
Users define high-level goals (e.g., "Energy", "Weight Loss", "Calm"). The system intelligently filters the massive list of available signals to show only those relevant to the active goals (e.g., showing *mTOR* and *Protein* for hypertrophy, or *GABA* and *Cortisol* for anxiety).

## User Interface & Experience

The application is structured around a central "Studio" workspace, supported by a comprehensive modal-based management system for interventions and user profiling.

### 1. The Studio Workspace
The primary interface (`StudioPage.vue`) is a split-pane view dividing the screen into two main functional areas:

*   **Timeline (Left Pane):** A drag-and-drop scheduling interface.
    *   **Interaction:** Users can drag interventions to move them in time or resize them to change duration.
    *   **Playhead:** A vertical line indicates the current simulation time. Clicking anywhere on the timeline updates the playhead, synchronizing the chart values to that specific minute.
    *   **Contextual Adding:** Hovering over the playhead reveals an "Add" button, allowing precise insertion of new events at specific times.
    *   **Visuals:** Different intervention types (Bolus, Infusion, Continuous, Lifestyle) have distinct visual representations (points vs. bars). Sleep events are specially styled with wake-up indicators.

*   **Signal Charts (Right Pane):** A dynamic dashboard of physiological metrics.
    *   **Visualization:** Real-time line charts showing the trajectory of signals over 24+ hours.
    *   **Grouping & Filtering:** Users can organize charts by **Biological System** (e.g., Nervous, Endocrine), **Goal** (e.g., Energy, Calm), or view a flat list. Filtering options allow focusing on "My Goals" or "Active" signals (only those currently being modified by interventions).
    *   **Layouts:** Supports both a dense **Grid View** for high-level patterns and a **List View** for detailed analysis.
    *   **Deep Dive:** Clicking a chart expands it to reveal **"Active Contributors"**—a breakdown showing exactly which interventions (e.g., "Coffee") or conditions (e.g., "ADHD") are driving the signal's current value, including the mechanism (e.g., "Adenosine antagonism").

### 2. The Launcher (Add Item Modal)
A unified command center (`AddItemModal.vue`) for introducing new variables into the simulation:

*   **Three-Way Navigation:**
    *   **Categories:** Browse interventions by type (Food, Exercise, Supplements) or by high-level Goal (Energy, Sleep).
    *   **Search:** A global search bar to quickly find specific items like "Adderall" or "Sauna".
    *   **Food Search:** A dedicated interface connecting to the **OpenFoodFacts API**. Users can search for real-world food items (e.g., "Oatmeal"), adjust quantities, and log them directly. The system automatically calculates the nutritional profile (Sugars, Starches, Fiber, Fats) to drive the metabolic engine.

### 3. User Profile & Personalization
A comprehensive settings interface (`UserProfileModal.vue`) allows deep customization of the "Digital Twin":

*   **Physiology:** Sliders for Age, Weight, and Sex. For female subjects, users can configure **Menstrual Cycle** parameters (Length, Current Day) to simulate hormonal fluctuations (Estrogen/Progesterone dynamics).
*   **Conditions Engine:** Users can toggle specific neurophysiological profiles (e.g., **ADHD**, **Depression**, **PCOS**).
    *   *Granular Control:* Each condition has a "Severity" or "Reactivity" slider (0-100%) that scales the underlying biological modifiers (e.g., receptor density, transporter activity).
*   **Nutritional Targets:** Users can set daily calorie goals and enable/customize **Macro Ranges** (Protein, Carbs, Fat) to track their diet against specific protocols (e.g., Keto, High-Carb).
*   **Subscription Tier:** Toggles between "Free" and "Premium" tiers, unlocking advanced signals (e.g., Neurotransmitters, specific Hormones).

### 4. Inspector & Analysis
*   **Floating Inspector:** When an item on the timeline is selected, a floating panel appears detailing its parameters (e.g., dose, intensity, duration).
*   **Nutrition Carousel:** A dashboard widget that aggregates daily nutrition data, visualizing progress towards Calorie and Macro targets with radial charts.

## Conclusion

Physim represents a convergence of **Systems Biology** and **Consumer Health Tech**. By simulating the *mechanism of action* rather than just the *expected outcome*, it provides a powerful, educational tool for understanding the "Black Box" of human physiology. It is designed to empower users to hypothesize, simulate, and verify lifestyle changes in a risk-free digital twin environment.