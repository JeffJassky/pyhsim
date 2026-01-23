import type { PharmacologyDef } from "../../../engine";

export const LTheanine = (mg: number): PharmacologyDef => ({
  molecule: { name: "L-Theanine", molarMass: 174.2 },
  pk: {
    model: "1-compartment",
    delivery: "bolus",
    bioavailability: 0.95,
    halfLifeMin: 75,
    clearance: {
      renal: { baseCL_mL_min: 180 },
      hepatic: { baseCL_mL_min: 80 },
    },
    volume: { kind: "tbw", fraction: 0.5 },
  },
  pd: [
    {
      target: "GABA_A",
      mechanism: "PAM",
      EC50: 20.0,
      intrinsicEfficacy: mg * 0.36,
      unit: "nM",
    },
    {
      target: "NMDA",
      mechanism: "antagonist",
      Ki: 50.0,
      intrinsicEfficacy: mg * 0.0021,
      unit: "µM",
    },
  ],
});

export const LTyrosine = (mg: number): PharmacologyDef => ({
  molecule: { name: "L-Tyrosine", molarMass: 181.19 },
  pk: {
    model: "1-compartment",
    delivery: "bolus",
    bioavailability: 0.8,
    halfLifeMin: 150,
    timeToPeakMin: 60,
    volume: { kind: "tbw", fraction: 0.6 },
  },
  pd: [
    {
      target: "dopamine",
      mechanism: "agonist",
      intrinsicEfficacy: Math.min(8, mg * 0.008),
      unit: "nM",
      tau: 90,
    },
  ],
});

export const LDopa = (mg: number): PharmacologyDef => ({
  molecule: { name: "L-DOPA", molarMass: 197.19 },
  pk: {
    model: "1-compartment",
    delivery: "bolus",
    bioavailability: 0.4,
    halfLifeMin: 90,
    timeToPeakMin: 45,
    volume: { kind: "tbw", fraction: 0.6 },
  },
  pd: [
    {
      target: "dopamine",
      mechanism: "agonist",
      intrinsicEfficacy: Math.min(25, mg * 0.15),
      unit: "nM",
      tau: 30,
    },
  ],
});

export const P5P = (mg: number): PharmacologyDef => ({
  molecule: { name: "Pyridoxal-5-Phosphate", molarMass: 247.14 },
  pk: {
    model: "1-compartment",
    delivery: "bolus",
    bioavailability: 0.75,
    halfLifeMin: 300,
    timeToPeakMin: 120,
    volume: { kind: "tbw", fraction: 0.6 },
  },
  pd: [
    {
      target: "gaba",
      mechanism: "agonist",
      intrinsicEfficacy: Math.min(8, mg * 0.25),
      unit: "nM",
      tau: 90,
    },
  ],
});

export const FiveHTP = (mg: number): PharmacologyDef => ({
  molecule: { name: "5-Hydroxytryptophan", molarMass: 220.22 },
  pk: {
    model: "1-compartment",
    delivery: "bolus",
    bioavailability: 0.7,
    halfLifeMin: 120,
    timeToPeakMin: 45,
    volume: { kind: "tbw", fraction: 0.6 },
  },
  pd: [
    {
      target: "serotonin",
      mechanism: "agonist",
      intrinsicEfficacy: Math.min(30, mg * 0.25),
      unit: "nM",
      tau: 30,
    },
  ],
});
