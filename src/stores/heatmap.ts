import { defineStore } from 'pinia';
import type { HeatmapState, OrganKey, OrganScoreVector } from '@/types';
import { ORGAN_WEIGHTS } from '@/models/weights';

interface HeatmapStoreState extends HeatmapState {}

export const useHeatmapStore = defineStore('heatmap', {
  state: (): HeatmapStoreState => ({
    organWeights: ORGAN_WEIGHTS,
    organScoresAtPlayhead: {},
    organSeries: {} as Record<OrganKey, Float32Array>,
    showSystems: { endocrine: true, autonomic: true, metabolic: true },
  }),
  actions: {
    setOrganScores(scores: OrganScoreVector) {
      this.organScoresAtPlayhead = scores;
    },
    setOrganSeries(series: Record<OrganKey, Float32Array>) {
      this.organSeries = series;
    },
    toggleSystem(key: keyof HeatmapStoreState['showSystems']) {
      this.showSystems[key] = !this.showSystems[key];
    },
  },
});
