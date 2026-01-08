# Testing Strategy: Physiological Simulation Engine

## Goal
To validate the accuracy, stability, and physiological correctness of the `physim` engine without relying on brittle, hard-coded value assertions. The strategy focuses on validating the **behavior** and **relationships** of the system.

---

## 1. Mathematical Verification (The "Physics" Layer)
*Target: `src/models/pharmacokinetics.ts`, `src/models/homeostasis.ts`*

Before testing biology, we must verify the math.

### 1.1 Pharmacokinetic (PK) Integrity
*   **AUC Verification:** For linear PK models (`pk1`, `pk2`), the numerical integral (sum of samples) must be proportional to the dose within a tolerance.
*   **Peak Timing (Tmax):** Verify that the computed peak time matches the analytical $t_{max}$ derived from $k_a$ and $k_e$.
*   **Saturability:** For Michaelis-Menten models (Alcohol), verify that elimination rate becomes constant (zero-order) at high concentrations and first-order at low concentrations.
*   **Half-Life Consistency:** Measured decay from peak should match the modeled elimination half-life within tolerance.

### 1.2 ODE Solver Precision
*   Verify `rk4Step` against known simple differential equations (e.g., exponential decay) to ensure numerical stability.
*   Test with stiff equations to ensure no numerical blow-up.
*   Verify energy conservation in oscillatory systems.

### 1.3 Kernel Function Integrity
*   **Kernel Symmetry:** Time-reversal of symmetric kernels should produce mirror output.
*   **Kernel Normalization:** Kernels should integrate to expected total effect over their duration.
*   **Kernel Boundaries:** At t=0 and t=duration, kernels should smoothly approach zero (no discontinuities).

---

## 2. Physiological Invariants (The "Laws" Layer)
*Target: `src/stores/engine.ts` output*

These tests run the engine and assert "laws" that should never be broken.

### 2.1 Boundedness
*   No neurotransmitter signal should ever be negative.
*   Signals should not exceed survival limits without explicit "extreme" inputs:
    - Glucose: 40-400 mg/dL (normal ops), never > 600
    - Cortisol: 0-50 µg/dL
    - Heart rate proxies: 40-200 bpm equivalent
*   Organ scores must stay within [-1, 1] range.

### 2.2 Homeostatic Convergence (The "Gravity" Test)
*   *Setup:* Spike a signal (e.g., Glucose = 300).
*   *Assert:* The system eventually returns to baseline ±5% within a physiologically reasonable time window.
*   *Assert:* It does not oscillate indefinitely (damped oscillation OK, runaway forbidden).
*   *Assert:* No signal diverges to infinity over 7-day simulation.

### 2.3 Circadian Stability (The "Groundhog Day" Test)
*   *Setup:* Run simulation for 72 hours with **no interventions**.
*   *Assert:* The signal patterns for Day 2 and Day 3 should be nearly identical (Correlation > 0.99).
*   *Assert:* Peak times remain stable (±15 min drift max).

### 2.4 Periodicity
*   Circadian signals should be periodic: `value(t) ≈ value(t + 1440)` within tolerance.
*   Ultradian rhythms (90-min cycles) should show consistent periodicity.
*   No circadian signal should be flat (variance > minimum threshold).

### 2.5 Identity Operations
*   Enabling a profile at severity=0 should produce **no change** to any signal.
*   An intervention with dose=0 should produce **no change**.
*   Empty timeline should produce pure baseline circadian rhythms.

---

## 3. Metamorphic Testing (The "Logic" Layer)
*Target: `src/models/interventions.ts`, `src/models/profiles.ts`*

Instead of checking "Value is X", check "Value A > Value B".

### 3.1 Dose-Response Monotonicity
*   `Peak(Run(Dose=10))` < `Peak(Run(Dose=20))`
*   `Peak(Run(Dose=50))` < `Peak(Run(Dose=100))` (checking for saturation)
*   Test with 5+ dose levels to verify smooth monotonic curve.
*   Verify saturation occurs at high doses (diminishing returns).

