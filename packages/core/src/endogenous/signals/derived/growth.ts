import type { SignalDefinition, AuxiliaryDefinition } from "../../../engine";

export const bdnf: SignalDefinition = {
  key: "bdnf",
  label: "BDNF",
  isPremium: true,
  unit: "ng/mL",
  description:
    "Often called 'brain fertilizer,' BDNF supports the survival of existing neurons and encourages the growth of new ones.",
  idealTendency: "higher",
  dynamics: {
    setpoint: () => 25.0,
    tau: 480,
    production: [
      { source: "growthHormone", coefficient: 0.5 },
      {
        source: "constant",
        coefficient: 0.005,
        transform: (_: any, state: any) =>
          state.auxiliary.bdnfExpression ?? 0.6,
      },
    ],
    clearance: [{ type: "linear", rate: 0.002 }],
    couplings: [{ source: "cortisol", effect: "inhibit", strength: 0.3 }],
  },
  initialValue: 25.0,
  min: 0,
  max: 100,
  display: {
    referenceRange: { min: 10, max: 30 },
  },
};

export const bdnfExpression: AuxiliaryDefinition = {
  key: "bdnfExpression",
  dynamics: {
    setpoint: () => 0.6,
    tau: 2880,
    production: [
      { source: "constant", coefficient: 0.001, transform: () => 0 },
    ],
    clearance: [{ type: "linear", rate: 0.0001 }],
  },
  initialValue: 0.6,
};

export const mtor: SignalDefinition = {
  key: "mtor",
  label: "mTOR",
  isPremium: true,
  unit: "fold-change",
  description: "The body's primary 'build and grow' pathway.",
  idealTendency: "mid",
  dynamics: {
    setpoint: () => 1.0,
    tau: 1440,
    production: [{ source: "insulin", coefficient: 0.03 }],
    clearance: [{ type: "linear", rate: 0.01 }],
    couplings: [],
  },
  initialValue: 1.0,
  min: 0,
  max: 5,
  display: {
    referenceRange: { min: 0.2, max: 0.8 },
  },
};

export const ampk: SignalDefinition = {
  key: "ampk",
  label: "AMPK",
  isPremium: true,
  unit: "fold-change",
  description: "Your body's 'energy sensor' and fuel gauge.",
  idealTendency: "mid",
  dynamics: {
    setpoint: () => 1.0,
    tau: 1440,
    production: [{ source: "glucagon", coefficient: 0.01 }],
    clearance: [{ type: "linear", rate: 0.01 }],
    couplings: [{ source: "insulin", effect: "inhibit", strength: 0.04 }],
  },
  initialValue: 1.0,
  min: 0,
  max: 5,
  display: {
    referenceRange: { min: 0.2, max: 0.8 },
  },
};
