# Mobile UX Plan: "Physim Pocket"

## 1. Design Philosophy: "The Pocket Bio-Coach"

**Desktop:** "The GPS" (Planning, Analysis, Deep Dive).
**Mobile:** "The Compass" (Navigation, execution, quick logging, status checks).

**Core Mobile Pillars:**
1.  **Glanceability:** The user should know their "Biological Weather" (current state & next 2 hours) in < 3 seconds.
2.  **Thumb-Driven Navigation:** All primary actions (Log, Chat, Navigate) must be reachable with one hand (bottom 30% of screen).
3.  **Contextual Orientation:**
    *   **Portrait Mode:** Action, Status, Feed, Chat.
    *   **Landscape Mode:** Deep Analysis (Full-screen charts).
4.  **Haptic & Sensory Feedback:** Use vibration to "feel" the simulation (e.g., a haptic "thud" when a crash is predicted).

---

## 2. Core Navigation Structure ("The Thumb Deck")

The app revolves around a persistent **Bottom Navigation Bar** with 5 destinations:

1.  **Status (Home):** The "Now" dashboard. High-level gauges and immediate timeline.
2.  **Timeline:** A dedicated view for managing the day's schedule (the horizontal stream).
3.  **Action (Center FAB):** A prominent, floating "+" button for logging and interventions.
4.  **Coach (AI):** Dedicated chat interface.
5.  **Me (Profile):** The Bio-Avatar and long-term trends.

---

## 3. Screen-by-Screen Breakdown

### A. The "Status" Screen (Home)
*   **Top Header:** "Bio-Weather" Summary.
    *   *Text:* "Focus Peaking in 15 mins."
    *   *Visual:* Background gradient shifts color based on dominant neurostate (Red=Adrenaline, Blue=Calm, Gold=Focus).
*   **Center Stage: The "Playhead" Card:**
    *   A large, swipeable card showing **NOW**.
    *   **Gauges:** 3 circular meters (Energy, Mood, Focus) with trend arrows.
    *   **Next Up:** A pill showing the next upcoming event (e.g., "Lunch @ 12:30").
*   **Bottom Section: "The Horizon":**
    *   A simplified sparkline graph showing the next 4 hours of *one* key metric (auto-selected by AI, e.g., Energy).

### B. The "Timeline" Screen (Interaction)
*   **Layout:** A **Horizontal Scroll** (Filmstrip style) takes center stage.
    *   **Top Track:** "Events" (Pills for Meals, Meds, Sleep).
    *   **Bottom Track:** "Signals" (A synchronized curve flowing beneath the events).
*   **Interaction:**
    *   **Pinch:** Zoom time scale (Day vs. Hour).
    *   **Tap Event:** Opens a "Half-Sheet" (Bottom Sheet) with details and quick actions (Edit Time, Delete, Clone).
    *   **Tap Empty Space:** "Quick Add" menu appears at that timestamp.
*   **The "Signal Lens":**
    *   Since vertical space is tight, the user selects *which* signal to view via a pill selector above the graph ("Show: Dopamine").
    *   **Smart Context:** Tapping a "Coffee" event automatically switches the graph to "Adenosine."

### C. The "Deep Dive" (Landscape Mode)
*   **Trigger:** Simply rotating the phone to landscape.
*   **View:** Full-screen Signal Chart (Desktop-like experience).
*   **Features:**
    *   Multi-signal overlay.
    *   Crosshair inspection (touch and drag to see values).
    *   Best for "Forensics" (figuring out why you crashed).

### D. The "Action" Modal (Center FAB)
*   **Trigger:** Tap the center "+" button.
*   **Design:** A "Speed Dial" or Grid Menu that slides up.
*   **Input Methods:**
    *   **Voice First:** Large microphone icon. "I just drank a double espresso." (NLP parses and logs it).
    *   **Quick Hits (Recents):** 4 buttons of most common actions (e.g., "Water", "Coffee", "Lunch", "Toilet").
    *   **Barcode Scanner:** For food logging.
    *   **Photo Logger:** Snap a pic of a meal -> AI estimates macros -> Logs event.