### 3.2 Profile Severity Monotonicity
*   **ADHD:** `Dopamine(severity=0.2)` > `Dopamine(severity=0.6)` > `Dopamine(severity=1.0)`
*   **Depression:** `Serotonin(severity=0.2)` > `Serotonin(severity=1.0)`
*   **MCAS:** `Histamine(severity=0.2)` < `Histamine(severity=1.0)`
*   **Insomnia:** `Orexin(severity=0.2)` < `Orexin(severity=1.0)`
*   Test at minimum 3 severity levels (0.2, 0.5, 1.0) to catch non-monotonic bugs.

### 3.3 Transporter/Receptor Direction Tests
*   **DAT activity ↑** → Dopamine ↓ (faster clearance)
*   **NET activity ↑** → Norepinephrine ↓
*   **SERT activity ↑** → Serotonin ↓
*   **DAO activity ↓** → Histamine ↑ (slower clearance)
*   **GABA-A density ↓** → GABA signal ↓
*   **D2 density ↓** → Dopamine response ↓

### 3.4 Interaction Logic
*   **Antagonism:** `Arousal(Caffeine + Melatonin)` < `Arousal(Caffeine alone)`
*   **Synergy:** `Sedation(Alcohol + Melatonin)` > `Sedation(Alcohol alone)`
*   **Additivity:** `Effect(DrugA + DrugB)` ≈ `Effect(DrugA)` + `Effect(DrugB)` for non-interacting drugs

### 3.5 Profile Consistency
*   *Setup:* Same caffeine input.
*   *Assert:* `PeakDopamine(ADHD)` < `PeakDopamine(Neurotypical)`
*   *Assert:* `ClearanceTime(LiverImpaired)` > `ClearanceTime(Healthy)`
*   *Assert:* `HistamineBaseline(MCAS)` > `HistamineBaseline(Healthy)`

### 3.6 Temporal Monotonicity
*   Drug effects should rise then fall (not oscillate wildly).
*   Time-to-peak should be consistent for same drug/dose.
*   Duration of effect should scale with dose (longer for higher doses).

---

## 4. Symmetry & Reversibility (The "Conservation" Layer)
*Target: Profile and intervention state management*

### 4.1 Reversibility
*   Enable profile → Disable profile → All signals return to pre-enable baseline (within tolerance).
*   Add intervention → Remove intervention → Signals return to baseline after effect duration.
*   Change severity 0→1→0 should equal never changing severity.

### 4.2 Commutativity (where applicable)
*   `EnableProfile(ADHD) then EnableProfile(Anxiety)` ≈ `EnableProfile(Anxiety) then EnableProfile(ADHD)`
*   Order of non-interacting interventions shouldn't matter.

### 4.3 Idempotence
*   Enabling an already-enabled profile should not double the effect.
*   Setting severity to current value should produce no change.

---

## 5. Coupling & Signal Relationship Tests (The "Physiology" Layer)
*Target: `src/models/couplings.ts`, signal relationships*

### 5.1 Known Physiological Relationships
These relationships are well-established in literature:

| Driver | Target | Expected Relationship |
|--------|--------|----------------------|
| Cortisol ↑ | Glucose ↑ | Positive (gluconeogenesis) |
| Insulin ↑ | Glucose ↓ | Negative (uptake) |
| Melatonin ↑ | Cortisol ↓ | Inverse (circadian opposition) |
| Orexin ↑ | Histamine ↑ | Positive (wake-promoting) |
| GABA ↑ | Glutamate effect ↓ | Negative (E/I balance) |
| Cortisol ↑ | BDNF ↓ | Negative (stress effect) |
| Sleep ↑ | Growth Hormone ↑ | Positive (nocturnal secretion) |

### 5.2 Phase Relationships
*   Cortisol peak should precede glucose rise by 15-45 min.
*   Melatonin rise should precede sleep onset.
*   Orexin should be low during melatonin peak.
*   Growth hormone should peak during early sleep.

### 5.3 Ratio Tests (Golden Ratios)
Instead of absolute values, verify ratios:
*   `Cortisol(8am) / Cortisol(midnight)` > 2.0 (CAR - cortisol awakening response)
*   `Melatonin(2am) / Melatonin(2pm)` > 5.0
*   `Orexin(noon) / Orexin(3am)` > 1.5

### 5.4 E/I Balance Conservation
*   Sum of excitatory effects (glutamate, norepinephrine) vs inhibitory (GABA) should stay bounded.
*   Autism profile should shift E/I ratio toward excitation.
*   Anxiety profile should show reduced inhibitory tone.

---

