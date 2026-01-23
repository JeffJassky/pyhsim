import type { SignalDefinition } from "../../../engine";

export const endorphin: SignalDefinition = {
  key: "endorphin",
  label: "Endorphins",
  description: "Natural painkillers and mood elevators.",
  unit: "index",
  initialValue: 1.0,
  idealTendency: "none",
  display: {},
  dynamics: {
    setpoint: () => 1.0,
    tau: 30, // Relatively fast clearance
    production: [],
    clearance: [],
    couplings: [],
  },
};

export const dynorphin: SignalDefinition = {
  key: "dynorphin",
  label: "Dynorphins",
  description: "Opioid peptides involved in stress and dysphoria.",
  unit: "index",
  initialValue: 1.0,
  idealTendency: "mid",
  display: {},
  dynamics: {
    setpoint: () => 1.0,
    tau: 30,
    production: [],
    clearance: [],
    couplings: [],
  },
};

export const anandamide: SignalDefinition = {
  key: "anandamide",
  label: "Anandamide",
  description: "Endogenous cannabinoid neurotransmitter.",
  unit: "index",
  initialValue: 1.0,
  idealTendency: "none",
  display: {},
  dynamics: {
    setpoint: () => 1.0,
    tau: 15, // Very short half-life
    production: [],
    clearance: [],
    couplings: [],
  },
};