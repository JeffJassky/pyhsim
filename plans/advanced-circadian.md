# Advanced Circadian Modeling: Fourier Parameterization & Dynamic Oscillators

## Overview

This plan extends the phase-based foundation from `continuous-time.md` with two additional levels of sophistication:

1. **Level 2: Fourier Parameterization** - Represent baseline shapes as harmonic coefficients for flexibility and personalization
2. **Level 3: Dynamic Oscillator** - Model the SCN master clock as a true oscillator with entrainment to light

These levels are **additive** - each builds on the previous without replacing it.

---

## Prerequisites

- Level 1 (Phase-Based Evaluation) from `continuous-time.md` must be complete
- All baseline functions already using `minuteToPhase()` and phase-based helpers

---

# Level 2: Fourier Parameterization

## Concept

Any periodic function can be represented as a sum of sinusoids (Fourier series):

```
f(θ) = a₀ + Σₙ [aₙ·cos(nθ) + bₙ·sin(nθ)]
```

Where:
- `a₀` = mean value (DC offset)
- `aₙ`, `bₙ` = amplitude of nth harmonic
- `n = 1` = fundamental (24-hour rhythm)
- `n = 2` = 12-hour harmonic (ultradian)
- `n = 3` = 8-hour harmonic
- etc.

## Benefits

| Benefit | Description |
|---------|-------------|
| **Compact storage** | 10-20 coefficients per signal vs. complex function code |
| **Easy personalization** | Adjust coefficients to match individual observations |
| **Natural smoothness** | Fourier series are inherently smooth (infinitely differentiable) |
| **Adaptive resolution** | Use fewer harmonics for coarse time, more for detail |
| **Machine learning ready** | Coefficients can be learned from CGM/wearable data |
| **Interpolation** | Blend between profiles (e.g., workday vs. weekend) |

## Data Structure

```typescript
interface FourierBaseline {
  /** Mean value (DC component) */
  a0: number;

  /** Cosine coefficients [a1, a2, a3, ...] for harmonics 1, 2, 3, ... */
  cosine: number[];

  /** Sine coefficients [b1, b2, b3, ...] for harmonics 1, 2, 3, ... */
  sine: number[];

  /** Phase offset in radians (for chronotype adjustment) */
  phaseOffset?: number;

  /** Optional: different profiles for different contexts */
  profiles?: {
    default: { a0: number; cosine: number[]; sine: number[] };
    weekend?: { a0: number; cosine: number[]; sine: number[] };
    jetlag?: { a0: number; cosine: number[]; sine: number[] };
  };
}

interface SignalDefinitionV2 {
  key: Signal;
  label: string;
  unit: string;
  range: [number, number];

  /** New: Fourier-based baseline (replaces fnBaseline) */
  fourierBaseline?: FourierBaseline;

  /** Legacy: function-based baseline (for complex signals) */
  fnBaseline?: (minute: Minute, ctx: BaselineContext) => number;

  // ... rest of signal definition
}
```

## Evaluator Function

```typescript
/**
 * Evaluate a Fourier baseline at a given phase
 * @param phase - Phase angle in radians (0 to 2π for one day)
 * @param baseline - Fourier coefficients
 * @returns Baseline value at that phase
 */
const evaluateFourierBaseline = (
  phase: number,
  baseline: FourierBaseline
): number => {
  const θ = phase + (baseline.phaseOffset ?? 0);

  let value = baseline.a0;

  for (let n = 0; n < baseline.cosine.length; n++) {
    const harmonic = n + 1;
    value += baseline.cosine[n] * Math.cos(harmonic * θ);
    value += baseline.sine[n] * Math.sin(harmonic * θ);
  }

  return value;
};

/**
 * Wrapper for minute-based evaluation
 */
const evaluateFourierAtMinute = (
  minute: Minute,
  baseline: FourierBaseline
): number => {
  const phase = minuteToPhase(minute);
  return evaluateFourierBaseline(phase, baseline);
};
```

## Converting Existing Baselines to Fourier

### Numerical Approach

For each existing baseline function, sample it at high resolution and compute FFT:

