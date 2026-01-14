/**
 * Test Utilities for Physiological Simulation Engine
 *
 * Provides helpers for running the engine in headless mode and analyzing results.
 */

import type {
  Minute,
  Signal,
  WorkerComputeRequest,
  ProfileBaselineAdjustments,
  ProfileCouplingAdjustments,
  Subject,
  Physiology,
  ItemForWorker,
  InterventionDef,
} from '@/types';
import { SIGNALS_ALL } from '@/types';
import { rangeMinutes } from '@/utils/time';
import { buildInterventionLibrary } from '@/models/library/interventions';
import { buildProfileAdjustments, type ProfileKey, type ProfileStateSnapshot } from '@/models/library/profiles';
import { derivePhysiology, type Subject as SubjectType } from '@/models/domain/subject';
import {
  integrateStep,
  createInitialState,
  getAllUnifiedDefinitions,
  AUXILIARY_DEFINITIONS,
  SIGNAL_DEFINITIONS,
} from "@/models/engine/unified";
import type { SimulationState, DynamicsContext, ActiveIntervention } from '@/types/unified';

// --- Types ---

export interface TestEngineConfig {
  /** Duration in minutes (default: 1440 = 24 hours) */
  duration?: number;
  /** Grid step in minutes (default: 5) */
  gridStep?: number;
  /** Profile configurations */
  profiles?: Partial<Record<ProfileKey, { enabled: boolean; params: Record<string, number> }>>;
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
  includeSignals?: Signal[];
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
    profiles = {},
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

  // Build profile state
  const profileState: Record<ProfileKey, ProfileStateSnapshot> = {
    adhd: { enabled: false, params: { severity: 0.6 } },
    autism: { enabled: false, params: { eibalance: 0.5 } },
    depression: { enabled: false, params: { severity: 0.5 } },
    anxiety: { enabled: false, params: { reactivity: 0.5 } },
    pots: { enabled: false, params: { severity: 0.5 } },
    mcas: { enabled: false, params: { activation: 0.5 } },
    insomnia: { enabled: false, params: { severity: 0.5 } },
    pcos: { enabled: false, params: { severity: 0.5 } },
  };

  // Apply profile overrides
  for (const [key, value] of Object.entries(profiles)) {
    if (profileState[key as ProfileKey] && value) {
      profileState[key as ProfileKey] = {
        enabled: value.enabled ?? false,
        params: { ...profileState[key as ProfileKey].params, ...(value.params ?? {}) },
      };
    }
  }