## 6. Magnitude Sanity Tests (The "Reality Check" Layer)
*Target: All signal outputs*

These use loose physiological bounds from literature, not exact values.

### 6.1 Profile Effect Magnitudes
| Profile | Signal | Expected Change at Full Severity |
|---------|--------|----------------------------------|
| ADHD | Dopamine | -15% to -40% |
| ADHD | Norepinephrine | -10% to -25% |
| Depression | Serotonin | -15% to -35% |
| Depression | BDNF | -20% to -40% |
| Anxiety | GABA | -10% to -25% |
| Anxiety | Norepinephrine | +10% to +25% |
| MCAS | Histamine | +20% to +50% |
| POTS | Norepinephrine | +15% to +40% |
| Insomnia | Orexin | +15% to +30% |
| PCOS | Insulin | +15% to +35% |

### 6.2 Intervention Effect Magnitudes
| Intervention | Signal | Expected Peak Effect |
|--------------|--------|---------------------|
| Caffeine 100mg | Dopamine | +10% to +30% |
| Caffeine 100mg | Adenosine blockade | 50-80% |
| Melatonin 3mg | Melatonin | +200% to +500% |
| Adderall IR 10mg | Dopamine | +30% to +80% |
| High-carb meal | Glucose | +50 to +120 mg/dL |
| High-carb meal | Insulin | +200% to +600% |

### 6.3 Circadian Amplitude Checks
*   Cortisol amplitude (peak-trough) should be 10-20 µg/dL.
*   Melatonin should show >10x difference between day and night.
*   Body temperature proxy should vary by ~1°C equivalent.

---

## 7. Steady-State & Stability Tests (The "Equilibrium" Layer)
*Target: `src/models/homeostasis.ts`*

### 7.1 Convergence Tests
*   With no interventions, homeostasis should reach equilibrium within 24h.
*   Glucose-insulin system should stabilize around fasting values (85-95 mg/dL).
*   Sleep pressure should reset to baseline after adequate sleep.

### 7.2 Perturbation Recovery
*   After glucose spike, return to baseline within 2-4h.
*   After cortisol spike (stress), return to baseline within 1-2h.
*   After caffeine, adenosine rebound should not exceed 150% of baseline.

### 7.3 Stability Under Load
*   Run 7-day simulation with realistic intervention schedule.
*   No signal should trend upward/downward indefinitely.
*   Day 7 baseline should match Day 1 baseline (±10%).

### 7.4 Feedback Polarity Verification
*   Negative feedback should dampen perturbations, not amplify.
*   Positive feedback loops should be bounded (e.g., stress → cortisol → more stress).

---

## 8. Differential & Comparative Tests (The "Delta" Layer)
*Target: Comparing simulation variants*

### 8.1 With/Without Comparisons
*   Same simulation with/without profile → difference should match expected effect direction.
*   Difference magnitude should scale with severity parameter.
*   Disabling all modifiers should produce identical output to baseline.

### 8.2 Time-of-Day Effects
*   Same intervention at 8am vs 8pm should show circadian modulation.
*   Caffeine at 8am should have different alertness curve than caffeine at 8pm.
*   Melatonin during day should have less effect than at night.

### 8.3 Profile Comparison
*   ADHD vs Depression: Different dopamine/serotonin ratios.
*   Anxiety vs POTS: Overlapping norepinephrine elevation, different mechanisms.
*   Similar profiles should have proportional effects based on their definitions.

---

## 9. Scenario Regression (The "Snapshot" Layer)
*Target: Full System Integration*

Create a suite of reference scenarios to catch unintended "butterfly effects."

### 9.1 Canonical Scenarios

**Scenario A: "Standard Healthy Day"**
- Wake 7am → Coffee 8am → Lunch 12pm → Exercise 6pm → Dinner 7pm → Sleep 11pm
- No profiles enabled
- Record: Peak Glucose, Cortisol CAR, Min Energy, Sleep Onset Latency

**Scenario B: "ADHD Medicated Day"**
- ADHD profile at 0.6 severity
- Wake 7am → Adderall IR 8am → Lunch 12pm → Sleep 11pm
- Record: Peak Dopamine, Dopamine Duration, Evening Crash Depth

**Scenario C: "Chronic Insomnia"**
- Insomnia profile at 0.7 severity
- Multiple nights with delayed sleep onset
- Record: Accumulated Sleep Debt, Orexin Trajectory, Melatonin Suppression

