# Physim Onboarding Flow Plan

## Design Philosophy

The core insight from the target market analysis: **Physim is a Simulator, not a Tracker.** Users don't want to log data—they want to understand *why* their body feels the way it does and *what will happen* if they change something.

The onboarding must deliver a **"wow" moment within 90 seconds** while gathering enough data to make the simulation personally relevant. The flow should feel like a conversation with an intelligent co-pilot, not a registration form.

---

## The "Fast Wow" Strategy

### The Problem with Traditional Onboarding
Most health apps front-load 10-15 screens of profile questions before showing any value. This causes:
- High drop-off (40-60% abandon before completion)
- Users entering rushed/inaccurate data
- No emotional hook to continue

### The Physim Approach: "Show First, Ask Second"

**Stage 1: Instant Demo (30 seconds)**
Show the user something magical *before* asking anything. Use a pre-built "universal scenario" that resonates with all target markets.

**Stage 2: Personalization Hook (60 seconds)**
Once they've seen the wow, ask targeted questions that directly affect what they just saw.

**Stage 3: Guided Discovery (2-5 minutes)**
AI-guided exploration of their specific concerns, building their profile through conversation.

**Stage 4: Deferred Deep Setup**
Comprehensive settings (nutrition targets, conditions, advanced signals) are accessible but not required.

---

## The Universal Wow Moment

### "The Coffee Problem"

Every target market understands caffeine. The universal demo:

> *"It's 3:00 PM. You're tired. Should you have a coffee?"*

Show a pre-built timeline with:
- Wake at 7:00 AM
- Coffee at 8:00 AM
- Lunch at 12:30 PM

Then animate adding a 3:00 PM coffee and show:
1. The **Adenosine** curve being blocked (immediate alertness)
2. The **Cortisol** response layering on top
3. The **Melatonin** suppression 8 hours later at 11:00 PM
4. The predicted **Sleep Quality** degradation

**The Hook:** "Want to see what would work better for *your* body?"

This works for all markets:
- **Optimizers**: See the mechanism of caffeine tolerance
- **Neurodivergent**: Understand medication timing interactions
- **Hormonal**: See how cycle phase affects caffeine metabolism
- **Coaches**: Immediately grasp the educational power
- **Researchers**: Appreciate the model complexity

---

## Onboarding Flow Architecture

### Step 0: Entry Point Detection

Before showing anything, detect the user's entry point:

```
Entry Sources:
├── Direct URL (no context)
├── Referral link with persona tag (?persona=adhd)
├── App store description (mobile)
└── "Continue where you left off" (returning user)
```

This allows skipping irrelevant steps and personalizing the demo.

---

### Step 1: The Animated Hook (10 seconds)

**Screen: Full-screen dark canvas**

Animated sequence (no interaction required):
1. A stylized body silhouette fades in
2. Neural pathways light up in the brain
3. Signals ripple through the body
4. Text appears: **"Your biology is a symphony."**
5. Text morphs: **"Let's see what's playing."**

**Purpose:** Establish premium, scientific positioning. Create curiosity.

**Implementation Notes:**
- Use CSS/SVG animation (no heavy libraries)
- Auto-advance after 4 seconds or on tap/click
- Skip button visible but subtle (top right)

---

### Step 2: The Universal Demo (30 seconds)

**Screen: Simplified timeline + single chart view**

**AI Voice (text appears with typing animation):**
> "Let me show you something. Here's a typical Tuesday."

**Animation sequence:**
1. Timeline populates with: Wake (7am), Coffee (8am), Lunch (12pm)
2. Chart shows smooth Energy curve through the morning
3. Playhead scrubs to 3:00 PM
4. Energy curve dips (the afternoon slump)

**AI continues:**
> "It's 3 PM. You're tired. Most people reach for another coffee."

5. Coffee icon appears, hovers over 3:00 PM on timeline
6. User can tap/click to "add" it (or it auto-adds after 2s)

**The Reveal:**
7. Chart animates to show Adenosine, Cortisol, Melatonin
8. "What-if" ghost curve shows the melatonin suppression
9. Sleep quality indicator at 11 PM turns from green to amber

