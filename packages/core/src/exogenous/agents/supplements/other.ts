import type { PharmacologyDef } from "../../../engine";

export const Inositol = (mg: number): PharmacologyDef => ({
  molecule: { name: "Inositol", molarMass: 180.16 },
  pk: {
    model: "1-compartment",
    delivery: "bolus",
    bioavailability: 0.9,
    halfLifeMin: 240,
    timeToPeakMin: 120,
    volume: { kind: "tbw", fraction: 0.6 },
  },
  pd: [
    {
      target: "gaba",
      mechanism: "agonist",
      intrinsicEfficacy: Math.min(30, mg * 0.002),
      unit: "nM",
      tau: 90,
    },
  ],
});

export const DigestiveEnzymes = (units: number = 1): PharmacologyDef => ({
  molecule: { name: "Digestive Enzymes", molarMass: 0 },
  pk: { model: "activity-dependent", delivery: "continuous" },
  pd: [
    {
      target: "glp1",
      mechanism: "agonist",
      intrinsicEfficacy: units * 3,
      unit: "pmol/L",
      tau: 30,
    },
  ],
});
