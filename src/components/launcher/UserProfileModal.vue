<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="modelValue" class="modal-overlay" @click.self="close">
        <div
          class="modal-content profile-modal-content"
          :class="{ 'profile-modal-content--expanded': view !== 'categories' }"
        >
          <button class="modal-close-btn" @click="close">✕</button>

          <header class="modal-header profile-modal-header">
            <h2 v-if="view === 'categories'" class="modal-title">
              My Bio-Profile
            </h2>
            <button v-else class="back-btn" @click="view = 'categories'">
              ← {{ selectedViewLabel }}
            </button>
          </header>

          <div class="modal-body profile-modal-body">
            <!-- Category View -->
            <div v-if="view === 'categories'" class="view-categories">
            <div class="grid">
              <button class="launcher-card" @click="view = 'goals'">
                <span class="card-icon">⚡</span>
                <span class="card-label">My Goals</span>
              </button>
              <button class="launcher-card" @click="view = 'physiology'">
                <span class="card-icon">🫁</span>
                <span class="card-label">Physiology</span>
              </button>
              <button class="launcher-card" @click="view = 'conditions'">
                <span class="card-icon">🧠</span>
                <span class="card-label">My Conditions</span>
              </button>
              <button class="launcher-card" @click="view = 'nutrition'">
                <span class="card-icon">🎯</span>
                <span class="card-label">Nutrient Targets</span>
              </button>
              <button class="launcher-card" @click="view = 'display'">
                <span class="card-icon">🌗</span>
                <span class="card-label">Display</span>
              </button>
              <button class="launcher-card" @click="view = 'subscription'">
                <span class="card-icon">⭐</span>
                <span class="card-label">Subscription</span>
              </button>
            </div>
          </div>

          <!-- Subscription View -->
          <div v-else-if="view === 'subscription'" class="view-items">
            <div class="subscription-card">
              <div class="subscription-card__header">
                <div class="card-icon">⭐</div>
                <h3 class="subscription-card__title">Choose your plan</h3>
                <p class="subscription-card__desc">
                  Unlock high-fidelity physiological signals and advanced
                  biomarkers.
                </p>
              </div>

              <div class="tier-toggle">
                <button
                  class="tier-toggle__btn"
                  :class="{ 'is-active': subscriptionTier === 'free' }"
                  @click="handleSetTier('free')"
                >
                  Free
                </button>
                <button
                  class="tier-toggle__btn tier-toggle__btn--premium"
                  :class="{ 'is-active': subscriptionTier === 'premium' }"
                  @click="handleSetTier('premium')"
                >
                  Premium
                </button>
              </div>

              <ul class="benefit-list">
                <li>
                  {{ subscriptionTier === 'premium' ? '✓' : '✓' }} Basic
                  circadian signals (Melatonin, Cortisol)
                </li>
                <li>
                  {{ subscriptionTier === 'premium' ? '✓' : '✓' }} Metabolic
                  proxies (Glucose, Energy)
                </li>
                <li :class="{ 'is-locked': subscriptionTier === 'free' }">
                  {{ subscriptionTier === 'premium' ? '✓' : '🔒' }}
                  Neurotransmitters (Dopamine, Serotonin)
                </li>
                <li :class="{ 'is-locked': subscriptionTier === 'free' }">
                  {{ subscriptionTier === 'premium' ? '✓' : '🔒' }} Advanced
                  Hormones (LH, FSH, Growth Hormone)
                </li>
                <li :class="{ 'is-locked': subscriptionTier === 'free' }">
                  {{ subscriptionTier === 'premium' ? '✓' : '🔒' }} Organ
                  Biomarkers (ALT, AST, eGFR)
                </li>
              </ul>
            </div>
          </div>

          <!-- Display View -->
          <div v-else-if="view === 'display'" class="view-items">
            <div class="settings-grid">
              <div class="setting-group">
                <label>Appearance</label>
                <div class="tier-toggle">
                  <button
                    class="tier-toggle__btn"
                    :class="{ 'is-active': uiStore.theme === 'system' }"
                    @click="uiStore.setTheme('system')"
                  >
                    System
                  </button>
                  <button
                    class="tier-toggle__btn"
                    :class="{ 'is-active': uiStore.theme === 'light' }"
                    @click="uiStore.setTheme('light')"
                  >
                    Light
                  </button>
                  <button
                    class="tier-toggle__btn"
                    :class="{ 'is-active': uiStore.theme === 'dark' }"
                    @click="uiStore.setTheme('dark')"
                  >
                    Dark
                  </button>
                </div>
              </div>
            </div>

            <div class="items-grid">
              <div
                v-for="goal in goalCategories"
                :key="goal.id"
                class="goal-group"
              >
                <h3 class="group-label">{{ goal.label }} Signals</h3>
                <div class="signals-list" :data-goal-id="goal.id">
                  <div
                    v-for="sig in getSignalsByGoal(goal.id)"
                    :key="sig.key"
                    class="signal-toggle-item"
                    :data-id="sig.key"
                  >
                    <div class="signal-toggle-item__drag">☰</div>
                    <div class="signal-toggle-item__info">
                      <div class="signal-toggle-item__label">
                        {{ sig.label }}
                        <span
                          v-if="sig.isPremium && subscriptionTier !== 'premium'"
                          class="premium-tag"
                        >
                          <span class="premium-tag__icon">🔒</span>
                          PREMIUM
                        </span>
                      </div>
                      <div class="signal-toggle-item__group">
                        {{ sig.group }}
                      </div>
                    </div>
                    <label class="switch">
                      <input
                        type="checkbox"
                        :checked="enabledSignals[sig.key as Signal]"
                        @change="userStore.toggleSignal(sig.key as Signal, ($event.target as HTMLInputElement).checked)"
                      />
                      <span class="slider" />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Goals View -->
          <div v-else-if="view === 'goals'" class="view-items">
            <div class="category-group">
              <h3 class="group-label">Select your focus areas</h3>
              <div class="grid">
                <button
                  v-for="cat in goalCategories"
                  :key="cat.id"
                  class="launcher-card card--goal"
                  :class="{ 'is-selected': selectedGoals.includes(cat.id) }"
                  @click="userStore.toggleGoal(cat.id)"
                >
                  <span class="card-icon">{{ cat.icon }}</span>
                  <span class="card-label">{{ cat.label }}</span>
                  <div v-if="selectedGoals.includes(cat.id)" class="checkmark">
                    ✓
                  </div>
                </button>
              </div>
            </div>
          </div>

          <!-- Physiology View -->
          <div v-else-if="view === 'physiology'" class="view-items">
            <div class="settings-grid">
              <div class="setting-group">
                <label>Biological Sex</label>
                <div class="select-wrapper">
                  <select
                    :value="subject.sex"
                    @change="updateSubject('sex', $event)"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              <div class="setting-group">
                <div class="setting-header">
                  <label>Age</label>
                  <span class="setting-value">{{ subject.age }} yr</span>
                </div>
                <input
                  type="range"
                  min="18"
                  max="90"
                  :value="subject.age"
                  @input="updateSubject('age', $event)"
                />
              </div>

              <div class="setting-group">
                <div class="setting-header">
                  <label>Weight</label>
                  <span class="setting-value">{{ subject.weight }} kg</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="150"
                  :value="subject.weight"
                  @input="updateSubject('weight', $event)"
                />
              </div>

              <template v-if="subject.sex === 'female'">
                <div class="setting-group">
                  <div class="setting-header">
                    <label>Cycle Length</label>
                    <span class="setting-value"
                      >{{ subject.cycleLength }} days</span
                    >
                  </div>
                  <input
                    type="range"
                    min="21"
                    max="35"
                    :value="subject.cycleLength"
                    @input="updateSubject('cycleLength', $event)"
                  />
                </div>
                <div class="setting-group">
                  <div class="setting-header">
                    <label>Current Day</label>
                    <span class="setting-value"
                      >Day {{ subject.cycleDay }}</span
                    >
                  </div>
                  <input
                    type="range"
                    min="0"
                    :max="subject.cycleLength"
                    :value="subject.cycleDay"
                    @input="updateSubject('cycleDay', $event)"
                  />
                </div>
              </template>
            </div>
          </div>

          <!-- Conditions View -->
          <div v-else-if="view === 'conditions'" class="view-items">
            <div class="items-grid">
              <div
                v-for="condition in conditionDefs"
                :key="condition.key"
                class="profile-item"
              >
                <div class="profile-item__main">
                  <div class="profile-item__info">
                    <div class="profile-item__title">{{ condition.label }}</div>
                    <div class="profile-item__desc">
                      {{ condition.description.physiology }}
                    </div>
                  </div>
                  <label class="switch">
                    <input
                      type="checkbox"
                      :checked="conditionState[condition.key].enabled"
                      @change="toggleCondition(condition.key, $event)"
                    />
                    <span class="slider" />
                  </label>
                </div>

                <div
                  v-if="conditionState[condition.key].enabled && condition.params.length"
                  class="profile-item__params"
                >
                  <div
                    v-for="param in condition.params"
                    :key="param.key"
                    class="setting-group"
                  >
                    <div class="setting-header">
                      <label>{{ param.label }}</label>
                      <span
                        class="setting-value"
                        >{{ conditionState[condition.key].params[param.key].toFixed(2) }}</span
                      >
                    </div>
                    <input
                      type="range"
                      :min="param.min"
                      :max="param.max"
                      :step="param.step"
                      :value="conditionState[condition.key].params[param.key]"
                      @input="updateConditionParam(condition.key, param.key, $event)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Nutrient Targets View -->
          <div v-else-if="view === 'nutrition'" class="view-items">
            <div class="settings-grid">
              <div class="setting-group">
                <div class="setting-header">
                  <label>Daily calories</label>
                  <span class="setting-value"
                    >{{ nutritionTargets.calories }} kcal</span
                  >
                </div>
                <input
                  type="range"
                  min="1200"
                  max="4000"
                  step="50"
                  :value="nutritionTargets.calories"
                  @input="(e) => updateNutritionTargets({ calories: Number((e.target as HTMLInputElement).value) })"
                />
              </div>

              <div class="setting-group setting-group--switch">
                <label>Enable macro ranges</label>
                <label class="switch">
                  <input
                    type="checkbox"
                    :checked="nutritionTargets.macrosEnabled"
                    @change="(e) => updateNutritionTargets({ macrosEnabled: (e.target as HTMLInputElement).checked })"
                  />
                  <span class="slider" />
                </label>
              </div>

              <div
                class="macro-grid"
                :class="{ disabled: !nutritionTargets.macrosEnabled }"
              >
                <div
                  v-for="macro in macroFields"
                  :key="macro.key"
                  class="macro-card"
                >
                  <div
                    class="macro-card__label"
                    :style="{ color: macro.color }"
                  >
                    {{ macro.label }}
                  </div>
                  <div class="macro-card__inputs">
                    <div class="macro-input">
                      <span>Min</span>
                      <input
                        type="number"
                        :value="nutritionTargets.macros[macro.key].min"
                        @input="(e) => updateMacro(macro.key, 'min', Number((e.target as HTMLInputElement).value))"
                      />
                    </div>
                    <div class="macro-input">
                      <span>Max</span>
                      <input
                        type="number"
                        :value="nutritionTargets.macros[macro.key].max"
                        @input="(e) => updateMacro(macro.key, 'max', Number((e.target as HTMLInputElement).value))"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Transition>
            </Teleport>
          </template>
          <script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { useUserStore } from '@/stores/user';
