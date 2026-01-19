import type {
  UnifiedSignalDefinition,
  AuxiliaryDefinition,
} from "@/types/unified";
import {
  minuteToPhase,
  hourToPhase,
  windowPhase,
  gaussianPhase,
  sigmoidPhase,
} from "../utils";

/**
 * DOPAMINE
 */
export const dopamine: UnifiedSignalDefinition = {
  key: "dopamine",
  label: "Dopamine",
  unit: "nM",
  description: "Often called the 'reward' chemical, dopamine is actually about motivation and anticipation. It's the signal that drives you to pursue goals and seek out pleasurable experiences, creating that 'get up and go' feeling.",
  idealTendency: "mid",
  dynamics: {
    setpoint: (ctx) => {
      const p = minuteToPhase(ctx.circadianMinuteOfDay);
      const morningDrive = gaussianPhase(p, hourToPhase(10.5), 1.0);
      const afternoonPlateau = gaussianPhase(p, hourToPhase(13.5), 0.8);
      const eveningDrop = gaussianPhase(p, hourToPhase(22), 0.5);
      return (
        4.0 + 9.0 * morningDrive + 4.0 * afternoonPlateau - 3.0 * eveningDrop
      );
    },
    tau: 120, // 2 hour baseline dynamics
    production: [
      {
        source: "constant",
        coefficient: 0.002,
        transform: (_, state) => {
          const vesicles = state.auxiliary.dopamineVesicles ?? 0.8;
          const activity = 1.0;
          return activity * vesicles * 10; // Scaled by 0.2 (50 -> 10)
        },
      },
    ],
    clearance: [
      { type: "enzyme-dependent", rate: 0.002, enzyme: "DAT" },
      { type: "enzyme-dependent", rate: 0.001, enzyme: "MAO_B" },
    ],
    couplings: [
      // Analytical was 0.5. 0.5 * (0.2 / 0.3) / 120 = 0.0028
      // Reduced to 0.001 to prevent excessive baseline drive from cortisol
      { source: "cortisol", effect: "stimulate", strength: 0.001 },
    ],
  },
  initialValue: 10,
  min: 0,
  max: 100,
  display: {
    referenceRange: { min: 5, max: 20 },
  },
};

/**
 * SEROTONIN
 */
export const serotonin: UnifiedSignalDefinition = {
  key: "serotonin",
  label: "Serotonin",
  unit: "nM",
  description: "The body's natural mood stabilizer. Serotonin helps regulate everything from sleep and appetite to social behavior and contentment. Higher levels are generally associated with a sense of well-being and emotional resilience.",
  idealTendency: "mid",
  dynamics: {
    setpoint: (ctx) => {
      const p = minuteToPhase(ctx.circadianMinuteOfDay);
      const lateMorning = gaussianPhase(p, hourToPhase(11), 1.0);
      const afternoon = gaussianPhase(p, hourToPhase(15), 0.8);
      return 2.0 + 2.5 * (lateMorning + afternoon);
    },
    tau: 180,
    production: [
      {
        source: "constant",
        coefficient: 0.002,
        transform: (_, state) => {
          const precursor = state.auxiliary.serotoninPrecursor ?? 0.7;
          return precursor * 4; // Scaled by 0.1 (40 -> 4)
        },
      },
    ],
    clearance: [
      { type: "enzyme-dependent", rate: 0.002, enzyme: "SERT" },
      { type: "enzyme-dependent", rate: 0.001, enzyme: "MAO_A" },
    ],
    couplings: [
      // 0.0016 * 0.1 / 1.0 = 0.00016
      { source: "vip", effect: "stimulate", strength: 0.00016 },
      // Analytical was -0.5. 0.5 * (0.1 / 0.3) / 180 = 0.0009
      { source: "cortisol", effect: "inhibit", strength: 0.0009 },
    ],
  },
  initialValue: 5,
  min: 0,
  max: 50,
  display: {
    referenceRange: { min: 1, max: 10 },
  },
};

// --- Auxiliary Variables ---

export const dopamineVesicles: AuxiliaryDefinition = {
  key: "dopamineVesicles",
  dynamics: {
    setpoint: (ctx) => 0.8,
    tau: 100, // Replenishment time
    production: [
      {
        source: "constant",
        coefficient: 0.01,
        transform: (_, state) => {
          const V = state.auxiliary.dopamineVesicles ?? 0.8;
          return 0.8 * (1 - V);
        },
      },
    ],
    clearance: [
      {
        type: "linear",
        rate: 0.005,
        transform: (_, state) => 1.0, // activity
      },
    ],
  },
  initialValue: 0.8,
};

/**
 * NOREPINEPHRINE
 */