```typescript
const baselineToFourier = (
  baselineFn: (minute: Minute) => number,
  numHarmonics: number = 6
): FourierBaseline => {
  // Sample at 1-minute resolution
  const samples: number[] = [];
  for (let m = 0; m < MINUTES_IN_DAY; m++) {
    samples.push(baselineFn(m as Minute));
  }

  // Compute Fourier coefficients via DFT
  const N = samples.length;
  const a0 = samples.reduce((a, b) => a + b, 0) / N;

  const cosine: number[] = [];
  const sine: number[] = [];

  for (let n = 1; n <= numHarmonics; n++) {
    let an = 0;
    let bn = 0;

    for (let k = 0; k < N; k++) {
      const θ = (2 * Math.PI * k) / N;
      an += samples[k] * Math.cos(n * θ);
      bn += samples[k] * Math.sin(n * θ);
    }

    cosine.push((2 * an) / N);
    sine.push((2 * bn) / N);
  }

  return { a0, cosine, sine };
};
```

### Example Conversions

#### Cortisol (CAR + daytime decline)

```typescript
// Original shape: sharp morning peak + gradual decline
// Requires ~4-6 harmonics for good fidelity

cortisol: {
  fourierBaseline: {
    a0: 10.0,  // Mean cortisol ~10 µg/dL
    cosine: [6.0, 2.5, 1.2, 0.6, 0.3, 0.1],  // Even harmonics for asymmetry
    sine: [-4.0, -1.5, -0.8, -0.4, -0.2, -0.1],  // Sine for phase shift
    phaseOffset: 0,
  }
}
```

#### Melatonin (night window)

```typescript
// Original shape: square-ish night window with soft edges
// Requires more harmonics for sharp transitions

melatonin: {
  fourierBaseline: {
    a0: 25.0,  // Mean over 24h
    cosine: [-35.0, 5.0, -3.0, 2.0, -1.5, 1.0, -0.8, 0.5],
    sine: [10.0, -2.0, 1.5, -1.0, 0.8, -0.5, 0.3, -0.2],
    phaseOffset: 0,
  }
}
```

#### Core Temperature (simple cosine)

```typescript
// Original shape: nearly pure cosine
// Only needs 1-2 harmonics

core_temp: {
  fourierBaseline: {
    a0: 37.0,  // Mean temp
    cosine: [-0.5],  // Amplitude ~0.5°C
    sine: [0.1],     // Slight phase adjustment
    phaseOffset: 0,
  }
}
```

## How Many Harmonics?

| Signal Type | Harmonics Needed | Examples |
|-------------|------------------|----------|
| Simple cosine rhythms | 1-2 | core_temp, testosterone |
| Broad peaks/windows | 3-4 | growth_hormone, thyroid |
| Sharp peaks | 5-6 | cortisol CAR, insulin response |
| Complex multi-peak | 6-8 | hunger, alertness |
| Square-ish windows | 8-12 | melatonin, sleep pressure |

**Recommendation**: Start with 6 harmonics for all signals, then optimize per-signal based on reconstruction error.

## Personalization via Coefficient Adjustment

```typescript
interface PersonalCircadianProfile {
  userId: string;

  /** Global phase shift (chronotype) - positive = delayed, negative = advanced */
  chronotypeOffset: number;  // radians, e.g., +0.26 ≈ +1 hour

  /** Per-signal amplitude scaling */
  amplitudeScaling: Partial<Record<Signal, number>>;

  /** Per-signal mean adjustment */
  meanOffset: Partial<Record<Signal, number>>;

  /** Full coefficient overrides (from calibration) */
  calibratedBaselines?: Partial<Record<Signal, FourierBaseline>>;
}

const getPersonalizedBaseline = (
  signal: Signal,
  profile: PersonalCircadianProfile
): FourierBaseline => {
  const base = signalDefinitions[signal].fourierBaseline;
  const calibrated = profile.calibratedBaselines?.[signal];

  if (calibrated) return calibrated;

  // Apply chronotype and scaling
  return {
    a0: base.a0 + (profile.meanOffset[signal] ?? 0),
    cosine: base.cosine.map(c => c * (profile.amplitudeScaling[signal] ?? 1)),
    sine: base.sine.map(s => s * (profile.amplitudeScaling[signal] ?? 1)),
    phaseOffset: (base.phaseOffset ?? 0) + profile.chronotypeOffset,
  };
};
```

