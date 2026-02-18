# Unified ODE Architecture Plan

## Executive Summary

This plan outlines the migration from the current hybrid architecture (analytical signals + ODE homeostasis) to a unified system where **all physiological signals are ODE state variables** with proper dynamics and time persistence.

### Goals

1. Make ALL signals ODE-based with proper dynamics
2. Eliminate the artificial signal/homeostasis distinction
3. Have one unified system where everything has state persistence

### Why This Matters

- **Biological accuracy**: In real physiology, everything has dynamics and memory
- **Conceptual clarity**: One unified model instead of two interacting systems
- **Natural multi-day support**: State persistence is automatic, not bolted on
- **Emergent phenomena**: Tolerance, adaptation, depletion arise naturally from dynamics

---

## Part 1: Current Architecture Analysis

### 1.1 The Two Systems Today

**Analytical Signals (50 signals)**

```typescript
// Current: Value computed fresh at each time point
signal[t] = baseline(t) + kernels(t) + couplings(t) + homeostasis_correction(t)
```

- No memory between time points
- Baseline functions encode circadian patterns
- Kernels add intervention effects
- Couplings add signal-to-signal influences
- Homeostasis provides "corrections" from ODE system

Current signals by category:

- **NeuroSignal (10)**: dopamine, serotonin, norepi, acetylcholine, gaba, melatonin, histamine, orexin, glutamate, endocannabinoid
- **HormoneSignal (18)**: cortisol, adrenaline, insulin, glucagon, leptin, ghrelin, oxytocin, prolactin, vasopressin, vip, testosterone, estrogen, progesterone, lh, fsh, thyroid, growthHormone, glp1
- **MetabolicProxy (22)**: glucose, energy, vagal, ketone, hrv, bloodPressure, oxygen, ethanol, acetaldehyde, inflammation, bdnf, magnesium, sensoryLoad, shbg, ferritin, dheas, alt, ast, egfr, vitaminD3, mtor, ampk

**ODE Homeostasis (18 state variables)**

```typescript
// Current: State evolved via numerical integration
d(state)/dt = f(state, inputs)
state[t] = state[t-1] + derivative * dt
```

- Has memory (state persists)
- Uses RK4 numerical integration
- Provides corrections to analytical signals
- Handles: glucose/insulin, sleep pressure, vesicle stores, receptor adaptation

Current homeostasis state variables:

- **Glucose-Insulin (4)**: glucosePool, insulinPool, insulinAction, hepaticGlycogen
- **Sleep (1)**: adenosinePressure
- **HPA (4)**: crhPool, cortisolPool, cortisolIntegral, adrenalineReserve
- **Neurotransmitter Pools (6)**: dopamineVesicles, norepinephrineVesicles, serotoninPrecursor, acetylcholineTone, gabaPool, glutamatePool
- **Growth (2)**: bdnfExpression, ghReserve
- **Receptor States**: Dynamic record tracking receptor density changes

### 1.2 Problems with Current Architecture

| Issue                   | Description                                                                 |
| ----------------------- | --------------------------------------------------------------------------- |
| **Arbitrary split**     | No principled reason why dopamine is analytical but dopamineVesicles is ODE |
| **Redundancy**          | `glucosePool` (ODE) vs `glucose` (signal) represent the same thing          |
| **Coupling complexity** | Couplings are instantaneous, but real biology has delays and dynamics       |
| **Correction layer**    | Homeostasis "corrects" signals rather than being the source of truth        |
| **Multi-day hacks**     | State persistence requires explicit chaining, not natural                   |

### 1.3 What We Want

```typescript
// Target: Every signal is an ODE state variable
d(dopamine)/dt = synthesis(precursors, enzymes)
                 - release(firing_rate, vesicles)
                 - reuptake(transporters)
                 - degradation(MAO)
                 + interventions(caffeine, etc)

d(cortisol)/dt = secretion(ACTH, circadian_drive)
                 - clearance(liver)
                 - feedback_on_CRH(cortisol)
                 + interventions(stress, etc)

// All signals follow this pattern
d(signal)/dt = production_terms - clearance_terms + intervention_terms
```

---

## Part 2: Unified Signal Model

