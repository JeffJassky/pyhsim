import type { SignalDefinition } from "../../../engine";

export const b12: SignalDefinition = {
  key: "b12",
  label: "Vitamin B12",
  unit: "pg/mL",
  isPremium: true,
  description: "Essential for nerve health.",
  idealTendency: "mid",
  dynamics: {
    setpoint: () => 500,
    tau: 10080,
    production: [],
    clearance: [],
    couplings: [],
  },
  initialValue: 500,
  display: {
    referenceRange: { min: 200, max: 900 },
  },
};
