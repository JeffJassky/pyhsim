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
import { getMenstrualHormones } from "../../domain/subject";

/**
 * CORTISOL
 * dCortisol/dt = k2 * CRH - k3 * cortisol
 */
export const cortisol: UnifiedSignalDefinition = {
  key: "cortisol",
  label: "Cortisol",
  unit: "µg/dL",
  description: "The body's primary 'readiness' hormone. Cortisol peaks in the morning to help you wake up and mobilize energy. While it's essential for handling stress, chronic high levels can lead to fatigue and metabolic issues.",
  idealTendency: "mid",
  dynamics: {
    setpoint: (ctx) => {
      const p = minuteToPhase(ctx.circadianMinuteOfDay);
      const CAR = gaussianPhase(p, hourToPhase(8.75), 1.5); // Cortisol Awakening Response (8:45 AM)
      const dayComponent = windowPhase(p, hourToPhase(8), hourToPhase(20), 0.5);
      return 2.0 + 18.0 * CAR + 4.0 * dayComponent;
    },
    tau: 20, // 1/0.05
    production: [
      // k2 * CRH
      {
        source: "constant",
        coefficient: 0.5,
        transform: (_, state) => state.auxiliary.crhPool ?? 0,
      },
    ],
    clearance: [], // Handled by tau/setpoint
    couplings: [
      // Analytical was 0.2. 0.2 / 20 = 0.01
      { source: "orexin", effect: "stimulate", strength: 0.01 },
      // Analytical was -0.14. 0.14 / 20 = 0.007
      { source: "melatonin", effect: "inhibit", strength: 0.007 },
      // Analytical was -0.09. 0.09 / 20 = 0.0045
      { source: "gaba", effect: "inhibit", strength: 0.0045 },
    ],
  },
  initialValue: (ctx) => (ctx.isAsleep ? 5 : 12),
  min: 0,
  max: 50,
  display: {
    referenceRange: { min: 5, max: 25 },
  },
};

/**
 * ADRENALINE (Epinephrine)
 * Acute arousal drive
 */
export const adrenaline: UnifiedSignalDefinition = {
  key: "adrenaline",
  label: "Adrenaline",
  isPremium: true,
  unit: "pg/mL",
  description: "The 'acute stress' signal. Adrenaline rapidly increases heart rate and blood pressure while mobilizing sugar for immediate energy. It's the chemical driver of the 'fight or flight' response.",
  idealTendency: "mid",
  dynamics: {
    setpoint: (ctx) => {
      const p = minuteToPhase(ctx.circadianMinuteOfDay);
      return 30.0 + 80.0 * gaussianPhase(p, hourToPhase(10), 2.0); // Mid-morning peak
    },
    tau: 5, // Very fast dynamics (5 min)
    production: [],
    clearance: [{ type: "linear", rate: 0.2 }],
    couplings: [
      // Analytical was 2.0. 2.0 / 5 = 0.4
      { source: "orexin", effect: "stimulate", strength: 0.4 },
      // 0.2 / 0.2 = 1.0
      { source: "dopamine", effect: "stimulate", strength: 1.0 },
      // Analytical was -1.5. 1.5 / 5 = 0.3
      { source: "gaba", effect: "inhibit", strength: 0.3 },
    ],
  },
  initialValue: 30,
  min: 0,
  max: 1000,
  display: {
    referenceRange: { min: 10, max: 100 },
  },
};

/**
 * LEPTIN
 */
export const leptin: UnifiedSignalDefinition = {
  key: "leptin",
  label: "Leptin",
  isPremium: true,
  unit: "ng/mL",
  description: "The 'long-term satiety' signal. Leptin is produced by your fat cells and tells your brain how much stored energy you have. It helps regulate your metabolic rate and long-term appetite balance.",
  idealTendency: "mid",
  dynamics: {
    setpoint: (ctx) =>
      15.0 +
      5.0 * Math.cos(((ctx.circadianMinuteOfDay / 60 - 24) * Math.PI) / 12),
    tau: 1440,
    production: [],
    clearance: [],
    couplings: [{ source: "insulin", effect: "stimulate", strength: 0.05 }],
  },
  initialValue: 15,
  display: {
    referenceRange: { min: 2, max: 15 },
  },
};

/**
 * GHRELIN
 */