### E. The "Bio-Avatar" (Profile Tab)
*   **Visual:** A rotatable 3D or 2D mannequin.
*   **Interaction:**
    *   Tap **Head:** Configure Neuro/Mental settings (ADHD, Anxiety).
    *   Tap **Stomach:** Configure Gut/Metabolic settings (Fasting, Keto).
    *   Tap **Reproductive:** Cycle tracking/Hormonal phase.
*   **"Tamagotchi" Status:**
    *   The Avatar changes appearance based on *simulated* state.
    *   *Example:* If inflammation is high, the Avatar glows red. If sleep deprived, it has bags under eyes.

---

## 4. Mobile-Specific Features

### 4.1. "Live Activity" (iOS) / Widget
*   **Lock Screen:** A persistent widget showing:
    *   Current dominant state (e.g., "Focus Zone").
    *   Time until next state change (e.g., "Crash in 20 mins").
    *   A mini-graph of Energy.
*   **Value:** User doesn't even need to unlock the phone to know if they should drink coffee or wait.

### 4.2. Haptic "Nudges"
*   **Concept:** The app notifies you of *internal* state changes, not just external reminders.
*   **Examples:**
    *   **The "Crash Alert":** A double-throb vibration 15 mins before glucose/dopamine drops. Notification: "Energy dipping soon. Eat a snack?"
    *   **The "Window Open":** A light "ping" when Melatonin crosses the sleep threshold. Notification: "Sleep window is open."

### 4.3. Intelligent "Smart Stacks" (Carousel)
*   On the Home Screen, a swipeable carousel of cards generated by AI:
    *   **Card 1 (Warning):** "High Cortisol detected."
    *   **Card 2 (Action):** "Take L-Theanine?" (One-tap log).
    *   **Card 3 (Education):** "Why? You had coffee too late."

---

## 5. User Journey: The Mobile Loop

### Scenario: The "On-The-Go" Biohacker
1.  **08:00 AM (Notification):** Watch/Phone buzzes. "Cortisol peak achieved. Ideal time for deep work."
2.  **08:05 AM (Action):** User sits at desk. Taps "Action FAB" -> "Quick Hit: Coffee."
3.  **10:30 AM (Check):** User feels jittery. Opens app.
    *   **Home Screen:** Shows "Sympathetic Overload" (Red background).
    *   **Insight:** "Caffeine + Stress. Heart Rate variability is dropping."
    *   **Suggestion:** "Do 5 mins breathing." Button: [Start Breathwork].
4.  **10:35 AM (Intervention):** User taps [Start Breathwork].
    *   App plays audio guide.
    *   Simulated "Vagal Tone" curve on screen rises in real-time.
5.  **01:00 PM (Logging):** User eats lunch.
    *   Taps FAB -> Camera.
    *   Snaps photo of salad.
    *   AI: "Chicken Caesar Salad detected. Added to timeline."

---

## 6. Technical Implementation Strategy (Mobile First)

1.  **Responsive Layout Engine:**
    *   Use CSS Grid/Flexbox to radically alter layout based on `window.innerWidth`.
    *   Mobile: Stacked (Status -> Timeline). Desktop: Z-Layered (Stream -> Rail).
2.  **Touch Components:**
    *   Replace standard `<input>` sliders with large, thumb-friendly drag targets.
    *   Implement "Swipe-to-Delete" for timeline items.
3.  **PWA Capabilities:**
    *   Ensure `manifest.json` allows "Add to Home Screen" with full-screen display.
    *   Use Notification API for the "Crash Alerts."
4.  **Performance:**
    *   The simulation engine (`engine.worker.ts`) must run efficiently on mobile CPUs to save battery.
    *   Throttle chart rendering FPS when not actively interacting.
5.  **Camera/Voice Integration:**
    *   Use browser MediaDevices API for camera/mic access.
    *   Connect to OpenAI Whisper/Vision API for processing.
