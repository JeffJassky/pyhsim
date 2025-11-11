<template>
  <div class="body">
    <button
      v-for="([organ, score]) in entries"
      :key="organ"
      class="organ"
      :style="{ background: color(score) }"
      @mouseenter="onHover(organ)"
      @mouseleave="onLeave"
      @click="onPin(organ)"
    >
      <strong>{{ organ }}</strong>
      <small>{{ score.toFixed(2) }}</small>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { OrganKey, OrganScoreVector } from '@/types';
import { createDivergingScale } from '@/utils/color';

const props = defineProps<{ organScores: OrganScoreVector }>();
const emit = defineEmits<{ hover: [OrganKey | undefined]; pin: [OrganKey] }>();
const scale = createDivergingScale([-1, 1.2]);

const entries = computed(() => Object.entries(props.organScores) as Array<[OrganKey, number]>);

const color = (score: number) => {
  const t = scale.normalize(score);
  const hot = [255, 99, 71];
  const cool = [64, 99, 255];
  const mix = hot.map((channel, idx) => Math.round(cool[idx] + (channel - cool[idx]) * t));
  return `rgba(${mix.join(',')}, 0.15)`;
};

const onHover = (organ: OrganKey) => emit('hover', organ);
const onLeave = () => emit('hover', undefined);
const onPin = (organ: OrganKey) => emit('pin', organ);
</script>

<style scoped>
.body {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.5rem;
}

.organ {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 0.5rem;
  text-align: left;
  color: inherit;
  background: transparent;
  cursor: pointer;
}
</style>
