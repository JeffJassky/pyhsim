import type { PharmacologyDef } from "../../../engine";

export const SocialMedia = (
  type: "entertainment" | "doomscrolling",
  durationMin: number
): PharmacologyDef => ({
  molecule: { name: "Social Media", molarMass: 0 },
  pk: { model: "activity-dependent", delivery: "continuous" },
  pd: [
    {
      target: "dopamine",
      mechanism: "agonist",
      intrinsicEfficacy: type === "entertainment" ? 15 : 25,
      unit: "nM",
      tau: 5,
    },
    {
      target: "cortisol",
      mechanism: "agonist",
      intrinsicEfficacy: type === "doomscrolling" ? 8.0 : 2.0,
      unit: "µg/dL",
      tau: 10,
    },
    {
      target: "orexin",
      mechanism: "agonist",
      intrinsicEfficacy: 10,
      unit: "pg/mL",
      tau: 5,
    },
    {
      target: "serotonin",
      mechanism: "antagonist",
      intrinsicEfficacy: type === "doomscrolling" ? 5 : 0,
      unit: "nM",
      tau: 20,
    },
  ],
});
