import type { SignalDefinition } from "../../../engine";
import { minuteToPhase, hourToPhase, gaussianPhase } from "../../utils";

export const dopamine: SignalDefinition = {
  key: "dopamine",
  label: "Dopamine",
  isPremium: true,
  unit: "nM",
  description:
    "Often called the 'reward' chemical, dopamine is actually about motivation and anticipation. It's the signal that drives you to pursue goals and seek out pleasurable experiences, creating that 'get up and go' feeling.",
  idealTendency: "mid",
  dynamics: {
    setpoint: (ctx: any) => {
      const p = minuteToPhase(ctx.circadianMinuteOfDay);
      const morningDrive = gaussianPhase(p, hourToPhase(10.5), 1.0);
      const afternoonPlateau = gaussianPhase(p, hourToPhase(13.5), 0.8);
      const eveningDrop = gaussianPhase(p, hourToPhase(22), 0.5);
      return (
        4.0 + 9.0 * morningDrive + 4.0 * afternoonPlateau - 3.0 * eveningDrop
      );
    },
    tau: 120,
    production: [
      {
        source: "constant",
        coefficient: 0.002,
        transform: (_: any, state: any) => {
          const vesicles = state.auxiliary.dopamineVesicles ?? 0.8;
          return vesicles * 10;
        },
      },
    ],
    clearance: [
      { type: "enzyme-dependent", rate: 0.002, enzyme: "DAT" },
      { type: "enzyme-dependent", rate: 0.001, enzyme: "MAO_B" },
    ],
    couplings: [{ source: "cortisol", effect: "stimulate", strength: 0.001 }],
  },
  initialValue: 10,
  min: 0,
  max: 100,
  display: {
    referenceRange: { min: 5, max: 20 },
  },
};
