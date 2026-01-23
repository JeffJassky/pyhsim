import type { SignalDefinition } from "../../../engine";
import {
  minuteToPhase,
  hourToPhase,
  windowPhase,
  gaussianPhase,
  widthToConcentration,
  minutesToPhaseWidth,
} from "../../utils";

export const thyroid: SignalDefinition = {
  key: "thyroid",
  label: "Thyroid",
  isPremium: true,
  unit: "pmol/L",
  description:
    "The body's 'metabolic thermostat.' Thyroid hormones set the pace for how quickly your cells burn energy and produce heat.",
  idealTendency: "mid",
  dynamics: {
    setpoint: (ctx: any) => {
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
    tau: 43200,
    production: [],
    clearance: [],
    couplings: [
      { source: "cortisol", effect: "inhibit", strength: 0.0001 },
      { source: "leptin", effect: "stimulate", strength: 0.0001 },
    ],
  },
  initialValue: 1.0,
  display: {
    referenceRange: { min: 10, max: 25 },
  },
};