**Scenario D: "MCAS Flare Day"**
- MCAS profile at 0.8 severity
- High-histamine food triggers
- Record: Peak Histamine, Inflammation Response, Energy Crash

**Scenario E: "Multi-Profile Complex"**
- ADHD + Anxiety profiles
- Caffeine + medication interactions
- Record: Net Arousal, Dopamine/Norepinephrine Balance

### 9.2 Regression Thresholds
*   If any key metric shifts by >1% between commits, the test fails.
*   Snapshot updates require explicit approval and changelog entry.
*   Maintain snapshots for last 5 versions for trend analysis.

---

## 10. Edge Case & Boundary Tests (The "Stress" Layer)
*Target: System robustness*

### 10.1 Extreme Inputs
*   Dose = 0 → No effect (already covered in identity)
*   Dose = 10x normal → Saturates, doesn't explode
*   Duration = 0 → No effect
*   Duration = 24h → Handles gracefully

### 10.2 Boundary Conditions
*   Simulation start (t=0) → No NaN or undefined values
*   Simulation end → Clean termination
*   Midnight crossing → Circadian phase wraps correctly
*   Multi-day simulation → No accumulating drift

### 10.3 Pathological Combinations
*   All profiles enabled simultaneously → System remains stable
*   Contradictory interventions (stimulant + sedative) → Reasonable net effect
*   Overlapping interventions → Proper summation

### 10.4 Numerical Edge Cases
*   Very small values (1e-10) → No underflow
*   Very large values (1e6) → No overflow
*   Rapid changes → No numerical instability

---

## 11. Bug Detection Matrix

| Bug Type | Detected By |
|----------|-------------|
| Sign flip in coupling | Monotonicity, Relationship tests |
| Double-counting effects | Magnitude sanity, Profile severity tests |
| Unused modifier (e.g., sensitivity) | Monotonicity at different params |
| Wrong baseline | Circadian invariants, Ratio tests |
| Division instead of multiplication | Magnitude sanity, Direction tests |
| Off-by-one in time | Phase relationship tests |
| Missing effect | Differential with/without tests |
| Runaway feedback | Stability, Convergence tests |
| NaN propagation | Boundedness, Edge case tests |
| Inverted relationship | Relationship direction tests |

---

## Implementation Plan

### Phase 1: Test Infrastructure
1. **Test Utilities (`tests/simulation/utils.ts`):**
    - `runEngine(config)` - Headless engine execution
    - `peak(signal)` - Find maximum value and time
    - `trough(signal)` - Find minimum value and time
    - `auc(signal, t1, t2)` - Area under curve
    - `settleTime(signal, target, tolerance)` - Time to reach steady state
    - `correlation(signal1, signal2)` - Signal correlation
    - `phaseShift(signal1, signal2)` - Temporal offset between signals

2. **Test Fixtures (`tests/fixtures/`):**
    - Canonical intervention definitions
    - Standard profile configurations
    - Reference timelines

### Phase 2: Core Spec Files
| File | Coverage |
|------|----------|
| `math.spec.ts` | PK functions, ODE solver, kernel math |
| `invariants.spec.ts` | Bounds, convergence, periodicity |
| `monotonicity.spec.ts` | Dose-response, severity scaling |
| `relationships.spec.ts` | Signal couplings, phase relationships |
| `profiles.spec.ts` | Profile effects, transporter/receptor logic |
| `stability.spec.ts` | Homeostasis, feedback, long-run behavior |
| `scenarios.spec.ts` | Full-day integration, regression snapshots |

### Phase 3: Continuous Integration
- Run fast tests (invariants, monotonicity) on every commit
- Run slow tests (scenarios, stability) nightly
- Snapshot comparison with visual diff for regressions

---

## Example Test Implementations

