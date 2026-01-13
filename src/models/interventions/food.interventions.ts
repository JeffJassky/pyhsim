import type { InterventionDef } from "@/types";

export const FOOD_INTERVENTIONS: InterventionDef[] = [
  {
    key: "food",
    label: "Food",
    color: "#8fbf5f",
    icon: "🍽️",
    defaultDurationMin: 30,
    params: [
      {
        key: "carbSugar",
        label: "Sugar (g)",
        type: "slider",
        min: 0,
        max: 120,
        step: 5,
        default: 35,
      },
      {
        key: "carbStarch",
        label: "Starch (g)",
        type: "slider",
        min: 0,
        max: 150,
        step: 5,
        default: 40,
      },
      {
        key: "protein",
        label: "Protein (g)",
        type: "slider",
        min: 0,
        max: 80,
        step: 5,
        default: 30,
      },
      {
        key: "fat",
        label: "Fat (g)",
        type: "slider",
        min: 0,
        max: 70,
        step: 5,
        default: 20,
      },
      {
        key: "gi",
        label: "Glycemic index",
        type: "slider",
        min: 20,
        max: 100,
        step: 5,
        default: 60,
      },
    ],
    pharmacology: {
      molecule: { name: "Glucose", molarMass: 180.16 },
      pk: {
        model: "1-compartment",
        bioavailability: 1.0,
        halfLifeMin: 45,
        timeToPeakMin: 30,
        volume: { kind: "weight", base_L_kg: 0.2 },
      },
      pd: [
        {
          target: "glucose",
          mechanism: "agonist",
          effectGain: 100.0,
          EC50: 1000,
        },
        { target: "insulin", mechanism: "agonist", effectGain: 15.0, tau: 45 },
        {
          target: "ghrelin",
          mechanism: "antagonist",
          effectGain: 200.0,
          tau: 30,
        },
        { target: "leptin", mechanism: "agonist", effectGain: 5.0, tau: 120 },
        { target: "glp1", mechanism: "agonist", effectGain: 10.0, tau: 45 },
        { target: "dopamine", mechanism: "agonist", effectGain: 15.0, tau: 20 },
        {
          target: "serotonin",
          mechanism: "agonist",
          effectGain: 10.0,
          tau: 30,
        },
        // Added from old kernels
        {
          target: "gaba",
          mechanism: "agonist",
          effectGain: 15.0,
          tau: 30, // Gut fermentation / satiety calm
        },
        {
          target: "mtor",
          mechanism: "agonist",
          effectGain: 30.0,
          tau: 60, // Protein sensing
        }
      ],
    },
    group: "Food",
    categories: ["food"],
    goals: ["energy", "digestion", "longevity"],
  },
];