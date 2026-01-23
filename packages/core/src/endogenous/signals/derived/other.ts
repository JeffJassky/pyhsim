import type { SignalDefinition } from "../../../engine";
import {
  minuteToPhase,
  hourToPhase,
  gaussianPhase,
  widthToConcentration,
} from "../../utils";

export const inflammation: SignalDefinition = {
  key: "inflammation",
  label: "Inflammation",
  isPremium: true,
  unit: "index",
  description: "A measure of your body's immune activation.",
  idealTendency: "lower",
  dynamics: {
    setpoint: () => 1.0,
    tau: 1440,
    production: [
      {
        source: "constant",
        coefficient: 0.01,
        transform: (_: any, state: any) => {
          const glucose = state.signals.glucose ?? 90;
          return glucose > 150 ? (glucose - 150) / 100 : 0;
        },
      },
      {
        source: "adrenaline",
        coefficient: 0.08,
        transform: (A: any) => (A > 200 ? 1.0 : 0),
      },
    ],
    clearance: [{ type: "linear", rate: 0.0005 }],
    couplings: [{ source: "cortisol", effect: "inhibit", strength: 0.2 }],
  },
  initialValue: 1.0,
  min: 0,
  max: 10,
  display: {
    referenceRange: { min: 0, max: 2 },
  },
};

export const ketone: SignalDefinition = {
  key: "ketone",
  label: "Ketones",
  isPremium: true,
  unit: "mmol/L",
  description:
    "An alternative fuel source made from fat when blood sugar is low.",
  idealTendency: "none",
  dynamics: {
    setpoint: (ctx: any) => {
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
    production: [{ source: "glucagon", coefficient: 0.02 }],
    clearance: [{ type: "linear", rate: 0.01 }],
    couplings: [{ source: "insulin", effect: "inhibit", strength: 0.05 }],
  },
  initialValue: 0.2,
  min: 0,
  max: 8.0,
  display: {
    referenceRange: { min: 0.1, max: 0.5 },
  },
};

export const ethanol: SignalDefinition = {
  key: "ethanol",
  label: "Ethanol",
  isPremium: true,
  unit: "mg/dL",
  description: "Blood alcohol concentration.",
  idealTendency: "lower",
  dynamics: {
    setpoint: () => 0,
    tau: 60,
    production: [],
    clearance: [{ type: "linear", rate: 0.015 }],
    couplings: [],
  },
  initialValue: 0,
  min: 0,
  max: 400,
  display: {
    referenceRange: { min: 0, max: 0 },
  },
};

export const acetaldehyde: SignalDefinition = {
  key: "acetaldehyde",
  label: "Acetaldehyde",
  isPremium: true,
  unit: "µM",
  description: "A toxic byproduct of alcohol metabolism.",
  idealTendency: "lower",
  dynamics: {
    setpoint: () => 0,
    tau: 60,
    production: [{ source: "ethanol", coefficient: 0.3 }],
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

export const magnesium: SignalDefinition = {
  key: "magnesium",
  label: "Magnesium",
  isPremium: true,
  unit: "mg/dL",
  description: "A vital mineral involved in over 300 biochemical reactions.",
  idealTendency: "mid",
  dynamics: {
    setpoint: () => 2.0,
    tau: 10080,
    production: [],
    clearance: [{ type: "linear", rate: 0.0001 }],
    couplings: [{ source: "adrenaline", effect: "inhibit", strength: 0.05 }],
  },
  initialValue: 2.0,
  min: 0,
  max: 5.0,
  display: {
    referenceRange: { min: 1.7, max: 2.3 },
  },
};

export const sensoryLoad: SignalDefinition = {
  key: "sensoryLoad",
  label: "Sensory Load",
  isPremium: true,
  unit: "index",
  description:
    "A measure of the total cognitive and sensory input your brain is currently processing.",
  idealTendency: "lower",
  dynamics: {
    setpoint: () => 0.1,
    tau: 15,
    production: [{ source: "adrenaline", coefficient: 0.2 }],
    clearance: [{ type: "linear", rate: 0.1 }],
    couplings: [{ source: "gaba", effect: "inhibit", strength: 0.15 }],
  },
  initialValue: 0.1,
  min: 0,
  max: 100,
  display: {
    referenceRange: { min: 0, max: 50 },
  },
};

export const oxygen: SignalDefinition = {
  key: "oxygen",
  label: "Oxygen",
  isPremium: true,
  unit: "%",
  description:
    "A measure of how much oxygen your red blood cells are carrying.",
  idealTendency: "higher",
  dynamics: {
    setpoint: () => 50.0,
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
