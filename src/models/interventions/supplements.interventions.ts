import type { InterventionDef } from "@/types";

/**
 * PHARMACOLOGY CALIBRATION NOTES:
 * 
 * effectGain: 
 *   - Represents the maximum "rate of change" injected into the ODE system per minute.
 *   - Units are absolute simulation units (not relative %).
 *   - Scale: 
 *      - 5.0: Subtle/background effect (e.g. cofactor support).
 *      - 15.0: Noticeable physiological shift (e.g. moderate caffeine).
 *      - 30.0+: Strong pharmacological forcing (e.g. Ritalin, vigorous exercise).
 *      - 80.0+: Major systemic override (e.g. Deep sleep signals).
 * 
 * EC50 / Ki:
 *   - Represents the concentration in mg/L required to reach 50% of the effectGain.
 *   - Calculated based on a standard volume of distribution (~40-50L for TBW).
 *   - Example: 200mg dose / 40L = 5mg/L peak concentration. 
 *     If EC50 is 10mg/L, you get ~33% of the effectGain at peak.
 */

export const SUPPLEMENT_INTERVENTIONS: InterventionDef[] = [
  {
    key: "caffeine",
    label: "Caffeine",
    color: "#78350f",
    icon: "☕",
    defaultDurationMin: 240,
    params: [
      {
        key: "mg",
        label: "Dose (mg)",
        type: "slider",
        min: 0,
        max: 400,
        step: 10,
        default: 100,
      },
    ],
    pharmacology: {
      molecule: { name: "Caffeine", molarMass: 194.19, logP: -0.07 },
      pk: {
        model: "1-compartment",
        bioavailability: 0.99,
        halfLifeMin: 300,
        clearance: { hepatic: { baseCL_mL_min: 155, CYP: "CYP1A2" } },
        volume: { kind: "tbw", fraction: 0.6 },
      },
      pd: [
        {
          target: "Adenosine_A2a",
          mechanism: "antagonist",
          Ki: 0.5,
          effectGain: 4.0, // 20 * 0.2
          unit: "nM",
        },
        {
          target: "Adenosine_A1",
          mechanism: "antagonist",
          Ki: 1.0,
          effectGain: 2.4, // 12 * 0.2
          unit: "nM",
        },
        {
          target: "cortisol",
          mechanism: "agonist",
          EC50: 1.0,
          effectGain: 8.0,
          unit: "µg/dL",
        },
        {
          target: "adrenaline",
          mechanism: "agonist",
          EC50: 1.5,
          effectGain: 12.0,
          unit: "pg/mL",
        },
        { target: "norepi", mechanism: "agonist", EC50: 1.5, effectGain: 93.75, unit: "pg/mL" }, // 15 * 6.25
      ],
    },
    group: "Stimulants",
    categories: ["medications", "supplements"],
    goals: ["energy", "focus"],
  },
  {
    key: "melatonin",
    label: "Melatonin",
    color: "#6366f1",
    icon: "🌙",
    defaultDurationMin: 360,
    params: [
      {
        key: "mg",
        label: "Dose (mg)",
        type: "slider",
        min: 0.3,
        max: 10,
        step: 0.5,
        default: 3,
      },
    ],
    pharmacology: {
      molecule: { name: "Melatonin", molarMass: 232.28 },
      pk: {
        model: "1-compartment",
        bioavailability: 0.15,
        halfLifeMin: 45,
        clearance: { hepatic: { baseCL_mL_min: 1200, CYP: "CYP1A2" } },
        volume: { kind: "weight", base_L_kg: 1.0 },
      },
      pd: [
        // MT1/MT2 targets drive the 'melatonin' signal in neurostate
        { target: "MT1", mechanism: "agonist", Ki: 0.08, effectGain: 25.0, unit: "pg/mL" },
        { target: "MT2", mechanism: "agonist", Ki: 0.23, effectGain: 20.0, unit: "pg/mL" },
        {
          target: "orexin",
          mechanism: "antagonist",
          EC50: 50,
          effectGain: 10.0,
          unit: "pg/mL",
        },
        {
          target: "cortisol",
          mechanism: "antagonist",
          EC50: 100,
          effectGain: 5.0,
          unit: "µg/dL",
        },
        { target: "GABA_A", mechanism: "PAM", EC50: 200, effectGain: 48.0, unit: "nM" }, // 8 * 6
      ],
    },
    group: "Supplements",
    categories: ["supplements"],
    goals: ["sleep"],
  },
  {
    key: "ltheanine",
    label: "L-Theanine",
    color: "#10b981",
    icon: "🍵",
    defaultDurationMin: 300,
    params: [
      {
        key: "mg",
        label: "Dose (mg)",
        type: "slider",
        min: 50,
        max: 400,
        step: 50,
        default: 200,
      },
    ],
    pharmacology: {
      molecule: { name: "L-Theanine", molarMass: 174.2 },
      pk: {
        model: "1-compartment",
        bioavailability: 0.95,
        halfLifeMin: 75,
        clearance: {
          renal: { baseCL_mL_min: 180 },
          hepatic: { baseCL_mL_min: 80 },
        },
        volume: { kind: "tbw", fraction: 0.5 },
      },
      pd: [
        { target: "GABA_A", mechanism: "PAM", EC50: 20.0, effectGain: 72.0, unit: "nM" }, // 12 * 6
        {
          target: "NMDA",
          mechanism: "antagonist",
          Ki: 50.0,
          effectGain: 0.42, // 5 * 0.0833
          unit: "µM",
        },
        {
          target: "serotonin",
          mechanism: "agonist",
          EC50: 30.0,
          effectGain: 0.8, // 8 * 0.1
          unit: "nM",
        },
        {
          target: "dopamine",
          mechanism: "agonist",
          EC50: 35.0,
          effectGain: 1.0, // 5 * 0.2
          unit: "nM",
        },
        {
          target: "cortisol",
          mechanism: "antagonist",
          EC50: 25.0,
          effectGain: 6.0,
          unit: "µg/dL",
        },
      ],
    },
    group: "Supplements",
    categories: ["supplements"],
    goals: ["calm", "focus", "mood"],
  },
  {
    key: "lTyrosine",
    label: "L-Tyrosine",
    color: "#60a5fa",
    icon: "💊",
    defaultDurationMin: 240,
    params: [
      {
        key: "mg",
        label: "Dose (mg)",
        type: "slider",
        min: 0,
        max: 2000,
        step: 100,
        default: 500,
      },
    ],
    pharmacology: {
      molecule: { name: "L-Tyrosine", molarMass: 181.19 },
      pk: {
        model: "1-compartment",
        bioavailability: 0.8,
        halfLifeMin: 150,
        volume: { kind: "tbw", fraction: 0.6 },
      },
      pd: [
        // Precursor support for dopamine synthesis
        { target: "dopamine", mechanism: "agonist", effectGain: 1.6, EC50: 25.0, unit: "nM" }, // 8 * 0.2
        { target: "norepi", mechanism: "agonist", effectGain: 37.5, EC50: 25.0, unit: "pg/mL" } // 6 * 6.25
      ],
    },
    group: "Supplements",
    categories: ["supplements"],
    goals: ["focus", "energy"],
  },
  {
    key: "dopaMucuna",
    label: "DOPA Mucuna",
    color: "#818cf8",
    icon: "🌱",
    defaultDurationMin: 240,
    params: [
      {
        key: "mg",
        label: "Dose (mg)",
        type: "slider",
        min: 0,
        max: 1000,
        step: 50,
        default: 200,
      },
    ],
    pharmacology: {
      molecule: { name: "L-Dopa", molarMass: 197.19 },
      pk: {
        model: "1-compartment",
        bioavailability: 0.4,
        halfLifeMin: 120,
        volume: { kind: "tbw", fraction: 0.6 },
      },
      pd: [
        // Direct L-Dopa bypasses rate-limiting step
        { target: "dopamine", mechanism: "agonist", effectGain: 3.6, EC50: 10.0, unit: "nM" } // 18 * 0.2
      ],
    },
    group: "Supplements",
    categories: ["supplements"],
    goals: ["mood", "focus"],
  },
  {
    key: "p5p",
    label: "P-5-P (Active B6)",
    color: "#34d399",
    icon: "💊",
    defaultDurationMin: 480,
    params: [
      {
        key: "mg",
        label: "Dose (mg)",
        type: "slider",
        min: 0,
        max: 100,
        step: 5,
        default: 25,
      },
    ],
    pharmacology: {
      molecule: { name: "Pyridoxal-5-Phosphate", molarMass: 247.14 },
      pk: {
        model: "1-compartment",
        bioavailability: 0.7,
        halfLifeMin: 300,
        volume: { kind: "tbw", fraction: 0.6 },
      },
      pd: [
        // Cofactor support for various neurotransmitters
        { target: "dopamine", mechanism: "agonist", effectGain: 1.2, unit: "nM" }, // 6 * 0.2
        { target: "serotonin", mechanism: "agonist", effectGain: 0.6, unit: "nM" } // 6 * 0.1
      ],
    },
    group: "Supplements",
    categories: ["supplements"],
    goals: ["mood", "focus"],
  },
];