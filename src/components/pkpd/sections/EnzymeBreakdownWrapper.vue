<template>
  <EnzymeActivityBreakdownSection
    v-if="isEnzymeSignal"
    :signal-key="signalKey"
    :live-value="liveValue"
    :playhead-min="playheadMin"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import EnzymeActivityBreakdownSection from './EnzymeActivityBreakdownSection.vue';
import type { Minute } from '@kyneticbio/core';

const props = defineProps<{
  signalKey: string;
  grid: readonly Minute[];
  seriesData: Record<string, number[]>;
  playheadMin: number;
}>();

const isEnzymeSignal = computed(() => /Activity$/.test(props.signalKey));

const playheadIndex = computed(() => {
  if (props.grid.length < 2) return 0;
  const step = props.grid[1] - props.grid[0];
  const idx = Math.round((props.playheadMin - props.grid[0]) / step);
  return Math.max(0, Math.min(props.grid.length - 1, idx));
});

const liveValue = computed<number | undefined>(() => {
  const series = props.seriesData[props.signalKey];
  if (!series) return undefined;
  return series[playheadIndex.value];
});
</script>