import { useUIStore } from '@/stores/ui';
import { CONDITION_LIBRARY } from '@/models';
import { Signal, getAllUnifiedDefinitions } from '@kyneticbio/core';
import { GOAL_CATEGORIES } from '@/models/domain/goals';
import type { ConditionKey } from '@kyneticbio/core';
import type { Subject } from '@/types';
import type { Goal } from '@/types';
import Sortable from 'sortablejs';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const userStore = useUserStore();
const uiStore = useUIStore();
const view = ref<'categories' | 'physiology' | 'conditions' | 'nutrition' | 'goals' | 'display' | 'subscription'>('categories');
const UNIFIED_DEFS = getAllUnifiedDefinitions();

watch(() => props.modelValue, (isOpen) => {
  if (isOpen && uiStore.profileModalView) {
    // @ts-ignore - view types match but strict check might fail
    view.value = uiStore.profileModalView;
  }
});

const subject = computed(() => userStore.subject);
const conditionDefs = CONDITION_LIBRARY;
const conditionState = computed(() => userStore.conditions);
const nutritionTargets = computed(() => userStore.nutritionTargets);
const selectedGoals = computed(() => userStore.selectedGoals);
const enabledSignals = computed(() => userStore.enabledSignals);
const signalOrder = computed(() => userStore.signalOrder);
const subscriptionTier = computed(() => userStore.subscriptionTier);

