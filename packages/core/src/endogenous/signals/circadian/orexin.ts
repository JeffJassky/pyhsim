import type { SignalDefinition } from "../../../engine";
import {
  minuteToPhase,
  hourToPhase,
  gaussianPhase,
  sigmoidPhase,
} from "../../utils";

export const orexin: SignalDefinition = {
  key: "orexin",
  label: "Orexin",
  isPremium: true,
  unit: "pg/mL",
  description: "The brain's master 'wakefulness' switch.",
  idealTendency: "mid",
  dynamics: {
    setpoint: (ctx: any) => {
      const p = minuteToPhase(ctx.circadianMinuteOfDay);
      const wakeDrive = sigmoidPhase(p, hourToPhase(7.8), 1.0);
      const feedingCue =
        gaussianPhase(p, hourToPhase(12.5), 0.5) +
        0.6 * gaussianPhase(p, hourToPhase(18.5), 0.8);
      const sleepPressure = sigmoidPhase(p, hourToPhase(22.5), 1.0);
      return (
        250.0 + 150.0 * wakeDrive + 80.0 * feedingCue - 100.0 * sleepPressure
      );
    },
    tau: 90,
    production: [],
    clearance: [{ type: "linear", rate: 0.01 }],
    couplings: [
      { source: "melatonin", effect: "inhibit", strength: 0.4 },
      { source: "ghrelin", effect: "stimulate", strength: 0.05 },
      { source: "dopamine", effect: "stimulate", strength: 1.5 },
    ],
  },
  initialValue: 250,
  min: 100,
  max: 600,
  display: {
    referenceRange: { min: 200, max: 600 },
  },
};
