# Influencer Validation Guide: The "Sister Test"

## Overview
This document outlines how different "influencers" (interventions like food, light, or meds) are expected to affect the charts in lay terms. This is used to "dummy-check" the model: if a user turns a slider up and the chart doesn't move in the way their intuition expects, the model is failing the "Sister Test."

---

## 1. Food (The "Energy & Fuel" Influencer)
Users expect food to be the primary mover of their metabolic and energy charts.

*   **The Lay Expectation:**
    *   **Sugar/Carbs:** "If I eat a donut (high sugar/GI), my blood sugar should spike fast and high, then crash. My insulin should follow it like a shadow."
    *   **Protein/Fiber:** "If I add fiber or protein to a meal, the sugar spike should look 'flatter' and last longer. I shouldn't feel that immediate crash."
    *   **Fat:** "Fat should make me feel full for a long time and slow down the whole process."
*   **The Validation Check:** Turning up "Sugar" should immediately increase the peak height of the **Glucose** and **Insulin** signals.

## 2. Caffeine & Stimulants (The "Focus & Crash" Influencer)
This is the primary tool for the **Neurodivergent** and **Optimizer** markets.

*   **The Lay Expectation:**
    *   **Caffeine:** "It shouldn't hit instantly. It takes 20–30 mins to kick in, lasts for hours, and if I drink it too late, my 'Melatonin' or 'Sleep' charts should be ruined."
    *   **ADHD Meds (Adderall):** "I expect a clear 'Peak' where I feel focused, and then a 'Comedown' or 'Crash' where my energy and dopamine drop below where they started."
*   **The Validation Check:** Increasing the "mg" of Caffeine should lift the **Dopamine** and **Norepinephrine** curves for a long duration (4-6 hours).

## 3. Light (The "Clock" Influencer)
Crucial for **Sleep Seekers** and **Biohackers**.

*   **The Lay Expectation:**
    *   **Morning Sunlight:** "Seeing the sun early should 'jumpstart' my day. I expect my Cortisol to rise and my Melatonin to stay dead-flat."
    *   **Evening Blue Light:** "Looking at my phone at night should 'kill' my Melatonin. It's the reason I can't fall asleep."
*   **The Validation Check:** Adding "Blue Light" at 10:00 PM should cause a visible "cliff" or drop in the **Melatonin** signal.

## 4. Temperature (The "Shock & Recovery" Influencer)
A favorite of the **Optimizer** and **Recovery** markets.

*   **The Lay Expectation:**
    *   **Cold Plunge:** "It should feel like a shock. My adrenaline should spike immediately, but then I should feel a 'calm' (Vagal tone) wash over me afterwards."
    *   **Sauna:** "I expect to feel 'relaxed-tired.' My heart rate (Adrenaline proxy) goes up while I'm in there, but my stress hormones should drop after I get out."
*   **The Validation Check:** **Adrenaline** spikes during the "Cold Exposure" intervention, followed by a rise in **Vagal Tone** once the intervention ends.

## 5. Movement (The "Burn & Build" Influencer)
The primary driver for **Coaches** and **Athletes**.

*   **The Lay Expectation:**
    *   **Cardio (Bike/Walk):** "I'm burning energy. My blood sugar should go down (as muscles use it), and my 'Energy' meter should feel high during, then dip into a 'good tired' later."
    *   **Lifting:** "This is a stressor. I expect my Cortisol to go up while I'm heavy lifting, but my Growth Hormone to spike later that night while I sleep."
*   **The Validation Check:** **Glucose** should trend downward during a long "Bike" session. **Growth Hormone** peak at night should be taller if a "Lift" intervention was added during the day.

---

## Demographic Specific "Expectation Anchors"

### The Neurodivergent User
*   **Will check first:** "Does my Adderall dose show me exactly when I'm going to be useless (the crash)?"
*   **Model Failure:** If Dopamine doesn't drop significantly when the medication wears off.

### The Performance Optimizer
*   **Will check first:** "Does my 4:00 PM coffee actually show up as a sleep inhibitor at 11:00 PM?"
*   **Model Failure:** If Caffeine has no effect on the nightly Melatonin or Sleep Pressure curves.

### The Hormonal Health User
*   **Will check first:** "Do I actually see why I'm hungrier/more tired during my period week?"
*   **Model Failure:** If changing the "Cycle Day" in the profile doesn't shift the baseline of the **Energy** or **Ghrelin** (Hunger) charts.

### The Coach
*   **Will check first:** "Can I show my client that their 10:00 PM 'Midnight Snack' is why their insulin never dropped during sleep?"
*   **Model Failure:** If a "Food" intervention at night doesn't keep the **Insulin** curve elevated through the early hours of the simulation.