### 2.1 Signal Classification by Dynamics

Not all signals need the same complexity. We can classify by their dominant timescale:

**Fast Dynamics (minutes)**

- Glucose, insulin (meal response)
- Adrenaline (acute stress)
- Heart rate, blood pressure

**Medium Dynamics (hours)**

- Neurotransmitters (dopamine, serotonin, etc.)
- Most hormones (cortisol, growth hormone)
- Sleep pressure (adenosine)

**Slow Dynamics (days-weeks)**

- Receptor density (tolerance/sensitization)
- Vesicle stores (depletion/recovery)
- Body composition, VO2max

**Very Slow Dynamics (months-years)**

- Hormone baselines (aging, menopause)
- Chronic adaptation

### 2.2 Unified Signal Definition

```typescript
interface SignalDefinition {
  key: Signal;
  label: string;
  unit: string;

  // ODE parameters
  dynamics: {
    // Baseline/setpoint (can be circadian)
    setpoint: (ctx: DynamicsContext) => number;

    // Time constant for return to setpoint (minutes)
    tau: number;

    // Production/synthesis terms
    production: ProductionTerm[];

    // Clearance/degradation terms
    clearance: ClearanceTerm[];

    // Coupling terms (how other signals affect this one)
    couplings: DynamicCoupling[];
  };

  // Initial state
  initialValue: number | ((ctx: DynamicsContextContext) => number);

  // Bounds
  min?: number;
  max?: number;

  // Display
  display: {
    color: string;
    referenceRange?: { min: number; max: number };
  };
}

interface DynamicsContext {
  minute: number;           // Time of day
  dayOfYear: number;        // Seasonal
  dayOfCycle?: number;      // Menstrual cycle
  isAsleep: boolean;
  subject: Subject;
  physiology: Physiology;
}

interface ProductionTerm {
  source: Signal | 'constant' | 'circadian';
  coefficient: number;
  transform?: (value: number) => number;  // e.g., Hill function, saturation
}

interface ClearanceTerm {
  type: 'linear' | 'saturable' | 'enzyme-dependent';
  rate: number;
  enzyme?: string;  // e.g., 'MAO_A', 'COMT'
}

interface DynamicCoupling {
  source: Signal;
  effect: 'stimulate' | 'inhibit';
  strength: number;
  delay?: number;  // Minutes
  saturation?: number;
}
```

### 2.3 Example: Dopamine as Unified ODE

```typescript
const dopamineDefinition: SignalDefinition = {
  key: 'dopamine',
  label: 'Dopamine',
  unit: 'relative',

  dynamics: {
    // Circadian setpoint (higher during day)
    setpoint: (ctx) => {
      const hour = ctx.minute / 60;
      return 50 + 20 * Math.sin((hour - 6) * Math.PI / 12);  // Peak afternoon
    },

    // Return to setpoint with ~2 hour time constant
    tau: 120,

    production: [
      // Synthesis depends on tyrosine availability
      { source: 'tyrosine', coefficient: 0.1, transform: hillFunction(0.5, 2) },
      // Stimulated by orexin (arousal)
      { source: 'orexin', coefficient: 0.05 },
    ],

    clearance: [
      // Reuptake via DAT
      { type: 'saturable', rate: 0.02, enzyme: 'DAT' },
      // Degradation via MAO-B and COMT
      { type: 'enzyme-dependent', rate: 0.01, enzyme: 'MAO_B' },
      { type: 'enzyme-dependent', rate: 0.008, enzyme: 'COMT' },
    ],

    couplings: [
      // Inhibited by serotonin (generally opposing)
      { source: 'serotonin', effect: 'inhibit', strength: 0.1 },
      // Stimulated by cortisol (stress increases DA)
      { source: 'cortisol', effect: 'stimulate', strength: 0.05, delay: 30 },
    ],
  },

  initialValue: 50,
  min: 0,
  max: 200,

  display: {
    color: '#f97316',
    referenceRange: { min: 30, max: 80 },
  },
};
```

### 2.4 Example: Cortisol with HPA Feedback

