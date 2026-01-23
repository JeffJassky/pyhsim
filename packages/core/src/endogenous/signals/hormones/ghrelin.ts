import type { SignalDefinition } from "../../../engine";
import { minuteToPhase, hourToPhase, gaussianPhase } from "../../utils";

export const ghrelin: SignalDefinition = {
  key: "ghrelin",
  label: "Ghrelin",
  isPremium: true,
  unit: "pg/mL",
  description:
    "The 'hunger' hormone. Ghrelin rises before meals to tell your brain it's time to eat and falls after you've had enough.",
  idealTendency: "mid",
  dynamics: {
    setpoint: (ctx: any) => {
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
        transform: (_: any, state: any) =>
          state.signals.glucose > 120 ? 2.0 : 1.0,
      },
    ],
    couplings: [
      { source: "leptin", effect: "inhibit", strength: 0.25 },
      { source: "insulin", effect: "inhibit", strength: 0.033 },
      { source: "progesterone", effect: "stimulate", strength: 0.33 },
    ],
  },
  initialValue: 500,
  display: {
    referenceRange: { min: 500, max: 1500 },
  },
};
