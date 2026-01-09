# Continuous Time Modeling: Phase-Based Baseline Functions

## Overview

Replace the `wrapMinute()` approach in signal baselines with phase-based trigonometric evaluation to eliminate discontinuities at midnight boundaries.

## Problem

Current baseline functions use `wrapMinute()` which creates a mathematical seam at minute 1440:

```typescript
const wrapMinute = (minute: Minute) => {
  let m = minute % MINUTES_IN_DAY;
  if (m < 0) m += MINUTES_IN_DAY;
  return m as Minute;
};
```

When minute crosses from 1439 → 1440, `wrapMinute()` jumps from 1439 → 0. While individual baseline functions may be designed to have matching values at these boundaries, the modulo operation itself introduces potential for discontinuities and makes multi-day simulation awkward.

## Solution

Convert all baseline helper functions to use **phase-based evaluation** where time is represented as an angle θ on a circle:

```
θ = (minute / MINUTES_IN_DAY) × 2π
```

Trigonometric functions (`cos`, `sin`) are inherently continuous across the full domain - there's no discontinuity as θ passes 2π because `cos(2π) = cos(0)`.

---

## Implementation Plan

### Phase 1: Add Phase-Based Helper Functions

Create new helper functions in `src/models/signals.ts` that operate on phase rather than raw minutes:

```typescript
// Convert minute to phase angle (0 to 2π for one day)
const minuteToPhase = (minute: Minute): number => {
  return (minute / MINUTES_IN_DAY) * 2 * Math.PI;
};

// Convert hour-of-day to phase angle
const hourToPhase = (hour: number): number => {
  return (hour / 24) * 2 * Math.PI;
};

// Convert duration in minutes to phase width
const minutesToPhaseWidth = (minutes: number): number => {
  return (minutes / MINUTES_IN_DAY) * 2 * Math.PI;
};

// Gaussian on circular domain (von Mises-like)
// centerPhase: phase angle of peak (0 to 2π)
// concentration: higher = narrower peak (analogous to 1/σ²)
const gaussianPhase = (phase: number, centerPhase: number, concentration: number): number => {
  const diff = phase - centerPhase;
  // Use cosine difference for circular distance
  return Math.exp(concentration * (Math.cos(diff) - 1));
};

// Smooth window function using cosine blend
// startPhase, endPhase: phase angles defining the window
// transitionWidth: phase width of smooth transition
const windowPhase = (
  phase: number,
  startPhase: number,
  endPhase: number,
  transitionWidth: number = 0.2
): number => {
  // Normalize phase to [0, 2π)
  const p = ((phase % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

  // Handle wrap-around windows (e.g., 22:00 to 06:00)
  const wraps = endPhase < startPhase;
  const inWindow = wraps
    ? (p >= startPhase || p <= endPhase)
    : (p >= startPhase && p <= endPhase);

  if (inWindow) {
    // Smooth edges using cosine
    const distToStart = wraps && p < startPhase
      ? p + (2 * Math.PI - startPhase)
      : p - startPhase;
    const distToEnd = wraps && p > endPhase
      ? (2 * Math.PI - p) + endPhase
      : endPhase - p;

    const windowWidth = wraps
      ? (2 * Math.PI - startPhase) + endPhase
      : endPhase - startPhase;

    // Cosine fade at edges
    const fadeIn = distToStart < transitionWidth
      ? 0.5 * (1 - Math.cos(Math.PI * distToStart / transitionWidth))
      : 1;
    const fadeOut = distToEnd < transitionWidth
      ? 0.5 * (1 - Math.cos(Math.PI * distToEnd / transitionWidth))
      : 1;

    return fadeIn * fadeOut;
  }

  return 0;
};

// Cosine-based rhythm (simple circadian pattern)
// peakPhase: phase angle of maximum
// Returns value in [0, 1]
const cosineRhythm = (phase: number, peakPhase: number): number => {
  return 0.5 * (1 + Math.cos(phase - peakPhase));
};
```

### Phase 2: Refactor Existing Baselines

Convert each signal's baseline function from minute-based to phase-based evaluation.

#### Example: Cortisol

**Before:**
```typescript
baseline: fnBaseline((minute) => {
  const m = wrapMinute(minute);
  const CAR = gaussian(m, 7.5, 90); // peak at 7:30am, 90min width
  const dayComponent = periodicWindow(minute, 6, 20, 120);
  return 2.0 + 18.0 * CAR + 4.0 * dayComponent;
}),
```

