import { computed, watch } from 'vue';
import type { ArousalComponentKey, Signal } from '@/types';
import { useArousalStore } from '@/stores/arousal';
import { useEngineStore } from '@/stores/engine';
import { useUIStore } from '@/stores/ui';
import { clamp, sigmoid } from '@/utils/math';

export const useArousal = () => {
  const arousal = useArousalStore();
  const engine = useEngineStore();
  const ui = useUIStore();

  const idxAtPlayhead = computed(() => {
    const step = engine.gridStepMin || 1;
    return Math.min(engine.gridMins.length - 1, Math.round(ui.playheadMin / step));
  });

  const valueAt = (weights: Partial<Record<Signal, number>>, idx: number) =>
    Object.entries(weights).reduce((sum, [signal, weight]) => {
      return sum + (weight ?? 0) * (engine.series[signal as Signal]?.[idx] ?? 0);
    }, 0);

  const computeSeries = () => {
    const len = engine.gridMins.length;
    const sympatheticArr = new Float32Array(len);
    const parasympatheticArr = new Float32Array(len);
    const overallArr = new Float32Array(len);

    for (let i = 0; i < len; i += 1) {
      const sympathetic = clamp(valueAt(arousal.weights.sympathetic, i), 0, 1.2);
      const parasympathetic = clamp(valueAt(arousal.weights.parasympathetic, i), 0, 1.2);
      sympatheticArr[i] = sympathetic;
      parasympatheticArr[i] = parasympathetic;
      overallArr[i] = sigmoid(sympathetic - parasympathetic);
    }

    arousal.setSeries({
      sympathetic: sympatheticArr,
      parasympathetic: parasympatheticArr,
      overall: overallArr,
    });
  };

  watch(
    () => [engine.series, engine.gridMins.length, arousal.weights],
    () => computeSeries(),
    { deep: true, immediate: true }
  );

  const components = computed(() => {
    const idx = idxAtPlayhead.value;
    const sympathetic = arousal.series.sympathetic?.[idx] ?? 0;
    const parasympathetic = arousal.series.parasympathetic?.[idx] ?? 0;
    const overall = arousal.series.overall?.[idx] ?? sigmoid(sympathetic - parasympathetic);
    let state: typeof arousal.componentsAtPlayhead.state = 'ventral';
    if (overall > 0.7) state = 'mobilized';
    else if (overall < 0.3) state = 'dorsal';
    return { sympathetic, parasympathetic, overall, state };
  });

  watch(
    components,
    (value) => arousal.setComponents(value),
    { immediate: true }
  );

  return { components };
};
