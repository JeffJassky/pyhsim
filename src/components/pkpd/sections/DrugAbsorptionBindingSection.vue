<template>
  <section v-if="hasContent" class="abs-binding-section">

    <!-- Absorption -->
    <div v-if="absDetails.length || ehr || pgpSubstrate" class="block">
      <h4 class="section-heading">Absorption</h4>
      <div class="absorption-summary" v-if="absorptionSummary">
        {{ absorptionSummary }}
      </div>
      <ul v-if="absDetails.length" class="absorption-modifiers">
        <li v-for="d in absDetails" :key="d.text">
          <span class="absorption-modifiers__tick">✓</span>
          {{ d.text }}
        </li>
      </ul>
      <div v-if="pgpSubstrate" class="pgp-flag">
        <strong>P-gp substrate</strong> — gut absorption reduced when P-gp is induced
        (e.g., by rifampin, St John's Wort, carbamazepine).
      </div>
      <div v-if="ehr" class="ehr-flag">
        <strong>Enterohepatic recirculation</strong> — ~{{ Math.round(ehr.fraction_recycled * 100) }}%
        of the dose cycles back through gut β-glucuronidase, producing a secondary peak
        ~{{ Math.round(ehr.transit_min / 60) }}h after dosing.
      </div>
    </div>

    <!-- Plasma binding -->
    <div v-if="binding" class="block">
      <h4 class="section-heading">Plasma binding</h4>
      <div class="binding-gauge">
        <MiniGauge
          :value="boundFraction"
          :label="`${Math.round(boundFraction * 100)}% bound`"
        />
      </div>
      <p class="binding-detail">
        Primarily bound to <strong>{{ binding.primary === 'AAG' ? 'AAG (α-1 acid glycoprotein)' : 'albumin' }}</strong>;
        baseline free fraction (fu) <span class="mono">{{ binding.fu_baseline.toFixed(2) }}</span>.
      </p>
      <p v-if="subjectFuDelta" class="binding-subject-impact" :class="`binding-subject-impact--${subjectFuDelta.direction}`">
        For you, the effective free fraction is
        <strong class="mono">~{{ subjectFuDelta.fuSubject.toFixed(2) }}</strong>
        ({{ subjectFuDelta.summary }}).
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import type { PharmacologyDef } from '@kyneticbio/core';
import { useUserStore } from '@/stores/user';
import MiniGauge from '../atoms/MiniGauge.vue';

const props = defineProps<{
  pharmacology: PharmacologyDef | null | undefined;
}>();

const userStore = useUserStore();
const { subject } = storeToRefs(userStore);

const pk = computed(() => (props.pharmacology as any)?.pk ?? null);

const isOralBolus = computed(() => (pk.value?.delivery ?? 'bolus') === 'bolus');

const binding = computed(() => pk.value?.binding ?? null);

const ehr = computed(() => pk.value?.enterohepatic ?? null);

const pgpSubstrate = computed(() => Boolean(pk.value?.pgp_substrate));

// Absorption summary line: bioavailability, Tmax
const absorptionSummary = computed(() => {
  if (!pk.value || !isOralBolus.value) return null;
  const parts: string[] = [];
  if (pk.value.bioavailability !== undefined) {
    parts.push(`F = ${Math.round(pk.value.bioavailability * 100)}%`);
  }
  if (pk.value.timeToPeakMin) {
    const hours = pk.value.timeToPeakMin / 60;
    const display = hours >= 1 ? `~${hours.toFixed(1)} h` : `~${pk.value.timeToPeakMin} min`;
    parts.push(`Tmax ${display}`);
  }
  return parts.join(' · ') || null;
});

// Subject-state absorption modifiers (just direction info, not magnitudes)
const absDetails = computed(() => {
  if (!isOralBolus.value) return [];
  const details: { text: string }[] = [];
  const microbiome = subject.value?.microbiome;
  if (microbiome?.gastric_emptying_time_mins) {
    const ge = microbiome.gastric_emptying_time_mins;
    if (ge > 90) details.push({ text: `Slowed by your delayed gastric emptying (${ge} min)` });
    else if (ge < 40) details.push({ text: `Accelerated by your fast gastric emptying (${ge} min)` });
  }
  if (microbiome?.sibo_methane_peak_ppm && microbiome.sibo_methane_peak_ppm > 10) {
    details.push({ text: `Slowed by elevated SIBO methane (${microbiome.sibo_methane_peak_ppm} ppm)` });
  }
  return details;
});

// Subject-state binding impact (live fu vs baseline)
const boundFraction = computed(() => binding.value ? 1 - binding.value.fu_baseline : 0);

const subjectFuDelta = computed(() => {
  const b = binding.value;
  if (!b) return null;
  if (b.primary === 'albumin') {
    const subjectAlb = subject.value?.bloodwork?.metabolic?.albumin_g_dL;
    if (subjectAlb === undefined) return null;
    const ratio = subjectAlb / 4.2;
    const fuSubject = Math.max(b.fu_baseline, Math.min(1, 1 - (1 - b.fu_baseline) * ratio));
    if (Math.abs(fuSubject - b.fu_baseline) < 0.005) return null;
    const direction = fuSubject > b.fu_baseline ? 'up' : 'down';
    const summary = direction === 'up'
      ? `your albumin ${subjectAlb} g/dL is below the reference 4.2, leaving more free drug`
      : `your albumin ${subjectAlb} g/dL is above the reference 4.2`;
    return { fuSubject, direction, summary };
  }
  if (b.primary === 'AAG') {
    const subjectAag = subject.value?.bloodwork?.inflammation?.aag_mg_dL;
    if (subjectAag === undefined) return null;
    const ratio = subjectAag / 85;
    const fuSubject = Math.max(0.01, Math.min(1, 1 - (1 - b.fu_baseline) * ratio));
    if (Math.abs(fuSubject - b.fu_baseline) < 0.005) return null;
    const direction = fuSubject > b.fu_baseline ? 'up' : 'down';
    const summary = direction === 'up'
      ? `your AAG ${subjectAag} mg/dL is below reference 85`
      : `your AAG ${subjectAag} mg/dL is elevated (acute-phase response) — more drug is bound`;
    return { fuSubject, direction, summary };
  }
  return null;
});

const hasContent = computed(() => Boolean(absorptionSummary.value) || absDetails.value.length > 0 || ehr.value || pgpSubstrate.value || binding.value);
</script>

<style scoped>
.abs-binding-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border-subtle);
}

