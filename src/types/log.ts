import type { UUID, TrackedNutrients } from './neurostate';

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

export interface FoodSearchHit {
  id: string;
  name: string;
  brand?: string;
  serving: string;
  nutrients: TrackedNutrients;
  image?: string;
}

export interface FoodEntry extends FoodSearchHit {
  entryId: UUID;
  quantity: number;
}

export type MealLog = Record<MealSlot, FoodEntry[]>;

export interface DayLog {
  date: string; // YYYY-MM-DD
  meals: MealLog;
}
