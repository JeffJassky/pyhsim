import type { AuxiliaryDefinition } from "../../../engine";

export const adenosinePressure: AuxiliaryDefinition = {
  key: "adenosinePressure",
  dynamics: {
    setpoint: (ctx: any) => (ctx.isAsleep ? 0 : 1.0),
    tau: 1440,
    production: [
      {
        source: "constant",
        coefficient: 0.003,
        transform: (_: any, state: any, ctx: any) => {
          if (ctx.isAsleep) return 0;
          const S = state.auxiliary.adenosinePressure ?? 0.2;
          return 1 - S;
        },
      },
    ],
    clearance: [
      {
        type: "linear",
        rate: 0.008,
        transform: (_: any, state: any, ctx: any) => {
          return ctx.isAsleep ? 1.0 : 0;
        },
      },
    ],
  },
  initialValue: 0.2,
};
