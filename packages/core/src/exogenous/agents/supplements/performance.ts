import type { PharmacologyDef } from "../../../engine";

export const Creatine = (grams: number): PharmacologyDef => ({
  molecule: { name: "Creatine", molarMass: 131.13 },
  pk: {
    model: "1-compartment",
    delivery: "bolus",
    bioavailability: 0.95,
    halfLifeMin: 180,
    timeToPeakMin: 90,
    volume: { kind: "weight", base_L_kg: 0.5 },
  },
  pd: [
    {
      target: "energy",
      mechanism: "agonist",
      intrinsicEfficacy: Math.min(0.1, grams * 0.02),
      unit: "index",
      tau: 60,
    },
  ],
});

export const LCarnitine = (mg: number): PharmacologyDef => ({
  molecule: { name: "Acetyl-L-Carnitine", molarMass: 203.24 },
  pk: {
    model: "1-compartment",
    delivery: "bolus",
    bioavailability: 0.15,
    halfLifeMin: 240,
    timeToPeakMin: 180,
    volume: { kind: "weight", base_L_kg: 0.5 },
  },
  pd: [
    {
      target: "energy",
      mechanism: "agonist",
      intrinsicEfficacy: Math.min(0.15, mg * 0.0001),
      unit: "index",
      tau: 120,
    },
  ],
});

export const CDPCholine = (mg: number): PharmacologyDef => ({
  molecule: { name: "Citicoline", molarMass: 488.32 },
  pk: {
    model: "1-compartment",
    delivery: "bolus",
    bioavailability: 0.9,
    halfLifeMin: 360,
    timeToPeakMin: 60,
    volume: { kind: "tbw", fraction: 0.5 },
  },
  pd: [
    {
      target: "choline",
      mechanism: "agonist",
      intrinsicEfficacy: Math.min(8, mg * 0.02),
      unit: "µmol/L",
      tau: 60,
    },
  ],
});
