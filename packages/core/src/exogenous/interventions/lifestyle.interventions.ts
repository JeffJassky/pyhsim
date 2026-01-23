import type { InterventionDef } from "../../types";
import { Agents } from "../agents";

export const LIFESTYLE_INTERVENTIONS: InterventionDef[] = [
  {
    key: "sleep",
    label: "Sleep",

    icon: "🌙",
    defaultDurationMin: 480,
    params: [],
    pharmacology: {
      molecule: { name: "Sleep", molarMass: 0 },
      pk: { model: "activity-dependent", delivery: "continuous" },
      pd: [
        {
          target: "melatonin",
          mechanism: "agonist",
          intrinsicEfficacy: 80.0,
          unit: "pg/mL",
          tau: 10,
          description:
            "The 'vampire hormone' peaks in total darkness, signaling your body that it's officially night time.",
        },
        {
          target: "gaba",
          mechanism: "agonist",
          intrinsicEfficacy: 240.0,
          unit: "nM",
          tau: 10,
          description:
            "Sleep drives deep calming signals throughout the brain to prevent you from waking up easily.",
        }, // 40 * 6
        {
          target: "histamine",
          mechanism: "antagonist",
          intrinsicEfficacy: 15.0, // 30 * 0.5
          unit: "nM",
          tau: 15,
          description:
            "Turns off the brain's main 'alertness' switch so you can drift into deep sleep stages.",
        },
        {
          target: "orexin",
          mechanism: "antagonist",
          intrinsicEfficacy: 35.0,
          unit: "pg/mL",
          tau: 15,
          description:
            "Suppresses the peptide that keeps you awake and focused on the outside world.",
        },
        {
          target: "adenosinePressure",
          mechanism: "antagonist",
          intrinsicEfficacy: 0.08,
          unit: "index",
          tau: 60,
          description:
            "Clears out the 'sleep pressure' that's been building up every minute you were awake.",
        },
        {
          target: "growthHormone",
          mechanism: "agonist",
          intrinsicEfficacy: 8.0,
          unit: "ng/mL",
          tau: 2,
          description:
            "Physical repair mode: deep sleep is when your body rebuilds tissues and grows new cells.",
        },
        {
          target: "prolactin",
          mechanism: "agonist",
          intrinsicEfficacy: 5.0,
          unit: "ng/mL",
          tau: 30,
          description:
            "Assists in immune regulation and metabolic health while you rest.",
        },
        {
          target: "testosterone",
          mechanism: "agonist",
          intrinsicEfficacy: 3.0,
          unit: "ng/dL",
          tau: 60,
          description:
            "Sleep is the primary time your body restores hormone levels like testosterone.",
        },
        {
          target: "norepi",
          mechanism: "antagonist",
          intrinsicEfficacy: 156.0, // 25 * 6.25
          unit: "pg/mL",
          tau: 20,
          description:
            "Shuts down focus and stress signals so your brain can process memories undisturbed.",
        },
        {
          target: "cortisol",
          mechanism: "antagonist",
          intrinsicEfficacy: 8.0,
          unit: "µg/dL",
          tau: 30,
          description:
            "Lowers stress hormones to their daily minimum, allowing for deep systemic recovery.",
        },
        {
          target: "serotonin",
          mechanism: "antagonist",
          intrinsicEfficacy: 1.5, // 15 * 0.1
          unit: "nM",
          tau: 30,
          description:
            "Reduces active mood modulation to allow for restorative dream and non-dream states.",
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
        unit: "index",
        type: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 1,
      },
    ],
    pharmacology: {
      molecule: { name: "Nap", molarMass: 0 },
      pk: { model: "activity-dependent", delivery: "continuous" },
      pd: [
        {
          target: "gaba",
          mechanism: "agonist",
          intrinsicEfficacy: 150.0,
          unit: "nM",
          tau: 5,
          description:
            "Even a short nap provides a quick calming signal to lower neural noise.",
        }, // 25 * 6
        {
          target: "melatonin",
          mechanism: "agonist",
          intrinsicEfficacy: 20.0,
          unit: "pg/mL",
          tau: 8,
          description:
            "Briefly triggers the brain's internal 'night mode' for a quick refresh.",
        },
        {
          target: "histamine",
          mechanism: "antagonist",
          intrinsicEfficacy: 7.5, // 15 * 0.5
          unit: "nM",
          tau: 10,
          description:
            "Lowers the brain's alertness signal just enough to allow a brief disconnect.",
        },
        {
          target: "orexin",
          mechanism: "antagonist",
          intrinsicEfficacy: 15.0,
          unit: "pg/mL",
          tau: 10,
          description:
            "Briefly pauses wakefulness signaling, letting the brain reset.",
        },
        {
          target: "adenosinePressure",
          mechanism: "antagonist",
          intrinsicEfficacy: 0.04,
          unit: "index",
          tau: 20,
          description:
            "Takes the edge off the sleep debt that's been building since you woke up.",
        },
        {
          target: "norepi",
          mechanism: "antagonist",
          intrinsicEfficacy: 62.5, // 10 * 6.25
          unit: "pg/mL",
          tau: 10,
          description:
            "Allows stress and focus chemicals to drop briefly, reducing mental fatigue.",
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
        unit: "x",
        type: "slider",
        min: 0.5,
        max: 1.5,
        step: 0.1,
        default: 1.0,
      },
    ],
    // DYNAMIC FACTORY
    pharmacology: (params: any) => {
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
        unit: "x",
        type: "slider",
        min: 0.5,
        max: 1.5,
        step: 0.1,
        default: 1.0,
      },
    ],
    pharmacology: (params: any) => {
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
        unit: "x",
        type: "slider",
        min: 0.5,
        max: 1.5,
        step: 0.1,
        default: 1.0,
      },
    ],
    pharmacology: (params: any) => {
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
        unit: "units",
        type: "slider",
        min: 0,
        max: 10,
        step: 0.5,
        default: 1.5,
      },
    ],
    pharmacology: (params: any) => Agents.Alcohol(Number(params.units) || 1.5),
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
      pk: { model: "activity-dependent", delivery: "continuous" },
      pd: [
        {
          target: "oxytocin",
          mechanism: "agonist",
          intrinsicEfficacy: 5.0,
          unit: "pg/mL",
          tau: 10,
          description:
            "The 'cuddle chemical'—connects us to others and creates feelings of trust and safety.",
        },
        {
          target: "dopamine",
          mechanism: "agonist",
          intrinsicEfficacy: 4.0,
          unit: "nM",
          tau: 15,
          description:
            "Positive social feedback triggers reward circuits, making us seek more interaction.",
        }, // 20 * 0.2
        {
          target: "serotonin",
          mechanism: "agonist",
          intrinsicEfficacy: 1.0, // 10 * 0.1
          unit: "nM",
          tau: 15,
          description:
            "Feeling respected and valued by others boosts mood and overall emotional well-being.",
        },
        {
          target: "cortisol",
          mechanism: "antagonist",
          intrinsicEfficacy: 10.0,
          unit: "µg/dL",
          description:
            "Good company is a natural stress buffer, physically lowering your cortisol levels.",
        },
        {
          target: "vagal",
          mechanism: "agonist",
          intrinsicEfficacy: 0.4,
          unit: "index",
          description:
            "Face-to-face connection activates the 'social engagement' part of the vagus nerve.",
        },
        {
          target: "endocannabinoid",
          mechanism: "agonist",
          intrinsicEfficacy: 3.0,
          unit: "nM",
          description:
            "Laughter and shared activities trigger 'bliss molecules' that make socializing pleasurable.",
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
      pk: { model: "activity-dependent", delivery: "continuous" },
      pd: [
        {
          target: "vagal",
          mechanism: "agonist",
          intrinsicEfficacy: 0.6,
          unit: "index",
          tau: 5,
          description:
            "Conscious breathing directly activates the vagus nerve, the body's main 'calm down' highway.",
        },
        {
          target: "gaba",
          mechanism: "agonist",
          intrinsicEfficacy: 90.0,
          unit: "nM",
          tau: 8,
          description:
            "Focused awareness increases calming brain chemicals, reducing mental chatter.",
        }, // 15 * 6
        {
          target: "cortisol",
          mechanism: "antagonist",
          intrinsicEfficacy: 5.0,
          unit: "µg/dL",
          description:
            "Regular practice blunts the body's stress response and lowers baseline cortisol.",
        },
        {
          target: "serotonin",
          mechanism: "agonist",
          intrinsicEfficacy: 1.2,
          unit: "nM",
          description:
            "Promotes a steady, content mood by gently supporting serotonin availability.",
        }, // 12 * 0.1
        {
          target: "norepi",
          mechanism: "antagonist",
          intrinsicEfficacy: 94.0,
          unit: "pg/mL",
          description:
            "Lowers 'fight or flight' chemicals, letting your system shift into rest-and-digest mode.",
        }, // 15 * 6.25
        {
          target: "inflammation",
          mechanism: "antagonist",
          intrinsicEfficacy: 0.2,
          unit: "index",
          description:
            "Over time, mindfulness practice can actually lower markers of systemic inflammation.",
        },
        {
          target: "melatonin",
          mechanism: "agonist",
          intrinsicEfficacy: 5.0,
          unit: "pg/mL",
          description:
            "Evening practice can gently nudge melatonin production, prepping you for sleep.",
        },
      ],
    },
    group: "Wellness",
    categories: ["wellness"],
    goals: ["calm", "focus", "mood", "longevity"],
  },
  {
    key: "coldExposure",
    label: "Cold Exposure",
    icon: "🧊",
    defaultDurationMin: 5,
    params: [
      {
        key: "temperature",
        label: "Temperature",
        type: "slider",
        min: 0,
        max: 15,
        step: 1,
        default: 10,
        unit: "°C",
        hint: "0°C = ice bath, 15°C = cool shower",
      },
      {
        key: "intensity",
        label: "Intensity",
        unit: "x",
        type: "slider",
        min: 0.5,
        max: 1.5,
        step: 0.1,
        default: 1.0,
      },
    ],
    pharmacology: (params: any) =>
      Agents.ColdExposure(
        Number(params.temperature) ?? 10,
        Number(params.intensity) ?? 1.0,
      ),
    group: "Wellness",
    categories: ["wellness"],
    goals: ["energy", "recovery", "mood", "longevity"],
  },
  {
    key: "heatSauna",
    label: "Sauna / Heat Therapy",
    icon: "🧖",
    defaultDurationMin: 20,
    params: [
      {
        key: "type",
        label: "Type",
        type: "select",
        unit: "x",
        options: [
          { value: "dry", label: "Dry Sauna (80-100°C)" },
          { value: "infrared", label: "Infrared (45-65°C)" },
          { value: "steam", label: "Steam Room (40-50°C)" },
        ],
        default: "dry",
      },
      {
        key: "temperature",
        label: "Temperature",
        type: "slider",
        min: 40,
        max: 100,
        step: 5,
        default: 80,
        unit: "°C",
      },
    ],
    pharmacology: (params: any) =>
      Agents.HeatExposure(
        Number(params.temperature) ?? 80,
        (params.type as "dry" | "infrared" | "steam") ?? "dry",
        1.0,
      ),
    group: "Wellness",
    categories: ["wellness"],
    goals: ["recovery", "longevity", "calm", "sleep"],
  },
  {
    key: "sunlight_viewing",
    label: "Sunlight Viewing",
    icon: "☀️",
    defaultDurationMin: 20,
    params: [
      {
        key: "time",
        label: "Time of Day",
        type: "select",
        unit: "units",
        options: [
          { value: "sunrise", label: "Sunrise (Low Solar Angle)" },
          { value: "midday", label: "Midday (High UV)" },
          { value: "sunset", label: "Sunset" },
        ],
        default: "sunrise",
      },
      {
        key: "lux",
        label: "Intensity (Lux)",
        unit: "units",
        type: "slider",
        min: 1000,
        max: 100000,
        step: 5000,
        default: 10000,
        hint: "10k = shade/morning, 100k = direct noon sun",
      },
    ],
    pharmacology: (params: any) =>
      Agents.SunlightExposure(
        Number(params.lux) || 10000,
        (params.time as "sunrise" | "midday" | "sunset") || "sunrise"
      ),
    group: "Routine",
    categories: ["environment"],
    goals: ["sleep", "mood", "energy"],
  },
  {
    key: "breathwork",
    label: "Breathwork",
    icon: "🌬️",
    defaultDurationMin: 15,
    params: [
      {
        key: "type",
        label: "Style",
        type: "select",
        unit: "units",
        options: [
          { value: "calm", label: "Calming (4-7-8, Slow)" },
          { value: "balance", label: "Balancing (Box, Coherence)" },
          { value: "activation", label: "Activation (Wim Hof, Fire)" },
        ],
        default: "balance",
      },
      {
        key: "intensity",
        label: "Intensity",
        unit: "x",
        type: "slider",
        min: 0.5,
        max: 2.0,
        step: 0.1,
        default: 1.0,
      },
    ],
    pharmacology: (params: any) =>
      Agents.Breathwork(
        (params.type as "calm" | "balance" | "activation") || "balance",
        Number(params.intensity) || 1.0
      ),
    group: "Wellness",
    categories: ["wellness"],
    goals: ["calm", "focus", "energy", "recovery"],
  },
  {
    key: "social_media",
    label: "Social Media",
    icon: "📱",
    defaultDurationMin: 30,
    params: [
      {
        key: "type",
        label: "Content Type",
        type: "select",
        unit: "units",
        options: [
          { value: "entertainment", label: "Entertainment / Joy" },
          { value: "doomscrolling", label: "Doomscrolling / Anger" },
        ],
        default: "entertainment",
      },
    ],
    pharmacology: (params: any) =>
      Agents.SocialMedia(
        (params.type as "entertainment" | "doomscrolling") || "entertainment",
        30
      ),
    group: "Lifestyle",
    categories: ["social"],
    goals: ["mood"],
  },
  {
    key: "sexual_activity",
    label: "Sexual Activity",
    icon: "❤️",
    defaultDurationMin: 20,
    params: [
      {
        key: "type",
        label: "Type",
        type: "select",
        unit: "units",
        options: [
          { value: "partnered", label: "Partnered" },
          { value: "solo", label: "Solo / Masturbation" },
        ],
        default: "partnered",
      },
      {
        key: "orgasm",
        label: "Orgasm",
        type: "select",
        unit: "units",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
        ],
        default: "yes",
      },
    ],
    pharmacology: (params: any) =>
      Agents.SexualActivity(
        (params.type as "partnered" | "solo") || "partnered",
        params.orgasm === "yes"
      ),
    group: "Lifestyle",
    categories: ["social", "wellness"],
    goals: ["mood", "recovery", "calm"],
  },
  {
    key: "tobacco",
    label: "Tobacco / Nicotine",
    icon: "🚬",
    defaultDurationMin: 15, // Short acute effect
    params: [
      {
        key: "delivery",
        label: "Method",
        type: "select",
        unit: "units",
        options: [
          { value: "smoked", label: "Cigarette (Smoked)" },
          { value: "vaped", label: "Vape" },
          { value: "pouch", label: "Pouch / Snus" },
          { value: "gum", label: "Gum / Lozenge" },
          { value: "patch", label: "Patch (Transdermal)" },
        ],
        default: "smoked",
      },
      {
        key: "mg",
        label: "Nicotine Amount",
        unit: "mg",
        type: "slider",
        min: 1,
        max: 20,
        step: 1,
        default: 2,
        hint: "Cigarette ≈ 1-2mg absorbed, Pouch ≈ 3-6mg",
      },
    ],
    pharmacology: (params: any) =>
      Agents.Nicotine(
        Number(params.mg) || 2,
        (params.delivery as any) || "smoked"
      ),
    group: "Lifestyle",
    categories: ["substances"],
    goals: ["focus", "energy", "calm"],
  },
];
