import type {
  BaselineContext,
  BaselineFn,
  CouplingMap,
  DelaySpec,
  ItemForWorker,
  KernelFn,
  KernelSet,
  KernelSpec,
  Minute,
  ParamValues,
  Physiology,
  Subject,
  ProfileBaselineAdjustments,
  ProfileCouplingAdjustments,
  ResponseSpec,
  Signal,
  WorkerComputeRequest,
  WorkerComputeResponse,
} from '@/types';
import { SIGNALS_ALL } from '@/types';
import { clamp } from '@/utils/math';
import { SIGNAL_BASELINES, SIGNAL_COUPLINGS } from '@/models';
import { KERNEL_RUNTIME_HELPERS } from '@/models/interventions';
import {
  stepHomeostasis,
  DEFAULT_HOMEOSTASIS_STATE,
  DEFAULT_HOMEOSTASIS_PARAMS,
  deserializeHomeostasisState,
  serializeHomeostasisState,
  type HomeostasisState,
  type HomeostasisParams,
  type HomeostasisInputs,
} from '@/models/homeostasis';

const kernelHelperEntries = Object.entries(KERNEL_RUNTIME_HELPERS);
const kernelHelperNames = kernelHelperEntries.map(([name]) => name);
const kernelHelperValues = kernelHelperEntries.map(([, value]) => value);

function hydrateKernel(fnString: string): KernelFn {
  try {
    // eslint-disable-next-line no-new-func
    const factory = new Function(
      ...kernelHelperNames,
      `return (${fnString})`
    ) as (...args: unknown[]) => KernelFn;
    return factory(...kernelHelperValues);
  } catch (err) {
    console.error('Failed to hydrate kernel', err);
    return () => 0;
  }
}

const kernelCache = new Map<string, Partial<Record<Signal, KernelFn>>>();

function getKernelSet(defId: string, kernels: KernelSet) {
  if (!kernelCache.has(defId)) {
    const hydrated: Partial<Record<Signal, KernelFn>> = {};
    for (const [signal, spec] of Object.entries(kernels)) {
      if (!spec) continue;
      hydrated[signal as Signal] = hydrateKernel(spec.fn);
    }
    kernelCache.set(defId, hydrated);
  }
  return kernelCache.get(defId)!;
}

function computeItemEffect(
  signal: Signal,
  kernels: Partial<Record<Signal, KernelFn>>,
  minute: number,
  item: ItemForWorker,
  physiology?: Physiology,
  subject?: Subject
) {
  const kernel = kernels[signal];
  if (!kernel) return 0;
  const t = minute - item.startMin;
  const paramsWithDuration: ParamValues = {
    ...item.meta.params,
    duration: item.durationMin,
    clearanceScalar: physiology?.drugClearance ?? 1.0,
    metabolicScalar: physiology?.metabolicCapacity ?? 1.0,
    weight: subject?.weight ?? 70, // Default to 70kg if missing
  };
  const I = typeof item.meta.intensity === 'number' ? item.meta.intensity : 1.0;
  // Intensity scaling is now handled here in the engine.
  // This allows us to keep kernel definitions simple and strictly focused on physics/physiology.
  const rawEffect = kernel(t, paramsWithDuration);
  const result = rawEffect * I;
  return Number.isFinite(result) ? result : 0;
}

