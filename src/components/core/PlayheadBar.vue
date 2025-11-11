<template>
  <div class="playhead">
    <label>{{ label }}</label>
    <span class="playhead__time">{{ formatted }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { minuteToLabel } from '@/utils/time';
import type { Minute } from '@/types';

const props = defineProps<{ minute: Minute }>();

const label = '';
const formatted = computed(() => minuteToLabel(props.minute));
</script>

<style scoped>
.playhead {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.playhead__time {
  font-variant-numeric: tabular-nums;
  opacity: 0.85;
}
</style>
