import type { PharmacologyDef } from "../../../engine";

// === Scientific Constants ===
const MAGNESIUM_KI_NMDA = 1000000;
const MAGNESIUM_KI_GABA = 500000;
const MAGNESIUM_HALFLIFE = 720;

export const Magnesium = (mg: number): PharmacologyDef => {
  const nmdaAntagonism = Math.min(0.3, mg * 0.0008);
  const gabaSupport = Math.min(20, mg * 0.05);
  const cortisolReduction = Math.min(3, mg * 0.008);
  const sleepSupport = Math.min(8, mg * 0.02);
  const muscleRelaxation = Math.min(0.3, mg * 0.0008);

  return {
    molecule: { name: "Magnesium", molarMass: 24.31 },
    pk: {
      model: "1-compartment",
      delivery: "bolus",
      bioavailability: 0.4,
      halfLifeMin: MAGNESIUM_HALFLIFE,
      timeToPeakMin: 180,
      volume: { kind: "weight", base_L_kg: 0.3 },
    },
    pd: [
      {
        target: "NMDA",
        mechanism: "antagonist",
        Ki: MAGNESIUM_KI_NMDA,
        intrinsicEfficacy: nmdaAntagonism,
        unit: "µM",
        tau: 120,
      },
      {
        target: "GABA_A",
        mechanism: "PAM",
        Ki: MAGNESIUM_KI_GABA,
        intrinsicEfficacy: gabaSupport,
        unit: "nM",
        tau: 90,
      },
      {
        target: "cortisol",
        mechanism: "antagonist",
        intrinsicEfficacy: cortisolReduction,
        unit: "µg/dL",
        tau: 180,
      },
      {
        target: "melatonin",
        mechanism: "agonist",
        intrinsicEfficacy: sleepSupport,
        unit: "pg/mL",
        tau: 240,
      },
      {
        target: "vagal",
        mechanism: "agonist",
        intrinsicEfficacy: muscleRelaxation,
        unit: "index",
        tau: 120,
      },
      {
        target: "insulin",
        mechanism: "agonist",
        intrinsicEfficacy: Math.min(2, mg * 0.005),
        unit: "µIU/mL",
        tau: 240,
      },
    ],
  };
};
