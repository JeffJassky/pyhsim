import type { SignalDefinition } from "../../../engine";

export const ast: SignalDefinition = {
  key: "ast",
  label: "AST",
  unit: "U/L",
  isPremium: true,
  description: "Aspartate Aminotransferase. Liver/muscle health marker.",
  idealTendency: "lower",
  dynamics: {
    setpoint: () => 22,
    tau: 10080,
    production: [],
    clearance: [],
    couplings: [],
  },
  initialValue: 22,
  display: {
    referenceRange: { min: 0, max: 40 },
  },
};
