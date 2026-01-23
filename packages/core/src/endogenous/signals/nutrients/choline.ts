import type { SignalDefinition } from "../../../engine";

export const choline: SignalDefinition = {
  key: "choline",
  label: "Choline",
  unit: "µmol/L",
  isPremium: true,
  description: "Acetylcholine precursor.",
  idealTendency: "mid",
  dynamics: {
    setpoint: () => 10,
    tau: 10080,
    production: [],
    clearance: [],
    couplings: [],
  },
  initialValue: 10,
  display: {
    referenceRange: { min: 7, max: 20 },
  },
};
