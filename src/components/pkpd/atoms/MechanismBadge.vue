<template>
  <span class="mechanism-badge" :class="`mechanism-badge--${mechanism}`">
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  mechanism: 'competitive' | 'noncompetitive' | 'mechanism-based';
}>();

const label = computed(() => {
  switch (props.mechanism) {
    case 'competitive': return 'Competitive';
    case 'noncompetitive': return 'Noncompetitive';
    case 'mechanism-based': return 'Mechanism-based';
  }
});
</script>

<style scoped>
.mechanism-badge {
  display: inline-block;
  padding: 0.1rem 0.45rem;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  border-radius: 3px;
  border: 1px solid currentColor;
  background: transparent;
}

.mechanism-badge--competitive { color: var(--color-text-secondary); }
.mechanism-badge--noncompetitive { color: var(--color-text-secondary); }
.mechanism-badge--mechanism-based { color: var(--color-warning); }
</style>