## Storage Format

```typescript
// Store as JSON in signal definitions or separate config
const signalFourierCoefficients: Record<Signal, FourierBaseline> = {
  cortisol: { a0: 10.0, cosine: [...], sine: [...] },
  melatonin: { a0: 25.0, cosine: [...], sine: [...] },
  // ... all signals
};

// Personal overrides stored per-user
const userProfiles: Record<UserId, PersonalCircadianProfile> = {
  'user-123': {
    chronotypeOffset: 0.52,  // ~2 hours late
    amplitudeScaling: { cortisol: 0.8 },  // Blunted CAR
    // ...
  }
};
```

## Implementation Phases

### Phase 2.1: Coefficient Extraction
1. Write `baselineToFourier()` converter function
2. Run on all existing baselines, generate coefficient tables
3. Validate reconstruction accuracy (plot original vs Fourier)

### Phase 2.2: Dual Evaluation Path
1. Add `fourierBaseline` field to signal definitions
2. Modify baseline evaluator to check for Fourier first, fall back to function
3. Gradually migrate signals to Fourier representation

### Phase 2.3: Personalization Infrastructure
1. Create `PersonalCircadianProfile` type and storage
2. Add chronotype offset to user profile/subject model
3. Wire personalized baseline evaluation into engine

### Phase 2.4: Calibration Foundation
1. Add observed data storage (prep for historical tracking)
2. Implement coefficient fitting from observations
3. Create calibration UI wizard

---

# Level 3: Dynamic Oscillator Model

## Concept

Real circadian rhythms are not fixed 24.0-hour cycles. The suprachiasmatic nucleus (SCN) is a biological oscillator with:

- **Intrinsic period**: ~24.2 hours (varies by individual, 23.5-24.7)
- **Entrainment**: Light exposure resets the clock to stay synchronized with environment
- **Phase Response Curve (PRC)**: Light has different effects at different times of day
- **Peripheral clocks**: Other tissues have their own oscillators coupled to SCN

## Benefits

| Benefit | Description |
|---------|-------------|
| **Jet lag simulation** | Model phase shift and recovery time |
| **Shift work** | Simulate misalignment from night shifts |
| **Light therapy** | Test optimal timing for light exposure |
| **Chronotype modeling** | Different intrinsic periods explain early birds vs night owls |
| **Social jet lag** | Weekend sleep-in effects on clock |
| **Seasonal effects** | Different light exposure in winter vs summer |

## Mathematical Model

### Van der Pol Oscillator

The SCN can be modeled as a self-sustaining oscillator:

```
dθ/dt = ω + Z(θ) · L(t)
```

Where:
- `θ` = oscillator phase (0 to 2π)
- `ω` = intrinsic angular frequency (2π / τ, where τ ≈ 24.2 hours)
- `Z(θ)` = phase response curve (sensitivity to light at each phase)
- `L(t)` = light intensity at time t

### Phase Response Curve (PRC)

Light advances or delays the clock depending on when it's received:

```typescript
/**
 * Type-1 PRC (weak resetting) - typical human response
 * @param phase - Current oscillator phase (0 to 2π)
 * @returns Sensitivity to light (-1 to +1)
 *          Negative = phase delay (clock runs later)
 *          Positive = phase advance (clock runs earlier)
 */
const phaseResponseCurve = (phase: number): number => {
  // Simplified sinusoidal PRC
  // - Light in early night (phase ~π to ~1.5π) delays clock
  // - Light in late night/early morning (phase ~1.5π to ~2π) advances clock
  // - Light during day (~0 to ~π) has minimal effect

  // Dead zone during subjective day
  const dayStart = 0;
  const dayEnd = Math.PI * 0.8;  // ~9.6 hours after wake
  if (phase > dayStart && phase < dayEnd) {
    return 0.1 * Math.sin(phase);  // Minimal sensitivity
  }

  // Active zone during subjective night
  return -0.5 * Math.sin(phase - Math.PI * 0.3);
};
```

### Full Oscillator State

