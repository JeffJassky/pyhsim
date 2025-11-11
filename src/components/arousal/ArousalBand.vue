<template>
  <div class="band">
    <div class="band__track">
      <div class="band__marker" :style="{ left: `${components.overall * 100}%` }"></div>
    </div>
    <div class="band__labels">
      <span>Ventral</span>
      <span>Mobilized</span>
      <span>Dorsal</span>
    </div>
    <div class="band__stats">
      <span>Symp {{ (components.sympathetic * 100).toFixed(0) }}%</span>
      <span>Para {{ (components.parasympathetic * 100).toFixed(0) }}%</span>
      <strong>{{ components.state }}</strong>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ArousalComponents } from '@/types';
const props = defineProps<{ components: ArousalComponents }>();
</script>

<style scoped>
.band {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.band__track {
  position: relative;
  height: 8px;
  border-radius: 999px;
  background: linear-gradient(90deg, #0ea5e9, #22c55e, #f97316);
}

.band__marker {
  position: absolute;
  top: -4px;
  width: 12px;
  height: 16px;
  border-radius: 4px;
  background: white;
  transform: translateX(-50%);
}

.band__labels,
.band__stats {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  text-transform: uppercase;
  opacity: 0.7;
}
</style>
