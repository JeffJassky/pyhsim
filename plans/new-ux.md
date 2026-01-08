# UX Redesign Plan: "Bio-GPS"

## 1. Design Philosophy: From "Cockpit" to "GPS"

**Current State ("The Cockpit"):** A dense, expert-level interface requiring manual toggling of switches, tabs, and parameters to see results. Powerful, but overwhelming.
**New Vision ("The GPS"):** An intent-driven interface. The user states a destination (e.g., "Fix my sleep," "Optimize focus"), and the system visualizes the path, auto-configuring the view to show relevant data.

**Core Pillars:**
1.  **Context-Aware Visibility:** Only show data relevant to the current user focus or selected event.
2.  **Direct Manipulation:** Interact directly with the simulation curve, not just abstract sliders.
3.  **AI as Orchestrator:** The AI doesn't just chat; it controls the UI, sets up scenarios, and highlights insights.
4.  **Unified Temporal Space:** "Cause" (Interventions) and "Effect" (Signals) live in the same visual coordinate system.

---

## 2. Core Interface Layout

The screen is divided into three primary zones, replacing the rigid sidebar/grid structure.

### A. The "Bio-Stream" (Center Stage)
*   **Concept:** An infinitely scrollable, zoomable timeline that unifies **Events** (Meals, Meds, Sleep) and **Signals** (Hormones, Neurotransmitters).
*   **Behavior:**
    *   **Infinite Zoom:** Scroll out to see weekly circadian rhythms (Sleep/Wake consistency). Scroll in to see minute-by-minute Pharmacokinetics of a caffeine spike.
    *   **Smart Signal Layers:** Instead of manual tabs (Endocrine vs. Neuro), the stream automatically displays signals relevant to the visible interventions.
        *   *Example:* Hover over "Lunch" -> Shows Glucose, Insulin, Ghrelin.
        *   *Example:* Hover over "Ashwagandha" -> Shows Cortisol, GABA, Thyroid.
    *   **Direct Interaction:** Drag a "Sleep" block longer, and watch the "Recovery Score" curve rise in real-time.

### B. The "Command Center" (Bottom Bar / Floating Palette)
*   **Concept:** A simplified, centralized input mechanism replacing disjointed palettes and drawers.
*   **Features:**
    *   **Unified "Add Anything" Button (+):** Opens a smart modal to add Food, Interventions, or Bio-Data.
    *   **Natural Language Input:** "Add coffee at 8am" or "Log a high-carb lunch."
    *   **Spotlight Search (Cmd+K):** Quick navigation to any signal, profile setting, or library item.

### C. The "Insight Rail" (Collapsible Right Panel)
*   **Concept:** Holds the "Inspector," "AI Co-pilot," and "Profile" details. It changes context based on what is selected.
*   **Modes:**
    *   **Selection Mode:** (When an item is clicked) Shows parameters (dose, time) and specific "upstream/downstream" effects.
    *   **Simulation Mode:** (Default) Shows high-level gauges (Day Score, Recovery, Focus) and AI insights ("Your late coffee is reducing deep sleep by 15%").

---

## 3. Key Feature Re-imagination

### 3.1. Intelligent & Dynamic Charting ("Auto-Focus")
*   **Problem:** User has to hunt through tabs to find the effect of an intervention.
*   **Solution:**
    *   **Causal Highlighting:** When an intervention is selected, the system dims irrelevant signals and highlights the specific pathways affected by that intervention.
    *   **"Why?" Tooltips:** Hovering over a signal spike (e.g., high Cortisol) draws a connecting line back to the causing event (e.g., "Stress Event" or "Fast").

### 3.2. Scenario "Time-Travel" & Stacking
*   **Problem:** Comparing "Plan A" vs. "Plan B" is difficult.
*   **Solution:** **"Ghost Scenarios"**
    *   **Mechanism:** Create a "Branch" of the current timeline.
    *   **Visuals:** The original timeline remains as a faint grey "Ghost Curve." The new changes (e.g., "What if I take Magnesium?") overlay in bright color.
    *   **Value:** Instant visual confirmation of efficacy (e.g., "See? Magnesium lowers the latency to sleep by 20 mins").

