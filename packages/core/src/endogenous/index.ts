import type {
  SignalDefinition,
  AuxiliaryDefinition,
  SystemResolver,
  SimulationState,
} from "../engine";
import {
  integrateStep as genericIntegrateStep,
  computeDerivatives as genericComputeDerivatives,
  createInitialState as genericCreateInitialState,
  initializeZeroState as genericInitializeZeroState,
} from "../engine";

import {
  SIGNALS_ALL,
  type Signal,
  AUXILIARY_DEFINITIONS_MAP,
} from "./signals/types";
import { SIGNAL_DEFINITIONS_MAP } from "./signals";
import {
  getAllTransporterKeys,
  getAllEnzymeKeys,
  getAllReceptorKeys,
  ENZYMES,
  isReceptor,
  getReceptorSignals,
} from "./targets";

export * from "./types";
export * from "./signals";
export * from "./targets";
export * from "./subject";
export * from "./conditions";
export { BIOLOGICAL_SYSTEMS, type BioSystemDef } from "./systems";
export * from "./utils";

export const SIGNAL_DEFINITIONS: Partial<Record<Signal, SignalDefinition>> =
  SIGNALS_ALL.reduce(
    (acc, key) => {
      acc[key] = (SIGNAL_DEFINITIONS_MAP as any)[key];

      return acc;
    },
    {} as Record<Signal, SignalDefinition>,
  );

// --- Enzyme and Transporter Defaults ---
const createStaticAux = (
  key: string,
  initial: number = 1.0,
): AuxiliaryDefinition => ({
  key,
  dynamics: {
    setpoint: () => initial,
    tau: 1440,
    production: [],
    clearance: [],
  },
  initialValue: initial,
});

export const AUXILIARY_DEFINITIONS: Record<string, AuxiliaryDefinition> = {
  // 1. Biological pools/integrals from signals catalog
  ...AUXILIARY_DEFINITIONS_MAP,

  // 2. Enzymes & Transporters activity (generated from mechanisms registry)
  ...Object.fromEntries(
    getAllTransporterKeys().map((key) => [
      key,
      { ...createStaticAux(key), label: `${key} Activity` },
    ]),
  ),
  ...Object.fromEntries(
    getAllEnzymeKeys().map((key) => [
      key,
      {
        ...createStaticAux(key, ENZYMES[key].baselineActivity ?? 1.0),
        label: `${key} Activity`,
      },
    ]),
  ),
};

/**
 * Gets a complete map of all signals with their unified definitions.
 */
export function getAllUnifiedDefinitions(): Record<Signal, SignalDefinition> {
  const all: Record<Signal, SignalDefinition> = {} as any;
  for (const signal of SIGNALS_ALL) {
    if (SIGNAL_DEFINITIONS[signal]) {
      all[signal] = SIGNAL_DEFINITIONS[signal]!;
    }
  }
  return all;
}

/**
 * Human Physiology Resolver
 */
export const HUMAN_RESOLVER: SystemResolver = {
  isReceptor,
  getReceptorSignals,
};

/**
 * Specialized initializeZeroState for the Human Physiology system.
 */
export const initializeZeroState = () => {
  return genericInitializeZeroState(SIGNALS_ALL);
};

/**
 * Specialized createInitialState for the Human Physiology system.
 */
export const createInitialState = (
  ctx: { subject: any; physiology: any; isAsleep: boolean },
  debug?: any,
) => {
  // Derive all active receptor/transporter keys for state initialization
  const receptorKeys = [...getAllReceptorKeys(), ...getAllTransporterKeys()];

  return genericCreateInitialState(
    SIGNALS_ALL,
    getAllUnifiedDefinitions(),
    AUXILIARY_DEFINITIONS,
    ctx,
    { ...debug, receptorKeys },
  );
};

/**
 * Specialized integrateStep for the Human Physiology system.
 */
export const integrateStep = (...args: any[]): SimulationState => {
  if (Array.isArray(args[4])) {
    return genericIntegrateStep(
      args[0],
      args[1],
      args[2],
      args[3],
      args[4],
      args[5],
      args[6],
      args[7],
      args[8],
      args[9],
    );
  }
  const [
    state,
    t,
    dt,
    ctx,
    definitions,
    auxDefinitions,
    interventions,
    options,
  ] = args;
  return genericIntegrateStep(
    state,
    t,
    dt,
    ctx,
    SIGNALS_ALL,
    definitions || getAllUnifiedDefinitions(),
    auxDefinitions || AUXILIARY_DEFINITIONS,
    HUMAN_RESOLVER,
    interventions || [],
    options,
  );
};

/**
 * Specialized computeDerivatives for the Human Physiology system.
 */
export const computeDerivatives = (...args: any[]): SimulationState => {
  if (Array.isArray(args[3])) {
    return genericComputeDerivatives(
      args[0],
      args[1],
      args[2],
      args[3],
      args[4],
      args[5],
      args[6],
      args[7],
      args[8],
    );
  }
  const [state, t, ctx, definitions, auxDefinitions, interventions, options] =
    args;
  return genericComputeDerivatives(
    state,
    t,
    ctx,
    SIGNALS_ALL,
    definitions || getAllUnifiedDefinitions(),
    auxDefinitions || AUXILIARY_DEFINITIONS,
    HUMAN_RESOLVER,
    interventions || [],
    options,
  );
};
