import { describe, it, expect, beforeEach } from "vitest";
import {
  integrateStep,
  createInitialState,
  SIGNAL_DEFINITIONS,
  AUXILIARY_DEFINITIONS,
} from "@/models/engine";
import { DEFAULT_SUBJECT, derivePhysiology } from "@/models/domain/subject";
import type {
  DynamicsContext,
  SimulationState,
  ActiveIntervention,
} from "@/types/unified";

describe("PK/PD Regression Tests", () => {
  let state: SimulationState;
  const subject = DEFAULT_SUBJECT;
  const physiology = derivePhysiology(subject);

  const createCtx = (min: number, isAsleep: boolean = false): DynamicsContext => ({
    minuteOfDay: min,
    circadianMinuteOfDay: min,
    dayOfYear: 1,
    isAsleep,
    subject,
    physiology,
  });

  beforeEach(() => {
    state = createInitialState(SIGNAL_DEFINITIONS, AUXILIARY_DEFINITIONS, {
      subject,
      physiology,
      isAsleep: false,
    });
  });

  function simulate(
    initialState: SimulationState,
    startTime: number,
    durationMin: number,
    interventions: ActiveIntervention[],
    dt: number = 1.0,
  ): SimulationState {
    let current = initialState;
    for (let i = 0; i < durationMin; i++) {
      const t = startTime + i;
      current = integrateStep(
        current,
        t,
        dt,
        createCtx(t % 1440),
        SIGNAL_DEFINITIONS,
        AUXILIARY_DEFINITIONS,
        interventions,
      );
    }
    return current;
  }

  describe("PK Concentration Building", () => {
    it("should build PK concentration during active dosing window", () => {
      const interventions: ActiveIntervention[] = [
        {
          id: "ritalin-1",
          key: "ritalin",
          startTime: 480,
          duration: 60,
          intensity: 1.0,
          params: { mg: 10 },
          pharmacology: {
            pk: {
              model: "1-compartment",
              delivery: "bolus",
              halfLifeMin: 180,
              bioavailability: 0.3,
              volume: { kind: "lbm", base_L_kg: 2.0 },
            },
            pd: [],
          },
        },
      ];

      // Simulate 1 minute to catch the bolus pulse
      const midState = integrateStep(
        state,
        480,
        1.0,
        createCtx(480),
        SIGNAL_DEFINITIONS,
        AUXILIARY_DEFINITIONS,
        interventions,
      );

      // Concentration should be building
      const midConc = midState.pk["ritalin-1_central"] ?? 0;
      expect(midConc).toBeGreaterThan(0);
    });

    it("should decay PK concentration after dosing window ends", () => {
      const interventions: ActiveIntervention[] = [
        {
          id: "test-drug",
          key: "test-drug",
          startTime: 0,
          duration: 60,
          intensity: 1.0,
          params: { mg: 100 },
          pharmacology: {
            pk: {
              model: "1-compartment",
              delivery: "bolus",
              bioavailability: 1.0,
              halfLifeMin: 60,
            },
            pd: [],
          },
        },
      ];

      // Simulate through dosing window
      const peakState = simulate(state, 0, 60, interventions);
      const peakConc = peakState.pk["test-drug_central"] ?? 0;

      expect(peakConc).toBeGreaterThan(0);

      // Simulate 60 more mins (1 half-life)
      const decayState = simulate(peakState, 60, 60, interventions);
      const decayConc = decayState.pk["test-drug_central"] ?? 0;

      // Concentration should have decayed
      expect(decayConc).toBeLessThan(peakConc);
    });
  });

  describe("Multi-Day Intervention Handling (CRITICAL REGRESSION)", () => {
    it("should NOT overwrite PK derivatives when multiple interventions share same ID", () => {
      const interventions: ActiveIntervention[] = [
        {
          id: "shared-drug",
          key: "shared-drug",
          startTime: 480, // Day 1
          duration: 240,
          intensity: 1.0,
          params: { mg: 100 },
          pharmacology: {
            pk: { model: "1-compartment", delivery: "bolus", halfLifeMin: 300 },
            pd: [],
          },
        },
        {
          id: "shared-drug",
          key: "shared-drug",
          startTime: 1920, // Day 2 (480 + 1440)
          duration: 240,
          intensity: 1.0,
          params: { mg: 100 },
          pharmacology: {
            pk: { model: "1-compartment", delivery: "bolus", halfLifeMin: 300 },
            pd: [],
          },
        },
      ];

      // Simulate during day 1's active window (t=600, which is 10 AM day 1)
      const midDayState = simulate(state, 480, 120, interventions);
      const concentration = midDayState.pk["shared-drug_central"] ?? 0;

      expect(concentration).toBeGreaterThan(0);
    });

    it("should accumulate concentration from overlapping multi-day doses", () => {
      const interventions: ActiveIntervention[] = [
        {
          id: "accumulating-drug",
          key: "acc-drug",
          startTime: 0,
          duration: 60,
          intensity: 1.0,
          params: { mg: 100 },
          pharmacology: {
            pk: { model: "1-compartment", delivery: "bolus", halfLifeMin: 1440 },
            pd: [],
          },
        },
        {
          id: "accumulating-drug",
          key: "acc-drug",
          startTime: 120,
          duration: 60,
          intensity: 1.0,
          params: { mg: 100 },
          pharmacology: {
            pk: { model: "1-compartment", delivery: "bolus", halfLifeMin: 1440 },
            pd: [],
          },
        },
      ];

      // Simulate to end of day 1 dose
      const day1State = simulate(state, 0, 60, interventions);
      const day1Conc = day1State.pk["accumulating-drug_central"] ?? 0;

      // Simulate to end of day 2 dose
      const day2State = simulate(day1State, 60, 120, interventions);
      const day2Conc = day2State.pk["accumulating-drug_central"] ?? 0;

      expect(day2Conc).toBeGreaterThan(day1Conc);
    });
  });

  describe("Ritalin DAT Inhibition Chain", () => {
    it("should inhibit DAT when Ritalin concentration is present", () => {
      const ritalinIntervention: ActiveIntervention[] = [
        {
          id: "ritalin-test",
          key: "ritalin",
          startTime: 0,
          duration: 240,
          intensity: 1.0,
          params: { mg: 10 },
          pharmacology: {
            pk: {
              model: "1-compartment",
              delivery: "bolus",
              halfLifeMin: 180,
              bioavailability: 0.3,
              volume: { kind: "lbm", base_L_kg: 2.0 },
            },
            pd: [{ target: "DAT", mechanism: "antagonist", Ki: 0.01, intrinsicEfficacy: 30 }],
          },
        },
      ];

      const initialDAT = state.auxiliary.DAT ?? 1.0;

      // Simulate 2 hours into dose
      const afterState = simulate(state, 0, 120, ritalinIntervention);

      // Check that concentration built up
      const concentration = afterState.pk["ritalin-test_central"] ?? 0;
      expect(concentration).toBeGreaterThan(0);

      // Check that DAT was inhibited
      const finalDAT = afterState.auxiliary.DAT ?? 1.0;
      expect(finalDAT).toBeLessThan(initialDAT);
    });

    it("should increase dopamine when DAT is inhibited", () => {
      const initialDopamine = state.signals.dopamine;
      state.auxiliary.DAT = 0.5; // Manually inhibit DAT

      // Simulate without any intervention
      const afterState = simulate(state, 480, 60, []);

      expect(afterState.signals.dopamine).toBeGreaterThan(initialDopamine);
    });
  });

  describe("Caffeine Adenosine Antagonism Chain", () => {
    it("should build caffeine concentration during dosing", () => {
      const caffeineIntervention: ActiveIntervention[] = [
        {
          id: "caffeine-test",
          key: "caffeine",
          startTime: 0,
          duration: 240,
          intensity: 1.0,
          params: { mg: 100 },
          pharmacology: {
            pk: {
              model: "1-compartment",
              delivery: "bolus",
              bioavailability: 0.99,
              halfLifeMin: 300,
              volume: { kind: "tbw", fraction: 0.6 },
            },
            pd: [],
          },
        },
      ];

      const afterState = simulate(state, 0, 60, caffeineIntervention);
      const concentration = afterState.pk["caffeine-test_central"] ?? 0;

      expect(concentration).toBeGreaterThan(0.1);
    });

    it("should affect dopamine via adenosine receptor antagonism", () => {
      const caffeineIntervention: ActiveIntervention[] = [
        {
          id: "caffeine-dopamine-test",
          key: "caffeine",
          startTime: 480,
          duration: 240,
          intensity: 1.0,
          params: { mg: 100 },
          pharmacology: {
            pk: { model: "1-compartment", delivery: "bolus", bioavailability: 0.99, halfLifeMin: 300 },
            pd: [{ target: "Adenosine_A2a", mechanism: "antagonist", Ki: 0.5, intrinsicEfficacy: 20 }],
          },
        },
      ];

      const baselineDopamine = state.signals.dopamine;

      // Simulate 2 hours
      const afterState = simulate(state, 480, 120, caffeineIntervention);

      expect(afterState.signals.dopamine).toBeGreaterThan(baselineDopamine);
    });
  });

  describe("Activity-Dependent Interventions", () => {
    it("should handle sleep intervention with activity-dependent PK", () => {
      const sleepIntervention: ActiveIntervention[] = [
        {
          id: "sleep-test",
          key: "sleep",
          startTime: 0,
          duration: 480,
          intensity: 1.0,
          params: {},
          pharmacology: { pk: { model: "activity-dependent" }, pd: [] },
        },
      ];

      // Simulate during sleep
      let sleepState = state;
      for (let i = 0; i < 60; i++) {
        sleepState = integrateStep(sleepState, i, 1.0, createCtx(i, true), SIGNAL_DEFINITIONS, AUXILIARY_DEFINITIONS, sleepIntervention);
      }

      const concentration = sleepState.pk["sleep-test_central"] ?? 0;
      expect(concentration).toBeGreaterThan(0.5);
    });

    it("should handle multi-day sleep interventions without overwriting", () => {
      const interventions: ActiveIntervention[] = [
        {
          id: "sleep-multi",
          key: "sleep",
          startTime: 1320, // 10 PM Day 1
          duration: 480,
          intensity: 1.0,
          params: {},
          pharmacology: { pk: { model: "activity-dependent" }, pd: [] },
        },
        {
          id: "sleep-multi",
          key: "sleep",
          startTime: 2760, // 10 PM Day 2
          duration: 480,
          intensity: 1.0,
          params: {},
          pharmacology: { pk: { model: "activity-dependent" }, pd: [] },
        },
      ];

      // Simulate during day 1 sleep
      let sleepState = state;
      for (let i = 0; i < 60; i++) {
        const t = 1380 + i;
        sleepState = integrateStep(sleepState, t, 1.0, createCtx(t % 1440, true), SIGNAL_DEFINITIONS, AUXILIARY_DEFINITIONS, interventions);
      }

      const concentration = sleepState.pk["sleep-multi_central"] ?? 0;
      expect(concentration).toBeGreaterThan(0.5);
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero duration gracefully", () => {
      const result = simulate(state, 0, 0, []);
      expect(result).toBeDefined();
    });

    it("should handle intervention outside simulation window", () => {
      const futureIntervention: ActiveIntervention[] = [
        {
          id: "future",
          key: "pill",
          startTime: 1000,
          duration: 60,
          intensity: 1.0,
          params: { mg: 100 },
          pharmacology: { pk: { model: "1-compartment", delivery: "bolus" }, pd: [] },
        },
      ];

      const result = simulate(state, 0, 100, futureIntervention);
      expect(result.pk["future_central"] ?? 0).toBe(0);
    });

    it("should handle missing pharmacology gracefully", () => {
      const noPharmIntervention: any[] = [{ id: "none", startTime: 0, duration: 30, params: {} }];
      const result = simulate(state, 0, 30, noPharmIntervention);
      expect(result).toBeDefined();
    });
  });
});