self.onmessage = (event: MessageEvent<WorkerComputeRequest>) => {
  const { gridMins, items, defs, options } = event.data;
  
  // Debug flags (default to true if missing)
  const enableBaselines = options?.debug?.enableBaselines ?? true;
  const enableInterventions = options?.debug?.enableInterventions ?? true;
  const enableCouplings = options?.debug?.enableCouplings ?? true;
  const enableHomeostasis = options?.debug?.enableHomeostasis ?? true;
  const enableReceptors = options?.debug?.enableReceptors ?? true;
  const enableTransporters = options?.debug?.enableTransporters ?? true;
  const enableEnzymes = options?.debug?.enableEnzymes ?? true;

  console.debug('[EngineWorker] Received Request:', {
    gridLength: gridMins.length,
    itemCount: items.length,
    debug: options?.debug,
    enableBaselines,
    enableInterventions,
    enableCouplings,
    enableHomeostasis,
    enableReceptors,
    enableTransporters,
    enableEnzymes
  });

  const baselineFns: Partial<Record<Signal, BaselineFn>> = { ...SIGNAL_BASELINES };
  const baselineAdjustments: ProfileBaselineAdjustments = options?.profileBaselines ?? {};

  const includeSignals = options?.includeSignals ?? SIGNALS_ALL;
  const includeSignalSet = new Set(includeSignals);
  const gridStep = gridMins.length > 1 ? gridMins[1] - gridMins[0] : 5;
  const wakeOffsetMin = options?.wakeOffsetMin ?? (0 as Minute);
  const sleepMinutes = options?.sleepMinutes ?? 8 * 60;
  const sleepQuality = Math.min(1.2, Math.max(0.5, sleepMinutes / (8 * 60)));
  const minutesPerDay = 24 * 60;
  const clampMin = options?.clampMin ?? -1;
  const clampMax = options?.clampMax ?? 1.2;
  
  const baselineContext: BaselineContext = {
    chronotypeShiftMin: wakeOffsetMin,
    sleepDebt: 0,
    subject: options?.subject,
    physiology: options?.physiology,
  };

  const series: Record<Signal, Float32Array> = {} as Record<Signal, Float32Array>;

  for (const signal of includeSignals) {
    series[signal] = new Float32Array(gridMins.length);
  }

  const defsMap = new Map(defs.map((def) => [def.key, def]));


  const couplings: CouplingMap = { ...SIGNAL_COUPLINGS };
  const profileCouplings: ProfileCouplingAdjustments = options?.profileCouplings ?? {};
  for (const [target, extras] of Object.entries(profileCouplings)) {
    const signal = target as Signal;
    if (!extras?.length) continue;
    couplings[signal] = [...(couplings[signal] ?? []), ...extras];
  }

  // --- Homeostasis System (ODE-based feedback) ---
  const useHomeostasis = (options?.enableHomeostasis ?? true) && enableHomeostasis;

  // Initialize homeostasis state - use provided initial state or defaults
  const baseHomeostasisState = options?.initialHomeostasisState
    ? deserializeHomeostasisState(options.initialHomeostasisState)
    : { ...DEFAULT_HOMEOSTASIS_STATE };

  // Apply receptor density adjustments (controlled by enableReceptors)
  const receptorDensities = enableReceptors ? (options?.receptorDensities ?? {}) : {};
  const initialReceptorStates: Record<string, number> = {
    ...baseHomeostasisState.receptorStates,
  };
  for (const [receptor, delta] of Object.entries(receptorDensities)) {
    // Convert delta to absolute density (1.0 is baseline), but respect saved state
    const savedDensity = baseHomeostasisState.receptorStates[receptor] ?? 1.0;
    initialReceptorStates[receptor] = savedDensity + delta;
  }

  let homeostasisState: HomeostasisState = {
    ...baseHomeostasisState,
    receptorStates: initialReceptorStates,
  };

  // Apply transporter activity adjustments (controlled by enableTransporters)
  const transporterActivities = enableTransporters ? (options?.transporterActivities ?? {}) : {};
  const datActivity = 1.0 + (transporterActivities['DAT'] ?? 0);
  const netActivity = 1.0 + (transporterActivities['NET'] ?? 0);
  const sertActivity = 1.0 + (transporterActivities['SERT'] ?? 0);

  // Apply enzyme activity adjustments (controlled by enableEnzymes)
  const enzymeActivities = enableEnzymes ? (options?.enzymeActivities ?? {}) : {};
  const daoActivity = 1.0 + (enzymeActivities['DAO'] ?? 0);
  const maoAActivity = 1.0 + (enzymeActivities['MAO_A'] ?? 0);
  const maoBActivity = 1.0 + (enzymeActivities['MAO_B'] ?? 0);
  const comtActivity = 1.0 + (enzymeActivities['COMT'] ?? 0);

  // Enzyme effects on signal clearance/degradation:
  // Lower enzyme activity = slower clearance = higher signal levels
  // histamineEnzymeGain: DAO reduces histamine, so low DAO → higher histamine
  const histamineEnzymeGain = daoActivity < 1.0 ? (1.0 - daoActivity) * 0.4 : 0; // Up to 40% increase at DAO -1.0
  // Monoamine clearance: MAO degrades DA/NE/5-HT
  const monoamineClearanceRate = (maoAActivity + maoBActivity) / 2;
  // Catecholamine clearance: COMT degrades DA/NE/adrenaline
  const catecholamineClearanceRate = comtActivity;

  const homeostasisParams: HomeostasisParams = {
    ...DEFAULT_HOMEOSTASIS_PARAMS,
    // Metabolic rate affects homeostasis, could be considered Physiology or Conditions
    // Keeping it linked to profile/physiology for now
    metabolicRate: options?.physiology?.metabolicCapacity ?? 1.0,
    insulinSensitivity: options?.physiology?.metabolicCapacity ?? 1.0,
  };

  // Track intervention effects for homeostasis inputs
  const getInterventionEffect = (signal: Signal, minute: number): number => {
    let effect = 0;
    for (const item of items) {
      const def = defsMap.get(item.meta.key);
      if (!def) continue;
      const kernelSet = getKernelSet(def.key, def.kernels);
      effect += computeItemEffect(signal, kernelSet, minute, item, options?.physiology, options?.subject);
    }
    return effect;
  };

  // Calculate stimulant effect for homeostasis (DAT/NET blockade)
  const STIMULANT_KEYS = ['caffeine', 'ritalinIR10', 'adderallIR', 'adderallXR'];
  const getStimulantEffect = (minute: number, items: ItemForWorker[], defsMap: Map<string, any>): number => {
    let effect = 0;
    for (const item of items) {
      const def = defsMap.get(item.meta.key);
      if (!def || !STIMULANT_KEYS.includes(def.key)) continue;
      const t = minute - item.startMin;
      if (t < 0) continue;

      // Get dopamine kernel effect as proxy for DAT blockade
      const kernelSet = getKernelSet(def.key, def.kernels);
      const daEffect = computeItemEffect('dopamine' as Signal, kernelSet, minute, item, options?.physiology, options?.subject);

      // Normalize to 0-1 range (typical DA effects are 0-50 range)
      effect += Math.min(1, Math.abs(daEffect) / 50);
    }
    return Math.min(1, effect);
  };

  // Calculate tryptophan availability from meals (for serotonin synthesis)
  const getTryptophanAvailability = (minute: number, items: ItemForWorker[], defsMap: Map<string, any>): number => {
    let tryptophan = 0.7; // Baseline availability

    for (const item of items) {
      const def = defsMap.get(item.meta.key);
      if (!def || def.key !== 'food') continue;

      const t = minute - item.startMin;
      if (t < 0 || t > 360) continue; // Effect lasts ~6 hours

      const params = item.meta.params ?? {};
      const protein = Number(params.protein ?? 0);
      const carbSugar = Number(params.carbSugar ?? 0);
      const carbStarch = Number(params.carbStarch ?? 0);
      const carbs = carbSugar + carbStarch;

      // High carbs with moderate protein increases brain tryptophan
      // (insulin clears competing amino acids)
      if (carbs > 30 && protein > 10) {
        const peakEffect = 0.2 * Math.min(1, carbs / 60);
        const timeEffect = (1 - Math.exp(-t / 60)) * Math.exp(-(t - 120) / 180);
        tryptophan += peakEffect * Math.max(0, timeEffect);
      }
    }

    return Math.min(1, tryptophan);
  };

  // Track if we've logged a NaN warning for a signal to avoid spam
  const warnedSignals = new Set<string>();

  const getBaseline = (signal: Signal, minute: number): number => {
    if (!enableBaselines) return 0;
    const fn = baselineFns[signal];
    if (!fn) return 0;
    const val = fn(minute as Minute, baselineContext);
    if (!Number.isFinite(val)) {
      if (!warnedSignals.has(signal)) {
        console.warn(`[EngineWorker] Baseline for ${signal} returned ${val} at min ${minute}`);
        warnedSignals.add(signal);
      }
      return 0;
    }
    return val;
  };

  // Initialization of lastStepValues using analytical baselines
  const lastStepValues: Partial<Record<Signal, number>> = {};
  const startMinute = gridMins[0];
  const startAdjustedMinute = (((startMinute - wakeOffsetMin) % minutesPerDay) + minutesPerDay) % minutesPerDay;
  const isAsleepAtStart = items.some(item => {
    const def = defsMap.get(item.meta.key);
    return def?.key === 'sleep' &&
           startMinute >= item.startMin &&
           startMinute <= item.startMin + item.durationMin;
  });

  for (const signal of includeSignals) {
    const baselineAdj = baselineAdjustments[signal];
    const phaseShift = baselineAdj?.phaseShiftMin ?? 0;
    const amplitude = Math.max(0, 1 + (baselineAdj?.amplitude ?? 0));
    const shiftedMinute = (((startAdjustedMinute + phaseShift) % minutesPerDay) + minutesPerDay) % minutesPerDay;
    
    const baseVal = getBaseline(signal, shiftedMinute);
    let val = baseVal * amplitude;
    if (isAsleepAtStart) {
      val = applySleepAdjustment(signal, val, sleepQuality);
    }
    lastStepValues[signal] = val;
  }

  // Simulation Loop: Pass 0 = Warmup, Pass 1 = Record
  for (let pass = 0; pass < 2; pass++) {
    gridMins.forEach((minute, idx) => {
      const adjustedMinute = (((minute - wakeOffsetMin) % minutesPerDay) + minutesPerDay) % minutesPerDay;

      // 1. Calculate analytical values (Baseline + Kernels + Couplings)
      const analyticalValues: Partial<Record<Signal, number>> = {};
      for (const signal of includeSignals) {
        const baselineAdj = baselineAdjustments[signal];
        const phaseShift = baselineAdj?.phaseShiftMin ?? 0;
        const amplitude = Math.max(0, 1 + (baselineAdj?.amplitude ?? 0));
        const shiftedMinute = (((adjustedMinute + phaseShift) % minutesPerDay) + minutesPerDay) % minutesPerDay;

        const baseVal = getBaseline(signal, shiftedMinute);
        let val = baseVal * amplitude;

        val = applySleepAdjustment(signal, val, sleepQuality);
        
        // Kernels (Interventions flag)
        if (enableInterventions) {
          for (const item of items) {
            const def = defsMap.get(item.meta.key);
            if (!def) continue;
            const kernelSet = getKernelSet(def.key, def.kernels);
            // Sum effect from "today" (minute) and "yesterday" (minute + 1440) to handle wrapping
            val += computeItemEffect(signal, kernelSet, minute as number, item, options?.physiology, options?.subject);
            val += computeItemEffect(signal, kernelSet, (minute as number) + 1440, item, options?.physiology, options?.subject);
          }
        }

        // Couplings (Couplings flag)
        if (enableCouplings) {
          const modifiers = couplings[signal];
          if (modifiers?.length) {
            for (const modifier of modifiers) {
              if (!includeSignalSet.has(modifier.source)) continue;
              
              // If homeostasis is enabled, skip couplings that are handled by the ODE system
              if (useHomeostasis && modifier.isManagedByHomeostasis) continue;

              // Use series only if in recording pass and not at very beginning
              // In warmup pass, or idx=0 of recording, rely on lastStepValues
              const driver = (pass === 1 && idx > 0)
                ? getCouplingDriver(modifier.source, series, idx, modifier.delay, gridStep, lastStepValues)
                : lastStepValues[modifier.source] ?? 0;

              let contribution = applyResponseSpec(modifier.mapping, driver);
              if (modifier.saturation) {
                contribution = applyResponseSpec(modifier.saturation, contribution);
              }
              val += contribution;
            }
          }
        }
        analyticalValues[signal] = val;
      }

      // 2. Step Homeostasis System
      let homeostasisCorrections: Record<string, number> = {};
      if (useHomeostasis) {
        const isAsleep = items.some(item => {
          const def = defsMap.get(item.meta.key);
          if (def?.key !== 'sleep') return false;
          // Check if current minute falls within item duration OR if it falls in the "wrapped" duration (previous day)
          // For yesterday's item: check if (minute + 1440) is within [start, start + duration]
          // This handles sleep spanning midnight correctly (e.g. 23:00-07:00)
          const inRange = (minute >= item.startMin && minute <= item.startMin + item.durationMin);
          const inWrappedRange = ((minute + 1440) >= item.startMin && (minute + 1440) <= item.startMin + item.durationMin);
          return inRange || inWrappedRange;
        });

        const effectiveDopamine = (lastStepValues['dopamine'] ?? 50) / datActivity;
        const effectiveNorepi = (lastStepValues['norepi'] ?? 30) / netActivity;
        const effectiveSerotonin = (lastStepValues['serotonin'] ?? 50) / sertActivity;

        const homeostasisInputs: HomeostasisInputs = {
          baselineCortisol: analyticalValues['cortisol'] ?? 12,
          baselineGlucose: analyticalValues['glucose'] ?? 90,
          baselineDopamine: effectiveDopamine,
          baselineSerotonin: effectiveSerotonin,
          baselineNorepi: effectiveNorepi,
          baselineGaba: analyticalValues['gaba'] ?? 50,
          baselineGlutamate: analyticalValues['glutamate'] ?? 50,
          baselineAcetylcholine: analyticalValues['acetylcholine'] ?? 50,
          baselineEnergy: analyticalValues['energy'] ?? 100,
          baselineMelatonin: analyticalValues['melatonin'] ?? 20,
          baselineBdnf: analyticalValues['bdnf'] ?? 50,
          baselineGrowthHormone: analyticalValues['growthHormone'] ?? 50,
          baselineAdrenaline: analyticalValues['adrenaline'] ?? 50,

          glucoseAppearance: getInterventionEffect('glucose', minute as number),
          caffeineLevel: getInterventionEffect('dopamine', minute as number),
          exerciseIntensity: getInterventionEffect('adrenaline', minute as number) / 100,
          stressLevel: Math.max(0, (lastStepValues['cortisol'] ?? 12) - 15) / 20,
          alcoholLevel: getInterventionEffect('gaba', minute as number) * 0.02,
          meditationEffect: 0,

          dopamineFiringRate: Math.min(1, Math.max(0, effectiveDopamine / 100)),
          serotoninFiringRate: Math.min(1, Math.max(0, effectiveSerotonin / 100)),
          norepiFiringRate: Math.min(1, Math.max(0, effectiveNorepi / 100)),
          stimulantEffect: getStimulantEffect(minute as number, items, defsMap),
          tryptophanAvailability: getTryptophanAvailability(minute as number, items, defsMap),
          gabaBoost: getInterventionEffect('gaba', minute as number) / 50,
          glutamateBlock: getInterventionEffect('glutamate', minute as number) < 0
            ? Math.abs(getInterventionEffect('glutamate', minute as number)) / 50
            : 0,

          isAsleep,
          minuteOfDay: adjustedMinute,
        };

        // Pass 0 (Warmup): idx=0 use dt=0 to init.
        // Pass 1 (Record): idx=0 use dt=gridStep (continue from warmup).
        const dt = (pass === 0 && idx === 0) ? 0 : gridStep;

        const { newState, corrections } = stepHomeostasis(
          homeostasisState,
          homeostasisInputs,
          homeostasisParams,
          dt
        );

        homeostasisState = newState;
        homeostasisCorrections = corrections;
      }

      // 3. Apply corrections and write to series (only in Pass 1)
      for (const signal of includeSignals) {
        let value = analyticalValues[signal] ?? 0;

        if (useHomeostasis && homeostasisCorrections[signal] !== undefined) {
          value += homeostasisCorrections[signal];
        }

        if (signal === 'dopamine' && datActivity !== 1) value /= datActivity;
        if (signal === 'norepi' && netActivity !== 1) value /= netActivity;
        if (signal === 'serotonin' && sertActivity !== 1) value /= sertActivity;

        if (signal === 'histamine' && histamineEnzymeGain !== 0) {
          value *= (1 + histamineEnzymeGain);
        }
        if ((signal === 'dopamine' || signal === 'norepi' || signal === 'serotonin') && monoamineClearanceRate !== 1) {
          value *= 1 / Math.max(0.5, monoamineClearanceRate);
        }
        if ((signal === 'dopamine' || signal === 'norepi' || signal === 'adrenaline') && catecholamineClearanceRate !== 1) {
          value *= 1 / Math.max(0.5, catecholamineClearanceRate);
        }

        let finalVal = value;
        const isOrganScore = [
          'brain','eyes','heart','lungs','liver','pancreas','stomach',
          'si','colon','adrenals','thyroid','muscle','adipose','skin'
        ].includes(signal);

        if (!isOrganScore) finalVal = Math.max(0, finalVal);
        
        if (isNaN(finalVal) || !isFinite(finalVal)) finalVal = 0;
        
        // Update lastStepValues for next iteration
        lastStepValues[signal] = finalVal;

        // Record only in Pass 1
        if (pass === 1) {
          series[signal][idx] = finalVal;
        }
      }
    });
  }

  // Sample data check
  const samples: any = {};
  SIGNALS_ALL.slice(0, 5).forEach(s => {
    if (series[s]) samples[s] = series[s][0].toFixed(3);
  });
  console.debug('[EngineWorker] Computed. First Sample:', samples);

  // Serialize final homeostasis state for persistence
  const finalHomeostasisState = useHomeostasis
    ? serializeHomeostasisState(homeostasisState)
    : undefined;

  const payload: WorkerComputeResponse = {
    series,
    finalHomeostasisState,
  };
  (self as any).postMessage(payload, Object.values(series).map((buffer) => buffer.buffer));
};

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

