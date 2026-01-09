# Extended Timescales & Historical Tracking: Feasibility Report

## Executive Summary

This report analyzes what would be required to extend Physim from its current 24-hour simulation paradigm to support:

1. **Long-term Simulation**: Weeks, months, or years of forward simulation
2. **Historical Tracking**: Recording and analyzing past interventions and outcomes

The current architecture has strong foundations for multi-day simulation (homeostasis state persistence, menstrual cycle support), but significant work is needed for truly extended timescales. Historical tracking is a fundamentally different use case that requires rethinking several core assumptions.

---

## Part 1: Current Architecture Analysis

### 1.1 The 24-Hour Constraint

The system is deeply tied to a 24-hour cycle at multiple levels:

#### Grid Generation (`src/utils/time.ts:20-26`)
```typescript
export const rangeMinutes = (step: number): Minute[] => {
  const arr: Minute[] = [];
  for (let i = 0 as Minute; i < MINUTES_IN_DAY; i = (i + step) as Minute) {
    arr.push(i);
  }
  return arr;
};
```
- Grid is always 0 to 1439 minutes (24 hours)
- At 5-minute resolution: 288 data points per signal
- With ~50 signals: ~14,400 Float32 values per day (~58KB)

#### Baseline Functions (`src/models/signals.ts`)
All baseline functions use circadian patterns that wrap at 24 hours:
```typescript
const wrapMinute = (minute: Minute) => {
  let m = minute % MINUTES_IN_DAY;
  if (m < 0) m += MINUTES_IN_DAY;
  return m as Minute;
};
```

Key patterns used:
- `gaussian(minute, centerHours, widthMinutes)` - bell curves centered on times of day
- `periodicWindow(minute, startHour, endHour)` - time windows (e.g., melatonin at night)
- `sigmoid((m - minutes(X)) / slope)` - smooth transitions at times of day

#### Timeline Store (`src/stores/timeline.ts`)
- Items have ISO timestamps but are filtered by `selectedDate`
- All nutrition totals are computed per-day
- No aggregation across days

### 1.2 Existing Multi-Day Foundations

The codebase does have some multi-day awareness:

#### Homeostasis State Persistence (`src/models/homeostasis.ts`)
```typescript
export interface HomeostasisStateSnapshot {
  glucosePool: number;
  insulinPool: number;
  adenosinePressure: number;
  receptorStates: Record<string, number>;
  // ... 15+ state variables
}
```
- State can be serialized and restored between simulation runs
- `WorkerComputeRequest` accepts `initialHomeostasisState`
- Worker returns `finalHomeostasisState` for chaining

#### Menstrual Cycle (`src/models/subject.ts`)
```typescript
const getDayOfCycle = (minute: Minute, cycleLength: number, startDay: number) => {
  const day = Math.floor(minute / MINUTES_IN_DAY) + startDay;
  return day % cycleLength;
};
```
- Already handles multi-day hormone patterns
- Estrogen, progesterone, LH, FSH vary across 28-day cycles

---

## Part 2: Requirements for Long-Term Simulation

### 2.1 Memory & Performance

**Problem**: Simulating 1 year at current resolution:
- 365 days × 288 points × 50 signals × 4 bytes = **21 MB** of Float32 data
- Plus JavaScript array overhead: ~40-60 MB total
- UI rendering 100K+ data points per chart: extremely slow

**Solutions**:

| Approach | Pros | Cons |
|----------|------|------|
| **Adaptive Resolution** | Detailed when needed, compressed when not | Complex implementation, interpolation needed |
| **Hierarchical Storage** | Keep summaries + full detail for selected days | Multiple data structures to maintain |
| **Streaming/Windowed** | Never hold full year in memory | Lose ability to zoom out to full timeline |
| **Web Workers + IndexedDB** | Offload storage, compute on demand | Latency for historical access |

**Recommendation**: Hierarchical storage with three tiers:
1. **Minute-level**: Current day and selected days (full fidelity)
2. **Hourly aggregates**: Rolling 30-day window (min/max/mean per hour)
3. **Daily summaries**: Full history (key metrics: peak, nadir, AUC, time-in-range)

### 2.2 Baseline Function Extensions

Current baselines only model circadian (24-hour) rhythms. Extended timescales require:

#### Ultradian Rhythms (< 24 hours)
- Growth hormone pulsatility (90-120 minute cycles)
- REM/NREM sleep architecture (90-minute cycles)
- Cortisol micro-pulses

