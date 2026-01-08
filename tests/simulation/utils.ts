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
import { buildInterventionLibrary } from '@/models/interventions';
import { buildProfileAdjustments, type ProfileKey, type ProfileStateSnapshot } from '@/models/profiles';
import { derivePhysiology, type Subject as SubjectType } from '@/models/subject';

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
  // Dynamic import to avoid circular dependencies
  const { SIGNAL_BASELINES, SIGNAL_COUPLINGS } = await import('@/models');
  const {
    stepHomeostasis,
    DEFAULT_HOMEOSTASIS_STATE,
    DEFAULT_HOMEOSTASIS_PARAMS,
  } = await import('@/models/homeostasis');

  const { gridMins, items, defs, options } = request;

  // Initialize series
  const series: Record<Signal, Float32Array> = {} as Record<Signal, Float32Array>;
  for (const signal of includeSignals) {
    series[signal] = new Float32Array(gridMins.length);
  }

  const defsMap = new Map(defs.map((def) => [def.key, def]));
  const baselineFns = { ...SIGNAL_BASELINES };
  const baselineAdjustments = options?.profileBaselines ?? {};
  const couplings = { ...SIGNAL_COUPLINGS };

  // Apply profile couplings
  const profileCouplings = options?.profileCouplings ?? {};
  for (const [target, extras] of Object.entries(profileCouplings)) {
    const signal = target as Signal;
    if (!extras?.length) continue;
    couplings[signal] = [...(couplings[signal] ?? []), ...extras];
  }

  // Transporter and enzyme activities
  const transporterActivities = options?.transporterActivities ?? {};
  const datActivity = 1.0 + (transporterActivities['DAT'] ?? 0);
  const netActivity = 1.0 + (transporterActivities['NET'] ?? 0);
  const sertActivity = 1.0 + (transporterActivities['SERT'] ?? 0);

  const enzymeActivities = options?.enzymeActivities ?? {};
  const daoActivity = 1.0 + (enzymeActivities['DAO'] ?? 0);
  const histamineEnzymeGain = daoActivity < 1.0 ? (1.0 - daoActivity) * 0.4 : 0;
  const maoAActivity = 1.0 + (enzymeActivities['MAO_A'] ?? 0);
  const maoBActivity = 1.0 + (enzymeActivities['MAO_B'] ?? 0);
  const comtActivity = 1.0 + (enzymeActivities['COMT'] ?? 0);
  const monoamineClearanceRate = (maoAActivity + maoBActivity) / 2;
  const catecholamineClearanceRate = comtActivity;

  const wakeOffsetMin = options?.wakeOffsetMin ?? 0;
  const sleepMinutes = options?.sleepMinutes ?? 8 * 60;
  const sleepQuality = Math.min(1.2, Math.max(0.5, sleepMinutes / (8 * 60)));
  const minutesPerDay = 24 * 60;
  const gridStep = gridMins.length > 1 ? gridMins[1] - gridMins[0] : 5;

  const baselineContext = {
    chronotypeShiftMin: wakeOffsetMin,
    sleepDebt: 0,
    subject: options?.subject,
    physiology: options?.physiology,
  };

  // Homeostasis state
  let homeostasisState = { ...DEFAULT_HOMEOSTASIS_STATE };
  const homeostasisParams = { ...DEFAULT_HOMEOSTASIS_PARAMS };

  const lastStepValues: Partial<Record<Signal, number>> = {};
  const includeSignalSet = new Set(includeSignals);

  // Kernel cache and hydration
  const kernelCache = new Map<string, Partial<Record<Signal, Function>>>();

  function hydrateKernel(fnString: string): Function {
    try {
      // Import helpers
      const { pk1, pk2, hill, receptorOccupancy, operationalAgonism, doseToConcentration } =
        require('@/models/pharmacokinetics');
      return new Function(
        'pk1', 'pk2', 'hill', 'receptorOccupancy', 'operationalAgonism', 'doseToConcentration',
        `return (${fnString})`
      )(pk1, pk2, hill, receptorOccupancy, operationalAgonism, doseToConcentration);
    } catch {
      return () => 0;
    }
  }

  function getKernelSet(defId: string, kernels: any) {
    if (!kernelCache.has(defId)) {
      const hydrated: Partial<Record<Signal, Function>> = {};
      for (const [signal, spec] of Object.entries(kernels)) {
        if (!spec) continue;
        hydrated[signal as Signal] = hydrateKernel((spec as any).fn);
      }
      kernelCache.set(defId, hydrated);
    }
    return kernelCache.get(defId)!;
  }

  function computeItemEffect(
    signal: Signal,
    kernels: Partial<Record<Signal, Function>>,
    minute: number,
    item: ItemForWorker
  ) {
    const kernel = kernels[signal];
    if (!kernel) return 0;
    const t = minute - item.startMin;
    const params = {
      ...item.meta.params,
      duration: item.durationMin,
      clearanceScalar: options?.physiology?.drugClearance ?? 1.0,
      metabolicScalar: options?.physiology?.metabolicCapacity ?? 1.0,
      weight: options?.subject?.weight ?? 70,
    };
    const I = typeof item.meta.intensity === 'number' ? item.meta.intensity : 1.0;
    return (kernel as any)(t, params, I);
  }

  function applySleepAdjustment(signal: Signal, value: number, quality: number) {
    switch (signal) {
      case 'cortisol':
        return value * (0.7 + 0.4 * quality);
      case 'dopamine':
      case 'serotonin':
      case 'energy':
      case 'norepi':
        return value * (0.6 + 0.5 * quality);
      case 'melatonin':
      case 'gaba':
        return value * (1.3 - 0.3 * quality);
      default:
        return value;
    }
  }

  // Main computation loop
  for (let idx = 0; idx < gridMins.length; idx++) {
    const minute = gridMins[idx];
    const adjustedMinute = (((minute - wakeOffsetMin) % minutesPerDay) + minutesPerDay) % minutesPerDay;

    // Homeostasis step (simplified for testing)
    let homeostasisCorrections: Record<string, number> = {};
    if (idx > 0) {
      const isAsleep = items.some(item => {
        const def = defsMap.get(item.meta.key);
        return def?.key === 'sleep' &&
               minute >= item.startMin &&
               minute <= item.startMin + item.durationMin;
      });

      const effectiveDopamine = (lastStepValues['dopamine'] ?? 50) / datActivity;
      const effectiveNorepi = (lastStepValues['norepi'] ?? 30) / netActivity;
      const effectiveSerotonin = (lastStepValues['serotonin'] ?? 50) / sertActivity;

      const homeostasisInputs = {
        baselineCortisol: lastStepValues['cortisol'] ?? 12,
        baselineGlucose: lastStepValues['glucose'] ?? 90,
        baselineDopamine: effectiveDopamine,
        baselineSerotonin: effectiveSerotonin,
        baselineNorepi: effectiveNorepi,
        baselineGaba: lastStepValues['gaba'] ?? 50,
        baselineGlutamate: lastStepValues['glutamate'] ?? 50,
        baselineAcetylcholine: lastStepValues['acetylcholine'] ?? 50,
        baselineEnergy: lastStepValues['energy'] ?? 100,
        baselineMelatonin: lastStepValues['melatonin'] ?? 20,
        baselineBdnf: lastStepValues['bdnf'] ?? 50,
        baselineGrowthHormone: lastStepValues['growthHormone'] ?? 50,
        baselineAdrenaline: lastStepValues['adrenaline'] ?? 50,
        glucoseAppearance: 0,
        caffeineLevel: 0,
        exerciseIntensity: 0,
        stressLevel: Math.max(0, (lastStepValues['cortisol'] ?? 12) - 15) / 20,
        alcoholLevel: 0,
        meditationEffect: 0,
        dopamineFiringRate: Math.min(1, Math.max(0, effectiveDopamine / 100)),
        serotoninFiringRate: Math.min(1, Math.max(0, effectiveSerotonin / 100)),
        norepiFiringRate: Math.min(1, Math.max(0, effectiveNorepi / 100)),
        stimulantEffect: 0,
        tryptophanAvailability: 0.7,
        gabaBoost: 0,
        glutamateBlock: 0,
        isAsleep,
        minuteOfDay: adjustedMinute,
      };

      const result = stepHomeostasis(
        homeostasisState,
        homeostasisInputs,
        homeostasisParams,
        gridStep
      );
      homeostasisState = result.newState;
      homeostasisCorrections = result.corrections;
    }

    // Compute each signal
    for (const signal of includeSignals) {
      const baselineAdj = baselineAdjustments[signal];
      const phaseShift = baselineAdj?.phaseShiftMin ?? 0;
      const amplitude = Math.max(0, 1 + (baselineAdj?.amplitude ?? 0));
      const shiftedMinute = (((adjustedMinute + phaseShift) % minutesPerDay) + minutesPerDay) % minutesPerDay;

      const baseVal = baselineFns[signal]?.(shiftedMinute as Minute, baselineContext) ?? 0;
      let value = baseVal * amplitude;

      value = applySleepAdjustment(signal, value, sleepQuality);

      // Apply intervention effects
      for (const item of items) {
        const def = defsMap.get(item.meta.key);
        if (!def) continue;
        const kernelSet = getKernelSet(def.key, def.kernels);
        value += computeItemEffect(signal, kernelSet, minute, item);
      }

      // Apply couplings (simplified)
      const modifiers = couplings[signal];
      if (modifiers?.length && idx > 0) {
        for (const modifier of modifiers) {
          if (!includeSignalSet.has(modifier.source)) continue;
          const driver = lastStepValues[modifier.source] ?? 0;
          let contribution = 0;
          if (modifier.mapping.kind === 'linear') {
            contribution = modifier.mapping.gain * driver;
          }
          value += contribution;
        }
      }

      // Apply homeostasis corrections
      if (homeostasisCorrections[signal] !== undefined) {
        value += homeostasisCorrections[signal];
      }

      // Apply transporter effects
      if (signal === 'dopamine' && datActivity !== 1) {
        value /= datActivity;
      }
      if (signal === 'norepi' && netActivity !== 1) {
        value /= netActivity;
      }
      if (signal === 'serotonin' && sertActivity !== 1) {
        value /= sertActivity;
      }

      // Apply enzyme effects
      if (signal === 'histamine' && histamineEnzymeGain !== 0) {
        value *= (1 + histamineEnzymeGain);
      }
      if ((signal === 'dopamine' || signal === 'norepi' || signal === 'serotonin') && monoamineClearanceRate !== 1) {
        value *= 1 / Math.max(0.5, monoamineClearanceRate);
      }
      if ((signal === 'dopamine' || signal === 'norepi' || signal === 'adrenaline') && catecholamineClearanceRate !== 1) {
        value *= 1 / Math.max(0.5, catecholamineClearanceRate);
      }

      // Clamp to valid range
      const isOrganScore = [
        'brain', 'eyes', 'heart', 'lungs', 'liver', 'pancreas', 'stomach',
        'si', 'colon', 'adrenals', 'thyroid', 'muscle', 'adipose', 'skin'
      ].includes(signal);

      if (!isOrganScore) {
        value = Math.max(0, value);
      }

      if (isNaN(value) || !isFinite(value)) {
        value = 0;
      }

      series[signal][idx] = value;
    }

    // Update last step values
    for (const signal of includeSignals) {
      lastStepValues[signal] = series[signal][idx];
    }
  }

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
