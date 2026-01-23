import type { SignalDefinition } from "../../../engine";
import {
  minuteToPhase,
  hourToPhase,
  gaussianPhase,
  sigmoidPhase,
} from "../../utils";

export const histamine: SignalDefinition = {
  key: "histamine",
  label: "Histamine",
  isPremium: true,
  unit: "nM",
  description:
    "Beyond its role in allergies, histamine in the brain is a powerful alertness chemical.",
  idealTendency: "mid",
  dynamics: {
    setpoint: (ctx: any) => {
      const p = minuteToPhase(ctx.circadianMinuteOfDay);
      const wake = sigmoidPhase(p, hourToPhase(7.5), 1.0);
      const day = gaussianPhase(p, hourToPhase(13), 0.8);
      const nightFall = sigmoidPhase(p, hourToPhase(22), 1.0);
      return 7.5 + 22.5 * wake + 17.5 * day - 15.0 * nightFall;
    },
    tau: 60,
    production: [],
    clearance: [{ type: "enzyme-dependent", rate: 0.02, enzyme: "DAO" }],
    couplings: [
      { source: "melatonin", effect: "inhibit", strength: 0.15 },
      { source: "vip", effect: "stimulate", strength: 0.1 },
    ],
  },
  initialValue: 10,
  min: 0,
  max: 500,
  display: {
    referenceRange: { min: 5, max: 50 },
  },
};