**AI concludes:**
> "That 3 PM coffee just cost you 45 minutes of deep sleep. But there's a better option—*for your specific biology.*"

**CTA Button:** "Personalize My Simulation"

**Implementation Notes:**
- Pre-computed demo data (no worker calculation needed)
- Simplified chart with only 3-4 signals
- Playhead animation creates engagement
- "What-if ghost curve" is the key differentiator

---

### Step 3: The Quick Profile (45 seconds)

**Screen: AI Chat Interface + Card Selection**

**Philosophy:** Use a hybrid of AI chat and clickable cards. The AI asks questions, but users respond by tapping options (not typing). This is faster and mobile-friendly while feeling conversational.

**AI asks:**
> "First, a few quick questions to calibrate your simulation."

**Question 1: Biological Sex**
Cards appear:
- [ ] Male
- [ ] Female
- [ ] Prefer not to say

*Why this matters: Hormonal baselines, cycle tracking, drug metabolism*

**Question 2: Age Range**
Cards appear:
- [ ] 18-25
- [ ] 26-35
- [ ] 36-45
- [ ] 46-55
- [ ] 56+

*Why this matters: HPA axis responsiveness, sleep architecture, recovery rates*

**Question 3: Primary Goal**
> "What brought you here today?"

Cards appear (with icons):
- [ ] **Energy** - "I want consistent energy without crashes"
- [ ] **Sleep** - "I want to sleep better and wake refreshed"
- [ ] **Focus** - "I need to concentrate and be productive"
- [ ] **Mood** - "I want emotional stability"
- [ ] **Performance** - "I want to optimize my body"
- [ ] **Just exploring** - "Show me what this can do"

*This maps directly to the Goal enum and determines chart defaults*

**Implementation Notes:**
- Single-select for each question
- Instant visual feedback on selection
- Progress indicator (dots or bar) showing 3/3 steps
- Allow back navigation
- Store selections immediately to Pinia

---

### Step 4: Market-Specific Path (Branching)

Based on Question 3 (Primary Goal), branch into persona-specific flows:

#### Path A: Energy/Focus/Performance (Optimizer Market)

**AI says:**
> "Got it. Let's rebuild that demo with your baseline."

**Action:** Re-run the coffee demo with their age/sex-adjusted curves.

**AI shows difference:**
> "See how *your* adenosine clearance differs? For a [age] [sex], the optimal caffeine cutoff is [X] PM."

**Deepen the hook:**
> "But caffeine is just one signal. Want to see how your morning routine affects your entire day?"

**CTA:** "Build My Morning"

**Quick Morning Builder:**
- Cards for common morning activities:
  - [ ] Morning sunlight (5-15 min)
  - [ ] Exercise (cardio vs. weights)
  - [ ] Cold shower
  - [ ] Breakfast (high protein vs. carbs vs. skip)
  - [ ] Meditation/breathwork

User taps 2-3, timeline populates, simulation runs.

**Wow delivery:**
> "Adding 10 minutes of morning sunlight just shifted your cortisol peak 30 minutes earlier—and boosted your afternoon focus window by 45 minutes."

---

#### Path B: Sleep (Optimizer + Hormonal Markets)

**AI says:**
> "Sleep is where the magic happens. Let's see what's disrupting yours."

**Question:**
> "What's your biggest sleep challenge?"

Cards:
- [ ] Falling asleep
- [ ] Staying asleep
- [ ] Waking up tired
- [ ] Inconsistent schedule

**Based on answer, show relevant demo:**
- **Falling asleep:** Show blue light + cortisol interaction
- **Staying asleep:** Show alcohol's GABA → Glutamate rebound
- **Waking tired:** Show caffeine half-life accumulation
- **Inconsistent:** Show circadian phase shift modeling

---

#### Path C: Mood (Neurodivergent + Hormonal Markets)

**AI says:**
> "Mood stability comes from neurochemical balance. Let me show you the key players."

**Show simplified dashboard:**
- Dopamine, Serotonin, GABA, Cortisol as four gauges

