import type { PharmacologyDef } from "../../../engine";

export const Ketamine = (
  mg: number,
  route: "intranasal" | "sublingual" | "iv" | "im" = "intranasal",
): PharmacologyDef => {
  const routeParams = {
    intranasal: { bioavail: 0.45, tPeak: 20, halfLife: 150 },
    sublingual: { bioavail: 0.3, tPeak: 30, halfLife: 155 },
    iv: { bioavail: 1.0, tPeak: 5, halfLife: 150 },
    im: { bioavail: 0.93, tPeak: 15, halfLife: 155 },
  };
  const params = routeParams[route];

  return {
    molecule: { name: "Ketamine", molarMass: 237.73, logP: 3.12 },
    pk: {
      model: "1-compartment",
      delivery: route === "iv" ? "infusion" : "bolus",
      bioavailability: params.bioavail,
      halfLifeMin: params.halfLife,
      timeToPeakMin: params.tPeak,
      clearance: { hepatic: { baseCL_mL_min: 1100, CYP: "CYP3A4" } },
      volume: { kind: "weight", base_L_kg: 3.0 },
    },
    pd: [
      {
        target: "NMDA",
        mechanism: "antagonist",
        Ki: 500,
        intrinsicEfficacy: mg * 0.004,
        unit: "µM",
        tau: 60,
      },
    ],
  };
};