export const ghrelin: UnifiedSignalDefinition = {
  key: "ghrelin",
  label: "Ghrelin",
  isPremium: true,
  unit: "pg/mL",
  description: "The 'hunger' hormone. Ghrelin rises before meals to tell your brain it's time to eat and falls after you've had enough. It also influences growth hormone release and reward seeking.",
  idealTendency: "mid",
  dynamics: {
    setpoint: (ctx) => {
      const p = minuteToPhase(ctx.circadianMinuteOfDay);
      const preMeal =
        gaussianPhase(p, hourToPhase(8.5), 1.0) +
        gaussianPhase(p, hourToPhase(13.0), 1.0) +
        gaussianPhase(p, hourToPhase(19.0), 1.0);
      return 400 + 600 * preMeal;
    },
    tau: 60,
    production: [],
    clearance: [
      {
        type: "linear",
        rate: 0.02,
        transform: (_, state) => (state.signals.glucose > 120 ? 2.0 : 1.0),
      },
    ],
    couplings: [
      { source: "leptin", effect: "inhibit", strength: 0.25 }, // -15.0 / 60 = 0.25
      { source: "insulin", effect: "inhibit", strength: 0.033 }, // -2.0 / 60 = 0.033
      { source: "progesterone", effect: "stimulate", strength: 0.33 }, // 20.0 / 60 = 0.33
    ],
  },
  initialValue: 500,
  display: {
    referenceRange: { min: 500, max: 1500 },
  },
};

/**
 * THYROID (Proxy)
 */
export const thyroid: UnifiedSignalDefinition = {
  key: "thyroid",
  label: "Thyroid",
  isPremium: true,
  unit: "pmol/L",
  description: "The body's 'metabolic thermostat.' Thyroid hormones set the pace for how quickly your cells burn energy and produce heat, influencing everything from heart rate to brain function.",
  idealTendency: "mid",
  dynamics: {
    setpoint: (ctx) => {
      const p = minuteToPhase(ctx.circadianMinuteOfDay);
      const active = windowPhase(
        p,
        hourToPhase(8),
        hourToPhase(23),
        minutesToPhaseWidth(80),
      );
      const midday = gaussianPhase(
        p,
        hourToPhase(12),
        widthToConcentration(360),
      );
      const nightDip = gaussianPhase(
        p,
        hourToPhase(2.0),
        widthToConcentration(300),
      );
      return 1.0 + 2.0 * active + 1.5 * midday - 1.2 * nightDip;
    },
    tau: 43200, // 1 month dynamics
    production: [],
    clearance: [],
    couplings: [
      { source: "cortisol", effect: "inhibit", strength: 0.0001 }, // -0.08 / 43200 (approx)
      { source: "leptin", effect: "stimulate", strength: 0.0001 }, // 0.1 / 43200
    ],
  },
  initialValue: 1.0,
  display: {
    referenceRange: { min: 10, max: 25 },
  },
};

/**
 * GROWTH HORMONE
 */
export const growthHormone: UnifiedSignalDefinition = {
  key: "growthHormone",
  label: "Growth Hormone",
  isPremium: true,
  unit: "ng/mL",
  description: "The primary 'repair and recovery' signal. Released mainly during deep sleep and after intense exercise, it stimulates tissue growth, muscle repair, and helps maintain a healthy body composition.",
  idealTendency: "mid",
  dynamics: {
    setpoint: (ctx) => {
      const p = minuteToPhase(ctx.circadianMinuteOfDay);
      const sleepOnset = gaussianPhase(
        p,
        hourToPhase(23.5),
        widthToConcentration(120),
      );
      const rebound = gaussianPhase(
        p,
        hourToPhase(3.0),
        widthToConcentration(90),
      );
      return 0.5 + 8.0 * (sleepOnset + 0.6 * rebound);
    },
    tau: 20,
    production: [
      {
        source: "constant",
        coefficient: 1.0,
        transform: (_, state) => state.auxiliary.ghReserve ?? 0.8,
      },
    ],
    clearance: [{ type: "linear", rate: 0.05 }],
    couplings: [
      { source: "gaba", effect: "stimulate", strength: 0.002 }, // 0.04 / 20 = 0.002
      { source: "ghrelin", effect: "stimulate", strength: 0.0005 }, // 0.01 / 20 = 0.0005
      { source: "cortisol", effect: "inhibit", strength: 0.0075 }, // -0.15 / 20 = 0.0075
    ],
  },
  initialValue: 0.5,
  display: {
    referenceRange: { min: 0.1, max: 10 },
  },
};

export const ghReserve: AuxiliaryDefinition = {
  key: "ghReserve",
  dynamics: {
    setpoint: (ctx) => 0.8,
    tau: 1440,
    production: [
      {
        source: "constant",
        coefficient: 0.001,
        transform: (_, state) => 0.8 - (state.auxiliary.ghReserve ?? 0.8),
      },
    ],
    clearance: [],
  },
  initialValue: 0.8,
};

