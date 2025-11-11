<template>
  <svg class="mini" viewBox="0 0 100 10" preserveAspectRatio="none">
    <rect class="backdrop" x="0" y="0" width="100" height="10" rx="5" />
    <rect
      v-for="item in items"
      :key="item.id"
      class="item"
      :x="scale(item.start)"
      y="1"
      :width="Math.max(1, scale(item.end) - scale(item.start))"
      height="8"
      rx="3"
    />
  </svg>
</template>

<script setup lang="ts">
import type { TimelineItem } from '@/types';
import { MINUTES_IN_DAY } from '@/utils/time';
import { toMinuteOfDay } from '@/core/serialization';

const props = defineProps<{ items: TimelineItem[] }>();
const scale = (iso: string) => (toMinuteOfDay(iso) / MINUTES_IN_DAY) * 100;
</script>

<style scoped>
.mini {
  width: 100%;
  height: 32px;
}

.backdrop {
  fill: rgba(255, 255, 255, 0.05);
}

.item {
  fill: rgba(255, 255, 255, 0.4);
}
</style>
