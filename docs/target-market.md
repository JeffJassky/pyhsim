# Target Market Analysis: Physim

## Overview
This document identifies the primary and secondary market segments for the **Physim** application. Unlike general fitness trackers that report *what happened*, Physim’s value proposition is its ability to simulate *what will happen* or *why it happened* based on biological models.

---

## 1. The "Performance Optimizer" (High Willingness to Pay)
This is the core "Biohacker" market. These users are already invested in expensive hardware (Oura, Whoop, Eight Sleep, CGM) and are looking for a "central brain" to synthesize their data.

*   **Sub-markets:** High-performing executives, professional athletes, and silicon valley "bio-optimizers."
*   **The Problem:** Data fatigue. They have a lot of numbers but don't know how to adjust their 2:00 PM meeting based on their 8:00 AM breakfast and 10:00 AM caffeine.
*   **Why they pay:** For the **Predictive Simulation**. They want to know the "perfect" time to take a supplement or exercise to ensure peak cognitive performance for a specific event.

**Gap Analysis & Future Roadmap:**
*   **Missing Signals:** Heart Rate Variability (HRV) as a raw signal (currently only Vagal tone proxy), Blood Pressure (numeric), and Ethanol/Acetaldehyde metabolism for modeling social recovery.
*   **Missing Interventions:** Nootropics (L-Theanine, Magnesium Threonate, Ashwagandha), Meditation (as a distinct kernel from "Sleep"), and Alcohol intake.
*   **Critical Add:** **Inflammation (CRP/IL-6) Proxy.** Optimizers are obsessed with "Systemic Inflammation" as a predictor of long-term health.

**10x Value Features (Low Effort / High Impact):**
*   **"Peak Window" UI Overlays:** A simple visual highlight on the timeline indicating the "Optimal Deep Work Window" or "High-Intensity Training Window" based on the current simulation.
*   **"What-If" Ghost Curves:** When hovering over a potential intervention (like caffeine), show a "ghost" line on the chart of how it *would* shift the next 6 hours before the user even clicks it.

## 2. Neurodivergent Management (ADHD & Autism)
This is a high-need market where the application provides a "manual for the brain."

*   **Sub-markets:** Adults with ADHD, parents of children on the spectrum, and individuals managing the "Neuro-Trifecta" (comorbid EDS, POTS, and MCAS).
*   **The Problem:** "Executive Dysfunction" and "Autonomic Instability." Understanding how medication (like Adderall) interacts with sleep, food, and stress—and how those in turn trigger POTS flares or MCAS reactions—is life-changing.
*   **Why they pay:** For **Predictability and Stability**. If the app can predict a "crash" at 4:00 PM due to a medication/food interaction or a POTS-induced energy drop from dehydration, the user can intervene before it happens.

**Gap Analysis & Future Roadmap:**
*   **Missing Signals:** Brain-Derived Neurotrophic Factor (BDNF), Magnesium, "Sensory Load," and Autonomic indicators (Blood Pressure volatility, Histamine/Mast Cell activation).
*   **Missing Interventions:** Methylphenidate (Ritalin/Concerta) kernels, Guanfacine (Alpha-2 agonist), Electrolyte loading (for POTS management), and H1/H2 blockers.
*   **Critical Add:** **Magnesium/Zinc & Sodium Synergies.** ADHD users often need dopamine support; POTS users require precise sodium/fluid balance. Modeling the interplay of electrolytes, histamine, and neurochemistry is a major differentiator.

**10x Value Features (Low Effort / High Impact):**
*   **Anticipatory Alerts:** Notifications that say: "Simulation predicts a focus drop in 30 mins. Consider a high-protein snack now to buffer the crash." (Closing the loop from simulation to action).
*   **"Stability" Meter:** A single simplified score that tracks how "volatile" the neurochemistry is today vs. yesterday, helping users identify which habits are causing instability.

## 3. Hormonal & Reproductive Health
This market focuses on the complex interplay modeled in the `getMenstrualHormones` and HPA axis logic.

*   **Sub-markets:** Women tracking cycles for performance (Cycle Syncing), individuals managing PCOS or Hashimoto’s.
*   **The Problem:** Most period trackers are just calendars. They don't explain how progesterone rises in the luteal phase affect insulin sensitivity and energy levels.
*   **Why they pay:** For **Personalized Physiology**. Understanding why they feel "off" and getting a simulation that validates their biological state (e.g., "Your progesterone peak is currently dampening your GABA response") provides immense psychological relief and actionable adjustments.

**Gap Analysis & Future Roadmap:**
*   **Missing Signals:** SHBG (Sex Hormone Binding Globulin), Ferritin/Iron (critical for energy dips in menses), and DHEA-S.
*   **Missing Interventions:** Hormonal Contraceptive profiles (Pill, IUD, Patch), Inositol supplementation (for PCOS glucose management), and Seed Cycling.
*   **Critical Add:** **Iron/Oxygen Transport.** Modeling how monthly blood loss affects oxygen delivery and perceived "Energy" would make the cycle tracking much more functional.

**10x Value Features (Low Effort / High Impact):**
*   **Contextual Meter Scaling:** Automatically adjust the "Meters" sensitivity during the luteal phase (e.g., the "Overwhelm" threshold lowers). This provides psychological validation: "It's not you, it's the shift in your baseline."
*   **"Cycle-Sync" Recommendations:** A simple daily text tip based on the simulation: "Estrogen is peaking; your insulin sensitivity is high today. Great day for that high-carb training session."