#### Infradian Rhythms (> 24 hours)
- **Weekly patterns**: Stress accumulation, social rhythms
- **Monthly patterns**: Menstrual cycle (already partially implemented)
- **Seasonal patterns**: Vitamin D, melatonin amplitude, testosterone
- **Aging effects**: Gradual decline in hormone levels, receptor sensitivity

**Implementation Approach**:
```typescript
interface ExtendedBaselineContext extends BaselineContext {
  dayOfYear: number;        // 0-364 for seasonal
  dayOfWeek: number;        // 0-6 for weekly
  monthsFromStart: number;  // For aging/adaptation
  cumulativeStress: number; // Allostatic load
}

const seasonalMelatonin = (minute: Minute, ctx: ExtendedBaselineContext) => {
  const baseCircadian = circadianMelatonin(minute, ctx);
  // Winter: longer, higher amplitude; Summer: shorter, lower
  const seasonalAmplitude = 1 + 0.3 * Math.cos((ctx.dayOfYear - 172) * 2 * Math.PI / 365);
  return baseCircadian * seasonalAmplitude;
};
```

### 2.3 New Physiological Phenomena

Extended timescales unlock phenomena that don't appear in 24-hour windows:

| Phenomenon | Timescale | Signals Affected | Implementation Complexity |
|------------|-----------|------------------|--------------------------|
| **Caffeine tolerance** | Days-weeks | Adenosine receptors | Medium (receptor adaptation exists) |
| **Training adaptation** | Weeks | VO2max, resting HR, mitochondrial density | High (new state variables) |
| **Chronic stress (burnout)** | Weeks-months | Cortisol, DHEA, HPA axis | High (allostatic load model) |
| **Weight change** | Weeks-months | Leptin, insulin sensitivity, body comp | High (energy balance model) |
| **Seasonal depression (SAD)** | Months | Serotonin, dopamine, mood | Medium (tie to light exposure) |
| **Menopause/Andropause** | Years | Sex hormones, bone density | Medium (age-based profiles) |
| **Medication tolerance** | Days-weeks | Receptor density, enzyme induction | Medium (already started) |

### 2.4 Engine Architecture Changes

#### Current Flow (Single Day)
```
Timeline Items → Worker → 24-hour grid → Series Arrays → Charts
```

#### Proposed Flow (Multi-Day)
```
Timeline Items (all dates)
    ↓
Day Scheduler (determines simulation order)
    ↓
For each day:
    Initial State (from previous day or defaults)
        ↓
    Worker (computes single day)
        ↓
    Final State → Storage
        ↓
    Aggregated Data → Storage
    ↓
UI requests specific day/range → Load from storage → Charts
```

**Key New Components**:
1. **Day Scheduler**: Queues days for computation, handles dependencies
2. **State Manager**: Loads/saves homeostasis state per day
3. **Aggregate Store**: Maintains hourly/daily summaries
4. **Range Query Engine**: Efficiently retrieves data for any date range

### 2.5 UI/UX Considerations

| Feature | Change Required |
|---------|-----------------|
| **Date Navigation** | Calendar picker, week/month/year views |
| **Timeline View** | Multi-day gantt view, recurring patterns |
| **Charts** | Zoom levels (hour → day → week → month), trend overlays |
| **Playhead** | Scrub across days, jump to specific dates |
| **Insights** | Weekly patterns, monthly trends, anomaly detection |
| **Performance** | Virtualized rendering, progressive loading |

---

## Part 3: Requirements for Historical Tracking

Historical tracking is a fundamentally different paradigm from simulation. The simulation asks "what would happen if?" while tracking asks "what did happen, and can we learn from it?"

### 3.1 Core Conceptual Differences

| Aspect | Simulation | Tracking |
|--------|------------|----------|
| **Data Source** | Computed from models | Imported from real observations |
| **Ground Truth** | Model is truth | Observations are truth |
| **Time Direction** | Forward projection | Backward recording |
| **Uncertainty** | Model assumptions | Measurement noise |
| **Purpose** | Planning, experimentation | Reflection, calibration |

### 3.2 Data Import Mechanisms

**Sources to Support**:
1. **Manual Entry**: User logs meals, activities, mood
2. **Wearable Sync**: Apple Health, Garmin, Oura, Whoop
3. **CGM Data**: Dexcom, Libre (glucose as ground truth)
4. **Lab Results**: Blood panels, hormone tests
5. **App Integrations**: MyFitnessPal, Cronometer, sleep apps

