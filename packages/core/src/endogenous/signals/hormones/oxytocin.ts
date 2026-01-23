import type { SignalDefinition } from "../../../engine";
import {
  minuteToPhase,
  hourToPhase,
  gaussianPhase,
  sigmoidPhase,
  widthToConcentration,
  minutesToPhaseWidth,
} from "../../utils";

export const oxytocin: SignalDefinition = {
  key: "oxytocin",
  label: "Oxytocin",
  isPremium: true,
  unit: "pg/mL",
  description:
    "The 'bonding hormone,' oxytocin promotes feelings of trust, safety, and social connection.",
  idealTendency: "higher",
  dynamics: {
    setpoint: (ctx: any) => {
      const p = minuteToPhase(ctx.circadianMinuteOfDay);
      const social = gaussianPhase(
        p,
        hourToPhase(11),
        widthToConcentration(260),
      );
      const evening = sigmoidPhase(
        p,
        hourToPhase(19),
        minutesToPhaseWidth(40 * 4),
      );
      return 1.5 + 4.0 * social + 5.0 * evening;
    },
    tau: 20,
    production: [],
    clearance: [{ type: "linear", rate: 0.05 }],
    couplings: [
      { source: "endocannabinoid", effect: "stimulate", strength: 0.002 },
      { source: "serotonin", effect: "stimulate", strength: 0.03 },
    ],
  },
  initialValue: 5,
  display: {
    referenceRange: { min: 1, max: 10 },
  },
};
