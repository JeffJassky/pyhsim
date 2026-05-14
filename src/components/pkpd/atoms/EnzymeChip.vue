<template>
  <button
    type="button"
    class="enzyme-chip"
    @click="emit('click', enzyme)"
    v-tooltip="`${enzyme}${fraction !== undefined ? ` — ${Math.round(fraction * 100)}%` : ''}. Click to inspect this enzyme.`"
  >
    <span class="enzyme-chip__label">{{ enzyme }}</span>
    <span v-if="fraction !== undefined" class="enzyme-chip__fraction">
      {{ Math.round(fraction * 100) }}%
    </span>
  </button>
</template>

<script setup lang="ts">
defineProps<{
  enzyme: string;
  /** Optional fraction 0-1 to show as percentage next to label. */
  fraction?: number;
}>();

const emit = defineEmits<{ click: [enzyme: string] }>();
</script>

<style scoped>
.enzyme-chip {
  display: inline-flex;
  align-items: baseline;
  gap: 0.4rem;
  padding: 0.2rem 0.55rem;
  font-size: 0.75rem;
  font-family: var(--font-mono, ui-monospace, monospace);
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  background: var(--color-bg-base);
  color: var(--color-text-primary);
  cursor: pointer;
  transition: background 0.12s ease, border-color 0.12s ease;
}

.enzyme-chip:hover {
  background: var(--color-bg-active);
  border-color: var(--color-border-strong);
}

.enzyme-chip__label {
  font-weight: 600;
  letter-spacing: 0.02em;
}

.enzyme-chip__fraction {
  font-weight: 400;
  color: var(--color-text-secondary);
  font-size: 0.7rem;
}
</style>
