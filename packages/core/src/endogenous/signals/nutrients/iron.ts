import type { SignalDefinition } from "../../../engine";

export const iron: SignalDefinition = {
  key: "iron",
  label: "Serum Iron",
  unit: "µg/dL",
  isPremium: true,
  description: "Oxygen transport component.",
  idealTendency: "mid",
  dynamics: {
    setpoint: () => 100,
    tau: 10080,
    production: [],
    clearance: [],
    couplings: [],
  },
  initialValue: 100,
  display: {
    referenceRange: { min: 60, max: 170 },
  },
};
