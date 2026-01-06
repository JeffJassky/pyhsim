# Product Team & Advisory Board Requirements

## Overview
This document outlines the key professional roles required to validate, refine, and launch the **Physim** biological simulation engine. The application currently models complex interactions across circadian, neurochemical, endocrine, and metabolic systems. To ensure scientific accuracy and clinical relevance, we need a multidisciplinary team of experts.

The codebase (`src/models/*`) employs sophisticated mathematical modeling (PK/PD kernels, control theory couplings) to simulate human physiology. The roles below are selected to specifically address these domains.

## Core Scientific Advisory Board

### 1. Chronobiologist
**Why:** The core of the simulation is built around the SCN (Suprachiasmatic Nucleus) and circadian entrainment.
**Codebase Context:** `src/models/signals.ts` (SCN group: Melatonin, Vasopressin, VIP), `src/models/interventions.ts` (Blue light, Sunlight kernels).
**Responsibilities:**
*   Validate the phase-response curves (PRCs) used for light exposure (`blueLight`, `sunlight`).
*   Verify the mathematical modeling of the SCN shell/core interaction (Vasopressin vs. VIP).
*   Refine the "Melatonin Window" logic and its coupling to sleep pressure.

### 2. Neuropharmacologist / Neuroscientist
**Why:** The application models specific neurotransmitter dynamics and their response to pharmacological agents (stimulants) and lifestyle interventions.
**Codebase Context:** `src/models/signals.ts` (Neuro group: Dopamine, Serotonin, GABA, Norepinephrine, Orexin, Histamine), `src/models/interventions.ts` (Adderall IR/XR, Caffeine, Melatonin supplement).
**Responsibilities:**
*   Review the Pharmacokinetic/Pharmacodynamic (PK/PD) models for Adderall and Caffeine (`pk1`, `pk_dual` functions).
*   Validate the modeled receptor interactions (e.g., Adenosine antagonism by caffeine, modeled via Dopamine/Adenosine interplay).
*   Verify the coupling logic between neurotransmitters (e.g., Glutamate/GABA balance in `src/models/profiles.ts` for Autism/ADHD).

### 3. Endocrinologist
**Why:** There is a heavy focus on hormonal feedback loops, including the HPA axis (Stress), HPG axis (Reproductive), and metabolic hormones.
**Codebase Context:** `src/models/signals.ts` (Endocrine group: Cortisol, Adrenaline, Thyroid, Testosterone, Estrogen, Progesterone, Prolactin, Growth Hormone).
**Responsibilities:**
*   Validate the Menstrual Cycle model (`getMenstrualHormones` in `src/models/subject.ts`) and its impact on systemic signals.
*   Review the HPA axis dynamics (Cortisol/Adrenaline) and their "burnout" or dysregulation modes.
*   Ensure the Thyroid-Metabolism feedback loops are accurate (`thyroid` signal couplings).

### 4. Metabolic Scientist / Clinical Nutritionist
**Why:** The "Food" intervention uses detailed kernels for macronutrient processing, gastric emptying, and insulin dynamics.
**Codebase Context:** `src/models/interventions.ts` (Food kernels, `gastricDelay`, `carbAppearance`, `insulinSecretionFromMeal`), `src/models/signals.ts` (Metabolic group: Glucose, Insulin, Glucagon, Ghrelin, GLP-1, Leptin).
**Responsibilities:**
*   Validate the `gastricDelay` logic based on fiber/fat content.
*   Refine the glucose appearance rates for different Glycemic Indices (GI).
*   Verify the hunger/satiety signaling (Ghrelin/Leptin/GLP-1) and its effect on the "Subjective" meters.

### 5. Exercise Physiologist
**Why:** The application models acute and chronic adaptations to different types of movement.
**Codebase Context:** `src/models/interventions.ts` (Walk, Bike, Lift kernels).
**Responsibilities:**
*   Validate the signal divergence between aerobic (Bike/Walk) vs. anaerobic (Lift) exercise.
*   Refine the recovery curves (EPOC, cortisol clearance) post-exercise.
*   Model the chronic adaptations (VO2 max improvements, resting heart rate changes) in `src/models/subject.ts`.

## Clinical & Applied Practitioners

### 6. Sleep Specialist (Somnologist)
**Why:** Sleep is a central "Reset" mechanism in the engine, heavily influenced by the "Sleep Pressure" meter.
**Codebase Context:** `src/models/weights.ts` ("Sleep Pressure" meter), `src/models/interventions.ts` (Sleep intervention).
**Responsibilities:**
*   Validate the Two-Process Model implementation (Process C vs. Process S).
*   Refine the "Sleep Architecture" logic (REM/Deep cycles) based on neurotransmitter states (Ach vs. Norepi).

### 7. Psychiatrist / Clinical Psychologist
**Why:** The application translates biological signals into subjective states ("Meters") and models neurodivergent profiles.
**Codebase Context:** `src/models/weights.ts` (Meters: Overwhelm, Mood, Focus, Calm), `src/models/profiles.ts` (ADHD, Autism).
**Responsibilities:**
*   Validate the "Subjective" mappings: Does high Dopamine + low Norepinephrine actually feel like "Focus"?
*   Review the `adhd` and `autism` profiles for clinical accuracy and non-stigmatizing representation.
*   Advise on the "Overwhelm" nonlinearity (`softplus` function in `src/models/weights.ts`).

## Technical & Data Experts

### 8. Systems Biologist / Pharmacometrician
**Why:** The engine uses complex coupled differential equation proxies (Kernels).
**Codebase Context:** `src/models/interventions.ts` (Kernel helpers: `pk1`, `hill`, `gammaPulse`).
**Responsibilities:**
*   Audit the mathematical stability of the simulation.
*   Suggest improvements to the numerical methods (e.g., moving from pre-computed kernels to real-time ODE solvers if needed).

### 9. Biohacker / Quantified Self Expert
**Why:** The product targets users who want to optimize their routines.
**Responsibilities:**
*   Bridge the gap between academic models and user-facing "actionable insights."
*   Validate the "Intervention" library against popular real-world protocols (e.g., Huberman protocols, Attia protocols).

## Recruitment Strategy

1.  **Phase 1 (Validation):** Hire a Chronobiologist and Neuropharmacologist as consultants to audit the core `signals.ts` and `interventions.ts` models.
2.  **Phase 2 (Expansion):** Bring on an Endocrinologist and Metabolic Scientist to refine the food and hormone layers.
3.  **Phase 3 (Clinical Application):** Engage a Sleep Specialist and Psychiatrist to fine-tune the "Meters" and "Profiles" for user relevance.