```typescript
interface OscillatorState {
  /** Current phase of SCN master clock (0 to 2π) */
  scnPhase: number;

  /** Intrinsic period in minutes (default ~24.2 * 60 = 1452) */
  intrinsicPeriod: number;

  /** Peripheral clock phases (may lag/lead SCN) */
  peripheralPhases: {
    liver: number;     // Food-entrained
    muscle: number;    // Activity-entrained
    adipose: number;   // Mixed entrainment
  };

  /** Accumulated phase error (for jet lag recovery tracking) */
  phaseDebt: number;

  /** Light exposure history (for PRC integration) */
  recentLightExposure: number[];
}
```

## Light Exposure Modeling

### Light as Intervention

```typescript
interface LightExposureParams {
  /** Intensity in lux */
  intensity: number;

  /** Spectrum (affects circadian sensitivity) */
  spectrum: 'natural' | 'warm' | 'cool' | 'blue-enriched';

  /** Duration in minutes */
  duration: number;
}

// Circadian-effective light (melanopic lux)
const getMelanopicLux = (lux: number, spectrum: string): number => {
  const multipliers: Record<string, number> = {
    'natural': 1.0,
    'warm': 0.4,      // Low blue content
    'cool': 1.2,      // Higher blue
    'blue-enriched': 1.8,
  };
  return lux * (multipliers[spectrum] ?? 1.0);
};
```

### Implicit Light from Wake/Sleep

```typescript
const inferLightExposure = (items: TimelineItem[]): LightProfile => {
  const profile: LightProfile = new Float32Array(MINUTES_IN_DAY);

  // Find wake/sleep times
  const wake = items.find(i => i.meta.key === 'wake');
  const sleep = items.find(i => i.meta.key === 'sleep');

  if (wake && sleep) {
    const wakeMin = isoToMinute(wake.start);
    const sleepMin = isoToMinute(sleep.start);

    // Assume ~500 lux indoor light during wake, 0 during sleep
    for (let m = 0; m < MINUTES_IN_DAY; m++) {
      const awake = m >= wakeMin && m < sleepMin;
      profile[m] = awake ? 500 : 0;
    }
  }

  // Override with explicit light interventions
  for (const item of items) {
    if (item.meta.key === 'light_exposure') {
      const startMin = isoToMinute(item.start);
      const endMin = isoToMinute(item.end);
      const lux = item.meta.params.intensity ?? 10000;

      for (let m = startMin; m < endMin; m++) {
        profile[m] = Math.max(profile[m], lux);
      }
    }
  }

  return profile;
};
```

## ODE Integration

Add oscillator to homeostasis system:

```typescript
interface ExtendedHomeostasisState extends HomeostasisState {
  oscillator: OscillatorState;
}

const updateOscillator = (
  state: OscillatorState,
  lightLux: number,
  dt: number  // Time step in minutes
): OscillatorState => {
  const ω = (2 * Math.PI) / state.intrinsicPeriod;  // Intrinsic frequency

  // Phase response to light
  const melanopicLux = lightLux;  // Simplified; use getMelanopicLux for accuracy
  const lightSensitivity = phaseResponseCurve(state.scnPhase);

  // Saturating response to light intensity (log-like)
  const lightEffect = Math.log10(1 + melanopicLux / 100) * lightSensitivity;

  // Euler integration of phase
  const dPhase = ω * dt + lightEffect * dt * 0.001;  // Scale factor for light
  let newPhase = (state.scnPhase + dPhase) % (2 * Math.PI);
  if (newPhase < 0) newPhase += 2 * Math.PI;

  // Update peripheral clocks (simplified: they follow SCN with lag)
  const peripheralCoupling = 0.1;  // Coupling strength
  const newPeripheral = {
    liver: state.peripheralPhases.liver +
      peripheralCoupling * Math.sin(state.scnPhase - state.peripheralPhases.liver) * dt,
    muscle: state.peripheralPhases.muscle +
      peripheralCoupling * Math.sin(state.scnPhase - state.peripheralPhases.muscle) * dt,
    adipose: state.peripheralPhases.adipose +
      peripheralCoupling * Math.sin(state.scnPhase - state.peripheralPhases.adipose) * dt,
  };

  return {
    ...state,
    scnPhase: newPhase,
    peripheralPhases: newPeripheral,
  };
};
```

## Connecting Oscillator to Baselines

The oscillator outputs a phase θ(t) that replaces the fixed `minuteToPhase(minute)`:

