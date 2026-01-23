import type { SignalDefinition } from "../../../engine";
import {
  minuteToPhase,
  hourToPhase,
  gaussianPhase,
  sigmoidPhase,
} from "../../utils";

export const energy: SignalDefinition = {
  key: "energy",
  label: "Energy",
  unit: "index",
  description:
    "A composite index of your subjective vitality. Driven by fuel availability, arousal chemicals, and your body's overall state, this reflects the 'gas in the tank' you feel for the day's tasks.",
  idealTendency: "higher",
  dynamics: {
    setpoint: (ctx: any) => {
      const p = minuteToPhase(ctx.minuteOfDay);
      const wakeDrive = sigmoidPhase(p, hourToPhase(2), 1.0);
      const afternoonDip = gaussianPhase(p, hourToPhase(9), 1.5);
      const tone = 50.0 + 40.0 * wakeDrive - 15.0 * afternoonDip;
      return tone * (0.8 + 0.2 * (ctx.physiology?.metabolicCapacity ?? 1.0));
    },
    tau: 120,
    production: [
      {
        source: "glucose",
        coefficient: 0.1,
        transform: (G: any) => Math.min(1.0, G / 100),
      },
      { source: "dopamine", coefficient: 0.05 },
      { source: "thyroid", coefficient: 0.5 },
      { source: "estrogen", coefficient: 0.02 },
      { source: "cortisol", coefficient: 0.1 },
    ],
    clearance: [
      {
        type: "linear",
        rate: 0.01,
        transform: (_: any, state: any, ctx: any) => (ctx.isAsleep ? 0.5 : 1.0),
      },
    ],
    couplings: [
      { source: "inflammation", effect: "inhibit", strength: 0.3 },
      { source: "melatonin", effect: "inhibit", strength: 0.05 },
    ],
  },
  initialValue: 50,
  min: 0,
  max: 150,
  display: {
    referenceRange: { min: 40, max: 80 },
  },
};