```typescript
const cortisolDefinition: SignalDefinition = {
  key: 'cortisol',
  label: 'Cortisol',
  unit: 'µg/dL',

  dynamics: {
    // Strong circadian drive (CAR in morning)
    setpoint: (ctx) => {
      const hour = ctx.minute / 60;
      // Cortisol awakening response
      const carPeak = ctx.isAsleep ? 5 : 18;
      const carWidth = 2;
      const car = 15 * Math.exp(-Math.pow(hour - 7, 2) / (2 * carWidth * carWidth));
      // Evening nadir
      const base = 8 + 4 * Math.cos((hour - 4) * Math.PI / 12);
      return base + car;
    },

    tau: 90,  // ~1.5 hour dynamics

    production: [
      // Driven by CRH/ACTH (simplified)
      { source: 'crh', coefficient: 0.3 },
      // Stress input
      { source: 'adrenaline', coefficient: 0.1, delay: 15 },
    ],

    clearance: [
      // Hepatic clearance
      { type: 'linear', rate: 0.015 },
    ],

    couplings: [
      // Negative feedback on CRH (closes the loop)
      // Note: This is handled by CRH's coupling TO cortisol, creating feedback
    ],
  },

  initialValue: (ctx) => ctx.isAsleep ? 5 : 12,
  min: 0,
  max: 50,

  display: {
    color: '#ef4444',
    referenceRange: { min: 5, max: 25 },
  },
};
```

---

## Part 3: Unified ODE Solver

### 3.1 State Vector

Instead of separate `series` and `homeostasisState`, we have one unified state:

```typescript
interface SimulationState {
  // All signals are state variables
  signals: Record<Signal, number>;

  // Auxiliary state (things that don't get displayed but affect dynamics)
  auxiliary: {
    receptorDensities: Record<string, number>;
    enzymeActivities: Record<string, number>;
    transporterActivities: Record<string, number>;
    vesicleStores: Record<string, number>;
    precursorPools: Record<string, number>;
  };

  // Tracking variables (integrals, etc.)
  accumulators: {
    cortisolExposure: number;     // Allostatic load
    sleepDebt: number;            // Cumulative deficit
    inflammatoryBurden: number;   // Chronic inflammation
  };
}
```

### 3.2 ODE System

```typescript
type DerivativeFunction = (
  state: SimulationState,
  t: number,
  interventions: ActiveIntervention[],
  context: DynamicsContext
) => SimulationState;

const computeDerivatives: DerivativeFunction = (state, t, interventions, ctx) => {
  const derivatives: SimulationState = initializeZeroState();

  for (const [key, def] of Object.entries(SIGNAL_DEFINITIONS)) {
    const signal = key as Signal;
    const currentValue = state.signals[signal];
    const setpoint = def.dynamics.setpoint(ctx);

    // Base return-to-setpoint dynamics
    let dSignal = (setpoint - currentValue) / def.dynamics.tau;

    // Add production terms
    for (const prod of def.dynamics.production) {
      const sourceValue = getSourceValue(prod.source, state, ctx);
      const contribution = prod.coefficient * (prod.transform?.(sourceValue) ?? sourceValue);
      dSignal += contribution;
    }

    // Subtract clearance terms
    for (const clear of def.dynamics.clearance) {
      const clearanceRate = computeClearanceRate(clear, currentValue, state);
      dSignal -= clearanceRate * currentValue;
    }

    // Add coupling effects
    for (const coupling of def.dynamics.couplings) {
      const sourceValue = getDelayedValue(coupling.source, state, coupling.delay);
      const effect = coupling.strength * sourceValue;
      dSignal += coupling.effect === 'stimulate' ? effect : -effect;
    }

    // Add intervention effects
    for (const intervention of interventions) {
      dSignal += computeInterventionEffect(signal, intervention, t, ctx);
    }

    derivatives.signals[signal] = dSignal;
  }

  // Compute auxiliary derivatives (receptors, enzymes, etc.)
  computeAuxiliaryDerivatives(derivatives, state, ctx);

  // Compute accumulator derivatives
  derivatives.accumulators.cortisolExposure = Math.max(0, state.signals.cortisol - 15) / 60;
  derivatives.accumulators.sleepDebt = ctx.isAsleep ? -0.1 : 0.05;

  return derivatives;
};
```

