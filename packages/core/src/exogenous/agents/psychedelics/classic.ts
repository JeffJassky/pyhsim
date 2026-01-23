import type { PharmacologyDef } from "../../../engine";

export const LSD = (mcg: number): PharmacologyDef => ({
  molecule: { name: "LSD", molarMass: 323.43, logP: 2.95 },
  pk: {
    model: "1-compartment",
    delivery: "bolus",
    bioavailability: 0.71,
    halfLifeMin: 210,
    timeToPeakMin: 90,
    clearance: { hepatic: { baseCL_mL_min: 650, CYP: "CYP3A4" } },
    volume: { kind: "weight", base_L_kg: 0.55 },
  },
  pd: [
    {
      target: "5HT2A",
      mechanism: "agonist",
      Ki: 1.1,
      intrinsicEfficacy: mcg * 0.8,
      unit: "nM",
      tau: 480,
    },
  ],
});

export const Psilocybin = (mg: number): PharmacologyDef => ({
  molecule: { name: "Psilocybin", molarMass: 284.25, logP: -0.19 },
  pk: {
    model: "1-compartment",
    delivery: "bolus",
    bioavailability: 0.52,
    halfLifeMin: 165,
    timeToPeakMin: 80,
    clearance: { hepatic: { baseCL_mL_min: 1200, CYP: "CYP2D6" } },
    volume: { kind: "weight", base_L_kg: 3.0 },
  },
  pd: [
    {
      target: "5HT2A",
      mechanism: "agonist",
      Ki: 6.0,
      intrinsicEfficacy: mg * 8.0,
      unit: "nM",
      tau: 240,
    },
  ],
});