### Monotonicity Test for ADHD Dopamine
```typescript
test('ADHD severity monotonically decreases dopamine', async () => {
  const baseline = await runEngine({ profiles: {} });
  const mild = await runEngine({ profiles: { adhd: { enabled: true, params: { severity: 0.3 } } } });
  const moderate = await runEngine({ profiles: { adhd: { enabled: true, params: { severity: 0.6 } } } });
  const severe = await runEngine({ profiles: { adhd: { enabled: true, params: { severity: 1.0 } } } });

  const baselineMean = mean(baseline.signals.dopamine);
  const mildMean = mean(mild.signals.dopamine);
  const moderateMean = mean(moderate.signals.dopamine);
  const severeMean = mean(severe.signals.dopamine);

  // Monotonic decrease
  expect(mildMean).toBeLessThan(baselineMean);
  expect(moderateMean).toBeLessThan(mildMean);
  expect(severeMean).toBeLessThan(moderateMean);

  // Magnitude sanity (15-40% reduction at full severity)
  const reduction = (baselineMean - severeMean) / baselineMean;
  expect(reduction).toBeGreaterThan(0.15);
  expect(reduction).toBeLessThan(0.40);
});
```

### Physiological Relationship Test
```typescript
test('Cortisol and melatonin are inversely related', async () => {
  const result = await runEngine({ duration: 1440 }); // 24 hours

  const cortisolPeak = peakTime(result.signals.cortisol);
  const melatoninPeak = peakTime(result.signals.melatonin);

  // Peaks should be ~12 hours apart
  const separation = Math.abs(cortisolPeak - melatoninPeak);
  expect(separation).toBeGreaterThan(10 * 60); // > 10 hours
  expect(separation).toBeLessThan(14 * 60);    // < 14 hours

  // Inverse correlation
  const corr = correlation(result.signals.cortisol, result.signals.melatonin);
  expect(corr).toBeLessThan(-0.3); // Negative correlation
});
```

### Reversibility Test
```typescript
test('Enabling then disabling profile returns to baseline', async () => {
  const baseline = await runEngine({ profiles: {} });

  // Enable ADHD, run, then disable
  const withProfile = await runEngine({
    profiles: { adhd: { enabled: true, params: { severity: 0.8 } } }
  });
  const afterDisable = await runEngine({ profiles: {} });

  // After disable should match original baseline
  for (const signal of ['dopamine', 'norepi', 'cortisol']) {
    const baselineMean = mean(baseline.signals[signal]);
    const afterMean = mean(afterDisable.signals[signal]);
    expect(Math.abs(baselineMean - afterMean) / baselineMean).toBeLessThan(0.01);
  }
});
```

### Transporter Direction Test
```typescript
test('DAT activity increase reduces dopamine', async () => {
  // Simulate different DAT activity levels directly
  const normalDAT = await runEngine({
    transporterActivities: { DAT: 0 }
  });
  const highDAT = await runEngine({
    transporterActivities: { DAT: 0.4 } // 40% increase
  });
  const veryHighDAT = await runEngine({
    transporterActivities: { DAT: 0.8 } // 80% increase
  });

  const normalMean = mean(normalDAT.signals.dopamine);
  const highMean = mean(highDAT.signals.dopamine);
  const veryHighMean = mean(veryHighDAT.signals.dopamine);

  // More DAT = less dopamine (faster clearance)
  expect(highMean).toBeLessThan(normalMean);
  expect(veryHighMean).toBeLessThan(highMean);
});
```

### Insulin Response Test
```typescript
test('Insulin response scales with carbohydrate load', async () => {
  const lowCarb = await runEngine({
    interventions: [{ key: 'food', startMin: 480, params: { carbSugar: 10, carbStarch: 10 } }]
  });
  const highCarb = await runEngine({
    interventions: [{ key: 'food', startMin: 480, params: { carbSugar: 30, carbStarch: 30 } }]
  });

  const lowPeak = peak(lowCarb.signals.insulin);
  const highPeak = peak(highCarb.signals.insulin);

  expect(highPeak.value).toBeGreaterThan(lowPeak.value);

  // Non-linear scaling (diminishing returns at high loads)
  const ratio = highPeak.value / lowPeak.value;
  expect(ratio).toBeGreaterThan(1.5); // More than 50% increase
  expect(ratio).toBeLessThan(3.0);    // But not 3x (saturation)
});
```

---

## Success Criteria

A comprehensive test suite should:

1. **Catch 90%+ of regression bugs** before they reach production
2. **Run in <5 minutes** for the fast suite (CI on every commit)
3. **Provide clear failure messages** that identify the broken relationship
4. **Require minimal maintenance** (no hard-coded values to update)
5. **Document expected behavior** through test names and assertions
6. **Enable confident refactoring** of engine internals
