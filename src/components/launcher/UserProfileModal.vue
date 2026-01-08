<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="modelValue" class="launcher-overlay" @click.self="close">
        <div class="launcher-content" :class="{ 'launcher-content--expanded': view !== 'categories' }">
          <button class="close-btn" @click="close">✕</button>

          <header class="launcher-header">
            <h2 v-if="view === 'categories'" class="section-title">My Bio-Profile</h2>
            <button v-else class="back-btn" @click="view = 'categories'">
              ← {{ selectedViewLabel }}
            </button>
          </header>

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
                  @click="profilesStore.toggleGoal(cat.id)"
                >
                  <span class="card-icon">{{ cat.icon }}</span>
                  <span class="card-label">{{ cat.label }}</span>
                  <div v-if="selectedGoals.includes(cat.id)" class="checkmark">✓</div>
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
                  <select :value="subject.sex" @change="updateSubject('sex', $event)">
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
                <input type="range" min="18" max="90" :value="subject.age" @input="updateSubject('age', $event)" />
              </div>

              <div class="setting-group">
                <div class="setting-header">
                  <label>Weight</label>
                  <span class="setting-value">{{ subject.weight }} kg</span>
                </div>
                <input type="range" min="40" max="150" :value="subject.weight" @input="updateSubject('weight', $event)" />
              </div>

              <template v-if="subject.sex === 'female'">
                <div class="setting-group">
                  <div class="setting-header">
                    <label>Cycle Length</label>
                    <span class="setting-value">{{ subject.cycleLength }} days</span>
                  </div>
                  <input type="range" min="21" max="35" :value="subject.cycleLength" @input="updateSubject('cycleLength', $event)" />
                </div>
                <div class="setting-group">
                  <div class="setting-header">
                    <label>Current Day</label>
                    <span class="setting-value">Day {{ subject.cycleDay }}</span>
                  </div>
                  <input type="range" min="0" :max="subject.cycleLength" :value="subject.cycleDay" @input="updateSubject('cycleDay', $event)" />
                </div>
              </template>
            </div>
          </div>

          <!-- Conditions View -->
          <div v-else-if="view === 'conditions'" class="view-items">
            <div class="items-grid">
              <div v-for="profile in profileDefs" :key="profile.key" class="profile-item">
                <div class="profile-item__main">
                  <div class="profile-item__info">
                    <div class="profile-item__title">{{ profile.label }}</div>
                    <div class="profile-item__desc">{{ profile.description.physiology }}</div>
                  </div>
                  <label class="switch">
                    <input type="checkbox" :checked="profileState[profile.key].enabled" @change="toggleProfile(profile.key, $event)" />
                    <span class="slider" />
                  </label>
                </div>
                
                <div v-if="profileState[profile.key].enabled && profile.params.length" class="profile-item__params">
                  <div v-for="param in profile.params" :key="param.key" class="setting-group">
                    <div class="setting-header">
                      <label>{{ param.label }}</label>
                      <span class="setting-value">{{ profileState[profile.key].params[param.key].toFixed(2) }}</span>
                    </div>
                    <input type="range" :min="param.min" :max="param.max" :step="param.step" :value="profileState[profile.key].params[param.key]" @input="updateProfileParam(profile.key, param.key, $event)" />
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
                  <span class="setting-value">{{ nutritionTargets.calories }} kcal</span>
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

              <div class="macro-grid" :class="{ disabled: !nutritionTargets.macrosEnabled }">
                <div v-for="macro in macroFields" :key="macro.key" class="macro-card">
                  <div class="macro-card__label" :style="{ color: macro.color }">{{ macro.label }}</div>
                  <div class="macro-card__inputs">
                    <div class="macro-input">
                      <span>Min</span>
                      <input type="number" :value="nutritionTargets.macros[macro.key].min" @input="(e) => updateMacro(macro.key, 'min', Number((e.target as HTMLInputElement).value))" />
                    </div>
                    <div class="macro-input">
                      <span>Max</span>
                      <input type="number" :value="nutritionTargets.macros[macro.key].max" @input="(e) => updateMacro(macro.key, 'max', Number((e.target as HTMLInputElement).value))" />
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
import { ref, computed } from 'vue';
import { useProfilesStore } from '@/stores/profiles';
import { PROFILE_LIBRARY } from '@/models';
import type { ProfileKey } from '@/models/profiles';
import type { Subject } from '@/models/subject';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const profilesStore = useProfilesStore();
const view = ref<'categories' | 'physiology' | 'conditions' | 'nutrition' | 'goals'>('categories');

const subject = computed(() => profilesStore.subject);
const profileDefs = PROFILE_LIBRARY;
const profileState = computed(() => profilesStore.profiles);
const nutritionTargets = computed(() => profilesStore.nutritionTargets);
const selectedGoals = computed(() => profilesStore.selectedGoals);

