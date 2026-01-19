import type {
  UnifiedSignalDefinition,
  AuxiliaryDefinition,
} from "@/types/unified";
import {
  minuteToPhase,
  hourToPhase,
  windowPhase,
  gaussianPhase,
  sigmoidPhase,
  widthToConcentration,
  minutesToPhaseWidth,
} from "../utils";

/**
 * ENERGY (Composite)
 */
export const energy: UnifiedSignalDefinition = {
  key: "energy",
  label: "Energy",
  unit: "index",
  description: "A composite index of your subjective vitality. Driven by fuel availability, arousal chemicals, and your body's overall state, this reflects the 'gas in the tank' you feel for the day's tasks.",
  idealTendency: "higher",
  dynamics: {
    setpoint: (ctx) => {
      const p = minuteToPhase(ctx.minuteOfDay);
      const wakeDrive = sigmoidPhase(p, hourToPhase(2), 1.0);
      const afternoonDip = gaussianPhase(p, hourToPhase(9), 1.5);
      const tone = 50.0 + 40.0 * wakeDrive - 15.0 * afternoonDip;
      // Scale by metabolic capacity if available
      return tone * (0.8 + 0.2 * (ctx.physiology?.metabolicCapacity ?? 1.0));
    },
    tau: 120,
    production: [
      {
        source: "glucose",
        coefficient: 0.1,
        transform: (G) => Math.min(1.0, G / 100),
      },
      { source: "dopamine", coefficient: 0.05 }, // 3.0 / 50 = 0.06
      { source: "thyroid", coefficient: 0.5 }, // 1.0 / 2.0 = 0.5
      { source: "estrogen", coefficient: 0.02 }, // 2.0 / 100 = 0.02
      { source: "cortisol", coefficient: 0.1 }, // Moderate cortisol supports energy
    ],
    clearance: [
      {
        type: "linear",
        rate: 0.01,
        transform: (_, state, ctx) => (ctx.isAsleep ? 0.5 : 1.0),
      },
    ],
    couplings: [
      { source: "inflammation", effect: "inhibit", strength: 0.3 },
      { source: "melatonin", effect: "inhibit", strength: 0.05 }, // -4.0 / 80 = 0.05
    ],
  },
  initialValue: 50,
  min: 0,
  max: 150,
  display: {
    referenceRange: { min: 40, max: 80 },
  },
};

/**
 * HRV (Heart Rate Variability)
 */
export const hrv: UnifiedSignalDefinition = {
  key: "hrv",
  label: "HRV",
  unit: "ms",
  description: "Heart Rate Variability. A powerful marker of your nervous system's balance and resilience. Higher values generally indicate that your body is well-recovered and ready to handle physical or mental stress.",
  idealTendency: "higher",
  dynamics: {
    setpoint: (ctx) => {
      const p = minuteToPhase(ctx.minuteOfDay);
      const nocturnalRise = gaussianPhase(p, hourToPhase(23), 2.0);
      return 45.0 + 35.0 * nocturnalRise;
    },
    tau: 30,
    production: [
      { source: "vagal", coefficient: 40.0 }, // 40.0 from signals.ts
    ],
    clearance: [],
    couplings: [
      { source: "adrenaline", effect: "inhibit", strength: 0.1 }, // -0.1
      { source: "norepi", effect: "inhibit", strength: 0.08 }, // -0.08
    ],
  },
  initialValue: 60,
  min: 10,
  max: 150,
  display: {
    referenceRange: { min: 20, max: 100 },
  },
};

/**
 * BLOOD PRESSURE
 */
