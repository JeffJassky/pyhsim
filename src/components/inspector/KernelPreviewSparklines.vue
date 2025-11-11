<template>
  <div class="sparklines">
    <div v-for="signal in signals" :key="signal" class="sparkline">
      <small>{{ signal }}</small>
      <svg viewBox="0 0 100 30">
        <polyline :points="points(signal)" fill="none" stroke="currentColor" stroke-width="1" />
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ signals: string[]; previewData: Record<string, number[]> }>();
const points = (signal: string) => {
  const data = props.previewData[signal] ?? [];
  if (!data.length) return '';
  return data.map((value, idx) => `${(idx / (data.length - 1)) * 100},${30 - value * 20}`).join(' ');
};
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
