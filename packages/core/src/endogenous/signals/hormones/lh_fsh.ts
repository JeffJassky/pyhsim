import type { SignalDefinition } from "../../../engine";
import { getMenstrualHormones } from "../../utils";

export const lh: SignalDefinition = {
  key: "lh",
  label: "LH",
  isPremium: true,
  unit: "IU/L",
  description: "Luteinizing hormone, driver of ovulation in women.",
  idealTendency: "mid",
  dynamics: {
    setpoint: (ctx: any) => {
      if (ctx.subject.sex === "male") return 5.0;
      const cycleLength = ctx.subject.cycleLength || 28;
      const cycleDay =
        (ctx.subject.cycleDay || 0) +
        Math.floor(ctx.circadianMinuteOfDay / 1440);
      const effectiveDay = cycleDay % cycleLength;
      return 2.0 + 30.0 * getMenstrualHormones(effectiveDay, cycleLength).lh;
    },
    tau: 60,
    production: [],
    clearance: [{ type: "linear", rate: 0.02 }],
    couplings: [],
  },
  initialValue: 5,
  display: {
    referenceRange: { min: 2, max: 15 },
  },
};

export const fsh: SignalDefinition = {
  key: "fsh",
  label: "FSH",
  isPremium: true,
  unit: "IU/L",
  description: "Follicle-stimulating hormone, regulates reproductive health.",
  idealTendency: "mid",
  dynamics: {
    setpoint: (ctx: any) => {
      if (ctx.subject.sex === "male") return 5.0;
      const cycleLength = ctx.subject.cycleLength || 28;
      const cycleDay =
        (ctx.subject.cycleDay || 0) +
        Math.floor(ctx.circadianMinuteOfDay / 1440);
      const effectiveDay = cycleDay % cycleLength;
      return 3.0 + 12.0 * getMenstrualHormones(effectiveDay, cycleLength).fsh;
    },
    tau: 60,
    production: [],
    clearance: [{ type: "linear", rate: 0.02 }],
    couplings: [],
  },
  initialValue: 5,
  display: {
    referenceRange: { min: 1, max: 10 },
  },
};
