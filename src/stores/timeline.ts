import { defineStore } from 'pinia';
import { v4 as uuid } from 'uuid';
import type { InterventionKey, Minute, TimelineItem, TimelineItemMeta, UUID, TrackedNutrients } from '@/types';
import { toMinuteISO } from '@/utils/time';
import { createFoodTimelineItem } from '@/utils/food';

interface TimelineStoreState {
  items: TimelineItem[];
  selectedIds: UUID[];
  isDragging?: boolean;
  selectedDate: string; // YYYY-MM-DD
}

const DEFAULT_SLEEP_START_MINUTE: Minute = (23 * 60) as Minute;
const DEFAULT_SLEEP_DURATION_MIN = 8 * 60;

const createRoutineItem = (key: InterventionKey, startMin: number, durationMin: number): TimelineItem => {
  const start = toMinuteISO(startMin as Minute);
  const end = toMinuteISO((startMin + durationMin) as Minute);
  return {
    id: uuid() as UUID,
    start,
    end,
    type: 'range',
    meta: {
      key,
      params: {},
      intensity: 1,
    },
  };
};

const createDefaultRoutineItems = (): TimelineItem[] => [
  createRoutineItem('sleep', DEFAULT_SLEEP_START_MINUTE, DEFAULT_SLEEP_DURATION_MIN),
];

const todayISO = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const useTimelineStore = defineStore('timeline', {
  state: (): TimelineStoreState => ({
    items: createDefaultRoutineItems(),
    selectedIds: [],
    isDragging: false,
    selectedDate: todayISO(),
  }),
  getters: {
    selectedId: (state): UUID | undefined => state.selectedIds.length === 1 ? state.selectedIds[0] : undefined,
    foodItems: (state): TimelineItem[] => state.items.filter((it) => it.meta.key === 'food'),
    itemsForSelectedDate: (state): TimelineItem[] => {
      return state.items.filter((it) => it.start.startsWith(state.selectedDate));
    },
    foodItemsForDate: (state) => (dateISO: string): TimelineItem[] => {
      return state.items.filter((it) => {
        if (it.meta.key !== 'food') return false;
        return it.start.startsWith(dateISO);
      });
    },
    currentFoodTotals(state): TrackedNutrients {
      const foods = state.items.filter((it) => it.meta.key === 'food' && !it.meta.disabled && it.start.startsWith(state.selectedDate));
      const totals: TrackedNutrients = { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0, sugar: 0, sodium: 0 };

      for (const item of foods) {
        const p = item.meta.params;
        const carbSugar = Number(p.carbSugar) || 0;
        const carbStarch = Number(p.carbStarch) || 0;
        const protein = Number(p.protein) || 0;
        const fat = Number(p.fat) || 0;
        const fiberSol = Number(p.fiberSol) || 0;
        const fiberInsol = Number(p.fiberInsol) || 0;

        totals.sugar = (totals.sugar || 0) + carbSugar;
        totals.carbs += carbSugar + carbStarch + fiberSol + fiberInsol;
        totals.protein += protein;
        totals.fat += fat;
        totals.fiber = (totals.fiber || 0) + fiberSol + fiberInsol;
        totals.calories += (carbSugar + carbStarch) * 4 + protein * 4 + fat * 9;
      }

      return totals;
    },
    foodTotalsForDate: (state) => (dateISO: string): TrackedNutrients => {
      const foods = state.items.filter((it) => it.meta.key === 'food' && !it.meta.disabled && it.start.startsWith(dateISO));
      const totals: TrackedNutrients = { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0, sugar: 0, sodium: 0 };

      for (const item of foods) {
        const p = item.meta.params;
        // Reconstruct nutrients from intervention params
        const carbSugar = Number(p.carbSugar) || 0;
        const carbStarch = Number(p.carbStarch) || 0;
        const protein = Number(p.protein) || 0;
        const fat = Number(p.fat) || 0;
        const fiberSol = Number(p.fiberSol) || 0;
        const fiberInsol = Number(p.fiberInsol) || 0;

        totals.sugar = (totals.sugar || 0) + carbSugar;
        totals.carbs += carbSugar + carbStarch + fiberSol + fiberInsol;
        totals.protein += protein;
        totals.fat += fat;
        totals.fiber = (totals.fiber || 0) + fiberSol + fiberInsol;
        // Estimate calories: 4 cal/g carbs, 4 cal/g protein, 9 cal/g fat
        totals.calories += (carbSugar + carbStarch) * 4 + protein * 4 + fat * 9;
      }

      return totals;
    },
  },
  actions: {
    ensureRoutineAnchors() {
      const hasSleep = this.items.some((it) => it.meta.key === 'sleep');
      if (!hasSleep) {
        this.items.push(createRoutineItem('sleep', DEFAULT_SLEEP_START_MINUTE, DEFAULT_SLEEP_DURATION_MIN));
      }
    },
    addItem(start: string, end: string, meta: TimelineItemMeta) {
      const item: TimelineItem = {
        id: uuid() as UUID,
        start,
        end,
        type: 'range',
        meta,
      };
      this.items.push(item);
      this.selectedIds = [item.id];
    },
    updateItem(id: UUID, patch: Partial<TimelineItem>) {
      const idx = this.items.findIndex((it) => it.id === id);
      if (idx === -1) return;
      this.items[idx] = { ...this.items[idx], ...patch };
    },
    removeItem(id: UUID) {
      this.items = this.items.filter((it) => it.id !== id);
      this.selectedIds = this.selectedIds.filter(sid => sid !== id);
      this.ensureRoutineAnchors();
    },
    duplicate(id: UUID) {
      const item = this.items.find((it) => it.id === id);
      if (!item) return;
      const copy = { ...item, id: uuid() as UUID };
      this.items.push(copy);
      this.selectedIds = [copy.id];
    },
    select(ids?: UUID | UUID[]) {
      if (!ids) {
        this.selectedIds = [];
      } else if (Array.isArray(ids)) {
        this.selectedIds = ids;
      } else {
        this.selectedIds = [ids];
      }
    },
    setDragging(isDragging: boolean) {
      this.isDragging = isDragging;
    },
    setItems(items: TimelineItem[]) {
      this.items = items;
      this.ensureRoutineAnchors();
    },
    addFood(startISO: string, nutrients: TrackedNutrients, quantity: number = 1, label?: string) {
      const item = createFoodTimelineItem(startISO, nutrients, quantity, label);
      this.items.push(item);
      this.selectedIds = [item.id];
      return item;
    },
    setDate(dateISO: string) {
      this.selectedDate = dateISO;
    },
  },
});
