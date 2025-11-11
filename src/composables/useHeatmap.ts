import { computed, watch } from 'vue';
import type { OrganKey, OrganScoreVector, Signal } from '@/types';
import { useHeatmapStore } from '@/stores/heatmap';
import { useEngineStore } from '@/stores/engine';
import { useUIStore } from '@/stores/ui';
import { clamp } from '@/utils/math';

export const useHeatmap = () => {
  const heatmap = useHeatmapStore();
  const engine = useEngineStore();
  const ui = useUIStore();

  const idxAtPlayhead = computed(() => {
    const step = engine.gridStepMin || 1;
    return Math.min(engine.gridMins.length - 1, Math.round(ui.playheadMin / step));
  });

  const computeSeries = () => {
    const len = engine.gridMins.length;
    const result: Record<OrganKey, Float32Array> = {} as Record<OrganKey, Float32Array>;
    for (const [organ, weights] of Object.entries(heatmap.organWeights) as [OrganKey, Partial<Record<Signal, number>>][]) {
      const arr = new Float32Array(len);
      for (let i = 0; i < len; i += 1) {
        const val = Object.entries(weights).reduce((sum, [signal, weight]) => {
          return sum + (weight ?? 0) * (engine.series[signal as Signal]?.[i] ?? 0);
        }, 0);
        arr[i] = clamp(val, -1, 1.2);
      }
      result[organ] = arr;
    }
    heatmap.setOrganSeries(result);
  };

  watch(
    () => [engine.series, engine.gridMins.length, heatmap.organWeights],
    () => computeSeries(),
    { deep: true, immediate: true }
  );

  const scores = computed<OrganScoreVector>(() => {
    const idx = idxAtPlayhead.value;
    const result: OrganScoreVector = {};
    for (const [organ, series] of Object.entries(heatmap.organSeries) as [OrganKey, Float32Array][]) {
      result[organ] = series?.[idx] ?? 0;
    }
    return result;
  });

  watch(
    scores,
    (val) => {
      heatmap.setOrganScores(val);
    },
    { immediate: true }
  );

  const contributors = (organ: OrganKey, top = 3) => {
    const weights = heatmap.organWeights[organ];
    if (!weights) return [] as Array<{ signal: Signal; weight: number }>;
    return Object.entries(weights)
      .sort((a, b) => Math.abs((b[1] ?? 0)) - Math.abs((a[1] ?? 0)))
      .slice(0, top)
      .map(([signal, weight]) => ({ signal: signal as Signal, weight: weight ?? 0 }));
  };

  return { scores, contributors };
};
