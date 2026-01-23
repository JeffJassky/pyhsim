import type { SignalDefinition } from "../../../engine";

export const selenium: SignalDefinition = {
  key: "selenium",
  label: "Selenium",
  unit: "µg/L",
  isPremium: true,
  description: "Antioxidant mineral.",
  idealTendency: "mid",
  dynamics: {
    setpoint: () => 120,
    tau: 10080,
    production: [],
    clearance: [],
    couplings: [],
  },
  initialValue: 120,
  display: {
    referenceRange: { min: 70, max: 150 },
  },
};
