import type { SignalDefinition } from "../../../engine";
import {
  minuteToPhase,
  hourToPhase,
  gaussianPhase,
  sigmoidPhase,
  widthToConcentration,
  minutesToPhaseWidth,
  windowPhase,
} from "../../utils";

export const hrv: SignalDefinition = {
  key: "hrv",
  label: "HRV",
  isPremium: true,
  unit: "ms",
  description:
    "Heart Rate Variability. A powerful marker of your nervous system's balance and resilience.",
  idealTendency: "higher",
  dynamics: {
    setpoint: (ctx: any) => {
      const p = minuteToPhase(ctx.minuteOfDay);
      const nocturnalRise = gaussianPhase(p, hourToPhase(23), 2.0);
      return 45.0 + 35.0 * nocturnalRise;
    },
    tau: 30,
    production: [{ source: "vagal", coefficient: 40.0 }],
    clearance: [],
    couplings: [
      { source: "adrenaline", effect: "inhibit", strength: 0.1 },
      { source: "norepi", effect: "inhibit", strength: 0.08 },
    ],
  },
  initialValue: 60,
  min: 10,
  max: 150,
  display: {
    referenceRange: { min: 20, max: 100 },
  },
};

export const bloodPressure: SignalDefinition = {
  key: "bloodPressure",
  label: "Blood Pressure",
  isPremium: true,
  unit: "mmHg",
  description: "A proxy for the pressure in your arteries.",
  idealTendency: "mid",
  dynamics: {
    setpoint: (ctx: any) => {
      const p = minuteToPhase(ctx.minuteOfDay);
      const wakeRise = sigmoidPhase(p, hourToPhase(2), 1.0);
      return 100.0 + 20.0 * wakeRise;
    },
    tau: 15,
    production: [],
    clearance: [],
    couplings: [
      { source: "adrenaline", effect: "stimulate", strength: 0.05 },
      { source: "norepi", effect: "stimulate", strength: 0.4 },
      { source: "cortisol", effect: "stimulate", strength: 0.5 },
      { source: "vagal", effect: "inhibit", strength: 10.0 },
    ],
  },
  initialValue: 110,
  min: 70,
  max: 200,
  display: {
    referenceRange: { min: 90, max: 120 },
  },
};

export const vagal: SignalDefinition = {
  key: "vagal",
  label: "Vagal Tone",
  isPremium: true,
  unit: "index",
  description: "A marker of your 'rest and digest' system's activity.",
  idealTendency: "higher",
  dynamics: {
    setpoint: (ctx: any) => {
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
      { source: "oxytocin", effect: "stimulate", strength: 0.04 },
      { source: "gaba", effect: "stimulate", strength: 0.006 },
      { source: "adrenaline", effect: "inhibit", strength: 0.002 },
      { source: "cortisol", effect: "inhibit", strength: 0.01 },
    ],
  },
  initialValue: 0.5,
  min: 0,
  max: 1.5,
  display: {
    referenceRange: { min: 0.3, max: 0.7 },
  },
};
