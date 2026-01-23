import type { SignalDefinition } from "../../../engine";
import { minuteToPhase, hourToPhase, windowPhase } from "../../utils";

export const acetylcholine: SignalDefinition = {
  key: "acetylcholine",
  label: "Acetylcholine",
  isPremium: true,
  unit: "nM",
  description:
    "A critical messenger for both your brain and your muscles. In the brain, it supports learning, memory, and sustained attention. It's often associated with 'speed of thought' and your ability to process new information quickly.",
  idealTendency: "mid",
  dynamics: {
    setpoint: (ctx: any) => {
      const p = minuteToPhase(ctx.circadianMinuteOfDay);
      const remDrive = ctx.isAsleep ? 0.8 : 0.4;
      const wakeFocus = windowPhase(p, hourToPhase(10), hourToPhase(12), 0.5);
      return 7.5 + 10.0 * wakeFocus + 7.5 * remDrive;
    },
    tau: 45,
    production: [],
    clearance: [{ type: "enzyme-dependent", rate: 0.02, enzyme: "AChE" }],
    couplings: [{ source: "orexin", effect: "stimulate", strength: 0.0375 }],
  },
  initialValue: 10,
  min: 0,
  max: 100,
  display: {
    referenceRange: { min: 1, max: 20 },
  },
};
