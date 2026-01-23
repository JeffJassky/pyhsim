import type { PharmacologyDef } from "../../../engine";

// === Scientific Constants ===
const GLUCOSE_CONSTANTS = {
  APPEARANCE_AMPLITUDE: 2.0,
  FAST_ABSORPTION_TAU_MIN: 12,
  VD_L_KG: 0.2,
} as const;

const FOOD_CONSTANTS = {
  SEROTONIN_AMPLITUDE: 30.0,
  SEROTONIN_THRESHOLD_G: 60,
  GABA_AMPLITUDE: 25.0,
  GABA_CARB_WEIGHT: 0.01,
  GABA_FIBER_WEIGHT: 0.05,
  DOPAMINE_REWARD_AMPLITUDE: 20.0,
  DOPAMINE_SUGAR_WEIGHT: 0.004,
  DOPAMINE_FAT_WEIGHT: 0.003,
  LEPTIN_SATURATION_KCAL: 600,
  LEPTIN_AMPLITUDE: 3.0,
} as const;

/**
 * GLUCOSE
 * The primary fuel and insulin driver.
 */
export const Glucose = (
  amountGrams: number,
  context: {
    fatGrams?: number;
    fiberGrams?: number;
    sugarGrams?: number;
    glycemicIndex?: number;
  } = {},
): PharmacologyDef => {
  const fat = context.fatGrams ?? 0;
  const fiber = context.fiberGrams ?? 0;
  const sugar = context.sugarGrams ?? amountGrams * 0.5;
  const gi = context.glycemicIndex ?? 60;

  const giMultiplier = gi / 60;
  const baseHalfLife = GLUCOSE_CONSTANTS.FAST_ABSORPTION_TAU_MIN / giMultiplier;
  const slowingFactor = fat * 0.5 + fiber * 1.5;
  const halfLife = baseHalfLife + slowingFactor;

  const palatability = Math.min(1, sugar * FOOD_CONSTANTS.DOPAMINE_SUGAR_WEIGHT + fat * FOOD_CONSTANTS.DOPAMINE_FAT_WEIGHT);
  const carbSerotoninEffect = (amountGrams / (amountGrams + FOOD_CONSTANTS.SEROTONIN_THRESHOLD_G)) * FOOD_CONSTANTS.SEROTONIN_AMPLITUDE;
  const gabaSatiety = Math.min(1, amountGrams * FOOD_CONSTANTS.GABA_CARB_WEIGHT + fiber * FOOD_CONSTANTS.GABA_FIBER_WEIGHT);
  const kcalFromCarbs = amountGrams * 4;
  const leptinEffect = (kcalFromCarbs / (kcalFromCarbs + FOOD_CONSTANTS.LEPTIN_SATURATION_KCAL)) * FOOD_CONSTANTS.LEPTIN_AMPLITUDE;
  
  const sedationIntensity = (amountGrams / (amountGrams + 50)) * giMultiplier;
  const orexinSuppression = Math.min(15, sedationIntensity * 12);
  const norepinephrineSuppression = Math.min(100, sedationIntensity * 80);
  const cortisolSuppression = Math.min(5, sedationIntensity * 4);

  return {
    molecule: { name: "Glucose", molarMass: 180.16 },
    pk: {
      model: "1-compartment",
      delivery: "infusion",
      bioavailability: 1.0,
      halfLifeMin: halfLife,
      timeToPeakMin: halfLife * 0.6,
      volume: { kind: "weight", base_L_kg: GLUCOSE_CONSTANTS.VD_L_KG },
    },
    pd: [
      {
        target: "glucose",
        mechanism: "agonist",
        intrinsicEfficacy: amountGrams * GLUCOSE_CONSTANTS.APPEARANCE_AMPLITUDE * giMultiplier,
        unit: "mg/dL",
      },
      {
        target: "insulin",
        mechanism: "agonist",
        intrinsicEfficacy: amountGrams * 0.5 * giMultiplier,
        unit: "µIU/mL",
        tau: 45,
      },
      {
        target: "dopamine",
        mechanism: "agonist",
        intrinsicEfficacy: Math.min(FOOD_CONSTANTS.DOPAMINE_REWARD_AMPLITUDE, palatability * FOOD_CONSTANTS.DOPAMINE_REWARD_AMPLITUDE),
        unit: "nM",
        tau: 45,
      },
      {
        target: "serotonin",
        mechanism: "agonist",
        intrinsicEfficacy: carbSerotoninEffect,
        unit: "nM",
        tau: 150,
      },
      {
        target: "gaba",
        mechanism: "agonist",
        intrinsicEfficacy: gabaSatiety * FOOD_CONSTANTS.GABA_AMPLITUDE,
        unit: "nM",
        tau: 30,
      },
      {
        target: "leptin",
        mechanism: "agonist",
        intrinsicEfficacy: leptinEffect,
        unit: "ng/mL",
        tau: 180,
      },
      {
        target: "orexin",
        mechanism: "antagonist",
        intrinsicEfficacy: orexinSuppression,
        unit: "pg/mL",
        tau: 45,
      },
      {
        target: "norepi",
        mechanism: "antagonist",
        intrinsicEfficacy: norepinephrineSuppression,
        unit: "pg/mL",
        tau: 30,
      },
      {
        target: "cortisol",
        mechanism: "antagonist",
        intrinsicEfficacy: cortisolSuppression,
        unit: "µg/dL",
        tau: 60,
      }
    ],
  };
};