/**
 * OXYTOCIN
 */
export const oxytocin: UnifiedSignalDefinition = {
  key: "oxytocin",
  label: "Oxytocin",
  isPremium: true,
  unit: "pg/mL",
  description: "Often called the 'bonding hormone,' oxytocin promotes feelings of trust, safety, and social connection. It's also a powerful buffer against stress, helping to lower cortisol levels naturally.",
  idealTendency: "higher",
  dynamics: {
    setpoint: (ctx) => {
      const p = minuteToPhase(ctx.circadianMinuteOfDay);
      const social = gaussianPhase(
        p,
        hourToPhase(11),
        widthToConcentration(260),
      );
      const evening = sigmoidPhase(
        p,
        hourToPhase(19),
        minutesToPhaseWidth(40 * 4),
      );
      return 1.5 + 4.0 * social + 5.0 * evening;
    },
    tau: 20,
    production: [],
    clearance: [{ type: "linear", rate: 0.05 }],
    couplings: [
      { source: "endocannabinoid", effect: "stimulate", strength: 0.002 }, // 0.04 / 20 = 0.002
      // 0.003 / 0.1 = 0.03
      { source: "serotonin", effect: "stimulate", strength: 0.03 },
    ],
  },
  initialValue: 5,
  display: {
    referenceRange: { min: 1, max: 10 },
  },
};

/**
 * PROLACTIN
 */
export const prolactin: UnifiedSignalDefinition = {
  key: "prolactin",
  label: "Prolactin",
  isPremium: true,
  unit: "ng/mL",
  description: "Rising naturally during sleep, prolactin plays a role in immune regulation, metabolic health, and the body's 'rest and digest' state. It's an important part of the nighttime recovery cycle.",
  idealTendency: "mid",
  dynamics: {
    setpoint: (ctx) => {
      const p = minuteToPhase(ctx.circadianMinuteOfDay);
      const prep = sigmoidPhase(
        p,
        hourToPhase(19),
        minutesToPhaseWidth(50 * 4),
      );
      const sleepPulse =
        gaussianPhase(p, hourToPhase(2.0), widthToConcentration(120)) +
        0.8 * gaussianPhase(p, hourToPhase(4.0), widthToConcentration(200));
      return 4.0 + 8.0 * prep + 12.0 * sleepPulse;
    },
    tau: 45,
    production: [],
    clearance: [{ type: "linear", rate: 0.02 }],
    couplings: [
      { source: "gaba", effect: "stimulate", strength: 0.0011 }, // 0.05 / 45 = 0.0011
      // 0.0022 / 0.2 = 0.011
      { source: "dopamine", effect: "inhibit", strength: 0.011 },
    ],
  },
  initialValue: 10,
  display: {
    referenceRange: { min: 5, max: 20 },
  },
};

/**
 * VASOPRESSIN (AVP)
 */
export const vasopressin: UnifiedSignalDefinition = {
  key: "vasopressin",
  label: "Vasopressin",
  isPremium: true,
  unit: "pg/mL",
  description: "The 'antidiuretic' hormone. It regulates your body's water balance and blood pressure. It also acts within the brain to help synchronize internal clocks and social behavior.",
  idealTendency: "mid",
  dynamics: {
    setpoint: (ctx) => {
      const p = minuteToPhase(ctx.circadianMinuteOfDay);
      const couple = gaussianPhase(
        p,
        hourToPhase(8.5),
        widthToConcentration(260),
      );
      const nightRise = windowPhase(
        p,
        hourToPhase(23),
        hourToPhase(7),
        minutesToPhaseWidth(45),
      );
      return 1.8 + 3.5 * couple + 3.5 * nightRise;
    },
    tau: 20,
    production: [],
    clearance: [{ type: "linear", rate: 0.05 }],
    couplings: [],
  },
  initialValue: 5,
  display: {
    referenceRange: { min: 1, max: 5 },
  },
};

/**
 * VIP
 */
