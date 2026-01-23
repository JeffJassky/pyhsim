import type { PharmacologyDef } from "../../../engine";

export const Sertraline = (mg: number): PharmacologyDef => ({
  molecule: { name: "Sertraline", molarMass: 306.23, logP: 5.29 },
  pk: {
    model: "1-compartment",
    delivery: "bolus",
    bioavailability: 0.44,
    halfLifeMin: 1560,
    timeToPeakMin: 360,
    clearance: { hepatic: { baseCL_mL_min: 450, CYP: "CYP2D6" } },
    volume: { kind: "weight", base_L_kg: 20 },
  },
  pd: [
    {
      target: "SERT",
      mechanism: "antagonist",
      Ki: 0.29,
      intrinsicEfficacy: mg * 0.4,
      unit: "nM",
    },
  ],
});

export const Fluoxetine = (mg: number): PharmacologyDef => ({
  molecule: { name: "Fluoxetine", molarMass: 309.33, logP: 4.05 },
  pk: {
    model: "1-compartment",
    delivery: "bolus",
    bioavailability: 0.72,
    halfLifeMin: 2880,
    timeToPeakMin: 480,
    clearance: { hepatic: { baseCL_mL_min: 600, CYP: "CYP2D6" } },
    volume: { kind: "weight", base_L_kg: 25 },
  },
  pd: [
    {
      target: "SERT",
      mechanism: "antagonist",
      Ki: 0.81,
      intrinsicEfficacy: mg * 0.35,
      unit: "nM",
    },
  ],
});

export const Escitalopram = (mg: number): PharmacologyDef => ({
  molecule: { name: "Escitalopram", molarMass: 324.39, logP: 3.5 },
  pk: {
    model: "1-compartment",
    delivery: "bolus",
    bioavailability: 0.8,
    halfLifeMin: 1800,
    timeToPeakMin: 300,
    clearance: { hepatic: { baseCL_mL_min: 600, CYP: "CYP2C19" } },
    volume: { kind: "weight", base_L_kg: 12 },
  },
  pd: [
    {
      target: "SERT",
      mechanism: "antagonist",
      Ki: 1.1,
      intrinsicEfficacy: mg * 0.8,
      unit: "nM",
    },
  ],
});

export const Venlafaxine = (mg: number): PharmacologyDef => ({
  molecule: { name: "Venlafaxine", molarMass: 277.4, logP: 2.74 },
  pk: {
    model: "1-compartment",
    delivery: "bolus",
    bioavailability: 0.45,
    halfLifeMin: 300,
    timeToPeakMin: 150,
    clearance: { hepatic: { baseCL_mL_min: 1350, CYP: "CYP2D6" } },
    volume: { kind: "weight", base_L_kg: 7.5 },
  },
  pd: [
    {
      target: "SERT",
      mechanism: "antagonist",
      Ki: 82,
      intrinsicEfficacy: mg * 0.25,
      unit: "nM",
    },
  ],
});

export const Duloxetine = (mg: number): PharmacologyDef => ({
  molecule: { name: "Duloxetine", molarMass: 297.42, logP: 4.72 },
  pk: {
    model: "1-compartment",
    delivery: "bolus",
    bioavailability: 0.5,
    halfLifeMin: 720,
    timeToPeakMin: 360,
    clearance: { hepatic: { baseCL_mL_min: 1000, CYP: "CYP1A2" } },
    volume: { kind: "weight", base_L_kg: 23 },
  },
  pd: [
    {
      target: "SERT",
      mechanism: "antagonist",
      Ki: 0.8,
      intrinsicEfficacy: mg * 0.4,
      unit: "nM",
    },
    {
      target: "NET",
      mechanism: "antagonist",
      Ki: 7.5,
      intrinsicEfficacy: mg * 0.35,
      unit: "nM",
    },
  ],
});

export const Bupropion = (mg: number): PharmacologyDef => ({
  molecule: { name: "Bupropion", molarMass: 239.74, logP: 3.21 },
  pk: {
    model: "1-compartment",
    delivery: "bolus",
    bioavailability: 0.87,
    halfLifeMin: 1260,
    timeToPeakMin: 180,
    clearance: { hepatic: { baseCL_mL_min: 200, CYP: "CYP2B6" } },
    volume: { kind: "weight", base_L_kg: 20 },
  },
  pd: [
    {
      target: "DAT",
      mechanism: "antagonist",
      Ki: 526,
      intrinsicEfficacy: mg * 0.15,
      unit: "nM",
    },
  ],
});
