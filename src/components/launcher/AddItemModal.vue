<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="modelValue" class="modal-overlay" @click.self="close">
        <div
          class="modal-content launcher-content"
          :class="{ 'launcher-content--items': view !== 'categories' || search.length > 0 }"
        >
          <button class="modal-close-btn" @click="close">✕</button>

          <header class="modal-header launcher-header">
            <h2 v-if="view === 'categories' && !search" class="modal-title">
              Add to Timeline
            </h2>
            <button
              v-else-if="view !== 'categories' && !search"
              class="back-btn"
              @click="backToCategories"
            >
              ← {{ selectedCategory?.label || 'All Items' }}
            </button>
            <button v-else-if="search" class="back-btn" @click="clearSearch">
              ← Back
            </button>

            <div class="search-wrapper">
              <input
                ref="searchInput"
                v-model="search"
                type="text"
                :placeholder="searchPlaceholder"
                class="search-input"
                @input="handleSearchInput"
                @keydown.enter="handleEnterKey"
              />
              <div v-if="loading" class="search-loader" />
            </div>
          </header>

          <div class="modal-body launcher-body">
            <!-- Category View -->
            <div v-if="view === 'categories' && !search" class="view-categories">
            <div class="category-group">
              <h3 class="group-label">Browse by Type</h3>
              <div class="grid">
                <button
                  v-for="cat in typeCategories"
                  :key="cat.id"
                  class="launcher-card"
                  @click="selectCategory(cat, 'type')"
                >
                  <span class="card-icon">{{ cat.icon }}</span>
                  <span class="card-label">{{ cat.label }}</span>
                </button>
              </div>
            </div>

            <div class="category-group">
              <h3 class="group-label">Browse by Goal</h3>
              <div class="grid">
                <button
                  v-for="cat in goalCategories"
                  :key="cat.id"
                  class="launcher-card card--goal"
                  @click="selectCategory(cat, 'goal')"
                >
                  <span class="card-icon">{{ cat.icon }}</span>
                  <span class="card-label">{{ cat.label }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Items View (Interventions) -->
          <div
            v-else-if="view === 'items' || (search && view !== 'food')"
            class="view-items"
          >
            <div class="items-grid">
              <button
                v-for="item in filteredItems"
                :key="item.key"
                class="item-card"
                @click="handleItemSelect(item)"
              >
                <div class="item-card__icon">{{ item.icon }}</div>
                <div class="item-card__content">
                  <div class="item-card__title">{{ item.label }}</div>
                  <div class="item-card__desc">
                    {{ item.group || 'General' }} •
                    {{ item.defaultDurationMin }}m
                  </div>
                </div>
                <div class="item-card__action">＋</div>
              </button>
            </div>

            <div v-if="filteredItems.length === 0" class="empty-state">
              No interventions found matching "{{ search }}"
            </div>
          </div>

          <!-- Food View -->
          <div v-else-if="view === 'food'" class="view-items view-food">
            <div class="items-grid">
              <div v-if="!search && recents.length > 0" class="group-label">
                Recently used
              </div>

              <div
                v-for="hit in foodList"
                :key="hit.id"
                class="item-card item-card--food"
                :class="{ 'is-expanded': expandedFoodId === hit.id }"
                @click="toggleFoodExpansion(hit.id)"
              >
                <div class="item-card__icon">🍎</div>
                <div class="item-card__content">
                  <div class="item-card__title">
                    {{ hit.name }}
                    <span
                      v-if="hit.brand"
                      class="item-card__brand"
                      >{{ hit.brand }}</span
                    >
                  </div>
                  <div class="item-card__desc">
                    {{ Math.round(hit.nutrients.calories) }} cal • P{{ Math.round(hit.nutrients.protein)



                    }}g • C{{ Math.round(hit.nutrients.carbs) }}g • F{{ Math.round(hit.nutrients.fat)



                    }}g
                  </div>

                  <div
                    v-if="expandedFoodId === hit.id"
                    class="food-controls"
                    @click.stop
                  >
                    <div class="qty-stepper">
                      <span>Quantity:</span>
                      <input
                        v-model.number="foodQty"
                        type="number"
                        min="0.25"
                        step="0.25"
                      />
                    </div>
                    <button class="log-btn" @click="handleFoodSelect(hit)">
                      Log Food
                    </button>
                  </div>
                </div>
                <div class="item-card__action">＋</div>
              </div>
            </div>

            <div v-if="foodList.length === 0 && !loading" class="empty-state">
              {{ search ? 'No foods found' : 'Search for a food to begin' }}
            </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Transition>
            </Teleport>
          </template>
          <script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue';
import { useLibraryStore } from '@/stores/library';
import { searchFoods } from '@/api/openfoodfacts';
import type { InterventionDef, FoodSearchHit } from '@/types';
import { INTERVENTION_CATEGORIES, type InterventionCategory } from '@/models/ui/categories';
import { GOAL_CATEGORIES } from '@/models/domain/goals';

const props = defineProps<{
  modelValue: boolean;
  recents: FoodSearchHit[];
  initialGroup?: string | number;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'select', item: InterventionDef): void;
  (e: 'select-food', food: FoodSearchHit, qty: number): void;
}>();

