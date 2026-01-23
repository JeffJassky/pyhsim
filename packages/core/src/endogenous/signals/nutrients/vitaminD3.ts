import type { SignalDefinition } from "../../../engine";

export const vitaminD3: SignalDefinition = {
  key: "vitaminD3",
  label: "Vitamin D3",
  unit: "ng/mL",
  isPremium: true,
  description: "Essential hormone-like vitamin.",
  idealTendency: "mid",
  dynamics: {
    setpoint: () => 35,
    tau: 10080,
    production: [],
    clearance: [],
    couplings: [],
  },
  initialValue: 35,
  display: {
    referenceRange: { min: 30, max: 80 },
  },
};
