<template>
  <div class="palette">
    <div
      v-for="def in defs"
      :key="def.key"
      class="pill"
      :style="{ '--pill-color': def.color }"
      draggable="true"
      @dragstart="() => emit('dragstart', def)"
      @click="() => emit('select', def)"
    >
      <span class="icon">{{ def.icon }}</span>
      <div>
        <strong>{{ def.label }}</strong>
        <small>{{ def.group }}</small>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { InterventionDef } from '@/types';

const props = defineProps<{ defs: InterventionDef[] }>();
const emit = defineEmits<{ select: [InterventionDef]; dragstart: [InterventionDef] }>();
</script>

<style scoped>
.palette {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.75rem;
}

.pill {
  display: flex;
  gap: 0.5rem;
  border-radius: 12px;
  padding: 0.75rem;
  background: color-mix(in srgb, var(--pill-color, #ffffff) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--pill-color, #ffffff) 40%, transparent);
  cursor: pointer;
}

.icon {
  font-size: 1.3rem;
}

small {
  opacity: 0.7;
}
</style>
