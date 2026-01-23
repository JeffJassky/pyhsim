import type { SignalDefinition } from "../../../engine";
import { minuteToPhase, hourToPhase, gaussianPhase } from "../../utils";

export const adrenaline: SignalDefinition = {
  key: "adrenaline",
  label: "Adrenaline",
  isPremium: true,
  unit: "pg/mL",
  description:
    "The 'acute stress' signal. Adrenaline rapidly increases heart rate and blood pressure while mobilizing sugar for immediate energy. It's the chemical driver of the 'fight or flight' response.",
  idealTendency: "mid",
  dynamics: {
    setpoint: (ctx: any) => {
      const p = minuteToPhase(ctx.circadianMinuteOfDay);
      return 30.0 + 80.0 * gaussianPhase(p, hourToPhase(10), 2.0);
    },
    tau: 5,
    production: [],
    clearance: [{ type: "linear", rate: 0.2 }],
    couplings: [
      { source: "orexin", effect: "stimulate", strength: 0.4 },
      { source: "dopamine", effect: "stimulate", strength: 1.0 },
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
