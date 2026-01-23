import type { SignalDefinition } from "../../../engine";

// === Scientific Constants ===
export const GLUCOSE_CONSTANTS = {
  APPEARANCE_AMPLITUDE: 2.0,
  FAST_ABSORPTION_TAU_MIN: 12,
  VD_L_KG: 0.2,
} as const;

export const glucose: SignalDefinition = {
  key: "glucose",
  label: "Glucose",
  unit: "mg/dL",
  description:
    "The primary fuel for your brain and muscles. Maintaining blood sugar in a steady range is essential for consistent energy levels, mental clarity, and long-term metabolic health.",
  idealTendency: "mid",
  dynamics: {
    setpoint: (ctx: any) => 90,
    tau: 35.7,
    production: [{ source: "constant", coefficient: 0.1 }],
    clearance: [
      { type: "enzyme-dependent", rate: 1.0, enzyme: "insulinAction" },
    ],
    couplings: [
      { source: "cortisol", effect: "stimulate", strength: 0.014 },
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