**Data Structures**:
```typescript
interface ObservedDataPoint {
  signal: Signal;
  timestamp: ISODateString;
  value: number;
  source: 'manual' | 'wearable' | 'lab' | 'cgm';
  confidence: number;  // 0-1, how reliable is this observation?
  metadata?: {
    device?: string;
    units?: string;
    notes?: string;
  };
}

interface TrackedDay {
  date: string;
  interventions: TimelineItem[];  // What the user did
  observations: ObservedDataPoint[];  // What was measured
  simulatedSeries?: Record<Signal, Float32Array>;  // Optional: model prediction
}
```

### 3.3 Model Calibration (The Big Opportunity)

With real observations, we can calibrate the simulation to the individual:

#### Personal Parameter Estimation
```typescript
interface PersonalCalibration {
  // Baseline adjustments from observed patterns
  baselineOffsets: Partial<Record<Signal, number>>;
  baselineAmplitudes: Partial<Record<Signal, number>>;
  baselinePhaseShifts: Partial<Record<Signal, number>>;

  // Pharmacokinetic personalization
  drugClearanceScalars: Record<InterventionKey, number>;  // e.g., "I metabolize caffeine 30% faster"

  // Sensitivity coefficients
  signalSensitivities: Partial<Record<Signal, number>>;  // e.g., "glucose spikes 20% more for me"

  // Confidence in each estimate
  calibrationConfidence: Partial<Record<string, number>>;
}
```

#### Calibration Workflow
1. User logs interventions and observes outcomes for 1-2 weeks
2. System compares predicted vs observed values
3. Optimization algorithm adjusts personal parameters to minimize error
4. Future simulations use personalized parameters
5. Continuous refinement as more data comes in

**Mathematical Approach**:
- Bayesian parameter estimation
- Start with population priors (current model defaults)
- Update with individual observations
- Handle sparse, noisy observations gracefully

### 3.4 Comparison & Analysis Features

**Simulation vs Reality Dashboard**:
```
┌─────────────────────────────────────────────────────────┐
│  Glucose - Monday, January 6                            │
│  ─── Predicted   ─── Observed (CGM)                     │
│                                                         │
│  120 ┤        ╭──╮                                      │
│      │       ╱    ╲    ╱╲                               │
│  100 ┤──────╱      ╲──╱  ╲────────                      │
│      │     ╱        ╲╱                                  │
│   80 ┤────╱─────────────────────────                    │
│      └────┬────┬────┬────┬────┬────                     │
│          6am  9am  12pm 3pm  6pm  9pm                   │
│                                                         │
│  Model Error: RMSE 8.2 mg/dL | Suggested: +15% insulin  │
│  sensitivity                                            │
└─────────────────────────────────────────────────────────┘
```

**Pattern Analysis**:
- "Your glucose tends to spike 30% more than predicted after high-carb breakfasts"
- "Caffeine affects you for 2 hours longer than average"
- "Your cortisol awakening response is 20% lower than the model predicts"

### 3.5 Privacy & Data Architecture

Historical data is sensitive. Architecture must support:
- **Local-first storage**: User data stays on device by default
- **Optional cloud sync**: End-to-end encrypted if user opts in
- **Data export**: Full data portability (JSON, CSV)
- **Selective sharing**: Share anonymized patterns with researchers

---

## Part 4: Implementation Roadmap

### Phase 1: Multi-Day Foundation (Weeks 1-4)
1. Extend `rangeMinutes` to support multi-day grids
2. Implement day-chaining with homeostasis state
3. Add date range to WorkerComputeRequest
4. Create IndexedDB storage for historical simulation results
5. Build basic multi-day timeline UI

### Phase 2: Adaptive Resolution (Weeks 5-8)
1. Implement hierarchical data storage
2. Create aggregate computation (hourly/daily)
3. Add zoom levels to charts
4. Optimize rendering for large datasets
5. Add weekly/monthly baseline modulations

### Phase 3: Historical Tracking MVP (Weeks 9-12)
1. Build observation data structures
2. Create manual entry UI for interventions and observations
3. Implement simulation vs observation comparison view
4. Add basic model error metrics
5. Store observations alongside simulations

### Phase 4: Wearable Integration (Weeks 13-16)
1. Apple HealthKit integration (iOS)
2. Garmin/Oura API integration
3. CGM data import (Dexcom/Libre)
4. Automatic intervention inference from activity data
5. Real-time observation streaming

