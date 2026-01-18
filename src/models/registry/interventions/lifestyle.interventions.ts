import type { InterventionDef } from "@/types";
import { Agents } from "../../physiology/agents";

export const LIFESTYLE_INTERVENTIONS: InterventionDef[] = [
  {
    key: "wake",
    label: "Wake Up",

    icon: "🌅",
    defaultDurationMin: 60,
    params: [],
    pharmacology: {
      molecule: { name: "Wake", molarMass: 0 },
      pk: { model: "activity-dependent" },
      pd: [
        {
          target: "cortisol",
          mechanism: "agonist",
          intrinsicEfficacy: 8.0,
          unit: "µg/dL",
          tau: 30, // CAR duration approximation
        },
        {
          target: "dopamine",
          mechanism: "agonist",
          intrinsicEfficacy: 6.0, // 30 * 0.2
          unit: "nM",
          tau: 10,
        },
        {
          target: "melatonin",
          mechanism: "antagonist",
          intrinsicEfficacy: 40.0,
          unit: "pg/mL",
          tau: 20,
        },
        {
          target: "gaba",
          mechanism: "antagonist",
          intrinsicEfficacy: 150.0, // 25 * 6.0
          unit: "nM",
          tau: 45,
        },
        {
          target: "orexin",
          mechanism: "agonist",
          intrinsicEfficacy: 20.0,
          unit: "pg/mL",
          tau: 15,
        },
        {
          target: "acetylcholine",
          mechanism: "agonist",
          intrinsicEfficacy: 3.75, // 15 * 0.25
          unit: "nM",
          tau: 15,
        },
      ],
    },
    group: "Routine",
    categories: ["environment"],
    goals: ["energy", "focus"],
  },
  {
    key: "sleep",
    label: "Sleep",

    icon: "🌙",
    defaultDurationMin: 480,
    params: [],
    pharmacology: {
      molecule: { name: "Sleep", molarMass: 0 },
      pk: { model: "activity-dependent" },
      pd: [
        {
          target: "melatonin",
          mechanism: "agonist",
          intrinsicEfficacy: 80.0,
          unit: "pg/mL",
          tau: 10,
        },
        {
          target: "gaba",
          mechanism: "agonist",
          intrinsicEfficacy: 240.0,
          unit: "nM",
          tau: 10,
        }, // 40 * 6
        {
          target: "histamine",
          mechanism: "antagonist",
          intrinsicEfficacy: 15.0, // 30 * 0.5
          unit: "nM",
          tau: 15,
        },
        {
          target: "orexin",
          mechanism: "antagonist",
          intrinsicEfficacy: 35.0,
          unit: "pg/mL",
          tau: 15,
        },
        {
          target: "adenosinePressure",
          mechanism: "antagonist",
          intrinsicEfficacy: 0.08,
          unit: "index",
          tau: 60,
        },
        {
          target: "growthHormone",
          mechanism: "agonist",
          intrinsicEfficacy: 8.0,
          unit: "ng/mL",
          tau: 2,
        },
        {
          target: "prolactin",
          mechanism: "agonist",
          intrinsicEfficacy: 5.0,
          unit: "ng/mL",
          tau: 30,
        },
        {
          target: "testosterone",
          mechanism: "agonist",
          intrinsicEfficacy: 3.0,
          unit: "ng/dL",
          tau: 60,
        },
        {
          target: "norepi",
          mechanism: "antagonist",
          intrinsicEfficacy: 156.0, // 25 * 6.25
          unit: "pg/mL",
          tau: 20,
        },
        {
          target: "cortisol",
          mechanism: "antagonist",
          intrinsicEfficacy: 8.0,
          unit: "µg/dL",
          tau: 30,
        },
        {
          target: "serotonin",
          mechanism: "antagonist",
          intrinsicEfficacy: 1.5, // 15 * 0.1
          unit: "nM",
          tau: 30,
        },
      ],
    },
    group: "Routine",
    categories: ["environment"],
    goals: ["sleep", "recovery", "longevity", "energy"],
  },
  {
    key: "nap",
    label: "Power Nap",

    icon: "😴",
    defaultDurationMin: 25,
    params: [
      {
        key: "quality",
        label: "Refreshment",
        type: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 1,
      },
    ],
    pharmacology: {
      molecule: { name: "Nap", molarMass: 0 },
      pk: { model: "activity-dependent" },
      pd: [
        {
          target: "gaba",
          mechanism: "agonist",
          intrinsicEfficacy: 150.0,
          unit: "nM",
          tau: 5,
        }, // 25 * 6
        {
          target: "melatonin",
          mechanism: "agonist",
          intrinsicEfficacy: 20.0,
          unit: "pg/mL",
          tau: 8,
        },
        {
          target: "histamine",
          mechanism: "antagonist",
          intrinsicEfficacy: 7.5, // 15 * 0.5
          unit: "nM",
          tau: 10,
        },
        {
          target: "orexin",
          mechanism: "antagonist",
          intrinsicEfficacy: 15.0,
          unit: "pg/mL",
          tau: 10,
        },
        {
          target: "adenosinePressure",
          mechanism: "antagonist",
          intrinsicEfficacy: 0.04,
          unit: "index",
          tau: 20,
        },
        {
          target: "norepi",
          mechanism: "antagonist",
          intrinsicEfficacy: 62.5, // 10 * 6.25
          unit: "pg/mL",
          tau: 10,
        },
      ],
    },
    group: "Routine",
    categories: ["wellness"],
    goals: ["sleep", "recovery", "energy", "longevity"],
  },
  {
    key: "exercise_cardio",
    label: "Cardio",

    icon: "🏃",
    defaultDurationMin: 45,
    params: [
      {
        key: "intensity",
        label: "Intensity",
        type: "slider",
        min: 0.5,
        max: 1.5,
        step: 0.1,
        default: 1.0,
      },
    ],
    // DYNAMIC FACTORY
    pharmacology: (params) => {
      const intensity = Number(params.intensity) || 1.0;
      return [
        Agents.SympatheticStress(intensity),
        Agents.MetabolicLoad(intensity),
      ];
    },
    group: "Lifestyle",
    categories: ["exercise"],
    goals: ["energy", "mood", "longevity", "calm"],
  },
  {
    key: "exercise_resistance",
    label: "Resistance Training",

    icon: "🏋️",
    defaultDurationMin: 60,
    params: [
      {
        key: "intensity",
        label: "Intensity",
        type: "slider",
        min: 0.5,
        max: 1.5,
        step: 0.1,
        default: 1.0,
      },
    ],
    pharmacology: (params) => {
      const intensity = Number(params.intensity) || 1.0;
      return [
        Agents.SympatheticStress(intensity * 0.7), // Less cardio stress
        Agents.MechanicalLoad(intensity),
      ];
    },
    group: "Lifestyle",
    categories: ["exercise"],
    goals: ["recovery", "hormones", "longevity", "energy"],
  },
  {
    key: "exercise_hiit",
    label: "HIIT",

    icon: "🔥",
    defaultDurationMin: 20,
    params: [
      {
        key: "intensity",
        label: "Intensity",
        type: "slider",
        min: 0.5,
        max: 1.5,
        step: 0.1,
        default: 1.0,
      },
    ],
    pharmacology: (params) => {
      const intensity = Number(params.intensity) || 1.0;
      return [
        Agents.SympatheticStress(intensity * 1.5), // Very high stress
        Agents.MetabolicLoad(intensity * 1.5),
        Agents.MechanicalLoad(intensity * 0.5),
      ];
    },
    group: "Lifestyle",
    categories: ["exercise"],
    goals: ["weightLoss", "energy", "hormones", "longevity"],
  },
  {
    key: "alcohol",
    label: "Alcohol",

    icon: "🍸",
    defaultDurationMin: 60,
    params: [
      {
        key: "units",
        label: "Standard Units",
        type: "slider",
        min: 0,
        max: 10,
        step: 0.5,
        default: 1.5,
      },
    ],
    pharmacology: (params) => Agents.Alcohol(Number(params.units) || 1.5),
    group: "Lifestyle",
    categories: ["social"],
    goals: ["mood", "calm"],
  },
  {
    key: "social",
    label: "Social Interaction",

    icon: "🗣️",
    defaultDurationMin: 60,
    params: [],
    pharmacology: {
      molecule: { name: "Social", molarMass: 0 },
      pk: { model: "activity-dependent" },
      pd: [
        {
          target: "oxytocin",
          mechanism: "agonist",
          intrinsicEfficacy: 5.0,
          unit: "pg/mL",
          tau: 10,
        },
        {
          target: "dopamine",
          mechanism: "agonist",
          intrinsicEfficacy: 4.0,
          unit: "nM",
          tau: 15,
        }, // 20 * 0.2
        {
          target: "serotonin",
          mechanism: "agonist",
          intrinsicEfficacy: 1.0, // 10 * 0.1
          unit: "nM",
          tau: 15,
        },
        {
          target: "cortisol",
          mechanism: "antagonist",
          intrinsicEfficacy: 10.0,
          unit: "µg/dL",
        },
        {
          target: "vagal",
          mechanism: "agonist",
          intrinsicEfficacy: 0.4,
          unit: "index",
        },
        {
          target: "endocannabinoid",
          mechanism: "agonist",
          intrinsicEfficacy: 3.0,
          unit: "nM",
        }, // 15 * 0.2
      ],
    },
    group: "Lifestyle",
    categories: ["social"],
    goals: ["mood", "hormones"],
  },
  {
    key: "meditation",
    label: "Meditation",

    icon: "🧘",
    defaultDurationMin: 20,
    params: [],
    pharmacology: {
      molecule: { name: "Meditation", molarMass: 0 },
      pk: { model: "activity-dependent" },
      pd: [
        {
          target: "vagal",
          mechanism: "agonist",
          intrinsicEfficacy: 0.6,
          unit: "index",
          tau: 5,
        },
        {
          target: "gaba",
          mechanism: "agonist",
          intrinsicEfficacy: 90.0,
          unit: "nM",
          tau: 8,
        }, // 15 * 6
        {
          target: "cortisol",
          mechanism: "antagonist",
          intrinsicEfficacy: 5.0,
          unit: "µg/dL",
        },
        {
          target: "serotonin",
          mechanism: "agonist",
          intrinsicEfficacy: 1.2,
          unit: "nM",
        }, // 12 * 0.1
        {
          target: "norepi",
          mechanism: "antagonist",
          intrinsicEfficacy: 94.0,
          unit: "pg/mL",
        }, // 15 * 6.25
        {
          target: "inflammation",
          mechanism: "antagonist",
          intrinsicEfficacy: 0.2,
          unit: "index",
        },
        {
          target: "melatonin",
          mechanism: "agonist",
          intrinsicEfficacy: 5.0,
          unit: "pg/mL",
        },
      ],
    },
    group: "Wellness",
    categories: ["wellness"],
    goals: ["calm", "focus", "mood", "longevity"],
  },
];
