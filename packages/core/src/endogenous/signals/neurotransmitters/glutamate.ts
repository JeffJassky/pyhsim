import type { SignalDefinition } from "../../../engine";
import { minuteToPhase, hourToPhase, sigmoidPhase } from "../../utils";

export const glutamate: SignalDefinition = {
  key: "glutamate",
  label: "Glutamate",
  isPremium: true,
  unit: "µM",
  description:
    "The most abundant 'on' switch in your brain. Glutamate is the gas pedal for neural activity, playing a central role in learning, memory, and fast communication between neurons. Balance is key, as too much can cause over-excitement.",
  idealTendency: "mid",
  dynamics: {
    setpoint: (ctx: any) => {
      const p = minuteToPhase(ctx.circadianMinuteOfDay);
      const wakeDrive = sigmoidPhase(p, hourToPhase(9), 1.0);
      return 2.5 + 4.16 * wakeDrive;
    },
    tau: 60,
    production: [
      {
        source: "constant",
        coefficient: 0.003,
        transform: (_: any, state: any) =>
          (state.auxiliary.glutamatePool ?? 0.7) * 5,
      },
    ],
    clearance: [{ type: "enzyme-dependent", rate: 0.004, enzyme: "GLT1" }],
    couplings: [
      { source: "norepi", effect: "stimulate", strength: 0.00067 },
      { source: "gaba", effect: "inhibit", strength: 0.0014 },
    ],
  },
  initialValue: 5,
  min: 0,
  max: 100,
  display: {
    referenceRange: { min: 1, max: 10 },
  },
};
