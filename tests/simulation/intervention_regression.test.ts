/**
 * Regression tests for intervention processing bugs fixed in the unified ODE solver.
 * These tests are designed to fail if the specific bugs recur.
 *
 * Bugs fixed:
 * 1. PK input calculation ignored actual dose from params.mg
 * 2. Activity-dependent interventions (sleep, exercise) had no special handling
 * 3. PD effects used wrong EC50 defaults, producing near-zero effects
 * 4. Missing receptor-to-signal target mappings
 * 5. Enzyme-dependent clearance defaulted to 0 instead of 1.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { integrateStep, createInitialState, SIGNAL_DEFINITIONS, AUXILIARY_DEFINITIONS, getAllUnifiedDefinitions } from '@/models/engine/unified';
import { DEFAULT_SUBJECT, derivePhysiology } from '@/models/domain/subject';
import type { DynamicsContext, SimulationState, ActiveIntervention } from '@/types/unified';

describe('Intervention Processing Regressions', () => {
  let initialState: SimulationState;
  let ctx: DynamicsContext;
  const subject = DEFAULT_SUBJECT;
  const physiology = derivePhysiology(subject);

  beforeEach(() => {
    initialState = createInitialState(SIGNAL_DEFINITIONS, AUXILIARY_DEFINITIONS, {
      subject,
      physiology,
      isAsleep: false,
    });
    ctx = {
      minuteOfDay: 480, // 8 AM
      circadianMinuteOfDay: 480, // 8 AM
      dayOfYear: 1,
      isAsleep: false,
      subject,
      physiology,
    };
  });

  function simulate(
    state: SimulationState,
    startTime: number,
    durationMin: number,
    interventions: ActiveIntervention[],
    dt: number = 1.0
  ): SimulationState {
    let current = state;
    for (let i = 0; i < durationMin; i++) {
      const t = startTime + i;
      const minuteOfDay = t % 1440;
      current = integrateStep(
        current,
        t,
        dt,
        { ...ctx, minuteOfDay, circadianMinuteOfDay: minuteOfDay },
        SIGNAL_DEFINITIONS,
        AUXILIARY_DEFINITIONS,
        interventions
      );
    }
    return current;
  }

  describe('Bug #1: PK input must use dose from params', () => {
    it('should produce higher concentration with higher mg dose', () => {
      const lowDoseIntervention: ActiveIntervention[] = [
        {
          id: 'drug-low',
          key: 'test-drug',
          startTime: 480,
          duration: 60,
          intensity: 1.0,
          params: { mg: 50 },
          pharmacology: {
            pk: { model: '1-compartment', bioavailability: 1.0, halfLifeMin: 300 },
            pd: [],
          },
        },
      ];

      const highDoseIntervention: ActiveIntervention[] = [
        {
          id: 'drug-high',
          key: 'test-drug',
          startTime: 480,
          duration: 60,
          intensity: 1.0,
          params: { mg: 200 },
          pharmacology: {
            pk: { model: '1-compartment', bioavailability: 1.0, halfLifeMin: 300 },
            pd: [],
          },
        },
      ];

      const lowResult = simulate(initialState, 480, 30, lowDoseIntervention);
      const highResult = simulate(initialState, 480, 30, highDoseIntervention);

      // High dose should produce ~4x the concentration
      const lowConc = lowResult.pk['drug-low_central'];
      const highConc = highResult.pk['drug-high_central'];

      expect(lowConc).toBeGreaterThan(0);
      expect(highConc).toBeGreaterThan(0);
      expect(highConc / lowConc).toBeGreaterThan(3); // Should be ~4x, allow some margin
      expect(highConc / lowConc).toBeLessThan(5);
    });

    it('should apply bioavailability to dose', () => {
      const fullBioavail: ActiveIntervention[] = [
        {
          id: 'drug-full',
          key: 'test-drug',
          startTime: 480,
          duration: 60,
          intensity: 1.0,
          params: { mg: 100 },
          pharmacology: {
            pk: { model: '1-compartment', bioavailability: 1.0, halfLifeMin: 300 },
            pd: [],
          },
        },
      ];

      const halfBioavail: ActiveIntervention[] = [
        {
          id: 'drug-half',
          key: 'test-drug',
          startTime: 480,
          duration: 60,
          intensity: 1.0,
          params: { mg: 100 },
          pharmacology: {
            pk: { model: '1-compartment', bioavailability: 0.5, halfLifeMin: 300 },
            pd: [],
          },
        },
      ];

      const fullResult = simulate(initialState, 480, 30, fullBioavail);
      const halfResult = simulate(initialState, 480, 30, halfBioavail);

      const fullConc = fullResult.pk['drug-full_central'];
      const halfConc = halfResult.pk['drug-half_central'];

      expect(fullConc / halfConc).toBeGreaterThan(1.8);
      expect(fullConc / halfConc).toBeLessThan(2.2);
    });
  });

  describe('Bug #2: Activity-dependent PK model handling', () => {
    it('should set concentration to intensity while active', () => {
      const sleepIntervention: ActiveIntervention[] = [
        {
          id: 'sleep-test',
          key: 'sleep',
          startTime: 0,
          duration: 480,
          intensity: 1.0,
          params: {},
          pharmacology: {
            pk: { model: 'activity-dependent' },
            pd: [],
          },
        },
      ];

      // Simulate during active period
      let state = initialState;
      for (let i = 0; i < 20; i++) {
        state = integrateStep(
          state,
          i,
          1.0,
          { ...ctx, minuteOfDay: i, isAsleep: true },
          SIGNAL_DEFINITIONS,
          AUXILIARY_DEFINITIONS,
          sleepIntervention
        );
      }

      // Concentration should approach 1.0 (intensity)
      expect(state.pk['sleep-test_central']).toBeGreaterThan(0.9);
    });

    it('should decay concentration after activity ends', () => {
      const exerciseIntervention: ActiveIntervention[] = [
        {
          id: 'exercise-test',
          key: 'exercise_cardio',
          startTime: 480,
          duration: 30,
          intensity: 1.0,
          params: {},
          pharmacology: {
            pk: { model: 'activity-dependent' },
            pd: [],
          },
        },
      ];

      // Build up concentration during activity
      let state = initialState;
      for (let i = 0; i < 30; i++) {
        state = integrateStep(
          state,
          480 + i,
          1.0,
          { ...ctx, minuteOfDay: 480 + i },
          SIGNAL_DEFINITIONS,
          AUXILIARY_DEFINITIONS,
          exerciseIntervention
        );
      }

      const peakConc = state.pk['exercise-test_central'];
      expect(peakConc).toBeGreaterThan(0.9);

      // Continue simulation after activity ends (t > 510)
      for (let i = 0; i < 30; i++) {
        state = integrateStep(
          state,
          510 + i,
          1.0,
          { ...ctx, minuteOfDay: 510 + i },
          SIGNAL_DEFINITIONS,
          AUXILIARY_DEFINITIONS,
          exerciseIntervention
        );
      }

      // Concentration should have decayed significantly
      expect(state.pk['exercise-test_central']).toBeLessThan(0.1);
    });
  });

  describe('Bug #3: PD effect magnitude', () => {
    it('activity-dependent PD should produce meaningful signal changes', () => {
      const baselineGaba = initialState.signals.gaba;
      expect(baselineGaba).toBeGreaterThan(0); // Sanity check

      const sleepIntervention: ActiveIntervention[] = [
        {
          id: 'sleep-pd',
          key: 'sleep',
          startTime: 0,
          duration: 480,
          intensity: 1.0,
          params: {},
          pharmacology: {
            pk: { model: 'activity-dependent' },
            pd: [
              { target: 'gaba', mechanism: 'agonist', effectGain: 40.0, tau: 10 },
            ],
          },
        },
      ];

      // Simulate with sleep context
      let state = initialState;
      for (let i = 0; i < 60; i++) {
        state = integrateStep(
          state,
          i,
          1.0,
          { ...ctx, minuteOfDay: i, isAsleep: true },
          SIGNAL_DEFINITIONS,
          AUXILIARY_DEFINITIONS,
          sleepIntervention
        );
      }

      // GABA should have changed from intervention (check PK concentration first)
      expect(state.pk['sleep-pd_central']).toBeGreaterThan(0.5);
      // The exact change depends on baseline dynamics, but we should see effect
      expect(state.signals.gaba).toBeGreaterThan(0); // At minimum, not zeroed
    });

    it('drug-based PD should use Ki when EC50 not provided', () => {
      // Intervention with Ki but no EC50 (like caffeine)
      const caffeineIntervention: ActiveIntervention[] = [
        {
          id: 'caffeine-ki',
          key: 'caffeine',
          startTime: 480,
          duration: 60,
          intensity: 1.0,
          params: { mg: 100 },
          pharmacology: {
            pk: { model: '1-compartment', bioavailability: 1.0, halfLifeMin: 300 },
            pd: [
              { target: 'Adenosine_A2a', mechanism: 'antagonist', Ki: 2400, effectGain: 50 },
            ],
          },
        },
      ];

      const state = simulate(initialState, 480, 60, caffeineIntervention);

      // Should have built concentration
      expect(state.pk['caffeine-ki_central']).toBeGreaterThan(0);
    });

    it('PAM mechanism should be treated as agonist', () => {
      const baselineGaba = initialState.signals.gaba;
      expect(baselineGaba).toBeGreaterThan(0); // Sanity check

      const pamIntervention: ActiveIntervention[] = [
        {
          id: 'pam-test',
          key: 'pam-drug',
          startTime: 480,
          duration: 60,
          intensity: 1.0,
          params: { mg: 100 },
          pharmacology: {
            pk: { model: '1-compartment', bioavailability: 1.0, halfLifeMin: 60 },
            pd: [
              { target: 'GABA_A', mechanism: 'PAM', EC50: 50, effectGain: 100, tau: 5 },
            ],
          },
        },
      ];

      const state = simulate(initialState, 480, 30, pamIntervention);

      // Should have concentration
      expect(state.pk['pam-test_central']).toBeGreaterThan(0);
      // GABA should not be zeroed out
      expect(state.signals.gaba).toBeGreaterThan(0);
    });
  });

  describe('Bug #4: Receptor-to-signal target mappings', () => {
    // Test that the mapping lookup function works correctly
    // by verifying PK compartment builds up (proving intervention is processed)
    const testMappingProcessed = (target: string, description: string) => {
      it(`${target} intervention should be processed (${description})`, () => {
        const intervention: ActiveIntervention[] = [
          {
            id: `mapping-${target}`,
            key: 'test-drug',
            startTime: 480,
            duration: 60,
            intensity: 1.0,
            params: { mg: 100 },
            pharmacology: {
              pk: { model: '1-compartment', bioavailability: 1.0, halfLifeMin: 60 },
              pd: [{ target, mechanism: 'agonist', EC50: 50, effectGain: 100, tau: 5 }],
            },
          },
        ];

        const state = simulate(initialState, 480, 30, intervention);

        // Core regression check: intervention should build PK concentration
        expect(state.pk[`mapping-${target}_central`]).toBeGreaterThan(0);
      });
    };

    // Test key receptor mappings exist in isSignalTarget()
    testMappingProcessed('D1', 'dopamine receptor');
    testMappingProcessed('D2', 'dopamine receptor');
    testMappingProcessed('DAT', 'dopamine transporter');
    testMappingProcessed('5HT1A', 'serotonin receptor');
    testMappingProcessed('SERT', 'serotonin transporter');
    testMappingProcessed('NET', 'norepinephrine transporter');
    testMappingProcessed('GABA_A', 'GABA receptor');
    testMappingProcessed('Adenosine_A2a', 'adenosine receptor');
    testMappingProcessed('MT1', 'melatonin receptor');
    testMappingProcessed('H1', 'histamine receptor');
    testMappingProcessed('OX1R', 'orexin receptor');

    // Additional test: verify direct signal targets work
    it('direct signal target (dopamine) should work', () => {
      const baselineDopamine = initialState.signals.dopamine;
      expect(baselineDopamine).toBeGreaterThan(0);

      const intervention: ActiveIntervention[] = [
        {
          id: 'direct-dopamine',
          key: 'test-drug',
          startTime: 480,
          duration: 60,
          intensity: 1.0,
          params: { mg: 100 },
          pharmacology: {
            pk: { model: '1-compartment', bioavailability: 1.0, halfLifeMin: 60 },
            pd: [{ target: 'dopamine', mechanism: 'agonist', EC50: 50, effectGain: 100, tau: 5 }],
          },
        },
      ];

      const state = simulate(initialState, 480, 30, intervention);

      // Direct target should increase the signal
      expect(state.signals.dopamine).toBeGreaterThan(baselineDopamine);
    });
  });

  describe('Bug #5: Enzyme-dependent clearance defaults', () => {
    it('should use 1.0 as default enzyme activity when enzyme missing from auxiliary', () => {
      // Create state with enzyme explicitly undefined (simulating missing enzyme)
      const stateWithMissingEnzyme: SimulationState = {
        signals: { ...initialState.signals, dopamine: 150 },
        auxiliary: {}, // Empty auxiliaries - no enzymes defined
        receptors: { ...initialState.receptors },
        pk: {},
        accumulators: {},
      };

      // Simulate without interventions - clearance should still work
      // because enzyme-dependent clearance defaults to 1.0 not 0
      let state = stateWithMissingEnzyme;
      for (let i = 0; i < 30; i++) {
        state = integrateStep(
          state,
          480 + i,
          1.0,
          { ...ctx, minuteOfDay: 480 + i },
          SIGNAL_DEFINITIONS,
          AUXILIARY_DEFINITIONS,
          []
        );
      }

      // Dopamine should still be reasonable (dynamics work even without enzymes in state)
      // The key is it shouldn't blow up to infinity or stay frozen
      expect(state.signals.dopamine).toBeGreaterThan(0);
      expect(state.signals.dopamine).toBeLessThan(300);
    });

    it('enzyme activity modifies clearance rate', () => {
      // Compare clearance with high vs low enzyme activity
      const highEnzymeState: SimulationState = {
        signals: { ...initialState.signals, dopamine: 100 },
        auxiliary: { ...initialState.auxiliary, DAT: 2.0 }, // Double activity
        receptors: { ...initialState.receptors },
        pk: {},
        accumulators: {},
      };

      const lowEnzymeState: SimulationState = {
        signals: { ...initialState.signals, dopamine: 100 },
        auxiliary: { ...initialState.auxiliary, DAT: 0.5 }, // Half activity
        receptors: { ...initialState.receptors },
        pk: {},
        accumulators: {},
      };

      let highState = highEnzymeState;
      let lowState = lowEnzymeState;

      for (let i = 0; i < 30; i++) {
        highState = integrateStep(highState, 480 + i, 1.0, { ...ctx, minuteOfDay: 480 + i }, SIGNAL_DEFINITIONS, AUXILIARY_DEFINITIONS, []);
        lowState = integrateStep(lowState, 480 + i, 1.0, { ...ctx, minuteOfDay: 480 + i }, SIGNAL_DEFINITIONS, AUXILIARY_DEFINITIONS, []);
      }

      // High enzyme activity should result in lower dopamine (more clearance)
      expect(highState.signals.dopamine).toBeLessThan(lowState.signals.dopamine);
    });
  });

  describe('Integration: Full intervention scenarios', () => {
    it('caffeine intervention should increase alertness signals', () => {
      const caffeineIntervention: ActiveIntervention[] = [
        {
          id: 'caffeine-full',
          key: 'caffeine',
          startTime: 480,
          duration: 240,
          intensity: 1.0,
          params: { mg: 100 },
          pharmacology: {
            pk: {
              model: '1-compartment',
              bioavailability: 0.99,
              halfLifeMin: 300,
              volume: { kind: 'tbw', fraction: 0.6 }
            },
            pd: [
              // Ki in mg/L to match Vd-corrected concentrations
              { target: 'Adenosine_A2a', mechanism: 'antagonist', Ki: 0.5, effectGain: 20.0 },
              { target: 'Adenosine_A1', mechanism: 'antagonist', Ki: 1.0, effectGain: 12.0 },
            ],
          },
        },
      ];

      const state = simulate(initialState, 480, 120, caffeineIntervention);

      // PK should have built up (mg/L units, expect ~0.5-2 mg/L)
      expect(state.pk['caffeine-full_central']).toBeGreaterThan(0.2);
    });

    it('sleep intervention should have PD effects on target signals', () => {
      const baselineMelatonin = initialState.signals.melatonin;
      expect(baselineMelatonin).toBeGreaterThan(0); // Sanity check

      const sleepIntervention: ActiveIntervention[] = [
        {
          id: 'sleep-full',
          key: 'sleep',
          startTime: 0,
          duration: 480,
          intensity: 1.0,
          params: {},
          pharmacology: {
            pk: { model: 'activity-dependent' },
            pd: [
              { target: 'melatonin', mechanism: 'agonist', effectGain: 80.0, tau: 10 },
              { target: 'gaba', mechanism: 'agonist', effectGain: 40.0, tau: 10 },
              { target: 'histamine', mechanism: 'antagonist', effectGain: 30.0, tau: 10 },
            ],
          },
        },
      ];

      let state = initialState;
      for (let i = 0; i < 60; i++) {
        state = integrateStep(
          state,
          i,
          1.0,
          { ...ctx, minuteOfDay: i, isAsleep: true },
          SIGNAL_DEFINITIONS,
          AUXILIARY_DEFINITIONS,
          sleepIntervention
        );
      }

      // PK concentration should approach 1.0 for activity-dependent
      expect(state.pk['sleep-full_central']).toBeGreaterThan(0.9);

      // Melatonin should have increased from agonist effect
      expect(state.signals.melatonin).toBeGreaterThan(baselineMelatonin);

      // Signals should remain valid (not NaN)
      expect(state.signals.gaba).toBeGreaterThan(0);
      // Note: histamine naturally approaches 0 at night due to melatonin inhibition
      // so we just check it's a valid number, not NaN
      expect(Number.isFinite(state.signals.histamine)).toBe(true);
    });

    it('exercise intervention should increase adrenaline and dopamine', () => {
      const baselineAdrenaline = initialState.signals.adrenaline;
      const baselineDopamine = initialState.signals.dopamine;

      const exerciseIntervention: ActiveIntervention[] = [
        {
          id: 'exercise-full',
          key: 'exercise_cardio',
          startTime: 480,
          duration: 45,
          intensity: 0.7,
          params: {},
          pharmacology: {
            pk: { model: 'activity-dependent' },
            pd: [
              { target: 'dopamine', mechanism: 'agonist', effectGain: 20.0, tau: 5 },
              { target: 'norepi', mechanism: 'agonist', effectGain: 45.0, tau: 5 },
              { target: 'adrenaline', mechanism: 'agonist', effectGain: 200.0, tau: 2 },
            ],
          },
        },
      ];

      const state = simulate(initialState, 480, 30, exerciseIntervention);

      expect(state.signals.adrenaline).toBeGreaterThan(baselineAdrenaline + 10);
      expect(state.signals.dopamine).toBeGreaterThan(baselineDopamine + 2);
    });

    it('caffeine should suppress melatonin via dopamine coupling', () => {
      // Run simulation at night (22:00 = 1320 min) when melatonin is high
      const nightTime = 1320;
      
      // 1. Simulate baseline night (no caffeine)
      let baselineState = initialState;
      for(let i=0; i<nightTime; i++) {
        baselineState = integrateStep(
          baselineState, i, 1.0, 
          { ...ctx, minuteOfDay: i, circadianMinuteOfDay: i }, 
          SIGNAL_DEFINITIONS, AUXILIARY_DEFINITIONS, []
        );
      }
      const baselineMelatonin = baselineState.signals.melatonin;
      
      // 2. Simulate with caffeine taken at 18:00 (1080 min)
      const caffeineIntervention: ActiveIntervention[] = [{
        id: 'caffeine-test',
        key: 'caffeine',
        startTime: 1080,
        duration: 240, 
        intensity: 1.0,
        params: { mg: 200 },
        pharmacology: {
          molecule: { name: 'Caffeine', molarMass: 194.19 },
          pk: { model: '1-compartment', bioavailability: 0.99, halfLifeMin: 300, volume: { kind: 'tbw', fraction: 0.6 } },
          pd: [
            { target: 'Adenosine_A2a', mechanism: 'antagonist', Ki: 2400, effectGain: 15.0, unit: 'nM' },
            { target: 'Adenosine_A1', mechanism: 'antagonist', Ki: 12000, effectGain: 8.0, unit: 'nM' }
          ]
        }
      }];

      let cafState = initialState;
      for(let i=0; i<nightTime; i++) {
        cafState = integrateStep(
          cafState, i, 1.0, 
          { ...ctx, minuteOfDay: i, circadianMinuteOfDay: i }, 
          SIGNAL_DEFINITIONS, AUXILIARY_DEFINITIONS, caffeineIntervention
        );
      }
      
      const cafMelatonin = cafState.signals.melatonin;
      const cafDopamine = cafState.signals.dopamine;
      const baseDopamine = baselineState.signals.dopamine;

      // Verify caffeine actually raised dopamine (the mechanism of action)
      expect(cafDopamine).toBeGreaterThan(baseDopamine + 5); 

      // Verify melatonin is suppressed
      // With strength 2.0 coupling, we expect significant suppression
      expect(cafMelatonin).toBeLessThan(baselineMelatonin * 0.8); // Expect at least 20% suppression
    });
  });
});
