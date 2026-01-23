import type { SignalDefinition } from "../../../engine";
import { minuteToPhase, hourToPhase, gaussianPhase } from "../../utils";

export const endocannabinoid: SignalDefinition = {
  key: "endocannabinoid",
  label: "Endocannabinoid",
  isPremium: true,
  unit: "nM",
  description:
    "Part of your body's internal 'homeostasis' system. Endocannabinoids like anandamide (the 'bliss molecule') help balance other signals, regulating mood, pain perception, and appetite while promoting a sense of calm and balance.",
  idealTendency: "mid",
  dynamics: {
    setpoint: (ctx: any) => {
      const p = minuteToPhase(ctx.circadianMinuteOfDay);
      const morningRise = gaussianPhase(p, hourToPhase(9), 2.0);
      return 4.0 + 6.0 * morningRise;
    },
    tau: 60,
    production: [],
    clearance: [{ type: "linear", rate: 0.02 }],
    couplings: [
      { source: "dopamine", effect: "stimulate", strength: 0.05 },
      { source: "cortisol", effect: "inhibit", strength: 0.033 },
    ],
  },
  initialValue: 5,
  min: 0,
  max: 100,
  display: {
    referenceRange: { min: 1, max: 10 },
  },
};
