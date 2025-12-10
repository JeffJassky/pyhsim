<template>
  <section class="meal">
    <header class="meal__header">
      <h3>{{ title }}</h3>
      <span class="meal__calories">{{ Math.round(totals.calories) }} cal</span>
    </header>

    <div v-if="entries.length" class="meal__list">
      <article v-for="item in entries" :key="item.entryId" class="meal__item">
        <p class="meal__name">{{ item.name }}</p>
        <div class="meal__meta">
          <p class="meal__details">
            {{ item.serving }} -
            <label>
              <input
                type="number"
                min="0.25"
                step="0.25"
                :value="item.quantity"
                @change="(e) => emit('quantity', Number((e.target as HTMLInputElement).value) || 0, item.entryId)"
              />
            </label>
          </p>
        </div>
        <div class="meal__actions">
          <span class="meal__item-cal"
            >{{ round(item.nutrients.calories * item.quantity) }} cal</span
          >
          <button
            type="button"
            class="ghost"
            @click="emit('remove', item.entryId)"
          >
            ✕
          </button>
          <br />

          <p class="meal__macros">
            {{ round(item.nutrients.protein * item.quantity) }}p /
            {{ round(item.nutrients.carbs * item.quantity) }}c /
            {{ round(item.nutrients.fat * item.quantity) }}f
          </p>
        </div>
      </article>
    </div>
    <p v-else class="meal__empty">No foods yet.</p>

    <button type="button" class="meal__add" @click="emit('add')">
      Add Food
    </button>
  </section>
</template>

<script setup lang="ts">
import type { FoodEntry, TrackedNutrients } from '@/types';

withDefaults(
  defineProps<{
    meal: string;
    title: string;
    entries: FoodEntry[];
    totals: TrackedNutrients;
  }>(),
  { entries: () => [] }
);

const emit = defineEmits<{
  add: [];
  remove: [string];
  quantity: [number, string];
}>();

const round = (val: number) => Math.round(val);
</script>

<style scoped>
.meal {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.02);
}

.meal__header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.meal__calories {
  opacity: 0.7;
}

.meal__list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 0.5rem 0;
}

.meal__item {
  display: grid;
  grid-template-columns: auto auto;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.5rem 0.25rem;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.08);
}

.meal__item:last-child {
  border-bottom: none;
}

.meal__name {
  margin: 0;
  font-weight: 600;
  grid-column: 1 / span 2;
  overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.meal__details,
.meal__macros {
  margin: 0.1rem 0;
  opacity: 0.75;
}

.meal__actions {
  display: block;
  align-items: center;
  gap: 0.35rem;
  justify-content: flex-end;
  text-align: right;
}

.meal__item-cal {
  font-weight: 600;
}

.meal__add {
  width: 100%;
  margin-top: 0.5rem;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: transparent;
  color: inherit;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
}

.meal__empty {
  opacity: 0.65;
}

input[type='number'] {
  width: 64px;
  margin-left: 0.25rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.03);
  color: inherit;
  border-radius: 6px;
  padding: 0.15rem 0.3rem;
}

button.ghost {
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
}
</style>
