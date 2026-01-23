import type { PharmacologyDef } from "../../../engine";

export const SunlightExposure = (
  lux: number,
  timeOfDay: "sunrise" | "midday" | "sunset" = "midday"
): PharmacologyDef => {
  const intensity = Math.min(1.5, Math.log10(lux + 1) / 4);

  let melatoninSuppression = 0;
  let cortisolPulse = 0;
  let serotoninBoost = 0;

  if (timeOfDay === "sunrise") {
    melatoninSuppression = 100 * intensity;
    cortisolPulse = 15 * intensity;
    serotoninBoost = 20 * intensity;
  } else if (timeOfDay === "midday") {
    melatoninSuppression = 50 * intensity;
    serotoninBoost = 30 * intensity;
  } else if (timeOfDay === "sunset") {
    melatoninSuppression = 0;
    serotoninBoost = 10 * intensity;
  }

  return {
    molecule: { name: "Photons", molarMass: 0 },
    pk: { model: "activity-dependent", delivery: "continuous" },
    pd: [
      {
        target: "melatonin",
        mechanism: "antagonist",
        intrinsicEfficacy: melatoninSuppression,
        unit: "pg/mL",
        tau: 5,
      },
      {
        target: "cortisol",
        mechanism: "agonist",
        intrinsicEfficacy: cortisolPulse,
        unit: "µg/dL",
        tau: 15,
      },
      {
        target: "serotonin",
        mechanism: "agonist",
        intrinsicEfficacy: serotoninBoost,
        unit: "nM",
        tau: 10,
      },
      {
        target: "dopamine",
        mechanism: "agonist",
        intrinsicEfficacy: 5 * intensity,
        unit: "nM",
        tau: 10,
      },
    ],
  };
};
