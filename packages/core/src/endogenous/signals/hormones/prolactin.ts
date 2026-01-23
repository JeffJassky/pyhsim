import type { SignalDefinition } from "../../../engine";
import {
  minuteToPhase,
  hourToPhase,
  gaussianPhase,
  sigmoidPhase,
  widthToConcentration,
  minutesToPhaseWidth,
} from "../../utils";

export const prolactin: SignalDefinition = {
  key: "prolactin",
  label: "Prolactin",
  isPremium: true,
  unit: "ng/mL",
  description:
    "Plays a role in immune regulation, metabolic health, and the body's 'rest and digest' state.",
  idealTendency: "mid",
  dynamics: {
    setpoint: (ctx: any) => {
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
      { source: "gaba", effect: "stimulate", strength: 0.0011 },
      { source: "dopamine", effect: "inhibit", strength: 0.011 },
    ],
  },
  initialValue: 10,
  display: {
    referenceRange: { min: 5, max: 20 },
  },
};