export const norepi: UnifiedSignalDefinition = {
  key: "norepi",
  label: "Norepinephrine",
  unit: "pg/mL",
  description: "Both a hormone and a neurotransmitter, this is your brain's 'focus' signal. It increases alertness and arousal, sharpening your attention and preparing your body for action—essential for concentration and productivity.",
  idealTendency: "mid",
  dynamics: {
    setpoint: (ctx) => {
      const p = minuteToPhase(ctx.circadianMinuteOfDay);
      const wakeDrive = sigmoidPhase(p, hourToPhase(8.5), 1.0);
      const stressResponse = gaussianPhase(p, hourToPhase(9), 0.5);
      return 156.0 + 250.0 * wakeDrive + 94.0 * stressResponse; // Baseline ~250 pg/mL
    },
    tau: 90,
    production: [
      {
        source: "constant",
        coefficient: 0.002,
        transform: (_, state) => {
          const vesicles = state.auxiliary.norepinephrineVesicles ?? 0.8;
          return vesicles * 281; // 45 * 6.25
        },
      },
    ],
    clearance: [
      { type: "enzyme-dependent", rate: 0.002, enzyme: "NET" },
      { type: "enzyme-dependent", rate: 0.001, enzyme: "MAO_A" },
    ],
    couplings: [
      // 0.005 * 6.25 / 0.3 = 0.104
      { source: "cortisol", effect: "stimulate", strength: 0.104 },
      // 0.008 * 6.25 / 1.0 = 0.05
      { source: "orexin", effect: "stimulate", strength: 0.05 },
    ],
  },
  initialValue: 250,
  min: 0,
  max: 2000,
  display: {
    referenceRange: { min: 100, max: 450 },
  },
};

export const norepinephrineVesicles: AuxiliaryDefinition = {
  key: "norepinephrineVesicles",
  dynamics: {
    setpoint: (ctx) => 0.8,
    tau: 120,
    production: [
      {
        source: "constant",
        coefficient: 0.008,
        transform: (_, state) =>
          0.8 - (state.auxiliary.norepinephrineVesicles ?? 0.8),
      },
    ],
    clearance: [{ type: "linear", rate: 0.004 }],
  },
  initialValue: 0.8,
};

/**
 * GABA
 */
export const gaba: UnifiedSignalDefinition = {
  key: "gaba",
  label: "GABA",
  unit: "nM",
  description: "The brain's primary 'off' switch. GABA reduces the activity of neurons, acting as a natural brake to prevent overstimulation. It's essential for relaxation, reducing anxiety, and falling asleep.",
  idealTendency: "mid",
  dynamics: {
    setpoint: (ctx) => {
      const p = minuteToPhase(ctx.circadianMinuteOfDay);
      const eveningRise = sigmoidPhase(p, hourToPhase(21), 1.0);
      return 240.0 + 180.0 * eveningRise; // Baseline ~300 nM
    },
    tau: 120,
    production: [
      {
        source: "constant",
        coefficient: 0.0015,
        transform: (_, state) => (state.auxiliary.gabaPool ?? 0.7) * 300, // 50 * 6
      },
    ],
    clearance: [{ type: "enzyme-dependent", rate: 0.002, enzyme: "GAT1" }],
    couplings: [
      // 0.1 * 6 / 1 = 0.6
      { source: "melatonin", effect: "stimulate", strength: 0.6 },
      // 0.05 * 6 / 0.0833 = 3.6
      { source: "glutamate", effect: "inhibit", strength: 3.6 },
    ],
  },
  initialValue: 300,
  min: 0,
  max: 2000,
  display: {
    referenceRange: { min: 100, max: 500 },
  },
};

export const gabaPool: AuxiliaryDefinition = {
  key: "gabaPool",
  dynamics: {
    setpoint: (ctx) => 0.7,
    tau: 240,
    production: [
      {
        source: "constant",
        coefficient: 0.004,
        transform: (_, state) => 0.7 - (state.auxiliary.gabaPool ?? 0.7),
      },
    ],
    clearance: [{ type: "linear", rate: 0.001 }],
  },
  initialValue: 0.7,
};

/**
 * GLUTAMATE
 */