const library = useLibraryStore();

type Category = InterventionCategory;
type View = 'categories' | 'items' | 'food';

const view = ref<View>('categories');
const search = ref('');
const selectedCategory = ref<Category | null>(null);
const categoryType = ref<'type' | 'goal' | null>(null);
const searchInput = ref<HTMLInputElement | null>(null);

// Food specific state
const foodResults = ref<FoodSearchHit[]>([]);
const loading = ref(false);
const expandedFoodId = ref<string | null>(null);
const foodQty = ref(1);

const typeCategories = INTERVENTION_CATEGORIES;
const goalCategories = GOAL_CATEGORIES;

const searchPlaceholder = computed(() => {
  if (view.value === 'food') return 'Search foods (e.g. oatmeal, salmon)...';
  return 'Search interventions, goals, or types...';
});

const selectCategory = (cat: Category, type: 'type' | 'goal' = 'type') => {
  categoryType.value = type;
  selectedCategory.value = cat;
  view.value = cat.id === 'food' ? 'food' : 'items';
  search.value = '';
  nextTick(() => {
    searchInput.value?.focus();
  });
};

const handleSearchInput = () => {
  if (search.value && view.value === 'categories') {
    view.value = 'items';
  }
};

const handleEnterKey = () => {
  if (view.value === 'food' && search.value.trim()) {
    performFoodSearch();
  }
};

const performFoodSearch = async () => {
  if (!search.value.trim()) return;
  loading.value = true;
  try {
    const { hits } = await searchFoods(search.value, 1, 20);
    foodResults.value = hits;
  } catch (err) {
    console.error('Food search failed', err);
  } finally {
    loading.value = false;
  }
};

const foodList = computed(() => {
  if (search.value && foodResults.value.length > 0) return foodResults.value;
  if (!search.value) return props.recents;
  return [];
});

const toggleFoodExpansion = (id: string) => {
  if (expandedFoodId.value === id) {
    expandedFoodId.value = null;
  } else {
    expandedFoodId.value = id;
    foodQty.value = 1;
  }
};

const backToCategories = () => {
  view.value = 'categories';
  selectedCategory.value = null;
  categoryType.value = null;
  search.value = '';
  foodResults.value = [];
};

const clearSearch = () => {
  search.value = '';
  foodResults.value = [];
  if (!selectedCategory.value) {
    view.value = 'categories';
  }
};

const close = () => {
  emit('update:modelValue', false);
  setTimeout(() => {
    view.value = 'categories';
    search.value = '';
    selectedCategory.value = null;
    foodResults.value = [];
    expandedFoodId.value = null;
  }, 300);
};

const filteredItems = computed(() => {
  let items = library.defs;

  if (selectedCategory.value && categoryType.value) {
    const catId = selectedCategory.value.id.toLowerCase();
    if (categoryType.value === 'type') {
      items = items.filter((item) => item.categories?.includes(catId));
    } else if (categoryType.value === 'goal') {
      items = items.filter((item) => item.goals?.includes(catId));
    }
  }

  if (search.value) {
    const q = search.value.toLowerCase();
    items = items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.group?.toLowerCase().includes(q) ||
        item.goals?.some(g => g.includes(q)) ||
        item.categories?.some(c => c.includes(q))
    );
  }

  return items;
});

const handleItemSelect = (item: InterventionDef) => {
  emit('select', item);
  close();
};

const handleFoodSelect = (food: FoodSearchHit) => {
  emit('select-food', food, foodQty.value);
  close();
};

