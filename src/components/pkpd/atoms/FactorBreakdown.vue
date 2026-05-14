<template>
  <div class="factor-table">
    <table>
      <tbody>
        <tr v-for="(row, idx) in factors" :key="row.label" :class="rowClass(row)">
          <td class="factor-table__op">{{ idx === 0 ? '' : '×' }}</td>
          <td class="factor-table__label" v-tooltip="row.tooltip">
            {{ row.label }}
            <span v-if="row.context" class="factor-table__context">{{ row.context }}</span>
          </td>
          <td class="factor-table__value">{{ formatValue(row.value) }}</td>
        </tr>
        <tr class="factor-table__total-spacer"><td colspan="3"></td></tr>
        <tr class="factor-table__total">
          <td class="factor-table__op">=</td>
          <td class="factor-table__label">{{ totalLabel ?? 'result' }}</td>
          <td class="factor-table__value">{{ formatValue(total) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface FactorRow {
  label: string;
  value: number;
  /** Optional context shown next to label in muted tone (e.g. "female", "28y"). */
  context?: string;
  /** Hover tooltip explaining the factor's mechanism. */
  tooltip?: string;
}

const props = defineProps<{
  factors: FactorRow[];
  totalLabel?: string;
}>();

const total = computed(() => props.factors.reduce((acc, r) => acc * r.value, 1));

function formatValue(v: number): string {
  if (Math.abs(v - 1) < 0.005) return '1.00';
  return v.toFixed(2);
}

/**
 * Only highlight value color when deviation is materially meaningful.
 * Below 10% deviation, leave neutral — small numerical drift from diurnal /
 * weak inflammation doesn't warrant a warning color.
 */
const SIGNIFICANT_DEVIATION = 0.1;

function rowClass(row: FactorRow): string {
  const dev = Math.abs(row.value - 1);
  if (dev < SIGNIFICANT_DEVIATION) return 'factor-table__row--neutral';
  if (row.value > 1) return 'factor-table__row--up';
  return 'factor-table__row--down';
}
</script>

<style scoped>
.factor-table table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
  font-family: var(--font-mono, ui-monospace, monospace);
}

.factor-table tr {
  border-bottom: 1px solid var(--color-border-subtle);
}

.factor-table__op {
  width: 1.5rem;
  padding: 0.5rem 0;
  color: var(--color-text-muted);
  text-align: center;
  vertical-align: middle;
  white-space: nowrap;
}

.factor-table__label {
  padding: 0.5rem 0.75rem 0.5rem 0;
  color: var(--color-text-primary);
  white-space: nowrap;
  vertical-align: middle;
  cursor: help;
}

.factor-table__context {
  margin-left: 0.6rem;
  color: var(--color-text-muted);
  font-size: 0.78rem;
  font-weight: 400;
}

.factor-table__value {
  padding: 0.5rem 0;
  text-align: right;
  font-weight: 600;
  width: 4rem;
  vertical-align: middle;
  white-space: nowrap;
}

.factor-table__row--up .factor-table__value { color: var(--color-warning); }
.factor-table__row--down .factor-table__value { color: var(--color-success); }
.factor-table__row--neutral .factor-table__value { color: var(--color-text-primary); }

.factor-table__total-spacer {
  border: none;
}
.factor-table__total-spacer td {
  padding: 0.15rem 0;
  border: none;
}

.factor-table__total {
  border-top: 2px solid var(--color-border-strong);
  border-bottom: none;
}

.factor-table__total .factor-table__op,
.factor-table__total .factor-table__label,
.factor-table__total .factor-table__value {
  padding-top: 0.6rem;
  padding-bottom: 0.6rem;
}

.factor-table__total .factor-table__label {
  font-weight: 700;
  font-family: inherit;
}

.factor-table__total .factor-table__value {
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--color-text-primary);
}
</style>