  const profileAdjustments = buildProfileAdjustments(profileState);

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
    ...profileAdjustments.transporterActivities,
    ...transporterActivities,
  };
  const mergedReceptorDensities = {
    ...profileAdjustments.receptorDensities,
    ...receptorDensities,
  };
  const mergedEnzymeActivities = {
    ...profileAdjustments.enzymeActivities,
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
      profileBaselines: profileAdjustments.baselines,
      profileCouplings: profileAdjustments.couplings,
      receptorDensities: mergedReceptorDensities,
      transporterActivities: mergedTransporterActivities,
      enzymeActivities: mergedEnzymeActivities,
      subject,
      physiology,
      enableHomeostasis: true,
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
  includeSignals: Signal[]
): Promise<Record<Signal, Float32Array>> {
  const { gridMins, items, defs, options } = request;

  const enableInterventions = options?.debug?.enableInterventions ?? true;
  const gridStep = gridMins.length > 1 ? gridMins[1] - gridMins[0] : 5;
  const minutesPerDay = 24 * 60;

  const series: Record<Signal, Float32Array> = {} as Record<Signal, Float32Array>;
  for (const signal of includeSignals) {
    series[signal] = new Float32Array(gridMins.length);
  }

  const defsMap = new Map(defs.map((def) => [def.key, def]));
  const unifiedDefinitions = getAllUnifiedDefinitions();
  
  // Initialize state
  let initialState: SimulationState = createInitialState(SIGNAL_DEFINITIONS, AUXILIARY_DEFINITIONS, {
    subject: options?.subject ?? ({} as any),
    physiology: options?.physiology ?? ({} as any),
    isAsleep: false 
  }, options?.debug);

  // Apply profile adjustments to initial state auxiliary variables (enzymes, transporters)
  if (options?.enzymeActivities) {
    for (const [key, val] of Object.entries(options.enzymeActivities)) {
      if (initialState.auxiliary[key] !== undefined) {
        initialState.auxiliary[key] += val;
      }
    }
  }
  if (options?.transporterActivities) {
    for (const [key, val] of Object.entries(options.transporterActivities)) {
      if (initialState.auxiliary[key] !== undefined) {
        initialState.auxiliary[key] += val;
      }
    }
  }

  // Apply receptor profile adjustments
  if (options?.receptorDensities) {
    for (const [key, val] of Object.entries(options.receptorDensities)) {
      initialState.receptors[`${key}_density`] = 1.0 + val;
    }
  }

  let currentState: SimulationState = initialState;

  // Prepare mechanistic interventions
  const activeInterventions: ActiveIntervention[] = [];
  let wakeTimeMin = 480; // Default 8:00 AM
  let foundWakeTime = false;

  if (enableInterventions) {
    // Find wake time
    for (const item of items) {
      if (foundWakeTime) break;
      const def = defsMap.get(item.meta.key);
      if (!def) continue;

      if (def.key === 'wake') {
        wakeTimeMin = item.startMin % 1440;
        foundWakeTime = true;
      } else if (def.key === 'sleep') {
        wakeTimeMin = (item.startMin + item.durationMin) % 1440;
        foundWakeTime = true;
      }
    }

    const numDays = Math.ceil((gridMins[gridMins.length - 1] + gridStep) / 1440);
    for (let d = 0; d < numDays; d++) {
      for (const item of items) {
        const def = defsMap.get(item.meta.key);
        if (!def) continue;

        activeInterventions.push({
          id: item.id,
          key: def.key,
          startTime: item.startMin + (d * 1440),
          duration: item.durationMin,
          intensity: item.meta.intensity ?? 1.0,
          params: item.meta.params,
          pharmacology: def.pharmacology
        });
      }
    }
  }

  const standardWakeTime = 480;
  const circadianShift = standardWakeTime - wakeTimeMin;

  // Simulation Loop
  gridMins.forEach((minute, idx) => {
    const adjustedMinute = minute % minutesPerDay;
    const circadianMinuteOfDay = (adjustedMinute + circadianShift + minutesPerDay) % minutesPerDay;
    
    const isAsleep = enableInterventions && items.some(item => {
      const def = defsMap.get(item.meta.key);
      if (def?.key !== 'sleep') return false;
      const inRange = (minute >= item.startMin && minute <= item.startMin + item.durationMin);
      const inWrappedRange = ((minute + 1440) >= item.startMin && (minute + 1440) <= item.startMin + item.durationMin);
      return inRange || inWrappedRange;
    });

    const dynamicsCtx: DynamicsContext = {
      minuteOfDay: adjustedMinute,
      circadianMinuteOfDay,
      dayOfYear: 1, 
      isAsleep,
      subject: options?.subject ?? ({} as any),
      physiology: options?.physiology ?? ({} as any),
    };

    const dt = idx === 0 ? 0 : gridStep;
    if (dt > 0) {
      const subSteps = Math.max(1, Math.ceil(dt / 1.0));
      const subDt = dt / subSteps;
      for (let s = 0; s < subSteps; s++) {
        currentState = integrateStep(currentState, minute - dt + s * subDt, subDt, dynamicsCtx, unifiedDefinitions, AUXILIARY_DEFINITIONS, activeInterventions, options?.debug);
      }
    } else {
      currentState = integrateStep(currentState, minute, 0, dynamicsCtx, unifiedDefinitions, AUXILIARY_DEFINITIONS, activeInterventions, options?.debug);
    }

    for (const signal of includeSignals) {
      series[signal][idx] = currentState.signals[signal] ?? 0;
    }
  });

  return series;
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
