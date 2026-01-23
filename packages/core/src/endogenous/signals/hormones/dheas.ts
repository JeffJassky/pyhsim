import type { SignalDefinition } from "../../../engine";

export const dheas: SignalDefinition = {
  key: "dheas",
  label: "DHEA-S",
  unit: "µg/dL",
  isPremium: true,
  description: "A precursor to sex hormones.",
  idealTendency: "mid",
  dynamics: {
    setpoint: () => 200,
    tau: 10080,
    production: [],
    clearance: [],
    couplings: [],
  },
  initialValue: 200,
  display: {
    referenceRange: { min: 100, max: 500 },
  },
};
