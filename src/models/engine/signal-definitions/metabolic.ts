import type {
  UnifiedSignalDefinition,
  AuxiliaryDefinition,
} from "@/types/unified";
import {
  minuteToPhase,
  hourToPhase,
  windowPhase,
  gaussianPhase,
} from "../utils";

/**
 * GLUCOSE
 * dG/dt = -p1 * (G - Gb) - X * G + Ra
 */
export const glucose: UnifiedSignalDefinition = {
  key: "glucose",
  label: "Glucose",
  unit: "mg/dL",
  description: "The primary fuel for your brain and muscles. Maintaining blood sugar in a steady range is essential for consistent energy levels, mental clarity, and long-term metabolic health.",
  idealTendency: "mid",
  dynamics: {
    setpoint: (ctx) => 90, // Gb: basal glucose
    tau: 35.7, // p1: 1/0.028
    production: [
      // Ra (Rate of Appearance) will be added by interventions
      { source: "constant", coefficient: 0.1 }, // Slow basal production to offset base clearance
    ],
    clearance: [
      // -X * G where X is insulinAction
      { type: "enzyme-dependent", rate: 1.0, enzyme: "insulinAction" },
    ],
    couplings: [
      // Analytical was 0.5. 0.5 / 35.7 = 0.014
      { source: "cortisol", effect: "stimulate", strength: 0.014 },
      // Analytical was 0.05. 0.05 / 35.7 = 0.0014
      { source: "adrenaline", effect: "stimulate", strength: 0.0014 },
    ],
  },
  initialValue: 90,
  min: 40,
  max: 400,
  display: {
    referenceRange: { min: 70, max: 140 },
  },
};

/**
 * INSULIN
 * dI/dt = -n * (I - Ib) + gamma * (G - h)+
 */
export const insulin: UnifiedSignalDefinition = {
  key: "insulin",
  label: "Insulin",
  unit: "µIU/mL",
  description: "The 'storage' hormone. Produced by the pancreas, insulin moves sugar from the blood into your cells to be used for immediate energy or saved for later. It's the master regulator of nutrient storage.",
  idealTendency: "mid",
  dynamics: {
    setpoint: (ctx) => 8.0, // Ib: basal insulin
    tau: 4.35, // n: 1/0.23
    production: [
      // Pancreatic responsivity to glucose above threshold 80 mg/dL
      // Using coefficient that balances at tau
      {
        source: "glucose",
        coefficient: 0.05,
        transform: (G) => Math.max(0, G - 80),
      },
    ],
    clearance: [], // Handled by tau/setpoint
    couplings: [
      // Analytical was -0.05. 0.05 / 4.35 = 0.011
      { source: "glucagon", effect: "inhibit", strength: 0.011 },
    ],
  },
  initialValue: 8,
  min: 0,
  max: 200,
  display: {
    referenceRange: { min: 2, max: 25 },
  },
};

/**
 * GLUCAGON
 * Circadian-driven glucose mobilization
 */
export const glucagon: UnifiedSignalDefinition = {
  key: "glucagon",
  label: "Glucagon",
  unit: "pg/mL",
  description: "The 'mobilization' hormone. When blood sugar drops, glucagon tells your liver to release its stores of glucose, ensuring your brain and body always have a steady supply of fuel.",
  idealTendency: "mid",
  dynamics: {
    setpoint: (ctx) => {
      const p = minuteToPhase(ctx.circadianMinuteOfDay);
      const nocturnal =
        gaussianPhase(p, hourToPhase(23), 1.0) +
        0.8 * gaussianPhase(p, hourToPhase(1.5), 0.8);
      const daytimeSuppression = gaussianPhase(p, hourToPhase(7.5), 0.5);
      return 40 + 35 * nocturnal - 15 * daytimeSuppression;
    },
    tau: 60,
    production: [
      // Analytical was 2.0. 2.0 / 60 = 0.033
      { source: "cortisol", coefficient: 0.033 },
    ],
    clearance: [{ type: "linear", rate: 0.02 }],
    couplings: [
      // Analytical was -0.5. 0.5 / 60 = 0.0083
      { source: "insulin", effect: "inhibit", strength: 0.0083 },
    ],
  },
  initialValue: 50,
  min: 20,
  max: 150,
  display: {
    referenceRange: { min: 50, max: 150 },
  },
};

// --- Auxiliary Variables ---

/**
 * INSULIN ACTION (X)
 * dX/dt = -p2 * X + p3 * (I - Ib)
 */
export const insulinAction: AuxiliaryDefinition = {
  key: "insulinAction",
  dynamics: {
    setpoint: (ctx) => 0,
    tau: 40, // 1/0.025
    production: [
      // p3 * (I - Ib). p3 = 0.000013.
      {
        source: "insulin",
        coefficient: 0.000013,
        transform: (I) => Math.max(0, I - 8.0),
      },
    ],
    clearance: [],
  },
  initialValue: 0,
};

/**
 * HEPATIC GLYCOGEN
 * Simplified glycogen storage/release
 */
export const hepaticGlycogen: AuxiliaryDefinition = {
  key: "hepaticGlycogen",
  dynamics: {
    setpoint: (ctx) => 0.7,
    tau: 1440, // Very slow return to baseline (1 day)
    production: [
      // Storage: occurs when insulin and glucose are high
      {
        source: "constant",
        coefficient: 1.0,
        transform: (_, state) => {
          const G = state.signals.glucose;
          const I = state.signals.insulin;
          const glycogen = state.auxiliary.hepaticGlycogen;
          return I > 8 && G > 100 ? 0.001 * (G - 100) * (1 - glycogen) : 0;
        },
      },
    ],
    clearance: [
      // Release: occurs when glucose is low
      {
        type: "linear",
        rate: 1.0,
        transform: (_, state) => {
          const G = state.signals.glucose;
          return G < 70 ? (0.5 * (70 - G)) / 70 : 0;
        },
      },
    ],
  },
  initialValue: 0.7,
};
