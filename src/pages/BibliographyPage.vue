<template>
  <AppShell>
    <template #header-center>
      <h1 class="bibliography-title">Bibliography</h1>
    </template>
    <div class="bibliography-page">
      <header class="bibliography-header">
        <p class="bibliography-blurb">
          Every numeric constant in the engine's pharmacokinetic and pharmacodynamic
          model traces to a literature source. Below are all primary citations
          underpinning genetic activity tables, enzyme/transporter kinetics,
          inhibitor/inducer parameters, and protein binding values.
        </p>
        <div class="bibliography-filters">
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Search by author, title, or DOI…"
            class="search-input"
          />
          <select v-model="typeFilter" class="type-filter">
            <option value="">All types</option>
            <option v-for="t in citationTypes" :key="t" :value="t">
              {{ formatType(t) }}
            </option>
          </select>
        </div>
        <p class="bibliography-meta">
          {{ filteredCitations.length }} of {{ allCitationCount }} sources shown.
        </p>
      </header>

      <ul class="citation-list">
        <li
          v-for="[key, source] in filteredCitations"
          :key="key"
          class="citation-card"
          :class="`citation-card--${source.type}`"
        >
          <div class="citation-card__header">
            <span class="citation-card__type">{{ formatType(source.type) }}</span>
            <span class="citation-card__confidence" :class="`confidence--${source.confidence}`">
              {{ source.confidence }} confidence
            </span>
          </div>
          <h3 class="citation-card__title">{{ source.title }}</h3>
          <p class="citation-card__authors" v-if="source.authors?.length">
            {{ source.authors.join(', ') }}
          </p>
          <p class="citation-card__meta">
            <span v-if="source.source">{{ source.source }}</span>
            <span class="citation-card__year">{{ source.year }}</span>
          </p>
          <div class="citation-card__identifiers" v-if="hasIdentifiers(source)">
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
          <p class="citation-card__id">
            <code>{{ key }}</code>
          </p>
        </li>
      </ul>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { CITATIONS, type CitationSource } from '@kyneticbio/core';
import AppShell from '@/components/layout/AppShell.vue';

const searchQuery = ref('');
const typeFilter = ref('');

const allCitationsList = computed(
  () => Object.entries(CITATIONS) as [string, CitationSource][],
);

const allCitationCount = computed(() => allCitationsList.value.length);

const citationTypes = computed(() => {
  const set = new Set<string>();
  for (const [, src] of allCitationsList.value) set.add(src.type);
  return Array.from(set).sort();
});

const filteredCitations = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  return allCitationsList.value.filter(([key, source]) => {
    if (typeFilter.value && source.type !== typeFilter.value) return false;
    if (!q) return true;
    const haystack = [
      key,
      source.title,
      source.authors?.join(' ') ?? '',
      source.source ?? '',
      source.identifiers?.doi ?? '',
      source.identifiers?.pmid ?? '',
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
});

function formatType(t: string): string {
  return t
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function hasIdentifiers(source: CitationSource): boolean {
  return Boolean(
    source.identifiers?.doi ||
      source.identifiers?.pmid ||
      source.identifiers?.isbn ||
      source.url,
  );
}
</script>

<style scoped>
.bibliography-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
}

.bibliography-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.bibliography-header {
  margin-bottom: 2rem;
}

.bibliography-blurb {
  font-size: 0.95rem;
  line-height: 1.5;
  color: var(--color-text-secondary, #555);
  margin-bottom: 1rem;
}

.bibliography-filters {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.search-input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border, #ccc);
  border-radius: 4px;
  font-size: 0.9rem;
}

.type-filter {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border, #ccc);
  border-radius: 4px;
  font-size: 0.9rem;
}

.bibliography-meta {
  font-size: 0.85rem;
  color: var(--color-text-tertiary, #888);
  margin: 0.5rem 0 0;
}

.citation-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 1rem;
}

.citation-card {
  padding: 1rem 1.25rem;
  border: 1px solid var(--color-border, #ddd);
  border-radius: 6px;
  background: var(--color-bg-elevated, #fff);
}

.citation-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
  color: var(--color-text-tertiary, #888);
}

.citation-card__type {
  background: var(--color-bg-tertiary, #f0f0f0);
  padding: 0.15rem 0.5rem;
  border-radius: 3px;
}

.citation-card__confidence {
  font-weight: 600;
}

.confidence--high {
  color: #2a7;
}

.confidence--medium {
  color: #c80;
}

.confidence--low {
  color: #c44;
}

.citation-card__title {
  font-size: 1rem;
  margin: 0 0 0.35rem;
  font-weight: 600;
}

.citation-card__authors,
.citation-card__meta {
  font-size: 0.85rem;
  margin: 0.15rem 0;
  color: var(--color-text-secondary, #555);
}

.citation-card__year {
  margin-left: 0.5rem;
  font-weight: 600;
}

.citation-card__identifiers {
  margin: 0.5rem 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  font-size: 0.85rem;
}

.citation-card__identifiers a {
  color: var(--color-accent, #06c);
  text-decoration: none;
}

.citation-card__identifiers a:hover {
  text-decoration: underline;
}

.citation-card__id {
  margin: 0.5rem 0 0;
  font-size: 0.75rem;
  color: var(--color-text-tertiary, #888);
}

.citation-card__id code {
  font-family: var(--font-mono, monospace);
  background: var(--color-bg-tertiary, #f5f5f5);
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
}
</style>
