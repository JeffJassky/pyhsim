import type { SignalDefinition } from "../../../engine";

export const ferritin: SignalDefinition = {
  key: "ferritin",
  label: "Ferritin",
  unit: "ng/mL",
  isPremium: true,
  description:
    "A measure of your body's stored iron. Adequate ferritin is essential for producing healthy red blood cells and ensuring your brain and muscles have enough oxygen to function properly.",
  idealTendency: "mid",
  dynamics: {
    setpoint: () => 50,
    tau: 10080,
    production: [],
    clearance: [],
    couplings: [],
  },
  initialValue: 50,
  display: {
    referenceRange: { min: 30, max: 300 },
  },
};
