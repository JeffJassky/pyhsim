<template>
  <div class="grid" :class="layout">
    <MeterGauge
      v-for="entry in meterEntries"
      :key="entry.key"
      :label="entry.label"
      :value="entry.value"
      @click="emit('click', entry.key)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { MeterKey, MeterMap, MeterVector } from '@/types';
import MeterGauge from './MeterGauge.vue';

const props = withDefaults(
  defineProps<{ values: MeterVector; meters: MeterMap; layout?: 'row' | 'grid' }>(),
  { layout: 'grid' }
);
const emit = defineEmits<{ click: [MeterKey] }>();

const meterEntries = computed(() =>
  Object.entries(props.values).map(([key, value]) => ({
    key: key as MeterKey,
    value,
    label: props.meters[key as MeterKey]?.label ?? key,
  }))
);
</script>

<style scoped>
.grid {
  display: grid;
  gap: 0.75rem;
}

.grid.grid {
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
}

.grid.row {
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}
</style>
