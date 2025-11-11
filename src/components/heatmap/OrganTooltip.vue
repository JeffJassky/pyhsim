<template>
  <div class="tooltip" v-if="organ">
    <h4>{{ organ }}</h4>
    <slot />
  </div>
</template>

<script setup lang="ts">
import type { OrganKey } from '@/types';
const props = defineProps<{ organ?: OrganKey }>();
</script>

<style scoped>
.tooltip {
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.6);
}
</style>
