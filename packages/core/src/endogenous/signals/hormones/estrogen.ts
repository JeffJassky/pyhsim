import type { SignalDefinition } from "../../../engine";
import { getMenstrualHormones } from "../../utils";

export const estrogen: SignalDefinition = {
  key: "estrogen",
  label: "Estrogen",
  isPremium: true,
  unit: "pg/mL",
  description:
    "The primary female sex hormone, vital for brain health and mood.",
  idealTendency: "mid",
  dynamics: {
    setpoint: (ctx: any) => {
      if (ctx.subject.sex === "male") return 30.0;
      const cycleLength = ctx.subject.cycleLength || 28;
      const cycleDay =
        (ctx.subject.cycleDay || 0) +
        Math.floor(ctx.circadianMinuteOfDay / 1440);
      const effectiveDay = cycleDay % cycleLength;
      return (
        20.0 + 250.0 * getMenstrualHormones(effectiveDay, cycleLength).estrogen
      );
    },
    tau: 120,
    production: [],
    clearance: [{ type: "linear", rate: 0.008 }],
    couplings: [],
  },
  initialValue: 40,
  display: {
    referenceRange: { min: 50, max: 400 },
  },
};