.section-heading {
  margin: 0 0 0.5rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.block {
  margin-bottom: 1rem;
}

.absorption-summary {
  font-size: 0.78rem;
  font-family: var(--font-mono, ui-monospace, monospace);
  color: var(--color-text-secondary);
  margin-bottom: 0.4rem;
}

.absorption-modifiers {
  list-style: none;
  padding: 0;
  margin: 0.25rem 0;
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.absorption-modifiers li {
  margin: 0.15rem 0;
}

.absorption-modifiers__tick {
  color: var(--color-success);
  margin-right: 0.35rem;
}

.pgp-flag,
.ehr-flag {
  margin-top: 0.4rem;
  padding: 0.5rem 0.6rem;
  background: var(--color-bg-subtle);
  border-left: 2px solid var(--color-warning);
  border-radius: 0 4px 4px 0;
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

.ehr-flag {
  border-left-color: var(--color-text-active);
}

.binding-gauge {
  margin-bottom: 0.5rem;
}

.binding-detail {
  font-size: 0.78rem;
  margin: 0.25rem 0;
  color: var(--color-text-secondary);
}

.binding-subject-impact {
  margin: 0.4rem 0 0;
  padding: 0.5rem 0.6rem;
  border-radius: 4px;
  font-size: 0.78rem;
  background: var(--color-bg-subtle);
  border-left: 2px solid currentColor;
}

.binding-subject-impact--up { color: var(--color-warning); }
.binding-subject-impact--down { color: var(--color-success); }

.mono {
  font-family: var(--font-mono, ui-monospace, monospace);
}
</style>
