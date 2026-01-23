import type { SignalDefinition } from "../../../engine";
import { minuteToPhase, hourToPhase, windowPhase } from "../../utils";

export const melatonin: SignalDefinition = {
  key: "melatonin",
  label: "Melatonin",
  unit: "pg/mL",
  description:
    "Often called the 'vampire hormone,' melatonin is your brain's primary signal for biological night. It doesn't knock you out like a sedative, but rather opens the 'sleep gate' and helps coordinate your body's internal clocks.",
  idealTendency: "mid",
  dynamics: {
    setpoint: (ctx: any) => {
      const p = minuteToPhase(ctx.circadianMinuteOfDay);
      return 80.0 * windowPhase(p, hourToPhase(21), hourToPhase(7.5), 0.5);
    },
    tau: 30,
    production: [],
    clearance: [{ type: "linear", rate: 0.03 }],
    couplings: [{ source: "dopamine", effect: "inhibit", strength: 2.0 }],
  },
  initialValue: 5,
  min: 0,
  max: 150,
  display: {
    referenceRange: { min: 0, max: 100 },
  },
};
