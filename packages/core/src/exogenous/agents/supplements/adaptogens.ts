import type { PharmacologyDef } from "../../../engine";

export const Ashwagandha = (mg: number): PharmacologyDef => ({
  molecule: { name: "Withaferin A", molarMass: 470.6 },
  pk: {
    model: "1-compartment",
    delivery: "bolus",
    bioavailability: 0.5,
    halfLifeMin: 360,
    timeToPeakMin: 120,
    volume: { kind: "weight", base_L_kg: 0.5 },
  },
  pd: [
    {
      target: "cortisol",
      mechanism: "antagonist",
      intrinsicEfficacy: Math.min(8, mg * 0.012),
      unit: "µg/dL",
      tau: 120,
    },
  ],
});

export const Rhodiola = (mg: number): PharmacologyDef => ({
  molecule: { name: "Salidroside", molarMass: 300.3 },
  pk: {
    model: "1-compartment",
    delivery: "bolus",
    bioavailability: 0.3,
    halfLifeMin: 300,
    timeToPeakMin: 90,
    volume: { kind: "weight", base_L_kg: 0.5 },
  },
  pd: [
    {
      target: "cortisol",
      mechanism: "antagonist",
      intrinsicEfficacy: Math.min(6, mg * 0.012),
      unit: "µg/dL",
      tau: 90,
    },
  ],
});

export const LionsMane = (mg: number): PharmacologyDef => ({
  molecule: { name: "Hericenone", molarMass: 440 },
  pk: {
    model: "1-compartment",
    delivery: "bolus",
    bioavailability: 0.3,
    halfLifeMin: 480,
    timeToPeakMin: 180,
    volume: { kind: "weight", base_L_kg: 0.5 },
  },
  pd: [
    {
      target: "bdnf",
      mechanism: "agonist",
      intrinsicEfficacy: Math.min(15, mg * 0.01),
      unit: "ng/mL",
      tau: 720,
    },
  ],
});
