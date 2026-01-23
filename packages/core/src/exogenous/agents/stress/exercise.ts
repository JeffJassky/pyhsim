import type { PharmacologyDef } from "../../../engine";

// === Scientific Constants ===
const EXERCISE_NOREPI = { AMPLITUDE: 45.0 } as const;
const EXERCISE_ADRENALINE = { AMPLITUDE: 200.0 } as const;
const EXERCISE_CORTISOL = { AMPLITUDE: 10.0 } as const;
const EXERCISE_GLUCOSE = { UPTAKE_AMPLITUDE: -15.0 } as const;
const EXERCISE_BDNF = { AMPLITUDE: 25.0 } as const;
const EXERCISE_GH = { AMPLITUDE: 8.0 } as const;

export const SympatheticStress = (intensity: number): PharmacologyDef => ({
  molecule: { name: "Sympathetic Drive", molarMass: 0 },
  pk: { model: "activity-dependent", delivery: "continuous" },
  pd: [
    {
      target: "norepi",
      mechanism: "agonist",
      intrinsicEfficacy: EXERCISE_NOREPI.AMPLITUDE * intensity * 6.6,
      unit: "pg/mL",
      tau: 5,
    },
    {
      target: "adrenaline",
      mechanism: "agonist",
      intrinsicEfficacy: EXERCISE_ADRENALINE.AMPLITUDE * intensity,
      unit: "pg/mL",
      tau: 2,
    },
    {
      target: "cortisol",
      mechanism: "agonist",
      intrinsicEfficacy: EXERCISE_CORTISOL.AMPLITUDE * intensity,
      unit: "µg/dL",
      tau: 15,
    },
  ],
});

export const MetabolicLoad = (intensity: number): PharmacologyDef => ({
  molecule: { name: "Metabolic Load", molarMass: 0 },
  pk: { model: "activity-dependent", delivery: "continuous" },
  pd: [
    {
      target: "ampk",
      mechanism: "agonist",
      intrinsicEfficacy: 20 * intensity,
      unit: "fold-change",
      tau: 10,
    },
    {
      target: "glucose",
      mechanism: "antagonist",
      intrinsicEfficacy: Math.abs(EXERCISE_GLUCOSE.UPTAKE_AMPLITUDE) * intensity,
      unit: "mg/dL",
      tau: 5,
    },
    {
      target: "bdnf",
      mechanism: "agonist",
      intrinsicEfficacy: EXERCISE_BDNF.AMPLITUDE * intensity,
      unit: "ng/mL",
      tau: 30,
    },
  ],
});

export const MechanicalLoad = (intensity: number): PharmacologyDef => ({
  molecule: { name: "Mechanical Load", molarMass: 0 },
  pk: { model: "activity-dependent", delivery: "continuous" },
  pd: [
    {
      target: "mtor",
      mechanism: "agonist",
      intrinsicEfficacy: 15 * intensity, 
      unit: "fold-change",
      tau: 120,
    },
    {
      target: "testosterone",
      mechanism: "agonist",
      intrinsicEfficacy: 5 * intensity,
      unit: "ng/dL",
      tau: 60,
    },
    {
      target: "growthHormone",
      mechanism: "agonist",
      intrinsicEfficacy: EXERCISE_GH.AMPLITUDE * intensity,
      unit: "ng/mL",
      tau: 30,
    },
    {
      target: "inflammation",
      mechanism: "agonist",
      intrinsicEfficacy: 0.5 * intensity,
      unit: "index",
      tau: 240,
    },
  ],
});
