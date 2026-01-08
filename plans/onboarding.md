# Physim Onboarding Strategy: The "Bio-Pilot" Protocol

## Core Philosophy
**"Show, Don't Just Tell."**
Instead of a generic 20-step wizard, the onboarding is a **live consultation** with the Bio-Pilot AI. The user enters their data, and the AI *immediately* builds a simulation on the screen to reflect that data. The "Wow" moment comes from seeing their own biology modeled in real-time.

## Phase 1: The "Handshake" & Archetype Selection
**Goal:** Establish the AI persona and categorize the user into one of the 3 primary target markets (Optimizer, Neurodivergent, Hormonal) to tailor the subsequent flow.

### UI / Interaction
1.  **Welcome Screen:** A clean interface with the Bio-Pilot chat active.
2.  **AI Greeting:** "Welcome to Physim. I am your biological simulator. To build your model, I need to know whose physiology I am simulating. Which of these sounds most like you?"
3.  **Selection Chips (Hybrid Input):** The user clicks a card, but can also type.
    *   **🚀 The Optimizer:** "I want peak performance, longevity, and perfect sleep."
    *   **🧠 The Neuro-Hacker:** "I manage ADHD, focus, or sensory processing."
    *   **🧬 The Hormonal Synchronizer:** "I want to track my cycle, PCOS, or hormonal health."
    *   **🩺 The Coach:** "I manage health for others."

### Technical Action
*   AI sets the internal `user_archetype` context.
*   AI enables specific `Signal` sets in `enabledSignals` based on selection (e.g., Enable `dopamine/norepi` for Neuro-Hacker, `estrogen/progesterone` for Hormonal).

---

## Phase 2: The "Digital Twin" Setup (Fast Data Entry)
**Goal:** Get the minimum viable variables to run the physics engine (`weight`, `sex`, `cycle`).

### Interaction
*   **AI Prompt:** "Understood. To calculate your pharmacokinetics (how fast your body processes things), I need your baseline specs."
*   **Form Overlay:** A distinct, sleek form appears *inside* or above the chat stream (not a separate modal) asking for:
    *   Age
    *   Sex (Male/Female)
    *   Weight (kg/lbs)
    *   *If Female:* Cycle Phase / Last Period Date.
    *   *If Neuro-Hacker:* "Do you take any standard medications?" (Optional dropdown for Ritalin/Adderall generics).
*   **User Action:** Fills form -> Clicks "Calibrate Model."

### The "Wow" Visual (Instant Feedback)
*   As soon as they hit "Calibrate":
    *   **If Female:** The `Chart` immediately renders the monthly hormone curve (Estrogen/Progesterone) for the current month. **AI:** "I've generated your hormonal baseline. You are currently in the [Luteal] phase, meaning your baseline temperature is higher and insulin sensitivity is slightly lower."
    *   **If Male/Optimizer:** The `Chart` renders a circadian Testosterone/Cortisol rhythm. **AI:** "I've generated your circadian baseline. Your peak cortisol output is at 07:00."

---

## Phase 3: The "Magic Trick" (Problem -> Simulation)
**Goal:** Demonstrate the *causal* simulation engine by solving a specific pain point.

### Interaction
*   **AI Prompt:** "What is the one thing you want to fix *today*?"
*   **Dynamic Chips (Contextual):**
    *   *(Optimizer)*: "Wake up tired," "Afternoon crash," "Deep work focus."
    *   *(Neuro)*: "Medication rebound," "Sensory overwhelm," "Sleep procrastination."
    *   *(Hormonal)*: "PMS mood," "Period pain," "Low energy."

### Scenario Generation (The Hook)
Let's say the user chooses **"Afternoon crash"**.

1.  **AI Action:** "Let me simulate a typical day that leads to a crash. Watch the timeline."
2.  **Automated Tool Use:** The AI automatically runs:
    *   `add_intervention(coffee, 07:00)`
    *   `add_intervention(high_carb_lunch, 12:30)`
    *   `add_intervention(stress_event, 13:00)`
3.  **Visual Result:** The chart draws a massive **Glucose** spike followed by a drop, and an **Adenosine** (sleep pressure) curve that isn't suppressed enough.
4.  **AI Explanation:** "See that dip at 14:30? That is your simulated glucose crash coupled with the caffeine wearing off. This is the physiological basis of your fatigue."

---

## Phase 4: The "Intervention" (Teaching the UI)
**Goal:** Teach the user how to add items and interact with the timeline to *fix* the simulation.

### Interaction
*   **AI Challenge:** "Let's fix this. Try adding a 'Walk' after lunch, or change the lunch to 'Low Carb'. You can type it, or use the + button."
*   **User Action:** Types "Add a walk at 1pm" OR clicks `+ Add Item` -> `Walk`.
*   **The Result:**
    *   The simulation re-runs.
    *   The "Crash" dip on the chart flattens out.
    *   The **Energy** meter stays green.
*   **AI Validation:** "Brilliant. Notice how the muscle contraction from the walk blunted the glucose spike by activating AMPK? You just engineered a better afternoon."

---

## Phase 5: The "Dashboard" Tour (Closing the Loop)
**Goal:** Briefly explain the layout now that it's populated with data.

*   **AI Guide:** "You are now running a live simulation."
    *   **Highlight Timeline:** "This is your day. Drag items to reschedule them." (User is encouraged to drag the 'Walk' to see the curve shift).
    *   **Highlight Meters:** "These are your subjective outputs (Focus, Calm, Energy). They update instantly."
    *   **Highlight Bio-Pilot:** "I am always here. Ask me 'What happens if I take magnesium tonight?' or 'Why is my heart rate high?'"

## Technical Requirements for Implementation

1.  **Preset Scenarios:** We need pre-baked "Bad Day" scenarios for each archetype (ADHD Crash, PMDD Day, Bad Sleep Day) to load instantly in Phase 3.
2.  **Tool Chaining:** The AI needs to be able to execute multiple `add_intervention` calls in a single turn to build the "Bad Day" visualization rapidly.
3.  **Reactive Chart:** The chart needs to handle the "Empty State" gracefully (maybe showing ghost baselines) before the user enters data.
4.  **Welcome Mode:** A specific `appState` mode that hides complex toolbars until the tutorial unlocks them.

## Next Steps
1.  Implement the `user_archetype` logic in `ProfilesStore`.
2.  Create the "Bad Day" script templates.
3.  Build the Onboarding Chat overlay component.