### 3.3. Centralized Profile Management (" The Bio-Avatar")
*   **Problem:** Profile settings are buried in a list of numbers.
*   **Solution:** **Visual Avatar Modal**
    *   **Visuals:** A stylized human figure representing the "Subject."
    *   **Status Indicators:** Icons on the avatar represent states (e.g., "Luteal Phase" icon on lower abdomen, "Inflamed" red glow on joints/head).
    *   **Preset Switcher:** One-click toggle between "Baseline Me," "Stressed Me," "Sick Me," or "On Cycle."
    *   **Sensitivities:** Explicit toggles for "Caffeine Slow Metabolizer," "Insulin Resistant," etc., which auto-adjust underlying engine weights.

### 3.4. AI-First "Co-Pilot"
*   **Problem:** AI is currently a passive chat box.
*   **Solution:** **Active UI Controller**
    *   **Generative Schedules:** "Plan a perfect day for deep work." -> AI generates the entire timeline with wake time, light exposure, specific nootropics, and meal timing.
    *   **Root Cause Analysis:** User asks "Why do I feel anxious?" -> AI highlights the *Norepinephrine* curve and zooms the timeline to the *Yohimbine* taken 3 hours ago.
    *   **Intervention Recommendation:** "I need to wake up." -> AI suggests "Cold Shower" or "Bright Light" and offers to add it to the timeline.

### 3.5. Improved Intervention Browsing ("The Pharmacy")
*   **Problem:** Simple list is uninspiring and uninformative.
*   **Solution:** **Rich Marketplace Modal**
    *   **Categorization:** "Energy," "Sleep," "Cognition," "Longevity."
    *   **Rich Cards:** Each item shows:
        *   **Mechanism:** "Adenosine Antagonist"
        *   **Duration:** "4-6 Hours"
        *   **"Best For":** "Morning grogginess"
    *   **Quick Compare:** Select two items (e.g., "Caffeine" vs. "Teacrine") to see their curves side-by-side before adding.

---

## 4. User Journey Examples

### A. The "Crash" Detective (Target: Performance Optimizer)
1.  **Trigger:** User feels tired at 3 PM.
2.  **Action:** Opens Physim.
3.  **View:** The "Bio-Stream" is already focused on "Current Time."
4.  **Insight:** The "Insight Rail" shows a "Dip Alert": "Hypoglycemic crash detected."
5.  **Interaction:** User hovers over the Glucose dip. A line draws back to the "High Carb Pasta" lunch at 12 PM.
6.  **Simulation:** User clicks "Fix this." AI suggests "Add 1 tbsp Vinegar" or "Change to Complex Carbs."
7.  **Result:** User accepts "Add Vinegar." The ghost curve shows the glucose stabilizing.

### B. The "Executive Function" Planner (Target: Neurodivergent)
1.  **Trigger:** User has a big presentation at 10 AM tomorrow.
2.  **Action:** User tells Co-pilot: "Prepare me for high focus tomorrow morning."
3.  **Result:** AI populates the timeline:
    *   **7:00 AM:** Wake + 10k Lux Light (Sets Circadian rhythm).
    *   **7:30 AM:** High Protein Breakfast (Tyrosine source).
    *   **9:00 AM:** L-Theanine + Caffeine (Synergistic focus without jitters).
4.  **Verification:** User checks the "Focus Meter" curve in the stream, seeing it peak exactly at 10:00 AM.

---

## 5. Technical Implementation Steps

1.  **Refactor Layout:** Replace `AppShell` grids with a Z-Layered layout (Canvas bottom, UI overlays top).
2.  **Unified Canvas Component:** Create `BioStream.vue` merging `TimelineView` and `SignalChart` logic using a shared coordinate system (D3.js or Vis.js).
3.  **Global Selection State:** Implement a `SelectionStore` that drives the "Smart Signal Layers" logic.
4.  **Modal System:** Build a robust `OverlayManager` for the "Pharmacy," "Avatar," and "Command Center" modals.
5.  **AI Function Calling:** Hook up the AI Chat to specific store actions (`timeline.addItem`, `view.focusSignal`) to enable "Active UI Control."