```typescript
const evaluateBaselineWithOscillator = (
  minute: Minute,
  signal: Signal,
  oscillatorState: OscillatorState
): number => {
  // Instead of: const θ = minuteToPhase(minute);
  // Use the oscillator's current phase
  const θ = oscillatorState.scnPhase;

  // Some signals follow peripheral clocks
  const signalClock = getSignalClock(signal);
  const phase = signalClock === 'scn' ? θ :
    oscillatorState.peripheralPhases[signalClock] ?? θ;

  // Evaluate Fourier baseline at oscillator phase
  const baseline = signalDefinitions[signal].fourierBaseline;
  return evaluateFourierBaseline(phase, baseline);
};

const getSignalClock = (signal: Signal): 'scn' | 'liver' | 'muscle' | 'adipose' => {
  // Signals primarily controlled by different clocks
  const clockMapping: Partial<Record<Signal, string>> = {
    cortisol: 'scn',
    melatonin: 'scn',
    core_temp: 'scn',
    insulin_sensitivity: 'liver',
    glucose: 'liver',
    growth_hormone: 'scn',
    testosterone: 'scn',
    leptin: 'adipose',
    // Default to SCN for unmapped signals
  };
  return (clockMapping[signal] as any) ?? 'scn';
};
```

## Jet Lag Simulation

```typescript
interface JetLagScenario {
  /** Time zone change in hours (positive = eastward) */
  timezoneShift: number;

  /** Day of travel (simulation starts with shift applied) */
  travelDay: number;
}

const applyJetLag = (
  state: OscillatorState,
  scenario: JetLagScenario
): OscillatorState => {
  // Instant phase shift would be unrealistic
  // Instead, shift the "external time" and let oscillator catch up

  // The oscillator will naturally re-entrain over several days
  // Typical re-entrainment: ~1 hour per day for westward,
  // ~0.7 hours per day for eastward (harder)

  return {
    ...state,
    phaseDebt: scenario.timezoneShift * (Math.PI / 12),  // Convert hours to radians
  };
};
```

## New Interventions

### Light Exposure Intervention

```typescript
const lightExposure: Intervention = {
  key: 'light_exposure',
  label: 'Light Exposure',
  category: 'circadian',
  icon: 'sun',
  params: [
    { key: 'intensity', label: 'Intensity (lux)', default: 10000, min: 100, max: 100000 },
    { key: 'spectrum', label: 'Spectrum', default: 'natural', options: ['natural', 'warm', 'cool', 'blue-enriched'] },
  ],
  effects: [], // Handled by oscillator, not direct signal effects
};
```

### Light Therapy Box

```typescript
const lightTherapy: Intervention = {
  key: 'light_therapy',
  label: 'Light Therapy Box',
  category: 'circadian',
  icon: 'lightbulb',
  presets: {
    morning: { intensity: 10000, spectrum: 'cool', duration: 30 },
    evening: { intensity: 2000, spectrum: 'warm', duration: 60 },
  },
};
```

### Blue Light Blocking

```typescript
const blueLightBlocking: Intervention = {
  key: 'blue_light_blocking',
  label: 'Blue Light Blocking Glasses',
  category: 'circadian',
  icon: 'glasses',
  params: [
    { key: 'blocking', label: 'Blue Blocking %', default: 90, min: 0, max: 100 },
  ],
  // Reduces effective melanopic lux during evening
};
```

## Implementation Phases

### Phase 3.1: Oscillator Foundation
1. Define `OscillatorState` interface
2. Implement basic phase update with intrinsic period
3. Add `scnPhase` to homeostasis state
4. Verify oscillator free-runs at ~24.2 hours without light

### Phase 3.2: Light Response
1. Implement phase response curve (PRC)
2. Create light exposure inference from wake/sleep
3. Integrate light effect into oscillator update
4. Test entrainment: oscillator should lock to 24h with normal light

### Phase 3.3: Connect to Baselines
1. Modify baseline evaluation to use oscillator phase
2. Map signals to their controlling clock (SCN vs peripheral)
3. Verify signal timing follows oscillator, not wall clock

### Phase 3.4: Light Interventions
1. Add `light_exposure` intervention type
2. Create UI for light exposure timing/intensity
3. Add light therapy presets
4. Add blue light blocking intervention

