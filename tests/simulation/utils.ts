import type {
  Minute,
  Signal,
  WorkerComputeRequest,
  Subject,
  Physiology,
  ItemForWorker,
  InterventionDef,
} from '@/types';
import { SIGNALS_ALL } from '@/types';
import { rangeMinutes } from '@/utils/time';
import { buildInterventionLibrary } from '@physim/core';
import { buildConditionAdjustments, type ConditionKey, type ConditionStateSnapshot, derivePhysiology, type Subject as SubjectType } from '@physim/core';
import {
  integrateStep,
  createInitialState,
  getAllUnifiedDefinitions,
  AUXILIARY_DEFINITIONS,
  SIGNAL_DEFINITIONS,
  isReceptor,
  getReceptorSignals
} from "@physim/core";
import type { SimulationState, DynamicsContext, ActiveIntervention } from '@/types/unified';
import { runOptimizedV2 } from '@physim/core';

// --- Types ---

export interface TestEngineConfig {
  /** Duration in minutes (default: 1440 = 24 hours) */
  duration?: number;
  /** Grid step in minutes (default: 5) */
  gridStep?: number;
  /** Condition configurations */
  conditions?: Partial<Record<ConditionKey, { enabled: boolean; params: Record<string, number> }>>;
  /** Timeline interventions */
  interventions?: TestIntervention[];
  /** Subject demographics */
  subject?: Partial<SubjectType>;
  /** Direct transporter activity overrides (for isolated testing) */
  transporterActivities?: Record<string, number>;
  /** Direct receptor density overrides */
  receptorDensities?: Record<string, number>;
  /** Direct enzyme activity overrides */
  enzymeActivities?: Record<string, number>;
  /** Wake time offset from midnight in minutes */
  wakeOffsetMin?: number;
  /** Sleep duration in minutes */
  sleepMinutes?: number;
  /** Signals to include (default: all) */
  includeSignals?: readonly Signal[];
}

export interface TestIntervention {
  key: string;
  /** Start time in minutes from midnight */
  startMin: number;
  /** Duration in minutes */
  durationMin?: number;
  /** Intervention parameters */
  params?: Record<string, number | string>;
  /** Intensity multiplier */
  intensity?: number;
}

export interface EngineResult {
  /** Signal time series */
  signals: Record<Signal, Float32Array>;
  /** Time grid in minutes */
  gridMins: Minute[];
  /** Config used */
  config: TestEngineConfig;
}

export interface SignalStats {
  min: number;
  max: number;
  mean: number;
  variance: number;
  peakTime: number;
  troughTime: number;
}

// --- Default Subject ---

const DEFAULT_SUBJECT: SubjectType = {
  age: 30,
  weight: 70,
  height: 170,
  sex: 'male',
  cycleLength: 28,
  lutealPhaseLength: 14,
  cycleDay: 1,
};

// --- Engine Runner (Synchronous for Testing) ---

/**
 * Import and run the engine computation logic synchronously.
 * This bypasses the Web Worker for testing purposes.
 */