export const vip: UnifiedSignalDefinition = {
  key: "vip",
  label: "VIP",
  isPremium: true,
  unit: "pg/mL",
  description: "A master synchronizer for your internal clocks. VIP helps the brain's master clock communicate with other systems, ensuring your digestion, mood, and hormones all stay on the same daily schedule.",
  idealTendency: "mid",
  dynamics: {
    setpoint: (ctx) => {
      const p = minuteToPhase(ctx.circadianMinuteOfDay);
      const day = gaussianPhase(p, hourToPhase(12), widthToConcentration(300));
      const eveningSuppress = windowPhase(
        p,
        hourToPhase(20),
        hourToPhase(8),
        minutesToPhaseWidth(35),
      );
      return 20.0 + 50.0 * day - 25.0 * eveningSuppress;
    },
    tau: 30,
    production: [],
    clearance: [{ type: "linear", rate: 0.03 }],
    couplings: [],
  },
  initialValue: 20,
  display: {
    referenceRange: { min: 0, max: 100 },
  },
};

/**
 * TESTOSTERONE
 */
export const testosterone: UnifiedSignalDefinition = {
  key: "testosterone",
  label: "Testosterone",
  isPremium: true,
  unit: "ng/dL",
  description: "The primary male sex hormone, though important for all genders. It's foundational for muscle mass, bone density, and overall drive. In the brain, it influences confidence, mood, and cognitive focus.",
  idealTendency: "higher",
  dynamics: {
    setpoint: (ctx) => {
      // Age decline: ~1% per year after 30
      const ageFactor = Math.max(
        0.5,
        1 - Math.max(0, ctx.subject.age - 30) * 0.01,
      );

      if (ctx.subject.sex === "male") {
        const p = minuteToPhase(ctx.circadianMinuteOfDay);
        const circadian =
          400.0 +
          300.0 * gaussianPhase(p, hourToPhase(8), widthToConcentration(240));
        return circadian * ageFactor;
      } else {
        return 40.0 * ageFactor;
      }
    },
    tau: 60,
    production: [],
    clearance: [{ type: "linear", rate: 0.015 }],
    couplings: [],
  },
  initialValue: 500,
  display: {
    referenceRange: { min: 300, max: 1000 },
  },
};

/**
 * ESTROGEN
 */
export const estrogen: UnifiedSignalDefinition = {
  key: "estrogen",
  label: "Estrogen",
  isPremium: true,
  unit: "pg/mL",
  description: "The primary female sex hormone. Beyond its role in the menstrual cycle, estrogen is vital for brain health—supporting memory, mood, and protecting neurons from damage.",
  idealTendency: "mid",
  dynamics: {
    setpoint: (ctx) => {
      if (ctx.subject.sex === "male") return 30.0;

      // Cycle dynamics
      const cycleLength = ctx.subject.cycleLength || 28;
      const cycleDay =
        (ctx.subject.cycleDay || 0) +
        Math.floor(ctx.circadianMinuteOfDay / 1440); // Simplified progression
      const effectiveDay = cycleDay % cycleLength;

      return (
        20.0 + 250.0 * getMenstrualHormones(effectiveDay, cycleLength).estrogen
      );
    },
    tau: 120,
    production: [],
    clearance: [{ type: "linear", rate: 0.008 }],
    couplings: [],
  },
  initialValue: 40,
  display: {
    referenceRange: { min: 50, max: 400 },
  },
};

/**
 * PROGESTERONE
 */
export const progesterone: UnifiedSignalDefinition = {
  key: "progesterone",
  label: "Progesterone",
  isPremium: true,
  unit: "ng/mL",
  description: "Rising in the second half of the menstrual cycle, progesterone has a generally calming effect on the brain. It also plays an important role in metabolic health, body temperature, and sleep quality.",
  idealTendency: "mid",
  dynamics: {
    setpoint: (ctx) => {
      if (ctx.subject.sex === "male") return 0.2;

      const cycleLength = ctx.subject.cycleLength || 28;
      const cycleDay =
        (ctx.subject.cycleDay || 0) +
        Math.floor(ctx.circadianMinuteOfDay / 1440);
      const effectiveDay = cycleDay % cycleLength;

      return (
        0.2 +
        18.0 * getMenstrualHormones(effectiveDay, cycleLength).progesterone
      );
    },
    tau: 120,
    production: [],
    clearance: [{ type: "linear", rate: 0.008 }],
    couplings: [],
  },
  initialValue: 0.5,
  display: {
    referenceRange: { min: 0.1, max: 20 },
  },
};

/**
 * LH
 */
