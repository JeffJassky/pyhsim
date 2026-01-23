import type { SignalDefinition } from "../../../engine";
import { minuteToPhase, hourToPhase, gaussianPhase } from "../../utils";

export const serotonin: SignalDefinition = {
  key: "serotonin",
  label: "Serotonin",
  isPremium: true,
  unit: "nM",
  description:
    "The body's natural mood stabilizer. Serotonin helps regulate everything from sleep and appetite to social behavior and contentment. Higher levels are generally associated with a sense of well-being and emotional resilience.",
  idealTendency: "mid",
  dynamics: {
    setpoint: (ctx: any) => {
      const p = minuteToPhase(ctx.circadianMinuteOfDay);
      const lateMorning = gaussianPhase(p, hourToPhase(11), 1.0);
      const afternoon = gaussianPhase(p, hourToPhase(15), 0.8);
      return 2.0 + 2.5 * (lateMorning + afternoon);
    },
    tau: 180,
    production: [
      {
        source: "constant",
        coefficient: 0.002,
        transform: (_: any, state: any) => {
          const precursor = state.auxiliary.serotoninPrecursor ?? 0.7;
          return precursor * 4;
        },
      },
    ],
    clearance: [
      { type: "enzyme-dependent", rate: 0.002, enzyme: "SERT" },
      { type: "enzyme-dependent", rate: 0.001, enzyme: "MAO_A" },
    ],
    couplings: [
      { source: "vip", effect: "stimulate", strength: 0.00016 },
      { source: "cortisol", effect: "inhibit", strength: 0.0009 },
    ],
  },
  initialValue: 5,
  min: 0,
  max: 50,
  display: {
    referenceRange: { min: 1, max: 10 },
  },
};