**Question:**
> "Do you take any medications for focus, mood, or anxiety?"

Cards:
- [ ] Stimulants (Adderall, Ritalin, Vyvanse)
- [ ] Antidepressants (SSRIs, SNRIs)
- [ ] Anxiolytics (benzodiazepines)
- [ ] None currently
- [ ] Prefer not to say

**If stimulants selected → Unlock ADHD-specific demo:**
> "Let me show you something crucial about medication timing..."

**Demo the rebound:**
- Show Ritalin pharmacokinetics
- Show dopamine rise and crash
- Show how meal timing affects absorption
- **Wow:** "Moving your dose 30 minutes after protein breakfast extends your focus window by 2 hours."

---

#### Path D: Exploring / Coach (Practitioner Market)

**AI says:**
> "Welcome to the simulation engine. Let me give you the full tour."

**Mini-tour overlay:**
1. Timeline panel: "Drag interventions here"
2. Charts panel: "Watch signals respond in real-time"
3. AI chat: "Ask me anything or let me build scenarios"
4. Body heatmap: "See organ-level impacts"

**Practitioner hook:**
> "Are you using this for yourself, or to help clients?"

Cards:
- [ ] Personal use
- [ ] I'm a practitioner/coach

**If practitioner:**
> "Perfect. Let me show you how to export a client scenario as a shareable report."

---

#### Path E: Female-Specific (Hormonal Market)

**Triggered if:** Sex = Female AND (Goal = Energy OR Mood OR Sleep)

**AI says:**
> "Your biology has a monthly rhythm that most apps ignore. Let's factor that in."

**Question:**
> "Are you currently tracking your menstrual cycle?"

Cards:
- [ ] Yes, I know my cycle day
- [ ] Roughly, but not precisely
- [ ] No / Not applicable

**If tracking:**
> "What day of your cycle are you on today?"

**Slider:** 1-35 days (with visual cycle phase indicator)

**Wow moment:**
> "You're in the luteal phase. Your GABA sensitivity is lower right now, which means..."

**Show personalized insight:**
- Why sleep might be harder
- Why carb cravings make sense (metabolic rate +10%)
- How to time exercise differently this week

---

### Step 5: Timeline Tutorial (60 seconds)

**Screen: Full studio view with spotlight overlays**

**AI guides:**
> "Now let's build your first real day."

**Interactive tutorial (3 micro-lessons):**

**Lesson 1: Adding an Intervention**
- Spotlight on FAB (floating action button)
- User taps → AddItemModal opens
- Pre-filtered to show goal-relevant items
- User selects one (e.g., "Morning Walk")
- Timeline shows item appear

**Lesson 2: Moving & Adjusting**
- Spotlight on the new item
- Drag to move (with ghost trail showing old position)
- Resize to adjust duration
- Side panel shows parameters

**Lesson 3: Reading the Chart Response**
- Spotlight on relevant chart (e.g., Energy for walk)
- Show the curve shift in real-time
- AI explains: "See how that 20-minute walk boosted your energy baseline for the next 3 hours?"

**Completion:**
> "You've got the basics. The more you add, the more the simulation learns about *your* body."

---

### Step 6: AI Co-Pilot Introduction (30 seconds)

**Screen: AI chat panel slides open**

**AI introduces itself:**
> "I'm your biological co-pilot. You can ask me anything:
> - *'Why am I tired at 2 PM?'*
> - *'What should I eat before my workout?'*
> - *'Add a coffee at 9 AM'*
>
> I can also detect patterns you might miss and suggest experiments."

**First Prompt Suggestion:**
Based on their goal, pre-fill a relevant question:
- Energy: "What's causing my afternoon energy dip?"
- Sleep: "How can I fall asleep faster tonight?"
- Focus: "When is my optimal deep work window?"
- Mood: "What might be affecting my mood stability?"

**User can:**
- Send the suggested prompt (one tap)
- Modify it
- Dismiss and explore freely

---

### Step 7: Soft Landing & Deferred Setup

**Screen: Main studio with subtle overlay**

