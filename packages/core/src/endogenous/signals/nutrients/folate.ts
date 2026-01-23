import type { SignalDefinition } from "../../../engine";

export const folate: SignalDefinition = {
  key: "folate",
  label: "Folate",
  unit: "ng/mL",
  isPremium: true,
  description: "Essential for cell division.",
  idealTendency: "mid",
  dynamics: {
    setpoint: () => 12,
    tau: 10080,
    production: [],
    clearance: [],
    couplings: [],
  },
  initialValue: 12,
  display: {
    referenceRange: { min: 4, max: 20 },
  },
};
