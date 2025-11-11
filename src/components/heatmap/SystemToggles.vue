<template>
  <div class="toggles">
    <button v-for="(enabled, key) in value" :key="key" :class="{ active: enabled }" @click="toggle(key)">
      {{ key }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { HeatmapState } from '@/types';
const props = defineProps<{ value: HeatmapState['showSystems'] }>();
const emit = defineEmits<{ 'update:value': [HeatmapState['showSystems']] }>();
const toggle = (key: keyof HeatmapState['showSystems']) => {
  emit('update:value', { ...props.value, [key]: !props.value[key] });
};
</script>

<style scoped>
.toggles {
  display: flex;
  gap: 0.5rem;
}

button {
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: transparent;
  border-radius: 999px;
  padding: 0.25rem 0.75rem;
  color: inherit;
  cursor: pointer;
}

button.active {
  background: rgba(255, 255, 255, 0.1);
}
</style>
