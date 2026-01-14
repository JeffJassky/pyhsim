import type { InterventionDef } from "@/types";
import { Agents } from "../../physiology/agents";

export const LIFESTYLE_INTERVENTIONS: InterventionDef[] = [
  {
    key: "wake",
    label: "Wake Up",
    color: "#facc15",
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
          effectGain: 8.0,
          unit: "µg/dL",
          tau: 30, // CAR duration approximation
        },
        {
          target: "dopamine",
          mechanism: "agonist",
          effectGain: 6.0, // 30 * 0.2
          unit: "nM",
          tau: 10,
        },
        {
          target: "melatonin",
          mechanism: "antagonist",
          effectGain: 40.0,
          unit: "pg/mL",
          tau: 20,
        },
        {
          target: "gaba",
          mechanism: "antagonist",
          effectGain: 150.0, // 25 * 6.0
          unit: "nM",
          tau: 45,
        },
        {
          target: "orexin",
          mechanism: "agonist",
          effectGain: 20.0,
          unit: "pg/mL",
          tau: 15,
        },
        {
          target: "acetylcholine",
          mechanism: "agonist",
          effectGain: 3.75, // 15 * 0.25
          unit: "nM",
          tau: 15,
        }
      ],
    },
    group: "Routine",
    categories: ["environment"],
    goals: ["energy", "focus"],
  },
  {
    key: "sleep",
    label: "Sleep",
    color: "#3b82f6",
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
          effectGain: 80.0,
          unit: "pg/mL",
          tau: 10,
        },
        { target: "gaba", mechanism: "agonist", effectGain: 240.0, unit: "nM", tau: 10 }, // 40 * 6
        {
          target: "histamine",
          mechanism: "antagonist",
          effectGain: 15.0, // 30 * 0.5
          unit: "nM",
          tau: 15,
        },
        {
          target: "orexin",
          mechanism: "antagonist",
          effectGain: 35.0,
          unit: "pg/mL",
          tau: 15,
        },
        {
          target: "adenosinePressure",
          mechanism: "antagonist",
          effectGain: 0.08,
          unit: "index",
          tau: 60,
        },
        {
          target: "growthHormone",
          mechanism: "agonist",
          effectGain: 8.0,
          unit: "ng/mL",
          tau: 2,
        },
        { target: "prolactin", mechanism: "agonist", effectGain: 5.0, unit: "ng/mL", tau: 30 },
        {
          target: "testosterone",
          mechanism: "agonist",
          effectGain: 3.0,
          unit: "ng/dL",
          tau: 60,
        },
        {
          target: "norepi",
          mechanism: "antagonist",
          effectGain: 156.0, // 25 * 6.25
          unit: "pg/mL",
          tau: 20,
        },
        {
          target: "cortisol",
          mechanism: "antagonist",
          effectGain: 8.0,
          unit: "µg/dL",
          tau: 30,
        },
        {
          target: "serotonin",
          mechanism: "antagonist",
          effectGain: 1.5, // 15 * 0.1
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
    color: "#60a5fa",
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
        { target: "gaba", mechanism: "agonist", effectGain: 150.0, unit: "nM", tau: 5 }, // 25 * 6
        { target: "melatonin", mechanism: "agonist", effectGain: 20.0, unit: "pg/mL", tau: 8 },
        {
          target: "histamine",
          mechanism: "antagonist",
          effectGain: 7.5, // 15 * 0.5
          unit: "nM",
          tau: 10,
        },
        {
          target: "orexin",
          mechanism: "antagonist",
          effectGain: 15.0,
          unit: "pg/mL",
          tau: 10,
        },
        {
          target: "adenosinePressure",
          mechanism: "antagonist",
          effectGain: 0.04,
          unit: "index",
          tau: 20,
        },
        {
          target: "norepi",
          mechanism: "antagonist",
          effectGain: 62.5, // 10 * 6.25
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
    color: "#ef4444",
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
      }
    ],
    // DYNAMIC FACTORY
    pharmacology: (params) => {
      const intensity = Number(params.intensity) || 1.0;
      return [
        Agents.SympatheticStress(intensity),
        Agents.MetabolicLoad(intensity)
      ];
    },
    group: "Lifestyle",
    categories: ["exercise"],
    goals: ["energy", "mood", "longevity", "calm"],
  },
  {
    key: "exercise_resistance",
    label: "Resistance Training",
    color: "#dc2626",
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
      }
    ],
    pharmacology: (params) => {
      const intensity = Number(params.intensity) || 1.0;
      return [
        Agents.SympatheticStress(intensity * 0.7), // Less cardio stress
        Agents.MechanicalLoad(intensity)
      ];
    },
    group: "Lifestyle",
    categories: ["exercise"],
    goals: ["recovery", "hormones", "longevity", "energy"],
  },
  {
    key: "exercise_hiit",
    label: "HIIT",
    color: "#b91c1c",
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
      }
    ],
    pharmacology: (params) => {
      const intensity = Number(params.intensity) || 1.0;
      return [
        Agents.SympatheticStress(intensity * 1.5), // Very high stress
        Agents.MetabolicLoad(intensity * 1.5),
        Agents.MechanicalLoad(intensity * 0.5)
      ];
    },
    group: "Lifestyle",
    categories: ["exercise"],
    goals: ["weightLoss", "energy", "hormones", "longevity"],
  },
  {
    key: "alcohol",
    label: "Alcohol",
    color: "#f87171",
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
    color: "#f472b6",
    icon: "🗣️",
    defaultDurationMin: 60,
    params: [],
    pharmacology: {
      molecule: { name: "Social", molarMass: 0 },
      pk: { model: "activity-dependent" },
      pd: [
        { target: "oxytocin", mechanism: "agonist", effectGain: 5.0, unit: "pg/mL", tau: 10 },
        { target: "dopamine", mechanism: "agonist", effectGain: 4.0, unit: "nM", tau: 15 }, // 20 * 0.2
        {
          target: "serotonin",
          mechanism: "agonist",
          effectGain: 1.0, // 10 * 0.1
          unit: "nM",
          tau: 15,
        },
        { target: "cortisol", mechanism: "antagonist", effectGain: 10.0, unit: "µg/dL" },
        { target: "vagal", mechanism: "agonist", effectGain: 0.4, unit: "index" },
        { target: "endocannabinoid", mechanism: "agonist", effectGain: 3.0, unit: "nM" }, // 15 * 0.2
      ],
    },
    group: "Lifestyle",
    categories: ["social"],
    goals: ["mood", "hormones"],
  },
  {
    key: "meditation",
    label: "Meditation",
    color: "#60a5fa",
    icon: "🧘",
    defaultDurationMin: 20,
    params: [],
    pharmacology: {
      molecule: { name: "Meditation", molarMass: 0 },
      pk: { model: "activity-dependent" },
      pd: [
        { target: "vagal", mechanism: "agonist", effectGain: 0.6, unit: "index", tau: 5 },
        { target: "gaba", mechanism: "agonist", effectGain: 90.0, unit: "nM", tau: 8 }, // 15 * 6
        { target: "cortisol", mechanism: "antagonist", effectGain: 5.0, unit: "µg/dL" },
        { target: "serotonin", mechanism: "agonist", effectGain: 1.2, unit: "nM" }, // 12 * 0.1
        { target: "norepi", mechanism: "antagonist", effectGain: 94.0, unit: "pg/mL" }, // 15 * 6.25
        { target: "inflammation", mechanism: "antagonist", effectGain: 0.2, unit: "index" },
        { target: "melatonin", mechanism: "agonist", effectGain: 5.0, unit: "pg/mL" },
      ],
    },
    group: "Wellness",
    categories: ["wellness"],
    goals: ["calm", "focus", "mood", "longevity"],
  },
];