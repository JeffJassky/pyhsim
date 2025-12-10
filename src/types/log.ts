import type { UUID } from './neurostate';

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

export interface MacroRange {
  min: number;
  max: number;
}

export interface MacroTargets {
  carbs: MacroRange;
  fat: MacroRange;
  protein: MacroRange;
}

export interface LogTargets {
  calories: number;
  macrosEnabled: boolean;
  macros: MacroTargets;
}

export interface TrackedNutrients {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

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
