import type { SignalDefinition } from "../../../engine";
import {
  minuteToPhase,
  hourToPhase,
  gaussianPhase,
  widthToConcentration,
} from "../../utils";

export const testosterone: SignalDefinition = {
  key: "testosterone",
  label: "Testosterone",
  isPremium: true,
  unit: "ng/dL",
  description:
    "The primary male sex hormone, foundational for muscle mass, bone density, and drive.",
  idealTendency: "higher",
  dynamics: {
    setpoint: (ctx: any) => {
      const ageFactor = Math.max(
        0.5,
        1 - Math.max(0, ctx.subject.age - 30) * 0.01,
      );
      if (ctx.subject.sex === "male") {
        const p = minuteToPhase(ctx.circadianMinuteOfDay);
        const circadian =
          400.0 +
          300.0 * gaussianPhase(p, hourToPhase(8), widthToConcentration(240));
        return circadian * ageFactor;
      } else {
        return 40.0 * ageFactor;
      }
    },
    tau: 60,
    production: [],
    clearance: [{ type: "linear", rate: 0.015 }],
    couplings: [],
  },
  initialValue: 500,
  display: {
    referenceRange: { min: 300, max: 1000 },
  },
};
