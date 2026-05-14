<template>
  <div class="impact-callout" :class="`impact-callout--${direction}`">
    <div class="impact-callout__icon">
      <span v-if="direction === 'up'">↑</span>
      <span v-else-if="direction === 'down'">↓</span>
      <span v-else>•</span>
    </div>
    <div class="impact-callout__body">
      <h4 class="impact-callout__headline">{{ headline }}</h4>
      <p v-if="magnitude" class="impact-callout__magnitude">{{ magnitude }}</p>
      <p v-if="explanation" class="impact-callout__explanation">
        <span class="impact-callout__why">Why:</span>
        {{ explanation }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  direction: 'up' | 'down' | 'neutral';
  headline: string;
  magnitude?: string;
  explanation?: string;
}>();
</script>

<style scoped>
.impact-callout {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem 0.9rem;
  border-radius: 6px;
  border: 1px solid currentColor;
  margin: 0.75rem 0;
  background: color-mix(in srgb, currentColor 8%, transparent);
}

.impact-callout--up {
  /* "More exposure / slower clearance" — warning tone */
  color: var(--color-warning);
}
.impact-callout--down {
  /* "Less exposure / faster clearance" — success tone */
  color: var(--color-success);
}
.impact-callout--neutral {
  color: var(--color-text-secondary);
}

.impact-callout__icon {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1;
}

.impact-callout__body {
  flex: 1;
}

.impact-callout__headline {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.impact-callout__magnitude {
  margin: 0.15rem 0 0;
  font-size: 0.85rem;
  font-family: var(--font-mono, ui-monospace, monospace);
  color: currentColor;
  font-weight: 600;
}

.impact-callout__explanation {
  margin: 0.4rem 0 0;
  font-size: 0.8rem;
  line-height: 1.4;
  color: var(--color-text-secondary);
}

.impact-callout__why {
  font-weight: 600;
  color: var(--color-text-primary);
}
</style>
