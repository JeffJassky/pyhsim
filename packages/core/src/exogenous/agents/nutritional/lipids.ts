import type { PharmacologyDef } from "../../../engine";

/**
 * LIPIDS (Fat)
 * Satiety signal and caloric density.
 */
export const Lipids = (amountGrams: number): PharmacologyDef => {
  const kcalFromFat = amountGrams * 9;
  const leptinEffect = (kcalFromFat / (kcalFromFat + 400)) * 4.0;
  const vagalEffect = Math.min(0.5, amountGrams * 0.015);
  const achEffect = Math.min(15, amountGrams * 0.4);
  const endocannabinoidEffect = Math.min(8, amountGrams * 0.25);

  const fatSedation = amountGrams / (amountGrams + 40);
  const orexinSuppression = Math.min(10, fatSedation * 8);
  const norepinephrineSuppression = Math.min(80, fatSedation * 60);
  const cortisolSuppression = Math.min(4, fatSedation * 3);

  const tefKcal = kcalFromFat * 0.03;
  const thyroidEffect = Math.min(0.08, (tefKcal / 100) * 0.05);

  return {
    molecule: { name: "Lipids", molarMass: 282 },
    pk: {
      model: "1-compartment",
      delivery: "infusion",
      halfLifeMin: 120,
      timeToPeakMin: 180,
      volume: { kind: "weight", base_L_kg: 0.3 },
    },
    pd: [
      {
        target: "ghrelin",
        mechanism: "antagonist",
        intrinsicEfficacy: amountGrams * 3.0,
        unit: "pg/mL",
        tau: 60,
        description: "Fat powerfully suppresses the hunger hormone.",
      },
      {
        target: "leptin",
        mechanism: "agonist",
        intrinsicEfficacy: leptinEffect,
        unit: "ng/mL",
        tau: 120,
        description: "Fat triggers strong fullness signaling.",
      },
      {
        target: "glp1",
        mechanism: "agonist",
        intrinsicEfficacy: amountGrams * 0.3,
        unit: "pmol/L",
        tau: 90,
        description: "Fat stimulates gut fullness hormones.",
      },
      {
        target: "vagal",
        mechanism: "agonist",
        intrinsicEfficacy: vagalEffect,
        unit: "index",
        tau: 45,
        description: "Activates the rest-and-digest nerve.",
      },
      {
        target: "acetylcholine",
        mechanism: "agonist",
        intrinsicEfficacy: achEffect,
        unit: "nM",
        tau: 30,
        description: "Parasympathetic signal for digestion.",
      },
      {
        target: "dopamine",
        mechanism: "agonist",
        intrinsicEfficacy: Math.min(8, amountGrams * 0.2),
        unit: "nM",
        tau: 25,
        description: "Rich foods light up reward circuits.",
      },
      {
        target: "oxytocin",
        mechanism: "agonist",
        intrinsicEfficacy: Math.min(3, amountGrams * 0.08),
        unit: "pg/mL",
        tau: 60,
        description: "Comfort foods trigger bonding hormones.",
      },
      {
        target: "endocannabinoid",
        mechanism: "agonist",
        intrinsicEfficacy: endocannabinoidEffect,
        unit: "nM",
        tau: 90,
        description: "Triggers body's natural bliss molecules.",
      },
      {
        target: "orexin",
        mechanism: "antagonist",
        intrinsicEfficacy: orexinSuppression,
        unit: "pg/mL",
        tau: 90,
        description: "Heavy meals suppress wakefulness signals.",
      },
      {
        target: "norepi",
        mechanism: "antagonist",
        intrinsicEfficacy: norepinephrineSuppression,
        unit: "pg/mL",
        tau: 60,
        description: "Alertness chemicals drop during digestion.",
      },
      {
        target: "cortisol",
        mechanism: "antagonist",
        intrinsicEfficacy: cortisolSuppression,
        unit: "µg/dL",
        tau: 90,
        description: "Comfort eating reduces cortisol.",
      },
      {
        target: "inflammation",
        mechanism: "agonist",
        intrinsicEfficacy: amountGrams * 0.05,
        unit: "index",
        tau: 120,
        description: "Temporary post-prandial inflammation.",
      },
      {
        target: "thyroid",
        mechanism: "agonist",
        intrinsicEfficacy: thyroidEffect,
        unit: "pmol/L",
        tau: 120,
        description: "Low metabolic cost to process fat.",
      },
    ],
  };
};
