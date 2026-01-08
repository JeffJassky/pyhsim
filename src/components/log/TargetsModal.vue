<template>
  <teleport to="body">
    <div v-if="modelValue" class="modal">
      <div class="modal__backdrop" @click="close"></div>
      <section class="modal__panel">
        <header class="modal__header">
          <div>
            <p class="modal__eyebrow">Log settings</p>
            <h3>Targets</h3>
          </div>
          <button class="ghost" type="button" @click="close">✕</button>
        </header>

        <div class="modal__body">
          <label class="field">
            <span>Daily calories</span>
            <input type="number" min="0" step="10" v-model.number="calories" />
          </label>

          <label class="field field--switch">
            <input type="checkbox" v-model="macrosEnabled" />
            <span>Enable macro ranges</span>
          </label>

          <div class="targets__macros" :class="{ disabled: !macrosEnabled }">
            <div v-for="macro in macroFields" :key="macro.key" class="targets__macro">
              <p class="targets__label" :style="{ color: macro.color }">{{ macro.label }}</p>
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
      </section>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useProfilesStore } from '@/stores/profiles';

defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [boolean] }>();

const profiles = useProfilesStore();

const calories = computed({
  get: () => profiles.nutritionTargets.calories,
  set: (val: number) => profiles.updateNutritionTargets({ calories: Math.max(0, val) }),
});

const macrosEnabled = computed({
  get: () => profiles.nutritionTargets.macrosEnabled,
  set: (val: boolean) => profiles.updateNutritionTargets({ macrosEnabled: val }),
});

const macroValues = computed(() => profiles.nutritionTargets.macros);

const macroFields = [
  { key: 'protein', label: 'Protein', color: '#22c55e' },
  { key: 'carbs', label: 'Carbs', color: '#38bdf8' },
  { key: 'fat', label: 'Fat', color: '#fbbf24' },
] as const;

const updateMacro = (key: 'protein' | 'carbs' | 'fat', field: 'min' | 'max', value: number) => {
  const next = { ...profiles.nutritionTargets.macros[key], [field]: Math.max(0, value) };
  profiles.updateNutritionTargets({ macros: { ...profiles.nutritionTargets.macros, [key]: next } });
};

const close = () => emit('update:modelValue', false);
</script>

<style scoped>
.modal {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  z-index: 90;
}

.modal__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
}

.modal__panel {
  position: relative;
  width: min(520px, 92vw);
  max-height: 90vh;
  background: #0f1426;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1rem 1.2rem;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45);
}

.modal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.modal__eyebrow {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.75rem;
  opacity: 0.7;
}

.modal__body {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
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
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
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

button.ghost {
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
}
</style>
