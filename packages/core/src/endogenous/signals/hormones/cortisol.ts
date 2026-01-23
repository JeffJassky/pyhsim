import type { SignalDefinition } from "../../../engine";
import {
  minuteToPhase,
  hourToPhase,
  windowPhase,
  gaussianPhase,
} from "../../utils";

export const cortisol: SignalDefinition = {
  key: "cortisol",
  label: "Cortisol",
  unit: "µg/dL",
  description:
    "The body's primary 'readiness' hormone. Cortisol peaks in the morning to help you wake up and mobilize energy. While it's essential for handling stress, chronic high levels can lead to fatigue and metabolic issues.",
  idealTendency: "mid",
  dynamics: {
    setpoint: (ctx: any) => {
      const p = minuteToPhase(ctx.circadianMinuteOfDay);
      const CAR = gaussianPhase(p, hourToPhase(8.75), 1.5);
      const dayComponent = windowPhase(p, hourToPhase(8), hourToPhase(20), 0.5);
      return 2.0 + 18.0 * CAR + 4.0 * dayComponent;
    },
    tau: 20,
    production: [
      {
        source: "constant",
        coefficient: 0.5,
        transform: (_: any, state: any) => state.auxiliary.crhPool ?? 0,
      },
    ],
    clearance: [],
    couplings: [
      { source: "orexin", effect: "stimulate", strength: 0.01 },
      { source: "melatonin", effect: "inhibit", strength: 0.007 },
      { source: "gaba", effect: "inhibit", strength: 0.0045 },
    ],
  },
  initialValue: (ctx: any) => (ctx.isAsleep ? 5 : 12),
  min: 0,
  max: 50,
  display: {
    referenceRange: { min: 5, max: 25 },
  },
};
