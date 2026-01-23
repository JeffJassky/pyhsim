import type { AuxiliaryDefinition } from "../../../engine";

// === Scientific Constants ===
const VESICLE_DYNAMICS = {
  DA_SYNTHESIS_RATE: 0.002,
  DA_RELEASE_RATE: 0.01,
  SEROTONIN_SYNTHESIS_RATE: 0.0015,
  SEROTONIN_RELEASE_RATE: 0.008,
  NE_SYNTHESIS_RATE: 0.002,
  NE_RELEASE_RATE: 0.01,
  BASELINE_POOL: 0.8,
} as const;

export const dopamineVesicles: AuxiliaryDefinition = {
  key: "dopamineVesicles",
  dynamics: {
    setpoint: () => VESICLE_DYNAMICS.BASELINE_POOL,
    tau: 100,
    production: [
      {
        source: "constant",
        coefficient: VESICLE_DYNAMICS.DA_SYNTHESIS_RATE * 5,
        transform: (_: any, state: any) => {
          const V = state.auxiliary.dopamineVesicles ?? VESICLE_DYNAMICS.BASELINE_POOL;
          return VESICLE_DYNAMICS.BASELINE_POOL * (1 - V);
        },
      },
    ],
    clearance: [{ type: "linear", rate: VESICLE_DYNAMICS.DA_RELEASE_RATE / 2 }],
  },
  initialValue: VESICLE_DYNAMICS.BASELINE_POOL,
};

export const norepinephrineVesicles: AuxiliaryDefinition = {
  key: "norepinephrineVesicles",
  dynamics: {
    setpoint: () => VESICLE_DYNAMICS.BASELINE_POOL,
    tau: 120,
    production: [
      {
        source: "constant",
        coefficient: VESICLE_DYNAMICS.NE_SYNTHESIS_RATE * 4,
        transform: (_: any, state: any) => VESICLE_DYNAMICS.BASELINE_POOL - (state.auxiliary.norepinephrineVesicles ?? VESICLE_DYNAMICS.BASELINE_POOL),
      },
    ],
    clearance: [{ type: "linear", rate: VESICLE_DYNAMICS.NE_RELEASE_RATE / 2.5 }],
  },
  initialValue: VESICLE_DYNAMICS.BASELINE_POOL,
};

export const serotoninPrecursor: AuxiliaryDefinition = {
  key: "serotoninPrecursor",
  dynamics: {
    setpoint: () => 0.7,
    tau: 480,
    production: [
      {
        source: "constant",
        coefficient: 1.0,
        transform: (_: any, state: any) => {
          const insulin = state.signals.insulin;
          return insulin > 15 ? VESICLE_DYNAMICS.SEROTONIN_SYNTHESIS_RATE * (insulin - 15) : 0;
        },
      },
    ],
    clearance: [{ type: "linear", rate: 0.001 }],
  },
  initialValue: 0.7,
};

export const gabaPool: AuxiliaryDefinition = {
  key: "gabaPool",
  dynamics: {
    setpoint: () => 0.7,
    tau: 240,
    production: [
      {
        source: "constant",
        coefficient: 0.004,
        transform: (_: any, state: any) => 0.7 - (state.auxiliary.gabaPool ?? 0.7),
      },
    ],
    clearance: [{ type: "linear", rate: 0.001 }],
  },
  initialValue: 0.7,
};

export const glutamatePool: AuxiliaryDefinition = {
  key: "glutamatePool",
  dynamics: {
    setpoint: () => 0.7,
    tau: 180,
    production: [
      {
        source: "constant",
        coefficient: 0.005,
        transform: (_: any, state: any) => 0.7 - (state.auxiliary.glutamatePool ?? 0.7),
      },
    ],
    clearance: [{ type: "linear", rate: 0.002 }],
  },
  initialValue: 0.7,
};