export const bloodPressure: UnifiedSignalDefinition = {
  key: "bloodPressure",
  label: "Blood Pressure",
  unit: "mmHg",
  description: "A proxy for the pressure in your arteries. Influenced by stress hormones, physical activity, and fluid balance, it reflects the immediate workload on your heart and cardiovascular system.",
  idealTendency: "mid",
  dynamics: {
    setpoint: (ctx) => {
      const p = minuteToPhase(ctx.minuteOfDay);
      const wakeRise = sigmoidPhase(p, hourToPhase(2), 1.0);
      return 100.0 + 20.0 * wakeRise;
    },
    tau: 15,
    production: [],
    clearance: [],
    couplings: [
      { source: "adrenaline", effect: "stimulate", strength: 0.05 }, // 0.05
      { source: "norepi", effect: "stimulate", strength: 0.4 }, // 0.4
      { source: "cortisol", effect: "stimulate", strength: 0.5 }, // 0.5
      { source: "vagal", effect: "inhibit", strength: 10.0 }, // -10.0
    ],
  },
  initialValue: 110,
  min: 70,
  max: 200,
  display: {
    referenceRange: { min: 90, max: 120 },
  },
};

/**
 * INFLAMMATION
 */
export const inflammation: UnifiedSignalDefinition = {
  key: "inflammation",
  label: "Inflammation",
  unit: "index",
  description: "A measure of your body's immune activation. While acute inflammation is part of healing, chronic high levels are a key driver of long-term health issues, fatigue, and reduced mental performance.",
  idealTendency: "lower",
  dynamics: {
    setpoint: (ctx) => 1.0,
    tau: 1440, // Slow dynamics (1 day)
    production: [
      {
        source: "constant",
        coefficient: 0.01,
        transform: (_, state) => {
          const glucose = state.signals.glucose ?? 90;
          return glucose > 150 ? (glucose - 150) / 100 : 0;
        },
      },
      {
        source: "adrenaline",
        coefficient: 0.08,
        transform: (A) => (A > 200 ? 1.0 : 0),
      }, // Acute stress spike
    ],
    clearance: [{ type: "linear", rate: 0.0005 }],
    couplings: [
      { source: "cortisol", effect: "inhibit", strength: 0.2 }, // -0.2
    ],
  },
  initialValue: 1.0,
  min: 0,
  max: 10,
  display: {
    referenceRange: { min: 0, max: 2 },
  },
};

/**
 * BDNF
 */
export const bdnf: UnifiedSignalDefinition = {
  key: "bdnf",
  label: "BDNF",
  unit: "ng/mL",
  description: "Often called 'brain fertilizer,' BDNF supports the survival of existing neurons and encourages the growth of new ones. It's essential for learning, memory, and overall cognitive health.",
  idealTendency: "higher",
  dynamics: {
    setpoint: (ctx) => 25.0,
    tau: 480,
    production: [
      { source: "growthHormone", coefficient: 0.5 }, // 0.5
      {
        source: "constant",
        coefficient: 0.005,
        transform: (_, state) => state.auxiliary.bdnfExpression ?? 0.6,
      },
    ],
    clearance: [{ type: "linear", rate: 0.002 }],
    couplings: [
      { source: "cortisol", effect: "inhibit", strength: 0.3 }, // -0.3
    ],
  },
  initialValue: 25.0,
  min: 0,
  max: 100,
  display: {
    referenceRange: { min: 10, max: 30 },
  },
};

export const bdnfExpression: AuxiliaryDefinition = {
  key: "bdnfExpression",
  dynamics: {
    setpoint: (ctx) => 0.6,
    tau: 2880, // 2 days
    production: [
      { source: "constant", coefficient: 0.001, transform: (_, state) => 0 },
    ],
    clearance: [{ type: "linear", rate: 0.0001 }],
  },
  initialValue: 0.6,
};

/**
 * VAGAL TONE
 */
