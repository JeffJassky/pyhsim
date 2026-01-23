import type { AuxiliaryDefinition } from "../../../engine";

export const crhPool: AuxiliaryDefinition = {
  key: "crhPool",
  dynamics: {
    setpoint: (ctx: any) => {
      const hour = ctx.circadianMinuteOfDay / 60;
      return 0.5 + 0.5 * Math.cos(((hour - 8) * Math.PI) / 12);
    },
    tau: 10,
    production: [],
    clearance: [
      {
        type: "linear",
        rate: 0.1,
        transform: (_: any, state: any) => {
          const cortisol = state.signals.cortisol;
          return Math.max(0, cortisol - 12);
        },
      },
    ],
  },
  initialValue: 1.0,
};

export const cortisolIntegral: AuxiliaryDefinition = {
  key: "cortisolIntegral",
  dynamics: {
    setpoint: () => 0,
    tau: 10000,
    production: [
      {
        source: "constant",
        coefficient: 1.0,
        transform: (_: any, state: any) => {
          const cortisol = state.signals.cortisol;
          return cortisol > 18 ? 0.0001 * (cortisol - 12) : 0;
        },
      },
    ],
    clearance: [{ type: "linear", rate: 0.00005 }],
  },
  initialValue: 0,
};
