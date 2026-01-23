import type { PharmacologyDef } from "../../../engine";

export const THCInhaled = (mg: number): PharmacologyDef => ({
  molecule: { name: "THC (inhaled)", molarMass: 314.47, logP: 6.97 },
  pk: {
    model: "2-compartment",
    delivery: "bolus",
    bioavailability: 0.25,
    halfLifeMin: 120,
    timeToPeakMin: 8,
    clearance: { hepatic: { baseCL_mL_min: 950, CYP: "CYP2C9" } },
    volume: { kind: "weight", base_L_kg: 3.4 },
  },
  pd: [
    {
      target: "CB1",
      mechanism: "agonist",
      Ki: 10,
      intrinsicEfficacy: mg * 12.0,
      unit: "nM",
      tau: 90,
    },
  ],
});

export const THCOral = (mg: number): PharmacologyDef => ({
  molecule: { name: "THC (oral)", molarMass: 314.47, logP: 6.97 },
  pk: {
    model: "2-compartment",
    delivery: "bolus",
    bioavailability: 0.08,
    halfLifeMin: 300,
    timeToPeakMin: 120,
    clearance: { hepatic: { baseCL_mL_min: 950, CYP: "CYP2C9" } },
    volume: { kind: "weight", base_L_kg: 3.4 },
  },
  pd: [
    {
      target: "CB1",
      mechanism: "agonist",
      Ki: 5,
      intrinsicEfficacy: mg * 18.0,
      unit: "nM",
      tau: 240,
    },
  ],
});
