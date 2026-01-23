import type {
  SimulationState,
  SignalDefinition,
  AuxiliaryDefinition,
  SolverDebugOptions,
  Signal,
} from "./types";

/**
 * Initialize a zeroed simulation state
 */
export function initializeZeroState(
  signals: readonly Signal[],
): SimulationState {
  const signalMap = {} as Record<string, number>;
  for (const s of signals) {
    signalMap[s] = 0;
  }

  return {
    signals: signalMap,
    auxiliary: {},
    receptors: {},
    pk: {},
    accumulators: {},
  };
}

/**
 * Create initial simulation state from definitions
 */
export function createInitialState(
  signals: readonly Signal[],
  signalDefs: Partial<Record<string, SignalDefinition>>,
  auxDefs: Record<string, AuxiliaryDefinition>,
  ctx: { subject: any; physiology: any; isAsleep: boolean },
  debug?: SolverDebugOptions,
): SimulationState {
  const state = initializeZeroState(signals);

  if (debug?.enableBaselines !== false) {
    for (const key of Object.keys(signalDefs)) {
      const def = signalDefs[key];
      if (def) {
        state.signals[key] =
          typeof def.initialValue === "function"
            ? def.initialValue(ctx)
            : def.initialValue;
      }
    }

    for (const key of Object.keys(auxDefs)) {
      const def = auxDefs[key];
      if (!def) {
        continue;
      }
      state.auxiliary[key] =
        typeof def.initialValue === "function"
          ? def.initialValue({
              subject: ctx.subject,
              physiology: ctx.physiology,
            })
          : def.initialValue;
    }
  }

  // Initialize receptors/transporters to baseline 1.0
  const receptorKeys = debug?.receptorKeys ?? [];
  for (const r of receptorKeys) {
    state.receptors[`${r}_density`] = 1.0;
    state.receptors[`${r}_sensitivity`] = 1.0;
  }

  return state;
}

/**
 * Scales a simulation state by a scalar value (useful for RK4)
 */
export function scaleState(
  state: SimulationState,
  scalar: number,
): SimulationState {
  const scaled: SimulationState = {
    signals: { ...state.signals },
    auxiliary: { ...state.auxiliary },
    receptors: { ...state.receptors },
    pk: { ...state.pk },
    accumulators: { ...state.accumulators },
  };

  for (const key in state.signals) {
    scaled.signals[key] *= scalar;
  }
  for (const key in state.auxiliary) {
    scaled.auxiliary[key] *= scalar;
  }
  for (const key in state.receptors) {
    scaled.receptors[key] *= scalar;
  }
  for (const key in state.pk) {
    scaled.pk[key] *= scalar;
  }
  for (const key in state.accumulators) {
    scaled.accumulators[key] *= scalar;
  }

  return scaled;
}

/**
 * Adds two simulation states together
 */
export function addStates(
  a: SimulationState,
  b: SimulationState,
): SimulationState {
  const result: SimulationState = {
    signals: { ...a.signals },
    auxiliary: { ...a.auxiliary },
    receptors: { ...a.receptors },
    pk: { ...a.pk },
    accumulators: { ...a.accumulators },
  };

  for (const key in b.signals) {
    result.signals[key] = (result.signals[key] ?? 0) + b.signals[key];
  }
  for (const key in b.auxiliary) {
    result.auxiliary[key] = (result.auxiliary[key] ?? 0) + b.auxiliary[key];
  }
  for (const key in b.receptors) {
    result.receptors[key] = (result.receptors[key] ?? 0) + b.receptors[key];
  }
  for (const key in b.pk) {
    result.pk[key] = (result.pk[key] ?? 0) + b.pk[key];
  }
  for (const key in b.accumulators) {
    result.accumulators[key] =
      (result.accumulators[key] ?? 0) + b.accumulators[key];
  }

  return result;
}