### Phase 5: Personal Calibration (Weeks 17-20)
1. Implement parameter estimation framework
2. Build calibration UI (wizard-style)
3. Add per-user parameter storage
4. Create "confidence" indicators for predictions
5. Continuous calibration from new observations

### Phase 6: Extended Phenomena (Weeks 21-24)
1. Seasonal baseline modulations
2. Training adaptation models
3. Chronic stress / burnout modeling
4. Long-term tolerance/sensitization
5. Weight/body composition changes

---

## Part 5: Technical Debt & Risks

### 5.1 Breaking Changes Required

| Change | Impact | Migration |
|--------|--------|-----------|
| `Minute` type expansion | Type system, all baselines | Gradual, can coexist |
| Storage format | Saved scenarios | Version migration |
| Grid generation | All chart code | New component |
| Timeline store | Multi-day support | Major refactor |

### 5.2 Performance Risks

- **ODE solver scaling**: Current RK4 solver may be slow for multi-year simulations
- **Memory pressure**: Mobile devices may struggle with large datasets
- **UI responsiveness**: React/Vue reactivity with huge arrays

**Mitigations**:
- Batch ODE solving in web worker
- Use WebAssembly for math-heavy loops
- Implement virtualized charts (only render visible portion)
- Progressive/lazy loading of historical data

### 5.3 Scientific Risks

- **Model validity at long timescales**: Current models are validated for acute effects, not chronic adaptation
- **Cumulative error**: Small errors compound over months
- **Individual variation**: Long-term phenomena vary more between individuals

**Mitigations**:
- Engage chronobiologists and endocrinologists (per `docs/team.md`)
- Implement uncertainty quantification
- Heavy reliance on calibration from real observations

---

## Part 6: Recommendations

### For Long-Term Simulation
**Feasibility: High, but significant effort**

The architecture has the right foundations (homeostasis state, ODE solvers). The work is primarily:
1. Grid and storage infrastructure
2. Adding slower-timescale phenomena
3. UI for navigating long periods

**Start with**: Multi-day chaining using existing homeostasis state. This gives immediate value (see effects of multiple nights of poor sleep) with minimal changes.

### For Historical Tracking
**Feasibility: Medium, different paradigm**

This is less about extending current code and more about building parallel systems:
1. Observation data layer
2. Import pipelines
3. Comparison/calibration engine

**Start with**: Manual logging of simple observations (mood, energy ratings) with comparison to predicted values. This validates the concept before building complex integrations.

### Hybrid Approach (Recommended)
The most powerful system combines both:
1. Track historical interventions and observations
2. Run simulation on historical days for comparison
3. Calibrate model to individual
4. Project forward with personalized parameters

This turns Physim from "generic simulation" into "your personal digital twin."

---

## Appendix A: Data Volume Estimates

| Scenario | Resolution | Signals | Storage | Compute Time |
|----------|------------|---------|---------|--------------|
| 1 day | 5 min | 50 | 58 KB | 50ms |
| 1 week | 5 min | 50 | 406 KB | 350ms |
| 1 month | 15 min | 50 | 580 KB | 1.5s |
| 1 year | 1 hour | 50 | 1.7 MB | 15s |
| 1 year | 15 min | 50 | 7 MB | 60s |

## Appendix B: Codebase Files Requiring Changes

### Core Engine
- `src/workers/engine.worker.ts` - Multi-day grid support
- `src/stores/engine.ts` - Day scheduling, state management
- `src/utils/time.ts` - Extended grid generation
- `src/core/serialization.ts` - Multi-day serialization

### Models
- `src/models/signals.ts` - Extended baseline context
- `src/models/homeostasis.ts` - Long-term state variables
- `src/models/subject.ts` - Aging, adaptation effects

### UI
- `src/pages/StudioPage.vue` - Multi-day navigation
- `src/components/charts/SignalChart.vue` - Zoom levels, aggregates
- `src/components/timeline/TimelineView.vue` - Multi-day view
- `src/components/log/DateCarousel.vue` - Range selection

### New Components Needed
- `src/stores/observations.ts` - Tracked observations
- `src/stores/calibration.ts` - Personal parameters
- `src/services/healthkit.ts` - Wearable sync
- `src/components/comparison/` - Simulated vs observed views

---

*Report generated: January 2026*
*Based on codebase analysis of Physim v1.x*