### 3.3 Numerical Integration

```typescript
// RK4 integrator for the unified system
const integrateStep = (
  state: SimulationState,
  t: number,
  dt: number,
  interventions: ActiveIntervention[],
  context: DynamicsContext
): SimulationState => {
  const k1 = computeDerivatives(state, t, interventions, context);
  const k2 = computeDerivatives(addStates(state, scaleState(k1, dt/2)), t + dt/2, interventions, context);
  const k3 = computeDerivatives(addStates(state, scaleState(k2, dt/2)), t + dt/2, interventions, context);
  const k4 = computeDerivatives(addStates(state, scaleState(k3, dt)), t + dt, interventions, context);

  // Weighted average: (k1 + 2*k2 + 2*k3 + k4) / 6
  const combinedDerivative = scaleState(
    addStates(k1, addStates(scaleState(k2, 2), addStates(scaleState(k3, 2), k4))),
    1/6
  );

  return addStates(state, scaleState(combinedDerivative, dt));
};
```

### 3.4 Interventions as Forcing Functions

Interventions become forcing functions that add terms to the ODEs:

```typescript
interface InterventionDefinition {
  key: string;
  label: string;

  // How this intervention affects the ODE system
  effects: InterventionEffect[];

  // Pharmacokinetics (if applicable)
  pharmacokinetics?: {
    absorptionRate: number;   // How fast it enters system
    distributionRate: number; // How fast it spreads
    eliminationRate: number;  // How fast it's cleared
    bioavailability: number;  // Fraction that reaches systemic circulation
  };
}

interface InterventionEffect {
  target: Signal | 'auxiliary';
  auxiliaryKey?: string;

  // Effect type
  type: 'direct' | 'rate_modifier' | 'setpoint_modifier';

  // Magnitude (can depend on dose, time, etc.)
  magnitude: (t: number, params: ParamValues, pk?: PKState) => number;
}

// Example: Caffeine
const caffeineIntervention: InterventionDefinition = {
  key: 'caffeine',
  label: 'Caffeine',

  pharmacokinetics: {
    absorptionRate: 0.05,      // ~20 min to peak
    distributionRate: 0.1,
    eliminationRate: 0.004,    // ~3-5 hour half-life
    bioavailability: 0.99,
  },

  effects: [
    // Blocks adenosine receptors (reduces sleep pressure effect)
    {
      target: 'auxiliary',
      auxiliaryKey: 'adenosineReceptorBlock',
      type: 'direct',
      magnitude: (t, params, pk) => pk.plasmaConcentration * 0.8,
    },
    // Increases dopamine (via adenosine-dopamine interaction)
    {
      target: 'dopamine',
      type: 'rate_modifier',
      magnitude: (t, params, pk) => pk.plasmaConcentration * 0.2,
    },
    // Increases cortisol acutely
    {
      target: 'cortisol',
      type: 'direct',
      magnitude: (t, params, pk) => pk.plasmaConcentration * 0.1 * Math.exp(-t/120),
    },
  ],
};
```

---

## Part 4: Migration Strategy

### 4.1 Phased Approach

We can't rewrite everything at once. Phased migration:

**Phase 1: Infrastructure**

- Create new `SignalDefinition` type system
- Implement unified ODE solver
- Build state management for unified state vector
- Create adapter layer to maintain backward compatibility

**Phase 2: Core Metabolic Signals**

- Migrate glucose, insulin, glucagon (already have ODE models in homeostasis.ts)
- Migrate energy, ketone
- Validate against current behavior

**Phase 3: HPA Axis**

- Migrate cortisol (already has ODE model)
- Migrate adrenaline
- Add CRH/ACTH as proper signals (currently only state variables)
- Implement proper feedback loops

**Phase 4: Neurotransmitters**

- Migrate dopamine, serotonin, norepinephrine
- Migrate GABA, glutamate, acetylcholine
- Migrate histamine, orexin
- This is the largest group

**Phase 5: Other Hormones**

- Migrate melatonin, growth hormone, prolactin
- Migrate thyroid, sex hormones
- Migrate appetite hormones (ghrelin, leptin, GLP-1)