function getCouplingDriver(
  source: Signal,
  series: Record<Signal, Float32Array>,
  idx: number,
  delaySpec: DelaySpec | undefined,
  gridStep: number,
  lastStepValues: Partial<Record<Signal, number>>
) {
  if (idx === 0) {
    return lastStepValues[source] ?? 0;
  }
  const lagMinutes = resolveDelayMinutes(delaySpec);
  const lagSteps = Math.max(1, Math.round(lagMinutes / Math.max(1, gridStep)));
  const sampleIdx = idx - lagSteps;
  if (sampleIdx >= 0) {
    return series[source]?.[sampleIdx] ?? lastStepValues[source] ?? 0;
  }
  return lastStepValues[source] ?? 0;
}

function resolveDelayMinutes(delay: DelaySpec | undefined) {
  if (!delay) return 0;
  switch (delay.kind) {
    case 'fixed':
      return Math.max(0, delay.minutes);
    case 'gamma':
      return Math.max(0, delay.shape * delay.scaleMin);
    case 'normal':
      return Math.max(0, delay.meanMin);
    default:
      return 0;
  }
}

function applyResponseSpec(spec: ResponseSpec, input: number): number {
  switch (spec.kind) {
    case 'linear':
      return spec.gain * input;
    case 'hill': {
      const x = Math.max(0, input);
      const xPow = Math.pow(x, spec.n);
      return (spec.Emax * xPow) / (Math.pow(spec.EC50, spec.n) + xPow + 1e-6);
    }
    case 'ihill': {
      const x = Math.max(0, input);
      const xPow = Math.pow(x, spec.n);
      const denom = Math.pow(spec.IC50, spec.n) + xPow + 1e-6;
      return (spec.Imax * Math.pow(spec.IC50, spec.n)) / denom;
    }
    case 'logistic':
      return spec.L / (1 + Math.exp(-spec.k * (input - spec.x0)));
    default:
      return input;
  }
}