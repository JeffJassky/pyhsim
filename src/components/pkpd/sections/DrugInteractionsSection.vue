<template>
  <section v-if="hasAny" class="interactions-section">
    <h4 class="section-heading">Effects on other drugs</h4>

    <!-- Inhibits -->
    <div v-if="inhibits.length" class="interactions-block">
      <div class="interactions-block__title">
        <span class="inhibits-arrow">▼</span>
        Inhibits enzymes / transporters
      </div>
      <ul class="interactions-list">
        <li v-for="inh in inhibits" :key="inh.enzyme" class="interactions-row">
          <div class="interactions-row__head">
            <EnzymeChip :enzyme="inh.enzyme" @click="emit('enzyme-click', $event)" />
            <MechanismBadge :mechanism="inh.mechanism" />
            <MBIBadge
              v-if="inh.mechanism === 'mechanism-based'"
              :k-inact-per-min="inh.k_inact_per_min"
            />
          </div>
          <div class="interactions-row__detail">
            <span class="metric">
              <span class="metric__label">K<sub>i</sub></span>
              <span class="metric__value">{{ inh.Ki_mg_per_L.toFixed(3) }} mg/L</span>
            </span>
            <span v-if="inh.k_inact_per_min" class="metric">
              <span class="metric__label">k<sub>inact</sub></span>
              <span class="metric__value">{{ inh.k_inact_per_min.toFixed(2) }}/min</span>
            </span>
          </div>
        </li>
      </ul>
    </div>

    <!-- Induces -->
    <div v-if="induces.length" class="interactions-block">
      <div class="interactions-block__title">
        <span class="induces-arrow">▲</span>
        Induces enzymes / transporters
      </div>
      <ul class="interactions-list">
        <li v-for="ind in induces" :key="ind.enzyme" class="interactions-row">
          <div class="interactions-row__head">
            <EnzymeChip :enzyme="ind.enzyme" @click="emit('enzyme-click', $event)" />
            <span class="induction-emax">
              up to {{ ind.Emax.toFixed(1) }}× activity
            </span>
          </div>
          <div class="interactions-row__detail">
            <span class="metric">
              <span class="metric__label">EC<sub>50</sub></span>
              <span class="metric__value">{{ ind.EC50_mg_per_L.toFixed(2) }} mg/L</span>
            </span>
            <span class="induction-note">
              builds over ~3-7 days; persists similarly after stop
            </span>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { PharmacologyDef } from '@kyneticbio/core';
import EnzymeChip from '../atoms/EnzymeChip.vue';
import MechanismBadge from '../atoms/MechanismBadge.vue';
import MBIBadge from '../atoms/MBIBadge.vue';

const props = defineProps<{
  pharmacology: PharmacologyDef | null | undefined;
}>();

const emit = defineEmits<{ 'enzyme-click': [enzyme: string] }>();

const inhibits = computed(() => (props.pharmacology as any)?.inhibits ?? []);
const induces = computed(() => (props.pharmacology as any)?.induces ?? []);

const hasAny = computed(() => inhibits.value.length > 0 || induces.value.length > 0);
</script>

<style scoped>
.interactions-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border-subtle);
}

.section-heading {
  margin: 0 0 0.75rem;
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--color-text-primary);
}

.interactions-block {
  margin-bottom: 1rem;
}

.interactions-block__title {
  font-size: 0.78rem;
  font-weight: 600;
  margin-bottom: 0.4rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--color-text-secondary);
}

.inhibits-arrow {
  color: var(--color-warning);
}
.induces-arrow {
  color: var(--color-success);
}

.interactions-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.interactions-row {
  padding: 0.5rem 0.6rem;
  border-radius: 4px;
  background: var(--color-bg-subtle);
}

.interactions-row__head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.interactions-row__detail {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 0.35rem;
  font-size: 0.72rem;
}

.metric {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}

.metric__label {
  color: var(--color-text-muted);
}

.metric__value {
  font-family: var(--font-mono, ui-monospace, monospace);
  font-weight: 600;
  color: var(--color-text-primary);
}

.induction-emax {
  font-size: 0.72rem;
  color: var(--color-success);
  font-weight: 600;
  font-family: var(--font-mono, ui-monospace, monospace);
}

.induction-note {
  font-style: italic;
  color: var(--color-text-muted);
}
</style>
