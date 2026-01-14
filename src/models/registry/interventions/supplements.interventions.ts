import type { InterventionDef } from "@/types";
import { Agents } from "../../physiology/agents";

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
    // DYNAMIC PHARMACOLOGY
    pharmacology: (params) => Agents.Caffeine(Number(params.mg) || 100),
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
    pharmacology: (params) => Agents.Melatonin(Number(params.mg) || 3),
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
    pharmacology: (params) => Agents.LTheanine(Number(params.mg) || 200),
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