### Phase 3.5: Scenarios
1. Implement jet lag scenario setup
2. Add "weekend sleep-in" effects on oscillator
3. Create shift work schedule modeling
4. Add seasonal light variation (day length by latitude/date)

### Phase 3.6: Peripheral Clocks (Advanced)
1. Implement peripheral oscillators with food entrainment (liver)
2. Add activity entrainment (muscle clock)
3. Model clock misalignment (internal desynchrony)
4. Visualize peripheral clock phases in UI

---

## Data Requirements

### For Calibration (Level 2)

- Wearable data: HR, HRV, activity, sleep stages
- Optional CGM: glucose patterns
- User observations: energy, mood, alertness ratings

### For Oscillator Validation (Level 3)

- Melatonin onset timing (DLMO) - gold standard for phase
- Core body temperature minimum
- Cortisol awakening response timing
- Sleep onset/offset times over multiple days

---

## Testing Strategy

### Level 2 Tests

1. **Reconstruction accuracy**: Fourier baseline matches original within 2%
2. **Personalization**: Chronotype offset shifts all peaks correctly
3. **Coefficient bounds**: No signal goes negative or exceeds physiological limits

### Level 3 Tests

1. **Free-running period**: Without light, oscillator period ≈ 24.2h
2. **Entrainment**: With normal light, oscillator locks to 24.0h
3. **Phase response**: Morning light advances, evening light delays
4. **Jet lag recovery**: Eastward takes longer than westward
5. **Peripheral coupling**: Liver clock follows SCN with appropriate lag

---

## File Changes Summary

### Level 2

| File | Changes |
|------|---------|
| `src/models/signals.ts` | Add `FourierBaseline` type, evaluator, coefficients |
| `src/types/index.ts` | Export new types |
| `src/models/subject.ts` | Add chronotype offset |
| `src/stores/user.ts` | Store personal profile |
| `src/workers/engine.worker.ts` | Use Fourier evaluation in baseline lookup |

### Level 3

| File | Changes |
|------|---------|
| `src/models/oscillator.ts` | New file: oscillator state, PRC, update logic |
| `src/models/homeostasis.ts` | Integrate oscillator into state |
| `src/models/interventions.ts` | Add light exposure interventions |
| `src/workers/engine.worker.ts` | Add oscillator to simulation loop |
| `src/components/timeline/` | Light intervention UI |
| `src/components/charts/` | Phase visualization component |

---

## Effort Estimates

### Level 2: Fourier Parameterization
- Phase 2.1 (Coefficient extraction): 4-6 hours
- Phase 2.2 (Dual evaluation): 3-4 hours
- Phase 2.3 (Personalization): 4-6 hours
- Phase 2.4 (Calibration foundation): 8-10 hours

**Total Level 2: ~20-26 hours**

### Level 3: Dynamic Oscillator
- Phase 3.1 (Foundation): 6-8 hours
- Phase 3.2 (Light response): 6-8 hours
- Phase 3.3 (Connect baselines): 4-6 hours
- Phase 3.4 (Interventions): 6-8 hours
- Phase 3.5 (Scenarios): 8-12 hours
- Phase 3.6 (Peripheral clocks): 12-16 hours

**Total Level 3: ~42-58 hours**

---

## Recommended Sequence

1. **Complete Level 1** (`continuous-time.md`) - Foundation for all else
2. **Level 2.1-2.2** - Get Fourier working, validates approach
3. **Level 3.1-3.3** - Basic oscillator, proves value
4. **Level 2.3-2.4** - Personalization once oscillator is stable
5. **Level 3.4-3.5** - Light interventions, jet lag scenarios
6. **Level 3.6** - Peripheral clocks (optional, advanced)

---

## References

- Forger, D. B. (2017). Biological Clocks, Rhythms, and Oscillations. MIT Press.
- Kronauer, R. E., et al. (1999). Quantifying human circadian pacemaker response to light. J Biol Rhythms.
- St Hilaire, M. A., et al. (2012). Human phase response curve to a 1h pulse of bright white light. J Physiol.
- Hannay, K. M., et al. (2019). Macroscopic models for human circadian rhythms. J Biol Rhythms.

---

*Plan created: January 2026*
*Depends on: plans/continuous-time.md (Level 1)*