watch(() => props.modelValue, (val) => {
  if (val) {
    if (props.initialGroup) {
      const groupStr = String(props.initialGroup);
      const typeCat = typeCategories.find(c => c.id === groupStr);
      if (typeCat) {
        selectCategory(typeCat, 'type');
        return;
      }
      const goalCat = goalCategories.find(c => c.id === groupStr);
      if (goalCat) {
        selectCategory(goalCat, 'goal');
        return;
      }
    }
    // Default reset if no group matched or no group provided
    view.value = 'categories';
    search.value = '';
    selectedCategory.value = null;
    categoryType.value = null;
    foodResults.value = [];
  } else {
    // Cleanup on close
    view.value = 'categories';
    search.value = '';
    foodResults.value = [];
  }
});
</script>

<style scoped>
.launcher-content {
  max-width: 800px;
}

.launcher-content--items {
  max-width: 600px;
}

.launcher-header {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--color-border-subtle);
}

.launcher-body {
  padding-top: 1.5rem;
}

.view-categories, .view-items {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 100%;
  animation: fadeIn 0.3s ease-out;
  overflow-x: visible;
}

.category-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.group-label {
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  margin: 0 0 0.5rem 0.5rem;
  font-weight: 600;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 1rem;
}

.launcher-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border-subtle);
  border-radius: 20px;
  aspect-ratio: 1;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
  color: var(--color-text-primary);
}

.launcher-card:hover {
  background: var(--color-bg-elevated);
  transform: translateY(-4px) scale(1.02);
  border-color: var(--color-border-default);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.back-btn {
  background: transparent;
  border: none;
  color: var(--color-active);
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  width: fit-content;
  transition: opacity 0.2s;
}

.back-btn:hover {
  opacity: 0.8;
}

.search-wrapper {
  position: relative;
}

.search-input {
  width: 100%;
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border-subtle);
  border-radius: 12px;
  padding: 0.85rem 1rem;
  color: var(--color-text-primary);
  font-size: 1.1rem;
  outline: none;
  transition: all 0.2s;
}

.search-input:focus {
  background: var(--color-bg-elevated);
  border-color: var(--color-active);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-active), transparent 90%);
}

.search-loader {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  border: 2px solid var(--color-border-subtle);
  border-top-color: var(--color-active);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: translateY(-50%) rotate(360deg); }
}

.items-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-bottom: 1rem;
}

.item-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border-subtle);
  border-radius: 16px;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  color: inherit;
  position: relative;
}

.item-card:hover {
  background: var(--color-bg-elevated);
  border-color: var(--color-border-default);
  transform: translateX(4px);
}

.item-card__icon {
  font-size: 1.75rem;
  width: 48px;
  height: 48px;
  background: var(--color-bg-base);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}

.item-card__content {
  flex: 1;
}

.item-card__title {
  font-weight: 600;
  font-size: 1.05rem;
  color: var(--color-text-primary);
}

.item-card__brand {
  font-weight: 400;
  opacity: 0.5;
  font-size: 0.9rem;
  margin-left: 0.4rem;
}

.item-card__desc {
  font-size: 0.85rem;
  opacity: 0.5;
  margin-top: 0.15rem;
}

.item-card__action {
  font-size: 1.25rem;
  color: var(--color-active);
  opacity: 0.8;
}

/* Food specific expansion */
.item-card--food.is-expanded {
  background: var(--color-bg-elevated);
  border-color: var(--color-active);
  transform: none;
}

.food-controls {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border-subtle);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  animation: slideDown 0.2s ease-out;
}

.qty-stepper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.9rem;
  opacity: 0.9;
}

.qty-stepper input {
  width: 70px;
  background: var(--color-bg-base);
  border: 1px solid var(--color-border-subtle);
  border-radius: 6px;
  padding: 0.35rem;
  color: var(--color-text-primary);
  outline: none;
}

.log-btn {
  background: var(--color-active);
  color: var(--color-text-inverted);
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.1s;
}

.log-btn:active {
  transform: scale(0.95);
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.empty-state {
  text-align: center;
  padding: 2rem;
  opacity: 0.4;
  font-style: italic;
}

.card--goal {
  background: linear-gradient(145deg, var(--color-bg-subtle), var(--color-bg-base));
}

.card-icon {
  font-size: 2.5rem;
}

.card-label {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--color-text-primary);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