**AI says:**
> "You're all set to explore. When you're ready to go deeper, here's what's waiting:"

**Cards showing optional next steps:**
- [ ] **Add Conditions** - "Do you have ADHD, PCOS, or other conditions that affect your biology?"
- [ ] **Set Nutrition Targets** - "Dial in your macros for precise metabolic modeling"
- [ ] **Connect Wearables** - "Import sleep and HRV data from Oura, Whoop, or Apple Health"
- [ ] **Explore All Signals** - "See the full library of 48+ biological signals"

**Dismiss option:**
> "Skip for now—you can always access these in Settings"

---

## State Machine Definition

```
OnboardingState {
  HOOK_ANIMATION,
  UNIVERSAL_DEMO,
  QUICK_PROFILE,
  PERSONALIZED_DEMO,
  TIMELINE_TUTORIAL,
  AI_INTRODUCTION,
  SOFT_LANDING,
  COMPLETE
}

Transitions:
  HOOK_ANIMATION → UNIVERSAL_DEMO (auto-advance 4s or tap)
  UNIVERSAL_DEMO → QUICK_PROFILE (CTA tap)
  QUICK_PROFILE → PERSONALIZED_DEMO (all 3 questions answered)
  PERSONALIZED_DEMO → TIMELINE_TUTORIAL (user completes demo interaction)
  TIMELINE_TUTORIAL → AI_INTRODUCTION (3 micro-lessons complete)
  AI_INTRODUCTION → SOFT_LANDING (user sends first message or dismisses)
  SOFT_LANDING → COMPLETE (dismiss or tap any card)

Skip Logic:
  - Tap "Skip" in HOOK_ANIMATION → QUICK_PROFILE
  - Tap "Skip tutorial" in TIMELINE_TUTORIAL → AI_INTRODUCTION
  - Tap "Start exploring" anywhere → COMPLETE

Persistence:
  - State saved to localStorage after each step
  - Returning user resumes from last incomplete step
  - If COMPLETE, never show onboarding again (unless reset)
```

---

## Data Collection Mapping

| Onboarding Step | Data Collected | Store Location |
|-----------------|----------------|----------------|
| Quick Profile Q1 | sex | `profiles.subject.sex` |
| Quick Profile Q2 | age (range → midpoint) | `profiles.subject.age` |
| Quick Profile Q3 | primary goal | `profiles.goals[0]` |
| Path B/C | conditions (medications) | `profiles.conditions` |
| Path E | cycle day | `profiles.subject.cycleDay` |
| Timeline Tutorial | first intervention | `timeline.items[]` |
| AI Introduction | first prompt | `ai.messages[]` |

---

## Technical Implementation Plan

### New Files Required

```
/src/pages/OnboardingPage.vue          # Main onboarding orchestrator
/src/components/onboarding/
  ├── HookAnimation.vue                 # Step 1: Animated intro
  ├── UniversalDemo.vue                 # Step 2: Coffee demo
  ├── QuickProfile.vue                  # Step 3: Card-based questions
  ├── PersonalizedDemo.vue              # Step 4: Persona-specific paths
  ├── TimelineTutorial.vue              # Step 5: Interactive tutorial
  ├── AIPilotIntro.vue                  # Step 6: AI introduction
  └── SoftLanding.vue                   # Step 7: Next steps
/src/stores/onboarding.ts               # Onboarding state management
/src/data/onboarding-demos.ts           # Pre-computed demo data
```

### Store Definition

```typescript
// /src/stores/onboarding.ts
interface OnboardingStore {
  currentStep: OnboardingState
  completed: boolean
  skippedSteps: Set<OnboardingState>
  persona: 'optimizer' | 'neurodivergent' | 'hormonal' | 'practitioner' | null
  quickProfile: {
    sex: 'male' | 'female' | null
    ageRange: string | null
    primaryGoal: Goal | null
  }

  // Actions
  advance(): void
  skipTo(step: OnboardingState): void
  complete(): void
  reset(): void
}
```

### Router Changes