export const glutamate: UnifiedSignalDefinition = {
  key: "glutamate",
  label: "Glutamate",
  unit: "µM",
  description: "The most abundant 'on' switch in your brain. Glutamate is the gas pedal for neural activity, playing a central role in learning, memory, and fast communication between neurons. Balance is key, as too much can cause over-excitement.",
  idealTendency: "mid",
  dynamics: {
    setpoint: (ctx) => {
      const p = minuteToPhase(ctx.circadianMinuteOfDay);
      const wakeDrive = sigmoidPhase(p, hourToPhase(9), 1.0);
      return 2.5 + 4.16 * wakeDrive; // Baseline ~5 µM
    },
    tau: 60,
    production: [
      {
        source: "constant",
        coefficient: 0.003,
        transform: (_, state) => (state.auxiliary.glutamatePool ?? 0.7) * 5, // 60 * 0.0833
      },
    ],
    clearance: [{ type: "enzyme-dependent", rate: 0.004, enzyme: "GLT1" }],
    couplings: [
      // 0.05 * 0.0833 / 6.25 = 0.00067
      { source: "norepi", effect: "stimulate", strength: 0.00067 },
      // 0.1 * 0.0833 / 6 = 0.0014
      { source: "gaba", effect: "inhibit", strength: 0.0014 },
    ],
  },
  initialValue: 5,
  min: 0,
  max: 100,
  display: {
    referenceRange: { min: 1, max: 10 },
  },
};

export const glutamatePool: AuxiliaryDefinition = {
  key: "glutamatePool",
  dynamics: {
    setpoint: (ctx) => 0.7,
    tau: 180,
    production: [
      {
        source: "constant",
        coefficient: 0.005,
        transform: (_, state) => 0.7 - (state.auxiliary.glutamatePool ?? 0.7),
      },
    ],
    clearance: [{ type: "linear", rate: 0.002 }],
  },
  initialValue: 0.7,
};

/**
 * ACETYLCHOLINE
 */
export const acetylcholine: UnifiedSignalDefinition = {
  key: "acetylcholine",
  label: "Acetylcholine",
  unit: "nM",
  description: "A critical messenger for both your brain and your muscles. In the brain, it supports learning, memory, and sustained attention. It's often associated with 'speed of thought' and your ability to process new information quickly.",
  idealTendency: "mid",
  dynamics: {
    setpoint: (ctx) => {
      const p = minuteToPhase(ctx.circadianMinuteOfDay);
      const remDrive = ctx.isAsleep ? 0.8 : 0.4;
      const wakeFocus = windowPhase(p, hourToPhase(10), hourToPhase(12), 0.5);
      return 7.5 + 10.0 * wakeFocus + 7.5 * remDrive; // Baseline ~10 nM
    },
    tau: 45,
    production: [],
    clearance: [{ type: "enzyme-dependent", rate: 0.02, enzyme: "AChE" }],
    couplings: [
      // 0.15 * 0.25 / 1.0 = 0.0375
      { source: "orexin", effect: "stimulate", strength: 0.0375 },
    ],
  },
  initialValue: 10,
  min: 0,
  max: 100,
  display: {
    referenceRange: { min: 1, max: 20 },
  },
};

/**
 * ENDOCANNABINOID (e.g., Anandamide)
 */
export const endocannabinoid: UnifiedSignalDefinition = {
  key: "endocannabinoid",
  label: "Endocannabinoid",
  unit: "nM",
  description: "Part of your body's internal 'homeostasis' system. Endocannabinoids like anandamide (the 'bliss molecule') help balance other signals, regulating mood, pain perception, and appetite while promoting a sense of calm and balance.",
  idealTendency: "mid",
  dynamics: {
    setpoint: (ctx) => {
      const p = minuteToPhase(ctx.circadianMinuteOfDay);
      const morningRise = gaussianPhase(p, hourToPhase(9), 2.0);
      return 4.0 + 6.0 * morningRise; // Baseline ~5 nM
    },
    tau: 60,
    production: [],
    clearance: [{ type: "linear", rate: 0.02 }],
    couplings: [
      // 0.05 * 0.2 / 0.2 = 0.05 (both scale by 0.2)
      { source: "dopamine", effect: "stimulate", strength: 0.05 },
      // 0.05 * 0.2 / 0.3 = 0.033
      { source: "cortisol", effect: "inhibit", strength: 0.033 },
    ],
  },
  initialValue: 5,
  min: 0,
  max: 100,
  display: {
    referenceRange: { min: 1, max: 10 },
  },
};

export const serotoninPrecursor: AuxiliaryDefinition = {
  key: "serotoninPrecursor",
  dynamics: {
    setpoint: (ctx) => 0.7,
    tau: 480, // Slow replenishment
    production: [
      // Tryptophan from diet: simplified meal effect
      {
        source: "constant",
        coefficient: 1.0,
        transform: (_, state, ctx) => {
          // In the unified model, we can check for recent food interventions
          // But for now, let's use a simplified constant drive if insulin is high
          // (representing the insulin-mediated transport of tryptophan)
          const insulin = state.signals.insulin;
          return insulin > 15 ? 0.0005 * (insulin - 15) : 0;
        },
      },
    ],
    clearance: [{ type: "linear", rate: 0.001 }],
  },
  initialValue: 0.7,
};
