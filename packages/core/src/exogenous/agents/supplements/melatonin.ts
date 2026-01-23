import type { PharmacologyDef } from "../../../engine";

// === Scientific Constants ===
const MELATONIN_KI_MT1 = 0.08;
const MELATONIN_KI_MT2 = 0.23;
const MELATONIN_HALFLIFE = 45;

export const Melatonin = (mg: number): PharmacologyDef => ({
  molecule: { name: "Melatonin", molarMass: 232.28 },
  pk: {
    model: "1-compartment",
    delivery: "bolus",
    bioavailability: 0.15,
    halfLifeMin: MELATONIN_HALFLIFE,
    clearance: { hepatic: { baseCL_mL_min: 1200, CYP: "CYP1A2" } },
    volume: { kind: "weight", base_L_kg: 1.0 },
  },
  pd: [
    {
      target: "MT1",
      mechanism: "agonist",
      Ki: MELATONIN_KI_MT1,
      intrinsicEfficacy: mg * 8.33,
      unit: "pg/mL",
    },
    {
      target: "MT2",
      mechanism: "agonist",
      Ki: MELATONIN_KI_MT2,
      intrinsicEfficacy: mg * 6.66,
      unit: "pg/mL",
    },
    {
      target: "orexin",
      mechanism: "antagonist",
      EC50: 50,
      intrinsicEfficacy: mg * 3.33,
      unit: "pg/mL",
    },
    {
      target: "cortisol",
      mechanism: "antagonist",
      EC50: 100,
      intrinsicEfficacy: mg * 1.66,
      unit: "µg/dL",
    },
    {
      target: "GABA_A",
      mechanism: "PAM",
      EC50: 200,
      intrinsicEfficacy: mg * 16.0,
      unit: "nM",
    },
  ],
});
