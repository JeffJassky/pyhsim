<template>
  <span class="mbi-badge" v-tooltip="tooltipText">
    <span class="mbi-badge__icon">⚠</span>
    <span class="mbi-badge__label">Irreversible</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  /** k_inact in /min — used to estimate washout duration. */
  kInactPerMin?: number;
  /** Enzyme tau in minutes (protein turnover). Defaults to 3 days for CYPs. */
  tauMin?: number;
}>();

const tooltipText = computed(() => {
  const tau = props.tauMin ?? 4320;
  const washoutDays = Math.round(tau / 1440);
  const k = props.kInactPerMin
    ? ` k_inact ≈ ${props.kInactPerMin.toFixed(2)}/min · `
    : '';
  return `Mechanism-based inhibition: enzyme is irreversibly inactivated. ${k}Full recovery requires ~${washoutDays} days of enzyme re-synthesis after the drug clears.`;
});
</script>

<style scoped>
.mbi-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.15rem 0.5rem 0.15rem 0.4rem;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  border-radius: 3px;
  background: color-mix(in srgb, var(--color-warning) 12%, transparent);
  color: var(--color-warning);
  border: 1px solid color-mix(in srgb, var(--color-warning) 40%, transparent);
  cursor: help;
}

.mbi-badge__icon {
  font-size: 0.85rem;
  line-height: 1;
}
</style>
