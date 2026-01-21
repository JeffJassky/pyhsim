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
 * MELATONIN
 */
export const melatonin: UnifiedSignalDefinition = {
  key: "melatonin",
  label: "Melatonin",
  unit: "pg/mL",
  description: "Often called the 'vampire hormone,' melatonin is your brain's primary signal for biological night. It doesn't knock you out like a sedative, but rather opens the 'sleep gate' and helps coordinate your body's internal clocks.",
  idealTendency: "mid",
  dynamics: {
    setpoint: (ctx) => {
      const p = minuteToPhase(ctx.circadianMinuteOfDay);
      return 80.0 * windowPhase(p, hourToPhase(21), hourToPhase(7.5), 0.5);
    },
    tau: 30, // Fast rise and fall
    production: [],
    clearance: [{ type: "linear", rate: 0.03 }],
    couplings: [
      // 2.0 * 10 = 20.0 (strong inhibition from high dopamine/caffeine)
      { source: "dopamine", effect: "inhibit", strength: 2.0 },
    ],
  },
  initialValue: 5,
  min: 0,
  max: 150,
  display: {
    referenceRange: { min: 0, max: 100 },
  },
};

/**
 * OREXIN
 */
export const orexin: UnifiedSignalDefinition = {
  key: "orexin",
  label: "Orexin",
  isPremium: true,
  unit: "pg/mL",
  description: "The brain's master 'wakefulness' switch. Orexin keeps you alert, motivated, and interested in the outside world. It acts as the glue that stabilizes your awake state and prevents sudden lapses into sleepiness.",
  idealTendency: "mid",
  dynamics: {
    setpoint: (ctx) => {
      const p = minuteToPhase(ctx.circadianMinuteOfDay);
      const wakeDrive = sigmoidPhase(p, hourToPhase(7.8), 1.0);
      const feedingCue =
        gaussianPhase(p, hourToPhase(12.5), 0.5) +
        0.6 * gaussianPhase(p, hourToPhase(18.5), 0.8);
      const sleepPressure = sigmoidPhase(p, hourToPhase(22.5), 1.0);
      return (
        250.0 + 150.0 * wakeDrive + 80.0 * feedingCue - 100.0 * sleepPressure
      );
    },
    tau: 90,
    production: [],
    clearance: [{ type: "linear", rate: 0.01 }],
    couplings: [
      { source: "melatonin", effect: "inhibit", strength: 0.4 },
      { source: "ghrelin", effect: "stimulate", strength: 0.05 },
      // 0.3 / 0.2 = 1.5
      { source: "dopamine", effect: "stimulate", strength: 1.5 },
    ],
  },
  initialValue: 250,
  min: 100,
  max: 600,
  display: {
    referenceRange: { min: 200, max: 600 },
  },
};

/**
 * HISTAMINE
 */
export const histamine: UnifiedSignalDefinition = {
  key: "histamine",
  label: "Histamine",
  isPremium: true,
  unit: "nM",
  description: "Beyond its role in allergies, histamine in the brain is a powerful alertness chemical. It acts as a general 'on' switch for arousal and attention, which is why older antihistamines make you feel so drowsy.",
  idealTendency: "mid",
  dynamics: {
    setpoint: (ctx) => {
      const p = minuteToPhase(ctx.circadianMinuteOfDay);
      const wake = sigmoidPhase(p, hourToPhase(7.5), 1.0);
      const day = gaussianPhase(p, hourToPhase(13), 0.8);
      const nightFall = sigmoidPhase(p, hourToPhase(22), 1.0);
      return 7.5 + 22.5 * wake + 17.5 * day - 15.0 * nightFall; // Baseline ~20 nM
    },
    tau: 60,
    production: [],
    clearance: [{ type: "enzyme-dependent", rate: 0.02, enzyme: "DAO" }],
    couplings: [
      // 0.3 * 0.5 = 0.15
      { source: "melatonin", effect: "inhibit", strength: 0.15 },
      // 0.2 * 0.5 = 0.1
      { source: "vip", effect: "stimulate", strength: 0.1 },
    ],
  },
  initialValue: 10,
  min: 0,
  max: 500,
  display: {
    referenceRange: { min: 5, max: 50 },
  },
};

/**
 * ADENOSINE PRESSURE (Process S)
 */
export const adenosinePressure: AuxiliaryDefinition = {
  key: "adenosinePressure",
  dynamics: {
    setpoint: (ctx) => (ctx.isAsleep ? 0 : 1.0),
    tau: 1440, // Not used directly in Process S model
    production: [
      {
        source: "constant",
        coefficient: 0.003, // sleepPressureBuild
        transform: (_, state, ctx) => {
          if (ctx.isAsleep) return 0;
          const S = state.auxiliary.adenosinePressure ?? 0.2;
          // Caffeine block could be added here
          return 1 - S;
        },
      },
    ],
    clearance: [
      {
        type: "linear",
        rate: 0.008, // sleepPressureDecay
        transform: (_, state, ctx) => {
          return ctx.isAsleep ? 1.0 : 0;
        },
      },
    ],
  },
  initialValue: 0.2,
};
