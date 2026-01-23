import type { InterventionDef } from "../../types";
import { Agents } from "../agents";

/**
 * PHARMACOLOGY CALIBRATION NOTES:
 *
 * intrinsicEfficacy:
 *   - Represents the maximum "rate of change" injected into the ODE system per minute.
 *   - Units are absolute simulation units (not relative %).
 *   - Scale:
 *      - 5.0: Subtle/background effect (e.g. cofactor support).
 *      - 15.0: Noticeable physiological shift (e.g. moderate caffeine).
 *      - 30.0+: Strong pharmacological forcing (e.g. Ritalin, vigorous exercise).
 *      - 80.0+: Major systemic override (e.g. Deep sleep signals).
 *
 * EC50 / Ki:
 *   - Represents the concentration in mg/L required to reach 50% of the intrinsicEfficacy.
 *   - Calculated based on a standard volume of distribution (~40-50L for TBW).
 *   - Example: 200mg dose / 40L = 5mg/L peak concentration.
 *     If EC50 is 10mg/L, you get ~33% of the intrinsicEfficacy at peak.
 */

export const SUPPLEMENT_INTERVENTIONS: InterventionDef[] = [
  {
    key: "caffeine",
    label: "Caffeine",

    icon: "☕",
    defaultDurationMin: 240,
    params: [
      {
        key: "mg",
        label: "Amount",
        unit: "mg",
        type: "slider",
        min: 0,
        max: 400,
        step: 10,
        default: 100,
      },
    ],
    // DYNAMIC PHARMACOLOGY
    pharmacology: (params: any) => Agents.Caffeine(Number(params.mg) || 100),
    group: "Stimulants",
    categories: ["medications", "supplements"],
    goals: ["energy", "focus"],
  },
  {
    key: "melatonin",
    label: "Melatonin",

    icon: "🌙",
    defaultDurationMin: 360,
    params: [
      {
        key: "mg",
        label: "Amount",
        unit: "mg",
        type: "slider",
        min: 0,
        max: 10,
        step: 0.5,
        default: 3,
      },
    ],
    pharmacology: (params: any) => Agents.Melatonin(Number(params.mg) || 3),
    group: "Supplements",
    categories: ["supplements"],
    goals: ["sleep"],
  },
  {
    key: "ltheanine",
    label: "L-Theanine",

    icon: "🍵",
    defaultDurationMin: 300,
    params: [
      {
        key: "mg",
        label: "Amount",
        unit: "mg",
        type: "slider",
        min: 50,
        max: 400,
        step: 50,
        default: 200,
      },
    ],
    pharmacology: (params: any) => Agents.LTheanine(Number(params.mg) || 200),
    group: "Supplements",
    categories: ["supplements"],
    goals: ["calm", "focus", "mood"],
  },
  {
    key: "lTyrosine",
    label: "L-Tyrosine",

    icon: "💊",
    defaultDurationMin: 240,
    params: [
      {
        key: "mg",
        label: "Amount",
        unit: "mg",
        type: "slider",
        min: 0,
        max: 2000,
        step: 100,
        default: 500,
      },
    ],
    // DYNAMIC PHARMACOLOGY - comprehensive catecholamine precursor model
    pharmacology: (params: any) => Agents.LTyrosine(Number(params.mg) || 500),
    group: "Supplements",
    categories: ["supplements"],
    goals: ["focus", "energy"],
  },
  {
    key: "dopaMucuna",
    label: "DOPA Mucuna",

    icon: "🌱",
    defaultDurationMin: 240,
    params: [
      {
        key: "mg",
        label: "Amount",
        unit: "mg",
        type: "slider",
        min: 0,
        max: 1000,
        step: 50,
        default: 200,
      },
    ],
    // DYNAMIC PHARMACOLOGY - direct dopamine precursor model
    pharmacology: (params: any) => Agents.LDopa(Number(params.mg) || 200),
    group: "Supplements",
    categories: ["supplements"],
    goals: ["mood", "focus"],
  },
  {
    key: "p5p",
    label: "P-5-P (Active B6)",

    icon: "💊",
    defaultDurationMin: 480,
    params: [
      {
        key: "mg",
        label: "Amount",
        unit: "mg",
        type: "slider",
        min: 0,
        max: 100,
        step: 5,
        default: 25,
      },
    ],
    // DYNAMIC PHARMACOLOGY - cofactor for AADC, GAD, HDC enzymes
    pharmacology: (params: any) => Agents.P5P(Number(params.mg) || 25),
    group: "Supplements",
    categories: ["supplements"],
    goals: ["mood", "focus"],
  },
  // === NEW SUPPLEMENTS ===
  {
    key: "magnesium",
    label: "Magnesium",

    icon: "💎",
    defaultDurationMin: 480,
    params: [
      {
        key: "mg",
        label: "Amount",
        unit: "mg",
        type: "slider",
        min: 100,
        max: 600,
        step: 50,
        default: 400,
        hint: "Elemental magnesium (glycinate, threonate, citrate)",
      },
    ],
    // DYNAMIC PHARMACOLOGY - NMDA modulator, GABA support, cortisol regulation
    pharmacology: (params: any) => Agents.Magnesium(Number(params.mg) || 400),
    group: "Supplements",
    categories: ["supplements"],
    goals: ["calm", "sleep", "focus"],
  },
  {
    key: "omega3",
    label: "Omega-3 (EPA/DHA)",

    icon: "🐟",
    defaultDurationMin: 720, // Effects build over hours
    params: [
      {
        key: "mg",
        label: "Total EPA+DHA",
        unit: "mg",
        type: "slider",
        min: 500,
        max: 4000,
        step: 250,
        default: 2000,
        hint: "Combined EPA and DHA from fish oil",
      },
    ],
    // DYNAMIC PHARMACOLOGY - anti-inflammatory, membrane fluidity, neuroplasticity
    pharmacology: (params: any) => Agents.Omega3(Number(params.mg) || 2000),
    group: "Supplements",
    categories: ["supplements"],
    goals: ["mood", "focus", "longevity"],
  },
  {
    key: "alphaGPC",
    label: "Alpha-GPC",

    icon: "🧠",
    defaultDurationMin: 360,
    params: [
      {
        key: "mg",
        label: "Amount",
        unit: "mg",
        type: "slider",
        min: 150,
        max: 600,
        step: 50,
        default: 300,
        hint: "Highly bioavailable choline source",
      },
    ],
    // DYNAMIC PHARMACOLOGY - cholinergic support, GH release
    pharmacology: (params: any) => Agents.AlphaGPC(Number(params.mg) || 300),
    group: "Supplements",
    categories: ["supplements"],
    goals: ["focus", "energy"],
  },
  {
    key: "fiveHTP",
    label: "5-HTP",

    icon: "🌙",
    defaultDurationMin: 360,
    params: [
      {
        key: "mg",
        label: "Amount",
        unit: "mg",
        type: "slider",
        min: 50,
        max: 300,
        step: 25,
        default: 100,
        hint: "Direct serotonin precursor (bypasses TPH)",
      },
    ],
    // DYNAMIC PHARMACOLOGY - serotonin synthesis, melatonin conversion
    pharmacology: (params: any) => Agents.FiveHTP(Number(params.mg) || 100),
    group: "Supplements",
    categories: ["supplements"],
    goals: ["mood", "sleep", "calm"],
  },
  {
    key: "ashwagandha",
    label: "Ashwagandha",

    icon: "🌿",
    defaultDurationMin: 480,
    params: [
      {
        key: "mg",
        label: "Amount",
        unit: "mg",
        type: "slider",
        min: 150,
        max: 900,
        step: 75,
        default: 600,
        hint: "Standardized root extract (KSM-66, Sensoril)",
      },
    ],
    // DYNAMIC PHARMACOLOGY - adaptogen, cortisol modulation, GABA-ergic
    pharmacology: (params: any) => Agents.Ashwagandha(Number(params.mg) || 600),
    group: "Supplements",
    categories: ["supplements"],
    goals: ["calm", "sleep", "energy"],
  },
  {
    key: "vitaminD",
    label: "Vitamin D3",

    icon: "☀️",
    defaultDurationMin: 1440, // 24h - fat-soluble, slow kinetics
    params: [
      {
        key: "iu",
        label: "Amount",
        unit: "IU",
        type: "slider",
        min: 1000,
        max: 10000,
        step: 1000,
        default: 5000,
        hint: "Cholecalciferol (D3)",
      },
    ],
    // DYNAMIC PHARMACOLOGY - neurosteroid, immune modulation, serotonin synthesis
    pharmacology: (params: any) => Agents.VitaminD(Number(params.iu) || 5000),
    group: "Supplements",
    categories: ["supplements"],
    goals: ["mood", "energy", "longevity"],
  },
  {
    key: "creatine",
    label: "Creatine",

    icon: "💪",
    defaultDurationMin: 480,
    params: [
      {
        key: "grams",
        label: "Amount",
        unit: "g",
        type: "slider",
        min: 1,
        max: 10,
        step: 1,
        default: 5,
        hint: "Creatine monohydrate",
      },
    ],
    // DYNAMIC PHARMACOLOGY - cellular energy, neuroprotection
    pharmacology: (params: any) => Agents.Creatine(Number(params.grams) || 5),
    group: "Supplements",
    categories: ["supplements"],
    goals: ["energy", "focus"],
  },
  {
    key: "lionsMane",
    label: "Lion's Mane",

    icon: "🍄",
    defaultDurationMin: 480,
    params: [
      {
        key: "mg",
        label: "Amount",
        unit: "mg",
        type: "slider",
        min: 250,
        max: 3000,
        step: 250,
        default: 1000,
        hint: "Fruiting body or dual extract",
      },
    ],
    // DYNAMIC PHARMACOLOGY - NGF/BDNF support, neuroprotection
    pharmacology: (params: any) => Agents.LionsMane(Number(params.mg) || 1000),
    group: "Supplements",
    categories: ["supplements"],
    goals: ["focus", "mood", "longevity"],
  },

  // =============================================================================
  // NEW SUPPLEMENTS
  // =============================================================================
  {
    key: "inositol",
    label: "Inositol",
    icon: "💊",
    defaultDurationMin: 480,
    params: [
      {
        key: "mg",
        label: "Amount",
        unit: "mg",
        type: "slider",
        min: 500,
        max: 18000,
        step: 500,
        default: 2000,
        hint: "Higher doses (12-18g) for anxiety/OCD",
      },
    ],
    pharmacology: (params: any) => Agents.Inositol(Number(params.mg) || 2000),
    group: "Supplements",
    categories: ["supplements"],
    goals: ["calm", "mood"],
  },
  {
    key: "zinc",
    label: "Zinc",
    icon: "🔩",
    defaultDurationMin: 480,
    params: [
      {
        key: "mg",
        label: "Amount",
        unit: "mg",
        type: "slider",
        min: 15,
        max: 50,
        step: 5,
        default: 30,
        hint: "Elemental zinc (picolinate, gluconate, citrate)",
      },
    ],
    pharmacology: (params: any) => Agents.Zinc(Number(params.mg) || 30),
    group: "Supplements",
    categories: ["supplements"],
    goals: ["hormones", "recovery"],
  },
  {
    key: "copper",
    label: "Copper",
    icon: "🔶",
    defaultDurationMin: 480,
    params: [
      {
        key: "mg",
        label: "Amount",
        unit: "mg",
        type: "slider",
        min: 0.5,
        max: 3,
        step: 0.5,
        default: 1,
        hint: "Take with zinc (8:1 zinc:copper ratio)",
      },
    ],
    pharmacology: (params: any) => Agents.Copper(Number(params.mg) || 1),
    group: "Supplements",
    categories: ["supplements"],
    goals: ["recovery"],
  },
  {
    key: "bComplex",
    label: "B-Complex (B12/Folate)",
    icon: "💊",
    defaultDurationMin: 720,
    params: [
      {
        key: "b12_mcg",
        label: "Amount",
        unit: "mcg",
        type: "slider",
        min: 100,
        max: 5000,
        step: 100,
        default: 1000,
        hint: "Methylcobalamin or adenosylcobalamin",
      },
      {
        key: "folate_mcg",
        label: "Amount",
        unit: "mcg",
        type: "slider",
        min: 100,
        max: 1000,
        step: 100,
        default: 400,
        hint: "Methylfolate (5-MTHF)",
      },
    ],
    pharmacology: (params: any) =>
      Agents.BComplex(
        Number(params.b12_mcg) || 1000,
        Number(params.folate_mcg) || 400,
      ),
    group: "Supplements",
    categories: ["supplements"],
    goals: ["energy", "mood"],
  },
  {
    key: "chromium",
    label: "Chromium",
    icon: "💊",
    defaultDurationMin: 720,
    params: [
      {
        key: "mcg",
        label: "Amount",
        unit: "mcg",
        type: "slider",
        min: 100,
        max: 1000,
        step: 100,
        default: 500,
        hint: "Chromium picolinate for insulin sensitivity",
      },
    ],
    pharmacology: (params: any) => Agents.Chromium(Number(params.mcg) || 500),
    group: "Supplements",
    categories: ["supplements"],
    goals: ["weightLoss"],
  },
  {
    key: "rhodiola",
    label: "Rhodiola Rosea",
    icon: "🌿",
    defaultDurationMin: 360,
    params: [
      {
        key: "mg",
        label: "Amount",
        unit: "mcg",
        type: "slider",
        min: 100,
        max: 600,
        step: 50,
        default: 300,
        hint: "Standardized extract (3% rosavins, 1% salidroside)",
      },
    ],
    pharmacology: (params: any) => Agents.Rhodiola(Number(params.mg) || 300),
    group: "Supplements",
    categories: ["supplements"],
    goals: ["energy", "mood", "focus"],
  },
  {
    key: "cdpCholine",
    label: "CDP-Choline (Citicoline)",
    icon: "🧠",
    defaultDurationMin: 360,
    params: [
      {
        key: "mg",
        label: "Amount",
        unit: "mcg",
        type: "slider",
        min: 100,
        max: 500,
        step: 50,
        default: 250,
        hint: "Phospholipid precursor and choline source",
      },
    ],
    pharmacology: (params: any) => Agents.CDPCholine(Number(params.mg) || 250),
    group: "Supplements",
    categories: ["supplements"],
    goals: ["focus", "energy"],
  },
  {
    key: "lCarnitine",
    label: "L-Carnitine (ALCAR)",
    icon: "⚡",
    defaultDurationMin: 360,
    params: [
      {
        key: "mg",
        label: "Amount",
        unit: "mcg",
        type: "slider",
        min: 250,
        max: 2000,
        step: 250,
        default: 500,
        hint: "Acetyl-L-Carnitine for brain/energy",
      },
    ],
    pharmacology: (params: any) => Agents.LCarnitine(Number(params.mg) || 500),
    group: "Supplements",
    categories: ["supplements"],
    goals: ["energy", "focus"],
  },
  {
    key: "digestiveEnzymes",
    label: "Digestive Enzymes",
    icon: "🫃",
    defaultDurationMin: 180,
    params: [
      {
        key: "units",
        label: "Servings",
        unit: "servings",
        type: "slider",
        min: 1,
        max: 3,
        step: 1,
        default: 1,
        hint: "Take with meals",
      },
    ],
    pharmacology: (params: any) =>
      Agents.DigestiveEnzymes(Number(params.units) || 1),
    group: "Supplements",
    categories: ["supplements"],
    goals: ["recovery"],
  },
  {
    key: "electrolytes",
    label: "Electrolytes",
    icon: "⚡",
    defaultDurationMin: 240,
    params: [
      {
        key: "sodium",
        label: "Sodium",
        unit: "mg",
        type: "slider",
        min: 0,
        max: 2000,
        step: 100,
        default: 500,
      },
      {
        key: "potassium",
        label: "Potassium",
        unit: "mg",
        type: "slider",
        min: 0,
        max: 1000,
        step: 50,
        default: 200,
      },
      {
        key: "magnesium",
        label: "Magnesium",
        unit: "mg",
        type: "slider",
        min: 0,
        max: 400,
        step: 50,
        default: 100,
      },
    ],
    pharmacology: (params: any) =>
      Agents.Electrolytes(
        Number(params.sodium) || 500,
        Number(params.potassium) || 200,
        Number(params.magnesium) || 100
      ),
    group: "Supplements",
    categories: ["supplements"],
    goals: ["energy", "recovery"],
  },
];
