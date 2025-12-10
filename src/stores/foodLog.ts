import { defineStore } from 'pinia';
import { v4 as uuid } from 'uuid';
import type {
  DayLog,
  FoodEntry,
  FoodSearchHit,
  LogTargets,
  MealLog,
  MealSlot,
  TrackedNutrients,
  UUID,
} from '@/types';

const MEAL_SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snacks'];
const STORAGE_KEY = 'physim:foodLog';

const zeroNutrients = (): TrackedNutrients => ({
  calories: 0,
  protein: 0,
  fat: 0,
  carbs: 0,
  fiber: 0,
  sugar: 0,
  sodium: 0,
});

const defaultTargets = (): LogTargets => ({
  calories: 2000,
  macrosEnabled: false,
  macros: {
    carbs: { min: 200, max: 300 },
    fat: { min: 50, max: 90 },
    protein: { min: 100, max: 150 },
  },
});

const createEmptyMeals = (): MealLog => ({
  breakfast: [],
  lunch: [],
  dinner: [],
  snacks: [],
});

const normalizeMeals = (meals?: Partial<MealLog>): MealLog => {
  const base = createEmptyMeals();
  const source = meals ?? {};
  MEAL_SLOTS.forEach((slot) => {
    const list = source[slot];
    base[slot] = Array.isArray(list) ? list : [];
  });
  return base;
};

const todayISO = () => new Date().toISOString().slice(0, 10);

const accumulate = (entries: FoodEntry[]): TrackedNutrients => {
  return entries.reduce((acc, entry) => {
    acc.calories += entry.nutrients.calories * entry.quantity;
    acc.protein += entry.nutrients.protein * entry.quantity;
    acc.fat += entry.nutrients.fat * entry.quantity;
    acc.carbs += entry.nutrients.carbs * entry.quantity;
    acc.fiber = (acc.fiber || 0) + (entry.nutrients.fiber || 0) * entry.quantity;
    acc.sugar = (acc.sugar || 0) + (entry.nutrients.sugar || 0) * entry.quantity;
    acc.sodium = (acc.sodium || 0) + (entry.nutrients.sodium || 0) * entry.quantity;
    return acc;
  }, zeroNutrients());
};

const loadPersisted = () => {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as {
      selectedDate?: string;
      logs?: Record<string, DayLog>;
      targets?: LogTargets;
      recent?: FoodSearchHit[];
    };
    const logs: Record<string, DayLog> = {};
    if (parsed.logs) {
      for (const [date, day] of Object.entries(parsed.logs)) {
        logs[date] = {
          date: day.date || date,
          meals: normalizeMeals(day.meals),
        };
      }
    }
    return {
      selectedDate: parsed.selectedDate,
      logs,
      targets: parsed.targets,
      recent: parsed.recent ?? [],
    };
  } catch (err) {
    console.warn('Failed to load food log from storage', err);
    return null;
  }
};

const persisted = loadPersisted();

export const useFoodLogStore = defineStore('foodLog', {
  state: () => ({
    selectedDate: persisted?.selectedDate ?? todayISO(),
    logs: persisted?.logs ?? ({} as Record<string, DayLog>),
    targets: persisted?.targets
      ? { ...defaultTargets(), ...persisted.targets, macros: { ...defaultTargets().macros, ...persisted.targets.macros } }
      : defaultTargets(),
    recent: persisted?.recent ?? ([] as FoodSearchHit[]),
  }),
  getters: {
    current(state): DayLog {
      return state.logs[state.selectedDate] ?? { date: state.selectedDate, meals: createEmptyMeals() };
    },
    dayTotals: (state) => (date: string): TrackedNutrients => {
      const day = state.logs[date];
      if (!day) return zeroNutrients();
      return MEAL_SLOTS.reduce((acc, slot) => {
        const totals = accumulate(day.meals[slot]);
        acc.calories += totals.calories;
        acc.protein += totals.protein;
        acc.fat += totals.fat;
        acc.carbs += totals.carbs;
        acc.fiber = (acc.fiber || 0) + (totals.fiber || 0);
        acc.sugar = (acc.sugar || 0) + (totals.sugar || 0);
        acc.sodium = (acc.sodium || 0) + (totals.sodium || 0);
        return acc;
      }, zeroNutrients());
    },
    mealTotals: (state) => (date: string, meal: MealSlot): TrackedNutrients => {
      const day = state.logs[date];
      if (!day) return zeroNutrients();
      return accumulate(day.meals[meal]);
    },
  },
  actions: {
    persist() {
      if (typeof localStorage === 'undefined') return;
      const payload = {
        selectedDate: this.selectedDate,
        logs: this.logs,
        targets: this.targets,
        recent: this.recent,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    },
    upsertRecent(hit: FoodSearchHit) {
      const existing = this.recent.filter((item) => item.id !== hit.id);
      this.recent = [hit, ...existing].slice(0, 15);
    },
    ensureDay(date: string) {
      if (!this.logs[date]) {
        this.logs[date] = { date, meals: createEmptyMeals() };
      } else {
        this.logs[date].date = this.logs[date].date || date;
        this.logs[date].meals = normalizeMeals(this.logs[date].meals);
      }
      return this.logs[date];
    },
    setDate(date: string) {
      this.selectedDate = date;
      this.ensureDay(date);
      this.persist();
    },
    addFood(date: string, meal: MealSlot, hit: FoodSearchHit, quantity = 1) {
      const day = this.ensureDay(date);
      const entry: FoodEntry = { ...hit, entryId: uuid() as UUID, quantity };
      day.meals[meal] = [...day.meals[meal], entry];
      this.upsertRecent(hit);
      this.persist();
    },
    removeFood(date: string, meal: MealSlot, entryId: UUID) {
      const day = this.ensureDay(date);
      day.meals[meal] = day.meals[meal].filter((item) => item.entryId !== entryId);
      this.persist();
    },
    updateQuantity(date: string, meal: MealSlot, entryId: UUID, quantity: number) {
      const day = this.ensureDay(date);
      day.meals[meal] = day.meals[meal].map((item) =>
        item.entryId === entryId ? { ...item, quantity } : item
      );
      this.persist();
    },
    setTargets(patch: Partial<LogTargets>) {
      this.targets = {
        ...this.targets,
        ...patch,
        macros: { ...this.targets.macros, ...(patch.macros || {}) },
      };
      this.persist();
    },
  },
});

export { MEAL_SLOTS };
