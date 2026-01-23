import type { SignalDefinition } from "../../../engine";
import { getMenstrualHormones } from "../../utils";

export const progesterone: SignalDefinition = {
  key: "progesterone",
  label: "Progesterone",
  isPremium: true,
  unit: "ng/mL",
  description:
    "Rising in the second half of the cycle, has a calming effect on the brain.",
  idealTendency: "mid",
  dynamics: {
    setpoint: (ctx: any) => {
      if (ctx.subject.sex === "male") return 0.2;
      const cycleLength = ctx.subject.cycleLength || 28;
      const cycleDay =
        (ctx.subject.cycleDay || 0) +
        Math.floor(ctx.circadianMinuteOfDay / 1440);
      const effectiveDay = cycleDay % cycleLength;
      return (
        0.2 +
        18.0 * getMenstrualHormones(effectiveDay, cycleLength).progesterone
      );
    },
    tau: 120,
    production: [],
    clearance: [{ type: "linear", rate: 0.008 }],
    couplings: [],
  },
  initialValue: 0.5,
  display: {
    referenceRange: { min: 0.1, max: 20 },
  },
};
