import type { SignalDefinition } from "../../../engine";
import { minuteToPhase, hourToPhase, gaussianPhase } from "../../utils";

export const glucagon: SignalDefinition = {
  key: "glucagon",
  label: "Glucagon",
  isPremium: true,
  unit: "pg/mL",
  description: "The 'mobilization' hormone. Released when blood sugar is low.",
  idealTendency: "mid",
  dynamics: {
    setpoint: (ctx: any) => {
      const p = minuteToPhase(ctx.circadianMinuteOfDay);
      const nocturnal =
        gaussianPhase(p, hourToPhase(23), 1.0) +
        0.8 * gaussianPhase(p, hourToPhase(1.5), 0.8);
      const daytimeSuppression = gaussianPhase(p, hourToPhase(7.5), 0.5);
      return 40 + 35 * nocturnal - 15 * daytimeSuppression;
    },
    tau: 60,
    production: [{ source: "cortisol", coefficient: 0.033 }],
    clearance: [{ type: "linear", rate: 0.02 }],
    couplings: [{ source: "insulin", effect: "inhibit", strength: 0.0083 }],
  },
  initialValue: 50,
  min: 20,
  max: 150,
  display: {
    referenceRange: { min: 50, max: 150 },
  },
};
