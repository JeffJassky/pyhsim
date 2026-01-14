import { defineStore } from 'pinia';
import type { ArousalComponentKey, ArousalComponents, ArousalState } from '@/types';
import { DEFAULT_AROUSAL_WEIGHTS } from '@/models/ui/weights';

interface ArousalStoreState extends ArousalState {}

const defaultComponents: ArousalComponents = {
  sympathetic: 0,
  parasympathetic: 0,
  overall: 0,
  state: 'ventral',
};

export const useArousalStore = defineStore('arousal', {
  state: (): ArousalStoreState => ({
    weights: DEFAULT_AROUSAL_WEIGHTS,
    componentsAtPlayhead: defaultComponents,
    series: {
      sympathetic: new Float32Array(),
      parasympathetic: new Float32Array(),
      overall: new Float32Array(),
    } as Record<ArousalComponentKey, Float32Array>,
  }),
  actions: {
    setComponents(components: ArousalComponents) {
      this.componentsAtPlayhead = components;
    },
    setSeries(series: Record<ArousalComponentKey, Float32Array>) {
      this.series = series;
    },
  },
});
