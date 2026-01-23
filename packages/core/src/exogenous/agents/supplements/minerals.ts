import type { PharmacologyDef } from "../../../engine";

export const Zinc = (mg: number): PharmacologyDef => ({
  molecule: { name: "Zinc", molarMass: 65.38 },
  pk: {
    model: "1-compartment",
    delivery: "bolus",
    bioavailability: 0.3,
    halfLifeMin: 720,
    timeToPeakMin: 180,
    volume: { kind: "weight", base_L_kg: 0.5 },
  },
  pd: [
    {
      target: "zinc",
      mechanism: "agonist",
      intrinsicEfficacy: Math.min(25, mg * 0.8),
      unit: "µg/dL",
      tau: 120,
    },
  ],
});

export const Copper = (mg: number): PharmacologyDef => ({
  molecule: { name: "Copper", molarMass: 63.55 },
  pk: {
    model: "1-compartment",
    delivery: "bolus",
    bioavailability: 0.5,
    halfLifeMin: 1440,
    timeToPeakMin: 240,
    volume: { kind: "weight", base_L_kg: 0.1 },
  },
  pd: [
    {
      target: "copper",
      mechanism: "agonist",
      intrinsicEfficacy: Math.min(20, mg * 15),
      unit: "µg/dL",
      tau: 180,
    },
  ],
});

export const Chromium = (mcg: number): PharmacologyDef => ({
  molecule: { name: "Chromium Picolinate", molarMass: 418.33 },
  pk: {
    model: "1-compartment",
    delivery: "bolus",
    bioavailability: 0.02,
    halfLifeMin: 2880,
    timeToPeakMin: 120,
    volume: { kind: "weight", base_L_kg: 0.2 },
  },
  pd: [
    {
      target: "chromium",
      mechanism: "agonist",
      intrinsicEfficacy: Math.min(0.3, mcg * 0.0005),
      unit: "index",
      tau: 480,
    },
  ],
});
