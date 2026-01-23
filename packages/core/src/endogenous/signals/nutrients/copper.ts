import type { SignalDefinition } from "../../../engine";

export const copper: SignalDefinition = {
  key: "copper",
  label: "Copper",
  unit: "µg/dL",
  isPremium: true,
  description: "Connective tissue health.",
  idealTendency: "mid",
  dynamics: {
    setpoint: () => 110,
    tau: 10080,
    production: [],
    clearance: [],
    couplings: [],
  },
  initialValue: 110,
  display: {
    referenceRange: { min: 70, max: 150 },
  },
};
