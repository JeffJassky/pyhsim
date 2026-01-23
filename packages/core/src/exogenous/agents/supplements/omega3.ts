import type { PharmacologyDef } from "../../../engine";

export const Omega3 = (mg: number): PharmacologyDef => {
  const antiInflammatory = Math.min(0.4, mg * 0.0002);
  const bdnfSupport = Math.min(8, mg * 0.004);
  const serotoninSupport = Math.min(3, mg * 0.0015);
  const dopamineSupport = Math.min(2, mg * 0.001);
  const cortisolModulation = Math.min(2, mg * 0.001);

  return {
    molecule: { name: "EPA/DHA", molarMass: 330 },
    pk: {
      model: "1-compartment",
      delivery: "bolus",
      bioavailability: 0.7,
      halfLifeMin: 2880,
      timeToPeakMin: 360,
      volume: { kind: "weight", base_L_kg: 0.2 },
    },
    pd: [
      {
        target: "inflammation",
        mechanism: "antagonist",
        intrinsicEfficacy: antiInflammatory,
        unit: "index",
        tau: 1440,
      },
      {
        target: "bdnf",
        mechanism: "agonist",
        intrinsicEfficacy: bdnfSupport,
        unit: "ng/mL",
        tau: 720,
      },
      {
        target: "serotonin",
        mechanism: "agonist",
        intrinsicEfficacy: serotoninSupport,
        unit: "nM",
        tau: 480,
      },
      {
        target: "dopamine",
        mechanism: "agonist",
        intrinsicEfficacy: dopamineSupport,
        unit: "nM",
        tau: 480,
      },
      {
        target: "cortisol",
        mechanism: "antagonist",
        intrinsicEfficacy: cortisolModulation,
        unit: "µg/dL",
        tau: 720,
      },
    ],
  };
};
