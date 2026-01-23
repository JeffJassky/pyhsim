import type { PharmacologyDef } from "../../../engine";

export const AlphaGPC = (mg: number): PharmacologyDef => {
  const aceCholineEffect = Math.min(25, mg * 0.04);
  const ghPotentiation = Math.min(3, mg * 0.005);
  const vagalSupport = Math.min(0.2, mg * 0.0003);

  return {
    molecule: { name: "Alpha-GPC", molarMass: 257.22 },
    pk: {
      model: "1-compartment",
      delivery: "bolus",
      bioavailability: 0.88,
      halfLifeMin: 240,
      timeToPeakMin: 60,
      volume: { kind: "tbw", fraction: 0.5 },
    },
    pd: [
      {
        target: "acetylcholine",
        mechanism: "agonist",
        intrinsicEfficacy: aceCholineEffect,
        unit: "nM",
        tau: 45,
      },
      {
        target: "growthHormone",
        mechanism: "agonist",
        intrinsicEfficacy: ghPotentiation,
        unit: "ng/mL",
        tau: 90,
      },
      {
        target: "vagal",
        mechanism: "agonist",
        intrinsicEfficacy: vagalSupport,
        unit: "index",
        tau: 60,
      },
      {
        target: "orexin",
        mechanism: "agonist",
        intrinsicEfficacy: Math.min(3, mg * 0.005),
        unit: "pg/mL",
        tau: 45,
      },
    ],
  };
};
