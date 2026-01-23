import type { PharmacologyDef } from "../../../engine";

// === Scientific Constants ===
const METHYLPHENIDATE_KI_DAT = 34;
const METHYLPHENIDATE_KI_NET = 339;
const METHYLPHENIDATE_HALFLIFE = 180;

export const Methylphenidate = (mg: number): PharmacologyDef => ({
  molecule: { name: "Methylphenidate", molarMass: 233.31, logP: 2.15 },
  pk: {
    model: "1-compartment",
    delivery: "bolus",
    bioavailability: 0.3,
    halfLifeMin: METHYLPHENIDATE_HALFLIFE,
    clearance: { hepatic: { baseCL_mL_min: 600, CYP: "CES1" } },
    volume: { kind: "lbm", base_L_kg: 2.0 },
  },
  pd: [
    {
      target: "DAT",
      mechanism: "antagonist",
      Ki: METHYLPHENIDATE_KI_DAT,
      intrinsicEfficacy: mg * 3.0,
      unit: "nM",
    },
    {
      target: "NET",
      mechanism: "antagonist",
      Ki: METHYLPHENIDATE_KI_NET,
      intrinsicEfficacy: mg * 3.0,
      unit: "nM",
    },
    {
      target: "cortisol",
      mechanism: "agonist",
      EC50: 0.2,
      intrinsicEfficacy: mg * 0.5,
      unit: "µg/dL",
    },
  ],
});

export const Amphetamine = (mg: number): PharmacologyDef => ({
  molecule: { name: "Amphetamine", molarMass: 135.21, logP: 1.76 },
  pk: {
    model: "1-compartment",
    delivery: "bolus",
    bioavailability: 0.75,
    halfLifeMin: 600,
    timeToPeakMin: 180,
    clearance: { hepatic: { baseCL_mL_min: 300, CYP: "CYP2D6" } },
    volume: { kind: "lbm", base_L_kg: 3.5 },
  },
  pd: [
    {
      target: "DAT",
      mechanism: "antagonist",
      Ki: 25,
      intrinsicEfficacy: mg * 5.0,
      unit: "nM",
    },
    {
      target: "NET",
      mechanism: "antagonist",
      Ki: 40,
      intrinsicEfficacy: mg * 4.5,
      unit: "nM",
    },
    {
      target: "dopamine",
      mechanism: "agonist",
      intrinsicEfficacy: mg * 1.5,
      unit: "nM",
      tau: 15,
    },
  ],
});

export const Lisdexamfetamine = (mg: number): PharmacologyDef => ({
  molecule: { name: "Lisdexamfetamine", molarMass: 263.38, logP: -0.73 },
  pk: {
    model: "1-compartment",
    delivery: "bolus",
    bioavailability: 0.95,
    halfLifeMin: 720,
    timeToPeakMin: 240,
    volume: { kind: "lbm", base_L_kg: 3.5 },
  },
  pd: [
    {
      target: "DAT",
      mechanism: "antagonist",
      Ki: 25,
      intrinsicEfficacy: mg * 1.5,
      unit: "nM",
    },
    {
      target: "NET",
      mechanism: "antagonist",
      Ki: 40,
      intrinsicEfficacy: mg * 1.35,
      unit: "nM",
    },
  ],
});

export const MethylphenidateXR = (mg: number): PharmacologyDef => ({
  molecule: { name: "Methylphenidate XR", molarMass: 233.31, logP: 2.15 },
  pk: {
    model: "1-compartment",
    delivery: "bolus",
    bioavailability: 0.3,
    halfLifeMin: 420,
    timeToPeakMin: 360,
    clearance: { hepatic: { baseCL_mL_min: 600, CYP: "CES1" } },
    volume: { kind: "lbm", base_L_kg: 2.0 },
  },
  pd: [
    {
      target: "DAT",
      mechanism: "antagonist",
      Ki: METHYLPHENIDATE_KI_DAT,
      intrinsicEfficacy: mg * 2.5,
      unit: "nM",
    },
  ],
});

export const Guanfacine = (mg: number): PharmacologyDef => ({
  molecule: { name: "Guanfacine", molarMass: 246.09, logP: 1.52 },
  pk: {
    model: "1-compartment",
    delivery: "bolus",
    bioavailability: 0.8,
    halfLifeMin: 1020,
    timeToPeakMin: 300,
    clearance: { hepatic: { baseCL_mL_min: 150, CYP: "CYP3A4" } },
    volume: { kind: "weight", base_L_kg: 6.3 },
  },
  pd: [
    {
      target: "norepi",
      mechanism: "antagonist",
      intrinsicEfficacy: mg * 80,
      unit: "pg/mL",
      tau: 60,
    },
  ],
});
