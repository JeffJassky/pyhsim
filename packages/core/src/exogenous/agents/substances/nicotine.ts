import type { PharmacologyDef } from "../../../engine";

export const Nicotine = (
  mg: number,
  delivery: "smoked" | "vaped" | "gum" | "patch" | "pouch"
): PharmacologyDef => {
  let pkModel: any = {
    model: "1-compartment",
    delivery: "bolus",
    bioavailability: 0.0,
    halfLifeMin: 120,
    timeToPeakMin: 0,
    volume: { kind: "weight", base_L_kg: 2.6 },
  };

  switch (delivery) {
    case "smoked":
      pkModel.bioavailability = 0.8;
      pkModel.timeToPeakMin = 2;
      break;
    case "vaped":
      pkModel.bioavailability = 0.6;
      pkModel.timeToPeakMin = 5;
      break;
    case "gum":
      pkModel.bioavailability = 0.5;
      pkModel.timeToPeakMin = 30;
      break;
    case "pouch":
      pkModel.bioavailability = 0.6;
      pkModel.timeToPeakMin = 20;
      break;
    case "patch":
      pkModel.delivery = "infusion";
      pkModel.bioavailability = 0.7;
      pkModel.timeToPeakMin = 120;
      break;
  }

  return {
    molecule: { name: "Nicotine", molarMass: 162.23 },
    pk: pkModel,
    pd: [
      {
        target: "acetylcholine",
        mechanism: "agonist",
        intrinsicEfficacy: mg * 15.0,
        unit: "nM",
        tau: 10,
      },
      {
        target: "dopamine",
        mechanism: "agonist",
        intrinsicEfficacy: mg * 5.0,
        unit: "nM",
        tau: 15,
      },
      {
        target: "norepi",
        mechanism: "agonist",
        intrinsicEfficacy: mg * 8.0,
        unit: "pg/mL",
        tau: 15,
      },
      {
        target: "cortisol",
        mechanism: "agonist",
        intrinsicEfficacy: mg * 1.5,
        unit: "µg/dL",
        tau: 20,
      },
      {
        target: "endorphin",
        mechanism: "agonist",
        intrinsicEfficacy: mg * 2.0,
        unit: "index",
        tau: 15,
      },
    ],
  };
};