const selectedViewLabel = computed(() => {
  if (view.value === 'physiology') return 'Physiology';
  if (view.value === 'conditions') return 'My Conditions';
  if (view.value === 'nutrition') return 'Nutrient Targets';
  if (view.value === 'goals') return 'My Goals';
  if (view.value === 'display') return 'Display';
  if (view.value === 'subscription') return 'Subscription';
  return '';
});

const handleSetTier = (tier: 'free' | 'premium') => {
  userStore.setSubscriptionTier(tier);
};

const getSignalsByGoal = (goalId: Goal) => {
  const goalCategory = GOAL_CATEGORIES.find(g => g.id === goalId);
  if (!goalCategory) return [];

  const filtered = goalCategory.signals
    .map(key => UNIFIED_DEFS[key])
    .filter(Boolean); // Filter out any undefineds if a key is missing in definitions

  // Create a map for quick lookup of current signal order
  const orderMap = new Map(signalOrder.value.map((key, idx) => [key, idx]));

  return [...filtered].sort((a, b) => {
    // Primary: Free first (per user requirement)
    if (a.isPremium && !b.isPremium) return 1;
    if (!a.isPremium && b.isPremium) return -1;

    // Secondary: User custom order from signalOrder
    const aIdx = orderMap.get(a.key as Signal) ?? 999;
    const bIdx = orderMap.get(b.key as Signal) ?? 999;
    return aIdx - bIdx;
  });
};
const sortableInstances = ref<Sortable[]>([]);

