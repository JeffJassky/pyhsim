import type { PharmacologyDef } from "../../../engine";

export const MDMA = (mg: number): PharmacologyDef => ({
  molecule: { name: "MDMA", molarMass: 193.25, logP: 2.28 },
  pk: {
    model: "1-compartment",
    delivery: "bolus",
    bioavailability: 0.75,
    halfLifeMin: 510,
    timeToPeakMin: 120,
    clearance: { hepatic: { baseCL_mL_min: 600, CYP: "CYP2D6" } },
    volume: { kind: "weight", base_L_kg: 5.0 },
  },
  pd: [
    {
      target: "SERT",
      mechanism: "antagonist",
      Ki: 610,
      intrinsicEfficacy: mg * 8.0,
      unit: "nM",
    },
  ],
});
