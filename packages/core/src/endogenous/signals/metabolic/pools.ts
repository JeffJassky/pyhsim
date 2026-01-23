import type { AuxiliaryDefinition } from "../../../engine";

export const insulinAction: AuxiliaryDefinition = {
  key: "insulinAction",
  dynamics: {
    setpoint: () => 0,
    tau: 40,
    production: [
      {
        source: "insulin",
        coefficient: 0.000013,
        transform: (I: any) => Math.max(0, I - 8.0),
      },
    ],
    clearance: [],
  },
  initialValue: 0,
};

export const hepaticGlycogen: AuxiliaryDefinition = {
  key: "hepaticGlycogen",
  dynamics: {
    setpoint: () => 0.7,
    tau: 1440,
    production: [
      {
        source: "constant",
        coefficient: 1.0,
        transform: (_: any, state: any) => {
          const G = state.signals.glucose;
          const I = state.signals.insulin;
          const glycogen = state.auxiliary.hepaticGlycogen;
          return I > 8 && G > 100 ? 0.001 * (G - 100) * (1 - glycogen) : 0;
        },
      },
    ],
    clearance: [
      {
        type: "linear",
        rate: 1.0,
        transform: (_: any, state: any) => {
          const G = state.signals.glucose;
          return G < 70 ? (0.5 * (70 - G)) / 70 : 0;
        },
      },
    ],
  },
  initialValue: 0.7,
};
