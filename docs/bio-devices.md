# Wearable Integration: Closing the Biological Loop

## Overview
This document explores how data from existing wearable devices can "10x" the value of **Physim**. The current application is a powerful **Simulator** (predicting based on models). Integration with wearables turns it into a **Digital Twin** (validating predictions against real-time ground truth).

---

## 1. Continuous Glucose Monitors (CGM) - The "Metabolic Ground Truth"
*   **The Device:** Dexcom, FreeStyle Libre.
*   **10x Multiplier:** **Personalized GI Mapping.**
    *   *The Problem:* Standard Glycemic Index (GI) is an average. Some people spike on white rice but stay flat on potatoes (and vice versa).
    *   *The Feature:* Physim ingest CGM data and "auto-calibrates" its food kernels. If the simulation predicts a 20mg/dL spike but the CGM shows 60mg/dL, the AI adjusts your personal `carbAppearance` and `insulinSensitivity` scalars.
    *   *Result:* The simulator becomes 100% accurate to **your** specific metabolism, not a textbook average.

## 2. HRV & Vagal Tone - The "Stress Reality Check"
*   **The Device:** Oura, Whoop, Apple Watch, Garmin.
*   **10x Multiplier:** **Real-time Vagal Correction.**
    *   *The Problem:* The simulation assumes you recover "perfectly" after a cold plunge. But what if you have a hidden systemic stressor (illness, work stress)?
    *   *The Feature:* Physim pulls Heart Rate Variability (HRV) every hour. If your real-world HRV is lower than the simulated `hrv` signal, the app flags a "Systemic Drain."
    *   *Result:* The "Overwhelm" and "Calm" meters shift from "How you *should* feel" to "How you actually feel," accounting for variables the user didn't log.

## 3. High-Resolution Core Temp - The "Circadian Compass"
*   **The Device:** Oura Ring, Eight Sleep (Mattress), Femometer.
*   **10x Multiplier:** **Phase-Shift Accuracy.**
    *   *The Problem:* Determining exactly when your "Biological Night" starts is hard without a lab.
    *   *The Feature:* Uses the Min-Max body temperature curve to identify your precise "CBT-min" (Core Body Temp Minimum). It uses this to anchor the `melatonin` and `cortisol` baselines in the simulation.
    *   *Result:* The simulation doesn't just guess your wake/sleep cycle based on a slider; it "locks" to your actual circadian phase, making light-hygiene recommendations (Blue Light/Sunlight) mathematically perfect.

## 4. Sleep Stage Tracking - The "Growth Hormone Audit"
*   **The Device:** Eight Sleep, Oura, Whoop.
*   **10x Multiplier:** **Recovery Debt Visualization.**
    *   *The Problem:* You might stay in bed for 8 hours but only get 10 minutes of Deep Sleep.
    *   *The Feature:* The app compares the simulated `growthHormone` pulse (which assumes healthy sleep) with your actual Deep Sleep duration. If they don't match, it calculates "Biological Debt."
    *   *Result:* It can tell you: *"You slept 8 hours, but your actual Growth Hormone pulse was only 20% of its potential. You will start tomorrow with a -0.3 Focus penalty."*

## 5. Menstrual Cycle Tracking (Oura / Natural Cycles)
*   **The Device:** Oura + Natural Cycles integration.
*   **10x Multiplier:** **Automatic Profile Switching.**
    *   *The Problem:* Users forget to update their "Cycle Day" in the app.
    *   *The Feature:* Passively ingests temperature-verified cycle data to automatically update the `getMenstrualHormones` model in `subject.ts`.
    *   *Result:* All energy, mood, and appetite simulations are permanently synced to the user's cycle without a single manual entry.

---

## The "Holy Grail" UX: Passive Logging
The final 10x multiplier is the removal of the "effort" of logging.
*   **Auto-detecting "Lift":** Apple Watch detects high heart rate + repetitive motion and places a "Lift" intervention on the timeline for you.
*   **Auto-detecting "Sunlight":** Watch ambient light sensors detect 50klux and log a "Sunlight" intervention.
*   **Auto-detecting "Caffeine":** (Future tech) Smart mugs or meal-photo recognition.

## Strategic Summary
| Device | Value Multiplier | Competitive Moat |
| :--- | :--- | :--- |
| **CGM** | Precise Metabolic Prediction | Replaces generic diet advice with personal math. |
| **HRV** | Acute Stress Awareness | Validates if recovery protocols (Sauna/Cold) are actually working. |
| **Eight Sleep** | Precise Recovery Modeling | Calculates the "Focus Carryover" for the next day. |
| **Oura** | Passive Circadian Anchoring | Eliminates manual "Cycle Day" or "Wake Time" entry. |

**Final Insight:** Wearables currently tell users they are "Stressed" (The *What*). Physim + Wearables tells them *"You are stressed because your 4 PM caffeine is still blocking your adenosine receptors while your HRV is low"* (The *Why* and the *How to fix it*).