export const vagal: UnifiedSignalDefinition = {
  key: "vagal",
  label: "Vagal Tone",
  unit: "index",
  description: "A marker of your 'rest and digest' system's activity. High vagal tone helps you stay calm, recover from stress quickly, and maintains efficient digestion and heart rate regulation.",
  idealTendency: "higher",
  dynamics: {
    setpoint: (ctx) => {
      const p = minuteToPhase(ctx.minuteOfDay);
      const parasym = windowPhase(
        p,
        hourToPhase(13),
        hourToPhase(7),
        minutesToPhaseWidth(60),
      );
      const drop = gaussianPhase(p, hourToPhase(1), widthToConcentration(60));
      return 0.4 + 0.35 * parasym - 0.15 * drop;
    },
    tau: 30,
    production: [],
    clearance: [{ type: "linear", rate: 0.05 }],
    couplings: [
      { source: "oxytocin", effect: "stimulate", strength: 0.04 }, // 0.04
      { source: "gaba", effect: "stimulate", strength: 0.006 }, // 0.006
      { source: "adrenaline", effect: "inhibit", strength: 0.002 }, // -0.002
      { source: "cortisol", effect: "inhibit", strength: 0.01 }, // -0.01
    ],
  },
  initialValue: 0.5,
  min: 0,
  max: 1.5,
  display: {
    referenceRange: { min: 0.3, max: 0.7 },
  },
};

/**
 * KETONES
 */
export const ketone: UnifiedSignalDefinition = {
  key: "ketone",
  label: "Ketones",
  unit: "mmol/L",
  description: "An alternative fuel source made from fat when blood sugar is low. Often associated with sustained mental clarity and physical endurance, ketones signal that your body is in 'fat-burning' mode.",
  idealTendency: "none",
  dynamics: {
    setpoint: (ctx) => {
      const p = minuteToPhase(ctx.minuteOfDay);
      const overnight =
        gaussianPhase(p, hourToPhase(19.5), widthToConcentration(400)) +
        gaussianPhase(p, hourToPhase(22.5), widthToConcentration(260));
      const daySuppression = gaussianPhase(
        p,
        hourToPhase(7.5),
        widthToConcentration(300),
      );
      const tone = 0.3 + 1.2 * overnight - 0.5 * daySuppression;
      return Math.max(0.1, tone);
    },
    tau: 480,
    production: [
      { source: "glucagon", coefficient: 0.02 }, // 0.02
    ],
    clearance: [{ type: "linear", rate: 0.01 }],
    couplings: [
      { source: "insulin", effect: "inhibit", strength: 0.05 }, // -0.05
    ],
  },
  initialValue: 0.2,
  min: 0,
  max: 8.0,
  display: {
    referenceRange: { min: 0.1, max: 0.5 },
  },
};

/**
 * ETHANOL
 */
export const ethanol: UnifiedSignalDefinition = {
  key: "ethanol",
  label: "Ethanol",
  unit: "mg/dL",
  description: "Blood alcohol concentration. High levels impact coordination, judgment, and trigger systemic inflammatory responses throughout the body.",
  idealTendency: "lower",
  dynamics: {
    setpoint: (ctx) => 0,
    tau: 60,
    production: [], // Added via interventions
    clearance: [
      { type: "linear", rate: 0.015 }, // ~1 unit per hour
    ],
    couplings: [],
  },
  initialValue: 0,
  min: 0,
  max: 400,
  display: {
    referenceRange: { min: 0, max: 0 },
  },
};

/**
 * ACETALDEHYDE
 */
export const acetaldehyde: UnifiedSignalDefinition = {
  key: "acetaldehyde",
  label: "Acetaldehyde",
  unit: "µM",
  description: "A toxic byproduct of alcohol metabolism. It is responsible for many of the immediate negative effects of drinking, including headaches, nausea, and 'hangover' symptoms.",
  idealTendency: "lower",
  dynamics: {
    setpoint: (ctx) => 0,
    tau: 60,
    production: [
      { source: "ethanol", coefficient: 0.3 }, // 0.3
    ],
    clearance: [{ type: "linear", rate: 0.03 }],
    couplings: [],
  },
  initialValue: 0,
  min: 0,
  max: 50,
  display: {
    referenceRange: { min: 0, max: 2 },
  },
};

/**
 * MAGNESIUM
 */
