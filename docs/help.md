## Key Features & User Experience

### 1. The Studio (`StudioPage.vue`)

The main workspace where experimentation happens.

- **Timeline View:** A drag-and-drop interface for scheduling interventions over multiple days. It visualizes duration, intensity, and stacking of events.
- **Signal Charts:** Real-time visualization of simulated signals. Users can overlay different signals (e.g., "Show me Insulin vs. Glucose" or "Dopamine vs. Energy").
- **Inspector:** Detailed view of specific interventions or timepoints.

### 2. Intervention Registry

A comprehensive library of "Agents" categorized by type:

- **Food:** Dynamic construction of meals based on macros, Glycemic Index, and physical properties.
- **Medications:** Prescription drugs (e.g., Adderall, SSRIs) with accurate PK profiles.
- **Supplements:** Over-the-counter compounds (Magnesium, L-Theanine, Omega-3s).
- **Lifestyle:** Activities like Sleep, Meditation, Exercise (Cardio/Resistance), and thermal stress (Sauna/Cold Plunge).

### 3. Personalization & Conditions

Physim moves beyond a "generic human" model:

- **Physiology:** Inputs for Age, Weight, Sex, and Body Fat % scale the PK/PD parameters (e.g., blood volume, metabolic rate).
- **Pathology Modeling:** The "Conditions" engine allows enabling overlays for specific profiles (e.g., ADHD, Depression, PCOS).
  - _Example:_ **ADHD** is modeled not as a flag, but as a specific upregulation of Dopamine Transporter (DAT) density and downregulation of tonic Dopamine firing.
- **Archetypes:** Quick-start profiles (e.g., "Biohacker" for optimization, "Neurodivergent" for regulation).

### 4. Goals System

Users define high-level goals (e.g., "Energy", "Weight Loss", "Calm"). The system intelligently filters the massive list of available signals to show only those relevant to the active goals (e.g., showing _mTOR_ and _Protein_ for hypertrophy, or _GABA_ and _Cortisol_ for anxiety).

## User Interface & Experience

The application is structured around a central "Studio" workspace, supported by a comprehensive modal-based management system for interventions and user profiling.

### 1. The Studio Workspace

The primary interface (`StudioPage.vue`) is a split-pane view dividing the screen into two main functional areas:

- **Timeline (Left Pane):** A drag-and-drop scheduling interface.
  - **Interaction:** Users can drag interventions to move them in time or resize them to change duration.
  - **Playhead:** A vertical line indicates the current simulation time. Clicking anywhere on the timeline updates the playhead, synchronizing the chart values to that specific minute.
  - **Contextual Adding:** Hovering over the playhead reveals an "Add" button, allowing precise insertion of new events at specific times.
  - **Visuals:** Different intervention types (Bolus, Infusion, Continuous, Lifestyle) have distinct visual representations (points vs. bars). Sleep events are specially styled with wake-up indicators.

- **Signal Charts (Right Pane):** A dynamic dashboard of physiological metrics.
  - **Visualization:** Real-time line charts showing the trajectory of signals over 24+ hours.
  - **Grouping & Filtering:** Users can organize charts by **Biological System** (e.g., Nervous, Endocrine), **Goal** (e.g., Energy, Calm), or view a flat list. Filtering options allow focusing on "My Goals" or "Active" signals (only those currently being modified by interventions).
  - **Layouts:** Supports both a dense **Grid View** for high-level patterns and a **List View** for detailed analysis.
  - **Deep Dive:** Clicking a chart expands it to reveal **"Active Contributors"**-a breakdown showing exactly which interventions (e.g., "Coffee") or conditions (e.g., "ADHD") are driving the signal's current value, including the mechanism (e.g., "Adenosine antagonism").

### 2. The Launcher (Add Item Modal)

A unified command center (`AddItemModal.vue`) for introducing new variables into the simulation:

- **Three-Way Navigation:**
  - **Categories:** Browse interventions by type (Food, Exercise, Supplements) or by high-level Goal (Energy, Sleep).
  - **Search:** A global search bar to quickly find specific items like "Adderall" or "Sauna".
  - **Food Search:** A dedicated interface connecting to the **OpenFoodFacts API**. Users can search for real-world food items (e.g., "Oatmeal"), adjust quantities, and log them directly. The system automatically calculates the nutritional profile (Sugars, Starches, Fiber, Fats) to drive the metabolic engine.

### 3. User Profile & Personalization

A comprehensive settings interface (`UserProfileModal.vue`) allows deep customization of the "Digital Twin":

- **Physiology:** Sliders for Age, Weight, and Sex. For female subjects, users can configure **Menstrual Cycle** parameters (Length, Current Day) to simulate hormonal fluctuations (Estrogen/Progesterone dynamics).
- **Conditions Engine:** Users can toggle specific neurophysiological profiles (e.g., **ADHD**, **Depression**, **PCOS**).
  - _Granular Control:_ Each condition has a "Severity" or "Reactivity" slider (0-100%) that scales the underlying biological modifiers (e.g., receptor density, transporter activity).
- **Nutritional Targets:** Users can set daily calorie goals and enable/customize **Macro Ranges** (Protein, Carbs, Fat) to track their diet against specific protocols (e.g., Keto, High-Carb).
- **Subscription Tier:** Toggles between "Free" and "Premium" tiers, unlocking advanced signals (e.g., Neurotransmitters, specific Hormones).

### 4. Inspector & Analysis

- **Floating Inspector:** When an item on the timeline is selected, a floating panel appears detailing its parameters (e.g., dose, intensity, duration).
- **Nutrition Carousel:** A dashboard widget that aggregates daily nutrition data, visualizing progress towards Calorie and Macro targets with radial charts.

## Conclusion

Physim represents a convergence of **Systems Biology** and **Consumer Health Tech**. By simulating the _mechanism of action_ rather than just the _expected outcome_, it provides a powerful, educational tool for understanding the "Black Box" of human physiology. It is designed to empower users to hypothesize, simulate, and verify lifestyle changes in a risk-free digital twin environment.
