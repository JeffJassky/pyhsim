import type { SignalDefinition } from "../../../engine";

export const alt: SignalDefinition = {
  key: "alt",
  label: "ALT",
  unit: "U/L",
  isPremium: true,
  description: "Alanine Aminotransferase. Liver stress marker.",
  idealTendency: "lower",
  dynamics: {
    setpoint: () => 25,
    tau: 10080,
    production: [],
    clearance: [],
    couplings: [],
  },
  initialValue: 25,
  display: {
    referenceRange: { min: 0, max: 40 },
  },
};