const selectedViewLabel = computed(() => {
  if (view.value === 'physiology') return 'Physiology';
  if (view.value === 'conditions') return 'My Conditions';
  if (view.value === 'nutrition') return 'Nutrient Targets';
  if (view.value === 'goals') return 'My Goals';
  return '';
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
  profilesStore.updateSubject({ [key]: value });
};

const toggleProfile = (key: ProfileKey, event: Event) => {
  const target = event.target as HTMLInputElement | null;
  profilesStore.toggleProfile(key, Boolean(target?.checked));
};

const updateProfileParam = (profileKey: ProfileKey, paramKey: string, event: Event) => {
  const target = event.target as HTMLInputElement | null;
  if (target) profilesStore.updateParam(profileKey, paramKey, Number(target.value));
};

const updateNutritionTargets = (patch: any) => {
  profilesStore.updateNutritionTargets(patch);
};

const macroFields = [
  { key: 'protein' as const, label: 'Protein', color: '#22c55e' },
  { key: 'carbs' as const, label: 'Carbs', color: '#38bdf8' },
  { key: 'fat' as const, label: 'Fat', color: '#fbbf24' },
];

const goalCategories = [
  { id: 'energy', label: 'Energy', icon: '⚡' },
  { id: 'mood', label: 'Mood', icon: '🎭' },
  { id: 'focus', label: 'Focus', icon: '🧠' },
  { id: 'recovery', label: 'Recovery', icon: '💪' },
  { id: 'sleep', label: 'Sleep', icon: '😴' },
  { id: 'digestion', label: 'Digestion', icon: '🦠' },
  { id: 'pain', label: 'Pain', icon: '❤️‍🩹' },
  { id: 'hormones', label: 'Hormones', icon: '🧬' },
  { id: 'calm', label: 'Calm', icon: '😌' },
];

const updateMacro = (key: 'protein' | 'carbs' | 'fat', field: 'min' | 'max', value: number) => {
  const current = nutritionTargets.value.macros[key];
  const next = { ...current, [field]: Math.max(0, value) };
  profilesStore.updateNutritionTargets({ macros: { ...nutritionTargets.value.macros, [key]: next } });
};
</script>

<style scoped>
.launcher-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(10, 10, 15, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.launcher-content {
  width: 100%;
  max-width: 800px;
  background: rgba(30, 30, 35, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  position: relative;
  display: flex;
  flex-direction: column;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  max-height: 90vh;
  overflow: hidden;
}

.launcher-content--expanded {
  max-width: 600px;
}

.launcher-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 3rem 3rem 1rem 3rem;
  flex-shrink: 0;
}

.launcher-content--expanded .launcher-header {
  padding: 2.5rem 2.5rem 1rem 2.5rem;
}

.close-btn {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  z-index: 10;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.view-categories, .view-items {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 100%;
  animation: fadeIn 0.3s ease-out;
  overflow-y: auto;
  padding: 1rem 3rem 3rem 3rem;
  overflow-x: visible;
}

.launcher-content--expanded .view-categories,
.launcher-content--expanded .view-items {
  padding: 1rem 2.5rem 2.5rem 2.5rem;
}

.view-categories::-webkit-scrollbar,
.view-items::-webkit-scrollbar,
.settings-grid::-webkit-scrollbar,
.items-grid::-webkit-scrollbar {
  width: 6px;
}

.view-categories::-webkit-scrollbar-thumb,
.view-items::-webkit-scrollbar-thumb,
.settings-grid::-webkit-scrollbar-thumb,
.items-grid::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

.section-title {
  font-size: 2rem;
  font-weight: 700;
  color: white;
  margin: 0;
  text-align: left;
  letter-spacing: -0.02em;
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
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 24px;
  aspect-ratio: 1;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
  color: white;
}

.launcher-card:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-4px) scale(1.02);
  border-color: rgba(255, 255, 255, 0.2);
}

.launcher-card.is-selected {
  background: rgba(143, 191, 95, 0.15);
  border-color: rgba(143, 191, 95, 0.6);
  box-shadow: 0 0 20px rgba(143, 191, 95, 0.2);
}

.checkmark {
  position: absolute;
  bottom: 0.75rem;
  right: 0.75rem;
  width: 24px;
  height: 24px;
  background: #8fbf5f;
  color: black;
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
  color: #8fbf5f;
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
  color: #8fbf5f;
  font-weight: 700;
  font-family: monospace;
  font-size: 1.1rem;
}

.select-wrapper select {
  width: 100%;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: white;
  font-size: 1rem;
}

input[type="range"] {
  width: 100%;
  accent-color: #8fbf5f;
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
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
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
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 0.5rem;
  color: white;
  width: 100%;
}

/* Conditions List */
.items-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.profile-item {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
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
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
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
  background-color: rgba(255, 255, 255, 0.15);
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
  background-color: #8fbf5f;
}

input:checked + .slider:before {
  transform: translateX(20px);
}

/* Animations */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