**After:**
```typescript
baseline: fnBaseline((minute) => {
  const θ = minuteToPhase(minute);
  const CAR = gaussianPhase(θ, hourToPhase(7.5), 8); // concentration ~8 for 90min width
  const dayComponent = windowPhase(θ, hourToPhase(6), hourToPhase(20), minutesToPhaseWidth(120));
  return 2.0 + 18.0 * CAR + 4.0 * dayComponent;
}),
```

### Phase 3: Update All Signals

Signals requiring conversion (those using `wrapMinute`, `gaussian`, `periodicWindow`, or `sigmoid` with time-of-day):

| Signal | Current Pattern | Conversion Complexity |
|--------|-----------------|----------------------|
| cortisol | gaussian + periodicWindow | Medium |
| melatonin | periodicWindow (night) | Medium |
| growth_hormone | gaussian (sleep peak) | Low |
| testosterone | gaussian (morning peak) | Low |
| insulin_sensitivity | periodicWindow | Medium |
| core_temp | cosine rhythm | Low |
| alertness | composite | High |
| hunger | multiple gaussians | Medium |
| thyroid | periodicWindow | Medium |
| dopamine_baseline | periodicWindow | Medium |

### Phase 4: Validate Continuity

Add unit tests that verify:
1. Each baseline is continuous across midnight: `|baseline(1439) - baseline(0)| < ε`
2. Each baseline is smooth: no sudden jumps at any point
3. Baseline shapes match original intent (peak times, durations)

### Phase 5: Remove Legacy Functions

Once all baselines are converted:
1. Remove `wrapMinute()` function
2. Remove minute-based `gaussian()`, `periodicWindow()`, `sigmoid()` helpers
3. Update any remaining time utilities

---

## Mapping Old Helpers to New

| Old Function | New Function | Notes |
|--------------|--------------|-------|
| `wrapMinute(m)` | `minuteToPhase(m)` | No wrapping needed with phase |
| `gaussian(m, centerHour, widthMin)` | `gaussianPhase(θ, hourToPhase(centerHour), concentration)` | Concentration ≈ (1440/widthMin)² / 2 |
| `periodicWindow(m, startHr, endHr, transition)` | `windowPhase(θ, hourToPhase(startHr), hourToPhase(endHr), minutesToPhaseWidth(transition))` | |
| `sigmoid((m - threshold) / slope)` | Use `windowPhase` with appropriate transition | Sigmoid → cosine blend |
| `minutes(hour)` | `hourToPhase(hour)` | Returns phase instead of minutes |

---

## Concentration Parameter Mapping

The old `gaussian(minute, center, width)` used width in minutes. The new `gaussianPhase` uses concentration (κ) where higher = narrower.

Approximate mapping:
```
κ ≈ (MINUTES_IN_DAY / width)² / 2

width = 60 min  → κ ≈ 288
width = 90 min  → κ ≈ 128
width = 120 min → κ ≈ 72
width = 180 min → κ ≈ 32
width = 240 min → κ ≈ 18
```

Or define a helper:
```typescript
const widthToConcentration = (widthMinutes: number): number => {
  const widthPhase = minutesToPhaseWidth(widthMinutes);
  return 2 / (widthPhase * widthPhase);
};
```

---

## Testing Strategy

1. **Snapshot comparison**: Run simulation with old and new baselines, compare curves visually
2. **Boundary test**: Evaluate all baselines at minute 0, 1439, 1440, 2879 (two days)
3. **Derivative test**: Numerical derivative should be continuous (no spikes)
4. **Multi-day test**: Simulate 7 days, verify no artifacts at day boundaries

---

## Future Extensions

This phase-based foundation enables:

1. **Level 2 (Fourier)**: Represent baselines as harmonic coefficients - already compatible with phase evaluation
2. **Level 3 (Oscillator)**: Introduce dynamic phase θ(t) that can shift based on light exposure - baseline functions unchanged, only phase input varies
3. **Chronotype personalization**: Shift all phases by a personal offset (e.g., night owl = +2 hours)
4. **Seasonal variation**: Modulate amplitudes based on day-of-year

---

## Files to Modify

- `src/models/signals.ts` - Primary changes (baseline functions and helpers)
- `src/workers/engine.worker.ts` - Remove any `% MINUTES_IN_DAY` workarounds if present
- `src/utils/time.ts` - Add phase conversion utilities if not in signals.ts

## Estimated Effort

- Phase 1 (helpers): 1-2 hours
- Phase 2-3 (convert baselines): 4-6 hours (50+ signals)
- Phase 4 (testing): 2-3 hours
- Phase 5 (cleanup): 1 hour

**Total: ~10-12 hours**

---

*Plan created: January 2026*
