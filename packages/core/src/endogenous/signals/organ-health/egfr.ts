import type { SignalDefinition } from "../../../engine";

export const egfr: SignalDefinition = {
  key: "egfr",
  label: "eGFR",
  unit: "mL/min/1.73m²",
  isPremium: true,
  description: "Estimated Glomerular Filtration Rate. Kidney function marker.",
  idealTendency: "higher",
  dynamics: {
    setpoint: () => 100,
    tau: 10080,
    production: [],
    clearance: [],
    couplings: [],
  },
  initialValue: 100,
  display: {
    referenceRange: { min: 90, max: 120 },
  },
};
