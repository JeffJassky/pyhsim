<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="citation-modal-overlay"
      role="dialog"
      aria-modal="true"
      @click.self="emit('close')"
    >
      <div class="citation-modal">
        <button class="citation-modal__close" @click="emit('close')" aria-label="Close">
          ×
        </button>

        <header class="citation-modal__header">
          <span class="citation-modal__type">{{ formatType(source.type) }}</span>
          <span
            class="citation-modal__confidence"
            :class="`confidence--${source.confidence}`"
          >
            {{ source.confidence }} confidence
          </span>
        </header>

        <h2 class="citation-modal__title">{{ source.title }}</h2>

        <p class="citation-modal__authors" v-if="source.authors?.length">
          {{ source.authors.join(', ') }}
        </p>

        <p class="citation-modal__meta">
          <span v-if="source.source">{{ source.source }}</span>
          <span class="citation-modal__year">{{ source.year }}</span>
        </p>

        <section v-if="supportsText" class="citation-modal__supports">
          <h3>Supports</h3>
          <p>{{ supportsText }}</p>
          <blockquote v-if="quoteText" class="citation-modal__quote">
            “{{ quoteText }}”
          </blockquote>
        </section>

        <div class="citation-modal__identifiers" v-if="hasIdentifiers">
          <a
            v-if="source.identifiers?.doi"
            :href="`https://doi.org/${source.identifiers.doi}`"
            target="_blank"
            rel="noopener"
          >
            DOI: {{ source.identifiers.doi }}
          </a>
          <a
            v-if="source.identifiers?.pmid"
            :href="`https://pubmed.ncbi.nlm.nih.gov/${source.identifiers.pmid}`"
            target="_blank"
            rel="noopener"
          >
            PMID: {{ source.identifiers.pmid }}
          </a>
          <a
            v-if="source.url"
            :href="source.url"
            target="_blank"
            rel="noopener"
          >
            Open source ↗
          </a>
        </div>

        <p class="citation-modal__id">
          <code>{{ refKey }}</code>
          <span v-if="source.accessedAt"> · accessed {{ source.accessedAt }}</span>
        </p>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { CITATIONS, type CitationSource, type CitationRef } from '@kyneticbio/core';

interface Props {
  open: boolean;
  /** Either a registry key string, or a full CitationRef with supports/quote context. */
  reference: string | CitationRef;
}

const props = defineProps<Props>();
const emit = defineEmits<{ close: [] }>();

const refKey = computed(() =>
  typeof props.reference === 'string' ? props.reference : props.reference.ref,
);

const source = computed<CitationSource>(() => {
  const key = refKey.value;
  const src = (CITATIONS as Record<string, CitationSource>)[key];
  if (!src) {
    throw new Error(`Unknown citation ref: ${key}`);
  }
  return src;
});

const supportsText = computed(() =>
  typeof props.reference === 'object' ? props.reference.supports : undefined,
);

const quoteText = computed(() =>
  typeof props.reference === 'object' ? props.reference.quote : undefined,
);

const hasIdentifiers = computed(() =>
  Boolean(
    source.value.identifiers?.doi ||
      source.value.identifiers?.pmid ||
      source.value.url,
  ),
);

function formatType(t: string): string {
  return t
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
</script>

<style scoped>
.citation-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.citation-modal {
  background: var(--color-bg-elevated, #fff);
  border-radius: 8px;
  padding: 1.5rem 1.75rem;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.citation-modal__close {
  position: absolute;
  top: 0.5rem;
  right: 0.75rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--color-text-tertiary, #888);
  line-height: 1;
  padding: 0.25rem 0.5rem;
}

.citation-modal__close:hover {
  color: var(--color-text-primary, #000);
}

.citation-modal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;
  color: var(--color-text-tertiary, #888);
}

.citation-modal__type {
  background: var(--color-bg-tertiary, #f0f0f0);
  padding: 0.15rem 0.5rem;
  border-radius: 3px;
}

.confidence--high {
  color: #2a7;
  font-weight: 600;
}

.confidence--medium {
  color: #c80;
  font-weight: 600;
}

.confidence--low {
  color: #c44;
  font-weight: 600;
}

.citation-modal__title {
  font-size: 1.15rem;
  margin: 0 0 0.5rem;
  font-weight: 600;
  line-height: 1.3;
}

.citation-modal__authors,
.citation-modal__meta {
  font-size: 0.9rem;
  margin: 0.25rem 0;
  color: var(--color-text-secondary, #555);
}

.citation-modal__year {
  margin-left: 0.5rem;
  font-weight: 600;
}

.citation-modal__supports {
  margin: 1.25rem 0;
  padding: 0.75rem 1rem;
  background: var(--color-bg-tertiary, #f7f7f7);
  border-left: 3px solid var(--color-accent, #06c);
  border-radius: 0 4px 4px 0;
}

.citation-modal__supports h3 {
  margin: 0 0 0.35rem;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-tertiary, #888);
}

.citation-modal__supports p {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.4;
}

.citation-modal__quote {
  margin: 0.75rem 0 0;
  padding-left: 0.75rem;
  border-left: 2px solid var(--color-border, #ccc);
  font-style: italic;
  color: var(--color-text-secondary, #555);
  font-size: 0.9rem;
}

.citation-modal__identifiers {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  font-size: 0.9rem;
  margin: 0.75rem 0;
}

.citation-modal__identifiers a {
  color: var(--color-accent, #06c);
  text-decoration: none;
}

.citation-modal__identifiers a:hover {
  text-decoration: underline;
}

.citation-modal__id {
  margin: 1rem 0 0;
  font-size: 0.75rem;
  color: var(--color-text-tertiary, #888);
}

.citation-modal__id code {
  font-family: var(--font-mono, monospace);
  background: var(--color-bg-tertiary, #f5f5f5);
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
}
</style>
