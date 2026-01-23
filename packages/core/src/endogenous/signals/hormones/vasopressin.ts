import type { SignalDefinition } from "../../../engine";
import {
  minuteToPhase,
  hourToPhase,
  windowPhase,
  gaussianPhase,
  widthToConcentration,
  minutesToPhaseWidth,
} from "../../utils";

export const vasopressin: SignalDefinition = {
  key: "vasopressin",
  label: "Vasopressin",
  isPremium: true,
  unit: "pg/mL",
  description:
    "The 'antidiuretic' hormone. It regulates your body's water balance and blood pressure.",
  idealTendency: "mid",
  dynamics: {
    setpoint: (ctx: any) => {
      const p = minuteToPhase(ctx.circadianMinuteOfDay);
      const couple = gaussianPhase(
        p,
        hourToPhase(8.5),
        widthToConcentration(260),
      );
      const nightRise = windowPhase(
        p,
        hourToPhase(23),
        hourToPhase(7),
        minutesToPhaseWidth(45),
      );
      return 1.8 + 3.5 * couple + 3.5 * nightRise;
    },
    tau: 20,
    production: [],
    clearance: [{ type: "linear", rate: 0.05 }],
    couplings: [],
  },
  initialValue: 5,
  display: {
    referenceRange: { min: 1, max: 5 },
  },
};
