import type { SignalDefinition } from "../../../engine";

export const zinc: SignalDefinition = {
  key: "zinc",
  label: "Zinc",
  unit: "µg/dL",
  isPremium: true,
  description: "Essential mineral for immunity.",
  idealTendency: "mid",
  dynamics: {
    setpoint: () => 90,
    tau: 10080,
    production: [],
    clearance: [],
    couplings: [],
  },
  initialValue: 90,
  display: {
    referenceRange: { min: 70, max: 120 },
  },
};
