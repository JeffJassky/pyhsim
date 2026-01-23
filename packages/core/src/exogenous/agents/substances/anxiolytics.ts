import type { PharmacologyDef } from "../../../engine";

export const Alprazolam = (mg: number): PharmacologyDef => ({
  molecule: { name: "Alprazolam", molarMass: 308.77, logP: 2.12 },
  pk: {
    model: "1-compartment",
    delivery: "bolus",
    bioavailability: 0.9,
    halfLifeMin: 660,
    timeToPeakMin: 60,
    clearance: { hepatic: { baseCL_mL_min: 75, CYP: "CYP3A4" } },
    volume: { kind: "weight", base_L_kg: 1.0 },
  },
  pd: [
    {
      target: "GABA_A",
      mechanism: "PAM",
      EC50: 20,
      intrinsicEfficacy: mg * 80,
      unit: "nM",
    },
  ],
});

export const Lorazepam = (mg: number): PharmacologyDef => ({
  molecule: { name: "Lorazepam", molarMass: 321.16, logP: 2.39 },
  pk: {
    model: "1-compartment",
    delivery: "bolus",
    bioavailability: 0.93,
    halfLifeMin: 720,
    timeToPeakMin: 120,
    clearance: { hepatic: { baseCL_mL_min: 80 } },
    volume: { kind: "weight", base_L_kg: 1.3 },
  },
  pd: [
    {
      target: "GABA_A",
      mechanism: "PAM",
      EC50: 25,
      intrinsicEfficacy: mg * 70,
      unit: "nM",
    },
  ],
});

export const Clonazepam = (mg: number): PharmacologyDef => ({
  molecule: { name: "Clonazepam", molarMass: 315.71, logP: 2.41 },
  pk: {
    model: "1-compartment",
    delivery: "bolus",
    bioavailability: 0.9,
    halfLifeMin: 2160,
    timeToPeakMin: 180,
    clearance: { hepatic: { baseCL_mL_min: 90, CYP: "CYP3A4" } },
    volume: { kind: "weight", base_L_kg: 3.2 },
  },
  pd: [
    {
      target: "GABA_A",
      mechanism: "PAM",
      EC50: 15,
      intrinsicEfficacy: mg * 100,
      unit: "nM",
    },
  ],
});

export const Buspirone = (mg: number): PharmacologyDef => ({
  molecule: { name: "Buspirone", molarMass: 385.5, logP: 1.74 },
  pk: {
    model: "1-compartment",
    delivery: "bolus",
    bioavailability: 0.04,
    halfLifeMin: 150,
    timeToPeakMin: 60,
    clearance: { hepatic: { baseCL_mL_min: 1700, CYP: "CYP3A4" } },
    volume: { kind: "weight", base_L_kg: 5.3 },
  },
  pd: [
    {
      target: "serotonin",
      mechanism: "agonist",
      intrinsicEfficacy: mg * 0.3,
      unit: "nM",
      tau: 30,
    },
  ],
});

export const Hydroxyzine = (mg: number): PharmacologyDef => ({
  molecule: { name: "Hydroxyzine", molarMass: 374.91, logP: 2.36 },
  pk: {
    model: "1-compartment",
    delivery: "bolus",
    bioavailability: 0.8,
    halfLifeMin: 1200,
    timeToPeakMin: 120,
    clearance: { hepatic: { baseCL_mL_min: 600, CYP: "CYP3A4" } },
    volume: { kind: "weight", base_L_kg: 16 },
  },
  pd: [
    {
      target: "histamine",
      mechanism: "antagonist",
      Ki: 2,
      intrinsicEfficacy: mg * 0.8,
      unit: "nM",
    },
  ],
});
