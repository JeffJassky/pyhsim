import type { SimulationState, UnifiedSignalDefinition, AuxiliaryDefinition, SolverDebugOptions } from '@/types/unified';
import { SIGNALS_ALL, type Signal } from '@/types/neurostate';
import type { Subject, Physiology } from '@/models/subject';

/**
 * Initialize a zeroed simulation state
 */
export function initializeZeroState(): SimulationState {
  const signals = {} as Record<Signal, number>;
  for (const signal of SIGNALS_ALL) {
    signals[signal] = 0;
  }

  return {
    signals,
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
  signalDefs: Partial<Record<Signal, UnifiedSignalDefinition>>,
  auxDefs: Record<string, AuxiliaryDefinition>,
  ctx: { subject: Subject, physiology: Physiology, isAsleep: boolean },
  debug?: SolverDebugOptions
): SimulationState {
  const state = initializeZeroState();

  if (debug?.enableBaselines !== false) {
    for (const key of Object.keys(signalDefs) as Signal[]) {
      const def = signalDefs[key];
      if (def) {
        state.signals[key] = typeof def.initialValue === 'function' 
          ? def.initialValue(ctx) 
          : def.initialValue;
      }
    }

    for (const key of Object.keys(auxDefs)) {
      const def = auxDefs[key];
      if (!def) {
        console.warn(`[createInitialState] Auxiliary definition for '${key}' is undefined.`);
        continue;
      }
      state.auxiliary[key] = typeof def.initialValue === 'function'
        ? def.initialValue({ subject: ctx.subject, physiology: ctx.physiology })
        : def.initialValue;
    }
  }

  // Initialize common receptors to baseline 1.0
  const commonReceptors = [
    'D1', 'D2', '5HT1A', '5HT2A', 'GABA_A', 'NMDA', 'AMPA', 
    'Alpha1', 'Beta_Adrenergic', 
    'Adenosine_A2a', 'Adenosine_A1', 
    'H1', 'OX1R', 'OX2R',
    'DAT', 'NET', 'SERT'
  ];
  for (const r of commonReceptors) {
    state.receptors[`${r}_density`] = 1.0;
    state.receptors[`${r}_sensitivity`] = 1.0;
  }

  return state;
}

/**
 * Scales a simulation state by a scalar value (useful for RK4)
 */
export function scaleState(state: SimulationState, scalar: number): SimulationState {
  const scaled: SimulationState = {
    signals: { ...state.signals },
    auxiliary: { ...state.auxiliary },
    receptors: { ...state.receptors },
    pk: { ...state.pk },
    accumulators: { ...state.accumulators },
  };

  for (const key in state.signals) {
    scaled.signals[key as Signal] *= scalar;
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
export function addStates(a: SimulationState, b: SimulationState): SimulationState {
  const result: SimulationState = {
    signals: { ...a.signals },
    auxiliary: { ...a.auxiliary },
    receptors: { ...a.receptors },
    pk: { ...a.pk },
    accumulators: { ...a.accumulators },
  };

  for (const key in b.signals) {
    result.signals[key as Signal] += b.signals[key as Signal];
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
    result.accumulators[key] = (result.accumulators[key] ?? 0) + b.accumulators[key];
  }

  return result;
}

/**
 * Clamps signal values to their defined bounds
 */
export function clampState(state: SimulationState, signals: Record<Signal, { min?: number, max?: number }>): SimulationState {
  const clamped = { ...state };
  for (const key in state.signals) {
    const signal = key as Signal;
    const val = state.signals[signal];
    const bounds = signals[signal];
    if (bounds) {
      if (bounds.min !== undefined) clamped.signals[signal] = Math.max(bounds.min, clamped.signals[signal]);
      if (bounds.max !== undefined) clamped.signals[signal] = Math.min(bounds.max, clamped.signals[signal]);
    }
  }
  return clamped;
}
