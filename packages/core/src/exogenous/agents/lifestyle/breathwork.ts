import type { PharmacologyDef } from "../../../engine";

export const Breathwork = (
  type: "calm" | "balance" | "activation",
  intensity: number = 1.0
): PharmacologyDef => {
  let vagal = 0.5 * intensity;
  let norepi = 0;
  let cortisol = 0;

  if (type === "calm") {
    vagal = 2.0 * intensity;
    norepi = -20 * intensity;
    cortisol = -5 * intensity;
  } else if (type === "balance") {
    vagal = 1.0 * intensity;
    norepi = -5 * intensity;
  } else if (type === "activation") {
    vagal = 0.2 * intensity;
    norepi = 150 * intensity;
    cortisol = 10 * intensity;
  }

  const pd: any[] = [
    {
      target: "vagal",
      mechanism: "agonist",
      intrinsicEfficacy: vagal,
      unit: "index",
      tau: 2,
    },
    {
      target: "norepi",
      mechanism: type === "activation" ? "agonist" : "antagonist",
      intrinsicEfficacy: Math.abs(norepi),
      unit: "pg/mL",
      tau: 2,
    },
    {
      target: "cortisol",
      mechanism: type === "activation" ? "agonist" : "antagonist",
      intrinsicEfficacy: Math.abs(cortisol),
      unit: "µg/dL",
      tau: 15,
    },
  ];

  if (type === "activation") {
    pd.push({
      target: "dopamine",
      mechanism: "agonist",
      intrinsicEfficacy: 15 * intensity,
      unit: "nM",
      tau: 5,
    });
  }

  return {
    molecule: { name: "Breathwork", molarMass: 0 },
    pk: { model: "activity-dependent", delivery: "continuous" },
    pd,
  };
};
