import type { SignalDefinition } from "../../../engine";

export const shbg: SignalDefinition = {
  key: "shbg",
  label: "SHBG",
  unit: "nmol/L",
  isPremium: true,
  description: "Sex Hormone Binding Globulin.",
  idealTendency: "mid",
  dynamics: {
    setpoint: () => 40,
    tau: 10080,
    production: [],
    clearance: [],
    couplings: [],
  },
  initialValue: 40,
  display: {
    referenceRange: { min: 20, max: 100 },
  },
};