export async function runEngine(config: TestEngineConfig = {}): Promise<EngineResult> {
  const {
    duration = 1440,
    gridStep = 5,
    conditions = {},
    interventions = [],
    subject: subjectOverrides = {},
    transporterActivities = {},
    receptorDensities = {},
    enzymeActivities = {},
    wakeOffsetMin,
    sleepMinutes,
    includeSignals = SIGNALS_ALL,
  } = config;

  // Build subject
  const subject: SubjectType = { ...DEFAULT_SUBJECT, ...subjectOverrides };
  const physiology = derivePhysiology(subject);

  // Build condition state
  const conditionState: Record<ConditionKey, ConditionStateSnapshot> = {
    adhd: { enabled: false, params: { severity: 0.6 } },
    autism: { enabled: false, params: { eibalance: 0.5 } },
    depression: { enabled: false, params: { severity: 0.5 } },
    anxiety: { enabled: false, params: { reactivity: 0.5 } },
    pots: { enabled: false, params: { severity: 0.5 } },
    mcas: { enabled: false, params: { activation: 0.5 } },
    insomnia: { enabled: false, params: { severity: 0.5 } },
    pcos: { enabled: false, params: { severity: 0.5 } },
  };

  // Apply condition overrides
  for (const [key, value] of Object.entries(conditions)) {
    if (conditionState[key as ConditionKey] && value) {
      conditionState[key as ConditionKey] = {
        enabled: value.enabled ?? false,
        params: { ...conditionState[key as ConditionKey].params, ...(value.params ?? {}) },
      };
    }
  }

  const conditionAdjustments = buildConditionAdjustments(conditionState);

  // Build grid
  const numPoints = Math.ceil(duration / gridStep);
  const gridMins: Minute[] = [];
  for (let i = 0; i < numPoints; i++) {
    gridMins.push((i * gridStep) as Minute);
  }

  // Build intervention items
  const items: ItemForWorker[] = interventions.map((int, idx) => ({
    id: `test-${idx}`,
    startMin: int.startMin as Minute,
    durationMin: int.durationMin ?? 60,
    meta: {
      key: int.key,
      label: int.key,
      params: int.params ?? {},
      intensity: int.intensity ?? 1.0,
    },
  }));

  // Build intervention definitions
  const defs = buildInterventionLibrary(subject, physiology);

  // Merge transporter/receptor/enzyme activities
  const mergedTransporterActivities = {
    ...conditionAdjustments.transporterActivities,
    ...transporterActivities,
  };
  const mergedReceptorDensities = {
    ...conditionAdjustments.receptorDensities,
    ...receptorDensities,
  };
  const mergedEnzymeActivities = {
    ...conditionAdjustments.enzymeActivities,
    ...enzymeActivities,
  };

  // Build request
  const request: WorkerComputeRequest = {
    gridMins,
    items,
    defs,
    options: {
      includeSignals,
      wakeOffsetMin: wakeOffsetMin as Minute | undefined,
      sleepMinutes,
      conditionBaselines: conditionAdjustments.baselines,
      conditionCouplings: conditionAdjustments.couplings,
      receptorDensities: mergedReceptorDensities,
      transporterActivities: mergedTransporterActivities,
      enzymeActivities: mergedEnzymeActivities,
      subject,
      physiology,
      debug: { enableHomeostasis: true, enableConditions: true } as any, // Cast to avoid full type check in test utils
    },
  };

  // Run computation (import worker logic)
  const signals = await computeEngineSync(request, includeSignals);

  return {
    signals,
    gridMins,
    config,
  };
}

/**
 * Synchronous engine computation for testing.
 * Reimplements the core worker logic without Web Worker overhead.
 */
async function computeEngineSync(
  request: WorkerComputeRequest,
  includeSignals: readonly Signal[]
): Promise<Record<Signal, Float32Array>> {
  const system = {
    signals: includeSignals,
    signalDefinitions: getAllUnifiedDefinitions(),
    auxDefinitions: AUXILIARY_DEFINITIONS,
    resolver: { isReceptor, getReceptorSignals },
    createInitialState
  };
  const response = runOptimizedV2(request, system as any);
  return response.series;
}

// --- Analysis Utilities ---

/**
 * Calculate statistics for a signal
 */
export function signalStats(signal: Float32Array, gridMins: Minute[]): SignalStats {
  let min = Infinity;
  let max = -Infinity;
  let sum = 0;
  let peakTime = 0;
  let troughTime = 0;

  for (let i = 0; i < signal.length; i++) {
    const val = signal[i];
    sum += val;
    if (val > max) {
      max = val;
      peakTime = gridMins[i];
    }
    if (val < min) {
      min = val;
      troughTime = gridMins[i];
    }
  }

  const mean = sum / signal.length;

  let varianceSum = 0;
  for (let i = 0; i < signal.length; i++) {
    varianceSum += Math.pow(signal[i] - mean, 2);
  }
  const variance = varianceSum / signal.length;

  return { min, max, mean, variance, peakTime, troughTime };
}

/**
 * Find peak value and time
 */
export function peak(signal: Float32Array, gridMins: Minute[]): { value: number; time: number } {
  let max = -Infinity;
  let time = 0;
  for (let i = 0; i < signal.length; i++) {
    if (signal[i] > max) {
      max = signal[i];
      time = gridMins[i];
    }
  }
  return { value: max, time };
}

/**
 * Find trough value and time
 */
