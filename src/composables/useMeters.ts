import { computed, watch } from 'vue';
import type { MeterKey, MeterVector, Signal } from '@/types';
import { useEngineStore } from '@/stores/engine';
import { useMetersStore } from '@/stores/meters';
import { useUIStore } from '@/stores/ui';
import { clamp, sigmoid, softplus, tanh } from '@/utils/math';

const relu = (x: number) => Math.max(0, x);

const nonlinearity = {
  sigmoid,
  softplus,
  relu,
  tanh,
} as const;

export const useMeters = () => {
  const engine = useEngineStore();
  const meters = useMetersStore();
  const ui = useUIStore();

  const idxAtPlayhead = computed(() => {
    const step = engine.gridStepMin || 1;
    const idx = Math.round(ui.playheadMin / step);
    return Math.min(engine.gridMins.length - 1, Math.max(0, idx));
  });

  const computeSeries = () => {
    const len = engine.gridMins.length;
    const result: Record<MeterKey, Float32Array> = {} as Record<MeterKey, Float32Array>;
    const engineSeries = engine.series;
    for (const [key, def] of Object.entries(meters.meters) as [MeterKey, typeof meters.meters[MeterKey]][]) {
      const arr = new Float32Array(len);
      for (let i = 0; i < len; i += 1) {
        const raw = Object.entries(def.weights).reduce((sum, [signal, weight]) => {
          return sum + (weight ?? 0) * (engineSeries[signal as Signal]?.[i] ?? 0);
        }, 0);
        const shape = def.nonlinearity ? nonlinearity[def.nonlinearity] : undefined;
        arr[i] = clamp(shape ? shape(raw) : raw, 0, 1.2);
      }
      result[key] = arr;
    }
    meters.setSeries(result);
  };

  watch(
    () => [engine.series, engine.gridMins.length, meters.meters],
    () => computeSeries(),
    { deep: true, immediate: true }
  );

  const values = computed<MeterVector>(() => {
    const idx = idxAtPlayhead.value;
    const out: MeterVector = {};
    for (const [key, series] of Object.entries(meters.series) as [MeterKey, Float32Array][]) {
      out[key] = series?.[idx] ?? 0;
    }
    return out;
  });

  watch(
    values,
    (val) => {
      meters.setValues(val);
    },
    { immediate: true }
  );

  const explain = (key: MeterKey, top = 3) => {
    const def = meters.meters[key];
    if (!def) return [] as Array<{ signal: Signal; weight: number }>;
    const entries = Object.entries(def.weights) as [Signal, number][];
    return entries
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
      .slice(0, top)
      .map(([signal, weight]) => ({ signal, weight }));
  };

  return { values, explain };
};
