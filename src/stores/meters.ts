import { defineStore } from 'pinia';
import type { MeterKey, MeterState, MeterVector } from '@/types';
import { DEFAULT_METER_WEIGHTS } from '@/models';

interface MeterStoreState extends MeterState {}

export const useMetersStore = defineStore('meters', {
  state: (): MeterStoreState => ({
    meters: DEFAULT_METER_WEIGHTS,
    valuesAtPlayhead: {} as MeterVector,
    series: {} as Record<MeterKey, Float32Array>,
  }),
  actions: {
    setValues(values: MeterVector) {
      this.valuesAtPlayhead = values;
    },
    setSeries(series: Record<MeterKey, Float32Array>) {
      this.series = series;
    },
  },
});
