import type { SignalDefinition } from "../../../engine";

export const leptin: SignalDefinition = {
  key: "leptin",
  label: "Leptin",
  isPremium: true,
  unit: "ng/mL",
  description:
    "The 'long-term satiety' signal. Leptin is produced by your fat cells and tells your brain how much stored energy you have. It helps regulate your metabolic rate and long-term appetite balance.",
  idealTendency: "mid",
  dynamics: {
    setpoint: (ctx: any) =>
      15.0 +
      5.0 * Math.cos(((ctx.circadianMinuteOfDay / 60 - 24) * Math.PI) / 12),
    tau: 1440,
    production: [],
    clearance: [],
    couplings: [{ source: "insulin", effect: "stimulate", strength: 0.05 }],
  },
  initialValue: 15,
  display: {
    referenceRange: { min: 2, max: 15 },
  },
};
