<template>
  <div class="palette">
    <div v-for="group in groupedDefs" :key="group.name" class="palette-group">
      <p class="group-heading">{{ group.name }}</p>
      <div
        v-for="def in group.defs"
        :key="def.key"
        class="pill"
        :style="{ '--pill-color': def.color }"
        draggable="true"
        @dragstart="() => emit('dragstart', def)"
        @click="() => emit('select', def)"
      >
        <span class="icon">{{ def.icon }}</span>
        <strong>{{ def.label }}</strong>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { InterventionDef } from '@/types';

const props = defineProps<{ defs: InterventionDef[] }>();
const emit = defineEmits<{ select: [InterventionDef]; dragstart: [InterventionDef] }>();

const groupedDefs = computed(() => {
  const map = new Map<string, InterventionDef[]>();
  props.defs.forEach((def) => {
    const group = def.group ?? 'Other';
    if (!map.has(group)) map.set(group, []);
    map.get(group)!.push(def);
  });
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, defs]) => ({
      name,
      defs: [...defs].sort((a, b) => a.label.localeCompare(b.label)),
    }));
});
</script>

<style scoped>
.palette {
  display: flex;

  flex-direction: column;
  gap: 0.75rem;
}

.palette-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.group-heading {
  margin: 0;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.5;
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
</style>
