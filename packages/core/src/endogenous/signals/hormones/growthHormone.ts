import type { SignalDefinition, AuxiliaryDefinition } from "../../../engine";
import {
  minuteToPhase,
  hourToPhase,
  gaussianPhase,
  widthToConcentration,
} from "../../utils";

export const growthHormone: SignalDefinition = {
  key: "growthHormone",
  label: "Growth Hormone",
  isPremium: true,
  unit: "ng/mL",
  description:
    "The primary 'repair and recovery' signal. Released mainly during deep sleep and after intense exercise.",
  idealTendency: "mid",
  dynamics: {
    setpoint: (ctx: any) => {
      const p = minuteToPhase(ctx.circadianMinuteOfDay);
      const sleepOnset = gaussianPhase(
        p,
        hourToPhase(23.5),
        widthToConcentration(120),
      );
      const rebound = gaussianPhase(
        p,
        hourToPhase(3.0),
        widthToConcentration(90),
      );
      return 0.5 + 8.0 * (sleepOnset + 0.6 * rebound);
    },
    tau: 20,
    production: [
      {
        source: "constant",
        coefficient: 1.0,
        transform: (_: any, state: any) => state.auxiliary.ghReserve ?? 0.8,
      },
    ],
    clearance: [{ type: "linear", rate: 0.05 }],
    couplings: [
      { source: "gaba", effect: "stimulate", strength: 0.002 },
      { source: "ghrelin", effect: "stimulate", strength: 0.0005 },
      { source: "cortisol", effect: "inhibit", strength: 0.0075 },
    ],
  },
  initialValue: 0.5,
  display: {
    referenceRange: { min: 0.1, max: 10 },
  },
};

export const ghReserve: AuxiliaryDefinition = {
  key: "ghReserve",
  dynamics: {
    setpoint: () => 0.8,
    tau: 1440,
    production: [
      {
        source: "constant",
        coefficient: 0.001,
        transform: (_: any, state: any) =>
          0.8 - (state.auxiliary.ghReserve ?? 0.8),
      },
    ],
    clearance: [],
  },
  initialValue: 0.8,
};
