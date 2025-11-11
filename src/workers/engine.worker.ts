import type {
  BaselineFn,
  CouplingMap,
  DelaySpec,
  ItemForWorker,
  KernelFn,
  Minute,
  ParamValues,
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

function hydrateKernel(fnString: string): KernelFn {
  try {
    // eslint-disable-next-line no-new-func
    return new Function(`return (${fnString})`)();
  } catch (err) {
    console.error('Failed to hydrate kernel', err);
    return () => 0;
  }
}

const kernelCache = new Map<string, Partial<Record<Signal, KernelFn>>>();

function getKernelSet(defId: string, kernels: Partial<Record<Signal, string>>) {
  if (!kernelCache.has(defId)) {
    const hydrated: Partial<Record<Signal, KernelFn>> = {};
    for (const [signal, body] of Object.entries(kernels)) {
      hydrated[signal as Signal] = hydrateKernel(body);
    }
    kernelCache.set(defId, hydrated);
  }
  return kernelCache.get(defId)!;
}

function computeItemEffect(
  signal: Signal,
  kernels: Partial<Record<Signal, KernelFn>>,
  minute: number,
  item: ItemForWorker
) {
  const kernel = kernels[signal];
  if (!kernel) return 0;
  const t = minute - item.startMin;
  const paramsWithDuration: ParamValues = {
    ...item.meta.params,
    duration: item.durationMin,
  };
  return kernel(t, paramsWithDuration, item.meta.intensity);
}

self.onmessage = (event: MessageEvent<WorkerComputeRequest>) => {
  const { gridMins, items, defs, options } = event.data;

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

  const series: Record<Signal, Float32Array> = {} as Record<Signal, Float32Array>;

  for (const signal of includeSignals) {
    series[signal] = new Float32Array(gridMins.length);
  }

  const defsMap = new Map(defs.map((def) => [def.key, def]));

  const lastStepValues: Partial<Record<Signal, number>> = {};
  const couplings: CouplingMap = { ...SIGNAL_COUPLINGS };
  const profileCouplings: ProfileCouplingAdjustments = options?.profileCouplings ?? {};
  for (const [target, extras] of Object.entries(profileCouplings)) {
    const signal = target as Signal;
    if (!extras?.length) continue;
    couplings[signal] = [...(couplings[signal] ?? []), ...extras];
  }

  gridMins.forEach((minute, idx) => {
    const adjustedMinute = (((minute - wakeOffsetMin) % minutesPerDay) + minutesPerDay) % minutesPerDay;
    for (const signal of includeSignals) {
      const baselineAdj = baselineAdjustments[signal];
      const phaseShift = baselineAdj?.phaseShiftMin ?? 0;
      const amplitude = Math.max(0, 1 + (baselineAdj?.amplitude ?? 0));
      const shiftedMinute = (((adjustedMinute + phaseShift) % minutesPerDay) + minutesPerDay) % minutesPerDay;
      let value = (baselineFns[signal]?.((shiftedMinute as Minute)) ?? 0) * amplitude;
      value = applySleepAdjustment(signal, value, sleepQuality);
      for (const item of items) {
        const def = defsMap.get(item.meta.key);
        if (!def) continue;
        const kernelSet = getKernelSet(def.key, def.kernels);
        value += computeItemEffect(signal, kernelSet, minute as number, item);
      }
      const modifiers = couplings[signal];
      if (modifiers?.length) {
        for (const modifier of modifiers) {
          if (!includeSignalSet.has(modifier.source)) continue;
          const driver = getCouplingDriver(
            modifier.source,
            series,
            idx,
            modifier.delay,
            gridStep,
            lastStepValues
          );
          let contribution = applyResponseSpec(modifier.mapping, driver);
          if (modifier.saturation) {
            contribution = applyResponseSpec(modifier.saturation, contribution);
          }
          value += contribution;
        }
      }
      series[signal][idx] = clamp(value, clampMin, clampMax);
    }
    for (const signal of includeSignals) {
      lastStepValues[signal] = series[signal][idx];
    }
  });

  const payload: WorkerComputeResponse = { series };
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
