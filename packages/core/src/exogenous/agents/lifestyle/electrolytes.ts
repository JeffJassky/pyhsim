import type { PharmacologyDef } from "../../../engine";

export const Electrolytes = (
  sodium_mg: number,
  potassium_mg: number,
  magnesium_mg: number
): PharmacologyDef => ({
  molecule: { name: "Electrolytes", molarMass: 0 },
  pk: {
    model: "1-compartment",
    delivery: "bolus",
    bioavailability: 0.9,
    halfLifeMin: 240,
    timeToPeakMin: 45,
    volume: { kind: "tbw", fraction: 1.0 },
  },
  pd: [
    {
      target: "bloodPressure",
      mechanism: "agonist",
      intrinsicEfficacy: sodium_mg * 0.005,
      unit: "mmHg",
      tau: 60,
    },
  ],
});
