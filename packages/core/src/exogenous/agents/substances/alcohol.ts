import type { PharmacologyDef } from "../../../engine";

// === Scientific Constants ===
const ETHANOL_DOSE = {
  GRAMS_PER_STANDARD_UNIT: 12,
} as const;

const ETHANOL_DISTRIBUTION = {
  WIDMARK_R_MALE: 0.68,
  WIDMARK_R_FEMALE: 0.55,
} as const;

const ETHANOL_KINETICS = {
  VMAX_DEFAULT: 0.2,
  KM_MGDL: 10,
} as const;

const ETHANOL_GABA = {
  AMPLITUDE: 25.0,
} as const;

const ETHANOL_GLUTAMATE = {
  SUPPRESSION_AMPLITUDE: 15.0,
} as const;

/**
 * ALCOHOL (Ethanol)
 * Michaelis-Menten kinetics and biphasic neuro-modulatory effects.
 */
export const Alcohol = (units: number): PharmacologyDef => {
  const grams = units * ETHANOL_DOSE.GRAMS_PER_STANDARD_UNIT;
  
  return {
    molecule: { name: "Ethanol", molarMass: 46.07 },
    pk: {
      model: "michaelis-menten",
      delivery: "infusion",
      bioavailability: 1.0,
      Vmax: ETHANOL_KINETICS.VMAX_DEFAULT,
      Km: ETHANOL_KINETICS.KM_MGDL,
      volume: { 
        kind: "sex-adjusted", 
        male_L_kg: ETHANOL_DISTRIBUTION.WIDMARK_R_MALE, 
        female_L_kg: ETHANOL_DISTRIBUTION.WIDMARK_R_FEMALE 
      },
    },
    pd: [
      {
        target: "GABA_A",
        mechanism: "PAM",
        intrinsicEfficacy: units * (ETHANOL_GABA.AMPLITUDE / 15.0),
        unit: "fold-change",
      },
      {
        target: "ethanol",
        mechanism: "agonist",
        intrinsicEfficacy: grams * 10,
        unit: "mg/dL",
      },
      {
        target: "dopamine",
        mechanism: "agonist",
        intrinsicEfficacy: units * 3.3,
        unit: "nM",
        tau: 10,
      },
      {
        target: "NMDA",
        mechanism: "NAM",
        intrinsicEfficacy: units * (ETHANOL_GLUTAMATE.SUPPRESSION_AMPLITUDE / 100),
        unit: "fold-change",
      },
      {
        target: "vasopressin",
        mechanism: "antagonist",
        intrinsicEfficacy: units * 6.6,
        unit: "pg/mL",
      },
      {
        target: "cortisol",
        mechanism: "agonist",
        intrinsicEfficacy: units * 6.6,
        unit: "µg/dL",
      },
      {
        target: "inflammation",
        mechanism: "agonist",
        intrinsicEfficacy: units * 0.33,
        unit: "index",
      },
    ],
  };
};