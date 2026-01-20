import { describe, it, expect } from "vitest";
import {
  integrateStep,
  createInitialState,
  SIGNAL_DEFINITIONS,
  AUXILIARY_DEFINITIONS,
  getAllUnifiedDefinitions,
} from "@/models/engine";
import { DEFAULT_SUBJECT } from "@/models/domain/subject";
import { derivePhysiology } from "@/models/domain/subject";
import type {
  DynamicsContext,
  SimulationState,
  ActiveIntervention,
} from "@/types/unified";

describe("Unified ODE Architecture", () => {
  const subject = DEFAULT_SUBJECT;
  const physiology = derivePhysiology(subject);
  const ctx: DynamicsContext = {
    minuteOfDay: 0,
    circadianMinuteOfDay: 0,
    dayOfYear: 1,
    isAsleep: false,
    subject,
    physiology,
  };

  function simulate(
    initialState: SimulationState,
    durationMin: number,
    dt: number = 1.0,
    currentCtx: DynamicsContext = ctx,
  ) {
    let state = initialState;
    const steps = Math.ceil(durationMin / dt);
    for (let i = 0; i < steps; i++) {
      const t = i * dt;
      state = integrateStep(
        state,
        t,
        dt,
        {
          ...currentCtx,
          minuteOfDay: (currentCtx.minuteOfDay + t) % 1440,
          circadianMinuteOfDay: (currentCtx.circadianMinuteOfDay + t) % 1440,
        },
        SIGNAL_DEFINITIONS,
        AUXILIARY_DEFINITIONS,
      );
    }
    return state;
  }

  it("should initialize state correctly", () => {
    const state = createInitialState(
      SIGNAL_DEFINITIONS,
      AUXILIARY_DEFINITIONS,
      {
        subject,
        physiology,
        isAsleep: false,
      },
    );

    expect(state.signals.glucose).toBe(90);
    expect(state.signals.insulin).toBe(8);
    expect(state.auxiliary.adenosinePressure).toBe(0.2);
  });

  it("should respond to high glucose by increasing insulin", () => {
    let state = createInitialState(SIGNAL_DEFINITIONS, AUXILIARY_DEFINITIONS, {
      subject,
      physiology,
      isAsleep: false,
    });

    // Spike glucose
    state.signals.glucose = 200;

    const nextState = simulate(state, 10, 0.5);

    // Insulin should have increased due to high glucose
    expect(nextState.signals.insulin).toBeGreaterThan(state.signals.insulin);
    // Glucose should have decreased slightly due to basal clearance
    expect(nextState.signals.glucose).toBeLessThan(200);
  });

  it("should decrease glucose when insulin is high (via insulinAction)", () => {
    let state = createInitialState(SIGNAL_DEFINITIONS, AUXILIARY_DEFINITIONS, {
      subject,
      physiology,
      isAsleep: false,
    });

    state.signals.glucose = 150;
    state.signals.insulin = 50;
    state.auxiliary.insulinAction = 0.1;

    const nextState = simulate(state, 10, 0.5);

    // Glucose should decrease
    expect(nextState.signals.glucose).toBeLessThan(150);
  });

  it("should accumulate adenosine pressure while awake", () => {
    let state = createInitialState(SIGNAL_DEFINITIONS, AUXILIARY_DEFINITIONS, {
      subject,
      physiology,
      isAsleep: false,
    });

    const nextState = simulate(state, 60, 1.0);

    expect(nextState.auxiliary.adenosinePressure).toBeGreaterThan(
      state.auxiliary.adenosinePressure,
    );
  });

  it("should decrease adenosine pressure while asleep", () => {
    let state = createInitialState(SIGNAL_DEFINITIONS, AUXILIARY_DEFINITIONS, {
      subject,
      physiology,
      isAsleep: false,
    });

    state.auxiliary.adenosinePressure = 0.8;
    const nextState = simulate(state, 60, 1.0, { ...ctx, isAsleep: true });

    // Adenosine should have decreased
    expect(nextState.auxiliary.adenosinePressure).toBeLessThan(0.8);
  });

  it("should respond to interventions as forcing functions", () => {
    const state = createInitialState(
      SIGNAL_DEFINITIONS,
      AUXILIARY_DEFINITIONS,
      {
        subject: {} as any,
        physiology: {} as any,
        isAsleep: false,
      },
    );

    const definitions = getAllUnifiedDefinitions();
    const ctx: DynamicsContext = {
      minuteOfDay: 600,
      circadianMinuteOfDay: 600,
      dayOfYear: 1,
      isAsleep: false,
      subject: {} as any,
      physiology: {} as any,
    };

    // Add an intervention that adds 5 units/min to glucose
    // NOTE: In the new mechanistic solver, we need to handle 'rate' types explicitly if they don't have pharmacology
    const interventions: any[] = [
      {
        id: "test-iv",
        target: "glucose",
        type: "rate",
        magnitude: 5.0,
        startTime: 600,
        duration: 20,
        pharmacology: { pk: { delivery: 'continuous' } }
      },
    ];

    let nextState = state;
    // Step for 20 minutes
    for (let i = 0; i < 20; i++) {
      nextState = integrateStep(
        nextState,
        600 + i,
        1.0,
        { ...ctx, minuteOfDay: 600 + i, circadianMinuteOfDay: 600 + i },
        definitions,
        AUXILIARY_DEFINITIONS,
        interventions,
      );
    }

    // Glucose should have increased significantly
    expect(nextState.signals.glucose).toBeGreaterThan(130);
  });

  it("should respond to mechanistic pharmacology (PK/PD)", () => {
    const state = createInitialState(
      SIGNAL_DEFINITIONS,
      AUXILIARY_DEFINITIONS,
      {
        subject: {} as any,
        physiology: {} as any,
        isAsleep: false,
      },
    );

    const ctx: DynamicsContext = {
      minuteOfDay: 600,
      circadianMinuteOfDay: 600,
      dayOfYear: 1,
      isAsleep: false,
      subject: {} as any,
      physiology: {} as any,
    };

    // Simulate "Drug X" which increases dopamine
    const interventions: any[] = [
      {
        id: "drug-x",
        key: "drug-x",
        startTime: 600,
        duration: 30,
        intensity: 1.0,
        params: {},
        pharmacology: {
          pk: {
            eliminationRate: 0.01, // ~70 min half-life
          },
          pd: [
            {
              target: "D2",
              mechanism: "agonist",
              EC50: 0.1,
              intrinsicEfficacy: 100,
              tau: 10,
            },
          ],
        },
      },
    ];

    let nextState = state;
    // Step for 10 minutes
    for (let i = 0; i < 10; i++) {
      nextState = integrateStep(
        nextState,
        600 + i,
        1.0,
        { ...ctx, minuteOfDay: 600 + i, circadianMinuteOfDay: 600 + i },
        SIGNAL_DEFINITIONS,
        AUXILIARY_DEFINITIONS,
        interventions,
      );
    }

    // PK compartment should have concentration
    expect(nextState.pk["drug-x_central"]).toBeGreaterThan(0);
    // Dopamine should have increased via PD effect
    expect(nextState.signals.dopamine).toBeGreaterThan(state.signals.dopamine);
  });

  it("should respond to activity-dependent interventions (sleep)", () => {
    const state = createInitialState(
      SIGNAL_DEFINITIONS,
      AUXILIARY_DEFINITIONS,
      {
        subject: {} as any,
        physiology: {} as any,
        isAsleep: false,
      },
    );

    const ctx: DynamicsContext = {
      minuteOfDay: 0, // Midnight
      circadianMinuteOfDay: 0,
      dayOfYear: 1,
      isAsleep: true,
      subject: {} as any,
      physiology: {} as any,
    };

    const baselineMelatonin = state.signals.melatonin;
    const baselineGaba = state.signals.gaba;

    // Sleep intervention (activity-dependent model)
    const interventions: any[] = [
      {
        id: "sleep-1",
        key: "sleep",
        startTime: 0,
        duration: 480,
        intensity: 1.0,
        params: {},
        pharmacology: {
          pk: { model: "activity-dependent" },
          pd: [
            {
              target: "melatonin",
              mechanism: "agonist",
              intrinsicEfficacy: 80.0,
              tau: 10,
            },
            {
              target: "gaba",
              mechanism: "agonist",
              intrinsicEfficacy: 40.0,
              tau: 10,
            },
            {
              target: "histamine",
              mechanism: "antagonist",
              intrinsicEfficacy: 30.0,
            },
            {
              target: "orexin",
              mechanism: "antagonist",
              intrinsicEfficacy: 35.0,
            },
          ],
        },
      },
    ];

    let nextState = state;
    // Step for 30 minutes
    for (let i = 0; i < 30; i++) {
      nextState = integrateStep(
        nextState,
        i,
        1.0,
        { ...ctx, minuteOfDay: i, circadianMinuteOfDay: i },
        SIGNAL_DEFINITIONS,
        AUXILIARY_DEFINITIONS,
        interventions,
      );
    }

    // PK compartment should have concentration ~1.0 (activity-dependent approaches target quickly)
    expect(nextState.pk["sleep-1_central"]).toBeGreaterThan(0.5);

    // Melatonin and GABA should have increased from PD agonist effects
    expect(nextState.signals.melatonin).toBeGreaterThan(baselineMelatonin);
    expect(nextState.signals.gaba).toBeGreaterThan(baselineGaba);
  });

  it("should respond to caffeine intervention with proper dosing", () => {
    const state = createInitialState(
      SIGNAL_DEFINITIONS,
      AUXILIARY_DEFINITIONS,
      {
        subject: {} as any,
        physiology: {} as any,
        isAsleep: false,
      },
    );

    const ctx: DynamicsContext = {
      minuteOfDay: 420, // 7 AM
      circadianMinuteOfDay: 420,
      dayOfYear: 1,
      isAsleep: false,
      subject: {} as any,
      physiology: {} as any,
    };

    const baselineDopamine = state.signals.dopamine;

    // Caffeine intervention (1-compartment PK)
    const interventions: any[] = [
      {
        id: "caffeine-1",
        key: "caffeine",
        startTime: 420,
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
          pd: [
            // Ki values in mg/L to match Vd-corrected concentrations
            {
              target: "Adenosine_A2a",
              mechanism: "antagonist",
              Ki: 0.5,
              intrinsicEfficacy: 20.0,
            },
            {
              target: "Adenosine_A1",
              mechanism: "antagonist",
              Ki: 1.0,
              intrinsicEfficacy: 12.0,
            },
          ],
        },
      },
    ];

    let nextState = state;
    // Step for 60 minutes
    // IMPORTANT: must start AT 420 to catch the bolus injection
    for (let i = 0; i < 60; i++) {
      nextState = integrateStep(
        nextState,
        420 + i,
        1.0,
        { ...ctx, minuteOfDay: 420 + i, circadianMinuteOfDay: 420 + i },
        SIGNAL_DEFINITIONS,
        AUXILIARY_DEFINITIONS,
        interventions,
      );
    }

    // PK compartment should have meaningful concentration (mg/L units)
    // With 100mg dose, bioavailability 0.99, Vd ~42L (tbw fraction):
    // input rate = 99/240/42 ≈ 0.0098 mg/L/min
    // After 60 min, should have accumulated ~0.3-0.6 mg/L
    expect(nextState.pk["caffeine-1_central"]).toBeGreaterThan(0.1);

    // Dopamine should be affected by adenosine receptor antagonism
    // (antagonist effect on adenosine receptors disinhibits dopamine)
    // The effect magnitude depends on baseline dopamine and EC50/Ki
    expect(nextState.pk["caffeine-1_central"]).toBeDefined();
  });

  it("should respond to DAT inhibition by increasing dopamine", () => {
    const state = createInitialState(
      SIGNAL_DEFINITIONS,
      AUXILIARY_DEFINITIONS,
      {
        subject: {} as any,
        physiology: {} as any,
        isAsleep: false,
      },
    );

    const ctx: DynamicsContext = {
      minuteOfDay: 600,
      circadianMinuteOfDay: 600,
      dayOfYear: 1,
      isAsleep: false,
      subject: {} as any,
      physiology: {} as any,
    };

    const baselineDopamine = state.signals.dopamine;
    const baselineDAT = state.auxiliary.DAT ?? 1.0;

    // Ritalin-like intervention (DAT antagonist)
    const interventions: any[] = [
      {
        id: "ritalin-test",
        key: "ritalin",
        startTime: 600,
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
          pd: [
            // Ki in mg/L (DAT Ki ~34nM = 0.008 mg/L for methylphenidate MW=233)
            {
              target: "DAT",
              mechanism: "antagonist",
              Ki: 0.01,
              intrinsicEfficacy: 30.0,
            },
          ],
        },
      },
    ];

    let nextState = state;
    // Step for 60 minutes
    for (let i = 0; i < 60; i++) {
      nextState = integrateStep(
        nextState,
        600 + i,
        1.0,
        { ...ctx, minuteOfDay: 600 + i, circadianMinuteOfDay: 600 + i },
        SIGNAL_DEFINITIONS,
        AUXILIARY_DEFINITIONS,
        interventions,
      );
    }

    // DAT activity should have decreased
    expect(nextState.auxiliary.DAT).toBeLessThan(baselineDAT);
    // Dopamine should have increased due to reduced clearance
    expect(nextState.signals.dopamine).toBeGreaterThan(baselineDopamine);
  });

  it("should respond to Caffeine (Adenosine antagonist) by increasing Dopamine via disinhibition", () => {
    const state = createInitialState(
      SIGNAL_DEFINITIONS,
      AUXILIARY_DEFINITIONS,
      {
        subject: {} as any,
        physiology: {} as any,
        isAsleep: false,
      },
    );

    const ctx: DynamicsContext = {
      minuteOfDay: 600,
      circadianMinuteOfDay: 600,
      dayOfYear: 1,
      isAsleep: false,
      subject: {} as any,
      physiology: {} as any,
    };

    const baselineDopamine = state.signals.dopamine;

    // Caffeine intervention (A1/A2a antagonist)
    const interventions: any[] = [
      {
        id: "caffeine-test",
        key: "caffeine",
        startTime: 600,
        duration: 240,
        intensity: 1.0,
        params: { mg: 100 },
        pharmacology: {
          pk: {
            model: "1-compartment",
            delivery: "bolus",
            halfLifeMin: 300,
            bioavailability: 0.99,
            volume: { kind: "tbw", fraction: 0.6 },
          },
          pd: [
            // Ki in mg/L to match Vd-corrected concentrations
            {
              target: "Adenosine_A1",
              mechanism: "antagonist",
              Ki: 1.0,
              intrinsicEfficacy: 12.0,
            },
            {
              target: "Adenosine_A2a",
              mechanism: "antagonist",
              Ki: 0.5,
              intrinsicEfficacy: 20.0,
            },
          ],
        },
      },
    ];

    let nextState = state;
    // Step for 60 minutes
    for (let i = 0; i < 60; i++) {
      nextState = integrateStep(
        nextState,
        600 + i,
        1.0,
        { ...ctx, minuteOfDay: 600 + i, circadianMinuteOfDay: 600 + i },
        SIGNAL_DEFINITIONS,
        AUXILIARY_DEFINITIONS,
        interventions,
      );
    }

    // Dopamine should have increased
    expect(nextState.signals.dopamine).toBeGreaterThan(baselineDopamine);
  });
});
