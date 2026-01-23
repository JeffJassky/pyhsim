import type { SignalDefinition } from "../../../engine";
import {
  minuteToPhase,
  hourToPhase,
  gaussianPhase,
  widthToConcentration,
} from "../../utils";

export const glp1: SignalDefinition = {
  key: "glp1",
  label: "GLP-1",
  isPremium: true,
  unit: "pmol/L",
  description:
    "A powerful gut signal that slows down digestion and tells your brain you're getting full.",
  idealTendency: "higher",
  dynamics: {
    setpoint: (ctx: any) => {
      const p = minuteToPhase(ctx.circadianMinuteOfDay);
      const bk = gaussianPhase(p, hourToPhase(8.5), widthToConcentration(70));
      const ln = gaussianPhase(p, hourToPhase(13.0), widthToConcentration(80));
      const dn = gaussianPhase(p, hourToPhase(19.0), widthToConcentration(90));
      return Math.min(25, 2.0 + 12.0 * (bk + 0.9 * ln + 0.8 * dn));
    },
    tau: 30,
    production: [],
    clearance: [{ type: "linear", rate: 0.03 }],
    couplings: [{ source: "insulin", effect: "stimulate", strength: 0.0007 }],
  },
  initialValue: 5,
  display: {
    referenceRange: { min: 5, max: 50 },
  },
};