export const lh: UnifiedSignalDefinition = {
  key: "lh",
  label: "LH",
  isPremium: true,
  unit: "IU/L",
  description: "Luteinizing hormone. A master control signal from the brain that tells the ovaries or testes to produce their respective sex hormones. It's the primary driver of ovulation in women.",
  idealTendency: "mid",
  dynamics: {
    setpoint: (ctx) => {
      if (ctx.subject.sex === "male") return 5.0;

      const cycleLength = ctx.subject.cycleLength || 28;
      const cycleDay =
        (ctx.subject.cycleDay || 0) +
        Math.floor(ctx.circadianMinuteOfDay / 1440);
      const effectiveDay = cycleDay % cycleLength;

      return 2.0 + 30.0 * getMenstrualHormones(effectiveDay, cycleLength).lh;
    },
    tau: 60,
    production: [],
    clearance: [{ type: "linear", rate: 0.02 }],
    couplings: [],
  },
  initialValue: 5,
  display: {
    referenceRange: { min: 2, max: 15 },
  },
};

/**
 * FSH
 */
export const fsh: UnifiedSignalDefinition = {
  key: "fsh",
  label: "FSH",
  isPremium: true,
  unit: "IU/L",
  description: "Follicle-stimulating hormone. Along with LH, this is a top-level signal from the brain that regulates reproductive health, supporting the development of eggs in women and sperm in men.",
  idealTendency: "mid",
  dynamics: {
    setpoint: (ctx) => {
      if (ctx.subject.sex === "male") return 5.0;

      const cycleLength = ctx.subject.cycleLength || 28;
      const cycleDay =
        (ctx.subject.cycleDay || 0) +
        Math.floor(ctx.circadianMinuteOfDay / 1440);
      const effectiveDay = cycleDay % cycleLength;

      return 3.0 + 12.0 * getMenstrualHormones(effectiveDay, cycleLength).fsh;
    },
    tau: 60,
    production: [],
    clearance: [{ type: "linear", rate: 0.02 }],
    couplings: [],
  },
  initialValue: 5,
  display: {
    referenceRange: { min: 1, max: 10 },
  },
};

/**
 * GLP-1
 */
export const glp1: UnifiedSignalDefinition = {
  key: "glp1",
  label: "GLP-1",
  isPremium: true,
  unit: "pmol/L",
  description: "A powerful gut signal that slows down digestion and tells your brain you're getting full. It helps regulate blood sugar and is the same pathway targeted by new GLP-1 weight loss medications.",
  idealTendency: "higher",
  dynamics: {
    setpoint: (ctx) => {
      const p = minuteToPhase(ctx.circadianMinuteOfDay);
      const bk = gaussianPhase(p, hourToPhase(8.5), widthToConcentration(70));
      const ln = gaussianPhase(p, hourToPhase(13.0), widthToConcentration(80));
      const dn = gaussianPhase(p, hourToPhase(19.0), widthToConcentration(90));
      return Math.min(25, 2.0 + 12.0 * (bk + 0.9 * ln + 0.8 * dn));
    },
    tau: 30,
    production: [],
    clearance: [{ type: "linear", rate: 0.03 }],
    couplings: [
      { source: "insulin", effect: "stimulate", strength: 0.0007 }, // 0.02 / 30 = 0.00067
    ],
  },
  initialValue: 5,
  display: {
    referenceRange: { min: 5, max: 50 },
  },
};

// --- Auxiliary Variables ---

/**
 * CRH POOL
 * dCRH/dt = drive - feedback - 0.1 * CRH
 */
export const crhPool: AuxiliaryDefinition = {
  key: "crhPool",
  dynamics: {
    setpoint: (ctx) => {
      const hour = ctx.circadianMinuteOfDay / 60;
      return 0.5 + 0.5 * Math.cos(((hour - 8) * Math.PI) / 12);
    },
    tau: 10, // 1/0.1
    production: [],
    clearance: [
      {
        type: "linear",
        rate: 0.1,
        transform: (_, state) => {
          const cortisol = state.signals.cortisol;
          const setpoint = 12; // cortisolSetpoint
          return Math.max(0, cortisol - setpoint);
        },
      },
    ],
  },
  initialValue: 1.0,
};

/**
 * CORTISOL INTEGRAL (Allostatic Load)
 */
export const cortisolIntegral: AuxiliaryDefinition = {
  key: "cortisolIntegral",
  dynamics: {
    setpoint: (ctx) => 0,
    tau: 10000, // Very slow decay
    production: [
      {
        source: "constant",
        coefficient: 1.0,
        transform: (_, state) => {
          const cortisol = state.signals.cortisol;
          return cortisol > 18 ? 0.0001 * (cortisol - 12) : 0;
        },
      },
    ],
    clearance: [{ type: "linear", rate: 0.00005 }],
  },
  initialValue: 0,
};
