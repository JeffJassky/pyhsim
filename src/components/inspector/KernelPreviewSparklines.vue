<template>
  <div class="sparkline-box">
    <svg viewBox="0 0 100 30">
      <polyline :points="points" fill="none" stroke="currentColor" stroke-width="1" />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
const props = defineProps<{ previewData: number[] }>();
const points = computed(() => {
  const data = props.previewData ?? [];
  if (!data.length) return '';
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  return data.map((value, idx) => {
    const x = (idx / (data.length - 1)) * 100;
    const y = 30 - ((value - min) / range) * 25 - 2;
    return `${x},${y}`;
  }).join(' ');
});
</script>

<style scoped>
.sparklines {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 0.5rem;
}

.sparkline {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 0.25rem;
}

svg {
  width: 100%;
  height: 30px;
}
</style>
