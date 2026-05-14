<template>
  <section v-if="hasClearance" class="clearance-section">
    <h4 class="section-heading">How is this drug cleared?</h4>

    <!-- Hepatic -->
    <div v-if="hepaticSegments.length" class="route-block">
      <div class="route-block__title">
        <span class="route-block__name">Hepatic metabolism</span>
        <span class="route-block__detail mono">
          CL<sub>int</sub> {{ hepatic!.CL_int_mL_min.toFixed(0) }} mL/min
        </span>
      </div>

      <!-- Single enzyme: chip view -->
      <div v-if="hepaticSegments.length === 1" class="single-route">
        <EnzymeChip
          :enzyme="hepaticSegments[0].key"
          :fraction="hepaticSegments[0].fraction"
          @click="emit('enzyme-click', $event)"
        />
        <span class="single-route__note">handles essentially all of this drug's metabolism</span>
      </div>

      <!-- Multi-enzyme: bar -->
      <StackedFractionBar
        v-else
        :segments="hepaticSegments"
        @click="emit('enzyme-click', $event)"
      />
    </div>

    <!-- Renal -->
    <div v-if="hasRenal" class="route-block">
      <div class="route-block__title">
        <span class="route-block__name">Renal elimination</span>
        <span class="route-block__detail">{{ renalDetail }}</span>
      </div>
      <div v-if="renal!.filtration" class="renal-row">
        <span class="renal-row__label">Glomerular filtration</span>
        <span class="renal-row__value mono">
          {{ Math.round((renal!.filtration.fu_filtered ?? 1.0) * 100) }}% of free drug filtered
        </span>
      </div>
      <div
        v-for="(refCL, transporter) in renal!.secretion ?? {}"
        :key="transporter"
        class="renal-row"
      >
        <EnzymeChip :enzyme="String(transporter)" @click="emit('enzyme-click', $event)" />
        <span class="renal-row__value mono">{{ refCL }} mL/min · active secretion</span>
      </div>
    </div>

    <!-- Biliary -->
    <div v-if="hasBiliary" class="route-block">
      <div class="route-block__title">
        <span class="route-block__name">Biliary excretion</span>
        <span class="route-block__detail mono">{{ biliary!.CL_mL_min }} mL/min</span>
      </div>
      <div class="biliary-chips">
        <EnzymeChip
          v-for="(fraction, transporter) in biliary!.transporters ?? {}"
          :key="transporter"
          :enzyme="String(transporter)"
          :fraction="fraction"
          @click="emit('enzyme-click', $event)"
        />
      </div>
    </div>

    <p v-if="hasInteractiveChips" class="clearance-section__help">
      Tap any enzyme to see how it's currently functioning for you.
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { PharmacologyDef } from '@kyneticbio/core';
import EnzymeChip from '../atoms/EnzymeChip.vue';
import StackedFractionBar from '../atoms/StackedFractionBar.vue';

const props = defineProps<{
  pharmacology: PharmacologyDef | null | undefined;
}>();

const emit = defineEmits<{ 'enzyme-click': [enzyme: string] }>();

const pk = computed(() => (props.pharmacology as any)?.pk ?? null);
const clearance = computed(() => pk.value?.clearance ?? null);

const hepatic = computed(() => clearance.value?.hepatic ?? null);
const renal = computed(() => clearance.value?.renal ?? null);
const biliary = computed(() => clearance.value?.biliary ?? null);

const hepaticSegments = computed(() => {
  if (!hepatic.value?.enzymes) return [];
  return Object.entries(hepatic.value.enzymes)
    .filter(([, f]) => (f as number) > 0)
    .map(([key, fraction]) => ({ key, fraction: fraction as number }));
});

const hasRenal = computed(() => {
  if (!renal.value) return false;
  return Boolean(renal.value.filtration) ||
    (renal.value.secretion && Object.keys(renal.value.secretion).length > 0);
});

const hasBiliary = computed(() => {
  if (!biliary.value) return false;
  return biliary.value.CL_mL_min > 0;
});

const hasClearance = computed(
  () => hepaticSegments.value.length > 0 || hasRenal.value || hasBiliary.value,
);

const hasInteractiveChips = computed(
  () => hepaticSegments.value.length > 0 ||
    (renal.value?.secretion && Object.keys(renal.value.secretion).length > 0) ||
    hasBiliary.value,
);

const renalDetail = computed(() => {
  if (!renal.value) return '';
  const parts: string[] = [];
  if (renal.value.filtration) parts.push('passive filtration');
  const secretionCount = renal.value.secretion ? Object.keys(renal.value.secretion).length : 0;
  if (secretionCount > 0) parts.push(`${secretionCount} active transporter${secretionCount === 1 ? '' : 's'}`);
  return parts.join(' + ');
});
</script>

<style scoped>
.clearance-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border-subtle);
}

.section-heading {
  margin: 0 0 0.85rem;
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--color-text-primary);
}

.route-block {
  margin-bottom: 1rem;
}

.route-block__title {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0.5rem;
  font-size: 0.78rem;
}

.route-block__name {
  font-weight: 600;
  color: var(--color-text-primary);
}

.route-block__detail {
  color: var(--color-text-secondary);
  font-size: 0.7rem;
}

.single-route {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.single-route__note {
  font-size: 0.72rem;
  color: var(--color-text-secondary);
  font-style: italic;
}

.renal-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  margin: 0.3rem 0;
  font-size: 0.75rem;
}

.renal-row__label {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--color-text-secondary);
}

.renal-row__value {
  color: var(--color-text-secondary);
  font-size: 0.7rem;
}

.biliary-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.clearance-section__help {
  margin: 0.75rem 0 0;
  font-size: 0.7rem;
  color: var(--color-text-muted);
  font-style: italic;
}

.mono {
  font-family: var(--font-mono, ui-monospace, monospace);
}
</style>
