<template>
  <div class="mini-gauge" :aria-label="ariaLabel">
    <div class="mini-gauge__track">
      <div
        class="mini-gauge__fill"
        :style="{ width: clampedPercentage + '%' }"
      ></div>
    </div>
    <span class="mini-gauge__label">{{ displayValue }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  /** 0-1 fraction. */
  value: number;
  /** Optional override label. Otherwise renders as % */
  label?: string;
  ariaLabel?: string;
}>();

const clampedPercentage = computed(() => Math.max(0, Math.min(100, props.value * 100)));

const displayValue = computed(() => {
  if (props.label) return props.label;
  return `${Math.round(props.value * 100)}%`;
});
</script>

<style scoped>
.mini-gauge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
}

.mini-gauge__track {
  flex: 1;
  height: 0.5rem;
  background: var(--color-bg-subtle);
  border-radius: 2px;
  overflow: hidden;
}

.mini-gauge__fill {
  height: 100%;
  background: var(--color-text-active);
  border-radius: 2px;
  transition: width 0.2s ease;
}

.mini-gauge__label {
  font-size: 0.75rem;
  font-family: var(--font-mono, ui-monospace, monospace);
  color: var(--color-text-secondary);
  min-width: 3rem;
  text-align: right;
}
</style>
