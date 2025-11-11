<template>
  <div class="meter">
    <div class="meter__label">
      <span>{{ icon }}</span>
      <strong>{{ label }}</strong>
    </div>
    <div class="meter__bar">
      <div class="meter__fill" :style="{ width: percent }" />
    </div>
    <small>{{ (value * 100).toFixed(0) }}%</small>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{ label: string; value: number; icon?: string }>(),
  { icon: '•' }
);
const percent = computed(() => `${Math.min(1, Math.max(0, props.value)) * 100}%`);
</script>

<style scoped>
.meter {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.5rem;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.meter__label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.meter__bar {
  width: 100%;
  height: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
}

.meter__fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #4ade80, #22d3ee);
}
</style>
