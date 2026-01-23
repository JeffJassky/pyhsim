import type { SignalDefinition } from "../../../engine";
import { minuteToPhase, hourToPhase, sigmoidPhase } from "../../utils";

export const gaba: SignalDefinition = {
  key: "gaba",
  label: "GABA",
  isPremium: true,
  unit: "nM",
  description:
    "The brain's primary 'off' switch. GABA reduces the activity of neurons, acting as a natural brake to prevent overstimulation. It's essential for relaxation, reducing anxiety, and falling asleep.",
  idealTendency: "mid",
  dynamics: {
    setpoint: (ctx: any) => {
      const p = minuteToPhase(ctx.circadianMinuteOfDay);
      const eveningRise = sigmoidPhase(p, hourToPhase(21), 1.0);
      return 240.0 + 180.0 * eveningRise;
    },
    tau: 120,
    production: [
      {
        source: "constant",
        coefficient: 0.0015,
        transform: (_: any, state: any) =>
          (state.auxiliary.gabaPool ?? 0.7) * 300,
      },
    ],
    clearance: [{ type: "enzyme-dependent", rate: 0.002, enzyme: "GAT1" }],
    couplings: [
      { source: "melatonin", effect: "stimulate", strength: 0.6 },
      { source: "glutamate", effect: "inhibit", strength: 3.6 },
    ],
  },
  initialValue: 300,
  min: 0,
  max: 2000,
  display: {
    referenceRange: { min: 100, max: 500 },
  },
};