const initSortables = () => {
  // Clean up existing instances
  sortableInstances.value.forEach(s => s.destroy());
  sortableInstances.value = [];

  const lists = document.querySelectorAll('.signals-list');
  lists.forEach(listEl => {
    const s = new Sortable(listEl as HTMLElement, {
      animation: 150,
      handle: '.signal-toggle-item__drag',
      ghostClass: 'sortable-ghost',
      onEnd: (evt) => {
        if (evt.oldIndex === evt.newIndex) return;

        // When sorting within a group, we update the global signalOrder
        const newLocalOrder = Array.from(listEl.querySelectorAll('.signal-toggle-item'))
          .map(el => (el as HTMLElement).dataset.id as Signal);

        const currentOrder = [...userStore.signalOrder];

        // Simple heuristic: Move the signal in global order to its new relative position
        // This handles shared signals across groups by letting the last sort win.
        const movedId = evt.item.dataset.id as Signal;
        const otherIdsInNewLocal = newLocalOrder.filter(id => id !== movedId);

        // Find where to insert movedId in the global order relative to its siblings in the current group
        const firstSiblingIdx = currentOrder.findIndex(id => otherIdsInNewLocal.includes(id as Signal));
        const lastSiblingIdx = [...currentOrder].reverse().findIndex(id => otherIdsInNewLocal.includes(id as Signal));
        const actualLastIdx = currentOrder.length - 1 - lastSiblingIdx;

        // Remove from old pos
        const oldGlobalIdx = currentOrder.indexOf(movedId);
        if (oldGlobalIdx > -1) currentOrder.splice(oldGlobalIdx, 1);

        // Insert at new pos
        const newRelIdx = evt.newIndex ?? 0;
        // Find the index of the element that is now at newRelIdx in local list
        const neighborId = newLocalOrder[newRelIdx === 0 ? 1 : newRelIdx - 1];
        const neighborGlobalIdx = currentOrder.indexOf(neighborId);

        const insertIdx = newRelIdx === 0 ? neighborGlobalIdx : neighborGlobalIdx + 1;
        currentOrder.splice(Math.max(0, insertIdx), 0, movedId);

        userStore.updateSignalOrder(currentOrder);
      }
    });
    sortableInstances.value.push(s);
  });
};

