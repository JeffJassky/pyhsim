import type { SignalDefinition } from "../../../engine";

export const chromium: SignalDefinition = {
  key: "chromium",
  label: "Chromium",
  unit: "index",
  isPremium: true,
  description: "Blood sugar management.",
  idealTendency: "mid",
  dynamics: {
    setpoint: () => 1.0,
    tau: 10080,
    production: [],
    clearance: [],
    couplings: [],
  },
  initialValue: 1.0,
  display: {
    referenceRange: { min: 0.5, max: 1.5 },
  },
};
