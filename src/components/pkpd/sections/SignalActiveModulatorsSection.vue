<template>
  <div v-if="hasContent" class="modulators-section">
    <div v-if="modulators.inhibitors.length" class="block">
      <h4 class="block-title">
        <span class="arrow-down">▼</span>
        Currently inhibiting ({{ modulators.inhibitors.length }})
      </h4>
      <ul class="mod-list">
        <li v-for="inh in modulators.inhibitors" :key="inh.itemId" class="mod-row">
          <div class="mod-row__head">
            <button class="drug-chip" @click="emit('drug-click', inh.itemId)">{{ inh.drugLabel }}</button>
            <MechanismBadge :mechanism="inh.mechanism" />
            <MBIBadge
              v-if="inh.mechanism === 'mechanism-based'"
              :k-inact-per-min="inh.k_inact_per_min"
            />
          </div>
          <div class="mod-row__detail">
            <span class="metric">K<sub>i</sub> {{ inh.Ki_mg_per_L.toFixed(3) }} mg/L</span>
            <span v-if="inh.k_inact_per_min" class="metric">k<sub>inact</sub> {{ inh.k_inact_per_min.toFixed(2) }}/min</span>
          </div>
        </li>
      </ul>
    </div>

    <div v-if="modulators.inducers.length" class="block">
      <h4 class="block-title">
        <span class="arrow-up">▲</span>
        Currently inducing ({{ modulators.inducers.length }})
      </h4>
      <ul class="mod-list">
        <li v-for="ind in modulators.inducers" :key="ind.itemId" class="mod-row">
          <div class="mod-row__head">
            <button class="drug-chip" @click="emit('drug-click', ind.itemId)">{{ ind.drugLabel }}</button>
            <span class="induction-emax">up to {{ ind.Emax.toFixed(1) }}× activity</span>
          </div>
          <div class="mod-row__detail">
            <span class="metric">EC<sub>50</sub> {{ ind.EC50_mg_per_L.toFixed(2) }} mg/L</span>
            <span class="induction-note">builds over ~3-7 days</span>
          </div>
        </li>
      </ul>
    </div>
  </div>
  <p v-else class="no-modulators">
    No drugs are currently affecting this enzyme on the timeline.
  </p>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import MechanismBadge from '../atoms/MechanismBadge.vue';
import MBIBadge from '../atoms/MBIBadge.vue';
import type { ActiveModulators } from '@/composables/useActiveModulators';

const props = defineProps<{
  modulators: ActiveModulators;
}>();

const emit = defineEmits<{ 'drug-click': [itemId: string] }>();

const hasContent = computed(() => props.modulators.inhibitors.length > 0 || props.modulators.inducers.length > 0);
</script>

<style scoped>
.modulators-section {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.block-title {
  margin: 0 0 0.4rem;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.arrow-down { color: var(--color-warning); }
.arrow-up { color: var(--color-success); }

.mod-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.mod-row {
  padding: 0.5rem 0.6rem;
  border-radius: 4px;
  background: var(--color-bg-subtle);
}

.mod-row__head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.mod-row__detail {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.3rem;
  font-size: 0.72rem;
  color: var(--color-text-secondary);
  font-family: var(--font-mono, ui-monospace, monospace);
}

.metric { font-weight: 600; }

.drug-chip {
  background: var(--color-bg-base);
  border: 1px solid var(--color-border-subtle);
  border-radius: 4px;
  padding: 0.15rem 0.5rem;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  color: var(--color-text-primary);
}

.drug-chip:hover {
  background: var(--color-bg-subtle);
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

.no-modulators {
  margin: 0.5rem 0 0;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  font-style: italic;
}
</style>