watch(view, (newView) => {
  if (newView === 'display') {
    nextTick(() => {
      initSortables();
    });
  }
});

const close = () => {
  emit('update:modelValue', false);
  setTimeout(() => {
    view.value = 'categories';
  }, 300);
};

const updateSubject = (key: keyof Subject, event: Event) => {
  const target = event.target as HTMLInputElement | HTMLSelectElement | null;
  if (!target) return;
  let value: string | number = target.value;
  if (key !== 'sex') value = Number(value);
  userStore.updateSubject({ [key]: value });
};

const toggleCondition = (key: ConditionKey, event: Event) => {
  const target = event.target as HTMLInputElement | null;
  userStore.toggleCondition(key, Boolean(target?.checked));
};

const updateConditionParam = (conditionKey: ConditionKey, paramKey: string, event: Event) => {
  const target = event.target as HTMLInputElement | null;
  if (target) userStore.updateParam(conditionKey, paramKey, Number(target.value));
};

const updateNutritionTargets = (patch: any) => {
  userStore.updateNutritionTargets(patch);
};

// Macro fields configuration
const macroFields = [
  { key: 'protein' as const, label: 'Protein', color: 'var(--color-text-primary)' },
  { key: 'carbs' as const, label: 'Carbs', color: 'var(--color-text-primary)' },
  { key: 'fat' as const, label: 'Fat', color: 'var(--color-text-primary)' },
];

const goalCategories = GOAL_CATEGORIES;

const updateMacro = (key: 'protein' | 'carbs' | 'fat', field: 'min' | 'max', value: number) => {
  const current = nutritionTargets.value.macros[key];
  const next = { ...current, [field]: Math.max(0, value) };
  userStore.updateNutritionTargets({ macros: { ...nutritionTargets.value.macros, [key]: next } });
};
</script>

<style scoped>
.profile-modal-content {
  max-width: 800px;
}

.profile-modal-content--expanded {
  max-width: 600px;
}

.profile-modal-body {
  padding-top: 0;
}

.view-categories, .view-items {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 100%;
  animation: fadeIn 0.3s ease-out;
  overflow-x: visible;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1.5rem;
  justify-content: center;
}

.launcher-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border-subtle);
  border-radius: 24px;
  aspect-ratio: 1;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
  color: var(--color-text-primary);
}

.launcher-card:hover {
  background: var(--color-bg-elevated);
  transform: translateY(-4px) scale(1.02);
  border-color: var(--color-border-default);
}

.launcher-card.is-selected {
  background: var(--color-bg-elevated);
  border-color: var(--color-accent);
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
}

.checkmark {
  position: absolute;
  bottom: 0.75rem;
  right: 0.75rem;
  width: 24px;
  height: 24px;
  background: var(--color-success);
  color: var(--neutral-900);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.9rem;
  animation: pop 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes pop {
  from { transform: scale(0); }
  to { transform: scale(1); }
}

.card-icon {
  font-size: 3.5rem;
}

.card-label {
  font-size: 1.1rem;
  font-weight: 600;
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
}

/* Settings Styles */
.settings-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.setting-group--switch {
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

.setting-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.setting-header label {
  font-weight: 600;
  opacity: 0.9;
}

.setting-value {
  color: var(--color-active);
  font-weight: 700;
  font-family: monospace;
  font-size: 1.1rem;
}

.select-wrapper select {
  width: 100%;
  padding: 0.75rem;
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border-subtle);
  border-radius: 12px;
  color: var(--color-text-primary);
  font-size: 1rem;
}

input[type="range"] {
  width: 100%;
  accent-color: var(--color-active);
}

/* Macro Grid */
.macro-grid {
  display: grid;
  gap: 1rem;
  transition: opacity 0.2s;
}

.macro-grid.disabled {
  opacity: 0.4;
  pointer-events: none;
}

.macro-card {
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border-subtle);
  border-radius: 16px;
  padding: 1rem;
}

