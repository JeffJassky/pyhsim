import type { PharmacologyDef } from "../../../engine";

// === Scientific Constants ===
const CAFFEINE_KI_A2A = 2400;
const CAFFEINE_KI_A1 = 12000;
const CAFFEINE_HALFLIFE = 300;

export const Caffeine = (mg: number): PharmacologyDef => ({
  molecule: { name: "Caffeine", molarMass: 194.19, logP: -0.07 },
  pk: {
    model: "1-compartment",
    delivery: "bolus",
    bioavailability: 0.99,
    halfLifeMin: CAFFEINE_HALFLIFE,
    clearance: { hepatic: { baseCL_mL_min: 155, CYP: "CYP1A2" } },
    volume: { kind: "tbw", fraction: 0.6 },
  },
  pd: [
    {
      target: "Adenosine_A2a",
      mechanism: "antagonist",
      Ki: CAFFEINE_KI_A2A,
      intrinsicEfficacy: mg * 0.4,
      unit: "nM",
      description: "Blocks adenosine from binding, preventing the sleep pressure signal.",
    },
    {
      target: "Adenosine_A1",
      mechanism: "antagonist",
      Ki: CAFFEINE_KI_A1,
      intrinsicEfficacy: mg * 0.2,
      unit: "nM",
    },
    {
      target: "cortisol",
      mechanism: "agonist",
      EC50: 25000,
      intrinsicEfficacy: mg * 0.08,
      unit: "µg/dL",
    },
    {
      target: "adrenaline",
      mechanism: "agonist",
      EC50: 30000,
      intrinsicEfficacy: mg * 0.12,
      unit: "pg/mL",
    },
    {
      target: "norepi",
      mechanism: "agonist",
      EC50: 30000,
      intrinsicEfficacy: mg * 0.9375,
      unit: "pg/mL",
    },
  ],
});