## 4. Professional Health & Performance Coaches
This is a B2B2C (Business to Business to Consumer) play.

*   **Sub-markets:** Functional medicine practitioners, high-ticket fitness coaches, corporate wellness consultants.
*   **The Problem:** Coaches struggle to show clients the "hidden" biological cost of poor habits (like late-night blue light) until the damage is already done.
*   **Why they pay:** For **Visual Client Education**. Using Physim as a "white-labeled" tool to show a client exactly how their lifestyle is suppressing their Growth Hormone pulses makes the coach’s advice more authoritative and sticky.

**Gap Analysis & Future Roadmap:**
*   **Missing Signals:** Liver Enzyme proxies (ALT/AST), Kidney function (eGFR) for high-protein athletes, and Vitamin D3 status.
*   **Missing Interventions:** Creatine Monohydrate (modeling cellular hydration and ATP recycling), HIIT vs LISS (divergent metabolic kernels), and Sauna/Cold exposure specifics (more detailed than current temp kernels).
*   **Critical Add:** **mTOR vs. AMPK Signaling.** Coaches want to show the trade-off between "Building" (mTOR) and "Cleaning" (Autophagy/AMPK) based on feeding/fasting windows.

**10x Value Features (Low Effort / High Impact):**
*   **Shareable "Scenario Reports":** A one-click PDF or link export that shows "Scenario A (Current Habit) vs. Scenario B (Proposed Change)" with the delta in Growth Hormone or Cortisol clearly highlighted.
*   **Compliance Simulation:** A slider for the coach to show the client: "This is what happens to your simulated metabolic health if you skip your morning walk 3 days a week." Visualizing the "cost of neglect" is a powerful motivator.

## 5. The "Quantified Self" Academic/Researcher
*   **Sub-markets:** Graduate students, health-tech developers, medical educators.
*   **The Problem:** Building these models from scratch is extremely difficult.
*   **Why they pay:** For **Access to the Model Library**. They may use it as a sandbox to test theories or as an educational tool for students to visualize neurochemistry.

---

## Summary of Monetization Tiers

| Tier | Market Segment | Primary Value | Pricing Model |
| :--- | :--- | :--- | :--- |
| **Consumer (Pro)** | Optimizers / ND Individuals | Personal simulation & predictive alerts | Monthly SaaS Subscription |
| **Practitioner** | Coaches / Doctors | Client management & educational visualization | Per-seat / Per-client License |
| **API / Enterprise** | Other Health Apps / Tech Companies | Integration of the Physim Engine into their own UI | Usage-based API (B2B) |

---

## Device Interaction & Usage Dynamics

The "device-market fit" is determined by the immediacy of the biological signal being modeled.

### 1. Mobile (The "Dashboard & Intervention" Hub)
*   **Intensity:** High (Critical for real-time adjustments).
*   **Frequency:** 10–15x per day.
*   **Psychological Drive:** Anxiety reduction and "Control."
*   **Market Usage:**
    *   **Neurodivergent:** Use mobile to log immediate interventions (e.g., "Just took 10mg Adderall") and check the "Overwhelm" meter. The frequency is high because the app acts as an external prefrontal cortex.
    *   **Optimizers:** Quick check-ins before meals to see the predicted glucose spike or before a workout to check Adrenaline/Cortisol status.

### 2. Desktop (The "Studio & Strategy" Suite)
*   **Intensity:** Maximum (Deep cognitive focus).
*   **Frequency:** 1x per day or 1x per week.
*   **Psychological Drive:** Mastery and "Optimization Architecture."
*   **Market Usage:**
    *   **Practitioners:** This is their primary workspace. High-intensity use during client sessions to build "Scenarios" and explain complex physiological couplings on a large screen.
    *   **Optimizers:** "Sunday Planning." Using the Desktop Studio to build the "Perfect Tuesday" by dragging and dropping interventions into the timeline to see the simulated outcome.

### 3. Wearables / Watch (The "Passive Sentinel")
*   **Intensity:** Low (Glanceable).
*   **Frequency:** Constant / Passive.
*   **Psychological Drive:** Awareness and "Closed-Loop Feedback."
*   **Market Usage:**
    *   **Hormonal Health:** Subtle haptic alerts for "Vagal Drop" or predicted "Energy Slump" based on cycle phase.
    *   **Neurodivergent:** High-value for "Time Blindness." A vibration on the wrist when the simulation predicts a medication peak or a neurotransmitter dip, prompting a preemptive intervention (e.g., "Eat protein now to blunt the crash").

### 4. Tablet (The "Consultation Canvas")
*   **Intensity:** Moderate.
*   **Frequency:** During specific high-value interactions.
*   **Psychological Drive:** Connection and "Collaborative Discovery."
*   **Market Usage:**
    *   **Practitioners:** Using a tablet in a clinic setting to let the patient/client interact with the sliders themselves (e.g., "See what happens when you move your caffeine dose 2 hours earlier"). This creates "Aha!" moments that drive behavior change.

---

## Key Market Differentiator
Physim is not a **Tracker**; it is a **Simulator**. While Apple Health tells you that you slept 6 hours, Physim tells you *why* your 6 hours of sleep resulted in a 0.4 focus score by 11:00 AM due to your late-night blue light exposure. This "Mechanism of Action" insight is what users will pay for.
