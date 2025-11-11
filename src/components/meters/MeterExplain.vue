<template>
  <ul class="explain">
    <li v-for="entry in entries" :key="entry.signal">
      <span>{{ entry.signal }}</span>
      <span>{{ entry.weight.toFixed(2) }}</span>
    </li>
  </ul>
</template>

<script setup lang="ts">
import type { MeterKey } from '@/types';

const props = defineProps<{ entries: Array<{ signal: string; weight: number }>; meter: MeterKey }>();
</script>

<style scoped>
.explain {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

li {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  opacity: 0.8;
}
</style>
