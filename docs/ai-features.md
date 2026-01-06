# AI-Driven Evolution: The Biological Co-Pilot

## Overview
This document outlines how Large Language Models (LLMs) and Generative AI can be integrated into **Physim** to shift the user experience from manual "slider-tweaking" to an intelligent, goal-oriented partnership.

---

## 1. The "Routine Architect" (Natural Language to Scenario)
Instead of manually dragging interventions onto a timeline, users describe their goals in plain English.

*   **The Feature:** A "Prompt-to-Scenario" interface.
*   **User Input:** *"I have ADHD, I'm struggling with a 3:00 PM crash, and I need to be asleep by 10:30 PM for a big presentation tomorrow."*
*   **AI Action:**
    1.  **Analyze Profile:** Reviews the user's `adhd` severity and current `physiology` (weight, sex, height).
    2.  **Generate Timeline:** Selects specific interventions (e.g., Protein-heavy lunch at 12:30, 10mg Ritalin at 1:00 PM, Blue Light block starting at 8:00 PM).
    3.  **Explain Logic:** *"I moved your stimulant dose later and added a protein anchor to your lunch to blunt the predicted dopamine dip. I also moved your exercise to the morning to ensure your Cortisol clears before your 10:30 PM target."*
*   **Technical Implementation:** The LLM outputs a structured `Scenario` JSON object that is fed directly into the simulation engine.

## 2. The "Biological Interpreter" (Context-Aware Q&A)
Users can ask "Why?" about any point in the chart.

*   **The Feature:** An interactive side-panel chat that has the full context of the current simulation.
*   **Example Query:** *"Why is my Overwhelm meter spiking at 4:00 PM in this scenario?"*
*   **AI Action:** The AI "looks" at the signal data at 4:00 PM and notices the intersection of high `sensoryLoad`, falling `dopamine`, and a late-day `cortisol` spike.
*   **Response:** *"At 4:00 PM, your Adderall is wearing off (falling dopamine) just as your 'Social Interaction' intervention ends. This creates a 'rebound' effect where your sensory sensitivity increases while your focus-buffering is low. That’s why the Overwhelm meter is hitting the softplus threshold."*

## 3. The "Scenario Optimizer" (Mathematical Brute-Force)
Using AI to find the "Global Maximum" for a specific metric.

*   **The Feature:** An "Optimize" button for specific goals.
*   **Example Goal:** *"Maximize my Focus between 9:00 AM and 12:00 PM without letting my Sleep Pressure drop below 0.7 at midnight."*
*   **AI Action:** The AI runs multiple iterations of the simulation, shifting the timing and dosage of caffeine or sunlight until it finds the mathematically optimal configuration that satisfies both constraints.

## 4. The "Proactive Sentinel" (Anomaly Detection)
The AI monitors the simulation in the background and flags "Biological Debt."

*   **The Feature:** Auto-generated "Observations" list next to the charts.
*   **Example Observations:**
    *   ⚠️ *"Warning: This caffeine dose is predicted to suppress Melatonin by 40% at your target sleep time."*
    *   💡 *"Observation: Moving your 'Cold Exposure' 2 hours earlier would align the Adrenaline rebound better with your morning deep work block."*
    *   📈 *"Insight: Your 'Inositol' supplement is successfully flattening your post-lunch insulin spike in this scenario."*

## 5. "Scientific Proofreader" (Model Transparency)
Bridging the gap between the "Solo Dev" and the scientific community.

*   **The Feature:** On-demand sourcing for kernels.
*   **Action:** When a user clicks a signal, the AI provides a summary of the peer-reviewed research the kernel's shape is based on (e.g., *"This GH pulse model follows the 1st-order kinetics described in [Research Paper X]"*).
*   **Value:** Increases user trust and scientific authority without requiring the developer to write manual documentation for every signal.

## 6. Voice-First Interventions (The "On-the-Go" Log)
*   **The Feature:** A simple voice button: *"Hey Physim, I just had a double espresso and a croissant."*
*   **AI Action:** Parses the natural language, estimates the `mg` of caffeine and `carbs/sugar/fat` of a croissant (using a nutritional database), and automatically places the intervention on the current timeline.

---

## Strategic Value for the Solo Dev
By integrating AI, you solve the "Data Overload" problem. The app stops being a complex graphing tool and starts being a **translator** that tells the user exactly how to live their day to feel the way they want to feel. This 10xs the "stickiness" of the product and justifies a premium subscription.
