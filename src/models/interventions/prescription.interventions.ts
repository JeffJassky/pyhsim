import type { InterventionDef } from "@/types";

export const PRESCRIPTION_INTERVENTIONS: InterventionDef[] = [
  {
    key: "ritalinIR10",
    label: "Ritalin IR",
    color: "#f472b6",
    icon: "💊",
    defaultDurationMin: 240,
    params: [
      {
        key: "mg",
        label: "Dose (mg)",
        type: "slider",
        min: 0,
        max: 40,
        step: 5,
        default: 10,
      },
    ],
    pharmacology: {
      molecule: { name: "Methylphenidate", molarMass: 233.31, logP: 2.15 },
      pk: {
        model: "1-compartment",
        bioavailability: 0.3,
        halfLifeMin: 180,
        clearance: { hepatic: { baseCL_mL_min: 600, CYP: "CES1" } },
        volume: { kind: "lbm", base_L_kg: 2.0 },
      },
      pd: [
        { target: "DAT", mechanism: "antagonist", Ki: 0.01, effectGain: 30.0 },
        { target: "NET", mechanism: "antagonist", Ki: 0.05, effectGain: 20.0 },
        {
          target: "cortisol",
          mechanism: "agonist",
          EC50: 0.2,
          effectGain: 5.0,
        },
        { target: "SERT", mechanism: "antagonist", Ki: 0.5, effectGain: 3.0 },
      ],
    },
    group: "Stimulants",
    categories: ["medications"],
    goals: ["focus", "energy"],
  },
];