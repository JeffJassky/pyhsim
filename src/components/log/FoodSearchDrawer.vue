<template>
  <teleport to="body">
    <div v-if="modelValue" class="drawer">
      <div class="drawer__backdrop" @click="emit('update:modelValue', false)" />
      <section class="drawer__panel">
        <header class="drawer__header">
          <div>
            <p class="drawer__eyebrow">Add to {{ mealLabel }}</p>
            <h3>Food search</h3>
          </div>
          <button type="button" class="ghost" @click="emit('update:modelValue', false)">✕</button>
        </header>

        <form class="drawer__search" @submit.prevent="handleSearch">
          <input
            v-model="query"
            type="search"
            placeholder="Search OpenFoodFacts (e.g. oatmeal, salmon)"
            required
          />
          <button type="submit" :disabled="loading">Search</button>
        </form>
        <p v-if="error" class="drawer__error">{{ error }}</p>

        <div v-if="filteredRecents.length" class="drawer__recents">
          <div class="drawer__recents-head">
            <h4>Recently used</h4>
            <small>Saved locally</small>
          </div>
          <article v-for="hit in filteredRecents" :key="hit.id" class="drawer__card drawer__card--compact">
            <div class="drawer__card-meta">
              <p class="drawer__name">
                {{ hit.name }}
                <span v-if="hit.brand" class="drawer__brand">{{ hit.brand }}</span>
              </p>
              <p class="drawer__serving">{{ hit.serving }}</p>
              <p class="drawer__nutrients">
                {{ Math.round(hit.nutrients.calories) }} cal ·
                P {{ Math.round(hit.nutrients.protein) }}g ·
                C {{ Math.round(hit.nutrients.carbs) }}g ·
                F {{ Math.round(hit.nutrients.fat) }}g
              </p>
            </div>
            <div class="drawer__card-actions">
              <div v-if="expandedId === hit.id" class="drawer__action-inline">
                <input v-model.number="qty[hit.id]" type="number" min="0.25" step="0.25" />
                <button type="button" class="primary" @click="select(hit)">Log</button>
              </div>
              <button v-else type="button" class="icon" @click="toggleExpanded(hit.id)">＋</button>
            </div>
          </article>
        </div>

        <div class="drawer__results">
          <p v-if="!results.length && !loading" class="drawer__hint">No results yet - try a search.</p>
          <p v-if="loading" class="drawer__hint">Searching...</p>
          <article v-for="hit in results" :key="hit.id" class="drawer__card">
            <div class="drawer__card-meta">
              <p class="drawer__name">
                {{ hit.name }}
                <span v-if="hit.brand" class="drawer__brand">{{ hit.brand }}</span>
              </p>
              <p class="drawer__serving">{{ hit.serving }}</p>
              <p class="drawer__nutrients">
                {{ Math.round(hit.nutrients.calories) }} cal ·
                P {{ Math.round(hit.nutrients.protein) }}g ·
                C {{ Math.round(hit.nutrients.carbs) }}g ·
                F {{ Math.round(hit.nutrients.fat) }}g
              </p>
            </div>
            <div class="drawer__card-actions">
              <div v-if="expandedId === hit.id" class="drawer__action-inline">
                <input v-model.number="qty[hit.id]" type="number" min="0.25" step="0.25" />
                <button type="button" class="primary" @click="select(hit)">Log</button>
              </div>
              <button v-else type="button" class="icon" @click="toggleExpanded(hit.id)">＋</button>
            </div>
          </article>
        </div>
      </section>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { searchFoods } from '@/api/openfoodfacts';
import type { FoodSearchHit, MealSlot } from '@/types';

const props = defineProps<{ modelValue: boolean; meal: MealSlot; recents: FoodSearchHit[] }>();
const emit = defineEmits<{
  'update:modelValue': [boolean];
  select: [FoodSearchHit, number];
}>();

const query = ref('');
const results = ref<FoodSearchHit[]>([]);
const loading = ref(false);
const error = ref('');
const qty = reactive<Record<string, number>>({});
const expandedId = ref<string | null>(null);

const mealLabel = computed(() => props.meal.charAt(0).toUpperCase() + props.meal.slice(1));
const filteredRecents = computed(() => {
  if (!query.value.trim()) return props.recents;
  const term = query.value.toLowerCase();
  return props.recents.filter(
    (hit) =>
      hit.name.toLowerCase().includes(term) ||
      (hit.brand && hit.brand.toLowerCase().includes(term)) ||
      hit.serving.toLowerCase().includes(term)
  );
});

const setQtyDefaults = (list: FoodSearchHit[]) => {
  list.forEach((hit) => {
    if (!qty[hit.id]) qty[hit.id] = 1;
  });
};

const handleSearch = async () => {
  if (!query.value.trim()) return;
  loading.value = true;
  error.value = '';
  try {
    const { hits } = await searchFoods(query.value, 1, 20);
    results.value = hits;
    setQtyDefaults(hits);
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Search failed';
  } finally {
    loading.value = false;
  }
};

const select = (hit: FoodSearchHit) => {
  const amount = qty[hit.id] || 1;
  emit('select', hit, amount);
  emit('update:modelValue', false);
  query.value = '';
  results.value = [];
  error.value = '';
  expandedId.value = null;
};

const toggleExpanded = (id: string) => {
  expandedId.value = expandedId.value === id ? null : id;
  if (expandedId.value && !qty[id]) qty[id] = 1;
};

watch(
  () => props.recents,
  (list) => {
    setQtyDefaults(list);
  },
  { immediate: true }
);

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      setQtyDefaults([...props.recents, ...results.value]);
    } else {
      query.value = '';
      results.value = [];
      error.value = '';
      Object.keys(qty).forEach((key) => delete qty[key]);
      expandedId.value = null;
    }
  }
);
</script>

<style scoped>
.drawer {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: end center;
  z-index: 80;
}

.drawer__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
}

.drawer__panel {
  position: relative;
  width: min(720px, 95vw);
  max-height: calc(100vh - 80px);
  background: #0e1224;
  border-radius: 18px 18px 0 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1rem 1.25rem;
  overflow-y: auto;
  box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.35);
}

.drawer__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.drawer__eyebrow {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 0.75rem;
  opacity: 0.7;
}

.drawer__search {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.5rem;
  margin: 0.75rem 0;
}

input[type='search'],
input[type='number'] {
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.05);
  color: inherit;
  border-radius: 10px;
  padding: 0.65rem 0.75rem;
}

button {
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.08);
  color: inherit;
  border-radius: 10px;
  padding: 0.55rem 0.8rem;
  cursor: pointer;
}

button.ghost {
  background: transparent;
  border: none;
}

.drawer__results {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.drawer__card {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.02);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.drawer__name {
  margin: 0;
  font-weight: 700;
}

.drawer__brand {
  font-weight: 400;
  opacity: 0.7;
  margin-left: 0.3rem;
}

.drawer__serving,
.drawer__nutrients,
.drawer__hint,
.drawer__error {
  margin: 0.2rem 0;
  opacity: 0.75;
}

.drawer__card-actions {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.drawer__hint {
  opacity: 0.6;
}

.drawer__error {
  color: #fca5a5;
}

label {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.drawer__action-inline {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.drawer__action-inline input[type='number'] {
  width: 80px;
  padding: 0.35rem 0.45rem;
}

button.icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.08);
  color: inherit;
  font-size: 1.1rem;
}

button.primary {
  border: none;
  background: linear-gradient(120deg, #3b82f6, #22d3ee);
  color: black;
  font-weight: 700;
  padding: 0.45rem 0.9rem;
  border-radius: 10px;
  cursor: pointer;
}
</style>