.macro-card__label {
  font-weight: 700;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.macro-card__inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.macro-input {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.8rem;
  opacity: 0.8;
}

.macro-input input {
  background: var(--color-bg-base);
  border: 1px solid var(--color-border-subtle);
  border-radius: 8px;
  padding: 0.5rem;
  color: var(--color-text-primary);
  width: 100%;
}

/* Conditions List */
.items-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.profile-item {
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border-subtle);
  border-radius: 16px;
  padding: 1.25rem;
}

.profile-item__main {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.profile-item__info {
  flex: 1;
}

.profile-item__title {
  font-weight: 700;
  font-size: 1.1rem;
  margin-bottom: 0.25rem;
}

.profile-item__desc {
  font-size: 0.9rem;
  opacity: 0.6;
  line-height: 1.4;
}

.profile-item__params {
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--color-border-subtle);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* Charts View Styles */
.goal-group {
  margin-bottom: 2rem;
}

.group-label {
  font-size: 0.9rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-text-muted);
  margin-bottom: 1rem;
}

.signals-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.signal-toggle-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border-subtle);
  border-radius: 12px;
  gap: 0.75rem;
}

.signal-toggle-item__drag {
  cursor: grab;
  color: var(--color-text-muted);
  font-size: 1.2rem;
  padding: 0.25rem;
  user-select: none;
  transition: color 0.2s;
}

.signal-toggle-item:hover .signal-toggle-item__drag {
  color: var(--color-text-secondary);
}

.signal-toggle-item__drag:active {
  cursor: grabbing;
}

.signal-toggle-item__info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.sortable-ghost {
  opacity: 0.3;
  background: var(--color-bg-subtle);
  border-color: var(--color-active);
}

.signal-toggle-item__label {
  font-weight: 600;
  font-size: 0.95rem;
}

.signal-toggle-item__group {
  font-size: 0.75rem;
  opacity: 0.5;
}

.premium-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  background: linear-gradient(120deg, var(--amber-400), var(--amber-600));
  color: var(--neutral-900);
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-shadow: none;
  margin-left: 0.4rem;
  vertical-align: middle;
}

.premium-tag__icon {
  font-size: 0.65rem;
}

/* Subscription View Styles */
.subscription-card {
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border-subtle);
  border-radius: 24px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  align-items: center;
  text-align: center;
}

.subscription-card__header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.subscription-card__title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.subscription-card__desc {
  font-size: 0.95rem;
  opacity: 0.6;
  max-width: 300px;
}

.tier-toggle {
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: var(--color-bg-base);
  border-radius: 12px;
  padding: 0.25rem;
  width: 100%;
  max-width: 300px;
  border: 1px solid var(--color-border-subtle);
}

.tier-toggle__btn {
  padding: 0.75rem;
  border: none;
  background: transparent;
  color: var(--color-text-primary);
  font-weight: 600;
  border-radius: 9px;
  cursor: pointer;
  transition: all 0.2s;
}

.tier-toggle__btn.is-active {
  background: var(--color-bg-elevated);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.tier-toggle__btn--premium.is-active {
  background: linear-gradient(120deg, var(--amber-400), var(--amber-600));
  color: var(--neutral-900);
}

.benefit-list {
  list-style: none;
  padding: 0;
  margin: 0;
  text-align: left;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.benefit-list li {
  display: flex;
  gap: 0.75rem;
  font-size: 0.9rem;
  opacity: 0.9;
}

.benefit-list li.is-locked {
  opacity: 0.4;
}

/* Common Components */
.switch {
  position: relative;
  display: inline-block;
  height: 24px;
  width: 44px;
  flex-shrink: 0;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background-color: var(--color-bg-elevated);
  transition: 0.2s;
  border-radius: 34px;
}

.slider:before {
  position: absolute;
  content: '';
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.2s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: var(--color-success);
}

input:checked + .slider:before {
  transform: translateX(20px);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
