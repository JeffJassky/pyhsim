import type { PharmacologyDef } from "../../../engine";

export const VitaminD = (iu: number): PharmacologyDef => {
  const mcg = iu * 0.025;
  return {
    molecule: { name: "Cholecalciferol", molarMass: 384.64 },
    pk: {
      model: "1-compartment",
      delivery: "bolus",
      bioavailability: 0.8,
      halfLifeMin: 20160,
      timeToPeakMin: 720,
      volume: { kind: "weight", base_L_kg: 0.15 },
    },
    pd: [
      {
        target: "vitaminD3",
        mechanism: "agonist",
        intrinsicEfficacy: mcg * 0.5,
        unit: "ng/mL",
        tau: 1440,
      },
    ],
  };
};

export const BComplex = (
  b12_mcg: number = 500,
  folate_mcg: number = 400,
): PharmacologyDef => ({
  molecule: { name: "B-Complex", molarMass: 1355 },
  pk: {
    model: "1-compartment",
    delivery: "bolus",
    bioavailability: 0.5,
    halfLifeMin: 1440,
    timeToPeakMin: 240,
    volume: { kind: "tbw", fraction: 0.5 },
  },
  pd: [
    {
      target: "b12",
      mechanism: "agonist",
      intrinsicEfficacy: Math.min(200, b12_mcg * 0.2),
      unit: "pg/mL",
      tau: 360,
    },
    {
      target: "folate",
      mechanism: "agonist",
      intrinsicEfficacy: Math.min(8, folate_mcg * 0.01),
      unit: "ng/mL",
      tau: 360,
    },
  ],
});