export function trough(signal: Float32Array, gridMins: Minute[]): { value: number; time: number } {
  let min = Infinity;
  let time = 0;
  for (let i = 0; i < signal.length; i++) {
    if (signal[i] < min) {
      min = signal[i];
      time = gridMins[i];
    }
  }
  return { value: min, time };
}

/**
 * Calculate mean of a signal
 */
export function mean(signal: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < signal.length; i++) {
    sum += signal[i];
  }
  return sum / signal.length;
}

/**
 * Calculate area under curve (trapezoidal integration)
 */
export function auc(signal: Float32Array, gridMins: Minute[], startMin?: number, endMin?: number): number {
  const start = startMin ?? gridMins[0];
  const end = endMin ?? gridMins[gridMins.length - 1];

  let area = 0;
  for (let i = 1; i < signal.length; i++) {
    const t0 = gridMins[i - 1];
    const t1 = gridMins[i];
    if (t1 < start || t0 > end) continue;

    const dt = t1 - t0;
    const avgHeight = (signal[i - 1] + signal[i]) / 2;
    area += avgHeight * dt;
  }
  return area;
}

/**
 * Calculate Pearson correlation between two signals
 */
export function correlation(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length) {
    throw new Error('Signals must have same length');
  }

  const n = a.length;
  const meanA = mean(a);
  const meanB = mean(b);

  let numerator = 0;
  let denomA = 0;
  let denomB = 0;

  for (let i = 0; i < n; i++) {
    const diffA = a[i] - meanA;
    const diffB = b[i] - meanB;
    numerator += diffA * diffB;
    denomA += diffA * diffA;
    denomB += diffB * diffB;
  }

  const denom = Math.sqrt(denomA * denomB);
  return denom === 0 ? 0 : numerator / denom;
}

/**
 * Find time to reach a target value (settling time)
 */
export function settleTime(
  signal: Float32Array,
  gridMins: Minute[],
  target: number,
  tolerance: number = 0.05
): number | null {
  const threshold = target * tolerance;

  for (let i = 0; i < signal.length; i++) {
    if (Math.abs(signal[i] - target) <= threshold) {
      // Check if it stays within tolerance
      let stable = true;
      for (let j = i; j < Math.min(i + 12, signal.length); j++) {
        if (Math.abs(signal[j] - target) > threshold) {
          stable = false;
          break;
        }
      }
      if (stable) return gridMins[i];
    }
  }
  return null;
}

/**
 * Get signal value at a specific time
 */
export function valueAt(signal: Float32Array, gridMins: Minute[], targetMin: number): number {
  // Find closest grid point
  let closestIdx = 0;
  let closestDist = Infinity;
  for (let i = 0; i < gridMins.length; i++) {
    const dist = Math.abs(gridMins[i] - targetMin);
    if (dist < closestDist) {
      closestDist = dist;
      closestIdx = i;
    }
  }
  return signal[closestIdx];
}

/**
 * Check if signal is monotonically increasing
 */
export function isMonotonicallyIncreasing(signal: Float32Array): boolean {
  for (let i = 1; i < signal.length; i++) {
    if (signal[i] < signal[i - 1]) return false;
  }
  return true;
}

/**
 * Check if signal is monotonically decreasing
 */
export function isMonotonicallyDecreasing(signal: Float32Array): boolean {
  for (let i = 1; i < signal.length; i++) {
    if (signal[i] > signal[i - 1]) return false;
  }
  return true;
}

/**
 * Calculate the approximate period of a signal using autocorrelation
 */
export function estimatePeriod(signal: Float32Array, gridStep: number): number {
  const n = signal.length;
  const meanVal = mean(signal);

  // Compute autocorrelation for various lags
  const maxLag = Math.floor(n / 2);
  let bestLag = 0;
  let bestCorr = -Infinity;

  for (let lag = 10; lag < maxLag; lag++) {
    let sum = 0;
    let count = 0;
    for (let i = 0; i < n - lag; i++) {
      sum += (signal[i] - meanVal) * (signal[i + lag] - meanVal);
      count++;
    }
    const corr = sum / count;
    if (corr > bestCorr) {
      bestCorr = corr;
      bestLag = lag;
    }
  }

  return bestLag * gridStep;
}
