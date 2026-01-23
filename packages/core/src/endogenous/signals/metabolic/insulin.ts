import type { SignalDefinition } from "../../../engine";

// === Scientific Constants ===
const INSULIN_CONSTANTS = {
  FAST_PHASE_ONSET_MIN: 5,
  FAST_PHASE_CLEARANCE_MIN: 35,
  SLOW_PHASE_ONSET_MIN: 18,
  SLOW_PHASE_CLEARANCE_MIN: 160,
  FAST_PHASE_WEIGHT: 0.6,
  SLOW_PHASE_WEIGHT: 0.4,
} as const;

export const insulin: SignalDefinition = {
  key: "insulin",
  label: "Insulin",
  isPremium: true,
  unit: "µIU/mL",
  description:
    "The 'storage' hormone. Produced by the pancreas, insulin moves sugar from the blood into your cells to be used for immediate energy or saved for later. It's the master regulator of nutrient storage.",
  idealTendency: "mid",
  dynamics: {
    setpoint: (ctx: any) => 8.0,
    tau: 4.35,
    production: [
      {
        source: "glucose",
        coefficient: 0.05,
        transform: (G: any) => Math.max(0, G - 80),
      },
    ],
    clearance: [],
    couplings: [{ source: "glucagon", effect: "inhibit", strength: 0.011 }],
  },
  initialValue: 8,
  min: 0,
  max: 200,
  display: {
    referenceRange: { min: 2, max: 25 },
  },
};