**Phase 6: Derived Signals**

- Migrate HRV, blood pressure
- Migrate inflammation, BDNF
- These may remain as "computed from other signals" rather than true ODEs

**Phase 7: Cleanup & Optimization**

- Remove old analytical system
- Optimize ODE solver performance
- Implement adaptive time stepping

### 4.2 Backward Compatibility Layer

During migration, maintain compatibility:

```typescript
// Adapter that makes new ODE system look like old analytical system
const computeSignalLegacy = (
  signal: Signal,
  minute: number,
  state: SimulationState
): number => {
  // If signal has been migrated to ODE, return state value
  if (SIGNAL_DEFINITIONS[signal]?.dynamics) {
    return state.signals[signal];
  }

  // Otherwise, use old analytical computation
  return computeAnalyticalSignal(signal, minute, state);
};
```

### 4.3 Validation Strategy

For each migrated signal:

1. **Behavioral equivalence**: New ODE system produces similar curves to old analytical system under same inputs
2. **Steady-state matching**: At rest, ODE settles to same values as analytical baseline
3. **Intervention response**: Kernels produce similar magnitude and timing of effects
4. **Coupling preservation**: Signal interactions behave similarly

```typescript
// Validation test
describe('Dopamine ODE Migration', () => {
  it('should match analytical baseline at steady state', () => {
    const odeResult = runODESimulation({ interventions: [] });
    const analyticalResult = runAnalyticalSimulation({ interventions: [] });

    for (let t = 0; t < 1440; t += 60) {
      expect(odeResult.dopamine[t]).toBeCloseTo(analyticalResult.dopamine[t], 1);
    }
  });

  it('should respond similarly to caffeine intervention', () => {
    const caffeine = createIntervention('caffeine', { dose: 100, time: 480 });
    const odeResult = runODESimulation({ interventions: [caffeine] });
    const analyticalResult = runAnalyticalSimulation({ interventions: [caffeine] });

    // Peak should occur at similar time
    const odePeakTime = findPeakTime(odeResult.dopamine);
    const analyticalPeakTime = findPeakTime(analyticalResult.dopamine);
    expect(odePeakTime).toBeCloseTo(analyticalPeakTime, 30);  // Within 30 min

    // Peak magnitude should be similar
    const odePeakMag = Math.max(...odeResult.dopamine);
    const analyticalPeakMag = Math.max(...analyticalResult.dopamine);
    expect(odePeakMag).toBeCloseTo(analyticalPeakMag, odePeakMag * 0.2);  // Within 20%
  });
});
```

---

## Part 5: Performance Considerations

### 5.1 Computational Cost

**Current system:**

- Analytical: O(n) where n = grid points (~288 for 5-min resolution)
- Homeostasis ODE: O(n \* k) where k = ~18 state variables
- Total: ~50ms for full day

**Unified ODE system:**

- O(n _ m _ 4) where m = ~50 signals, 4 = RK4 stages
- Naive implementation: ~200-400ms for full day (4-8x slower)

### 5.2 Optimization Strategies

**Sparse coupling matrix:**
Not every signal affects every other signal. Use sparse representation:

```typescript
// Instead of checking all 50*50 = 2500 possible couplings
// Only iterate over actual couplings (maybe 100-200)
const couplingGraph: Map<Signal, Signal[]> = buildCouplingGraph(SIGNAL_DEFINITIONS);
```

**Adaptive time stepping:**
Use larger dt when system is stable, smaller when changing rapidly:

```typescript
const adaptiveStep = (state: SimulationState, t: number): number => {
  const derivatives = computeDerivatives(state, t);
  const maxRate = Math.max(...Object.values(derivatives.signals).map(Math.abs));

  // Larger steps when things are stable
  if (maxRate < 0.1) return 10;  // 10 minute steps
  if (maxRate < 1.0) return 5;   // 5 minute steps
  return 1;                       // 1 minute steps during rapid change
};
```

**Signal grouping by timescale:**
Fast signals (glucose) need small dt. Slow signals (receptor density) can use larger dt:

```typescript
// Multi-rate integration
const fastSignals = ['glucose', 'insulin', 'adrenaline'];
const mediumSignals = ['dopamine', 'serotonin', 'cortisol', ...];
const slowSignals = ['receptorDensity_*', 'vesicleStores_*'];

// Fast: 1-minute steps
// Medium: 5-minute steps
// Slow: 1-hour steps
```

**Web Worker parallelization:**
Different signal groups can be computed in parallel (with synchronization for couplings):

```typescript
// Main thread coordinates, workers compute
const workers = [
  new Worker('metabolic-signals.worker.js'),
  new Worker('neurotransmitter-signals.worker.js'),
  new Worker('hormone-signals.worker.js'),
];
```

**WASM for inner loop:**
The derivative computation is highly parallelizable and benefits from WASM:

```rust
// Rust compiled to WASM
#[wasm_bindgen]
pub fn compute_derivatives(state: &[f32], params: &[f32]) -> Vec<f32> {
    // Vectorized computation
}
```

### 5.3 Performance Targets

| Scenario                   | Current | Target | Acceptable   |
| -------------------------- | ------- | ------ | ------------ |
| Single day simulation      | 50ms    | 100ms  | 200ms        |
| Playhead scrub (per frame) | 1ms     | 5ms    | 16ms (60fps) |
| Week simulation            | N/A     | 500ms  | 1s           |
| Month simulation           | N/A     | 2s     | 5s           |

---

## Part 6: Data Model Changes

### 6.1 Storage Schema

**Current:**

```typescript
// Separate structures
series: Record<Signal, Float32Array>;           // Computed values
homeostasisState: HomeostasisStateSnapshot;     // ODE state
```

**Unified:**

```typescript
interface SimulationResult {
  // Time grid
  timePoints: number[];  // Can be multi-day

  // All state variables over time (signals + auxiliary)
  state: {
    signals: Record<Signal, Float32Array>;
    auxiliary: Record<string, Float32Array>;
    accumulators: Record<string, Float32Array>;
  };

  // Final state for chaining
  finalState: SimulationState;

  // Metadata
  metadata: {
    startDate: string;
    endDate: string;
    resolution: number;
    version: string;
  };
}
```

### 6.2 Persistence

The unified state is the single source of truth:

```typescript
// Save scenario
const saveScenario = (scenario: Scenario) => {
  return {
    ...scenario,
    initialState: serializeState(scenario.initialState),
    // No separate "homeostasis state" - it's all unified
  };
};

// Load and continue
const continueFromDay = (previousResult: SimulationResult) => {
  return simulate({
    initialState: previousResult.finalState,
    interventions: todaysInterventions,
  });
};
```

---

## Part 7: UI Implications

### 7.1 Body Status Panel

With unified architecture, the "Body Status" panel becomes simpler - it's just showing certain signals that happen to represent "internal state":

```typescript
// No longer a separate "homeostasis" concept
// Just signals with certain characteristics
const internalStateSignals = [
  'hepaticGlycogen',      // A signal like any other
  'dopamineVesicles',     // A signal like any other
  'adenosinePressure',    // A signal like any other
  'receptorDensity_A2A',  // Auxiliary state, but still unified
];
```

### 7.2 Signal Charts

All signals are now "first class" - they can all be charted, all have time series, all persist:

```typescript
// Any signal can be added to any chart view
// No distinction between "signals" and "homeostasis variables"
const chartableSignals = Object.keys(SIGNAL_DEFINITIONS);
```

### 7.3 Multi-Day Navigation

Naturally supported since state persists:

```typescript
// Simulate multiple days
const weekResult = simulateRange({
  startDate: '2026-01-06',
  endDate: '2026-01-12',
  interventions: weeklyInterventions,
  initialState: defaultState,
});

// Navigate to any point
const stateAtWednesday3pm = getStateAt(weekResult, '2026-01-08T15:00:00');
```

---

## Part 8: Scientific Considerations

### 8.1 ODE Formulations

Each signal needs a biologically defensible ODE. The current codebase already uses established models:

| Signal              | Current Model         | Notes                                                 |
| ------------------- | --------------------- | ----------------------------------------------------- |
| Glucose/Insulin     | Bergman Minimal Model | Already implemented in homeostasis.ts                 |
| Cortisol/HPA        | Feedback with CRH     | Already implemented in homeostasis.ts                 |
| Sleep pressure      | Two-process model     | Already implemented in homeostasis.ts                 |
| Vesicle pools       | Depletion/recovery    | Already implemented in homeostasis.ts                 |
| Receptor adaptation | Biphasic kinetics     | Already implemented with full/partial agonist support |

### 8.2 Parameter Sensitivity

ODE systems can be sensitive to parameters. Need:

1. **Sensitivity analysis**: Which parameters matter most?
2. **Default calibration**: Population-average parameters
3. **Personal calibration**: Adjust from observations

### 8.3 Numerical Stability

Some ODE systems are stiff (fast and slow dynamics together). May need:

- Implicit methods (backward Euler) for stiff subsystems
- Careful choice of time step
- Stability monitoring

---

## Part 9: File Changes Summary

### New Files

```
src/models/unified/
  signal-definitions/
    metabolic.ts        # Glucose, insulin, glucagon, ketones, energy, etc.
    neurotransmitters.ts # DA, 5-HT, NE, GABA, Glu, ACh, histamine, orexin
    hormones.ts         # Cortisol, GH, thyroid, sex hormones, leptin, ghrelin
    circadian.ts        # Melatonin, orexin, vasopressin, VIP
    derived.ts          # HRV, BP, inflammation, BDNF
    biomarkers.ts       # ferritin, SHBG, DHEAS, ALT/AST, eGFR, vitD3
  ode-solver.ts         # Unified RK4/adaptive solver
  state.ts              # SimulationState type and utilities
  interventions.ts      # Intervention effect definitions

src/workers/
  unified-engine.worker.ts  # New worker using unified system
```

### Modified Files

```
src/stores/engine.ts        # Use unified state
src/types/neurostate.ts     # Add SignalDefinition, SimulationState types
src/components/status/BodyStatusPanel.vue  # Simplify (no separate homeostasis)
src/components/charts/SignalChart.vue      # Works unchanged (data format same)
```

### Current Model Files (to be refactored)

```
src/models/
  homeostasis.ts        # Merged into unified system
  signals.ts            # Baseline functions become setpoint functions
  interventions.ts      # Kernels become forcing functions
  pharmacokinetics.ts   # Integrated into signal clearance terms
  profiles.ts           # Maps to parameter adjustments
```

---

## Appendix A: Complete Signal Inventory

All 50 signals that need ODE definitions (from `SIGNALS_ALL` in neurostate.ts):

**NeuroSignal (10)**

- dopamine, serotonin, norepi, acetylcholine, gaba
- melatonin, histamine, orexin, glutamate, endocannabinoid

**HormoneSignal (18)**

- cortisol, adrenaline, insulin, glucagon
- leptin, ghrelin, oxytocin, prolactin
- vasopressin, vip, testosterone, estrogen
- progesterone, lh, fsh, thyroid, growthHormone, glp1

**MetabolicProxy (22)**

- glucose, energy, vagal, ketone
- hrv, bloodPressure, oxygen
- ethanol, acetaldehyde
- inflammation, bdnf, magnesium, sensoryLoad
- shbg, ferritin, dheas
- alt, ast, egfr, vitaminD3
- mtor, ampk

**Notes:**

- Some signals (HRV, bloodPressure, sensoryLoad, oxygen) may remain derived/computed rather than full ODEs
- Lab biomarkers (ferritin, SHBG, DHEAS, ALT/AST, eGFR, vitD3) operate on very slow timescales
- CRH and ACTH are currently only homeostasis state variables, not signals - consider promoting them

---

## Appendix B: Risk Mitigation

| Risk                   | Mitigation                                                  |
| ---------------------- | ----------------------------------------------------------- |
| Performance regression | Benchmark early, optimize incrementally                     |
| Behavioral changes     | Extensive validation tests against current system           |
| Numerical instability  | Use proven ODE formulations, test edge cases                |
| Scope creep            | Strict phase gates, minimum viable per phase                |
| Scientific validity    | Consult literature, leverage existing homeostasis.ts models |

---

_Plan created: January 2026_
