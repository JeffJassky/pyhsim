<template>
  <section v-if="refs.length" class="references-section">
    <h4 class="section-heading">References ({{ refs.length }})</h4>
    <ol class="references-list">
      <li v-for="(ref, idx) in refs" :key="idx">
        <button class="ref-button" @click="openModal(ref.ref)">
          {{ formatRef(ref) }}
        </button>
        <p v-if="ref.supports" class="ref-supports">
          {{ ref.supports }}
        </p>
      </li>
    </ol>

    <CitationModal
      v-if="modalRef"
      :open="true"
      :reference="modalRef"
      @close="modalRef = null"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { CITATIONS, type CitationRef, type PharmacologyDef } from '@kyneticbio/core';
import CitationModal from '@/components/CitationModal.vue';

const props = defineProps<{
  pharmacology: PharmacologyDef | null | undefined;
}>();

const modalRef = ref<CitationRef | string | null>(null);

function openModal(refKey: string) {
  // Find the actual CitationRef object (with supports/quote) that matches this key
  const found = refs.value.find((r) => r.ref === refKey);
  modalRef.value = found ?? refKey;
}

/**
 * Walks every CitationRef across the drug's pharmacology — clearance routes,
 * inhibits, induces, individual PD effects — and de-duplicates by registry key.
 * The first encountered supports/quote wins (UI doesn't currently surface
 * multiple use-site contexts per source, though future work could).
 */
const refs = computed<CitationRef[]>(() => {
  const pharm = props.pharmacology as any;
  if (!pharm) return [];

  const collected: CitationRef[] = [];
  const seen = new Set<string>();

  const add = (refList?: CitationRef[]) => {
    if (!refList) return;
    for (const r of refList) {
      if (seen.has(r.ref)) continue;
      seen.add(r.ref);
      collected.push(r);
    }
  };

  add(pharm.pk?.clearance?.hepatic?.citations);
  add(pharm.pk?.clearance?.renal?.citations);
  add(pharm.pk?.clearance?.biliary?.citations);

  for (const inh of pharm.inhibits ?? []) add(inh.citations);
  for (const ind of pharm.induces ?? []) add(ind.citations);
  for (const pd of pharm.pd ?? []) add(pd.citations);

  return collected;
});

function formatRef(ref: CitationRef): string {
  const src = (CITATIONS as Record<string, any>)[ref.ref];
  if (!src) return ref.ref;
  const author = src.authors?.[0] ?? src.source ?? 'Unknown';
  return `${author} (${src.year}) · ${src.title.slice(0, 60)}${src.title.length > 60 ? '…' : ''}`;
}
</script>

<style scoped>
.references-section {
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

.references-list {
  margin: 0;
  padding-left: 1.25rem;
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.references-list li {
  margin: 0.4rem 0;
}

.ref-button {
  background: none;
  border: none;
  padding: 0;
  color: var(--color-text-active);
  text-align: left;
  cursor: pointer;
  font: inherit;
  text-decoration: underline;
  text-decoration-style: dotted;
  text-underline-offset: 2px;
}

.ref-button:hover {
  text-decoration-style: solid;
}

.ref-supports {
  margin: 0.2rem 0 0;
  font-size: 0.72rem;
  color: var(--color-text-muted);
  font-style: italic;
}
</style>
