<template>
  <AppShell>
    <template #sidebar>
      <Panel title="Targets" icon="🎯">
        <div class="targets">
          <label class="field">
            <span>Daily calories</span>
            <input
              type="number"
              min="0"
              step="10"
              v-model.number="calorieGoal"
            />
          </label>
          <label class="field field--switch">
            <input type="checkbox" v-model="macrosEnabled" />
            <span>Enable macro ranges</span>
          </label>
          <div class="targets__macros" :class="{ disabled: !macrosEnabled }">
            <div
              v-for="macro in macroFields"
              :key="macro.key"
              class="targets__macro"
            >
              <p class="targets__label" :style="{ color: macro.color }">
                {{ macro.label }}
              </p>
              <div class="targets__inputs">
                <label>
                  Min
                  <input
                    type="number"
                    min="0"
                    step="1"
                    :value="macroValues[macro.key].min"
                    @input="(e) => updateMacro(macro.key, 'min', Number((e.target as HTMLInputElement).value))"
                    :disabled="!macrosEnabled"
                  />
                </label>
                <label>
                  Max
                  <input
                    type="number"
                    min="0"
                    step="1"
                    :value="macroValues[macro.key].max"
                    @input="(e) => updateMacro(macro.key, 'max', Number((e.target as HTMLInputElement).value))"
                    :disabled="!macrosEnabled"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      </Panel>
    </template>

    <div class="log">
      <DateCarousel v-model="selectedDate" />
      <div class="log__actions">
        <button
          class="log__settings-btn"
          type="button"
          @click="targetsModalOpen = true"
        >
          Targets
        </button>
      </div>

      <NutritionCarousel
        class="log__hero"
        :calories-goal="calorieGoal"
        :calories-total="dayTotals.calories"
        :macros="macroTotals"
        :macro-targets="foodLog.targets.macros"
        :macros-enabled="macrosEnabled"
      />

      <section class="log__meals">
        <MealSection
          v-for="slot in mealSlots"
          :key="slot"
          :meal="slot"
          :title="mealLabel(slot)"
          :entries="meals[slot]"
          :totals="foodLog.mealTotals(selectedDate, slot)"
          @add="openDrawer(slot)"
          @remove="(id) => removeFood(slot, id)"
          @quantity="(qty, id) => updateQuantity(slot, id, qty)"
        />
      </section>

      <button class="log__fab" type="button" @click="openDrawer('lunch')">
        Add Food
      </button>
      <TargetsModal v-model="targetsModalOpen" />
      <FoodSearchDrawer
        v-model="drawerOpen"
        :meal="drawerMeal"
        :recents="foodLog.recent"
        @select="handleSelect"
      />
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import AppShell from '@/components/layout/AppShell.vue';
import Panel from '@/components/core/Panel.vue';
import DateCarousel from '@/components/log/DateCarousel.vue';
import NutritionCarousel from '@/components/log/NutritionCarousel.vue';
import MealSection from '@/components/log/MealSection.vue';
import FoodSearchDrawer from '@/components/log/FoodSearchDrawer.vue';
import TargetsModal from '@/components/log/TargetsModal.vue';
import { MEAL_SLOTS, useFoodLogStore } from '@/stores/foodLog';
import type { FoodSearchHit, MealSlot, UUID } from '@/types';

const foodLog = useFoodLogStore();
foodLog.ensureDay(foodLog.selectedDate);

const selectedDate = computed({
  get: () => foodLog.selectedDate,
  set: (val: string) => foodLog.setDate(val),
});

const meals = computed(() => foodLog.ensureDay(selectedDate.value).meals);
const dayTotals = computed(() => foodLog.dayTotals(selectedDate.value));

const macroTotals = computed(() => ({
  protein: dayTotals.value.protein,
  fat: dayTotals.value.fat,
  carbs: dayTotals.value.carbs,
}));

const calorieGoal = computed({
  get: () => foodLog.targets.calories,
  set: (val: number) => foodLog.setTargets({ calories: Math.max(0, val) }),
});

const macrosEnabled = computed({
  get: () => foodLog.targets.macrosEnabled,
  set: (val: boolean) => foodLog.setTargets({ macrosEnabled: val }),
});

const macroValues = computed(() => foodLog.targets.macros);

const macroFields = [
  { key: 'protein', label: 'Protein', color: '#22c55e' },
  { key: 'carbs', label: 'Carbs', color: '#38bdf8' },
  { key: 'fat', label: 'Fat', color: '#fbbf24' },
] as const;

const updateMacro = (key: 'protein' | 'carbs' | 'fat', field: 'min' | 'max', value: number) => {
  const next = { ...foodLog.targets.macros[key], [field]: Math.max(0, value) };
  foodLog.setTargets({ macros: { ...foodLog.targets.macros, [key]: next } });
};

const mealSlots = MEAL_SLOTS;
const mealLabel = (slot: MealSlot) => slot.charAt(0).toUpperCase() + slot.slice(1);

const drawerOpen = ref(false);
const drawerMeal = ref<MealSlot>('breakfast');
const targetsModalOpen = ref(false);

const openDrawer = (meal: MealSlot) => {
  drawerMeal.value = meal;
  drawerOpen.value = true;
};

const handleSelect = (food: FoodSearchHit, quantity: number) => {
  foodLog.addFood(selectedDate.value, drawerMeal.value, food, quantity);
};

const removeFood = (meal: MealSlot, id: UUID) => {
  foodLog.removeFood(selectedDate.value, meal, id);
};

const updateQuantity = (meal: MealSlot, id: UUID, qty: number) => {
  foodLog.updateQuantity(selectedDate.value, meal, id, Math.max(0, qty));
};
</script>

<style scoped>
.log {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 0;
}

.log__hero {
  width: 100%;
}

.log__actions {
  display: flex;
  justify-content: flex-end;
}

.log__settings-btn {
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.08);
  color: inherit;
  border-radius: 999px;
  padding: 0.45rem 0.9rem;
  cursor: pointer;
  font-weight: 600;
}

.log__meals {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 0.75rem;
}

.log__fab {
  position: fixed;
  right: 1.5rem;
  left: 1.5rem;
  bottom: 1.5rem;
  padding: 0.75rem 1.25rem;
  border-radius: 999px;
  background: linear-gradient(120deg, #3b82f6, #22d3ee);
  color: black;
  border: none;
  cursor: pointer;
  font-weight: 700;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
}

.targets {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.field input[type='number'] {
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  color: inherit;
  border-radius: 8px;
  padding: 0.45rem 0.55rem;
}

.field--switch {
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
}

.targets__macros {
  display: grid;
  gap: 0.5rem;
}

.targets__macros.disabled {
  opacity: 0.6;
}

.targets__macro {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 0.5rem;
}

.targets__label {
  margin: 0 0 0.25rem;
  font-weight: 700;
}

.targets__inputs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.35rem;
}

.targets__inputs input[type='number'] {
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  color: inherit;
  border-radius: 8px;
  padding: 0.35rem 0.45rem;
}

@media (max-width: 900px) {
  .log__hero {
    grid-template-columns: 1fr;
  }
}
</style>