export const magnesium: UnifiedSignalDefinition = {
  key: "magnesium",
  label: "Magnesium",
  unit: "mg/dL",
  description: "A vital mineral involved in over 300 biochemical reactions. It's essential for muscle and nerve function, blood sugar control, and supporting a calm, steady mood.",
  idealTendency: "mid",
  dynamics: {
    setpoint: (ctx) => 2.0,
    tau: 10080, // Very slow
    production: [],
    clearance: [{ type: "linear", rate: 0.0001 }],
    couplings: [
      { source: "adrenaline", effect: "inhibit", strength: 0.05 }, // -0.05
    ],
  },
  initialValue: 2.0,
  min: 0,
  max: 5.0,
  display: {
    referenceRange: { min: 1.7, max: 2.3 },
  },
};

/**
 * SENSORY LOAD
 */
export const sensoryLoad: UnifiedSignalDefinition = {
  key: "sensoryLoad",
  label: "Sensory Load",
  unit: "index",
  description: "A measure of the total cognitive and sensory input your brain is currently processing. High levels can lead to feelings of overwhelm, mental fatigue, and reduced focus.",
  idealTendency: "lower",
  dynamics: {
    setpoint: (ctx) => 0.1,
    tau: 15,
    production: [
      { source: "adrenaline", coefficient: 0.2 }, // 0.2
    ],
    clearance: [{ type: "linear", rate: 0.1 }],
    couplings: [
      { source: "gaba", effect: "inhibit", strength: 0.15 }, // -0.15
    ],
  },
  initialValue: 0.1,
  min: 0,
  max: 100,
  display: {
    referenceRange: { min: 0, max: 50 },
  },
};

/**
 * mTOR
 */
export const mtor: UnifiedSignalDefinition = {
  key: "mtor",
  label: "mTOR",
  unit: "fold-change",
  description: "The body's primary 'build and grow' pathway. It's the master sensor for protein and energy availability, signaling your cells to grow, repair, and build new muscle tissue.",
  idealTendency: "mid",
  dynamics: {
    setpoint: (ctx) => 1.0,
    tau: 1440,
    production: [
      { source: "insulin", coefficient: 0.03 }, // 0.03
    ],
    clearance: [{ type: "linear", rate: 0.01 }],
    couplings: [],
  },
  initialValue: 1.0,
  min: 0,
  max: 5,
  display: {
    referenceRange: { min: 0.2, max: 0.8 },
  },
};

/**
 * AMPK
 */
export const ampk: UnifiedSignalDefinition = {
  key: "ampk",
  label: "AMPK",
  unit: "fold-change",
  description: "Your body's 'energy sensor' and fuel gauge. Activated when energy is low, it tells your cells to stop growing and start burning fat and clearing out cellular waste (autophagy).",
  idealTendency: "mid",
  dynamics: {
    setpoint: (ctx) => 1.0,
    tau: 1440,
    production: [
      { source: "glucagon", coefficient: 0.01 }, // 0.01
    ],
    clearance: [{ type: "linear", rate: 0.01 }],
    couplings: [
      { source: "insulin", effect: "inhibit", strength: 0.04 }, // -0.04
    ],
  },
  initialValue: 1.0,
  min: 0,
  max: 5,
  display: {
    referenceRange: { min: 0.2, max: 0.8 },
  },
};

/**
 * OXYGEN
 */
export const oxygen: UnifiedSignalDefinition = {
  key: "oxygen",
  label: "Oxygen",
  unit: "%",
  description: "A measure of how much oxygen your red blood cells are carrying. Maintaining high levels is essential for fueling your brain and muscles during both rest and intense activity.",
  idealTendency: "higher",
  dynamics: {
    setpoint: (ctx) => 50.0,
    tau: 5,
    production: [],
    clearance: [{ type: "linear", rate: 0.2 }],
    couplings: [],
  },
  initialValue: 50,
  min: 0,
  max: 100,
  display: {
    referenceRange: { min: 95, max: 100 },
  },
};