```typescript
// /src/router/index.ts
{
  path: '/',
  component: () => {
    const onboarding = useOnboardingStore()
    return onboarding.completed
      ? import('@/pages/StudioPage.vue')
      : import('@/pages/OnboardingPage.vue')
  }
}
```

### Pre-computed Demo Data

To ensure instant demo performance, pre-compute signal data for:
- Universal coffee demo (3 scenarios: no coffee, 8am coffee, 3pm coffee)
- Morning routine combos (sunlight, exercise, cold exposure)
- Stimulant timing scenarios
- Sleep disruption scenarios
- Cycle phase variations

Store as JSON in `/src/data/onboarding-demos.ts`

---

## Mobile-First Considerations

### Touch Interactions
- All card selections use large tap targets (min 48px)
- Swipe gestures for timeline manipulation
- Long-press for parameter adjustment
- Bottom-anchored CTAs for thumb reach

### Responsive Layout
- Step 1-4: Single column, full-width cards
- Step 5-6: Simplified timeline view (hide side panels)
- Step 7: Collapsible cards

### Performance
- Lazy-load each step component
- Pre-render next step while current is active
- Use CSS animations (not JS) where possible
- Limit chart complexity during onboarding

---

## Analytics & Optimization

### Key Metrics to Track

| Metric | Definition | Target |
|--------|------------|--------|
| Onboarding Completion Rate | Users who reach COMPLETE state | >70% |
| Time to Wow | Seconds from entry to first chart animation | <30s |
| Drop-off per Step | % who abandon at each step | <10% per step |
| Skip Rate | % who skip any step | <20% |
| First Intervention Added | % who add an item during tutorial | >80% |
| First AI Message | % who send an AI prompt | >60% |
| 24h Return Rate | % who return within 24 hours | >40% |

### A/B Test Opportunities
1. Hook animation vs. direct demo
2. 3 questions vs. 5 questions in Quick Profile
3. Auto-advance demo vs. user-controlled
4. AI voice tone (clinical vs. conversational)
5. Persona detection accuracy

---

## Edge Cases & Error Handling

### Returning User Detection
- Check localStorage for partial onboarding state
- Offer: "Welcome back! Continue where you left off?" vs. "Start fresh"

### Browser Refresh Mid-Flow
- State persisted after each step
- Resume from last completed step

### AI Service Unavailable
- Pre-scripted fallback messages for Steps 2, 4, 6
- Demo animations work offline (pre-computed data)
- "AI co-pilot unavailable—we'll introduce you later"

### Cycle Day Edge Case
- If cycle day > cycle length, default to day 1
- Handle "I don't know my cycle day" gracefully

---

## Future Enhancements (Post-MVP)

### Phase 2: Wearable Integration
- "Connect Oura/Whoop" step during onboarding
- Import last 7 days of sleep data
- Show immediate "Your actual sleep vs. simulated" comparison

### Phase 3: Social Proof
- "See how other [persona] users set up their simulation"
- Anonymous aggregate data: "Most ADHD users enable the Dopamine + Adrenaline charts"

### Phase 4: Progressive Profiling
- After 1 week: "You've been using the app daily—want to add nutrition tracking?"
- After notable event: "You added 3 coffee entries this week—want to model caffeine tolerance?"

### Phase 5: Gamification
- "Profile completeness" score
- Achievement badges for completing conditions/nutrition setup
- Weekly "simulation accuracy" feedback based on logged subjective meters

---

## Summary

This onboarding flow prioritizes:

1. **Speed to value** - "Wow" in <30 seconds
2. **Minimal friction** - 3 questions to start
3. **Personalization** - Persona-specific paths
4. **Education** - Learn by doing, not reading
5. **Flexibility** - Skip anything, complete anytime

The hybrid AI chat + card selection pattern makes the experience feel like a conversation while maintaining the speed benefits of structured input. The deferred deep setup respects user time while signaling that more depth is available.

By showing the caffeine demo *before* asking for any data, we flip the traditional onboarding script: instead of "give us your info and we'll show you something," it's "look at this amazing thing—now imagine it calibrated to *you*."
