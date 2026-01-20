<template>
  <div class="nutri">
    <div class="nutri__body">
      <RadialStat
        label="Calories"
        unit="cal"
        size="lg"
        :total="caloriesTotal"
        :goal="caloriesGoal"
        color="#f97316"
        :show-target="false"
      />
      <div class="nutri__macro-column">
        <p v-if="!macrosEnabled" class="nutri__hint">
          Macro targets are off - enable them in settings.
        </p>
        <div class="nutri__macro-grid">
          <RadialStat
            label="Protein"
            unit="g"
            size="sm"
            :total="macros.protein"
            :goal="macroTargets.protein.max"
            :min="macroTargets.protein.min"
            color="#22c55e"
          />
          <RadialStat
            label="Carbs"
            unit="g"
            size="sm"
            :total="macros.carbs"
            :goal="macroTargets.carbs.max"
            :min="macroTargets.carbs.min"
            color="#38bdf8"
          />
          <RadialStat
            label="Fat"
            unit="g"
            size="sm"
            :total="macros.fat"
            :goal="macroTargets.fat.max"
            :min="macroTargets.fat.min"
            color="#fbbf24"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import RadialStat from './RadialStat.vue';
import type { MacroTargets } from '@/types';

defineProps<{
  caloriesGoal: number;
  caloriesTotal: number;
  macros: { protein: number; fat: number; carbs: number };
  macroTargets: MacroTargets;
  macrosEnabled: boolean;
}>();
</script>

<style scoped>
.nutri {
  position: relative;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.nutri__body {
  display: grid;
  grid-template-columns: minmax(220px, 260px) 1fr;
  gap: 1rem;
  align-items: start;
}

.nutri__macro-column {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.nutri__macro-grid {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.25rem;
  align-items: start;
  text-align: center;
}

.nutri__hint {
  margin: 0;
  opacity: 0.7;
}

@media (max-width: 900px) {
  .nutri__body {
    grid-template-columns: 1fr;
  }
}
</style>
